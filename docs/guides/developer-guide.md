# Developer Guide

A comprehensive guide for building applications with the Thrive Realtime Voice Platform.

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Building Your First App](#building-your-first-app)
3. [Common Patterns](#common-patterns)
4. [Production Considerations](#production-considerations)
5. [API Routes](#api-routes)

## Understanding the Architecture

### Package Overview

The Thrive Realtime Voice Platform is organized into focused packages with clear boundaries:

#### Core Packages (Required)

- **`@thrivereflections/realtime-contracts`** - Type definitions and interfaces
- **`@thrivereflections/realtime-core`** - Runtime initialization and event routing
- **`@thrivereflections/realtime-config`** - Configuration management

#### Transport Packages (Choose One)

- **`@thrivereflections/realtime-transport-webrtc`** - Low-latency peer-to-peer
- **`@thrivereflections/realtime-transport-websocket`** - Reliable server-mediated

#### Feature Packages (Optional)

- **`@thrivereflections/realtime-auth-supabase`** - Authentication
- **`@thrivereflections/realtime-store-prisma`** - Database persistence
- **`@thrivereflections/realtime-tool-gateway`** - Tool execution and RAG
- **`@thrivereflections/realtime-usage`** - Cost tracking and analytics
- **`@thrivereflections/realtime-security`** - Security and content safety
- **`@thrivereflections/realtime-sre`** - Monitoring and alerting
- **`@thrivereflections/realtime-observability`** - Logging and metrics

### Package Relationships

```
Contracts (no deps)
    ↑
Core + Config + Observability
    ↑
Transports + Store + Auth
    ↑
Tools + Usage + Security + SRE
```

### When to Use Which Packages

**Minimal Setup:**

- `contracts` + `core` + `config` + `transports` + `observability`

**With Authentication:**

- Add `auth-supabase`

**With Persistence:**

- Add `store-prisma`

**With Tools:**

- Add `tool-gateway`

**Production Ready:**

- Add `usage` + `security` + `sre`

## Building Your First App

### Step 1: Minimal Setup

Start with the core packages for a basic voice application:

```typescript
// app.ts
import { initRealtime } from "@thrivereflections/realtime-core";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";
import { createWebRTCTransport } from "@thrivereflections/realtime-transport-webrtc";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

// Load configuration
const config = loadRuntimeConfig();

// Create logger
const logger = new InjectableConsoleLogger("voice-app");

// Create transport factory
const createTransport = (kind: string) => {
  if (kind === "webrtc") {
    return createWebRTCTransport(config, {
      getSessionToken: async () => {
        const response = await fetch("/api/realtime/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        return response.json();
      },
    });
  }
  throw new Error(`Unsupported transport: ${kind}`);
};

// Initialize realtime
const realtime = initRealtime(config, {
  getToken: async () => "your-session-token",
  transportFactory: createTransport,
  onEvent: (event) => {
    logger.info("Event received", { event });
  },
  logger,
});

// Start the application
await realtime.start();
```

### Step 2: Add Authentication

Add user authentication with Supabase:

```typescript
// auth.ts
import { createAuthProvider } from "@thrivereflections/realtime-auth-supabase";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("auth");

const authProvider = createAuthProvider({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  logger,
});

// Check authentication
const isAuthenticated = await authProvider.isAuthenticated();
if (!isAuthenticated) {
  // Redirect to login or show login UI
  await authProvider.signInWithOAuth("google");
}

// Get current user
const user = await authProvider.getCurrentUser();
```

### Step 3: Add Persistence

Add database persistence for sessions and transcripts:

```typescript
// store.ts
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { redact } from "@thrivereflections/realtime-security";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("store");

const store = createPrismaStore(
  {
    databaseUrl: process.env.DATABASE_URL!,
    logLevel: "warn",
  },
  {
    redact, // PII redaction function
  }
);

// Use store in your application
await store.saveSessionMeta(sessionId, user, config, timings, "ACCEPTED");
```

### Step 4: Add Tools

Add tool execution with RAG support:

```typescript
// tools.ts
import { ToolGateway, createVectorStore } from "@thrivereflections/realtime-tool-gateway";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("tools");

// Create vector store for RAG
const vectorStore = createVectorStore(process.env.OPENAI_API_KEY!);

// Create tool gateway
const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024,
    maxSessionDuration: 30 * 60 * 1000,
  },
  allowList: ["echo", "retrieve"],
  logger,
});

// Register tools
gateway.register("echo", echoTool);
gateway.register("retrieve", retrieveTool, { vectorStore });

// Execute tools
const result = await gateway.execute("retrieve", {
  query: "What is the platform architecture?",
  limit: 5,
});
```

### Step 5: Progressive Enhancement

Build your application with progressive enhancement:

```typescript
// app.ts - Complete setup
import { initRealtime } from "@thrivereflections/realtime-core";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";
import { createWebRTCTransport } from "@thrivereflections/realtime-transport-webrtc";
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";
import { createAuthProvider } from "@thrivereflections/realtime-auth-supabase";
import { ToolGateway } from "@thrivereflections/realtime-tool-gateway";
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("app");

// Load configuration
const config = loadRuntimeConfig();

// Create dependencies
const authProvider = createAuthProvider({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  logger,
});

const store = createPrismaStore({ databaseUrl: process.env.DATABASE_URL!, logLevel: "warn" }, { redact });

const gateway = new ToolGateway({
  policies: { maxPayloadBytes: 1024 * 1024, maxSessionDuration: 30 * 60 * 1000 },
  allowList: ["echo", "retrieve"],
  logger,
});

// Initialize realtime with all features
const realtime = initRealtime(config, {
  getToken: async () => {
    const user = await authProvider.getCurrentUser();
    return user ? await generateToken(user) : null;
  },
  transportFactory: createTransport,
  onEvent: async (event) => {
    logger.info("Event received", { event });

    // Handle tool calls
    if (event.type === "response.function_call") {
      const result = await gateway.execute(event.name, event.arguments);
      // Send result back through transport
    }

    // Persist events
    if (store && event.type === "conversation.item.created") {
      await store.appendTranscript(sessionId, event.item);
    }
  },
  logger,
});

await realtime.start();
```

## Common Patterns

### Code Organization

Structure your code with clear separation between reusable platform code and app-specific code:

```
your-app/
├── lib/
│   ├── platform/          # Reusable platform patterns
│   │   ├── index.ts       # Platform exports
│   │   └── tools/         # Custom tools
│   ├── demo/              # App-specific code
│   │   └── index.ts       # App exports
│   ├── utils/             # Shared utilities
│   └── config/            # Configuration files
```

**Platform Code** (`lib/platform/`):

- Reusable integration patterns
- Custom tool implementations
- Configuration utilities
- Cost calculation utilities

**App Code** (`lib/demo/`):

- App-specific components
- Business logic
- Custom hooks
- Store implementations

**Example:**

```typescript
// lib/platform/index.ts - Reusable patterns
export { calculateUsageCost, createCustomAgentConfig, executeToolCall } from "./utils";

// lib/demo/index.ts - App-specific
export { useRealtimeVoice, demoStore } from "./hooks";

// Usage in app
import { calculateUsageCost } from "@/lib/platform";
import { useRealtimeVoice } from "@/lib/demo";
```

See the [demo app structure](../../apps/demo-voice/lib/README.md) for complete patterns.

### Session Management

```typescript
// session-manager.ts
class SessionManager {
  private sessions = new Map<string, Session>();

  async createSession(user: User, config: AgentConfig): Promise<string> {
    const sessionId = generateId();
    const session = {
      id: sessionId,
      userId: user.id,
      config,
      startTime: new Date(),
      status: "active",
    };

    this.sessions.set(sessionId, session);

    // Persist session
    if (this.store) {
      await this.store.saveSessionMeta(
        sessionId,
        user,
        config,
        {
          startTime: session.startTime,
          endTime: null,
        },
        "ACCEPTED"
      );
    }

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "ended";
      session.endTime = new Date();

      // Update persistence
      if (this.store) {
        await this.store.persistSummary(sessionId, {
          summary: "Session ended",
          keyPoints: [],
          timestamp: new Date(),
        });
      }
    }
  }
}
```

### Error Handling and Logging

```typescript
// error-handler.ts
import { InjectableConsoleLogger } from "@thrivereflections/realtime-observability";

const logger = new InjectableConsoleLogger("error-handler");

export class ErrorHandler {
  static handle(error: Error, context: string): void {
    logger.error("Error occurred", {
      error: error.message,
      stack: error.stack,
      context,
    });

    // Send to monitoring service
    if (process.env.NODE_ENV === "production") {
      // Send to Sentry, DataDog, etc.
    }
  }

  static async handleAsync<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as Error, context);
      return null;
    }
  }
}

// Usage
const result = await ErrorHandler.handleAsync(() => gateway.execute("echo", { message: "Hello" }), "tool-execution");
```

### Transport Selection

```typescript
// transport-selector.ts
export class TransportSelector {
  static selectTransport(userAgent: string, networkQuality: number): string {
    // WebRTC for modern browsers with good network
    if (this.supportsWebRTC(userAgent) && networkQuality > 0.8) {
      return "webrtc";
    }

    // WebSocket as fallback
    return "websocket";
  }

  private static supportsWebRTC(userAgent: string): boolean {
    return /Chrome|Firefox|Safari|Edge/.test(userAgent) && !/Mobile|Android|iPhone|iPad/.test(userAgent);
  }
}

// Usage
const transportType = TransportSelector.selectTransport(navigator.userAgent, networkQuality);
const transport = createTransport(transportType);
```

### Configuration Management

```typescript
// config-manager.ts
import { loadRuntimeConfig, featureFlagManager } from "@thrivereflections/realtime-config";

export class ConfigManager {
  private config = loadRuntimeConfig();

  getConfig(): RuntimeConfig {
    return this.config;
  }

  isFeatureEnabled(feature: string): boolean {
    return featureFlagManager.isEnabled(feature);
  }

  updateConfig(updates: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getModelConfig(): ModelConfig {
    return this.config.models[this.config.defaultModel];
  }
}

// Usage
const configManager = new ConfigManager();
const isWebRTCEnabled = configManager.isFeatureEnabled("transport.webrtc");
```

### Tool Registration and Execution

```typescript
// tool-registry.ts
import { ToolGateway, Tool } from "@thrivereflections/realtime-tool-gateway";

export class ToolRegistry {
  private gateway: ToolGateway;

  constructor(gateway: ToolGateway) {
    this.gateway = gateway;
  }

  registerCustomTool(tool: Tool): void {
    this.gateway.register(tool.name, tool);
  }

  async executeTool(name: string, args: any): Promise<any> {
    return await this.gateway.execute(name, args);
  }

  getAvailableTools(): string[] {
    return this.gateway.getRegisteredTools();
  }
}

// Custom tool example
const weatherTool: Tool = {
  name: "get_weather",
  description: "Get current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string", description: "City name" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  },
  execute: async (args) => {
    const { location, units = "celsius" } = args;
    // Call weather API
    return { location, temperature: 22, units };
  },
};

// Usage
const registry = new ToolRegistry(gateway);
registry.registerCustomTool(weatherTool);
const result = await registry.executeTool("get_weather", {
  location: "New York",
});
```

## Production Considerations

### Security

```typescript
// security-setup.ts
import { rateLimiter, checkRateLimit, redactPII, isContentSafe } from "@thrivereflections/realtime-security";

// Rate limiting
export async function checkAPIRateLimit(request: Request): Promise<boolean> {
  const clientIP = getClientIP(request);
  return await checkRateLimit(clientIP, "api_calls");
}

// PII redaction
export function redactUserData(data: any): any {
  if (typeof data === "string") {
    return redactPII(data);
  }
  if (typeof data === "object" && data !== null) {
    const redacted = { ...data };
    for (const key in redacted) {
      redacted[key] = redactUserData(redacted[key]);
    }
    return redacted;
  }
  return data;
}

// Content safety
export function validateContent(content: string): boolean {
  return isContentSafe(content);
}
```

### Monitoring

```typescript
// monitoring-setup.ts
import { healthCheckManager, alertManager, circuitBreakerManager } from "@thrivereflections/realtime-sre";

// Health checks
healthCheckManager.addCheck("database", async () => {
  // Check database connectivity
  return { status: "healthy", details: "Database connected" };
});

healthCheckManager.addCheck("openai-api", async () => {
  // Check OpenAI API availability
  const response = await fetch("https://api.openai.com/v1/models");
  return response.ok
    ? { status: "healthy", details: "API accessible" }
    : { status: "unhealthy", details: "API unavailable" };
});

// Circuit breaker for external APIs
const apiBreaker = circuitBreakerManager.create("openai-api", {
  failureThreshold: 5,
  recoveryTimeout: 30000,
});

// Use circuit breaker
const result = await apiBreaker.execute(async () => {
  return await fetch("https://api.openai.com/v1/chat/completions");
});
```

### Cost Tracking

```typescript
// cost-tracking.ts
import { usageTracker, estimateSessionCost, quotaManager } from "@thrivereflections/realtime-usage";

// Track usage
export async function trackSessionUsage(sessionId: string, userId: string, usage: SessionUsage): Promise<void> {
  await usageTracker.trackSessionStart(sessionId, userId);
  await usageTracker.trackTokens(sessionId, usage.tokens);
  await usageTracker.trackAudio(sessionId, usage.audio);

  // Check quota
  const quotaStatus = await quotaManager.checkQuota(userId);
  if (!quotaStatus.allowed) {
    throw new Error("Quota exceeded");
  }
}

// Estimate costs
export function estimateCost(usage: SessionUsage): number {
  const cost = estimateSessionCost(usage);
  return cost.total;
}
```

### Database Setup

```typescript
// database-setup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function setupDatabase(): Promise<void> {
  // Run migrations
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // Create indexes
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
  `;

  // Seed data
  await prisma.appUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      authId: "admin-auth-id",
    },
  });
}
```

## API Routes

### Required Routes

These routes are essential for the voice platform to function:

#### Session Management

```typescript
// app/api/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@thrivereflections/realtime-security";
import { loadRuntimeConfig, getAgentConfigWithUser } from "@thrivereflections/realtime-config";

