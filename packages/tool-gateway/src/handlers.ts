import { ToolCall, ToolCallResponse } from "@thrivereflections/realtime-contracts";

export interface ToolHandler {
  (args: Record<string, unknown>, user?: { sub?: string; tenant?: string }): Promise<unknown>;
}

export interface ToolRegistry {
  [toolName: string]: ToolHandler;
}

// Echo tool implementation
export async function echoTool(
  args: Record<string, unknown>,
  user?: { sub?: string; tenant?: string }
): Promise<unknown> {
  // Simply return the input arguments
  return {
    originalArgs: args,
    timestamp: new Date().toISOString(),
    user: user?.sub || "anonymous",
  };
}

// Tool registry mapping tool names to handlers
export const toolRegistry: ToolRegistry = {
  echo: echoTool,
  // Add more tools here as they are implemented
};

// Validate tool call arguments
export function validateToolCall(toolCall: ToolCall): { valid: boolean; error?: string } {
  if (!toolCall.id || typeof toolCall.id !== "string") {
    return { valid: false, error: "Missing or invalid tool call ID" };
  }

  if (!toolCall.name || typeof toolCall.name !== "string") {
    return { valid: false, error: "Missing or invalid tool name" };
  }

  if (!toolCall.args || typeof toolCall.args !== "object") {
    return { valid: false, error: "Missing or invalid tool arguments" };
  }

  return { valid: true };
}

// Check if tool is allowed based on allow-list policy
export function isToolAllowed(
  toolName: string,
  allowedTools: string[],
  toolPolicy: "deny_all" | "allow_list"
): boolean {
  if (toolPolicy === "deny_all") {
    return false;
  }

  if (toolPolicy === "allow_list") {
    return allowedTools.includes(toolName);
  }

  return false;
}

// Execute a tool call
export async function executeToolCall(
  toolCall: ToolCall,
  allowedTools: string[],
  toolPolicy: "deny_all" | "allow_list",
  logger: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
  }
): Promise<ToolCallResponse> {
  const { id, name, args, user } = toolCall;

  try {
    // Validate the tool call
    const validation = validateToolCall(toolCall);
    if (!validation.valid) {
      logger.error("Invalid tool call", { toolCall, error: validation.error });
      return {
        id,
        ok: false,
        error: validation.error,
      };
    }

    // Check if tool is allowed
    if (!isToolAllowed(name, allowedTools, toolPolicy)) {
      logger.warn("Tool not allowed", { toolName: name, allowedTools, toolPolicy });
      return {
        id,
        ok: false,
        error: `Tool '${name}' is not allowed by current policy`,
      };
    }

    // Check if tool handler exists
    const handler = toolRegistry[name];
    if (!handler) {
      logger.error("Tool handler not found", { toolName: name });
      return {
        id,
        ok: false,
        error: `Tool handler for '${name}' not found`,
      };
    }

    // Execute the tool
    logger.info("Executing tool call", { toolName: name, toolId: id });
    const result = await handler(args, user);

    logger.info("Tool call completed successfully", { toolName: name, toolId: id });
    return {
      id,
      ok: true,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Tool execution failed", {
      toolName: name,
      toolId: id,
      error: errorMessage,
    });

    return {
      id,
      ok: false,
      error: `Tool execution failed: ${errorMessage}`,
    };
  }
}
