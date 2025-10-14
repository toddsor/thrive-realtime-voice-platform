import { ConsoleLogger } from "@thrive/realtime-observability";

export interface SLODefinition {
  name: string;
  description: string;
  target: number; // Target percentage (0-100)
  measurementWindow: number; // Window in milliseconds
  burnRateThreshold: number; // Error budget burn rate threshold
}

export interface SLOStatus {
  name: string;
  target: number;
  current: number;
  errorBudget: number;
  burnRate: number;
  status: "healthy" | "warning" | "critical";
  lastUpdated: number;
  measurementWindow: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface SLOMetrics {
  timestamp: number;
  sloName: string;
  success: boolean;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class SLOTracker {
  private slos: Map<string, SLODefinition> = new Map();
  private metrics: Map<string, SLOMetrics[]> = new Map();
  private logger = new ConsoleLogger();

  constructor() {
    this.logger.info("SLO Tracker initialized");
    this.initializeDefaultSLOs();
  }

  private initializeDefaultSLOs(): void {
    // TTFA SLO: 95% of requests should have TTFA ≤ 400ms
    this.addSLO({
      name: "ttfa_p95",
      description: "Time to First Audio 95th percentile ≤ 400ms",
      target: 95,
      measurementWindow: 5 * 60 * 1000, // 5 minutes
      burnRateThreshold: 2.0, // 2x normal burn rate
    });

    // Success Rate SLO: 99.5% of sessions should succeed
    this.addSLO({
      name: "session_success_rate",
      description: "Session success rate ≥ 99.5%",
      target: 99.5,
      measurementWindow: 5 * 60 * 1000, // 5 minutes
      burnRateThreshold: 2.0,
    });

    // Tool Execution SLO: 95% of tool calls should complete ≤ 2000ms
    this.addSLO({
      name: "tool_execution_p95",
      description: "Tool execution 95th percentile ≤ 2000ms",
      target: 95,
      measurementWindow: 5 * 60 * 1000, // 5 minutes
      burnRateThreshold: 2.0,
    });

    // API Availability SLO: 99.9% availability
    this.addSLO({
      name: "api_availability",
      description: "API availability ≥ 99.9%",
      target: 99.9,
      measurementWindow: 5 * 60 * 1000, // 5 minutes
      burnRateThreshold: 2.0,
    });
  }

  addSLO(slo: SLODefinition): void {
    this.slos.set(slo.name, slo);
    this.metrics.set(slo.name, []);
    this.logger.info("SLO added", { name: slo.name, target: slo.target });
  }

  recordMetric(metric: SLOMetrics): void {
    const slo = this.slos.get(metric.sloName);
    if (!slo) {
      this.logger.warn("Unknown SLO name", { sloName: metric.sloName });
      return;
    }

    const metrics = this.metrics.get(metric.sloName) || [];
    metrics.push(metric);

    // Keep only metrics within the measurement window
    const cutoff = Date.now() - slo.measurementWindow;
    const filteredMetrics = metrics.filter((m) => m.timestamp >= cutoff);
    this.metrics.set(metric.sloName, filteredMetrics);

    this.logger.debug("SLO metric recorded", {
      sloName: metric.sloName,
      success: metric.success,
      duration: metric.duration,
    });
  }

  getSLOStatus(sloName: string): SLOStatus | null {
    const slo = this.slos.get(sloName);
    if (!slo) {
      return null;
    }

    const metrics = this.metrics.get(sloName) || [];
    const now = Date.now();
    const cutoff = now - slo.measurementWindow;
    const recentMetrics = metrics.filter((m) => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        name: sloName,
        target: slo.target,
        current: 100, // No data means 100% success
        errorBudget: 100,
        burnRate: 0,
        status: "healthy",
        lastUpdated: now,
        measurementWindow: slo.measurementWindow,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      };
    }

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const current = (successfulRequests / totalRequests) * 100;
    const errorBudget = Math.max(0, slo.target - current);
    const burnRate = this.calculateBurnRate(sloName, recentMetrics);

    let status: "healthy" | "warning" | "critical" = "healthy";
    if (burnRate > slo.burnRateThreshold) {
      status = "critical";
    } else if (burnRate > slo.burnRateThreshold * 0.5) {
      status = "warning";
    }

    return {
      name: sloName,
      target: slo.target,
      current: Math.round(current * 100) / 100,
      errorBudget: Math.round(errorBudget * 100) / 100,
      burnRate: Math.round(burnRate * 100) / 100,
      status,
      lastUpdated: now,
      measurementWindow: slo.measurementWindow,
      totalRequests,
      successfulRequests,
      failedRequests,
    };
  }

  getAllSLOStatuses(): SLOStatus[] {
    const statuses: SLOStatus[] = [];
    for (const sloName of this.slos.keys()) {
      const status = this.getSLOStatus(sloName);
      if (status) {
        statuses.push(status);
      }
    }
    return statuses;
  }

  private calculateBurnRate(sloName: string, metrics: SLOMetrics[]): number {
    if (metrics.length < 2) {
      return 0;
    }

    // Calculate burn rate as the rate of error budget consumption
    const slo = this.slos.get(sloName);
    if (!slo) {
      return 0;
    }

    const timeSpan = metrics[metrics.length - 1].timestamp - metrics[0].timestamp;
    if (timeSpan === 0) {
      return 0;
    }

    const failedCount = metrics.filter((m) => !m.success).length;
    const totalCount = metrics.length;
    const errorRate = failedCount / totalCount;
    const targetErrorRate = (100 - slo.target) / 100;

    // Burn rate is the ratio of actual error rate to target error rate
    return targetErrorRate > 0 ? errorRate / targetErrorRate : 0;
  }

  // Helper method to record TTFA metrics
  recordTTFA(duration: number, success: boolean = true): void {
    this.recordMetric({
      timestamp: Date.now(),
      sloName: "ttfa_p95",
      success: success && duration <= 400,
      duration,
      metadata: { ttfa: duration },
    });
  }

  // Helper method to record session success
  recordSessionSuccess(): void {
    this.recordMetric({
      timestamp: Date.now(),
      sloName: "session_success_rate",
      success: true,
      metadata: { type: "session_success" },
    });
  }

  recordSessionFailure(): void {
    this.recordMetric({
      timestamp: Date.now(),
      sloName: "session_success_rate",
      success: false,
      metadata: { type: "session_failure" },
    });
  }

  // Helper method to record tool execution metrics
  recordToolExecution(duration: number, success: boolean = true): void {
    this.recordMetric({
      timestamp: Date.now(),
      sloName: "tool_execution_p95",
      success: success && duration <= 2000,
      duration,
      metadata: { toolExecution: duration },
    });
  }

  // Helper method to record API availability
  recordAPIAvailability(success: boolean): void {
    this.recordMetric({
      timestamp: Date.now(),
      sloName: "api_availability",
      success,
      metadata: { type: "api_availability" },
    });
  }

  // Get SLO compliance report
  getComplianceReport(): {
    overallStatus: "healthy" | "warning" | "critical";
    slos: SLOStatus[];
    summary: {
      totalSLOs: number;
      healthySLOs: number;
      warningSLOs: number;
      criticalSLOs: number;
    };
  } {
    const slos = this.getAllSLOStatuses();
    const healthySLOs = slos.filter((s) => s.status === "healthy").length;
    const warningSLOs = slos.filter((s) => s.status === "warning").length;
    const criticalSLOs = slos.filter((s) => s.status === "critical").length;

    let overallStatus: "healthy" | "warning" | "critical" = "healthy";
    if (criticalSLOs > 0) {
      overallStatus = "critical";
    } else if (warningSLOs > 0) {
      overallStatus = "warning";
    }

    return {
      overallStatus,
      slos,
      summary: {
        totalSLOs: slos.length,
        healthySLOs,
        warningSLOs,
        criticalSLOs,
      },
    };
  }
}

// Singleton instance
export const sloTracker = new SLOTracker();
