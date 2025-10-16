import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { sloTracker } from "./sloTracker";
import { metricsCollector } from "./metrics";

export interface SyntheticCheck {
  name: string;
  description: string;
  enabled: boolean;
  intervalMs: number;
  timeoutMs: number;
  lastRun?: number;
  lastResult?: SyntheticCheckResult;
}

export interface SyntheticCheckResult {
  name: string;
  success: boolean;
  duration: number;
  timestamp: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class SyntheticMonitoring {
  private checks = new Map<string, SyntheticCheck>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private logger = new ConsoleLogger();

  constructor() {
    this.logger.info("Synthetic Monitoring initialized");
    this.initializeDefaultChecks();
  }

  private initializeDefaultChecks(): void {
    // Voice session health check
    this.addCheck({
      name: "voice_session_health",
      description: "Simulate a voice session to check end-to-end functionality",
      enabled: true,
      intervalMs: 5 * 60 * 1000, // 5 minutes
      timeoutMs: 30 * 1000, // 30 seconds
    });

    // Tool execution health check
    this.addCheck({
      name: "tool_execution_health",
      description: "Test tool execution functionality",
      enabled: true,
      intervalMs: 2 * 60 * 1000, // 2 minutes
      timeoutMs: 10 * 1000, // 10 seconds
    });

    // API availability check
    this.addCheck({
      name: "api_availability",
      description: "Check API endpoint availability",
      enabled: true,
      intervalMs: 1 * 60 * 1000, // 1 minute
      timeoutMs: 5 * 1000, // 5 seconds
    });

    // RAG functionality check
    this.addCheck({
      name: "rag_functionality",
      description: "Test RAG document retrieval",
      enabled: true,
      intervalMs: 10 * 60 * 1000, // 10 minutes
      timeoutMs: 15 * 1000, // 15 seconds
    });
  }

  addCheck(check: SyntheticCheck): void {
    this.checks.set(check.name, check);
    this.logger.info("Synthetic check added", { name: check.name });

    if (check.enabled) {
      this.startCheck(check.name);
    }
  }

  startCheck(name: string): void {
    const check = this.checks.get(name);
    if (!check || !check.enabled) {
      return;
    }

    // Clear existing interval if any
    const existingInterval = this.intervals.get(name);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new interval
    const interval = setInterval(async () => {
      await this.runCheck(name);
    }, check.intervalMs);

    this.intervals.set(name, interval);
    this.logger.info("Synthetic check started", { name, intervalMs: check.intervalMs });
  }

  stopCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      this.logger.info("Synthetic check stopped", { name });
    }
  }

  async runCheck(name: string): Promise<SyntheticCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Check not found: ${name}`);
    }

    const startTime = Date.now();
    let result: SyntheticCheckResult;

    try {
      this.logger.debug("Running synthetic check", { name });

      // Run the specific check
      const checkResult = await this.executeCheck(name);

      const duration = Date.now() - startTime;
      result = {
        name,
        success: checkResult.success,
        duration,
        timestamp: Date.now(),
        error: checkResult.error,
        metadata: checkResult.metadata,
      };

      // Record metrics
      metricsCollector.recordAPIResponse(`synthetic_${name}`, duration, checkResult.success);

      // Record SLO metrics
      if (name === "voice_session_health") {
        sloTracker.recordTTFA(duration, checkResult.success);
        sloTracker.recordSessionSuccess();
      } else if (name === "tool_execution_health") {
        sloTracker.recordToolExecution(duration, checkResult.success);
      } else if (name === "api_availability") {
        sloTracker.recordAPIAvailability(checkResult.success);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      result = {
        name,
        success: false,
        duration,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.logger.error("Synthetic check failed", { name, error });
    }

    // Update check with result
    check.lastRun = Date.now();
    check.lastResult = result;

    return result;
  }

  private async executeCheck(name: string): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    switch (name) {
      case "voice_session_health":
        return await this.checkVoiceSessionHealth();

      case "tool_execution_health":
        return await this.checkToolExecutionHealth();

      case "api_availability":
        return await this.checkAPIAvailability();

      case "rag_functionality":
        return await this.checkRAGFunctionality();

      default:
        throw new Error(`Unknown check: ${name}`);
    }
  }

  private async checkVoiceSessionHealth(): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Test session creation endpoint
      const sessionResponse = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "You are a helpful assistant.",
          voice: "alloy",
          capabilities: ["speech"],
          toolPolicy: "deny_all",
          allowedTools: [],
          featureFlags: {
            transport: "webrtc",
            bargeIn: true,
            captions: "off",
            memory: "off",
          },
        }),
      });

      if (!sessionResponse.ok) {
        return {
          success: false,
          error: `Session creation failed: ${sessionResponse.status}`,
          metadata: { statusCode: sessionResponse.status },
        };
      }

      const sessionData = await sessionResponse.json();

      return {
        success: true,
        metadata: {
          sessionId: sessionData.sessionId,
          hasClientSecret: !!sessionData.client_secret,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkToolExecutionHealth(): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Test tool gateway with echo tool
      const toolResponse = await fetch("/api/tools/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "synthetic_test",
          name: "echo",
          args: { message: "synthetic test" },
          user: { sub: "synthetic", tenant: "test" },
        }),
      });

      if (!toolResponse.ok) {
        return {
          success: false,
          error: `Tool execution failed: ${toolResponse.status}`,
          metadata: { statusCode: toolResponse.status },
        };
      }

      const toolData = await toolResponse.json();

      return {
        success: toolData.ok,
        error: toolData.error,
        metadata: {
          toolId: toolData.id,
          result: toolData.result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkAPIAvailability(): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Test health endpoint
      const healthResponse = await fetch("/api/health");

      if (!healthResponse.ok) {
        return {
          success: false,
          error: `Health check failed: ${healthResponse.status}`,
          metadata: { statusCode: healthResponse.status },
        };
      }

      const healthData = await healthResponse.json();

      return {
        success: healthData.status === "healthy",
        error: healthData.status !== "healthy" ? `Health status: ${healthData.status}` : undefined,
        metadata: {
          healthStatus: healthData.status,
          checkCount: healthData.checks?.length || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkRAGFunctionality(): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Test RAG tool execution
      const ragResponse = await fetch("/api/tools/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "synthetic_rag_test",
          name: "retrieve_docs",
          args: { query: "test query", topK: 1 },
          user: { sub: "synthetic", tenant: "test" },
        }),
      });

      if (!ragResponse.ok) {
        return {
          success: false,
          error: `RAG test failed: ${ragResponse.status}`,
          metadata: { statusCode: ragResponse.status },
        };
      }

      const ragData = await ragResponse.json();

      return {
        success: ragData.ok,
        error: ragData.error,
        metadata: {
          toolId: ragData.id,
          result: ragData.result,
          chunkCount: ragData.result?.chunks?.length || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getAllChecks(): SyntheticCheck[] {
    return Array.from(this.checks.values());
  }

  getCheck(name: string): SyntheticCheck | undefined {
    return this.checks.get(name);
  }

  getCheckResult(name: string): SyntheticCheckResult | undefined {
    return this.checks.get(name)?.lastResult;
  }

  getAllResults(): SyntheticCheckResult[] {
    return Array.from(this.checks.values())
      .map((check) => check.lastResult)
      .filter((result): result is SyntheticCheckResult => result !== undefined);
  }

  getHealthSummary(): {
    total: number;
    healthy: number;
    unhealthy: number;
    lastRun: number;
    checks: Array<{
      name: string;
      success: boolean;
      lastRun: number;
      duration?: number;
    }>;
  } {
    const checks = Array.from(this.checks.values());
    const results = checks
      .map((check) => ({
        name: check.name,
        success: check.lastResult?.success ?? false,
        lastRun: check.lastRun ?? 0,
        duration: check.lastResult?.duration,
      }))
      .sort((a, b) => b.lastRun - a.lastRun);

    const healthy = results.filter((r) => r.success).length;
    const lastRun = Math.max(...results.map((r) => r.lastRun), 0);

    return {
      total: checks.length,
      healthy,
      unhealthy: checks.length - healthy,
      lastRun,
      checks: results,
    };
  }

  // Start all enabled checks
  startAll(): void {
    for (const [name, check] of this.checks.entries()) {
      if (check.enabled) {
        this.startCheck(name);
      }
    }
    this.logger.info("All synthetic checks started");
  }

  // Stop all checks
  stopAll(): void {
    for (const name of this.intervals.keys()) {
      this.stopCheck(name);
    }
    this.logger.info("All synthetic checks stopped");
  }
}

// Singleton instance
export const syntheticMonitoring = new SyntheticMonitoring();
