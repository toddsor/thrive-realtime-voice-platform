// OpenAI Realtime API pricing (as of 2024)
const DEFAULT_COST_RATES = {
    audioPerMinute: 0.01, // $0.01 per minute of audio
    inputTokenPer1k: 0.0005, // $0.0005 per 1k input tokens
    outputTokenPer1k: 0.0015, // $0.0015 per 1k output tokens
    cachedTokenDiscount: 0.5, // 50% discount for cached tokens
    toolCallOverhead: 0.001, // $0.001 per tool call
    retrievalOverhead: 0.002, // $0.002 per retrieval
    sessionOverhead: 0.005, // $0.005 per session
    connectionOverhead: 0.001 // $0.001 per connection
};
export class CostEstimator {
    constructor(rates = DEFAULT_COST_RATES) {
        this.estimates = new Map();
        this.rates = rates;
    }
    estimateSessionCost(usage) {
        const audioCost = usage.audioMinutes * this.rates.audioPerMinute;
        const inputTokenCost = (usage.tokensInput / 1000) * this.rates.inputTokenPer1k;
        const outputTokenCost = (usage.tokensOutput / 1000) * this.rates.outputTokenPer1k;
        const cachedTokenDiscount = (usage.tokensCached / 1000) * this.rates.inputTokenPer1k * this.rates.cachedTokenDiscount;
        const toolCallCost = usage.toolCalls * this.rates.toolCallOverhead;
        const retrievalCost = usage.retrievals * this.rates.retrievalOverhead;
        const sessionOverhead = this.rates.sessionOverhead;
        const connectionOverhead = this.rates.connectionOverhead;
        const totalCost = Math.max(0, audioCost +
            inputTokenCost +
            outputTokenCost -
            cachedTokenDiscount +
            toolCallCost +
            retrievalCost +
            sessionOverhead +
            connectionOverhead);
        return {
            audioCost,
            inputTokenCost,
            outputTokenCost,
            cachedTokenDiscount,
            toolCallCost,
            retrievalCost,
            sessionOverhead,
            connectionOverhead,
            totalCost
        };
    }
    estimateRealtimeCost(usage) {
        const fullUsage = {
            sessionId: usage.sessionId || 'unknown',
            userId: usage.userId || 'unknown',
            startTime: usage.startTime || Date.now(),
            endTime: usage.endTime,
            durationMs: usage.durationMs || 0,
            audioMinutes: usage.audioMinutes || 0,
            tokensInput: usage.tokensInput || 0,
            tokensOutput: usage.tokensOutput || 0,
            tokensCached: usage.tokensCached || 0,
            toolCalls: usage.toolCalls || 0,
            retrievals: usage.retrievals || 0,
            estimatedCost: 0,
            createdAt: usage.createdAt || Date.now(),
            updatedAt: usage.updatedAt || Date.now()
        };
        return this.estimateSessionCost(fullUsage);
    }
    getCostEstimate(sessionId) {
        return this.estimates.get(sessionId) || null;
    }
    updateCostEstimate(sessionId, usage) {
        const breakdown = this.estimateSessionCost(usage);
        const confidence = this.calculateConfidence(usage);
        const estimate = {
            sessionId,
            estimatedCost: breakdown.totalCost,
            breakdown,
            confidence,
            lastUpdated: Date.now()
        };
        this.estimates.set(sessionId, estimate);
        return estimate;
    }
    calculateConfidence(usage) {
        // High confidence if we have complete data
        if (usage.endTime && usage.tokensInput > 0 && usage.tokensOutput > 0) {
            return 'high';
        }
        // Medium confidence if we have partial data
        if (usage.tokensInput > 0 || usage.tokensOutput > 0 || usage.audioMinutes > 0) {
            return 'medium';
        }
        // Low confidence if we have minimal data
        return 'low';
    }
    // Helper method to estimate cost for a planned session
    estimatePlannedSession(durationMinutes, estimatedTokens = 1000) {
        const usage = {
            sessionId: 'planned',
            userId: 'unknown',
            startTime: Date.now(),
            durationMs: durationMinutes * 60 * 1000,
            audioMinutes: durationMinutes,
            tokensInput: estimatedTokens * 0.6, // Assume 60% input tokens
            tokensOutput: estimatedTokens * 0.4, // Assume 40% output tokens
            tokensCached: 0,
            toolCalls: 0,
            retrievals: 0
        };
        return this.estimateRealtimeCost(usage);
    }
    // Helper method to get cost per minute
    getCostPerMinute(usage) {
        if (usage.audioMinutes <= 0)
            return 0;
        const breakdown = this.estimateSessionCost(usage);
        return breakdown.totalCost / usage.audioMinutes;
    }
    // Helper method to format cost for display
    formatCost(cost) {
        if (cost < 0.001) {
            return `$${(cost * 1000).toFixed(2)}m`; // Show in millicents
        }
        return `$${cost.toFixed(4)}`;
    }
    // Helper method to get cost summary
    getCostSummary(usage) {
        const breakdown = this.estimateSessionCost(usage);
        const costPerMinute = this.getCostPerMinute(usage);
        return {
            totalCost: this.formatCost(breakdown.totalCost),
            costPerMinute: this.formatCost(costPerMinute),
            breakdown: {
                audio: this.formatCost(breakdown.audioCost),
                tokens: this.formatCost(breakdown.inputTokenCost + breakdown.outputTokenCost - breakdown.cachedTokenDiscount),
                tools: this.formatCost(breakdown.toolCallCost + breakdown.retrievalCost),
                overhead: this.formatCost(breakdown.sessionOverhead + breakdown.connectionOverhead)
            }
        };
    }
    // Helper method to calculate potential savings from caching
    calculateCachingSavings(usage) {
        const currentBreakdown = this.estimateSessionCost(usage);
        // Calculate cost with full caching (assuming 50% of input tokens are cached)
        const cachedUsage = {
            ...usage,
            tokensCached: usage.tokensInput * 0.5
        };
        const cachedBreakdown = this.estimateSessionCost(cachedUsage);
        const savings = currentBreakdown.totalCost - cachedBreakdown.totalCost;
        const savingsPercent = (savings / currentBreakdown.totalCost) * 100;
        return {
            currentCost: currentBreakdown.totalCost,
            withCaching: cachedBreakdown.totalCost,
            savings,
            savingsPercent
        };
    }
    // Helper method to get cost trends
    getCostTrends(sessions) {
        if (sessions.length === 0) {
            return {
                averageCost: 0,
                costTrend: 'stable',
                averageCostPerMinute: 0,
                totalCost: 0
            };
        }
        const costs = sessions.map(session => this.estimateSessionCost(session).totalCost);
        const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
        const averageCost = totalCost / sessions.length;
        const costPerMinute = sessions.map(session => this.getCostPerMinute(session));
        const averageCostPerMinute = costPerMinute.reduce((sum, cost) => sum + cost, 0) / sessions.length;
        // Calculate trend (simple linear regression)
        let trend = 'stable';
        if (sessions.length >= 2) {
            const firstHalf = costs.slice(0, Math.floor(costs.length / 2));
            const secondHalf = costs.slice(Math.floor(costs.length / 2));
            const firstHalfAvg = firstHalf.reduce((sum, cost) => sum + cost, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, cost) => sum + cost, 0) / secondHalf.length;
            const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
            if (change > 0.1)
                trend = 'increasing';
            else if (change < -0.1)
                trend = 'decreasing';
        }
        return {
            averageCost,
            costTrend: trend,
            averageCostPerMinute,
            totalCost
        };
    }
    // Helper method to update cost rates
    updateCostRates(newRates) {
        this.rates = { ...this.rates, ...newRates };
    }
    // Helper method to get current cost rates
    getCostRates() {
        return { ...this.rates };
    }
    // Cleanup old estimates
    cleanupOldEstimates(olderThanHours = 24) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        for (const [sessionId, estimate] of this.estimates.entries()) {
            if (estimate.lastUpdated < cutoffTime) {
                this.estimates.delete(sessionId);
            }
        }
    }
}
// Singleton instance
export const costEstimator = new CostEstimator();
// Helper functions
export function estimateSessionCost(usage) {
    return costEstimator.estimateSessionCost(usage);
}
export function formatCost(cost) {
    return costEstimator.formatCost(cost);
}
export function getCostSummary(usage) {
    return costEstimator.getCostSummary(usage);
}
export function calculateCachingSavings(usage) {
    return costEstimator.calculateCachingSavings(usage);
}
