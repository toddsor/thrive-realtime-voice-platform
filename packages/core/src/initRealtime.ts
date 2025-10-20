import { RuntimeConfig, TransportFactory } from "@thrivereflections/realtime-contracts";
import { createTransport } from "./transports/factory";

export interface RealtimeDeps {
  getToken: () => Promise<string>;
  transportFactory?: TransportFactory;
  baseUrl?: string;
  onEvent?: (event: unknown) => void;
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
  };
  identity?: unknown;
}

export function initRealtime(config: RuntimeConfig, deps: RealtimeDeps) {
  const factory = deps.transportFactory ?? createTransport;

  const transport = factory(config.featureFlags.transport, deps.baseUrl);

  async function start() {
    deps.logger?.info("Starting realtime connection", { transport: transport.kind });

    try {
      const token = await deps.getToken();
      await transport.connect({
        token,
        onEvent: deps.onEvent ?? (() => {}),
        // Attach minimal identity context if supported by transport
        identity: deps.identity,
      } as unknown as Parameters<typeof transport.connect>[0]);

      deps.logger?.info("Realtime connection established", { transport: transport.kind });
    } catch (error) {
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
