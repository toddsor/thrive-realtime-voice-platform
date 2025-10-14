class SimpleLogger {
    info(message, meta) {
        console.log(`[INFO] ${message}`, meta || "");
    }
    warn(message, meta) {
        console.warn(`[WARN] ${message}`, meta || "");
    }
    error(message, meta) {
        console.error(`[ERROR] ${message}`, meta || "");
    }
}
export class FeatureFlagManager {
    constructor() {
        this.flags = new Map();
        this.logger = new SimpleLogger();
        // Removed logging to reduce noise
        this.initializeDefaultFlags();
    }
    initializeDefaultFlags() {
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
    setFlag(flag) {
        const now = Date.now();
        const fullFlag = {
            ...flag,
            createdAt: now,
            updatedAt: now,
        };
        this.flags.set(flag.name, fullFlag);
        // Removed logging to reduce noise
    }
    getFlag(name) {
        return this.flags.get(name);
    }
    evaluateFlag(name, userId, userTier) {
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
            }
            else {
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
            }
            else {
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
    evaluateFlags(userId, userTier) {
        const results = {};
        for (const [name] of this.flags.entries()) {
            const evaluation = this.evaluateFlag(name, userId, userTier);
            if (evaluation) {
                results[name] = evaluation;
            }
        }
        return results;
    }
    getAllFlags() {
        return Array.from(this.flags.values());
    }
    getEnabledFlags() {
        return Array.from(this.flags.values()).filter((flag) => flag.enabled);
    }
    updateFlag(name, updates) {
        const flag = this.flags.get(name);
        if (!flag) {
            return false;
        }
        const updatedFlag = {
            ...flag,
            ...updates,
            updatedAt: Date.now(),
        };
        this.flags.set(name, updatedFlag);
        this.logger.info("Feature flag updated", { name, updates });
        return true;
    }
    deleteFlag(name) {
        const deleted = this.flags.delete(name);
        if (deleted) {
            this.logger.info("Feature flag deleted", { name });
        }
        return deleted;
    }
    // Emergency kill switch - disable all non-essential features
    emergencyDisable() {
        const criticalFlags = ["tools_enabled", "rag_enabled", "session_persistence_enabled"];
        for (const flagName of criticalFlags) {
            this.updateFlag(flagName, { enabled: false });
        }
        this.logger.warn("Emergency disable activated", { disabledFlags: criticalFlags });
    }
    // Emergency enable - re-enable all features
    emergencyEnable() {
        const criticalFlags = ["tools_enabled", "rag_enabled", "session_persistence_enabled"];
        for (const flagName of criticalFlags) {
            this.updateFlag(flagName, { enabled: true });
        }
        this.logger.warn("Emergency enable activated", { enabledFlags: criticalFlags });
    }
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    // Get flag statistics
    getFlagStats() {
        const flags = Array.from(this.flags.values());
        const byType = {};
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
