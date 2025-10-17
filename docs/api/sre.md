# @thrivereflections/realtime-sre

Site reliability engineering tools and monitoring for the Thrive Realtime Voice Platform.

## Overview

This package provides comprehensive SRE tools including health checks, alert management, circuit breakers, synthetic monitoring, and deployment status tracking to ensure platform reliability and performance.

## Installation

```bash
npm install @thrivereflections/realtime-sre
```

## Main Exports

### Health Monitoring

- **`HealthCheckManager`** - Main health check management system
- **`healthCheckManager`** - Default health check manager instance
- **`HealthCheck`** - Health check interface
- **`HealthStatus`** - Health status enumeration
- **`HealthChecker`** - Health checker function type

### Metrics Collection

- **`MetricsCollector`** - Performance metrics collection
- **`metricsCollector`** - Default metrics collector instance
- **`PerformanceMetrics`** - Performance metrics interface
- **`AggregatedMetrics`** - Aggregated metrics interface

### Circuit Breaker

- **`CircuitBreaker`** - Circuit breaker implementation
- **`CircuitBreakerManager`** - Circuit breaker management
- **`circuitBreakerManager`** - Default circuit breaker manager
- **`defaultConfigs`** - Predefined circuit breaker configurations

### Alert Management

- **`AlertManager`** - Alert management system
- **`alertManager`** - Default alert manager instance
- **`Alert`** - Alert interface
- **`AlertRule`** - Alert rule configuration
- **`AlertNotification`** - Alert notification interface

### Synthetic Monitoring

- **`SyntheticMonitoring`** - Synthetic monitoring system
- **`syntheticMonitoring`** - Default synthetic monitoring instance
- **`SyntheticCheck`** - Synthetic check interface
- **`SyntheticCheckResult`** - Check result interface

### SLO Tracking

- **`SLOTracker`** - Service level objective tracking
- **`sloTracker`** - Default SLO tracker instance
- **`SLODefinition`** - SLO definition interface
- **`SLOStatus`** - SLO status interface
- **`SLOMetrics`** - SLO metrics interface

## Usage Example

### Health Checks

```typescript
import { HealthCheckManager, healthCheckManager } from "@thrivereflections/realtime-sre";

// Create health check manager
const healthManager = new HealthCheckManager();

// Add health checks
healthManager.addCheck("database", async () => {
  // Check database connectivity
  return { status: "healthy", details: "Database connected" };
});

healthManager.addCheck("openai-api", async () => {
  // Check OpenAI API availability
  const response = await fetch("https://api.openai.com/v1/models");
  return response.ok
    ? { status: "healthy", details: "API accessible" }
    : { status: "unhealthy", details: "API unavailable" };
});

// Run all health checks
const status = await healthManager.checkAll();
console.log(status); // { overall: "healthy", checks: {...} }
```

### Circuit Breaker

```typescript
import { CircuitBreaker, circuitBreakerManager, defaultConfigs } from "@thrivereflections/realtime-sre";

// Create circuit breaker
const breaker = new CircuitBreaker(async () => {
  // External API call
  const response = await fetch("https://api.example.com/data");
  return response.json();
}, defaultConfigs.API_CALLS);

// Use circuit breaker
try {
  const result = await breaker.execute();
  console.log("Success:", result);
} catch (error) {
  console.log("Circuit breaker triggered:", error.message);
}
```

### Alert Management

```typescript
import { AlertManager, alertManager, allAlertRules } from "@thrivereflections/realtime-sre";

// Create alert manager
const alertManager = new AlertManager();

// Register alert rules
alertManager.registerRules(allAlertRules);

// Create alert
const alert = {
  id: "high-error-rate",
  severity: "critical",
  message: "Error rate exceeded threshold",
  timestamp: new Date(),
  metadata: { errorRate: 0.15, threshold: 0.1 },
};

// Send alert
await alertManager.sendAlert(alert);
```

### Synthetic Monitoring

