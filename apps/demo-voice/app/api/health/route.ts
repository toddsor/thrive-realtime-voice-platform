import { NextRequest, NextResponse } from "next/server";
import { healthCheckManager, HealthCheckManager } from "@thrive/realtime-sre";
import { ConsoleLogger } from "@thrive/realtime-observability";

export const runtime = "edge";

// Basic system health checker
const systemHealthChecker = HealthCheckManager.createChecker(
  "system",
  async () => {
    // In Edge runtime, we can't access process APIs
    // Just check if we can respond to requests
    const isHealthy = true; // If we can execute this, we're healthy

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      message: isHealthy ? "System operational" : "System not operational",
      metadata: {
        runtime: "edge",
        timestamp: Date.now(),
      },
    };
  },
  2000 // 2 second timeout
);

// OpenAI API connectivity checker
const openaiHealthChecker = HealthCheckManager.createChecker(
  "openai",
  async () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        status: "unhealthy",
        message: "OpenAI API key not configured",
      };
    }

    try {
      // Simple connectivity test - check if we can reach OpenAI
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        return {
          status: "healthy",
          message: "OpenAI API accessible",
          metadata: {
            statusCode: response.status,
            responseTime: Date.now(),
          },
        };
      } else if (response.status === 401) {
        return {
          status: "unhealthy",
          message: "OpenAI API key invalid",
          metadata: {
            statusCode: response.status,
          },
        };
      } else {
        return {
          status: "degraded",
          message: `OpenAI API returned ${response.status}`,
          metadata: {
            statusCode: response.status,
          },
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "OpenAI API unreachable",
        metadata: {
          error: error instanceof Error ? error.name : "UnknownError",
        },
      };
    }
  },
  10000 // 10 second timeout for external API
);

// Initialize health checkers
healthCheckManager.addChecker(systemHealthChecker);
healthCheckManager.addChecker(openaiHealthChecker);

export async function GET(_request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    logger.info("Health check requested", { correlationId });

    const healthStatus = await healthCheckManager.runAllChecks();

    // Determine HTTP status code based on health status
    const httpStatus = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;

    const response = NextResponse.json(healthStatus, { status: httpStatus });

    // Add custom headers for monitoring
    response.headers.set("X-Health-Status", healthStatus.status);
    response.headers.set("X-Health-Duration", healthStatus.duration.toString());
    response.headers.set("X-Correlation-ID", correlationId);

    logger.info("Health check completed", {
      status: healthStatus.status,
      httpStatus,
      duration: healthStatus.duration,
      correlationId,
    });

    return response;
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    const errorResponse = NextResponse.json(
      {
        status: "unhealthy",
        timestamp: Date.now(),
        duration: 0,
        checks: [],
        error: "Health check system failure",
        correlationId,
      },
      { status: 503 }
    );

    errorResponse.headers.set("X-Health-Status", "unhealthy");
    errorResponse.headers.set("X-Correlation-ID", correlationId);

    return errorResponse;
  }
}
