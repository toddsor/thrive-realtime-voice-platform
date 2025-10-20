// Main gateway
export { ToolGateway } from "./gateway";
export type { Tool, ToolContext, ToolGatewayConfig } from "./gateway";

// Policy enforcement
export { enforceToolPolicy, canExecuteTool, handleToolInput } from "./policyEnforcer";
export type { PolicyEnforcementResult } from "./policyEnforcer";

// Tools
export { echoTool } from "./tools/echo";
export { retrieveTool } from "./tools/retrieve";

// Handlers
export { toolRegistry, validateToolCall, isToolAllowed, executeToolCall } from "./handlers";
export type { ToolHandler, ToolRegistry } from "./handlers";

// Retrieve handler
export { handleRetrieve, formatSearchResults } from "./handlers/retrieve";
export type { RetrieveToolArgs, RetrieveToolResult } from "./handlers/retrieve";

// Document stores
export { InMemoryVectorStore, OpenAIEmbeddingProvider, createVectorStore } from "./stores/inMemoryVectorStore";
export type {
  Document,
  DocumentChunk,
  SearchResult,
  DocumentStore,
  EmbeddingProvider,
  VectorStore,
} from "./stores/documentStore";
