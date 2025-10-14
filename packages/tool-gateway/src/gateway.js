export class ToolGateway {
    constructor(config) {
        this.config = config;
        this.tools = new Map();
    }
    register(name, tool) {
        this.tools.set(name, tool);
    }
    async execute(name, input, context) {
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
        }
        catch (error) {
            this.config.logger?.error(`Tool execution failed: ${name}`, {
                toolName: name,
                context,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    hasTools() {
        return this.tools.size > 0;
    }
    getToolNames() {
        return Array.from(this.tools.keys());
    }
}
