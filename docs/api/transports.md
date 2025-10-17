# Transports

WebRTC and WebSocket transport implementations for real-time voice communication.

## Overview

The platform provides two transport options for real-time voice communication with OpenAI's Realtime API:

- **WebRTC** - Low-latency peer-to-peer audio streaming
- **WebSocket** - Reliable server-mediated audio streaming

## Packages

### @thrivereflections/realtime-transport-webrtc

WebRTC transport for direct peer-to-peer communication.

#### Installation

```bash
npm install @thrivereflections/realtime-transport-webrtc
```

#### Main Exports

- **`createWebRTCTransport(config, deps)`** - Create WebRTC transport instance
- **`WebRTCTransport`** - Transport implementation class
- **`WebRTCConfig`** - Configuration interface

#### Usage Example

```typescript
import { createWebRTCTransport } from "@thrivereflections/realtime-transport-webrtc";

const config = {
  voice: "alloy",
  persona: "You are a helpful AI assistant.",
  instructions: "Be concise and helpful.",
  capabilities: ["text", "audio", "tools"],
  tools: [
    {
      type: "function",
      name: "echo",
      description: "Echoes back the provided message",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  ],
};

const deps = {
  getSessionToken: async () => {
    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return response.json();
  },
};

const transport = createWebRTCTransport(config, deps);

// Connect
await transport.connect({
  token: "your-token",
  onEvent: (event) => console.log("Event:", event),
});

// Send events
transport.send({
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: "Hello!",
  },
});

// Close connection
await transport.close();
```

### @thrivereflections/realtime-transport-websocket

WebSocket transport for reliable server-mediated communication.

#### Installation

```bash
npm install @thrivereflections/realtime-transport-websocket
```

#### Main Exports

- **`createWebSocketTransport(config, deps)`** - Create WebSocket transport instance
- **`WebSocketTransport`** - Transport implementation class
- **`WebSocketConfig`** - Configuration interface

#### Usage Example

```typescript
import { createWebSocketTransport } from "@thrivereflections/realtime-transport-websocket";

const config = {
  voice: "alloy",
  persona: "You are a helpful AI assistant.",
  instructions: "Be concise and helpful.",
  capabilities: ["text", "audio", "tools"],
  featureFlags: {
    memory: "off",
  },
  tools: [
    {
      type: "function",
      name: "echo",
      description: "Echoes back the provided message",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  ],
};

const deps = {
  getSessionToken: async () => {
    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return response.json();
  },
};

const transport = createWebSocketTransport(config, deps);

// Connect
await transport.connect({
  token: "your-token",
  onEvent: (event) => console.log("Event:", event),
});

// Send events
transport.send({
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: "Hello!",
  },
});

// Close connection
await transport.close();
```

## Transport Selection

### WebRTC Transport

**Best for:**

- Low-latency applications
- Direct peer-to-peer communication
- Minimal server bandwidth usage

**Features:**

- Direct audio streaming
- Data channel for events
- Automatic ICE server configuration
- Connection state management

**Browser Support:**

- Chrome 56+, Firefox 52+, Safari 11+, Edge 79+

### WebSocket Transport

**Best for:**

- Reliable communication
- Server-mediated streaming
- Fallback for WebRTC failures

**Features:**

- Server-mediated audio streaming
- Automatic reconnection
- Voice activity detection
- PCM audio processing

**Browser Support:**

- Chrome 56+, Firefox 52+, Safari 11+, Edge 79+

## Configuration

### Common Configuration

```typescript
interface TransportConfig {
  voice?: string; // Voice model (e.g., "alloy")
  persona?: string; // AI persona description
  instructions?: string; // System instructions
  capabilities?: string[]; // Supported capabilities
  featureFlags?: {
    memory?: "on" | "off";
  };
  tools?: Array<{
    type: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}
```

### Dependencies

```typescript
interface TransportDeps {
  getSessionToken: () => Promise<{
    client_secret: { value: string; expires_at: string };
    session_id: string;
    model: string;
  }>;
}
```

## Key Features

- **Audio Processing** - 24kHz PCM audio encoding/decoding
- **Microphone Access** - Automatic microphone setup
- **Audio Playback** - Real-time audio output
- **Connection Management** - Automatic reconnection and error handling
- **Event Handling** - Comprehensive event routing
- **Type Safety** - Full TypeScript support

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions

## Related Documentation

- [Core Runtime](./core.md) - Uses these transports
- [Contracts](./contracts.md) - Transport interface definitions
- [WebRTC Package README](../../packages/transport-webrtc/README.md) - Detailed WebRTC documentation
- [WebSocket Package README](../../packages/transport-websocket/README.md) - Detailed WebSocket documentation
