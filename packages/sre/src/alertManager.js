import { ConsoleLogger } from "@thrive/realtime-observability";
export class AlertManager {
    constructor() {
        this.alerts = new Map();
        this.rules = new Map();
        this.lastAlertTimes = new Map(); // For throttling
        this.logger = new ConsoleLogger();
        this.logger.info("Alert Manager initialized");
    }
    addRule(rule) {
        this.rules.set(rule.id, rule);
        this.logger.info("Alert rule added", { ruleId: rule.id, name: rule.name });
    }
    evaluateRule(ruleId, data) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            return false;
        }
        try {
            return rule.condition(data);
        }
        catch (error) {
            this.logger.error("Alert rule evaluation failed", {
                ruleId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return false;
        }
    }
    createAlert(ruleId, data, customMessage) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            return null;
        }
        // Check throttling
        const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
        const now = Date.now();
        if (rule.throttleMs && now - lastAlertTime < rule.throttleMs) {
            this.logger.debug("Alert throttled", { ruleId, throttleMs: rule.throttleMs });
            return null;
        }
        // Check if condition is met
        if (!this.evaluateRule(ruleId, data)) {
            return null;
        }
        const alertId = `${ruleId}_${now}`;
        const alert = {
            id: alertId,
            title: rule.name,
            message: customMessage || rule.description,
            severity: rule.severity,
            source: rule.source,
            timestamp: now,
            acknowledged: false,
            resolved: false,
            metadata: { ruleId, data },
        };
        this.alerts.set(alertId, alert);
        this.lastAlertTimes.set(ruleId, now);
        this.logger.warn("Alert created", {
            alertId,
            ruleId,
            severity: alert.severity,
            title: alert.title,
        });
        return alert;
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return false;
        }
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = Date.now();
        this.logger.info("Alert acknowledged", {
            alertId,
            acknowledgedBy,
            title: alert.title,
        });
        return true;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return false;
        }
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        this.logger.info("Alert resolved", {
            alertId,
            title: alert.title,
        });
        return true;
    }
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
    }
    getAlertsBySeverity(severity) {
        return Array.from(this.alerts.values()).filter((alert) => alert.severity === severity);
    }
    getAlertsBySource(source) {
        return Array.from(this.alerts.values()).filter((alert) => alert.source === source);
    }
    getRecentAlerts(since) {
        return Array.from(this.alerts.values()).filter((alert) => alert.timestamp >= since);
    }
    // Get alert statistics
    getAlertStats() {
        const alerts = Array.from(this.alerts.values());
        const bySeverity = {
            info: 0,
            warning: 0,
            critical: 0,
        };
        const bySource = {};
        for (const alert of alerts) {
            bySeverity[alert.severity]++;
            bySource[alert.source] = (bySource[alert.source] || 0) + 1;
        }
        return {
            total: alerts.length,
            active: alerts.filter((a) => !a.resolved).length,
            acknowledged: alerts.filter((a) => a.acknowledged).length,
            resolved: alerts.filter((a) => a.resolved).length,
            bySeverity,
            bySource,
        };
    }
    // Clear old resolved alerts
    clearOldAlerts(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        const beforeCount = this.alerts.size;
        for (const [alertId, alert] of this.alerts.entries()) {
            if (alert.resolved && alert.timestamp < cutoff) {
                this.alerts.delete(alertId);
            }
        }
        const afterCount = this.alerts.size;
        this.logger.info("Old alerts cleared", {
            beforeCount,
            afterCount,
            clearedCount: beforeCount - afterCount,
        });
    }
    // Enable/disable alert rules
    enableRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = true;
            this.logger.info("Alert rule enabled", { ruleId });
            return true;
        }
        return false;
    }
    disableRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = false;
            this.logger.info("Alert rule disabled", { ruleId });
            return true;
        }
        return false;
    }
    // Get all rules
    getAllRules() {
        return Array.from(this.rules.values());
    }
    // Get enabled rules
    getEnabledRules() {
        return Array.from(this.rules.values()).filter((rule) => rule.enabled);
    }
}
// Singleton instance
export const alertManager = new AlertManager();
