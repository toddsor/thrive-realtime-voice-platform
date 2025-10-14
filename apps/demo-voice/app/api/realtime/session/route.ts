import { NextRequest, NextResponse } from "next/server";
import { loadRuntimeConfig, loadAuthConfig } from "@thrive/realtime-config";
import { createLoggerFromEnv } from "@thrive/realtime-observability";
import { getSystemPrompt } from "@/lib/config/systemPrompts";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const clientSessionId = request.headers.get("x-client-session-id");
  const correlationId = crypto.randomUUID();
  const logger = createLoggerFromEnv(correlationId);

  // Set session IDs in logger
  logger.setSessionIds(clientSessionId || undefined);

  try {
    logger.info("Session creation requested", {
      clientSessionId,
      correlationId,
    });
    logger.logLatencyMark("sessionRequested", Date.now());

    // Load configurations
    const config = loadRuntimeConfig();
    const authConfig = loadAuthConfig();

    let user = null;
    const authHeader = request.headers.get("authorization");

    // Only enforce authentication if Supabase is configured
    if (authConfig.supabase) {
      const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          Authorization: authHeader || "",
          "Content-Type": "application/json",
        },
      });

      if (!validateResponse.ok) {
        logger.warn("Authentication validation failed", {
          clientSessionId,
          correlationId,
          status: validateResponse.status,
        });

        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const validationResult = await validateResponse.json();
      user = validationResult.user;

      logger.info("Authenticated user creating session", {
        clientSessionId,
        correlationId,
        userId: user?.id,
      });
    } else {
      logger.info("Creating session without authentication (Supabase not configured)", {
        clientSessionId,
        correlationId,
      });
    }

    // Create OpenAI session
    const openaiResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: config.model,
        voice: "alloy",
        instructions: getSystemPrompt(),
        tools: config.featureFlags.tools
          ? [
              {
                type: "function",
                name: "echo",
                description: "Echo back the input",
                parameters: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "The message to echo back",
                    },
                  },
                  required: ["message"],
                },
              },
              {
                type: "function",
                name: "retrieve_docs",
                description: "Retrieve relevant documents based on a query",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
                  },
                  required: ["query"],
                },
              },
            ]
          : undefined,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      logger.error("OpenAI session creation failed", {
        clientSessionId,
        correlationId,
        status: openaiResponse.status,
        error: errorText,
      });

      return NextResponse.json({ error: "Failed to create OpenAI session" }, { status: 500 });
    }

    const sessionData = await openaiResponse.json();
    const openaiSessionId = sessionData.id;
    const clientSecret = sessionData.client_secret;

    logger.info("OpenAI session created successfully", {
      clientSessionId,
      correlationId,
      openaiSessionId,
    });

    // Create agent configuration
    const agentConfig = {
      model: config.model,
      voice: "alloy",
      instructions: getSystemPrompt(),
      tools: config.featureFlags.tools
        ? [
            {
              type: "function",
              function: {
                name: "echo",
                description: "Echo back the input",
                parameters: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "The message to echo back",
                    },
                  },
                  required: ["message"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "retrieve_docs",
                description: "Retrieve relevant documents based on a query",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          ]
        : undefined,
      tool_choice: "auto",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      tools_choice: "auto",
      temperature: 0.8,
      max_response_output_tokens: 4096,
      enable_redaction: true,
      moderations: {
        type: "input",
        input_audio: {
          type: "input_audio",
        },
      },
    };

    // Create timings object
    const timings = {
      sessionRequested: Date.now(),
      sessionCreated: Date.now(),
    };

    // Persist session metadata
    try {
      const persistResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/session-created`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
        },
        body: JSON.stringify({
          sessionId: clientSessionId,
          userId: user?.id || null,
          openaiSessionId,
          persona: "assistant",
          config: agentConfig,
          timings,
          consent: "DECLINED", // Default to declined for privacy
        }),
      });

      if (!persistResponse.ok) {
        logger.warn("Failed to persist session metadata", {
          clientSessionId,
          correlationId,
          status: persistResponse.status,
        });
      }
    } catch (error) {
      logger.warn("Error persisting session metadata", {
        clientSessionId,
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    logger.logLatencyMark("sessionCreated", Date.now());

    const response = {
      sessionId: openaiSessionId,
      client_secret: clientSecret,
      model: config.model,
      voice: "alloy",
      instructions: getSystemPrompt(),
      tools: config.featureFlags.tools
        ? [
            {
              type: "function",
              function: {
                name: "echo",
                description: "Echo back the input",
                parameters: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "The message to echo back",
                    },
                  },
                  required: ["message"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "retrieve_docs",
                description: "Retrieve relevant documents based on a query",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          ]
        : undefined,
      tool_choice: "auto",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      tools_choice: "auto",
      temperature: 0.8,
      max_response_output_tokens: 4096,
      enable_redaction: true,
      moderations: {
        type: "input",
        input_audio: {
          type: "input_audio",
        },
      },
    };

    logger.info("Session creation completed successfully", {
      clientSessionId,
      correlationId,
      openaiSessionId,
      duration: Date.now() - timings.sessionRequested,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Session creation failed", {
      clientSessionId,
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
