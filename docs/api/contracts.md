# @thrivereflections/realtime-contracts

Core TypeScript interfaces and types for the Thrive Realtime Voice Platform.

## Overview

This package contains all shared TypeScript interfaces and types used across the platform. It has no dependencies and provides stable contracts for agent configuration, event definitions, tool calls, persistence stores, and transport abstractions.

## Installation

```bash
npm install @thrivereflections/realtime-contracts
```

## Main Exports

### Core Interfaces

- **`Transport`** - Audio transport abstraction for WebRTC/WebSocket
- **`Store`** - Data persistence interface for session storage
- **`PersistenceStore`** - Extended store interface with consent management
- **`AgentConfig`** - Agent behavior and capabilities configuration
- **`ToolCall`** - Tool invocation format and execution
- **`Events`** - WebRTC data channel event definitions
- **`RuntimeConfig`** - Runtime configuration and feature flags

### Configuration Types

- **`FeatureFlags`** - Feature flag definitions
- **`PolicyConfig`** - Security and operational policies
- **`SessionLimits`** - User tier and session duration limits

## Usage Example

```typescript
import {
  Transport,
  AgentConfig,
  ToolCall,
  PersistenceStore,
  RuntimeConfig,
} from "@thrivereflections/realtime-contracts";

// Define agent configuration
const agentConfig: AgentConfig = {
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

// Runtime configuration
const runtimeConfig: RuntimeConfig = {
  featureFlags: {
    transport: "webrtc",
    memory: "off",
  },
  sessionLimits: {
    maxDuration: 30 * 60 * 1000, // 30 minutes
    maxToolCalls: 100,
  },
};
```

## Key Features

- **Zero Dependencies** - Pure TypeScript types only
- **Stable API** - Additive changes only, backward compatible
- **Type Safety** - Full TypeScript support with IntelliSense
- **Platform Agnostic** - No environment variable access

## Package Rules

- No implementation code
- Pure TypeScript interfaces and types only
- No external dependencies
- Stable API (additive changes only)
- No `process.env` access

## Related Documentation

- [Core Runtime](./core.md) - Uses these contracts
- [Transports](./transports.md) - Implements Transport interface
- [Store](./store.md) - Implements Store interfaces
- [Package README](../../packages/contracts/README.md) - Detailed package documentation
