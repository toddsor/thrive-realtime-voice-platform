# @thrivereflections/realtime-core

Core runtime logic for the Thrive Realtime Voice Platform.

## Overview

This package contains the core runtime logic for real-time voice communication, including connection initialization, transport factory, and event routing for OpenAI's Realtime API.

## Installation

```bash
npm install @thrivereflections/realtime-core
```

## Main Exports

### Core Functions

- **`initRealtime(config, deps)`** - Initialize realtime connection with dependency injection
- **`createTransport(kind)`** - Create transport instance for specified kind
- **`RealtimeEventRouter`** - Class for routing and handling OpenAI Realtime API events

### Types

- **`RealtimeEvent`** - Event type definitions
- **`Transcript`** - Transcript segment interface
- **`ToolCall`** - Tool call event interface
- **`UsageInfo`** - Usage tracking information
- **`EventRouterCallbacks`** - Event handler callbacks
- **`TransportFactory`** - Transport creation interface

## Usage Example

```typescript
import { initRealtime, createTransport, RealtimeEventRouter } from "@thrivereflections/realtime-core";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

// Create logger
const logger = new InjectableConsoleLogger();

// Initialize realtime connection
const config = {
  featureFlags: {
    transport: "webrtc" as const,
  },
};

const deps = {
  getToken: async () => "your-session-token",
  transportFactory: createTransport,
  onEvent: (event) => console.log("Event:", event),
  logger,
};

const realtime = initRealtime(config, deps);

// Start the connection
await realtime.start();

// Stop the connection
await realtime.stop();
```

### Event Router Example

```typescript
import { RealtimeEventRouter } from "@thrivereflections/realtime-core";

const router = new RealtimeEventRouter({
  onSessionCreated: (sessionId) => console.log("Session:", sessionId),
  onTranscript: (transcript) => console.log("Transcript:", transcript),
  onToolCall: (toolCall) => console.log("Tool call:", toolCall),
  onError: (error) => console.error("Error:", error),
});

// Route events from your transport
router.routeEvent(event);
```

## Configuration

### Runtime Configuration

```typescript
interface RuntimeConfig {
  featureFlags: {
    transport: "webrtc" | "websocket";
    memory?: "on" | "off";
  };
  sessionLimits?: {
    maxDuration?: number;
    maxToolCalls?: number;
  };
}
```

### Dependencies

```typescript
interface RealtimeDeps {
  getToken: () => Promise<string>;
  transportFactory: (kind: string) => Transport;
  onEvent: (event: unknown) => void;
  logger: Logger;
}
```

## Key Features

- **Dependency Injection** - Clean separation of concerns
- **Transport Agnostic** - Works with WebRTC or WebSocket
- **Event Routing** - Handles all OpenAI Realtime API events
- **Error Handling** - Comprehensive error management
- **Type Safety** - Full TypeScript support

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface

## Related Documentation

- [Contracts](./contracts.md) - Type definitions used
- [Transports](./transports.md) - Transport implementations
- [Package README](../../packages/core/README.md) - Detailed package documentation
