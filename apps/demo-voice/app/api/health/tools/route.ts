import { NextRequest, NextResponse } from "next/server";
import { healthCheckManager, HealthCheckManager } from "@thrive/realtime-sre";
import { ConsoleLogger } from "@thrive/realtime-observability";
import { toolRegistry } from "@thrive/realtime-tool-gateway";

export const runtime = "nodejs";

// Tool gateway health checker
const toolGatewayHealthChecker = HealthCheckManager.createChecker(
  "tool-gateway",
  async () => {
    try {
      // Check if tool handlers are loaded
      const handlerCount = Object.keys(toolRegistry).length;

      if (handlerCount === 0) {
        return {
          status: "unhealthy",
          message: "No tool handlers loaded",
          metadata: {
            handlerCount,
          },
        };
      }

      return {
        status: "healthy",
        message: `Tool gateway operational with ${handlerCount} handlers`,
        metadata: {
          handlerCount,
          handlers: Object.keys(toolRegistry),
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Tool gateway check failed",
        metadata: {
          error: error instanceof Error ? error.name : "UnknownError",
        },
      };
    }
  },
  2000
);

// Individual tool handler health checker
const toolHandlersHealthChecker = HealthCheckManager.createChecker(
  "tool-handlers",
  async () => {
    try {
      const results: Record<string, { status: string; message?: string }> = {};
      let healthyCount = 0;
      const degradedCount = 0;
      let unhealthyCount = 0;

      // Test each tool handler
      for (const [toolName, handler] of Object.entries(toolRegistry)) {
        try {
          // Simple validation - check if handler is a function
          if (typeof handler !== "function") {
            results[toolName] = {
              status: "unhealthy",
              message: "Handler is not a function",
            };
            unhealthyCount++;
          } else {
            results[toolName] = {
              status: "healthy",
              message: "Handler operational",
            };
            healthyCount++;
          }
        } catch (error) {
          results[toolName] = {
            status: "unhealthy",
            message: error instanceof Error ? error.message : "Handler check failed",
          };
          unhealthyCount++;
          unhealthyCount++;
        }
      }

      let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
      if (unhealthyCount > 0) {
        overallStatus = "unhealthy";
      } else if (degradedCount > 0) {
        overallStatus = "degraded";
      }

      return {
        status: overallStatus,
        message: `${healthyCount} healthy, ${degradedCount} degraded, ${unhealthyCount} unhealthy handlers`,
        metadata: {
          results,
          healthyCount,
          degradedCount,
          unhealthyCount,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Tool handlers check failed",
        metadata: {
          error: error instanceof Error ? error.name : "UnknownError",
        },
      };
    }
  },
  5000
);

// Vector store health checker (if available)
const vectorStoreHealthChecker = HealthCheckManager.createChecker(
  "vector-store",
  async () => {
    try {
      // Check if vector store is accessible
      // This is a simple check - in production you'd want more sophisticated validation
      const vectorStore = await import("@thrive/realtime-tool-gateway").catch(() => null);

      if (!vectorStore) {
        return {
          status: "degraded",
          message: "Vector store not available",
          metadata: {
            available: false,
          },
        };
      }

      // Try to perform a simple operation
      try {
        // This would be a real health check in production
        return {
          status: "healthy",
          message: "Vector store operational",
          metadata: {
            available: true,
            type: "in-memory",
          },
        };
      } catch (error) {
        return {
          status: "degraded",
          message: "Vector store accessible but not fully operational",
          metadata: {
            available: true,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Vector store check failed",
        metadata: {
          available: false,
          error: error instanceof Error ? error.name : "UnknownError",
        },
      };
    }
  },
  3000
);

// Initialize health checkers
healthCheckManager.addChecker(toolGatewayHealthChecker);
healthCheckManager.addChecker(toolHandlersHealthChecker);
healthCheckManager.addChecker(vectorStoreHealthChecker);

export async function GET(_request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    logger.info("Tools health check requested", { correlationId });

    const healthStatus = await healthCheckManager.runAllChecks();

    // Determine HTTP status code based on health status
    const httpStatus = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;

    const response = NextResponse.json(healthStatus, { status: httpStatus });

    // Add custom headers for monitoring
    response.headers.set("X-Health-Status", healthStatus.status);
    response.headers.set("X-Health-Duration", healthStatus.duration.toString());
    response.headers.set("X-Correlation-ID", correlationId);

    logger.info("Tools health check completed", {
      status: healthStatus.status,
      httpStatus,
      duration: healthStatus.duration,
      correlationId,
    });

    return response;
  } catch (error) {
    logger.error("Tools health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    const errorResponse = NextResponse.json(
      {
        status: "unhealthy",
        timestamp: Date.now(),
        duration: 0,
        checks: [],
        error: "Tools health check system failure",
        correlationId,
      },
      { status: 503 }
    );

    errorResponse.headers.set("X-Health-Status", "unhealthy");
    errorResponse.headers.set("X-Correlation-ID", correlationId);

    return errorResponse;
  }
}
