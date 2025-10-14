// Default quota configuration
const DEFAULT_QUOTA_CONFIG = {
    free: {
        dailyMinutes: 30, // 30 minutes per day
        monthlyMinutes: 300, // 5 hours per month
    },
    paid: {
        dailyMinutes: 120, // 2 hours per day
        monthlyMinutes: 1800, // 30 hours per month
    },
    enterprise: {
        dailyMinutes: 480, // 8 hours per day
        monthlyMinutes: 7200, // 120 hours per month
    },
};
export class InMemoryQuotaManager {
    constructor(config = DEFAULT_QUOTA_CONFIG) {
        this.quotas = new Map();
        this.config = config;
        this.startCleanupInterval();
    }
    startCleanupInterval() {
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredQuotas();
        }, 60 * 60 * 1000);
    }
    getQuotaKey(userId, period) {
        return `${userId}:${period}`;
    }
    getResetTime(period) {
        const now = new Date();
        if (period === "day") {
            // Reset at midnight
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.getTime();
        }
        else {
            // Reset at start of next month
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            nextMonth.setHours(0, 0, 0, 0);
            return nextMonth.getTime();
        }
    }
    getMaxMinutes(tier, period) {
        return period === "day" ? this.config[tier].dailyMinutes : this.config[tier].monthlyMinutes;
    }
    async checkQuota(userId, tier, period) {
        const quotaKey = this.getQuotaKey(userId, period);
        let quota = this.quotas.get(quotaKey);
        // Check if quota exists and is not expired
        const now = Date.now();
        if (!quota || now >= quota.resetAt) {
            // Create new quota
            const newQuota = {
                userId,
                period,
                maxMinutes: this.getMaxMinutes(tier, period),
                usedMinutes: 0,
                resetAt: this.getResetTime(period),
                tier,
            };
            this.quotas.set(quotaKey, newQuota);
            quota = newQuota;
        }
        const remaining = Math.max(0, quota.maxMinutes - quota.usedMinutes);
        const percentUsed = (quota.usedMinutes / quota.maxMinutes) * 100;
        return {
            allowed: remaining > 0,
            remaining,
            resetAt: quota.resetAt,
            percentUsed,
            tier,
        };
    }
    async consumeQuota(userId, minutes, period) {
        const quotaKey = this.getQuotaKey(userId, period);
        const quota = this.quotas.get(quotaKey);
        // Check if quota exists and is not expired
        const now = Date.now();
        if (!quota || now >= quota.resetAt) {
            // This shouldn't happen if checkQuota was called first
            return false;
        }
        // Check if there's enough quota remaining
        const remaining = quota.maxMinutes - quota.usedMinutes;
        if (remaining < minutes) {
            return false;
        }
        // Consume the quota
        quota.usedMinutes += minutes;
        quota.updatedAt = now;
        this.quotas.set(quotaKey, quota);
        return true;
    }
    async resetQuota(userId, period) {
        const quotaKey = this.getQuotaKey(userId, period);
        const quota = this.quotas.get(quotaKey);
        if (quota) {
            quota.usedMinutes = 0;
            quota.resetAt = this.getResetTime(period);
            quota.updatedAt = Date.now();
            this.quotas.set(quotaKey, quota);
        }
    }
    async getQuotaUsage(userId, period) {
        const quotaKey = this.getQuotaKey(userId, period);
        const quota = this.quotas.get(quotaKey);
        if (!quota)
            return null;
        // Check if quota is expired
        const now = Date.now();
        if (now >= quota.resetAt) {
            return null;
        }
        return { ...quota };
    }
    async getAllUserQuotas(userId) {
        const userQuotas = [];
        for (const [, quota] of this.quotas.entries()) {
            if (quota.userId === userId) {
                // Check if quota is not expired
                const now = Date.now();
                if (now < quota.resetAt) {
                    userQuotas.push({ ...quota });
                }
            }
        }
        return userQuotas;
    }
    async cleanupExpiredQuotas() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, quota] of this.quotas.entries()) {
            if (now >= quota.resetAt) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach((key) => {
            this.quotas.delete(key);
        });
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired quotas`);
        }
    }
    // Helper method to get quota status for display
    async getQuotaStatus(userId, tier) {
        const [daily, monthly] = await Promise.all([
            this.checkQuota(userId, tier, "day"),
            this.checkQuota(userId, tier, "month"),
        ]);
        return { daily, monthly };
    }
    // Helper method to check if user can start a session
    async canStartSession(userId, tier, estimatedMinutes = 10) {
        const { daily, monthly } = await this.getQuotaStatus(userId, tier);
        // Check daily quota
        if (!daily.allowed || daily.remaining < estimatedMinutes) {
            return {
                allowed: false,
                reason: "Daily quota exceeded",
                dailyStatus: daily,
                monthlyStatus: monthly,
            };
        }
        // Check monthly quota
        if (!monthly.allowed || monthly.remaining < estimatedMinutes) {
            return {
                allowed: false,
                reason: "Monthly quota exceeded",
                dailyStatus: daily,
                monthlyStatus: monthly,
            };
        }
        return {
            allowed: true,
            dailyStatus: daily,
            monthlyStatus: monthly,
        };
    }
    // Helper method to get quota configuration
    getQuotaConfig() {
        return { ...this.config };
    }
    // Helper method to update quota configuration
    updateQuotaConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
// Singleton instance
export const quotaManager = new InMemoryQuotaManager();
// Helper functions
export async function checkUserQuota(userId, tier, period) {
    return quotaManager.checkQuota(userId, tier, period);
}
export async function consumeUserQuota(userId, minutes, period) {
    return quotaManager.consumeQuota(userId, minutes, period);
}
export async function canUserStartSession(userId, tier, estimatedMinutes = 10) {
    return quotaManager.canStartSession(userId, tier, estimatedMinutes);
}
export function formatQuotaRemaining(remaining) {
    if (remaining <= 0)
        return "0 minutes";
    if (remaining < 60)
        return `${Math.round(remaining)} minutes`;
    const hours = Math.floor(remaining / 60);
    const minutes = Math.round(remaining % 60);
    if (minutes === 0) {
        return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${hours}h ${minutes}m`;
}
export function formatQuotaPercent(percent) {
    return `${Math.round(percent)}%`;
}
