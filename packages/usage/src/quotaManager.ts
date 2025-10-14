import { UserQuota, QuotaStatus } from "./usageTracker";

export type UserTier = "free" | "paid" | "enterprise";

export interface QuotaConfig {
  free: {
    dailyMinutes: number;
    monthlyMinutes: number;
  };
  paid: {
    dailyMinutes: number;
    monthlyMinutes: number;
  };
  enterprise: {
    dailyMinutes: number;
    monthlyMinutes: number;
  };
}

export interface QuotaManager {
  checkQuota(userId: string, tier: UserTier, period: "day" | "month"): Promise<QuotaStatus>;
  consumeQuota(userId: string, minutes: number, period: "day" | "month"): Promise<boolean>;
  resetQuota(userId: string, period: "day" | "month"): Promise<void>;
  getQuotaUsage(userId: string, period: "day" | "month"): Promise<UserQuota | null>;
  getAllUserQuotas(userId: string): Promise<UserQuota[]>;
  cleanupExpiredQuotas(): Promise<void>;
}

// Default quota configuration
const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
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

export class InMemoryQuotaManager implements QuotaManager {
  private quotas = new Map<string, UserQuota>();
  private config: QuotaConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: QuotaConfig = DEFAULT_QUOTA_CONFIG) {
    this.config = config;
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredQuotas();
    }, 60 * 60 * 1000);
  }

  private getQuotaKey(userId: string, period: "day" | "month"): string {
    return `${userId}:${period}`;
  }

  private getResetTime(period: "day" | "month"): number {
    const now = new Date();

    if (period === "day") {
      // Reset at midnight
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime();
    } else {
      // Reset at start of next month
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.getTime();
    }
  }

  private getMaxMinutes(tier: UserTier, period: "day" | "month"): number {
    return period === "day" ? this.config[tier].dailyMinutes : this.config[tier].monthlyMinutes;
  }

  async checkQuota(userId: string, tier: UserTier, period: "day" | "month"): Promise<QuotaStatus> {
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

  async consumeQuota(userId: string, minutes: number, period: "day" | "month"): Promise<boolean> {
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

  async resetQuota(userId: string, period: "day" | "month"): Promise<void> {
    const quotaKey = this.getQuotaKey(userId, period);
    const quota = this.quotas.get(quotaKey);

    if (quota) {
      quota.usedMinutes = 0;
      quota.resetAt = this.getResetTime(period);
      quota.updatedAt = Date.now();
      this.quotas.set(quotaKey, quota);
    }
  }

  async getQuotaUsage(userId: string, period: "day" | "month"): Promise<UserQuota | null> {
    const quotaKey = this.getQuotaKey(userId, period);
    const quota = this.quotas.get(quotaKey);

    if (!quota) return null;

    // Check if quota is expired
    const now = Date.now();
    if (now >= quota.resetAt) {
      return null;
    }

    return { ...quota };
  }

  async getAllUserQuotas(userId: string): Promise<UserQuota[]> {
    const userQuotas: UserQuota[] = [];

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

  async cleanupExpiredQuotas(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

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
  async getQuotaStatus(
    userId: string,
    tier: UserTier
  ): Promise<{
    daily: QuotaStatus;
    monthly: QuotaStatus;
  }> {
    const [daily, monthly] = await Promise.all([
      this.checkQuota(userId, tier, "day"),
      this.checkQuota(userId, tier, "month"),
    ]);

    return { daily, monthly };
  }

  // Helper method to check if user can start a session
  async canStartSession(
    userId: string,
    tier: UserTier,
    estimatedMinutes: number = 10
  ): Promise<{
    allowed: boolean;
    reason?: string;
    dailyStatus: QuotaStatus;
    monthlyStatus: QuotaStatus;
  }> {
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
  getQuotaConfig(): QuotaConfig {
    return { ...this.config };
  }

  // Helper method to update quota configuration
  updateQuotaConfig(newConfig: Partial<QuotaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const quotaManager = new InMemoryQuotaManager();

// Helper functions
export async function checkUserQuota(userId: string, tier: UserTier, period: "day" | "month"): Promise<QuotaStatus> {
  return quotaManager.checkQuota(userId, tier, period);
}

export async function consumeUserQuota(userId: string, minutes: number, period: "day" | "month"): Promise<boolean> {
  return quotaManager.consumeQuota(userId, minutes, period);
}

export async function canUserStartSession(
  userId: string,
  tier: UserTier,
  estimatedMinutes: number = 10
): Promise<{
  allowed: boolean;
  reason?: string;
  dailyStatus: QuotaStatus;
  monthlyStatus: QuotaStatus;
}> {
  return quotaManager.canStartSession(userId, tier, estimatedMinutes);
}

export function formatQuotaRemaining(remaining: number): string {
  if (remaining <= 0) return "0 minutes";
  if (remaining < 60) return `${Math.round(remaining)} minutes`;

  const hours = Math.floor(remaining / 60);
  const minutes = Math.round(remaining % 60);

  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatQuotaPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
