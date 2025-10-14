import { AlertRule } from "./alertManager";
import { sloTracker } from "./sloTracker";

// TTFA Alert Rules
export const ttfaAlertRules: AlertRule[] = [
  {
    id: "ttfa_p95_warning",
    name: "TTFA P95 Warning",
    description: "Time to First Audio 95th percentile exceeds 600ms",
    severity: "warning",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("ttfa_p95");
      return status ? status.current < 95 && status.current > 90 : false;
    },
    throttleMs: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    id: "ttfa_p95_critical",
    name: "TTFA P95 Critical",
    description: "Time to First Audio 95th percentile exceeds 1000ms",
    severity: "critical",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("ttfa_p95");
      return status ? status.current < 90 : false;
    },
    throttleMs: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  },
];

// Error Rate Alert Rules
export const errorRateAlertRules: AlertRule[] = [
  {
    id: "error_rate_warning",
    name: "Error Rate Warning",
    description: "Error rate exceeds 1%",
    severity: "warning",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("session_success_rate");
      return status ? status.current < 99.5 && status.current > 99.0 : false;
    },
    throttleMs: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    id: "error_rate_critical",
    name: "Error Rate Critical",
    description: "Error rate exceeds 5%",
    severity: "critical",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("session_success_rate");
      return status ? status.current < 99.0 : false;
    },
    throttleMs: 1 * 60 * 1000, // 1 minute
    enabled: true,
  },
];

// Circuit Breaker Alert Rules
export const circuitBreakerAlertRules: AlertRule[] = [
  {
    id: "circuit_breaker_open",
    name: "Circuit Breaker Open",
    description: "Circuit breaker has opened",
    severity: "warning",
    source: "circuit_breaker",
    condition: (data) => {
      return (data as { state: string }).state === "OPEN";
    },
    throttleMs: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
];

// Quota Alert Rules
export const quotaAlertRules: AlertRule[] = [
  {
    id: "quota_warning",
    name: "Quota Warning",
    description: "User quota usage exceeds 80%",
    severity: "warning",
    source: "quota_manager",
    condition: (data) => {
      return (data as { percentUsed: number }).percentUsed > 80 && (data as { percentUsed: number }).percentUsed <= 90;
    },
    throttleMs: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  },
  {
    id: "quota_critical",
    name: "Quota Critical",
    description: "User quota usage exceeds 90%",
    severity: "critical",
    source: "quota_manager",
    condition: (data) => {
      return (data as { percentUsed: number }).percentUsed > 90;
    },
    throttleMs: 15 * 60 * 1000, // 15 minutes
    enabled: true,
  },
];

// Cost Alert Rules
export const costAlertRules: AlertRule[] = [
  {
    id: "cost_daily_warning",
    name: "Daily Cost Warning",
    description: "Daily cost exceeds warning threshold",
    severity: "warning",
    source: "cost_tracker",
    condition: (data) => {
      const dailyThreshold = 5.0;
      return (
        (data as { dailyCost: number }).dailyCost > dailyThreshold * 0.8 &&
        (data as { dailyCost: number }).dailyCost <= dailyThreshold
      );
    },
    throttleMs: 60 * 60 * 1000, // 1 hour
    enabled: true,
  },
  {
    id: "cost_daily_critical",
    name: "Daily Cost Critical",
    description: "Daily cost exceeds critical threshold",
    severity: "critical",
    source: "cost_tracker",
    condition: (data) => {
      const dailyThreshold = 5.0;
      return (data as { dailyCost: number }).dailyCost > dailyThreshold;
    },
    throttleMs: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  },
  {
    id: "cost_monthly_critical",
    name: "Monthly Cost Critical",
    description: "Monthly cost exceeds critical threshold",
    severity: "critical",
    source: "cost_tracker",
    condition: (data) => {
      const monthlyThreshold = 50.0;
      return (data as { monthlyCost: number }).monthlyCost > monthlyThreshold;
    },
    throttleMs: 2 * 60 * 60 * 1000, // 2 hours
    enabled: true,
  },
];

// Session Duration Alert Rules
export const sessionDurationAlertRules: AlertRule[] = [
  {
    id: "session_duration_anomaly",
    name: "Session Duration Anomaly",
    description: "Unusual session duration detected",
    severity: "warning",
    source: "session_tracker",
    condition: (data) => {
      // Alert if session duration is more than 2x the average or less than 10% of average
      const avgDuration = (data as { averageDuration?: number }).averageDuration || 300000; // 5 minutes default
      return (
        (data as { duration: number }).duration > avgDuration * 2 ||
        (data as { duration: number }).duration < avgDuration * 0.1
      );
    },
    throttleMs: 15 * 60 * 1000, // 15 minutes
    enabled: true,
  },
];

// API Availability Alert Rules
export const apiAvailabilityAlertRules: AlertRule[] = [
  {
    id: "api_availability_warning",
    name: "API Availability Warning",
    description: "API availability below 99.9%",
    severity: "warning",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("api_availability");
      return status ? status.current < 99.9 && status.current > 99.5 : false;
    },
    throttleMs: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    id: "api_availability_critical",
    name: "API Availability Critical",
    description: "API availability below 99.5%",
    severity: "critical",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("api_availability");
      return status ? status.current < 99.5 : false;
    },
    throttleMs: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  },
];

// Tool Execution Alert Rules
export const toolExecutionAlertRules: AlertRule[] = [
  {
    id: "tool_execution_warning",
    name: "Tool Execution Warning",
    description: "Tool execution 95th percentile exceeds 2000ms",
    severity: "warning",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("tool_execution_p95");
      return status ? status.current < 95 && status.current > 90 : false;
    },
    throttleMs: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    id: "tool_execution_critical",
    name: "Tool Execution Critical",
    description: "Tool execution 95th percentile exceeds 5000ms",
    severity: "critical",
    source: "slo_tracker",
    condition: (_data) => {
      const status = sloTracker.getSLOStatus("tool_execution_p95");
      return status ? status.current < 90 : false;
    },
    throttleMs: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  },
];

// Memory Usage Alert Rules
export const memoryAlertRules: AlertRule[] = [
  {
    id: "memory_usage_warning",
    name: "Memory Usage Warning",
    description: "Memory usage exceeds 80%",
    severity: "warning",
    source: "system_monitor",
    condition: (data) => {
      return (
        (data as { memoryUsagePercent: number }).memoryUsagePercent > 80 &&
        (data as { memoryUsagePercent: number }).memoryUsagePercent <= 90
      );
    },
    throttleMs: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
  {
    id: "memory_usage_critical",
    name: "Memory Usage Critical",
    description: "Memory usage exceeds 90%",
    severity: "critical",
    source: "system_monitor",
    condition: (data) => {
      return (data as { memoryUsagePercent: number }).memoryUsagePercent > 90;
    },
    throttleMs: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
];

// Combine all alert rules
export const allAlertRules: AlertRule[] = [
  ...ttfaAlertRules,
  ...errorRateAlertRules,
  ...circuitBreakerAlertRules,
  ...quotaAlertRules,
  ...costAlertRules,
  ...sessionDurationAlertRules,
  ...apiAvailabilityAlertRules,
  ...toolExecutionAlertRules,
  ...memoryAlertRules,
];

// Helper function to register all alert rules
export function registerAllAlertRules(alertManager: { addRule: (rule: AlertRule) => void }): void {
  for (const rule of allAlertRules) {
    alertManager.addRule(rule);
  }
}
