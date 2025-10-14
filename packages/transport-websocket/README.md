# @thrive/realtime-transport-websocket

WebSocket transport implementation for the Thrive Realtime Voice Platform.

## Overview

This package provides a WebSocket-based transport for real-time voice communication using OpenAI's Realtime API. It handles audio streaming and event communication through WebSocket connections.

## Features

- **WebSocket Communication**: Reliable WebSocket-based event handling
- **Audio Processing**: Real-time audio input/output processing
- **PCM Audio Format**: 24kHz PCM audio encoding/decoding
- **Microphone Access**: Automatic microphone setup and management
- **Audio Playback**: Real-time audio output
- **Connection Management**: Automatic reconnection and error handling
- **Voice Activity Detection**: Server-side voice activity detection

## Installation

```bash
pnpm add @thrive/realtime-transport-websocket
```

## Usage

### Basic Setup

```typescript
import { createWebSocketTransport } from "@thrive/realtime-transport-websocket";

const config = {
  voice: "alloy",
  persona: "You are a helpful AI assistant.",
  instructions: "You are a helpful AI assistant.",
  capabilities: ["text", "audio", "tools"],
  featureFlags: {
    memory: "off"
  },
  tools: [
    {
      type: "function",
      name: "echo",
      description: "Echoes back the provided arguments",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message to echo back" }
        },
        required: ["message"]
      }
    }
  ]
};

const deps = {
  getSessionToken: async () => {
    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return response.json();
  }
};

const transport = createWebSocketTransport(config, deps);

// Connect to the transport
await transport.connect({
  token: "your-token",
  onEvent: (event) => console.log("Event:", event)
});

// Send events
transport.send({
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: "Hello!"
  }
});

// Close connection
await transport.close();
```

### Configuration

The transport accepts the following configuration:

```typescript
interface WebSocketTransportConfig {
  voice?: string;                    // Voice model (e.g., "alloy")
  persona?: string;                  // AI persona description
  instructions?: string;             // System instructions
  capabilities?: string[];           // Supported capabilities
  featureFlags?: {                   // Feature flags
    memory?: string;
  };
  tools?: Array<{                    // Available tools
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
interface WebSocketTransportDeps {
  getSessionToken: () => Promise<{
    client_secret: { value: string; expires_at: string };
    session_id: string;
    model: string;
  }>;
}
```

## API Reference

### `createWebSocketTransport(config, deps)`

Creates a WebSocket transport instance.

**Parameters:**
- `config`: Transport configuration
- `deps`: Required dependencies

**Returns:** `Transport` instance

### Transport Methods

The transport implements the `Transport` interface:

- `connect(opts)`: Establish WebSocket connection
- `send(event)`: Send event through WebSocket
- `close()`: Close connection and cleanup resources

### Connection Options

```typescript
interface ConnectOptions {
  token: string;                     // Authentication token
  onEvent: (event: unknown) => void; // Event handler
}
```

## WebSocket Features

### Audio Processing

- **Input**: 24kHz mono PCM audio from microphone
- **Output**: Real-time audio playback
- **Format**: Base64-encoded PCM16 audio
- **Processing**: Real-time audio buffer processing

### Event Handling

The transport handles various event types:

- **Session Events**: `session.created`, `session.update`
- **Conversation Events**: `conversation.item.created`, `conversation.item.completed`
- **Audio Events**: `response.audio.delta`, `input_audio_buffer.*`
- **Text Events**: `response.text.delta`, `response.done`
- **Tool Events**: `response.function_call_arguments.*`
- **Transcription Events**: `conversation.item.input_audio_transcription.completed`

### Voice Activity Detection

The transport uses server-side voice activity detection:

- **Type**: Server VAD
- **Threshold**: 0.5 (configurable)
- **Padding**: 300ms prefix, 200ms silence duration
- **Model**: Whisper-1 for transcription

## Browser Support

The transport requires modern browsers with WebSocket and Web Audio API support:

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

### Required APIs

- `WebSocket`
- `MediaDevices.getUserMedia`
- `AudioContext`
- `ScriptProcessorNode` (deprecated but still supported)

## Performance

### Audio Latency

- **Target**: <400ms time-to-first-audio
- **Processing**: Real-time audio buffer processing
- **Network**: WebSocket connection with minimal overhead

### Resource Usage

- **Memory**: Efficient audio buffer management
- **CPU**: Optimized audio processing
- **Network**: Compressed WebSocket messages

## Error Handling

The transport includes comprehensive error handling:

- **Connection Failures**: Automatic retry and fallback
- **Microphone Access**: Graceful handling of permission denials
- **Network Issues**: Connection state monitoring
- **Audio Processing**: Error recovery for audio operations

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

- `@thrive/realtime-contracts`: Shared type definitions

## License

MIT
