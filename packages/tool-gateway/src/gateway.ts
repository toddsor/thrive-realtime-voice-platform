import { PolicyConfig } from "@thrivereflections/realtime-contracts";

export type Tool = (input: unknown, context?: ToolContext) => Promise<unknown>;

export interface ToolContext {
  userId?: string;
  sessionId?: string;
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

  constructor(private config: ToolGatewayConfig) {}

  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
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

    // Policy enforcement
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
}
