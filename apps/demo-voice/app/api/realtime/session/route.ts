import { NextRequest, NextResponse } from "next/server";
import {
  loadRuntimeConfig,
  loadAuthConfig,
  getAgentConfigWithUser,
  featureFlagManager,
} from "@thrivereflections/realtime-config";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";
import { checkRateLimit, RATE_LIMITS } from "@thrivereflections/realtime-security";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const clientSessionId = request.headers.get("x-client-session-id");
  const correlationId = crypto.randomUUID();
  const logger = createLoggerFromEnv(correlationId);

  // Set session IDs in logger
  logger.setSessionIds(clientSessionId || undefined);

  try {
    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.SESSION_CREATION);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for session creation", {
        clientSessionId,
        correlationId,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.SESSION_CREATION.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    logger.info("Session creation requested", {
      clientSessionId,
      correlationId,
      rateLimitRemaining: rateLimitResult.remaining,
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

    // Get user for config generation
    const appUser = user ? { sub: user.sub, tenant: "default" } : { sub: "anonymous", tenant: "default" };

    // Evaluate feature flags for this user
    const userTier = "free"; // In a real app, this would come from user data
    const flags = featureFlagManager.evaluateFlags(appUser.sub, userTier);

    // Get agent configuration using platform's config system
    const agentConfig = await getAgentConfigWithUser(appUser, flags);

    // Create token getter function
    const getToken = async () => {
      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openaiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          model: config.model,
          voice: agentConfig.voice,
          instructions: agentConfig.persona,
          tools: agentConfig.capabilities.includes("tools")
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

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("OpenAI session creation failed", {
          clientSessionId,
          correlationId,
          status: response.status,
          error: errorText,
        });
        throw new Error(`Failed to create OpenAI session: ${response.status}`);
      }

      const sessionData = await response.json();
      return sessionData;
    };

    // Create session data directly (avoid circular dependency with initRealtime)
    const sessionData = await getToken();

    logger.info("Session created successfully", {
      clientSessionId,
      correlationId,
      model: config.model,
    });

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
          openaiSessionId: clientSessionId, // Use client session ID as the session identifier
          persona: agentConfig.persona,
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

    // Return the session configuration for the client
    const response = {
      sessionId: clientSessionId,
      transport: config.featureFlags.transport,
      config: agentConfig,
      timings,
      client_secret: sessionData.client_secret, // Include the client_secret for the client to use
      model: config.model,
    };

    logger.info("Session creation completed successfully", {
      clientSessionId,
      correlationId,
      transport: config.featureFlags.transport,
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
