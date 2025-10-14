import { SessionUsage } from './usageTracker';

export interface PerformanceMetrics {
  sessionId: string;
  userId: string;
  timestamp: number;
  
  // Timing metrics
  ttfa: number; // Time to first audio (ms)
  connectionTime: number; // WebRTC connection time (ms)
  firstResponseTime: number; // First AI response time (ms)
  averageResponseTime: number; // Average response time (ms)
  
  // Audio metrics
  audioDuration: number; // Total audio duration (ms)
  audioQuality: 'low' | 'medium' | 'high'; // Audio quality assessment
  audioLatency: number; // Audio processing latency (ms)
  
  // Token metrics
  tokensPerSecond: number; // Tokens processed per second
  tokenEfficiency: number; // Tokens per minute of audio
  cacheHitRate: number; // Percentage of cached tokens
  
  // Tool metrics
  toolCallLatency: number; // Average tool call latency (ms)
  toolSuccessRate: number; // Percentage of successful tool calls
  retrievalLatency: number; // Average retrieval latency (ms)
  
  // System metrics
  memoryUsage: number; // Memory usage (MB)
  cpuUsage: number; // CPU usage percentage
  networkLatency: number; // Network latency (ms)
  
  // Cost metrics
  costPerMinute: number; // Cost per minute of audio
  costEfficiency: number; // Cost per token
  totalCost: number; // Total session cost
}

export interface MetricsAggregation {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: number;
  endTime: number;
  
  // Session counts
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  
  // Performance averages
  averageTtfa: number;
  averageConnectionTime: number;
  averageResponseTime: number;
  averageAudioDuration: number;
  
  // Usage totals
  totalAudioMinutes: number;
  totalTokens: number;
  totalToolCalls: number;
  totalRetrievals: number;
  
  // Cost totals
  totalCost: number;
  averageCostPerSession: number;
  averageCostPerMinute: number;
  
  // Quality metrics
  averageCacheHitRate: number;
  averageToolSuccessRate: number;
  averageAudioQuality: number;
}

export interface MetricsCollector {
  collectSessionMetrics(sessionId: string, usage: SessionUsage): Promise<PerformanceMetrics>;
  collectRealtimeMetrics(sessionId: string, metrics: Partial<PerformanceMetrics>): Promise<void>;
  getSessionMetrics(sessionId: string): Promise<PerformanceMetrics | null>;
  getAggregatedMetrics(period: 'hour' | 'day' | 'week' | 'month', startTime: number, endTime: number): Promise<MetricsAggregation>;
  exportMetrics(sessionIds: string[], format: 'json' | 'csv'): Promise<string>;
  cleanupOldMetrics(olderThanDays: number): Promise<void>;
}

export class InMemoryMetricsCollector implements MetricsCollector {
  private metrics = new Map<string, PerformanceMetrics>();
  private realtimeMetrics = new Map<string, Partial<PerformanceMetrics>>();
  private sessionTimings = new Map<string, {
    sessionStart: number;
    connectionStart?: number;
    firstAudioTime?: number;
    firstResponseTime?: number;
    responseTimes: number[];
    toolCallTimes: number[];
    retrievalTimes: number[];
  }>();

  async collectSessionMetrics(sessionId: string, usage: SessionUsage): Promise<PerformanceMetrics> {
    const timings = this.sessionTimings.get(sessionId);
    const now = Date.now();
    
    // Calculate performance metrics
    const ttfa = timings?.firstAudioTime ? timings.firstAudioTime - timings.sessionStart : 0;
    const connectionTime = timings?.connectionStart ? timings.connectionStart - timings.sessionStart : 0;
    const firstResponseTime = timings?.firstResponseTime ? timings.firstResponseTime - timings.sessionStart : 0;
    const averageResponseTime = timings?.responseTimes.length ? 
      timings.responseTimes.reduce((sum, time) => sum + time, 0) / timings.responseTimes.length : 0;
    
    const audioDuration = usage.audioMinutes * 60 * 1000; // Convert to milliseconds
    const tokensPerSecond = usage.tokensInput > 0 ? usage.tokensInput / (audioDuration / 1000) : 0;
    const tokenEfficiency = usage.tokensInput > 0 ? usage.tokensInput / usage.audioMinutes : 0;
    const cacheHitRate = usage.tokensInput > 0 ? (usage.tokensCached / usage.tokensInput) * 100 : 0;
    
    const toolCallLatency = timings?.toolCallTimes.length ? 
      timings.toolCallTimes.reduce((sum, time) => sum + time, 0) / timings.toolCallTimes.length : 0;
    const toolSuccessRate = usage.toolCalls > 0 ? 100 : 0; // Simplified - assume all tool calls succeed
    const retrievalLatency = timings?.retrievalTimes.length ? 
      timings.retrievalTimes.reduce((sum, time) => sum + time, 0) / timings.retrievalTimes.length : 0;
    
    // Calculate cost metrics
    const costPerMinute = usage.audioMinutes > 0 ? usage.estimatedCost / usage.audioMinutes : 0;
    const costEfficiency = usage.tokensInput > 0 ? usage.estimatedCost / usage.tokensInput : 0;
    
    // Assess audio quality based on latency and duration
    const audioQuality = this.assessAudioQuality(audioDuration, averageResponseTime);
    
    // Get system metrics (simplified)
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    const networkLatency = this.getNetworkLatency();
    
    const performanceMetrics: PerformanceMetrics = {
      sessionId,
      userId: usage.userId,
      timestamp: now,
      ttfa,
      connectionTime,
      firstResponseTime,
      averageResponseTime,
      audioDuration,
      audioQuality,
      audioLatency: averageResponseTime,
      tokensPerSecond,
      tokenEfficiency,
      cacheHitRate,
      toolCallLatency,
      toolSuccessRate,
      retrievalLatency,
      memoryUsage,
      cpuUsage,
      networkLatency,
      costPerMinute,
      costEfficiency,
      totalCost: usage.estimatedCost
    };
    
    this.metrics.set(sessionId, performanceMetrics);
    return performanceMetrics;
  }

