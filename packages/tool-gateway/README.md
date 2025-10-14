# @thrive/realtime-tool-gateway

Tool gateway with RAG support for the Thrive Realtime Voice Platform.

## Features

- **Tool Gateway**: Configurable tool execution with policy enforcement
- **RAG Support**: Vector search and document retrieval capabilities
- **Embedding Provider**: OpenAI embeddings integration
- **In-Memory Vector Store**: Fast vector similarity search
- **Tool Handlers**: Echo and retrieve tools included

## Usage

```typescript
import { ToolGateway, createVectorStore, echoTool, retrieveTool } from "@thrive/realtime-tool-gateway";

// Create vector store for RAG
const vectorStore = createVectorStore(process.env.OPENAI_API_KEY);

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
const result = await gateway.execute("echo", { message: "Hello" });
```

## API

### ToolGateway

Main gateway class for tool execution with policy enforcement.

### VectorStore

In-memory vector store with OpenAI embeddings for RAG functionality.

### Tools

- `echoTool`: Simple echo tool for testing
- `retrieveTool`: Mock retrieve tool for demonstration

### Handlers

- `executeToolCall`: Execute tool calls with validation and policy checks
- `handleRetrieve`: RAG-enabled retrieve handler
