import { ConsoleLogger } from "@thrivereflections/realtime-observability";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  timeout: number; // Time in ms before attempting to close
  successThreshold: number; // Number of successes needed to close from half-open
  requestTimeout: number; // Timeout for individual requests
  volumeThreshold: number; // Minimum number of requests before considering state change
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  requestCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateChangeTime: number;
}

export interface CircuitBreakerOptions {
  name: string;
  config: CircuitBreakerConfig;
  logger?: ConsoleLogger;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private requestCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private stateChangeTime = Date.now();
  private halfOpenRequestCount = 0;
  private config: CircuitBreakerConfig;
  private name: string;
  private logger: ConsoleLogger;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.config = options.config;
    this.logger = options.logger || new ConsoleLogger();

    this.logger.info("Circuit breaker created", {
      name: this.name,
      config: this.config,
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
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
    } catch (error) {
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

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Circuit breaker '${this.name}' operation timeout after ${this.config.requestTimeout}ms`));
        }, this.config.requestTimeout);
      }),
    ]);
  }

  private shouldOpen(): boolean {
    return this.failureCount >= this.config.failureThreshold && this.requestCount >= this.config.volumeThreshold;
  }

  private shouldClose(): boolean {
    return this.successCount >= this.config.successThreshold && this.requestCount >= this.config.volumeThreshold;
  }

  private recordSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    // Reset failure count on success
    this.failureCount = 0;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  private open(): void {
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

  private halfOpen(): void {
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

  private close(): void {
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

  getMetrics(): CircuitBreakerMetrics {
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

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
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
  private breakers = new Map<string, CircuitBreaker>();
  private logger = new ConsoleLogger();

  createBreaker(options: CircuitBreakerOptions): CircuitBreaker {
    const breaker = new CircuitBreaker(options);
    this.breakers.set(options.name, breaker);
    this.logger.info("Circuit breaker registered", { name: options.name });
    return breaker;
  }

  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  resetAll(): void {
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
} as const;
