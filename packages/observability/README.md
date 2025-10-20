# @thrivereflections/realtime-observability

Observability and logging utilities for the Thrive Realtime Voice Platform with identity-aware logging and security event tracking.

## Features

- **Identity-Aware Logging**: Logs include identity level and ID for audit trails
- **Security Event Tracking**: Dedicated security event logging with severity levels
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Performance Monitoring**: Latency marks and performance tracking
- **Configurable Log Levels**: Runtime log level configuration

## Installation

```bash
npm install @thrivereflections/realtime-observability
```

## Usage

### Basic Logging

```typescript
import { createLoggerFromEnv, ConsoleLogger } from "@thrivereflections/realtime-observability";

// Create logger from environment
const logger = createLoggerFromEnv("correlation-123");

// Basic logging
logger.info("User action completed", { userId: "user_123", action: "login" });
logger.error("Database connection failed", { error: "Connection timeout" });
logger.warn("Rate limit approaching", { current: 90, limit: 100 });
```

### Identity-Aware Logging

```typescript
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";
import { IdentityLevel } from "@thrivereflections/realtime-contracts";

// Create logger with identity context
const logger = new InjectableConsoleLogger("correlation-123", {
  level: "info",
  environment: "production",
  runtime: "node",
  identityLevel: "anonymous",
  identityId: "anon_123456789",
});

// Set identity dynamically
logger.setIdentity("pseudonymous", "pseud_987654321");

// Logs will include identity information
logger.info("Tool executed", { toolName: "weather", result: "success" });
// Output: { level: "info", message: "Tool executed", identityLevel: "pseudonymous", identityId: "pseud_987654321", ... }
```

### Security Event Logging

```typescript
import { SecurityMonitor } from "@thrivereflections/realtime-observability";

const securityMonitor = new SecurityMonitor(logger);

// Log security events with severity
securityMonitor.logSecurityEvent("pii_redacted", "medium", "PII redacted from user input", {
  userId: "user_123",
  redactionCount: 2,
  originalLength: 100,
  redactedLength: 95,
});

securityMonitor.logSecurityEvent("rate_limit_exceeded", "high", "Rate limit exceeded", {
  key: "user:123",
  count: 101,
  limit: 100,
});

securityMonitor.logSecurityEvent("unauthorized_access", "critical", "Unauthorized access attempt", {
  ip: "192.168.1.1",
  endpoint: "/api/admin",
  userAgent: "Mozilla/5.0...",
});
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from "@thrivereflections/realtime-observability";

const perfMonitor = new PerformanceMonitor(logger);

// Mark performance milestones
perfMonitor.markStart("database_query");
await database.query("SELECT * FROM users");
perfMonitor.markEnd("database_query");

// Measure custom operations
const duration = perfMonitor.measure("api_call", async () => {
  return await fetch("/api/data");
});

console.log(`API call took ${duration}ms`);
```

## API Reference

### Logger Interface

```typescript
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
```

### InjectableLogger Interface

```typescript
interface InjectableLogger extends Logger {
  setConfig(config: LoggerConfig): void;
  setIdentity(level: IdentityLevel, id?: string): void;
}

interface LoggerConfig {
  level: LogLevel;
  environment?: string;
  runtime?: string;
  identityLevel?: IdentityLevel;
  identityId?: string;
}
```

### ConsoleLogger

Basic console logger implementation.

```typescript
const logger = new ConsoleLogger("correlation-123");
logger.info("Message", { key: "value" });
```

### InjectableConsoleLogger

Console logger with configurable identity context.

```typescript
const logger = new InjectableConsoleLogger("correlation-123", {
  level: "info",
  environment: "production",
  identityLevel: "anonymous",
  identityId: "anon_123456789",
});

// Update identity
logger.setIdentity("pseudonymous", "pseud_987654321");

// Update configuration
logger.setConfig({
  level: "debug",
  environment: "development",
});
```

### SecurityMonitor

Security event logging and monitoring.

```typescript
class SecurityMonitor {
  constructor(private logger: Logger) {}

  logSecurityEvent(
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    message: string,
    meta?: Record<string, unknown>
  ): void;
}
```

### PerformanceMonitor

Performance tracking and latency measurement.

```typescript
class PerformanceMonitor {
  constructor(private logger: Logger) {}

  markStart(label: string): void;
  markEnd(label: string): number;
  measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(label: string, fn: () => T): T;
}
```

## Identity Integration

The observability package integrates with the platform's identity system:

### Identity Context in Logs

All log entries include identity information when available:

```typescript
{
  "level": "info",
  "message": "Tool executed successfully",
  "correlationId": "corr-123",
  "timestamp": "2024-01-01T00:00:00Z",
  "metadata": {
    "environment": "production",
    "runtime": "node",
    "identityLevel": "anonymous",
    "identityId": "anon_123456789",
    "toolName": "weather",
    "executionTime": 150
  }
}
```

