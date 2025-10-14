import { ConsoleLogger } from "@thrive/realtime-observability";

export interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  duration?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: number;
  duration: number;
  checks: HealthCheck[];
  version?: string;
  uptime?: number;
}

export interface HealthChecker {
  name: string;
  check(): Promise<HealthCheck>;
  timeout?: number;
}

export class HealthCheckManager {
  private checkers: HealthChecker[] = [];
  private logger = new ConsoleLogger();

  constructor() {
    this.logger.info("HealthCheckManager initialized");
  }

  addChecker(checker: HealthChecker): void {
    this.checkers.push(checker);
    this.logger.debug("Health checker added", { name: checker.name });
  }

  async runAllChecks(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

    this.logger.debug("Running health checks", { count: this.checkers.length });

    for (const checker of this.checkers) {
      try {
        const check = await this.runCheckWithTimeout(checker);
        checks.push(check);

        // Update overall status based on individual check results
        if (check.status === "unhealthy") {
          overallStatus = "unhealthy";
        } else if (check.status === "degraded" && overallStatus === "healthy") {
          overallStatus = "degraded";
        }
      } catch (error) {
        const failedCheck: HealthCheck = {
          name: checker.name,
          status: "unhealthy",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        };
        checks.push(failedCheck);
        overallStatus = "unhealthy";
        this.logger.error("Health check failed", { name: checker.name, error });
      }
    }

    const duration = Date.now() - startTime;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: Date.now(),
      duration,
      checks,
      version: "1.0.0",
      uptime: undefined, // Not available in Edge runtime
    };

    this.logger.info("Health checks completed", {
      status: overallStatus,
      duration,
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
      unhealthy: checks.filter((c) => c.status === "unhealthy").length,
    });

    return healthStatus;
  }

  private async runCheckWithTimeout(checker: HealthChecker): Promise<HealthCheck> {
    const timeout = checker.timeout || 5000; // Default 5 second timeout

    return Promise.race([
      checker.check(),
      new Promise<HealthCheck>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Health check timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  // Convenience method to create a simple health checker
  static createChecker(
    name: string,
    checkFn: () => Promise<{
      status: "healthy" | "unhealthy" | "degraded";
      message?: string;
      metadata?: Record<string, unknown>;
    }>,
    timeout?: number
  ): HealthChecker {
    return {
      name,
      timeout,
      check: async () => {
        const startTime = Date.now();
        const result = await checkFn();
        return {
          ...result,
          name,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      },
    };
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager();
