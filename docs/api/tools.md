# @thrivereflections/realtime-tool-gateway

Tool gateway with RAG support for the Thrive Realtime Voice Platform.

## Overview

This package provides a comprehensive tool execution system with policy enforcement, RAG (Retrieval Augmented Generation) support, and vector search capabilities for document retrieval.

## Installation

```bash
npm install @thrivereflections/realtime-tool-gateway
```

## Main Exports

### Tool Gateway

- **`ToolGateway`** - Main tool gateway class
- **`Tool`** - Tool interface definition
- **`ToolContext`** - Tool execution context
- **`ToolGatewayConfig`** - Gateway configuration

### Built-in Tools

- **`echoTool`** - Simple echo tool for testing
- **`retrieveTool`** - Document retrieval tool with RAG

### Tool Handlers

- **`toolRegistry`** - Tool registry for managing tools
- **`validateToolCall`** - Validate tool call format
- **`isToolAllowed`** - Check if tool is allowed
- **`executeToolCall`** - Execute tool call with validation
- **`handleRetrieve`** - RAG-enabled retrieve handler

### Vector Stores

- **`InMemoryVectorStore`** - In-memory vector store implementation
- **`OpenAIEmbeddingProvider`** - OpenAI embeddings provider
- **`createVectorStore`** - Create vector store instance

### Document Management

- **`Document`** - Document interface
- **`DocumentChunk`** - Document chunk interface
- **`SearchResult`** - Search result interface
- **`DocumentStore`** - Document store interface
- **`EmbeddingProvider`** - Embedding provider interface
- **`VectorStore`** - Vector store interface

## Usage Example

### Basic Tool Gateway

```typescript
import { ToolGateway, echoTool, retrieveTool } from "@thrivereflections/realtime-tool-gateway";

// Create tool gateway
const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024, // 1MB
    maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  },
  allowList: ["echo", "retrieve"],
  logger: console,
});

// Register tools
gateway.register("echo", echoTool);
gateway.register("retrieve", retrieveTool);

// Execute tool
const result = await gateway.execute("echo", { message: "Hello, world!" });
console.log(result); // { success: true, result: "Hello, world!" }
```

### RAG with Vector Store

```typescript
import { ToolGateway, retrieveTool, createVectorStore } from "@thrivereflections/realtime-tool-gateway";

// Create vector store for RAG
const vectorStore = createVectorStore(process.env.OPENAI_API_KEY);

// Add documents to vector store
await vectorStore.addDocument({
  id: "doc-1",
  content: "The Thrive Realtime Voice Platform is a TypeScript monorepo for building voice applications.",
  metadata: { title: "Platform Overview", category: "documentation" },
});

await vectorStore.addDocument({
  id: "doc-2",
  content: "The platform provides WebRTC and WebSocket transports for real-time communication.",
  metadata: { title: "Transports", category: "architecture" },
});

// Create tool gateway with RAG support
const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024,
    maxSessionDuration: 30 * 60 * 1000,
  },
  allowList: ["retrieve"],
  logger: console,
});

// Register retrieve tool with vector store
gateway.register("retrieve", retrieveTool, { vectorStore });

// Execute retrieve tool
const result = await gateway.execute("retrieve", {
  query: "What transports are available?",
  limit: 5,
});
console.log(result);
// {
//   success: true,
//   result: [
//     {
//       id: "doc-2",
//       content: "The platform provides WebRTC and WebSocket transports...",
//       score: 0.95,
//       metadata: { title: "Transports", category: "architecture" }
//     }
//   ]
// }
```

### Custom Tool Implementation

```typescript
import { ToolGateway, Tool } from "@thrivereflections/realtime-tool-gateway";

// Define custom tool
const weatherTool: Tool = {
  name: "get_weather",
  description: "Get current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name or coordinates",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
      },
    },
    required: ["location"],
  },
  execute: async (args, context) => {
    const { location, units = "celsius" } = args;

    // Call weather API
    const response = await fetch(`https://api.weather.com/v1/current?location=${location}&units=${units}`);
    const data = await response.json();

    return {
      location: data.location,
      temperature: data.temperature,
      description: data.description,
      units,
    };
  },
};