```typescript
import { SyntheticMonitoring, syntheticMonitoring } from "@thrivereflections/realtime-sre";

// Create synthetic monitoring
const synthetic = new SyntheticMonitoring();

// Add synthetic checks
synthetic.addCheck("voice-session-creation", async () => {
  // Simulate voice session creation
  const response = await fetch("/api/realtime/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice: "alloy" }),
  });

  return {
    success: response.ok,
    duration: Date.now() - startTime,
    statusCode: response.status,
  };
});

// Run synthetic checks
const results = await synthetic.runChecks();
console.log(results); // Array of check results
```

### SLO Tracking

```typescript
import { SLOTracker, sloTracker } from "@thrivereflections/realtime-sre";

// Create SLO tracker
const sloTracker = new SLOTracker();

// Define SLO
sloTracker.defineSLO("availability", {
  target: 0.999, // 99.9% availability
  window: 24 * 60 * 60 * 1000, // 24 hours
  measurement: "uptime",
});

// Record SLO metrics
sloTracker.recordMetric("availability", {
  success: true,
  timestamp: new Date(),
  duration: 150,
});

// Get SLO status
const status = await sloTracker.getSLOStatus("availability");
console.log(status); // { current: 0.9995, target: 0.999, status: "meeting" }
```

## Configuration

### Health Check Configuration

```typescript
interface HealthCheckConfig {
  timeout: number; // Check timeout in milliseconds
  retries: number; // Number of retries
  interval: number; // Check interval in milliseconds
}
```

### Circuit Breaker Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number; // Failures before opening
  recoveryTimeout: number; // Time before attempting recovery
  monitoringPeriod: number; // Monitoring window
  minimumRequests: number; // Minimum requests for evaluation
}
```

### Alert Configuration

```typescript
interface AlertConfig {
  channels: AlertChannel[]; // Notification channels
  rules: AlertRule[]; // Alert rules
  escalation: EscalationPolicy; // Escalation policy
}
```

## Predefined Configurations

### Circuit Breaker Configs

- **`defaultConfigs.API_CALLS`** - API call circuit breaker
- **`defaultConfigs.DATABASE`** - Database circuit breaker
- **`defaultConfigs.EXTERNAL_SERVICES`** - External service circuit breaker

### Alert Rules

- **`ttfaAlertRules`** - Time to first audio alerts
- **`errorRateAlertRules`** - Error rate alerts
- **`circuitBreakerAlertRules`** - Circuit breaker alerts
- **`quotaAlertRules`** - Quota alerts
- **`costAlertRules`** - Cost alerts
- **`sessionDurationAlertRules`** - Session duration alerts
- **`apiAvailabilityAlertRules`** - API availability alerts
- **`toolExecutionAlertRules`** - Tool execution alerts
- **`memoryAlertRules`** - Memory usage alerts

## Key Features

- **Health Monitoring** - Comprehensive health check system
- **Circuit Breaker** - Automatic failure protection
- **Alert Management** - Multi-channel alerting system
- **Synthetic Monitoring** - Proactive monitoring checks
- **SLO Tracking** - Service level objective monitoring
- **Metrics Collection** - Performance metrics aggregation
- **Deployment Tracking** - Deployment status monitoring

## Integration

### With API Routes

```typescript
import { healthCheckManager } from "@thrivereflections/realtime-sre";

export async function GET() {
  const health = await healthCheckManager.checkAll();

  if (health.overall === "unhealthy") {
    return new Response(JSON.stringify(health), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

### With Core Runtime

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { circuitBreakerManager } from "@thrivereflections/realtime-sre";

const realtime = initRealtime(config, {
  getToken: async () => {
    // Use circuit breaker for token fetching
    return await circuitBreakerManager.execute("token-fetch", async () => {
      return await fetchToken();
    });
  },
  transportFactory: createTransport,
  onEvent: (event) => console.log("Event:", event),
});
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface

## Related Documentation

- [Observability](./observability.md) - Logging and metrics
- [Security](./security.md) - Security monitoring
- [Usage](./usage.md) - Usage monitoring
- [Package README](../../packages/sre/README.md) - Detailed package documentation