export async function POST(request: NextRequest) {
  // Rate limiting check
  const rateLimitResult = checkRateLimit(request, RATE_LIMITS.SESSION_CREATION);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.SESSION_CREATION.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  const config = await request.json();

  // Load and validate configuration
  const runtimeConfig = loadRuntimeConfig();
  const agentConfig = getAgentConfigWithUser({ sub: "user-123", tenant: "default" }, {});

  // Create session
  const sessionId = generateId();
  const token = await generateSessionToken(sessionId, agentConfig);

  return NextResponse.json({
    session_id: sessionId,
    client_secret: {
      value: token,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    },
    model: agentConfig.model,
  });
}
```

#### Tool Gateway

```typescript
// app/api/tools/gateway/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@thrivereflections/realtime-security";
import { initializeToolRegistry, executeToolCall } from "@/lib/platform";

export async function POST(request: NextRequest) {
  // Rate limiting check
  const rateLimitResult = checkRateLimit(request, RATE_LIMITS.TOOL_CALLS);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.TOOL_CALLS.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  const toolCall = await request.json();

  // Initialize tool registry
  initializeToolRegistry();

  // Execute tool call using registry pattern
  const result = await executeToolCall(toolCall);

  return NextResponse.json(result);
}
```

#### Persistence APIs

```typescript
// app/api/internal/session-created/route.ts
export async function POST(request: Request) {
  const { sessionId, user, config, timings, consent } = await request.json();

  await store.saveSessionMeta(sessionId, user, config, timings, consent);

  return Response.json({ success: true });
}