// Register custom tool
const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024,
    maxSessionDuration: 30 * 60 * 1000,
  },
  allowList: ["get_weather"],
  logger: console,
});

gateway.register("get_weather", weatherTool);

// Execute custom tool
const result = await gateway.execute("get_weather", {
  location: "New York",
  units: "fahrenheit",
});
console.log(result);
// {
//   success: true,
//   result: {
//     location: "New York",
//     temperature: 72,
//     description: "Partly cloudy",
//     units: "fahrenheit"
//   }
// }
```

## Configuration

### Tool Gateway Configuration

```typescript
interface ToolGatewayConfig {
  policies: {
    maxPayloadBytes: number; // Maximum payload size
    maxSessionDuration: number; // Maximum session duration
    maxToolCalls?: number; // Maximum tool calls per session
  };
  allowList: string[]; // Allowed tool names
  logger: Logger; // Logger instance
}
```

### Vector Store Configuration

```typescript
interface VectorStoreConfig {
  embeddingProvider: EmbeddingProvider; // Embedding provider
  chunkSize?: number; // Document chunk size
  chunkOverlap?: number; // Chunk overlap
  similarityThreshold?: number; // Similarity threshold for search
}
```

### Tool Interface

```typescript
interface Tool {
  name: string; // Tool name
  description: string; // Tool description
  parameters: JSONSchema; // Tool parameters schema
  execute: (args: any, context: ToolContext) => Promise<any>; // Tool execution function
}
```

## Key Features

### Tool Execution

- **Policy Enforcement** - Configurable policies for tool execution
- **Allow List** - Restrict which tools can be executed
- **Validation** - Validate tool calls before execution
- **Error Handling** - Comprehensive error handling and logging

### RAG Support

- **Vector Search** - Semantic search using embeddings
- **Document Chunking** - Automatic document chunking for better search
- **Similarity Scoring** - Rank search results by similarity
- **Metadata Support** - Store and search document metadata

### Vector Stores

- **In-Memory Store** - Fast in-memory vector storage
- **OpenAI Embeddings** - Integration with OpenAI embedding models
- **Document Management** - Add, update, and delete documents
- **Search Optimization** - Optimized search performance

### Built-in Tools

- **Echo Tool** - Simple echo tool for testing
- **Retrieve Tool** - Document retrieval with RAG support
- **Extensible** - Easy to add custom tools

## Integration

### With Core Runtime

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { ToolGateway } from "@thrivereflections/realtime-tool-gateway";

const gateway = new ToolGateway({
  policies: {
    maxPayloadBytes: 1024 * 1024,
    maxSessionDuration: 30 * 60 * 1000,
  },
  allowList: ["echo", "retrieve"],
  logger: console,
});

const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: createTransport,
  onEvent: (event) => {
    if (event.type === "response.function_call") {
      // Execute tool call
      gateway.execute(event.name, event.arguments);
    }
  },
});
```

### With API Routes

```typescript
import { ToolGateway } from "@thrivereflections/realtime-tool-gateway";

export async function POST(request: Request) {
  const { toolName, arguments: args } = await request.json();

  const gateway = new ToolGateway({
    policies: {
      maxPayloadBytes: 1024 * 1024,
      maxSessionDuration: 30 * 60 * 1000,
    },
    allowList: ["echo", "retrieve"],
    logger: console,
  });

  const result = await gateway.execute(toolName, args);
  return new Response(JSON.stringify(result));
}
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface
- `@thrivereflections/realtime-usage` - Usage tracking

## Related Documentation

- [Core Runtime](./core.md) - Uses tool gateway
- [Usage](./usage.md) - Tracks tool usage
- [Package README](../../packages/tool-gateway/README.md) - Detailed package documentation
