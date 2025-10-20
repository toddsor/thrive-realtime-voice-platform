import { Logger, LogLevel, LogLevelEnum } from "./logger";

export interface LoggerConfig {
  level: LogLevel;
  environment?: string;
  runtime?: string;
}

export interface InjectableLogger extends Logger {
  setConfig(config: LoggerConfig): void;
}

export class InjectableConsoleLogger implements InjectableLogger {
  private correlationId?: string;
  private clientSessionId?: string;
  private openaiSessionId?: string;
  private toolCallId?: string;
  private logLevel: LogLevelEnum;
  private config: LoggerConfig;
  private identityLevel?: "ephemeral" | "local" | "anonymous" | "pseudonymous" | "authenticated";
  private identityId?: string;

  constructor(correlationId?: string, config?: LoggerConfig) {
    this.correlationId = correlationId;
    this.config = config || { level: "info" };
    this.logLevel = LogLevelEnum[this.config.level.toUpperCase() as keyof typeof LogLevelEnum];
  }

  setConfig(config: LoggerConfig): void {
    this.config = config;
    this.logLevel = LogLevelEnum[config.level.toUpperCase() as keyof typeof LogLevelEnum];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = LogLevelEnum[level.toUpperCase() as keyof typeof LogLevelEnum];
  }

  isLevelEnabled(level: LogLevel): boolean {
    return LogLevelEnum[level.toUpperCase() as keyof typeof LogLevelEnum] >= this.logLevel;
  }

  setSessionIds(clientSessionId?: string, openaiSessionId?: string): void {
    this.clientSessionId = clientSessionId;
    this.openaiSessionId = openaiSessionId;
  }

  setToolCallId(toolCallId?: string): void {
    this.toolCallId = toolCallId;
  }

  setIdentity(level?: "ephemeral" | "local" | "anonymous" | "pseudonymous" | "authenticated", id?: string): void {
    this.identityLevel = level;
    this.identityId = id;
  }

  logLatencyMark(mark: string, timestamp: number): void {
    this.debug(`Latency mark: ${mark}`, { mark, timestamp });
  }

  private createLogEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      clientSessionId: this.clientSessionId,
      openaiSessionId: this.openaiSessionId,
      toolCallId: this.toolCallId,
      identityLevel: this.identityLevel,
      identityId: this.identityId,
      metadata: {
        ...meta,
        environment: this.config.environment || "development",
        runtime: this.config.runtime || "node",
      },
    };
  }

  private writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, meta);

    switch (level) {
      case "debug":
        console.debug(`[DEBUG] ${message}`, entry);
        break;
      case "info":
        console.info(`[INFO] ${message}`, entry);
        break;
      case "warn":
        console.warn(`[WARN] ${message}`, entry);
        break;
      case "error":
        console.error(`[ERROR] ${message}`, entry);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.writeLog("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.writeLog("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.writeLog("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.writeLog("error", message, meta);
  }

  logError(error: Error, context?: Record<string, unknown>, category?: string): void {
    this.error("Error occurred", {
      ...context,
      error: {
        message: error.message,
        stack: error.stack,
        category: category || "unknown",
      },
    });
  }

  logSecurityEvent(eventType: string, severity: string, message: string, details?: Record<string, unknown>): void {
    this.warn(`Security event: ${message}`, {
      security: {
        eventType,
        severity,
        details,
      },
    });
  }
}
