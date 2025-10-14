export class InMemoryUsageTracker {
    constructor() {
        this.sessions = new Map();
        this.metrics = new Map();
        this.costRates = {
            audioPerMinute: 0.01, // $0.01 per minute
            inputTokenPer1k: 0.0005, // $0.0005 per 1k tokens
            outputTokenPer1k: 0.0015, // $0.0015 per 1k tokens
            cachedTokenDiscount: 0.5, // 50% discount for cached tokens
            toolCallOverhead: 0.001, // $0.001 per tool call
            retrievalOverhead: 0.002 // $0.002 per retrieval
        };
    }
    async trackSessionStart(sessionId, userId) {
        const now = Date.now();
        const sessionUsage = {
            sessionId,
            userId,
            startTime: now,
            durationMs: 0,
            audioMinutes: 0,
            tokensInput: 0,
            tokensOutput: 0,
            tokensCached: 0,
            toolCalls: 0,
            retrievals: 0,
            estimatedCost: 0,
            createdAt: now,
            updatedAt: now
        };
        this.sessions.set(sessionId, sessionUsage);
        console.log('📊 Client-side usage tracker: Session started', {
            sessionId,
            userId,
            totalSessions: this.sessions.size,
            availableSessions: Array.from(this.sessions.keys())
        });
    }
    async trackSessionEnd(sessionId, endTime) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const now = endTime || Date.now();
        session.endTime = now;
        session.durationMs = now - session.startTime;
        session.updatedAt = now;
        // Calculate final cost
        session.estimatedCost = await this.calculateSessionCost(sessionId);
    }
    async trackAudioDuration(sessionId, durationMs) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.audioMinutes = durationMs / (1000 * 60); // Convert to minutes
        session.updatedAt = Date.now();
    }
    async trackTokens(sessionId, input, output, cached = 0) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.tokensInput += input;
        session.tokensOutput += output;
        session.tokensCached += cached;
        session.updatedAt = Date.now();
    }
    async trackToolCall(sessionId, toolName, latencyMs) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.toolCalls += 1;
        session.updatedAt = Date.now();
        // Track detailed metrics
        const metrics = this.metrics.get(sessionId) || [];
        metrics.push({
            sessionId,
            userId: session.userId,
            timestamp: Date.now(),
            audioDurationMs: 0,
            tokensInput: 0,
            tokensOutput: 0,
            tokensCached: 0,
            toolCalls: 1,
            retrievals: 0,
            latencyMs,
            costEstimate: this.costRates.toolCallOverhead
        });
        this.metrics.set(sessionId, metrics);
    }
    async trackRetrieval(sessionId, query, resultsCount, latencyMs) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.retrievals += 1;
        session.updatedAt = Date.now();
        // Track detailed metrics
        const metrics = this.metrics.get(sessionId) || [];
        metrics.push({
            sessionId,
            userId: session.userId,
            timestamp: Date.now(),
            audioDurationMs: 0,
            tokensInput: 0,
            tokensOutput: 0,
            tokensCached: 0,
            toolCalls: 0,
            retrievals: 1,
            latencyMs,
            costEstimate: this.costRates.retrievalOverhead
        });
        this.metrics.set(sessionId, metrics);
    }
    async getSessionUsage(sessionId) {
        const session = this.sessions.get(sessionId);
        console.log('📊 Usage tracker: Getting session', {
            sessionId,
            found: !!session,
            totalSessions: this.sessions.size,
            availableSessions: Array.from(this.sessions.keys())
        });
        return session || null;
    }
    async getUserUsage(userId, period) {
        const now = Date.now();
        const startOfPeriod = period === 'day'
            ? new Date().setHours(0, 0, 0, 0)
            : new Date().setDate(1);
        const userSessions = Array.from(this.sessions.values())
            .filter(session => session.userId === userId &&
            session.createdAt >= startOfPeriod);
        const totalSessions = userSessions.length;
        const totalAudioMinutes = userSessions.reduce((sum, s) => sum + s.audioMinutes, 0);
        const totalTokensInput = userSessions.reduce((sum, s) => sum + s.tokensInput, 0);
        const totalTokensOutput = userSessions.reduce((sum, s) => sum + s.tokensOutput, 0);
        const totalTokensCached = userSessions.reduce((sum, s) => sum + s.tokensCached, 0);
        const totalToolCalls = userSessions.reduce((sum, s) => sum + s.toolCalls, 0);
        const totalRetrievals = userSessions.reduce((sum, s) => sum + s.retrievals, 0);
        const totalCost = userSessions.reduce((sum, s) => sum + s.estimatedCost, 0);
        const averageSessionDuration = totalSessions > 0
            ? userSessions.reduce((sum, s) => sum + s.durationMs, 0) / totalSessions
            : 0;
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
            averageCostPerSession
        };
    }
    async getAllUserUsage(userId) {
        return Array.from(this.sessions.values())
            .filter(session => session.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    async calculateSessionCost(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return 0;
        const audioCost = session.audioMinutes * this.costRates.audioPerMinute;
        const inputTokenCost = (session.tokensInput / 1000) * this.costRates.inputTokenPer1k;
        const outputTokenCost = (session.tokensOutput / 1000) * this.costRates.outputTokenPer1k;
        const cachedTokenDiscount = (session.tokensCached / 1000) * this.costRates.inputTokenPer1k * this.costRates.cachedTokenDiscount;
        const toolCallCost = session.toolCalls * this.costRates.toolCallOverhead;
        const retrievalCost = session.retrievals * this.costRates.retrievalOverhead;
        return Math.max(0, audioCost + inputTokenCost + outputTokenCost - cachedTokenDiscount + toolCallCost + retrievalCost);
    }
    async cleanupOldUsage(olderThanDays) {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.createdAt < cutoffTime) {
                this.sessions.delete(sessionId);
                this.metrics.delete(sessionId);
            }
        }
    }
    // Helper method to get real-time session cost
    getCurrentSessionCost(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return 0;
        const now = Date.now();
        const currentDurationMs = now - session.startTime;
        const currentAudioMinutes = currentDurationMs / (1000 * 60);
        const audioCost = currentAudioMinutes * this.costRates.audioPerMinute;
        const inputTokenCost = (session.tokensInput / 1000) * this.costRates.inputTokenPer1k;
        const outputTokenCost = (session.tokensOutput / 1000) * this.costRates.outputTokenPer1k;
        const cachedTokenDiscount = (session.tokensCached / 1000) * this.costRates.inputTokenPer1k * this.costRates.cachedTokenDiscount;
        const toolCallCost = session.toolCalls * this.costRates.toolCallOverhead;
        const retrievalCost = session.retrievals * this.costRates.retrievalOverhead;
        return Math.max(0, audioCost + inputTokenCost + outputTokenCost - cachedTokenDiscount + toolCallCost + retrievalCost);
    }
    // Helper method to get session duration
    getCurrentSessionDuration(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return 0;
        const now = Date.now();
        return now - session.startTime;
    }
}
// Singleton instance
export const usageTracker = new InMemoryUsageTracker();
