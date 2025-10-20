# @thrivereflections/realtime-tool-gateway

Tool gateway with RAG support for the Thrive Realtime Voice Platform.

## Features

- **Tool Gateway**: Configurable tool execution with policy enforcement
- **Policy Enforcement**: Identity-aware tool gating with PII handling
- **RAG Support**: Vector search and document retrieval capabilities
- **Embedding Provider**: OpenAI embeddings integration
- **In-Memory Vector Store**: Fast vector similarity search
- **Tool Handlers**: Echo and retrieve tools included
- **Declarative Policies**: Tools declare their own requirements and constraints

## Usage

```typescript
import {
  ToolGateway,
  createVectorStore,
  echoTool,
  retrieveTool,
  enforceToolPolicy,
  canExecuteTool,
  handleToolInput,
} from "@thrivereflections/realtime-tool-gateway";
import { IdentityLevel, ClientIdentity } from "@thrivereflections/realtime-contracts";

// Create vector store for RAG
const vectorStore = createVectorStore(process.env.OPENAI_API_KEY);

// Create tool gateway with identity-aware policies
const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024, // 1MB
    maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  },
  allowList: ["echo", "retrieve", "weather"],
  logger: console,
});

// Register tools with policies
gateway.registerWithDefinition(
  {
    type: "function",
    name: "echo",
    description: "Echo back the input message",
    parameters: {
      /* ... */
    },
    policy: {
      minIdentityLevel: "ephemeral",
      requiresExternalAccess: false,
      piiHandling: "allow",
    },
  },
  echoTool
);

gateway.registerWithDefinition(
  {
    type: "function",
    name: "retrieve",
    description: "Retrieve relevant documentation",
    parameters: {
      /* ... */
    },
    policy: {
      minIdentityLevel: "anonymous",
      requiresExternalAccess: true,
      piiHandling: "redact",
      maxCallsPerSession: 10,
    },
  },
  retrieveTool
);

// Execute tool with identity context
const identity: ClientIdentity = {
  level: "anonymous",
  anonymousId: "anon_123456789",
  consent: "ACCEPTED",
};

const result = await gateway.execute(
  "echo",
  { message: "Hello" },
  {
    identity,
    sessionId: "session_123",
    callCount: 1,
  }
);
```

## API

### ToolGateway

Main gateway class for tool execution with policy enforcement.

**New Methods:**

- `registerWithDefinition(definition, tool)` - Register tool with policy definition
- `getToolDefinition(name)` - Get tool definition including policy
- `getAllToolDefinitions()` - Get all registered tool definitions
- `getCallCount(sessionId, toolName)` - Get call count for rate limiting

### Policy Enforcement

- `enforceToolPolicy(tool, input, identity, callCount)` - Complete policy enforcement
- `canExecuteTool(tool, identity, callCount)` - Check if tool can be executed
- `handleToolInput(input, policy, identity)` - Handle PII redaction based on policy

### VectorStore

In-memory vector store with OpenAI embeddings for RAG functionality.

### Tools

- `echoTool`: Simple echo tool for testing
- `retrieveTool`: Mock retrieve tool for demonstration

### Handlers

- `executeToolCall`: Execute tool calls with validation and policy checks
- `handleRetrieve`: RAG-enabled retrieve handler

## Policy Enforcement Examples

### Identity-Based Tool Gating

```typescript
// Tool requires anonymous level or higher
const weatherTool = {
  name: "weather",
  policy: {
    minIdentityLevel: "anonymous",
    requiresExternalAccess: true,
    piiHandling: "redact",
    maxCallsPerSession: 5,
  },
};

// Check if user can execute tool
const canExecute = canExecuteTool(weatherTool, identity, callCount);
if (!canExecute.allowed) {
  console.log("Tool blocked:", canExecute.reason);
}
```

### PII Handling

```typescript
// Tool that redacts PII for anonymous users
const result = handleToolInput(
  { message: "My email is user@example.com" },
  { piiHandling: "redact" },
  { level: "anonymous" }
);

// Result: { message: "My email is [EMAIL_REDACTED]" }
```

### Rate Limiting

```typescript
// Tool with session-based rate limiting
const tool = {
  policy: {
    maxCallsPerSession: 10,
  },
};

// Check rate limit
const callCount = gateway.getCallCount("session_123", "weather");
if (callCount >= 10) {
  throw new Error("Rate limit exceeded");
}
```
