# @thrivereflections/realtime-core

Core runtime logic for the Thrive Realtime Voice Platform.

## Overview

This package contains the core runtime logic for real-time voice communication, including:

- Realtime connection initialization
- Transport factory for creating WebRTC/WebSocket connections
- Event router for handling OpenAI Realtime API events
- Type definitions for events, transcripts, and tool calls

## Installation

```bash
pnpm add @thrivereflections/realtime-core
```

## Usage

### Basic Setup

```typescript
import { initRealtime, createTransport } from "@thrivereflections/realtime-core";

const config = {
  featureFlags: {
    transport: "webrtc" as const,
  },
};

const deps = {
  getToken: async () => "your-token",
  transportFactory: createTransport,
  onEvent: (event) => console.log("Event:", event),
  logger: yourLogger,
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

Initializes a realtime connection with dependency injection.

**Parameters:**

- `config`: Runtime configuration object
- `deps`: Dependencies object with required methods

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
