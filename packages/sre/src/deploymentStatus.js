import { ConsoleLogger } from "@thrive/realtime-observability";
export class DeploymentStatusTracker {
    constructor() {
        this.healthChecks = [];
        this.logger = new ConsoleLogger();
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimes = [];
        this.logger.info("Deployment Status Tracker initialized");
        this.initializeDefaultChecks();
        this.loadDeploymentInfo();
    }
    loadDeploymentInfo() {
        // In a real deployment, this would come from environment variables or deployment metadata
        this.currentDeployment = {
            version: "1.0.0",
            commitHash: "unknown",
            branch: "main",
            deployedAt: Date.now(),
            deployedBy: "system",
            environment: "development",
            region: "unknown",
            metadata: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
            },
        };
        this.logger.info("Deployment info loaded", {
            version: this.currentDeployment.version,
            environment: this.currentDeployment.environment,
            region: this.currentDeployment.region,
        });
    }
    initializeDefaultChecks() {
        // Health endpoint check
        this.addHealthCheck("health_endpoint", async () => {
            const start = Date.now();
            try {
                const response = await fetch("/api/health");
                const duration = Date.now() - start;
                return {
                    status: response.ok ? "pass" : "fail",
                    message: response.ok ? "Health endpoint responding" : `Health endpoint returned ${response.status}`,
                    duration,
                };
            }
            catch (error) {
                return {
                    status: "fail",
                    message: error instanceof Error ? error.message : "Health endpoint unreachable",
                    duration: Date.now() - start,
                };
            }
        });
        // Tools health check
        this.addHealthCheck("tools_health", async () => {
            const start = Date.now();
            try {
                const response = await fetch("/api/health/tools");
                const duration = Date.now() - start;
                return {
                    status: response.ok ? "pass" : "fail",
                    message: response.ok ? "Tools health check passing" : `Tools health check failed with ${response.status}`,
                    duration,
                };
            }
            catch (error) {
                return {
                    status: "fail",
                    message: error instanceof Error ? error.message : "Tools health check unreachable",
                    duration: Date.now() - start,
                };
            }
        });
        // Memory usage check
        this.addHealthCheck("memory_usage", async () => {
            const start = Date.now();
            try {
                const memUsage = process.memoryUsage();
                const usedMB = memUsage.heapUsed / 1024 / 1024;
                const totalMB = memUsage.heapTotal / 1024 / 1024;
                const usagePercent = (usedMB / totalMB) * 100;
                const duration = Date.now() - start;
                const isHealthy = usagePercent < 90;
                return {
                    status: isHealthy ? "pass" : "fail",
                    message: `Memory usage: ${usagePercent.toFixed(1)}% (${usedMB.toFixed(1)}MB / ${totalMB.toFixed(1)}MB)`,
                    duration,
                };
            }
            catch (error) {
                return {
                    status: "fail",
                    message: error instanceof Error ? error.message : "Memory check failed",
                    duration: Date.now() - start,
                };
            }
        });
    }
    addHealthCheck(name, check) {
        this.healthChecks.push({ name, check });
        this.logger.debug("Health check added", { name });
    }
    async runHealthChecks() {
        if (!this.currentDeployment) {
            throw new Error("No deployment information available");
        }
        const checks = await Promise.all(this.healthChecks.map(async ({ name, check }) => {
            try {
                return { name, ...(await check()) };
            }
            catch (error) {
                return {
                    name,
                    status: "fail",
                    message: error instanceof Error ? error.message : "Check failed",
                    duration: 0,
                };
            }
        }));
        const passedChecks = checks.filter((c) => c.status === "pass").length;
        const totalChecks = checks.length;
        const healthStatus = passedChecks === totalChecks ? "healthy" : passedChecks >= totalChecks * 0.8 ? "degraded" : "unhealthy";
        const uptime = Date.now() - this.startTime;
        const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
        const averageResponseTime = this.responseTimes.length > 0 ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;
        const health = {
            deployment: this.currentDeployment,
            healthStatus,
            lastHealthCheck: Date.now(),
            checks,
            metrics: {
                uptime,
                requestCount: this.requestCount,
                errorRate: Math.round(errorRate * 100) / 100,
                averageResponseTime: Math.round(averageResponseTime),
            },
        };
        this.logger.info("Health checks completed", {
            healthStatus,
            passedChecks,
            totalChecks,
            errorRate: health.metrics.errorRate,
        });
        return health;
    }
    recordRequest(responseTime, isError = false) {
        this.requestCount++;
        if (isError) {
            this.errorCount++;
        }
        this.responseTimes.push(responseTime);
        // Keep only last 1000 response times
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }
    }
    getCurrentDeployment() {
        return this.currentDeployment;
    }
    getDeploymentHealth() {
        return this.runHealthChecks();
    }
    // Update deployment info (useful for rollbacks or updates)
    updateDeployment(deployment) {
        if (this.currentDeployment) {
            this.currentDeployment = { ...this.currentDeployment, ...deployment };
            this.logger.info("Deployment info updated", {
                version: this.currentDeployment.version,
                deployedAt: this.currentDeployment.deployedAt,
            });
        }
    }
    // Get deployment history (in a real app, this would come from a database)
    getDeploymentHistory() {
        // For now, just return current deployment
        return this.currentDeployment ? [this.currentDeployment] : [];
    }
    // Check if deployment is healthy
    async isHealthy() {
        const health = await this.runHealthChecks();
        return health.healthStatus === "healthy";
    }
    // Get deployment metrics
    getMetrics() {
        const uptime = Date.now() - this.startTime;
        const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
        const averageResponseTime = this.responseTimes.length > 0 ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;
        return {
            uptime,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: Math.round(errorRate * 100) / 100,
            averageResponseTime: Math.round(averageResponseTime),
            memoryUsage: process.memoryUsage(),
        };
    }
}
// Singleton instance
export const deploymentStatusTracker = new DeploymentStatusTracker();
