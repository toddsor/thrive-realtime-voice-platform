import { ConsoleLogger } from "@thrive/realtime-observability";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  condition: (data: unknown) => boolean;
  throttleMs?: number; // Minimum time between alerts for this rule
  enabled: boolean;
}

export interface AlertNotification {
  alert: Alert;
  channels: string[]; // 'slack', 'email', 'pagerduty', etc.
}

export class AlertManager {
  private alerts = new Map<string, Alert>();
  private rules = new Map<string, AlertRule>();
  private lastAlertTimes = new Map<string, number>(); // For throttling
  private logger = new ConsoleLogger();

  constructor() {
    this.logger.info("Alert Manager initialized");
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info("Alert rule added", { ruleId: rule.id, name: rule.name });
  }

  evaluateRule(ruleId: string, data: unknown): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return false;
    }

    try {
      return rule.condition(data);
    } catch (error) {
      this.logger.error("Alert rule evaluation failed", {
        ruleId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  createAlert(ruleId: string, data: unknown, customMessage?: string): Alert | null {
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
    const alert: Alert = {
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

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
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

  resolveAlert(alertId: string): boolean {
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

  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.severity === severity);
  }

  getAlertsBySource(source: string): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.source === source);
  }

  getRecentAlerts(since: number): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.timestamp >= since);
  }

  // Get alert statistics
  getAlertStats(): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
    bySource: Record<string, number>;
  } {
    const alerts = Array.from(this.alerts.values());

    const bySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
    };

    const bySource: Record<string, number> = {};

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
  clearOldAlerts(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
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
  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.logger.info("Alert rule enabled", { ruleId });
      return true;
    }
    return false;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      this.logger.info("Alert rule disabled", { ruleId });
      return true;
    }
    return false;
  }

  // Get all rules
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Get enabled rules
  getEnabledRules(): AlertRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }
}

// Singleton instance
export const alertManager = new AlertManager();
