# Package Architecture

The Thrive Realtime Voice Platform is organized into focused packages with clear boundaries and minimal dependencies. Each package has a single responsibility and can be used independently or in combination with other packages.

## Package Catalog

### Core Packages

#### `@thrive/realtime-contracts`
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

#### `@thrive/realtime-core`
**Purpose**: Core runtime logic for session management and transport coordination.

**Key Exports**:
- `initRealtime()` - Initialize realtime session
- `createSession()` - Create new voice session
- `TransportFactory` - Transport creation interface
- `SessionManager` - Session lifecycle management

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- No direct environment access
- Configuration via dependency injection
- Transport-agnostic implementation
- No external service dependencies

#### `@thrive/realtime-config`
**Purpose**: Configuration loading and validation at the application layer.

**Key Exports**:
- `loadRuntimeConfig()` - Load and validate runtime configuration
- `loadDatabaseConfig()` - Load database configuration
- `loadAuthConfig()` - Load authentication configuration
- `validateConfig()` - Validate configuration objects

**Dependencies**:
- `@thrive/realtime-contracts`

**Rules**:
- Only package that can access `process.env`
- Validates all environment variables
- Provides sensible defaults
- Type-safe configuration objects

### Adapter Packages

#### `@thrive/realtime-store-prisma`
**Purpose**: Database persistence adapter using Prisma ORM.

**Key Exports**:
- `createPrismaStore()` - Create Prisma-based store
- `PrismaStoreConfig` - Configuration interface
- `PrismaStore` - Store implementation

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`
- `@prisma/client`

**Rules**:
- Implements `Store` interface
- Server-side only operations
- PII redaction support
- Connection pooling support

#### `@thrive/realtime-auth-supabase`
**Purpose**: Authentication adapter using Supabase Auth.

**Key Exports**:
- `createSupabaseAuth()` - Create Supabase auth provider
- `SupabaseAuthProvider` - Auth provider implementation
- `UserSync` - User synchronization utilities

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`
- `@supabase/supabase-js`

**Rules**:
- Implements `AuthProvider` interface
- Multi-provider OAuth support
- User data synchronization
- Session management

#### `@thrive/realtime-transport-webrtc`
**Purpose**: WebRTC transport implementation for low-latency audio streaming.

**Key Exports**:
- `createWebRTC()` - Create WebRTC transport
- `WebRTCTransport` - Transport implementation
- `WebRTCConfig` - Configuration interface

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- Implements `Transport` interface
- WebRTC-specific implementation
- Automatic connection management
- Error handling and fallback

#### `@thrive/realtime-transport-websocket`
**Purpose**: WebSocket transport implementation for reliable audio streaming.

**Key Exports**:
- `createWebSocket()` - Create WebSocket transport
- `WebSocketTransport` - Transport implementation
- `WebSocketConfig` - Configuration interface

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- Implements `Transport` interface
- WebSocket-specific implementation
- Automatic reconnection
- Fallback for WebRTC failures

### Feature Packages

#### `@thrive/realtime-tool-gateway`
**Purpose**: Tool execution system with allow-list policy enforcement.

**Key Exports**:
- `ToolGateway` - Tool execution gateway
- `createToolGateway()` - Create tool gateway instance
- `ToolPolicy` - Security policy interface
- `RAGIntegration` - Retrieval Augmented Generation

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`
- `@thrive/realtime-usage`

**Rules**:
- Allow-list policy enforcement
- Secure tool execution sandbox
- RAG integration support
- Usage tracking integration

#### `@thrive/realtime-usage`
**Purpose**: Cost tracking and analytics for OpenAI API usage.

**Key Exports**:
- `UsageTracker` - Usage tracking service
- `CostCalculator` - Cost calculation utilities
- `QuotaManager` - Quota enforcement
- `UsageAnalytics` - Analytics and reporting

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- Real-time cost tracking
- Quota enforcement
- Analytics and reporting
- Multi-tenant support

#### `@thrive/realtime-security`
**Purpose**: Security utilities and content safety features.

**Key Exports**:
- `ContentSafety` - Content filtering and safety
- `PIIRedaction` - PII detection and redaction
- `RateLimiter` - API rate limiting
- `InputValidator` - Input validation utilities

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- Content safety by default
- PII redaction support
- Rate limiting enforcement
- Input validation

#### `@thrive/realtime-sre`
**Purpose**: Site reliability engineering tools and monitoring.

**Key Exports**:
- `HealthCheckManager` - Health check system
- `AlertManager` - Alert management
- `CircuitBreaker` - Circuit breaker pattern
- `SyntheticMonitoring` - Synthetic monitoring

**Dependencies**:
- `@thrive/realtime-contracts`
- `@thrive/realtime-observability`

**Rules**:
- Health monitoring
- Alert management
- Circuit breaker protection
- Synthetic monitoring

#### `@thrive/realtime-observability`
**Purpose**: Logging and monitoring infrastructure.

**Key Exports**:
- `Logger` - Structured logging
- `MetricsCollector` - Metrics collection
- `LogSink` - Log output management
- `CorrelationId` - Request correlation

**Dependencies**:
- `@thrive/realtime-contracts`

**Rules**:
- Structured logging
- Metrics collection
- Request correlation
- Multiple output formats

### UI Packages

#### `@thrive/realtime-ui-components`
**Purpose**: React UI components for voice applications.

**Key Exports**:
- `VoiceInterface` - Main voice UI component
- `TranscriptDisplay` - Live transcript display
- `CostTracker` - Usage cost display
- `ConnectionStatus` - Connection status indicator

**Dependencies**:
- `@thrive/realtime-contracts`
- `react`
- `@radix-ui/*` (UI primitives)

**Rules**:
- React 19 compatible
- Accessible by default
- Themeable components
- TypeScript support

#### `@thrive/realtime-lib`
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
@thrive/realtime-contracts (no deps)
    ↑
@thrive/realtime-core
    ↑
@thrive/realtime-{transport,store,auth} (adapters)
    ↑
@thrive/realtime-{tool-gateway,usage,security,sre} (features)
    ↑
@thrive/realtime-ui-components (UI)
```

## Usage Patterns

### Minimal Setup
```typescript
import { initRealtime } from '@thrive/realtime-core';
import { loadRuntimeConfig } from '@thrive/realtime-config';

const config = loadRuntimeConfig();
const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: (kind) => createTransport(kind)
});
```

### Full Platform Setup
```typescript
import { initRealtime } from '@thrive/realtime-core';
import { createPrismaStore } from '@thrive/realtime-store-prisma';
import { createSupabaseAuth } from '@thrive/realtime-auth-supabase';
import { createToolGateway } from '@thrive/realtime-tool-gateway';

const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: (kind) => createTransport(kind),
  store: createPrismaStore(dbConfig),
  auth: createSupabaseAuth(authConfig),
  tools: createToolGateway(toolConfig)
});
```
