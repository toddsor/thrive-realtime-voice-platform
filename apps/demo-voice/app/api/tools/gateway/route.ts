import { NextRequest, NextResponse } from "next/server";
import { ToolCall, ToolCallResponse } from "@thrivereflections/realtime-contracts";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";
import { loadRuntimeConfig, loadDatabaseConfig, loadAuthConfig } from "@thrivereflections/realtime-config";
import { ToolGateway, echoTool, retrieveTool } from "@thrivereflections/realtime-tool-gateway";
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { createClient } from "@/lib/supabase/server";
import { createUserSyncService } from "@thrivereflections/realtime-auth-supabase";
import { checkRateLimit, RATE_LIMITS } from "@thrivereflections/realtime-security";
import { initializeToolRegistry, executeToolCall, getAllToolDefinitions } from "@/lib/platform";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  const clientSessionId = request.headers.get("x-client-session-id");
  const logger = createLoggerFromEnv(correlationId);

  // Set session IDs in logger
  logger.setSessionIds(clientSessionId || undefined);

  try {
    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.TOOL_CALLS);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for tool calls", {
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
            "X-RateLimit-Limit": RATE_LIMITS.TOOL_CALLS.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Load configurations
    const runtimeConfig = loadRuntimeConfig();
    const databaseConfig = loadDatabaseConfig();
    const authConfig = loadAuthConfig();

    // Parse request body first
    const toolCall: ToolCall = await request.json();
    const startTime = Date.now();

    let appUser = null;

    // Only enforce authentication if Supabase is configured
    if (authConfig.supabase) {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn("Unauthenticated tool call attempt", {
          clientSessionId,
          correlationId,
          authError: authError?.message,
        });

        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // For now, just use the Supabase user directly
      appUser = {
        sub: user.id,
        tenant: "default",
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        provider: user.app_metadata?.provider,
      };

      logger.info("Tool call received from authenticated user", {
        clientSessionId,
        correlationId,
        toolName: toolCall.name,
        userId: appUser.sub,
      });
    } else {
      logger.info("Tool call received without authentication (Supabase not configured)", {
        clientSessionId,
        correlationId,
        toolName: toolCall.name,
      });
    }

    // Check payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > runtimeConfig.policies.maxPayloadBytes) {
      logger.warn("Payload too large", {
        clientSessionId,
        correlationId,
        contentLength: parseInt(contentLength),
        maxSize: runtimeConfig.policies.maxPayloadBytes,
      });

      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Initialize tool registry
    initializeToolRegistry();

    // Create tool gateway with configuration
    const toolGateway = new ToolGateway({
      policies: runtimeConfig.policies,
      allowList: ["echo", "retrieve_docs", "get_weather", "create_calendar_event"], // Include custom tools
      logger: logger,
    });

    // Register platform tools
    toolGateway.register("echo", echoTool);
    toolGateway.register("retrieve_docs", retrieveTool);

    // Execute tool call using registry pattern
    const response = await executeToolCall(toolCall);

    // Persist tool event if database is configured
    if (databaseConfig) {
      try {
        const store = createPrismaStore({ databaseUrl: databaseConfig.url }, { redact: (v) => v });
        await store.appendToolEvent(clientSessionId || "unknown", {
          name: toolCall.name,
          args: toolCall.args,
          result: response.result,
        });
      } catch (error) {
        logger.warn("Failed to persist tool event", {
          clientSessionId,
          correlationId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info("Tool call completed successfully", {
      clientSessionId,
      correlationId,
      toolName: toolCall.name,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Tool call failed", {
      clientSessionId,
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
