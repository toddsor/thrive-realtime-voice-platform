// Simple logger interface for feature flags
interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

class SimpleLogger implements Logger {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, meta || "");
  }
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, meta || "");
  }
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[ERROR] ${message}`, meta || "");
  }
}

export type FeatureFlagValue = boolean | number | string;

export interface FeatureFlag {
  name: string;
  description: string;
  value: FeatureFlagValue;
  type: "boolean" | "number" | "string" | "percentage";
  enabled: boolean;
  rolloutPercentage?: number; // For percentage-based flags
  userTier?: "free" | "paid" | "enterprise"; // Tier-based flags
  userIds?: string[]; // Specific user allowlist
  userIdsDeny?: string[]; // Specific user denylist
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface FeatureFlagEvaluation {
  name: string;
  value: FeatureFlagValue;
  enabled: boolean;
  reason: "enabled" | "disabled" | "rollout" | "tier" | "user" | "denied";
  metadata?: Record<string, unknown>;
}

export class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>();
  private logger = new SimpleLogger();

  constructor() {
    // Removed logging to reduce noise
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    // Operational kill switches
    this.setFlag({
      name: "tools_enabled",
      description: "Enable/disable all tool functionality",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "captions_enabled",
      description: "Enable/disable live captions",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "rag_enabled",
      description: "Enable/disable RAG functionality",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "webrtc_fallback_force",
      description: "Force WebSocket fallback instead of WebRTC",
      value: false,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "session_persistence_enabled",
      description: "Enable/disable session persistence",
      value: true,
      type: "boolean",
      enabled: true,
    });

    // Anonymity levels enablement
    this.setFlag({
      name: "anonymity_ephemeral_enabled",
      description: "Enable Ephemeral (no tracking) mode",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "anonymity_local_enabled",
      description: "Enable Local-only storage mode",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "anonymity_anonymous_enabled",
      description: "Enable Anonymous Session mode",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "anonymity_pseudonymous_enabled",
      description: "Enable Pseudonymous mode",
      value: true,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "anonymity_authenticated_enabled",
      description: "Enable Authenticated mode",
      value: true,
      type: "boolean",
      enabled: true,
    });

    // Gradual rollout flags
    this.setFlag({
      name: "usage_stats_ui",
      description: "Show usage statistics UI",
      value: true,
      type: "percentage",
      enabled: true,
      rolloutPercentage: 100,
    });

    this.setFlag({
      name: "advanced_metrics",
      description: "Enable advanced metrics collection",
      value: false,
      type: "percentage",
      enabled: true,
      rolloutPercentage: 50,
    });

    // Tier-based flags
    this.setFlag({
      name: "premium_voice_models",
      description: "Access to premium voice models",
      value: false,
      type: "boolean",
      enabled: true,
      userTier: "paid",
    });

    this.setFlag({
      name: "unlimited_sessions",
      description: "Unlimited session duration",
      value: false,
      type: "boolean",
      enabled: true,
      userTier: "enterprise",
    });

    // Performance tuning flags
    this.setFlag({
      name: "ttfa_target_ms",
      description: "Target TTFA in milliseconds",
      value: 400,
      type: "number",
      enabled: true,
    });

    this.setFlag({
      name: "max_session_duration_minutes",
      description: "Maximum session duration in minutes",
      value: 10,
      type: "number",
      enabled: true,
    });

    // Retention defaults (days)
    this.setFlag({
      name: "retention_anonymous_days",
      description: "Retention window (days) for anonymous session entries",
      value: 14,
      type: "number",
      enabled: true,
    });
    this.setFlag({
      name: "retention_pseudonymous_days",
      description: "Retention window (days) for pseudonymous entries",
      value: 90,
      type: "number",
      enabled: true,
    });
    this.setFlag({
      name: "retention_authenticated_days",
      description: "Retention window (days) for authenticated entries",
      value: 365,
      type: "number",
      enabled: true,
    });

    // Debug flags
    this.setFlag({
      name: "debug_logging",
      description: "Enable debug-level logging",
      value: false,
      type: "boolean",
      enabled: true,
    });

    this.setFlag({
      name: "synthetic_monitoring",
      description: "Enable synthetic monitoring",
      value: true,
      type: "boolean",
      enabled: true,
    });
  }

  setFlag(flag: Omit<FeatureFlag, "createdAt" | "updatedAt">): void {
    const now = Date.now();
    const fullFlag: FeatureFlag = {
      ...flag,
      createdAt: now,
      updatedAt: now,
    };

    this.flags.set(flag.name, fullFlag);
    // Removed logging to reduce noise
  }

  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  evaluateFlag(name: string, userId?: string, userTier?: "free" | "paid" | "enterprise"): FeatureFlagEvaluation | null {
    const flag = this.flags.get(name);
    if (!flag || !flag.enabled) {
      return {
        name,
        value: false,
        enabled: false,
        reason: flag ? "disabled" : "disabled",
      };
    }

    // Check user denylist
    if (userId && flag.userIdsDeny?.includes(userId)) {
      return {
        name,
        value: false,
        enabled: false,
        reason: "denied",
        metadata: { userId, reason: "user_denylist" },
      };
    }

    // Check user allowlist
    if (userId && flag.userIds?.includes(userId)) {
      return {
        name,
        value: flag.value,
        enabled: true,
        reason: "user",
        metadata: { userId, reason: "user_allowlist" },
      };
    }

    // Check tier-based flags
    if (flag.userTier && userTier) {
      const tierOrder = { free: 0, paid: 1, enterprise: 2 };
      const userTierLevel = tierOrder[userTier];
      const requiredTierLevel = tierOrder[flag.userTier];

      if (userTierLevel >= requiredTierLevel) {
        return {
          name,
          value: flag.value,
          enabled: true,
          reason: "tier",
          metadata: { userTier, requiredTier: flag.userTier },
        };
      } else {
        return {
          name,
          value: false,
          enabled: false,
          reason: "tier",
          metadata: { userTier, requiredTier: flag.userTier },
        };
      }
    }

    // Check percentage-based rollout
    if (flag.type === "percentage" && flag.rolloutPercentage !== undefined) {
      const hash = this.hashUserId(userId || "anonymous");
      const percentage = hash % 100;

      if (percentage < flag.rolloutPercentage) {
        return {
          name,
          value: flag.value,
          enabled: true,
          reason: "rollout",
          metadata: {
            rolloutPercentage: flag.rolloutPercentage,
            userHash: percentage,
          },
        };
      } else {
        return {
          name,
          value: false,
          enabled: false,
          reason: "rollout",
          metadata: {
            rolloutPercentage: flag.rolloutPercentage,
            userHash: percentage,
          },
        };
      }
    }

    // Default to flag value
    return {
      name,
      value: flag.value,
      enabled: true,
      reason: "enabled",
    };
  }

  evaluateFlags(userId?: string, userTier?: "free" | "paid" | "enterprise"): Record<string, FeatureFlagEvaluation> {
    const results: Record<string, FeatureFlagEvaluation> = {};

    for (const [name] of this.flags.entries()) {
      const evaluation = this.evaluateFlag(name, userId, userTier);
      if (evaluation) {
        results[name] = evaluation;
      }
    }

    return results;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter((flag) => flag.enabled);
  }

  updateFlag(name: string, updates: Partial<Omit<FeatureFlag, "name" | "createdAt">>): boolean {
    const flag = this.flags.get(name);
    if (!flag) {
      return false;
    }

    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: Date.now(),
    };

    this.flags.set(name, updatedFlag);
    this.logger.info("Feature flag updated", { name, updates });
    return true;
  }

  deleteFlag(name: string): boolean {
    const deleted = this.flags.delete(name);
    if (deleted) {
      this.logger.info("Feature flag deleted", { name });
    }
    return deleted;
  }

  // Emergency kill switch - disable all non-essential features
  emergencyDisable(): void {
    const criticalFlags = ["tools_enabled", "rag_enabled", "session_persistence_enabled"];

    for (const flagName of criticalFlags) {
      this.updateFlag(flagName, { enabled: false });
    }

    this.logger.warn("Emergency disable activated", { disabledFlags: criticalFlags });
  }

  // Emergency enable - re-enable all features
  emergencyEnable(): void {
    const criticalFlags = ["tools_enabled", "rag_enabled", "session_persistence_enabled"];

    for (const flagName of criticalFlags) {
      this.updateFlag(flagName, { enabled: true });
    }

    this.logger.warn("Emergency enable activated", { enabledFlags: criticalFlags });
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get flag statistics
  getFlagStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  } {
    const flags = Array.from(this.flags.values());
    const byType: Record<string, number> = {};

    for (const flag of flags) {
      byType[flag.type] = (byType[flag.type] || 0) + 1;
    }

    return {
      total: flags.length,
      enabled: flags.filter((f) => f.enabled).length,
      disabled: flags.filter((f) => !f.enabled).length,
      byType,
    };
  }
}

// Singleton instance
export const featureFlagManager = new FeatureFlagManager();