### Security Event Categories

Security events are categorized by type and severity:

- **Authentication Events**: `login_success`, `login_failed`, `logout`
- **Authorization Events**: `unauthorized_access`, `permission_denied`
- **Data Protection Events**: `pii_redacted`, `data_exported`, `data_deleted`
- **Rate Limiting Events**: `rate_limit_exceeded`, `rate_limit_warning`
- **System Events**: `configuration_changed`, `feature_flag_toggled`

### Performance Metrics

Performance monitoring tracks:

- **API Response Times**: Endpoint-specific latency measurements
- **Database Query Times**: Query performance tracking
- **Tool Execution Times**: Tool call performance
- **Transport Latency**: WebRTC/WebSocket connection performance
- **Memory Usage**: Application memory consumption

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=info
LOG_ENVIRONMENT=production
LOG_RUNTIME=node

# Security Monitoring
SECURITY_EVENT_RETENTION_DAYS=90
SECURITY_EVENT_ALERT_THRESHOLD=10

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_SLOW_QUERY_THRESHOLD=1000
```

### Runtime Configuration

```typescript
import { loadObservabilityConfig } from "@thrivereflections/realtime-config";

const config = loadObservabilityConfig({
  logging: {
    level: process.env.LOG_LEVEL || "info",
    environment: process.env.LOG_ENVIRONMENT || "development",
    runtime: process.env.LOG_RUNTIME || "node",
  },
  security: {
    eventRetentionDays: parseInt(process.env.SECURITY_EVENT_RETENTION_DAYS || "90"),
    alertThreshold: parseInt(process.env.SECURITY_EVENT_ALERT_THRESHOLD || "10"),
  },
  performance: {
    enabled: process.env.PERFORMANCE_MONITORING_ENABLED === "true",
    slowQueryThreshold: parseInt(process.env.PERFORMANCE_SLOW_QUERY_THRESHOLD || "1000"),
  },
});
```

## Examples

### Complete Observability Setup

```typescript
import { createLoggerFromEnv, SecurityMonitor, PerformanceMonitor } from "@thrivereflections/realtime-observability";
import { identityStore } from "@/lib/stores/identityStore";

// Setup observability
const logger = createLoggerFromEnv(correlationId);
const securityMonitor = new SecurityMonitor(logger);
const perfMonitor = new PerformanceMonitor(logger);

// Set identity context
const identity = identityStore.getIdentity();
logger.setIdentity(identity.level, identity.anonymousId || identity.pseudonymousId || identity.userId);

// Monitor API endpoint
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Log request
    logger.info("API request received", {
      method: "POST",
      endpoint: "/api/entries",
      identityLevel: identity.level,
    });

    // Process request
    const result = await processRequest(request);

    // Log success
    logger.info("API request completed", {
      duration: Date.now() - startTime,
      status: "success",
    });

    return new Response(JSON.stringify(result));
  } catch (error) {
    // Log error
    logger.error("API request failed", {
      error: error.message,
      duration: Date.now() - startTime,
    });

    // Log security event if applicable
    if (error.message.includes("unauthorized")) {
      securityMonitor.logSecurityEvent("unauthorized_access", "high", "Unauthorized API access", {
        endpoint: "/api/entries",
        identityLevel: identity.level,
      });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
```

### Identity-Aware Tool Execution

```typescript
import { enforceToolPolicy } from "@thrivereflections/realtime-tool-gateway";

async function executeTool(toolName: string, input: unknown, identity: ClientIdentity) {
  const tool = toolRegistry.get(toolName);
  if (!tool) {
    logger.warn("Tool not found", { toolName, identityLevel: identity.level });
    return;
  }

  // Check policy compliance
  const policyResult = enforceToolPolicy(tool, input, identity, callCount);
  if (!policyResult.allowed) {
    securityMonitor.logSecurityEvent("tool_access_denied", "medium", "Tool access denied by policy", {
      toolName,
      reason: policyResult.reason,
      identityLevel: identity.level,
    });
    throw new Error(`Tool access denied: ${policyResult.reason}`);
  }

  // Execute tool
  const result = await tool.handler(input);

  logger.info("Tool executed successfully", {
    toolName,
    identityLevel: identity.level,
    executionTime: Date.now() - startTime,
  });

  return result;
}
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions

## Related Documentation

- [Security Guide](../../docs/guides/security.md) - Security event logging
- [Identity Guide](../../docs/guides/anonymity-levels.md) - Identity-aware logging
- [API Reference](../../docs/api/auth.md) - Identity management integration
