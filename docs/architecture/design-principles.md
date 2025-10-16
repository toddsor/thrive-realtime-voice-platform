# Design Principles

The Thrive Realtime Voice Platform is built on core architectural principles that ensure maintainability, testability, and flexibility.

## Core Principles

### 1. No Hidden Environment Coupling

**Problem**: Direct `process.env` access in core packages creates hidden dependencies and makes testing difficult.

**Solution**: All environment access happens at the application layer. Core packages receive configuration through explicit injection.

```typescript
// ❌ Don't do this in core packages
const apiKey = process.env.OPENAI_API_KEY;

// ✅ Do this instead
interface RuntimeConfig {
  openaiKey: string;
  model: string;
}

function initRealtime(config: RuntimeConfig) {
  // Use config.openaiKey instead of process.env
}
```

### 2. Contracts-First Design

**Problem**: Package interfaces change frequently, breaking downstream applications.

**Solution**: Stable contracts in `@thrivereflections/realtime-contracts` provide compile-time safety and enable additive-only changes.

```typescript
// contracts/types.ts
export interface Transport {
  kind: TransportKind;
  connect(opts: { token: string }): Promise<void>;
  send(event: unknown): void;
  onEvent(cb: (event: unknown) => void): void;
  close(): Promise<void>;
}

// All transport implementations must satisfy this contract
export class WebRTCTransport implements Transport {
  // Implementation details...
}
```

### 3. Dependency Injection

**Problem**: Hard-coded dependencies make packages difficult to test and configure.

**Solution**: All external dependencies are injected through constructor parameters or factory functions.

```typescript
// Core package receives dependencies via injection
export function initRealtime(
  config: RuntimeConfig,
  deps: {
    getToken: () => Promise<string>;
    transportFactory?: (kind: TransportKind) => Transport;
    logger?: Logger;
  }
) {
  // Use injected dependencies
}
```

### 4. Replaceable Adapters

**Problem**: Tight coupling to specific implementations limits flexibility.

**Solution**: All external integrations are behind interfaces with default implementations.

```typescript
// Store interface allows different implementations
export interface Store {
  saveSession(meta: SessionMeta): Promise<void>;
  saveTranscript(input: TranscriptInput): Promise<void>;
}

// Prisma adapter implements the interface
export function createPrismaStore(config: PrismaStoreConfig): Store {
  // Implementation...
}

// Memory adapter for testing
export function createMemoryStore(): Store {
  // Implementation...
}
```

### 5. Secure by Default

**Problem**: Security vulnerabilities often arise from unsafe defaults.

**Solution**: Safe defaults when configuration values are missing, with explicit opt-in for risky features.

```typescript
// Safe defaults
const config = {
  enablePIIRedaction: true, // Default: enabled
  maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  rateLimitPerMinute: 60, // Conservative default
  allowUnsafeToolExecution: false, // Explicit opt-in required
  ...userConfig,
};
```

## Package Design Rules

### Contract Package (`@thrivereflections/realtime-contracts`)

- **No runtime dependencies** - Pure TypeScript interfaces
- **Backward-compatible changes only** - Additive modifications
- **No `process.env` access** - Environment-agnostic
- **Stable interfaces** - Breaking changes require major version bump

### Core Package (`@thrivereflections/realtime-core`)

- **No direct environment access** - Configuration via injection
- **Transport-agnostic implementation** - Works with any transport
- **No external service dependencies** - Pure business logic
- **Testable by design** - All dependencies injected

### Adapter Packages

- **Single responsibility** - One external integration per package
- **Interface compliance** - Must implement contracts exactly
- **Configuration-driven** - Behavior controlled by config objects
- **Replaceable** - Can be swapped without changing core logic

## Benefits

1. **Testability** - All dependencies can be mocked
2. **Flexibility** - Easy to swap implementations
3. **Maintainability** - Clear boundaries and responsibilities
4. **Security** - Safe defaults and explicit configuration
5. **Evolution** - Packages can evolve without breaking changes
