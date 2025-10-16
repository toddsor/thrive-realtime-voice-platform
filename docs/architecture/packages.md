# Package Architecture

The Thrive Realtime Voice Platform is organized into focused packages with clear boundaries and minimal dependencies. Each package has a single responsibility and can be used independently or in combination with other packages.

> **📦 All packages are published to npm** under the `@thrivereflections/` scope and can be installed directly: `npm install @thrivereflections/realtime-core`

## Package Catalog

### Core Packages

#### `@thrivereflections/realtime-contracts`

**Purpose**: Type definitions and interfaces shared across all packages.

**Key Exports**:

- `Transport` - Audio transport interface
- `Store` - Data persistence interface
- `Tool` - Tool execution interface
- `AuthProvider` - Authentication interface
- `RuntimeConfig` - Configuration types
- `FeatureFlags` - Feature flag definitions
- `PolicyConfig` - Security and operational policies

**Dependencies**: None (pure types)

**Rules**:

- No runtime dependencies
- Backward-compatible changes only
- Additive-only modifications
- No `process.env` access

#### `@thrivereflections/realtime-core`

**Purpose**: Core runtime logic for session management and transport coordination.

**Key Exports**:

- `initRealtime()` - Initialize realtime session
- `createSession()` - Create new voice session
- `TransportFactory` - Transport creation interface
- `SessionManager` - Session lifecycle management

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- No direct environment access
- Configuration via dependency injection
- Transport-agnostic implementation
- No external service dependencies

#### `@thrivereflections/realtime-config`

**Purpose**: Configuration loading and validation at the application layer.

**Key Exports**:

- `loadRuntimeConfig()` - Load and validate runtime configuration
- `loadDatabaseConfig()` - Load database configuration
- `loadAuthConfig()` - Load authentication configuration
- `validateConfig()` - Validate configuration objects

**Dependencies**:

- `@thrivereflections/realtime-contracts`

**Rules**:

- Only package that can access `process.env`
- Validates all environment variables
- Provides sensible defaults
- Type-safe configuration objects

### Adapter Packages

#### `@thrivereflections/realtime-store-prisma`

**Purpose**: Database persistence adapter using Prisma ORM.

**Key Exports**:

- `createPrismaStore()` - Create Prisma-based store
- `PrismaStoreConfig` - Configuration interface
- `PrismaStore` - Store implementation

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`
- `@prisma/client`

**Rules**:

- Implements `Store` interface
- Server-side only operations
- PII redaction support
- Connection pooling support

#### `@thrivereflections/realtime-auth-supabase`

**Purpose**: Authentication adapter using Supabase Auth.

**Key Exports**:

- `createSupabaseAuth()` - Create Supabase auth provider
- `SupabaseAuthProvider` - Auth provider implementation
- `UserSync` - User synchronization utilities

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`
- `@supabase/supabase-js`

**Rules**:

- Implements `AuthProvider` interface
- Multi-provider OAuth support
- User data synchronization
- Session management

#### `@thrivereflections/realtime-transport-webrtc`

**Purpose**: WebRTC transport implementation for low-latency audio streaming.

**Key Exports**:

- `createWebRTC()` - Create WebRTC transport
- `WebRTCTransport` - Transport implementation
- `WebRTCConfig` - Configuration interface

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- Implements `Transport` interface
- WebRTC-specific implementation
- Automatic connection management
- Error handling and fallback

#### `@thrivereflections/realtime-transport-websocket`

**Purpose**: WebSocket transport implementation for reliable audio streaming.

**Key Exports**:

- `createWebSocket()` - Create WebSocket transport
- `WebSocketTransport` - Transport implementation
- `WebSocketConfig` - Configuration interface

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- Implements `Transport` interface
- WebSocket-specific implementation
- Automatic reconnection
- Fallback for WebRTC failures

### Feature Packages

#### `@thrivereflections/realtime-tool-gateway`

**Purpose**: Tool execution system with allow-list policy enforcement.

**Key Exports**:

