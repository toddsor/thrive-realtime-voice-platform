import { ConsoleLogger } from "@thrive/realtime-observability";
export class HealthCheckManager {
    constructor() {
        this.checkers = [];
        this.logger = new ConsoleLogger();
        this.logger.info("HealthCheckManager initialized");
    }
    addChecker(checker) {
        this.checkers.push(checker);
        this.logger.debug("Health checker added", { name: checker.name });
    }
    async runAllChecks() {
        const startTime = Date.now();
        const checks = [];
        let overallStatus = "healthy";
        this.logger.debug("Running health checks", { count: this.checkers.length });
        for (const checker of this.checkers) {
            try {
                const check = await this.runCheckWithTimeout(checker);
                checks.push(check);
                // Update overall status based on individual check results
                if (check.status === "unhealthy") {
                    overallStatus = "unhealthy";
                }
                else if (check.status === "degraded" && overallStatus === "healthy") {
                    overallStatus = "degraded";
                }
            }
            catch (error) {
                const failedCheck = {
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
        const healthStatus = {
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
    async runCheckWithTimeout(checker) {
        const timeout = checker.timeout || 5000; // Default 5 second timeout
        return Promise.race([
            checker.check(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Health check timeout after ${timeout}ms`));
                }, timeout);
            }),
        ]);
    }
    // Convenience method to create a simple health checker
    static createChecker(name, checkFn, timeout) {
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
