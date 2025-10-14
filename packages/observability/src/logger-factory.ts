import { InjectableConsoleLogger, LoggerConfig } from "./injectable-logger";
import { LogLevel } from "./logger";

export function createLogger(correlationId?: string, config?: LoggerConfig): InjectableConsoleLogger {
  return new InjectableConsoleLogger(correlationId, config);
}

export function createLoggerFromEnv(
  correlationId?: string,
  config?: { level?: LogLevel; environment?: string; runtime?: string }
): InjectableConsoleLogger {
  const level = config?.level || "info";
  const environment = config?.environment || "development";
  const runtime = config?.runtime || (typeof window !== "undefined" ? "browser" : "node");

  return createLogger(correlationId, {
    level,
    environment,
    runtime,
  });
}