// app/api/internal/transcript-append/route.ts
export async function POST(request: Request) {
  const { sessionId, segment } = await request.json();

  await store.appendTranscript(sessionId, segment);

  return Response.json({ success: true });
}
```

### Optional Routes

These routes add additional functionality:

#### Authentication Routes

```typescript
// app/api/auth/session/route.ts
export async function GET() {
  const user = await authProvider.getCurrentUser();
  return Response.json({ user });
}

// app/api/auth/signout/route.ts
export async function POST() {
  await authProvider.signOut();
  return Response.json({ success: true });
}
```

#### Health and Monitoring

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = await healthCheckManager.checkAll();

  return Response.json(health, {
    status: health.overall === "healthy" ? 200 : 503,
  });
}

// app/api/monitoring/synthetic/route.ts
export async function GET() {
  const results = await syntheticMonitoring.runChecks();
  return Response.json(results);
}
```

#### Usage and Analytics

```typescript
// app/api/usage/current/route.ts
export async function GET() {
  const usage = await usageTracker.getCurrentUsage();
  return Response.json(usage);
}

// app/api/usage/history/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("range") || "24h";

  const history = await usageTracker.getUsageHistory(timeRange);
  return Response.json(history);
}
```

### Route Implementation Examples

See the [Demo App](../../apps/demo-voice/README.md) for complete implementations of all these routes.

## Next Steps

1. **Start with the minimal setup** and gradually add features
2. **Use the demo app** as a reference implementation
3. **Follow the common patterns** for consistent architecture
4. **Implement production considerations** for security and monitoring
5. **Customize the API routes** for your specific needs

## Additional Resources

- [API Reference](../api/) - Detailed API documentation
- [Architecture Overview](../architecture/) - System design principles
- [Getting Started](../getting-started/) - Quick start guides
- [Demo App](../../apps/demo-voice/README.md) - Complete reference implementation