  async collectRealtimeMetrics(sessionId: string, metrics: Partial<PerformanceMetrics>): Promise<void> {
    const existing = this.realtimeMetrics.get(sessionId) || {};
    this.realtimeMetrics.set(sessionId, { ...existing, ...metrics });
  }

  async getSessionMetrics(sessionId: string): Promise<PerformanceMetrics | null> {
    return this.metrics.get(sessionId) || null;
  }

  async getAggregatedMetrics(period: 'hour' | 'day' | 'week' | 'month', startTime: number, endTime: number): Promise<MetricsAggregation> {
    const sessionMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.timestamp >= startTime && metric.timestamp <= endTime);
    
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
        averageAudioQuality: 0
      };
    }
    
    const totalSessions = sessionMetrics.length;
    const activeSessions = this.realtimeMetrics.size;
    const completedSessions = sessionMetrics.length;
    const failedSessions = 0; // Simplified - assume no failures
    
    const averageTtfa = sessionMetrics.reduce((sum, m) => sum + m.ttfa, 0) / totalSessions;
    const averageConnectionTime = sessionMetrics.reduce((sum, m) => sum + m.connectionTime, 0) / totalSessions;
    const averageResponseTime = sessionMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / totalSessions;
    const averageAudioDuration = sessionMetrics.reduce((sum, m) => sum + m.audioDuration, 0) / totalSessions;
    
    const totalAudioMinutes = sessionMetrics.reduce((sum, m) => sum + (m.audioDuration / 60000), 0);
    const totalTokens = sessionMetrics.reduce((sum, m) => sum + (m.tokenEfficiency * (m.audioDuration / 60000)), 0);
    const totalToolCalls = sessionMetrics.reduce((sum, m) => sum + (m.toolSuccessRate / 100 * 10), 0); // Simplified
    const totalRetrievals = sessionMetrics.reduce((sum, m) => sum + (m.retrievalLatency > 0 ? 1 : 0), 0);
    
    const totalCost = sessionMetrics.reduce((sum, m) => sum + m.totalCost, 0);
    const averageCostPerSession = totalCost / totalSessions;
    const averageCostPerMinute = totalAudioMinutes > 0 ? totalCost / totalAudioMinutes : 0;
    
    const averageCacheHitRate = sessionMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalSessions;
    const averageToolSuccessRate = sessionMetrics.reduce((sum, m) => sum + m.toolSuccessRate, 0) / totalSessions;
    const averageAudioQuality = sessionMetrics.reduce((sum, m) => sum + this.audioQualityToNumber(m.audioQuality), 0) / totalSessions;
    
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
      averageAudioQuality
    };
  }

  async exportMetrics(sessionIds: string[], format: 'json' | 'csv'): Promise<string> {
    const metrics = sessionIds
      .map(id => this.metrics.get(id))
      .filter((metric): metric is PerformanceMetrics => metric !== undefined);
    
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    } else {
      // CSV format
      const headers = [
        'sessionId', 'userId', 'timestamp', 'ttfa', 'connectionTime', 'firstResponseTime',
        'averageResponseTime', 'audioDuration', 'audioQuality', 'tokensPerSecond',
        'tokenEfficiency', 'cacheHitRate', 'toolCallLatency', 'toolSuccessRate',
        'retrievalLatency', 'memoryUsage', 'cpuUsage', 'networkLatency',
        'costPerMinute', 'costEfficiency', 'totalCost'
      ];
      
      const rows = metrics.map(metric => [
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
        metric.totalCost
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  async cleanupOldMetrics(olderThanDays: number): Promise<void> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    for (const [sessionId, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffTime) {
        this.metrics.delete(sessionId);
        this.realtimeMetrics.delete(sessionId);
        this.sessionTimings.delete(sessionId);
      }
    }
  }

  // Helper methods for tracking session events
  startSession(sessionId: string): void {
    this.sessionTimings.set(sessionId, {
      sessionStart: Date.now(),
      responseTimes: [],
      toolCallTimes: [],
      retrievalTimes: []
    });
  }

  recordConnection(sessionId: string): void {
    const timings = this.sessionTimings.get(sessionId);
    if (timings) {
      timings.connectionStart = Date.now();
    }
  }

  recordFirstAudio(sessionId: string): void {
    const timings = this.sessionTimings.get(sessionId);
    if (timings) {
      timings.firstAudioTime = Date.now();
    }
  }

  recordResponse(sessionId: string, responseTime: number): void {
    const timings = this.sessionTimings.get(sessionId);
    if (timings) {
      timings.responseTimes.push(responseTime);
      if (!timings.firstResponseTime) {
        timings.firstResponseTime = Date.now();
      }
    }
  }

  recordToolCall(sessionId: string, latency: number): void {
    const timings = this.sessionTimings.get(sessionId);
    if (timings) {
      timings.toolCallTimes.push(latency);
    }
  }

  recordRetrieval(sessionId: string, latency: number): void {
    const timings = this.sessionTimings.get(sessionId);
    if (timings) {
      timings.retrievalTimes.push(latency);
    }
  }

  endSession(sessionId: string): void {
    this.sessionTimings.delete(sessionId);
    this.realtimeMetrics.delete(sessionId);
  }

  // Private helper methods
  private assessAudioQuality(duration: number, responseTime: number): 'low' | 'medium' | 'high' {
    // Simple quality assessment based on response time and duration
    if (responseTime < 500 && duration > 10000) return 'high';
    if (responseTime < 1000 && duration > 5000) return 'medium';
    return 'low';
  }

  private audioQualityToNumber(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 1;
    }
  }

  private getMemoryUsage(): number {
    // Simplified memory usage calculation
    return process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
  }

  private getCpuUsage(): number {
    // Simplified CPU usage - in a real implementation, this would use os.cpus()
    return Math.random() * 100; // Placeholder
  }

  private getNetworkLatency(): number {
    // Simplified network latency - in a real implementation, this would ping a server
    return Math.random() * 100; // Placeholder
  }

  // Helper method to get real-time metrics for a session
  getRealtimeMetrics(sessionId: string): Partial<PerformanceMetrics> | null {
    return this.realtimeMetrics.get(sessionId) || null;
  }

  // Helper method to get all active sessions
  getActiveSessions(): string[] {
    return Array.from(this.realtimeMetrics.keys());
  }

  // Helper method to get metrics summary
  getMetricsSummary(): {
    totalSessions: number;
    activeSessions: number;
    averageTtfa: number;
    averageCost: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const activeSessions = this.realtimeMetrics.size;
    
    const averageTtfa = allMetrics.length > 0 ? 
      allMetrics.reduce((sum, m) => sum + m.ttfa, 0) / allMetrics.length : 0;
    
    const averageCost = allMetrics.length > 0 ? 
      allMetrics.reduce((sum, m) => sum + m.totalCost, 0) / allMetrics.length : 0;
    
    return {
      totalSessions: allMetrics.length,
      activeSessions,
      averageTtfa,
      averageCost
    };
  }
}

// Singleton instance
export const metricsCollector = new InMemoryMetricsCollector();

// Helper functions
export function startSessionMetrics(sessionId: string): void {
  metricsCollector.startSession(sessionId);
}

export function recordConnectionMetrics(sessionId: string): void {
  metricsCollector.recordConnection(sessionId);
}

export function recordAudioMetrics(sessionId: string): void {
  metricsCollector.recordFirstAudio(sessionId);
}

export function recordResponseMetrics(sessionId: string, responseTime: number): void {
  metricsCollector.recordResponse(sessionId, responseTime);
}

export function recordToolCallMetrics(sessionId: string, latency: number): void {
  metricsCollector.recordToolCall(sessionId, latency);
}

export function recordRetrievalMetrics(sessionId: string, latency: number): void {
  metricsCollector.recordRetrieval(sessionId, latency);
}

export function endSessionMetrics(sessionId: string): void {
  metricsCollector.endSession(sessionId);
}
