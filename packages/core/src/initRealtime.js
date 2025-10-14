import { createTransport } from "./transports/factory";
export function initRealtime(config, deps) {
    const factory = deps.transportFactory ?? createTransport;
    const transport = factory(config.featureFlags.transport);
    async function start() {
        deps.logger?.info("Starting realtime connection", { transport: transport.kind });
        try {
            const token = await deps.getToken();
            await transport.connect({
                token,
                onEvent: deps.onEvent ?? (() => { }),
            });
            deps.logger?.info("Realtime connection established", { transport: transport.kind });
        }
        catch (error) {
            deps.logger?.error("Failed to start realtime connection", {
                transport: transport.kind,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    function stop() {
        deps.logger?.info("Stopping realtime connection", { transport: transport.kind });
        return transport.close();
    }
    return { start, stop, transport, config };
}
