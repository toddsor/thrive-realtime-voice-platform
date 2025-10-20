# @thrivereflections/realtime-contracts

Core TypeScript interfaces and types for the Thrive Realtime Voice Platform.

## Overview

This package contains all the shared TypeScript interfaces and types used across the platform. It has no dependencies and provides stable contracts for:

- Agent configuration
- Event definitions
- Tool call contracts
- Persistence store interfaces
- Transport abstractions
- Runtime configuration

## Installation

```bash
pnpm add @thrivereflections/realtime-contracts
```

## Usage

```typescript
import {
  AgentConfig,
  ToolCall,
  PersistenceStore,
  IdentityLevel,
  ClientIdentity,
  ToolPolicy,
  ToolDefinition,
} from "@thrivereflections/realtime-contracts";

// Use the types in your application
const config: AgentConfig = {
  // ... configuration
};

// Identity management
const identity: ClientIdentity = {
  level: "anonymous",
  anonymousId: "anon_123456789",
  consent: "ACCEPTED",
};

// Tool definition with policy
const tool: ToolDefinition = {
  type: "function",
  name: "weather",
  description: "Get weather information",
  parameters: {
    /* ... */
  },
  policy: {
    minIdentityLevel: "anonymous",
    requiresExternalAccess: true,
    piiHandling: "redact",
    maxCallsPerSession: 5,
  },
};
```

## API Reference

### Core Types

- `AgentConfig` - Agent behavior and capabilities
- `ToolCall` - Tool invocation format
- `Events` - WebRTC data channel events
- `PersistenceStore` - Database storage interface
- `Transport` - Audio transport abstraction
- `RuntimeConfig` - Runtime configuration

### Identity Types

- `IdentityLevel` - User identity level (ephemeral, local, anonymous, pseudonymous, authenticated)
- `ConsentState` - User consent status (ACCEPTED, DECLINED, UNKNOWN)
- `RetentionPolicy` - Data retention configuration with max age and size limits
- `ClientIdentity` - Client-side identity information
- `SessionIdentity` - Server-side identity with session context

### Tool Policy Types

- `ToolPolicy` - Declarative policy for tool execution requirements
- `ToolDefinition` - Complete tool definition including policy

## Rules

- No implementation code
- Pure TypeScript interfaces and types only
- No environment variable access
- Stable API (additive changes only)
- No external dependencies
