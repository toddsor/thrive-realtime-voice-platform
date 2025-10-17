# @thrivereflections/realtime-config

Configuration management and validation for the Thrive Realtime Voice Platform.

## Overview

This package provides comprehensive configuration loading, validation, and management for all platform components including runtime configuration, database settings, authentication, feature flags, and system prompts.

## Installation

```bash
npm install @thrivereflections/realtime-config
```

## Main Exports

### Configuration Loaders

- **`loadRuntimeConfig()`** - Load and validate runtime configuration
- **`loadDatabaseConfig()`** - Load database configuration
- **`loadAuthConfig()`** - Load authentication configuration
- **`loadAllConfigs()`** - Load all configurations at once

### Agent Configuration

- **`defaultAgentConfig`** - Default agent configuration
- **`getAgentConfigWithUser(user)`** - Get agent config with user-specific settings

### Feature Flags

- **`featureFlagManager`** - Feature flag management system
- **`FeatureFlagManager`** - Feature flag manager class

### Model Configuration

- **`AVAILABLE_MODELS`** - List of available models
- **`getValidatedModel(model)`** - Validate and get model configuration
- **`validateModel(model)`** - Validate model configuration

### Session Limits

- **`DEFAULT_SESSION_LIMITS`** - Default session limits
- **`sessionLimitManager`** - Session limit management
- **`getSessionLimitForTier(tier)`** - Get limits for user tier
- **`isSessionLimitExceeded(usage, limits)`** - Check if limits exceeded
- **`getSessionTimeRemaining(session, limits)`** - Get remaining session time
- **`formatSessionDuration(ms)`** - Format duration for display

### System Prompts

- **`SYSTEM_PROMPTS`** - Predefined system prompts
- **`getSystemPrompt(type)`** - Get system prompt by type
- **`getPersonaOnly()`** - Get persona-only prompt
- **`getSafetyGuidelines()`** - Get safety guidelines
- **`getToolUseGuidance()`** - Get tool use guidance
- **`getContentPolicy()`** - Get content policy
- **`getDisclaimers()`** - Get disclaimers
- **`getPromptVersion()`** - Get prompt version
- **`isPromptVersionCurrent(version)`** - Check if prompt version is current

## Usage Example

### Basic Configuration Loading

```typescript
import {
  loadRuntimeConfig,
  loadDatabaseConfig,
  loadAuthConfig,
  loadAllConfigs,
} from "@thrivereflections/realtime-config";

// Load individual configurations
const runtimeConfig = loadRuntimeConfig();
const databaseConfig = loadDatabaseConfig();
const authConfig = loadAuthConfig();

// Load all configurations at once
const allConfigs = loadAllConfigs();
console.log(allConfigs);
// {
//   runtime: { ... },
//   database: { ... },
//   auth: { ... }
// }
```

### Agent Configuration

```typescript
import { defaultAgentConfig, getAgentConfigWithUser } from "@thrivereflections/realtime-config";

// Get default agent configuration
const config = defaultAgentConfig;
console.log(config);
// {
//   voice: "alloy",
//   persona: "You are a helpful AI assistant.",
//   instructions: "Be concise and helpful.",
//   capabilities: ["text", "audio", "tools"],
//   tools: [...]
// }

// Get user-specific configuration
const userConfig = getAgentConfigWithUser({
  id: "user-123",
  tier: "premium",
  preferences: {
    voice: "nova",
    persona: "You are a professional assistant.",
  },
});
console.log(userConfig);
// {
//   voice: "nova",
//   persona: "You are a professional assistant.",
//   instructions: "Be concise and helpful.",
//   capabilities: ["text", "audio", "tools"],
//   tools: [...]
// }
```

### Custom Agent Configurations

Create custom agent configurations for different use cases:

```typescript
import {
  createCustomAgentConfig,
  agentConfigs,
  getAgentConfigForContext,
  validateAgentConfig,
} from "@thrivereflections/realtime-config";

// Simple override
const customAgent = createCustomAgentConfig({
  voice: "nova",
  persona: "You are a helpful technical assistant.",
  featureFlags: {
    memory: "short",
  },
});

// Use pre-built configurations
const supportAgent = agentConfigs.support; // Empathetic support agent
const salesAgent = agentConfigs.sales; // Persuasive sales agent
const techAgent = agentConfigs.technical; // Precise technical agent

// Context-based selection
const agent = getAgentConfigForContext("support", {
  user: { sub: "user-123", tenant: "default" },
});

// Validate configuration
const validation = validateAgentConfig(agent);
if (!validation.valid) {
  console.error("Config errors:", validation.errors);
}
```

### Feature Flags

```typescript
import { featureFlagManager, FeatureFlagManager } from "@thrivereflections/realtime-config";

// Check feature flags
const isWebRTCEnabled = featureFlagManager.isEnabled("transport.webrtc");
const isMemoryEnabled = featureFlagManager.isEnabled("memory.enabled");

console.log(isWebRTCEnabled); // true
console.log(isMemoryEnabled); // false

// Get feature flag value
const transportType = featureFlagManager.getValue("transport.type");
console.log(transportType); // "webrtc"

// Set feature flag
featureFlagManager.setFlag("memory.enabled", true);

// Create custom feature flag manager
const customManager = new FeatureFlagManager({
  flags: {
    "custom.feature": true,
    "beta.feature": false,
  },
});
```

