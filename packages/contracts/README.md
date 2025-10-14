# @thrive/realtime-contracts

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
pnpm add @thrive/realtime-contracts
```

## Usage

```typescript
import { AgentConfig, ToolCall, PersistenceStore } from '@thrive/realtime-contracts';

// Use the types in your application
const config: AgentConfig = {
  // ... configuration
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

## Rules

- No implementation code
- Pure TypeScript interfaces and types only
- No environment variable access
- Stable API (additive changes only)
- No external dependencies
