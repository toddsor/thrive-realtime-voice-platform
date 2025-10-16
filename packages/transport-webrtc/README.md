# @thrivereflections/realtime-transport-webrtc

WebRTC transport implementation for the Thrive Realtime Voice Platform.

## Overview

This package provides a WebRTC-based transport for real-time voice communication using OpenAI's Realtime API. It handles peer-to-peer audio streaming and data channel communication.

## Features

- **WebRTC Audio Streaming**: Direct peer-to-peer audio communication
- **Data Channel Events**: Bidirectional event communication
- **Microphone Access**: Automatic microphone setup and management
- **Audio Playback**: Real-time audio output
- **Connection Management**: Automatic reconnection and error handling
- **ICE Servers**: Built-in STUN servers for NAT traversal

## Installation

```bash
pnpm add @thrivereflections/realtime-transport-webrtc
```

## Usage

### Basic Setup

```typescript
import { createWebRTCTransport } from "@thrivereflections/realtime-transport-webrtc";

const config = {
  voice: "alloy",
  persona: "You are a helpful AI assistant.",
  instructions: "You are a helpful AI assistant.",
  capabilities: ["text", "audio", "tools"],
  featureFlags: {
    memory: "off",
  },
  tools: [
    {
      type: "function",
      name: "echo",
      description: "Echoes back the provided arguments",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message to echo back" },
        },
        required: ["message"],
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

// Connect to the transport
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

### Configuration

The transport accepts the following configuration:

```typescript
interface WebRTCTransportConfig {
  voice?: string; // Voice model (e.g., "alloy")
  persona?: string; // AI persona description
  instructions?: string; // System instructions
  capabilities?: string[]; // Supported capabilities
  featureFlags?: {
    // Feature flags
    memory?: string;
  };
  tools?: Array<{
    // Available tools
    type: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}
```

### Dependencies

The transport requires a session token provider:

```typescript
interface WebRTCTransportDeps {
  getSessionToken: () => Promise<{
    client_secret: { value: string; expires_at: string };
    session_id: string;
    model: string;
  }>;
}
```

## API Reference

### `createWebRTCTransport(config, deps)`

Creates a WebRTC transport instance.

**Parameters:**

- `config`: Transport configuration
- `deps`: Required dependencies

**Returns:** `Transport` instance

### Transport Methods

The transport implements the `Transport` interface:

- `connect(opts)`: Establish WebRTC connection
- `send(event)`: Send event through data channel
- `close()`: Close connection and cleanup resources

### Connection Options

```typescript
interface ConnectOptions {
  token: string; // Authentication token
  onEvent: (event: unknown) => void; // Event handler
}
```

## WebRTC Features

### Audio Streaming

- **Input**: 24kHz mono audio from microphone
- **Output**: Real-time audio playback
- **Codec**: PCM audio format
- **Quality**: High-quality voice communication

### Data Channel

- **Protocol**: Reliable ordered data channel
- **Events**: JSON-serialized event messages
- **Reconnection**: Automatic reconnection on channel close
- **Error Handling**: Comprehensive error management

### ICE Servers

The transport uses Google's public STUN servers:

- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production use, consider using your own TURN servers for better connectivity.

## Browser Support

The transport requires modern browsers with WebRTC support:

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

### Required APIs

- `RTCPeerConnection`
- `RTCDataChannel`
- `MediaDevices.getUserMedia`
- `AudioContext` (for audio processing)

## Error Handling

The transport includes comprehensive error handling:

- **Connection Failures**: Automatic retry and fallback
- **Microphone Access**: Graceful handling of permission denials
- **Network Issues**: Connection state monitoring
- **Data Channel Errors**: Automatic reconnection

## Performance

### Audio Latency

- **Target**: <400ms time-to-first-audio
- **Optimization**: Direct peer-to-peer connection
- **Buffering**: Minimal audio buffering

### Resource Usage

- **Memory**: Efficient audio buffer management
- **CPU**: Optimized audio processing
- **Network**: Minimal bandwidth usage

## Development

### Scripts

- `pnpm build`: Build the package
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm lint`: Run ESLint
- `pnpm clean`: Clean build artifacts

### Testing

```bash
# Run tests
pnpm test

# Run tests in browser
pnpm test:browser
```

## Dependencies

- `@thrivereflections/realtime-contracts`: Shared type definitions

## License

MIT
