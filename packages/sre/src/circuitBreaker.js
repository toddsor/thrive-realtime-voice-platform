import { ConsoleLogger } from "@thrive/realtime-observability";
export class CircuitBreaker {
    constructor(options) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        this.requestCount = 0;
        this.stateChangeTime = Date.now();
        this.halfOpenRequestCount = 0;
        this.name = options.name;
        this.config = options.config;
        this.logger = options.logger || new ConsoleLogger();
        this.logger.info("Circuit breaker created", {
            name: this.name,
            config: this.config,
        });
    }
    async execute(operation) {
        // Check if circuit should be opened
        if (this.state === "CLOSED" && this.shouldOpen()) {
            this.open();
        }
        // Check if circuit should be closed from half-open
        if (this.state === "HALF_OPEN" && this.shouldClose()) {
            this.close();
        }
        // If circuit is open, reject immediately
        if (this.state === "OPEN") {
            const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
            this.logger.warn("Circuit breaker rejecting request", {
                name: this.name,
                state: this.state,
                failureCount: this.failureCount,
            });
            throw error;
        }
        // If circuit is half-open, limit requests
        if (this.state === "HALF_OPEN") {
            if (this.halfOpenRequestCount >= this.config.successThreshold) {
                const error = new Error(`Circuit breaker '${this.name}' is HALF_OPEN and request limit reached`);
                this.logger.warn("Circuit breaker limiting half-open requests", {
                    name: this.name,
                    halfOpenRequestCount: this.halfOpenRequestCount,
                    successThreshold: this.config.successThreshold,
                });
                throw error;
            }
            this.halfOpenRequestCount++;
        }
        this.requestCount++;
        try {
            // Execute the operation with timeout
            const result = await this.executeWithTimeout(operation);
            // Record success
            this.recordSuccess();
            this.logger.debug("Circuit breaker operation succeeded", {
                name: this.name,
                state: this.state,
                requestCount: this.requestCount,
            });
            return result;
        }
        catch (error) {
            // Record failure
            this.recordFailure();
            this.logger.warn("Circuit breaker operation failed", {
                name: this.name,
                state: this.state,
                error: error instanceof Error ? error.message : "Unknown error",
                failureCount: this.failureCount,
            });
            throw error;
        }
    }
    async executeWithTimeout(operation) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Circuit breaker '${this.name}' operation timeout after ${this.config.requestTimeout}ms`));
                }, this.config.requestTimeout);
            }),
        ]);
    }
    shouldOpen() {
        return this.failureCount >= this.config.failureThreshold && this.requestCount >= this.config.volumeThreshold;
    }
    shouldClose() {
        return this.successCount >= this.config.successThreshold && this.requestCount >= this.config.volumeThreshold;
    }
    recordSuccess() {
        this.successCount++;
        this.lastSuccessTime = Date.now();
        // Reset failure count on success
        this.failureCount = 0;
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
    }
    open() {
        if (this.state !== "OPEN") {
            this.state = "OPEN";
            this.stateChangeTime = Date.now();
            this.halfOpenRequestCount = 0;
            this.logger.warn("Circuit breaker opened", {
                name: this.name,
                failureCount: this.failureCount,
                requestCount: this.requestCount,
            });
            // Schedule transition to half-open
            setTimeout(() => {
                this.halfOpen();
            }, this.config.timeout);
        }
    }
    halfOpen() {
        if (this.state === "OPEN") {
            this.state = "HALF_OPEN";
            this.stateChangeTime = Date.now();
            this.halfOpenRequestCount = 0;
            this.successCount = 0;
            this.logger.info("Circuit breaker half-opened", {
                name: this.name,
                timeout: this.config.timeout,
            });
        }
    }
    close() {
        if (this.state === "HALF_OPEN") {
            this.state = "CLOSED";
            this.stateChangeTime = Date.now();
            this.failureCount = 0;
            this.successCount = 0;
            this.halfOpenRequestCount = 0;
            this.logger.info("Circuit breaker closed", {
                name: this.name,
                successCount: this.successCount,
            });
        }
    }
    getMetrics() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            requestCount: this.requestCount,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
            stateChangeTime: this.stateChangeTime,
        };
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        this.requestCount = 0;
        this.halfOpenRequestCount = 0;
        this.lastFailureTime = undefined;
        this.lastSuccessTime = undefined;
        this.stateChangeTime = Date.now();
        this.logger.info("Circuit breaker reset", { name: this.name });
    }
}
// Circuit breaker manager for multiple breakers
export class CircuitBreakerManager {
    constructor() {
        this.breakers = new Map();
        this.logger = new ConsoleLogger();
    }
    createBreaker(options) {
        const breaker = new CircuitBreaker(options);
        this.breakers.set(options.name, breaker);
        this.logger.info("Circuit breaker registered", { name: options.name });
        return breaker;
    }
    getBreaker(name) {
        return this.breakers.get(name);
    }
    getAllMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.breakers.entries()) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
        this.logger.info("All circuit breakers reset");
    }
}
// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
// Default configurations for common use cases
export const defaultConfigs = {
    openai: {
        failureThreshold: 5,
        timeout: 30000, // 30 seconds
        successThreshold: 3,
        requestTimeout: 10000, // 10 seconds
        volumeThreshold: 10,
    },
    tools: {
        failureThreshold: 3,
        timeout: 15000, // 15 seconds
        successThreshold: 2,
        requestTimeout: 5000, // 5 seconds
        volumeThreshold: 5,
    },
    vectorStore: {
        failureThreshold: 3,
        timeout: 20000, // 20 seconds
        successThreshold: 2,
        requestTimeout: 3000, // 3 seconds
        volumeThreshold: 5,
    },
};
