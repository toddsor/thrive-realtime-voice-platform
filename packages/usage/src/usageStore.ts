import { SessionUsage, UsageAggregation } from "./usageTracker";
import { PerformanceMetrics, MetricsAggregation } from "./metricsCollector";
import { CostBreakdown } from "./costEstimator";

export interface UsageStore {
  // Session usage operations
  saveSessionUsage(usage: SessionUsage): Promise<void>;
  getSessionUsage(sessionId: string): Promise<SessionUsage | null>;
  getUserUsage(userId: string, period: "day" | "month"): Promise<UsageAggregation>;
  getAllUserUsage(userId: string): Promise<SessionUsage[]>;

  // Performance metrics operations
  savePerformanceMetrics(metrics: PerformanceMetrics): Promise<void>;
  getPerformanceMetrics(sessionId: string): Promise<PerformanceMetrics | null>;
  getAggregatedMetrics(
    period: "hour" | "day" | "week" | "month",
    startTime: number,
    endTime: number
  ): Promise<MetricsAggregation>;

  // Cost operations
  saveCostBreakdown(sessionId: string, breakdown: CostBreakdown): Promise<void>;
  getCostBreakdown(sessionId: string): Promise<CostBreakdown | null>;
  getUserCostSummary(
    userId: string,
    period: "day" | "month"
  ): Promise<{
    totalCost: number;
    averageCostPerSession: number;
    costTrend: "increasing" | "decreasing" | "stable";
    breakdown: {
      audio: number;
      tokens: number;
      tools: number;
      overhead: number;
    };
  }>;

  // Query operations
  queryUsage(filters: {
    userId?: string;
    startTime?: number;
    endTime?: number;
    minCost?: number;
    maxCost?: number;
    tier?: string;
  }): Promise<SessionUsage[]>;

  // Export operations
  exportUsageData(sessionIds: string[], format: "json" | "csv"): Promise<string>;
  exportMetricsData(sessionIds: string[], format: "json" | "csv"): Promise<string>;

  // Cleanup operations
  cleanupOldData(olderThanDays: number): Promise<void>;
  getStorageStats(): Promise<{
    totalSessions: number;
    totalMetrics: number;
    totalCostBreakdowns: number;
    storageSize: number;
    oldestData: number;
    newestData: number;
  }>;
}

