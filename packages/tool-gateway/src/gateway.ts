import { PolicyConfig, ClientIdentity, ToolDefinition } from "@thrivereflections/realtime-contracts";
import { enforceToolPolicy } from "./policyEnforcer";

export type Tool = (input: unknown, context?: ToolContext) => Promise<unknown>;

export interface ToolContext {
  userId?: string;
  sessionId?: string;
  identity?: ClientIdentity;
  callCount?: number;
}

export interface ToolGatewayConfig {
  policies: PolicyConfig;
  allowList: string[];
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export class ToolGateway {
  private tools = new Map<string, Tool>();
  private toolDefinitions = new Map<string, ToolDefinition>();
  private callCounts = new Map<string, number>();

  constructor(private config: ToolGatewayConfig) {}

  register(name: string, tool: Tool, definition?: ToolDefinition): void {
    this.tools.set(name, tool);
    if (definition) {
      this.toolDefinitions.set(name, definition);
    }
  }

  registerWithDefinition(definition: ToolDefinition, tool: Tool): void {
    this.tools.set(definition.name, tool);
    this.toolDefinitions.set(definition.name, definition);
  }

  async execute(name: string, input: unknown, context?: ToolContext): Promise<unknown> {
    if (!this.config.allowList.includes(name)) {
      const error = `Tool '${name}' not in allowlist`;
      this.config.logger?.warn(error, { toolName: name, context });
      throw new Error(error);
    }

    const tool = this.tools.get(name);
    if (!tool) {
      const error = `Tool '${name}' not registered`;
      this.config.logger?.warn(error, { toolName: name, context });
      throw new Error(error);
    }

    // Get tool definition for policy enforcement
    const definition = this.toolDefinitions.get(name);
    if (definition && context?.identity) {
      // Increment call count for this session
      const sessionKey = `${context.sessionId || "default"}-${name}`;
      const currentCount = this.callCounts.get(sessionKey) || 0;
      this.callCounts.set(sessionKey, currentCount + 1);

      // Enforce tool policy
      const policyResult = enforceToolPolicy(definition, input, context.identity, currentCount);
      if (!policyResult.allowed) {
        const error = `Tool execution blocked: ${policyResult.reason}`;
        this.config.logger?.warn(error, {
          toolName: name,
          context,
          reason: policyResult.reason,
          identityLevel: context.identity.level,
        });
        throw new Error(error);
      }

      // Use processed input if PII was redacted
      if (policyResult.input !== undefined) {
        input = policyResult.input;
      }
    }

    // Legacy policy enforcement (payload size)
    const inputSize = JSON.stringify(input).length;
    if (inputSize > this.config.policies.maxPayloadBytes) {
      const error = `Payload exceeds limit: ${inputSize} > ${this.config.policies.maxPayloadBytes}`;
      this.config.logger?.warn(error, { inputSize, maxSize: this.config.policies.maxPayloadBytes, context });
      throw new Error(error);
    }

    this.config.logger?.info(`Executing tool: ${name}`, { toolName: name, context });

    try {
      const result = await tool(input, context);
      this.config.logger?.info(`Tool executed successfully: ${name}`, { toolName: name, context });
      return result;
    } catch (error) {
      this.config.logger?.error(`Tool execution failed: ${name}`, {
        toolName: name,
        context,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  hasTools(): boolean {
    return this.tools.size > 0;
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolDefinition(name: string): ToolDefinition | undefined {
    return this.toolDefinitions.get(name);
  }

  getAllToolDefinitions(): ToolDefinition[] {
    return Array.from(this.toolDefinitions.values());
  }

  resetCallCounts(): void {
    this.callCounts.clear();
  }

  getCallCount(sessionId: string, toolName: string): number {
    const sessionKey = `${sessionId}-${toolName}`;
    return this.callCounts.get(sessionKey) || 0;
  }
}
