# @thrivereflections/realtime-core

Core runtime logic for the Thrive Realtime Voice Platform.

## Overview

This package contains the core runtime logic for real-time voice communication, including:

- Realtime connection initialization with identity support
- Transport factory for creating WebRTC/WebSocket connections
- Event router for handling OpenAI Realtime API events with PII redaction
- Identity-aware event processing and logging
- Type definitions for events, transcripts, and tool calls

## Installation

```bash
pnpm add @thrivereflections/realtime-core
```

## Usage

### Basic Setup

```typescript
import { initRealtime, createTransport } from "@thrivereflections/realtime-core";
import { ClientIdentity } from "@thrivereflections/realtime-contracts";

const config = {
  featureFlags: {
    transport: "webrtc" as const,
    anonymityAnonymousEnabled: true,
  },
  policies: {
    retention: {
      anonymous: { maxAgeMs: 14 * 24 * 60 * 60 * 1000 }, // 14 days
    },
  },
};

const identity: ClientIdentity = {
  level: "anonymous",
  anonymousId: "anon_123456789",
  consent: "ACCEPTED",
};

const deps = {
  getToken: async () => "your-token",
  transportFactory: createTransport,
  onEvent: (event) => console.log("Event:", event),
  logger: yourLogger,
  identity, // Pass identity for transport metadata
};

const realtime = initRealtime(config, deps);
await realtime.start();
```

### Event Router

```typescript
import { RealtimeEventRouter } from "@thrivereflections/realtime-core";

const router = new RealtimeEventRouter({
  onSessionCreated: (sessionId) => console.log("Session:", sessionId),
  onTranscript: (transcript) => console.log("Transcript:", transcript),
  onToolCall: (toolCall) => console.log("Tool call:", toolCall),
});

// Route events from your transport
router.routeEvent(event);
```

## API Reference

### `initRealtime(config, deps)`

Initializes a realtime connection with dependency injection and identity support.

**Parameters:**

- `config`: Runtime configuration object with identity feature flags and retention policies
- `deps`: Dependencies object with required methods and optional identity

**Dependencies:**

- `getToken()`: Function to get authentication token
- `transportFactory?`: Optional transport factory function
- `baseUrl?`: Optional base URL for connections
- `onEvent?`: Optional event handler function
- `logger?`: Optional logger with info/error methods
- `identity?`: Optional client identity for transport metadata

**Returns:** Object with `start()`, `stop()`, `transport`, and `config` properties

### `createTransport(kind)`

Creates a transport instance for the specified kind.

**Parameters:**

- `kind`: Transport kind ("webrtc" or "websocket")

**Returns:** Transport instance

### `RealtimeEventRouter`

Class for routing and handling OpenAI Realtime API events.

**Methods:**

- `routeEvent(event)`: Route an event to appropriate handlers
- `reset()`: Reset router state

## Dependencies

- `@thrivereflections/realtime-contracts`: Shared type definitions

## License

MIT