export class InMemoryUsageStore implements UsageStore {
  private sessionUsage = new Map<string, SessionUsage>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private costBreakdowns = new Map<string, CostBreakdown>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Run cleanup every 6 hours
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData(7); // Clean up data older than 7 days
    }, 6 * 60 * 60 * 1000);
  }

  // Session usage operations
  async saveSessionUsage(usage: SessionUsage): Promise<void> {
    this.sessionUsage.set(usage.sessionId, { ...usage });
  }

  async getSessionUsage(sessionId: string): Promise<SessionUsage | null> {
    return this.sessionUsage.get(sessionId) || null;
  }

  async getUserUsage(userId: string, period: "day" | "month"): Promise<UsageAggregation> {
    const now = Date.now();
    const startOfPeriod = period === "day" ? new Date().setHours(0, 0, 0, 0) : new Date().setDate(1);

    const userSessions = Array.from(this.sessionUsage.values()).filter(
      (session) => session.userId === userId && session.createdAt >= startOfPeriod
    );

    const totalSessions = userSessions.length;
    const totalAudioMinutes = userSessions.reduce((sum, s) => sum + s.audioMinutes, 0);
    const totalTokensInput = userSessions.reduce((sum, s) => sum + s.tokensInput, 0);
    const totalTokensOutput = userSessions.reduce((sum, s) => sum + s.tokensOutput, 0);
    const totalTokensCached = userSessions.reduce((sum, s) => sum + s.tokensCached, 0);
    const totalToolCalls = userSessions.reduce((sum, s) => sum + s.toolCalls, 0);
    const totalRetrievals = userSessions.reduce((sum, s) => sum + s.retrievals, 0);
    const totalCost = userSessions.reduce((sum, s) => sum + s.estimatedCost, 0);
    const averageSessionDuration =
      totalSessions > 0 ? userSessions.reduce((sum, s) => sum + s.durationMs, 0) / totalSessions : 0;
    const averageCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;

    return {
      userId,
      period,
      startDate: startOfPeriod,
      endDate: now,
      totalSessions,
      totalAudioMinutes,
      totalTokensInput,
      totalTokensOutput,
      totalTokensCached,
      totalToolCalls,
      totalRetrievals,
      totalCost,
      averageSessionDuration,
      averageCostPerSession,
    };
  }

  async getAllUserUsage(userId: string): Promise<SessionUsage[]> {
    return Array.from(this.sessionUsage.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Performance metrics operations
  async savePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    this.performanceMetrics.set(metrics.sessionId, { ...metrics });
  }

  async getPerformanceMetrics(sessionId: string): Promise<PerformanceMetrics | null> {
    return this.performanceMetrics.get(sessionId) || null;
  }

  async getAggregatedMetrics(
    period: "hour" | "day" | "week" | "month",
    startTime: number,
    endTime: number
  ): Promise<MetricsAggregation> {
    const sessionMetrics = Array.from(this.performanceMetrics.values()).filter(
      (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime
    );

    if (sessionMetrics.length === 0) {
      return {
        period,
        startTime,
        endTime,
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        failedSessions: 0,
        averageTtfa: 0,
        averageConnectionTime: 0,
        averageResponseTime: 0,
        averageAudioDuration: 0,
        totalAudioMinutes: 0,
        totalTokens: 0,
        totalToolCalls: 0,
        totalRetrievals: 0,
        totalCost: 0,
        averageCostPerSession: 0,
        averageCostPerMinute: 0,
        averageCacheHitRate: 0,
        averageToolSuccessRate: 0,
        averageAudioQuality: 0,
      };
    }

    const totalSessions = sessionMetrics.length;
    const activeSessions = 0; // Simplified - would need real-time tracking
    const completedSessions = sessionMetrics.length;
    const failedSessions = 0; // Simplified - assume no failures

    const averageTtfa = sessionMetrics.reduce((sum, m) => sum + m.ttfa, 0) / totalSessions;
    const averageConnectionTime = sessionMetrics.reduce((sum, m) => sum + m.connectionTime, 0) / totalSessions;
    const averageResponseTime = sessionMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / totalSessions;
    const averageAudioDuration = sessionMetrics.reduce((sum, m) => sum + m.audioDuration, 0) / totalSessions;

    const totalAudioMinutes = sessionMetrics.reduce((sum, m) => sum + m.audioDuration / 60000, 0);
    const totalTokens = sessionMetrics.reduce((sum, m) => sum + m.tokenEfficiency * (m.audioDuration / 60000), 0);
    const totalToolCalls = sessionMetrics.reduce((sum, m) => sum + (m.toolSuccessRate / 100) * 10, 0); // Simplified
    const totalRetrievals = sessionMetrics.reduce((sum, m) => sum + (m.retrievalLatency > 0 ? 1 : 0), 0);

    const totalCost = sessionMetrics.reduce((sum, m) => sum + m.totalCost, 0);
    const averageCostPerSession = totalCost / totalSessions;
    const averageCostPerMinute = totalAudioMinutes > 0 ? totalCost / totalAudioMinutes : 0;

    const averageCacheHitRate = sessionMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalSessions;
    const averageToolSuccessRate = sessionMetrics.reduce((sum, m) => sum + m.toolSuccessRate, 0) / totalSessions;
    const averageAudioQuality =
      sessionMetrics.reduce((sum, m) => sum + this.audioQualityToNumber(m.audioQuality), 0) / totalSessions;

    return {
      period,
      startTime,
      endTime,
      totalSessions,
      activeSessions,
      completedSessions,
      failedSessions,
      averageTtfa,
      averageConnectionTime,
      averageResponseTime,
      averageAudioDuration,
      totalAudioMinutes,
      totalTokens,
      totalToolCalls,
      totalRetrievals,
      totalCost,
      averageCostPerSession,
      averageCostPerMinute,
      averageCacheHitRate,
      averageToolSuccessRate,
      averageAudioQuality,
    };
  }

  // Cost operations
  async saveCostBreakdown(sessionId: string, breakdown: CostBreakdown): Promise<void> {
    this.costBreakdowns.set(sessionId, { ...breakdown });
  }

  async getCostBreakdown(sessionId: string): Promise<CostBreakdown | null> {
    return this.costBreakdowns.get(sessionId) || null;
  }

  async getUserCostSummary(
    userId: string,
    period: "day" | "month"
  ): Promise<{
    totalCost: number;
    averageCostPerSession: number;
    costTrend: "increasing" | "decreasing" | "stable";
    breakdown: {
      audio: number;
      tokens: number;
      tools: number;
      overhead: number;
    };
  }> {
    const startOfPeriod = period === "day" ? new Date().setHours(0, 0, 0, 0) : new Date().setDate(1);

    const userSessions = Array.from(this.sessionUsage.values()).filter(
      (session) => session.userId === userId && session.createdAt >= startOfPeriod
    );

    if (userSessions.length === 0) {
      return {
        totalCost: 0,
        averageCostPerSession: 0,
        costTrend: "stable",
        breakdown: { audio: 0, tokens: 0, tools: 0, overhead: 0 },
      };
    }

    const totalCost = userSessions.reduce((sum, s) => sum + s.estimatedCost, 0);
    const averageCostPerSession = totalCost / userSessions.length;

    // Calculate cost trend
    let costTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (userSessions.length >= 2) {
      const sortedSessions = userSessions.sort((a, b) => a.createdAt - b.createdAt);
      const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
      const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));

      const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.estimatedCost, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.estimatedCost, 0) / secondHalf.length;

      const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

      if (change > 0.1) costTrend = "increasing";
      else if (change < -0.1) costTrend = "decreasing";
    }

    // Calculate breakdown from cost breakdowns
    const breakdown = { audio: 0, tokens: 0, tools: 0, overhead: 0 };
    for (const session of userSessions) {
      const costBreakdown = this.costBreakdowns.get(session.sessionId);
      if (costBreakdown) {
        breakdown.audio += costBreakdown.audioCost;
        breakdown.tokens +=
          costBreakdown.inputTokenCost + costBreakdown.outputTokenCost - costBreakdown.cachedTokenDiscount;
        breakdown.tools += costBreakdown.toolCallCost + costBreakdown.retrievalCost;
        breakdown.overhead += costBreakdown.sessionOverhead + costBreakdown.connectionOverhead;
      }
    }

    return {
      totalCost,
      averageCostPerSession,
      costTrend,
      breakdown,
    };
  }

  // Query operations
  async queryUsage(filters: {
    userId?: string;
    startTime?: number;
    endTime?: number;
    minCost?: number;
    maxCost?: number;
    tier?: string;
  }): Promise<SessionUsage[]> {
    let sessions = Array.from(this.sessionUsage.values());

    if (filters.userId) {
      sessions = sessions.filter((s) => s.userId === filters.userId);
    }

    if (filters.startTime) {
      sessions = sessions.filter((s) => s.createdAt >= filters.startTime!);
    }

    if (filters.endTime) {
      sessions = sessions.filter((s) => s.createdAt <= filters.endTime!);
    }

    if (filters.minCost !== undefined) {
      sessions = sessions.filter((s) => s.estimatedCost >= filters.minCost!);
    }

    if (filters.maxCost !== undefined) {
      sessions = sessions.filter((s) => s.estimatedCost <= filters.maxCost!);
    }

    // Note: tier filtering would require additional data structure
    // For now, we'll skip tier filtering

    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Export operations
  async exportUsageData(sessionIds: string[], format: "json" | "csv"): Promise<string> {
    const sessions = sessionIds
      .map((id) => this.sessionUsage.get(id))
      .filter((session): session is SessionUsage => session !== undefined);

    if (format === "json") {
      return JSON.stringify(sessions, null, 2);
    } else {
      // CSV format
      const headers = [
        "sessionId",
        "userId",
        "startTime",
        "endTime",
        "durationMs",
        "audioMinutes",
        "tokensInput",
        "tokensOutput",
        "tokensCached",
        "toolCalls",
        "retrievals",
        "estimatedCost",
        "createdAt",
        "updatedAt",
      ];

      const rows = sessions.map((session) => [
        session.sessionId,
        session.userId,
        session.startTime,
        session.endTime || "",
        session.durationMs,
        session.audioMinutes,
        session.tokensInput,
        session.tokensOutput,
        session.tokensCached,
        session.toolCalls,
        session.retrievals,
        session.estimatedCost,
        session.createdAt,
        session.updatedAt,
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }
  }

  async exportMetricsData(sessionIds: string[], format: "json" | "csv"): Promise<string> {
    const metrics = sessionIds
      .map((id) => this.performanceMetrics.get(id))
      .filter((metric): metric is PerformanceMetrics => metric !== undefined);

    if (format === "json") {
      return JSON.stringify(metrics, null, 2);
    } else {
      // CSV format
      const headers = [
        "sessionId",
        "userId",
        "timestamp",
        "ttfa",
        "connectionTime",
        "firstResponseTime",
        "averageResponseTime",
        "audioDuration",
        "audioQuality",
        "tokensPerSecond",
        "tokenEfficiency",
        "cacheHitRate",
        "toolCallLatency",
        "toolSuccessRate",
        "retrievalLatency",
        "memoryUsage",
        "cpuUsage",
        "networkLatency",
        "costPerMinute",
        "costEfficiency",
        "totalCost",
      ];

      const rows = metrics.map((metric) => [
        metric.sessionId,
        metric.userId,
        metric.timestamp,
        metric.ttfa,
        metric.connectionTime,
        metric.firstResponseTime,
        metric.averageResponseTime,
        metric.audioDuration,
        metric.audioQuality,
        metric.tokensPerSecond,
        metric.tokenEfficiency,
        metric.cacheHitRate,
        metric.toolCallLatency,
        metric.toolSuccessRate,
        metric.retrievalLatency,
        metric.memoryUsage,
        metric.cpuUsage,
        metric.networkLatency,
        metric.costPerMinute,
        metric.costEfficiency,
        metric.totalCost,
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }
  }

  // Cleanup operations
  async cleanupOldData(olderThanDays: number): Promise<void> {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    // Clean up session usage
    for (const [sessionId, session] of this.sessionUsage.entries()) {
      if (session.createdAt < cutoffTime) {
        this.sessionUsage.delete(sessionId);
        this.performanceMetrics.delete(sessionId);
        this.costBreakdowns.delete(sessionId);
      }
    }
  }

  async getStorageStats(): Promise<{
    totalSessions: number;
    totalMetrics: number;
    totalCostBreakdowns: number;
    storageSize: number;
    oldestData: number;
    newestData: number;
  }> {
    const sessions = Array.from(this.sessionUsage.values());
    const metrics = Array.from(this.performanceMetrics.values());
    const costs = Array.from(this.costBreakdowns.values());

    const timestamps = [
      ...sessions.map((s) => s.createdAt),
      ...metrics.map((m) => m.timestamp),
      ...costs.map(() => Date.now()), // Cost breakdowns don't have timestamps
    ];

    const oldestData = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestData = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    // Estimate storage size (rough calculation)
    const sessionSize = sessions.length * 200; // ~200 bytes per session
    const metricsSize = metrics.length * 300; // ~300 bytes per metric
    const costSize = costs.length * 100; // ~100 bytes per cost breakdown
    const storageSize = sessionSize + metricsSize + costSize;

    return {
      totalSessions: sessions.length,
      totalMetrics: metrics.length,
      totalCostBreakdowns: costs.length,
      storageSize,
      oldestData,
      newestData,
    };
  }

  // Helper methods
  private audioQualityToNumber(quality: "low" | "medium" | "high"): number {
    switch (quality) {
      case "low":
        return 1;
      case "medium":
        return 2;
      case "high":
        return 3;
      default:
        return 1;
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const usageStore = new InMemoryUsageStore();
