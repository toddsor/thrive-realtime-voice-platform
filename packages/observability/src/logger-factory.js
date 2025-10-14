import { InjectableConsoleLogger } from "./injectable-logger";
export function createLogger(correlationId, config) {
    return new InjectableConsoleLogger(correlationId, config);
}
export function createLoggerFromEnv(correlationId, config) {
    const level = config?.level || "info";
    const environment = config?.environment || "development";
    const runtime = config?.runtime || (typeof window !== "undefined" ? "browser" : "node");
    return createLogger(correlationId, {
        level,
        environment,
        runtime,
    });
}