### Model Configuration

```typescript
import { AVAILABLE_MODELS, getValidatedModel, validateModel } from "@thrivereflections/realtime-config";

// Get available models
console.log(AVAILABLE_MODELS);
// ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]

// Validate model
const validation = validateModel("gpt-4");
console.log(validation);
// { valid: true, model: "gpt-4", config: {...} }

// Get validated model configuration
const modelConfig = getValidatedModel("gpt-4");
console.log(modelConfig);
// {
//   name: "gpt-4",
//   maxTokens: 8192,
//   costPerToken: 0.03,
//   capabilities: ["text", "audio", "tools"]
// }
```

### Session Limits

```typescript
import {
  sessionLimitManager,
  getSessionLimitForTier,
  isSessionLimitExceeded,
  getSessionTimeRemaining,
  formatSessionDuration,
} from "@thrivereflections/realtime-config";

// Get limits for user tier
const limits = getSessionLimitForTier("premium");
console.log(limits);
// {
//   maxDuration: 3600000, // 1 hour
//   maxToolCalls: 1000,
//   maxTokens: 100000
// }

// Check if limits exceeded
const usage = {
  duration: 1800000, // 30 minutes
  toolCalls: 50,
  tokens: 50000,
};

const exceeded = isSessionLimitExceeded(usage, limits);
console.log(exceeded); // false

// Get remaining session time
const remaining = getSessionTimeRemaining(session, limits);
console.log(remaining); // 1800000 (30 minutes)

// Format duration
const formatted = formatSessionDuration(1800000);
console.log(formatted); // "30 minutes"
```

### System Prompts

```typescript
import {
  SYSTEM_PROMPTS,
  getSystemPrompt,
  getPersonaOnly,
  getSafetyGuidelines,
} from "@thrivereflections/realtime-config";

// Get system prompt
const prompt = getSystemPrompt("assistant");
console.log(prompt);
// "You are a helpful AI assistant. Be concise and helpful..."

// Get persona only
const persona = getPersonaOnly();
console.log(persona);
// "You are a helpful AI assistant."

// Get safety guidelines
const safety = getSafetyGuidelines();
console.log(safety);
// "Always prioritize user safety and well-being..."

// Get all system prompts
console.log(SYSTEM_PROMPTS);
// {
//   assistant: "...",
//   professional: "...",
//   creative: "..."
// }
```

## Configuration

### Environment Variables

The package reads configuration from environment variables:

```env
# Runtime Configuration
NODE_ENV=production
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/voice_app
DIRECT_URL=postgresql://user:password@localhost:5432/voice_app

# Authentication Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
FEATURE_TRANSPORT_WEBRTC=true
FEATURE_MEMORY_ENABLED=false
FEATURE_TOOLS_ENABLED=true

# Model Configuration
DEFAULT_MODEL=gpt-4
MAX_TOKENS=8192

# Session Limits
DEFAULT_SESSION_DURATION=1800000
DEFAULT_MAX_TOOL_CALLS=100
```

### Configuration Types

```typescript
interface RuntimeConfig {
  nodeEnv: string;
  logLevel: "debug" | "info" | "warn" | "error";
  featureFlags: {
    transport: "webrtc" | "websocket";
    memory: "on" | "off";
    tools: "on" | "off";
  };
}

interface DatabaseConfig {
  databaseUrl: string;
  directUrl: string;
  logLevel: "error" | "warn" | "info" | "query";
}

interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  providers: string[];
}
```

## Key Features

### Configuration Validation

- **Type Safety** - Full TypeScript support with validation
- **Environment Variables** - Automatic environment variable loading
- **Default Values** - Sensible defaults for all configurations
- **Validation** - Comprehensive configuration validation

### Feature Flags

- **Runtime Control** - Change behavior without code changes
- **User-specific** - Different flags for different users
- **Tier-based** - Feature flags based on user tiers
- **Persistence** - Feature flag state persistence

### Model Management

- **Model Validation** - Validate model configurations
- **Cost Tracking** - Model cost information
- **Capability Support** - Model capability checking
- **Version Management** - Model version tracking

### Session Limits

- **Tier-based Limits** - Different limits for different user tiers
- **Real-time Checking** - Check limits during session
- **Usage Tracking** - Track usage against limits
- **Graceful Degradation** - Handle limit exceeded scenarios

## Integration

### With Core Runtime

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";

const config = loadRuntimeConfig();
const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: createTransport,
  onEvent: (event) => console.log("Event:", event),
});
```

### With Other Packages

```typescript
import { loadDatabaseConfig } from "@thrivereflections/realtime-config";
import { createPrismaStore } from "@thrivereflections/realtime-store-prisma";

const dbConfig = loadDatabaseConfig();
const store = createPrismaStore(dbConfig, { redact });
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions

## Related Documentation

- [Core Runtime](./core.md) - Uses configuration
- [Store](./store.md) - Uses database configuration
- [Auth](./auth.md) - Uses authentication configuration
- [Package README](../../packages/config/README.md) - Detailed package documentation