- `ToolGateway` - Tool execution gateway
- `createToolGateway()` - Create tool gateway instance
- `ToolPolicy` - Security policy interface
- `RAGIntegration` - Retrieval Augmented Generation

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`
- `@thrivereflections/realtime-usage`

**Rules**:

- Allow-list policy enforcement
- Secure tool execution sandbox
- RAG integration support
- Usage tracking integration

#### `@thrivereflections/realtime-usage`

**Purpose**: Cost tracking and analytics for OpenAI API usage.

**Key Exports**:

- `UsageTracker` - Usage tracking service
- `CostCalculator` - Cost calculation utilities
- `QuotaManager` - Quota enforcement
- `UsageAnalytics` - Analytics and reporting

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- Real-time cost tracking
- Quota enforcement
- Analytics and reporting
- Multi-tenant support

#### `@thrivereflections/realtime-security`

**Purpose**: Security utilities and content safety features.

**Key Exports**:

- `ContentSafety` - Content filtering and safety
- `PIIRedaction` - PII detection and redaction
- `RateLimiter` - API rate limiting
- `InputValidator` - Input validation utilities

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- Content safety by default
- PII redaction support
- Rate limiting enforcement
- Input validation

#### `@thrivereflections/realtime-sre`

**Purpose**: Site reliability engineering tools and monitoring.

**Key Exports**:

- `HealthCheckManager` - Health check system
- `AlertManager` - Alert management
- `CircuitBreaker` - Circuit breaker pattern
- `SyntheticMonitoring` - Synthetic monitoring

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `@thrivereflections/realtime-observability`

**Rules**:

- Health monitoring
- Alert management
- Circuit breaker protection
- Synthetic monitoring

#### `@thrivereflections/realtime-observability`

**Purpose**: Logging and monitoring infrastructure.

**Key Exports**:

- `Logger` - Structured logging
- `MetricsCollector` - Metrics collection
- `LogSink` - Log output management
- `CorrelationId` - Request correlation

**Dependencies**:

- `@thrivereflections/realtime-contracts`

**Rules**:

- Structured logging
- Metrics collection
- Request correlation
- Multiple output formats

### UI Packages

#### `@thrivereflections/realtime-ui-components`

**Purpose**: React UI components for voice applications.

**Key Exports**:

- `VoiceInterface` - Main voice UI component
- `TranscriptDisplay` - Live transcript display
- `CostTracker` - Usage cost display
- `ConnectionStatus` - Connection status indicator

**Dependencies**:

- `@thrivereflections/realtime-contracts`
- `react`
- `@radix-ui/*` (UI primitives)

**Rules**:

- React 19 compatible
- Accessible by default
- Themeable components
- TypeScript support

#### `@thrivereflections/realtime-lib`

**Purpose**: Shared utilities and helpers.

**Key Exports**:

- `prisma` - Prisma client utilities
- `cn` - CSS class name utilities
- Common helper functions

**Dependencies**:

- `@prisma/client`
- `clsx`
- `tailwind-merge`

**Rules**:

- Shared utilities only
- No business logic
- Framework agnostic where possible
- Minimal dependencies

## Package Relationships

```
@thrivereflections/realtime-contracts (no deps)
    ↑
@thrivereflections/realtime-core
    ↑
@thrivereflections/realtime-{transport,store,auth} (adapters)
    ↑
@thrivereflections/realtime-{tool-gateway,usage,security,sre} (features)
    ↑
@thrivereflections/realtime-ui-components (UI)
```

## Build Order

> **Note**: All packages are pre-built and published to npm with TypeScript declarations. The build order below is only relevant for development within the monorepo or when building packages manually.

### Level 1: Foundation (no dependencies)

1. **@thrivereflections/realtime-contracts** - Pure TypeScript types and interfaces

### Level 2: Core Infrastructure (depends on contracts only)

2. **@thrivereflections/realtime-observability** - Logging and monitoring
3. **@thrivereflections/realtime-config** - Configuration management
4. **@thrivereflections/realtime-security** - Security utilities
5. **@thrivereflections/realtime-usage** - Usage tracking
6. **@thrivereflections/realtime-lib** - Shared utilities (no @thrive deps)

### Level 3: Core Runtime (depends on contracts + observability)

7. **@thrivereflections/realtime-core** - Core runtime logic
8. **@thrivereflections/realtime-transport-webrtc** - WebRTC transport
9. **@thrivereflections/realtime-transport-websocket** - WebSocket transport
10. **@thrivereflections/realtime-store-prisma** - Database persistence
11. **@thrivereflections/realtime-auth-supabase** - Authentication
12. **@thrivereflections/realtime-sre** - SRE tools

### Level 4: Features (depends on core packages)

13. **@thrivereflections/realtime-tool-gateway** - Tool execution
14. **@thrivereflections/realtime-ui-components** - React UI components

> **Important**: The monorepo's Turborepo configuration automatically handles build order. This is only relevant when building packages manually in standalone applications.

## Usage Patterns

### Minimal Setup

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";

const config = loadRuntimeConfig();
const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: (kind) => createTransport(kind),
});
```

### Full Platform Setup

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { createSupabaseAuth } from "@thrivereflections/realtime-auth-supabase";
import { createToolGateway } from "@thrivereflections/realtime-tool-gateway";

const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: (kind) => createTransport(kind),
  store: createPrismaStore(dbConfig),
  auth: createSupabaseAuth(authConfig),
  tools: createToolGateway(toolConfig),
});
```
