import { ToolCall, ToolCallResponse, ToolDefinition, ToolPolicy } from "@thrivereflections/realtime-contracts";
import { echoTool, retrieveTool, type Tool } from "@thrivereflections/realtime-tool-gateway";
import { handleWeatherToolCall, weatherToolDefinition } from "./weatherTool";
import { handleCalendarToolCall, calendarToolDefinition } from "./weatherTool";

/**
 * Example: Tool Registry Pattern
 *
 * This demonstrates how to register and manage custom tools in a scalable way.
 * The registry pattern allows for easy addition of new tools and centralized management.
 */

export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  policy: ToolPolicy;
  handler: (toolCall: ToolCall) => Promise<ToolCallResponse>;
}

/**
 * Registry of all available tools
 */
export const toolRegistry = new Map<string, ToolHandler>();

/**
 * Register a tool with the registry
 */
export function registerTool(tool: ToolHandler): void {
  toolRegistry.set(tool.name, tool);
}

/**
 * Get a tool handler by name
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  return toolRegistry.get(name);
}

/**
 * Get all registered tool definitions for OpenAI
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return Array.from(toolRegistry.values()).map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    policy: tool.policy,
  }));
}

/**
 * Execute a tool call using the registry
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolCallResponse> {
  const handler = getToolHandler(toolCall.name);

  if (!handler) {
    return {
      id: toolCall.id,
      ok: false,
      error: `Tool '${toolCall.name}' not found. Available tools: ${Array.from(toolRegistry.keys()).join(", ")}`,
    };
  }

  try {
    return await handler.handler(toolCall);
  } catch (error) {
    return {
      id: toolCall.id,
      ok: false,
      error: `Error executing tool '${toolCall.name}': ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Initialize the tool registry with all available tools
 */
export function initializeToolRegistry(): void {
  // Register platform tools
  registerTool({
    name: "echo",
    description: "Echo back the input message",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to echo back",
        },
      },
      required: ["message"],
    },
    policy: {
      minIdentityLevel: "ephemeral",
      requiresExternalAccess: false,
      piiHandling: "allow",
    },
    handler: async (toolCall: ToolCall) => {
      const result = await echoTool(toolCall.args as unknown as { message: string });
      return {
        id: toolCall.id,
        ok: true,
        result,
      };
    },
  });

  registerTool({
    name: "retrieve_docs",
    description: "Retrieve relevant documentation",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
    policy: {
      minIdentityLevel: "anonymous",
      requiresExternalAccess: true,
      piiHandling: "redact",
      maxCallsPerSession: 10,
    },
    handler: async (toolCall: ToolCall) => {
      const result = await retrieveTool(toolCall.args as unknown as { query: string });
      return {
        id: toolCall.id,
        ok: true,
        result,
      };
    },
  });

  // Register custom tools
  registerTool({
    name: "get_weather",
    description: weatherToolDefinition.description,
    parameters: weatherToolDefinition.parameters,
    policy: {
      minIdentityLevel: "anonymous",
      requiresExternalAccess: true,
      piiHandling: "redact",
      maxCallsPerSession: 5,
    },
    handler: handleWeatherToolCall,
  });

  registerTool({
    name: "create_calendar_event",
    description: calendarToolDefinition.description,
    parameters: calendarToolDefinition.parameters,
    policy: {
      minIdentityLevel: "authenticated",
      requiresExternalAccess: true,
      piiHandling: "block",
      requiresConsent: true,
    },
    handler: handleCalendarToolCall,
  });
}

/**
 * Example: How to add a new tool dynamically
 */
export function addCustomTool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  policy: ToolPolicy,
  handler: (toolCall: ToolCall) => Promise<ToolCallResponse>
): void {
  registerTool({
    name,
    description,
    parameters,
    policy,
    handler,
  });
}

/**
 * Example: How to remove a tool
 */
export function removeTool(name: string): boolean {
  return toolRegistry.delete(name);
}

/**
 * Example: How to list all available tools
 */
export function listAvailableTools(): string[] {
  return Array.from(toolRegistry.keys());
}

/**
 * Example: How to get tool statistics
 */
export function getToolStats(): { totalTools: number; toolNames: string[] } {
  return {
    totalTools: toolRegistry.size,
    toolNames: Array.from(toolRegistry.keys()),
  };
}
