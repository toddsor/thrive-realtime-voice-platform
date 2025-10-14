// Default session limits by tier
export const DEFAULT_SESSION_LIMITS = {
    free: {
        maxDurationMs: 10 * 60 * 1000, // 10 minutes
        warningThresholds: [0.7, 0.9], // 70%, 90%
        gracePeriodMs: 30 * 1000, // 30 seconds
        allowExtension: false,
        maxExtensions: 0
    },
    paid: {
        maxDurationMs: 30 * 60 * 1000, // 30 minutes
        warningThresholds: [0.8, 0.9], // 80%, 90%
        gracePeriodMs: 60 * 1000, // 1 minute
        allowExtension: true,
        maxExtensions: 2
    },
    enterprise: {
        maxDurationMs: 60 * 60 * 1000, // 60 minutes
        warningThresholds: [0.8, 0.9], // 80%, 90%
        gracePeriodMs: 120 * 1000, // 2 minutes
        allowExtension: true,
        maxExtensions: 5
    }
};
export class SessionLimitManager {
    constructor(limits = DEFAULT_SESSION_LIMITS) {
        this.activeSessions = new Map();
        this.limits = limits;
    }
    startSession(sessionId, tier) {
        this.activeSessions.set(sessionId, {
            startTime: Date.now(),
            tier,
            warningsTriggered: [],
            extensionsUsed: 0
        });
    }
    endSession(sessionId) {
        this.activeSessions.delete(sessionId);
    }
    getSessionStatus(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return null;
        const now = Date.now();
        const elapsedMs = now - session.startTime;
        const config = this.limits[session.tier];
        const remainingMs = Math.max(0, config.maxDurationMs - elapsedMs);
        const percentComplete = Math.min(1, elapsedMs / config.maxDurationMs);
        // Check if grace period is active
        const gracePeriodActive = session.gracePeriodStart
            ? (now - session.gracePeriodStart) < config.gracePeriodMs
            : false;
        // Calculate time until disconnect
        let timeUntilDisconnect = remainingMs;
        if (gracePeriodActive && session.gracePeriodStart) {
            timeUntilDisconnect = config.gracePeriodMs - (now - session.gracePeriodStart);
        }
        return {
            isActive: true,
            elapsedMs,
            remainingMs,
            percentComplete,
            warningsTriggered: [...session.warningsTriggered],
            canExtend: config.allowExtension && session.extensionsUsed < config.maxExtensions,
            extensionsUsed: session.extensionsUsed,
            maxExtensions: config.maxExtensions,
            gracePeriodActive,
            timeUntilDisconnect
        };
    }
    checkWarnings(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return [];
        const status = this.getSessionStatus(sessionId);
        if (!status)
            return [];
        const config = this.limits[session.tier];
        const newWarnings = [];
        for (const threshold of config.warningThresholds) {
            if (status.percentComplete >= threshold && !session.warningsTriggered.includes(threshold)) {
                newWarnings.push(threshold);
                session.warningsTriggered.push(threshold);
            }
        }
        return newWarnings;
    }
    shouldDisconnect(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return false;
        const status = this.getSessionStatus(sessionId);
        if (!status)
            return false;
        // If in grace period, check if grace period has expired
        if (status.gracePeriodActive) {
            return status.timeUntilDisconnect <= 0;
        }
        // If past max duration, start grace period
        if (status.percentComplete >= 1) {
            if (!session.gracePeriodStart) {
                session.gracePeriodStart = Date.now();
            }
            return false; // Don't disconnect immediately, grace period starts
        }
        return false;
    }
    requestExtension(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return false;
        const config = this.limits[session.tier];
        if (!config.allowExtension || session.extensionsUsed >= config.maxExtensions) {
            return false;
        }
        session.extensionsUsed++;
        // Extend session by 10 minutes
        session.startTime -= 10 * 60 * 1000;
        return true;
    }
    getTimeUntilWarning(sessionId, threshold) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return -1;
        const config = this.limits[session.tier];
        const elapsedMs = Date.now() - session.startTime;
        const warningTime = config.maxDurationMs * threshold;
        const timeUntilWarning = warningTime - elapsedMs;
        return Math.max(0, timeUntilWarning);
    }
    getTimeUntilDisconnect(sessionId) {
        const status = this.getSessionStatus(sessionId);
        if (!status)
            return -1;
        return status.timeUntilDisconnect;
    }
    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }
    formatTimeRemaining(ms) {
        if (ms <= 0)
            return '0s';
        return this.formatDuration(ms);
    }
    // Helper to get user tier from environment or user data
    static getUserTier(_userId) {
        // In a real implementation, this would check user subscription status
        // For now, return 'free' as default
        return 'free';
    }
    // Helper to get custom limits from environment
    static getCustomLimits() {
        const customLimits = {};
        // Check for environment overrides
        const freeLimit = process.env.SESSION_LIMIT_FREE_MINUTES;
        if (freeLimit) {
            customLimits.free = {
                ...DEFAULT_SESSION_LIMITS.free,
                maxDurationMs: parseInt(freeLimit) * 60 * 1000
            };
        }
        const paidLimit = process.env.SESSION_LIMIT_PAID_MINUTES;
        if (paidLimit) {
            customLimits.paid = {
                ...DEFAULT_SESSION_LIMITS.paid,
                maxDurationMs: parseInt(paidLimit) * 60 * 1000
            };
        }
        const enterpriseLimit = process.env.SESSION_LIMIT_ENTERPRISE_MINUTES;
        if (enterpriseLimit) {
            customLimits.enterprise = {
                ...DEFAULT_SESSION_LIMITS.enterprise,
                maxDurationMs: parseInt(enterpriseLimit) * 60 * 1000
            };
        }
        return customLimits;
    }
}
// Singleton instance
export const sessionLimitManager = new SessionLimitManager();
// Helper functions
export function getSessionLimitForTier(tier) {
    return DEFAULT_SESSION_LIMITS[tier];
}
export function isSessionLimitExceeded(sessionId) {
    return sessionLimitManager.shouldDisconnect(sessionId);
}
export function getSessionTimeRemaining(sessionId) {
    const status = sessionLimitManager.getSessionStatus(sessionId);
    return status ? status.timeUntilDisconnect : 0;
}
export function formatSessionDuration(ms) {
    return sessionLimitManager.formatDuration(ms);
}
