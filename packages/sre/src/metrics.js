import { ConsoleLogger } from "@thrive/realtime-observability";
export class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.logger = new ConsoleLogger();
        this.maxMetrics = 10000; // Keep last 10k metrics in memory
        this.aggregationInterval = 60000; // 1 minute
        this.aggregatedMetrics = [];
        this.logger.info("Metrics Collector initialized");
        this.startAggregationTimer();
    }
    recordMetric(metric) {
        const fullMetric = {
            ...metric,
            timestamp: Date.now(),
        };
        this.metrics.push(fullMetric);
        // Keep only the most recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        this.logger.debug("Metric recorded", {
            type: metric.type,
            value: metric.value,
            success: metric.success,
        });
    }
    // Convenience methods for common metrics
    recordTTFA(sessionId, duration, success = true, metadata) {
        this.recordMetric({
            sessionId,
            type: "ttfa",
            value: duration,
            success,
            metadata: { ...metadata, ttfa: duration },
        });
    }
    recordSessionDuration(sessionId, userId, duration, success = true) {
        this.recordMetric({
            sessionId,
            userId,
            type: "session_duration",
            value: duration,
            success,
            metadata: { sessionDuration: duration },
        });
    }
    recordToolExecution(sessionId, toolName, duration, success = true) {
        this.recordMetric({
            sessionId,
            type: "tool_execution",
            value: duration,
            success,
            metadata: { toolName, toolExecution: duration },
        });
    }
    recordAPIResponse(endpoint, duration, success = true, statusCode) {
        this.recordMetric({
            type: "api_response",
            value: duration,
            success,
            metadata: { endpoint, statusCode, apiResponse: duration },
        });
    }
    recordConnection(sessionId, success, retries = 0, metadata) {
        this.recordMetric({
            sessionId,
            type: "connection",
            value: retries,
            success,
            metadata: { retries, ...metadata },
        });
    }
    recordAudioQuality(sessionId, quality, issues = 0) {
        this.recordMetric({
            sessionId,
            type: "audio_quality",
            value: quality,
            success: quality > 0.8, // Consider quality > 80% as success
            metadata: { quality, issues },
        });
    }
    getMetrics(type, since) {
        let filtered = this.metrics;
        if (type) {
            filtered = filtered.filter((m) => m.type === type);
        }
        if (since) {
            filtered = filtered.filter((m) => m.timestamp >= since);
        }
        return [...filtered]; // Return a copy
    }
    getAggregatedMetrics(period = "minute", since) {
        let filtered = this.aggregatedMetrics;
        if (since) {
            filtered = filtered.filter((m) => m.timestamp >= since);
        }
        return filtered.filter((m) => m.period === period);
    }
    startAggregationTimer() {
        setInterval(() => {
            this.aggregateMetrics();
        }, this.aggregationInterval);
    }
    aggregateMetrics() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        // Get metrics from the last minute
        const recentMetrics = this.metrics.filter((m) => m.timestamp >= oneMinuteAgo);
        if (recentMetrics.length === 0) {
            return;
        }
        const aggregated = {
            period: "minute",
            timestamp: now,
            metrics: {
                ttfa: this.aggregateMetricType(recentMetrics, "ttfa"),
                sessionDuration: this.aggregateMetricType(recentMetrics, "session_duration"),
                toolExecution: this.aggregateMetricType(recentMetrics, "tool_execution"),
                apiResponse: this.aggregateMetricType(recentMetrics, "api_response"),
                connection: this.aggregateConnectionMetrics(recentMetrics),
                audioQuality: this.aggregateAudioQualityMetrics(recentMetrics),
            },
        };
        this.aggregatedMetrics.push(aggregated);
        // Keep only last 24 hours of aggregated metrics
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        this.aggregatedMetrics = this.aggregatedMetrics.filter((m) => m.timestamp >= oneDayAgo);
        this.logger.debug("Metrics aggregated", {
            period: "minute",
            metricCount: recentMetrics.length,
            aggregatedCount: this.aggregatedMetrics.length,
        });
    }
    aggregateMetricType(metrics, type) {
        const typeMetrics = metrics.filter((m) => m.type === type);
        if (typeMetrics.length === 0) {
            return { p50: 0, p95: 0, p99: 0, count: 0, successRate: 0 };
        }
        const values = typeMetrics.map((m) => m.value).sort((a, b) => a - b);
        const successCount = typeMetrics.filter((m) => m.success).length;
        const successRate = (successCount / typeMetrics.length) * 100;
        return {
            p50: this.percentile(values, 50),
            p95: this.percentile(values, 95),
            p99: this.percentile(values, 99),
            count: typeMetrics.length,
            successRate: Math.round(successRate * 100) / 100,
        };
    }
    aggregateConnectionMetrics(metrics) {
        const connectionMetrics = metrics.filter((m) => m.type === "connection");
        if (connectionMetrics.length === 0) {
            return { count: 0, successRate: 0, averageRetries: 0 };
        }
        const successCount = connectionMetrics.filter((m) => m.success).length;
        const successRate = (successCount / connectionMetrics.length) * 100;
        const averageRetries = connectionMetrics.reduce((sum, m) => sum + m.value, 0) / connectionMetrics.length;
        return {
            count: connectionMetrics.length,
            successRate: Math.round(successRate * 100) / 100,
            averageRetries: Math.round(averageRetries * 100) / 100,
        };
    }
    aggregateAudioQualityMetrics(metrics) {
        const audioMetrics = metrics.filter((m) => m.type === "audio_quality");
        if (audioMetrics.length === 0) {
            return { count: 0, averageQuality: 0, issues: 0 };
        }
        const averageQuality = audioMetrics.reduce((sum, m) => sum + m.value, 0) / audioMetrics.length;
        const issues = audioMetrics.reduce((sum, m) => sum + (m.metadata?.issues || 0), 0);
        return {
            count: audioMetrics.length,
            averageQuality: Math.round(averageQuality * 100) / 100,
            issues,
        };
    }
    percentile(sortedValues, p) {
        if (sortedValues.length === 0)
            return 0;
        const index = (p / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedValues[lower];
        }
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    // Get current performance summary
    getPerformanceSummary() {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recentMetrics = this.metrics.filter((m) => m.timestamp >= oneHourAgo);
        return {
            ttfa: this.aggregateMetricType(recentMetrics, "ttfa"),
            sessionDuration: this.aggregateMetricType(recentMetrics, "session_duration"),
            toolExecution: this.aggregateMetricType(recentMetrics, "tool_execution"),
            apiResponse: this.aggregateMetricType(recentMetrics, "api_response"),
        };
    }
    // Clear old metrics
    clearOldMetrics(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        const beforeCount = this.metrics.length;
        this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
        const afterCount = this.metrics.length;
        this.logger.info("Old metrics cleared", {
            beforeCount,
            afterCount,
            clearedCount: beforeCount - afterCount,
        });
    }
}
// Singleton instance
export const metricsCollector = new MetricsCollector();
