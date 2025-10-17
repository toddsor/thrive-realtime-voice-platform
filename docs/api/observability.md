# @thrivereflections/realtime-observability

Logging and monitoring infrastructure for the Thrive Realtime Voice Platform.

## Overview

This package provides structured logging, metrics collection, and monitoring infrastructure used across all platform packages. It includes multiple logger implementations, log sinks, and correlation ID support.

## Installation

```bash
npm install @thrivereflections/realtime-observability
```

## Main Exports

### Logger Implementations

- **`InjectableConsoleLogger`** - Injectable console logger with configuration
- **`ConsoleLogger`** - Simple console logger implementation
- **`createLogger(config)`** - Create logger from configuration
- **`createLoggerFromEnv()`** - Create logger from environment variables

### Log Sinks

- **`ConsoleLogSink`** - Console output sink
- **`RemoteLogSink`** - Remote logging sink
- **`createLogSink(type, config)`** - Create log sink instance

### Types

- **`InjectableLogger`** - Injectable logger interface
- **`LoggerConfig`** - Logger configuration
- **`LogLevel`** - Log level enumeration
- **`LogSink`** - Log sink interface

## Usage Example

### Basic Logging

```typescript
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

// Create logger
const logger = new InjectableConsoleLogger("my-service");

// Log messages
logger.info("Service started");
logger.warn("High memory usage detected");
logger.error("Failed to connect to database", { error: "Connection timeout" });
logger.debug("Processing request", { requestId: "123", userId: "user-456" });
```

### Logger Factory

```typescript
import { createLogger, createLoggerFromEnv } from "@thrivereflections/realtime-observability";

// Create logger with configuration
const logger = createLogger({
  level: "info",
  service: "voice-platform",
  enableConsole: true,
  enableRemote: false,
});

// Create logger from environment
const envLogger = createLoggerFromEnv();
```

### Log Sinks

```typescript
import { ConsoleLogSink, RemoteLogSink, createLogSink } from "@thrivereflections/realtime-observability";

// Console sink
const consoleSink = new ConsoleLogSink();

// Remote sink
const remoteSink = new RemoteLogSink({
  endpoint: "https://logs.example.com/api/logs",
  apiKey: "your-api-key",
});

// Create sink from type
const sink = createLogSink("console", { level: "info" });
```

### Advanced Configuration

```typescript
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("voice-service", {
  level: "debug",
  enableTimestamp: true,
  enableServiceName: true,
  enableCorrelationId: true,
  formatter: (level, message, meta) => {
    return `[${level.toUpperCase()}] ${new Date().toISOString()} [${meta.service}] ${message}`;
  },
});
```

## Configuration

### Logger Configuration

```typescript
interface LoggerConfig {
  level?: "debug" | "info" | "warn" | "error";
  service?: string;
  enableConsole?: boolean;
  enableRemote?: boolean;
  enableTimestamp?: boolean;
  enableServiceName?: boolean;
  enableCorrelationId?: boolean;
  formatter?: (level: string, message: string, meta: any) => string;
}
```

### Log Levels

- **`debug`** - Detailed information for debugging
- **`info`** - General information about program execution
- **`warn`** - Warning messages for potential issues
- **`error`** - Error messages for failures

## Key Features

- **Structured Logging** - Consistent log format across all packages
- **Multiple Outputs** - Console and remote logging support
- **Correlation IDs** - Request tracking across services
- **Configurable Levels** - Runtime log level adjustment
- **Type Safety** - Full TypeScript support
- **Performance** - Optimized for high-throughput logging

## Integration

### With Core Runtime

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("realtime-core");

const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: createTransport,
  onEvent: (event) => logger.debug("Event received", { event }),
  logger, // Pass logger to runtime
});
```

### With Other Packages

All platform packages accept a logger instance for consistent logging:

```typescript
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("database");

const store = createPrismaStore(config, {
  redact: redactFunction,
  logger, // Pass logger to store
});
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions

## Related Documentation

- [Core Runtime](./core.md) - Uses observability for logging
- [Security](./security.md) - Uses observability for audit logging
- [SRE](./sre.md) - Uses observability for monitoring
- [Package README](../../packages/observability/README.md) - Detailed package documentation
