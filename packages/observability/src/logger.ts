// Logger utility - to be implemented
export type LogLevel = "debug" | "info" | "warn" | "error";

export enum LogLevelEnum {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string; // ISO 8601
  level: LogLevel;
  message: string;
  correlationId?: string;
  clientSessionId?: string;
  openaiSessionId?: string;
  toolCallId?: string;
  identityLevel?: "ephemeral" | "local" | "anonymous" | "pseudonymous" | "authenticated";
  identityId?: string; // anonymousId | pseudonymousId | userId (opaque)
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    category?: string;
  };
  security?: {
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    details?: Record<string, unknown>;
  };
}

export type SecurityEventType =
  | "rate_limit_exceeded"
  | "tool_policy_violation"
  | "payload_too_large"
  | "content_safety_violation"
  | "pii_detected"
  | "pii_redacted"
  | "invalid_tool_call"
  | "suspicious_activity"
  | "authentication_failure"
  | "authorization_failure";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  logError(error: Error, context?: Record<string, unknown>, category?: string): void;
  logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details?: Record<string, unknown>
  ): void;
  setLogLevel(level: LogLevel): void;
  isLevelEnabled(level: LogLevel): boolean;
}

export class ConsoleLogger implements Logger {
  private correlationId?: string;
  private clientSessionId?: string;
  private openaiSessionId?: string;
  private toolCallId?: string;
  private logLevel: LogLevelEnum;
  private identityLevel?: "ephemeral" | "local" | "anonymous" | "pseudonymous" | "authenticated";
  private identityId?: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId;
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevelEnum {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    switch (envLevel) {
      case "debug":
        return LogLevelEnum.DEBUG;
      case "info":
        return LogLevelEnum.INFO;
      case "warn":
        return LogLevelEnum.WARN;
      case "error":
        return LogLevelEnum.ERROR;
      default:
        return LogLevelEnum.INFO;
    }
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

  private createLogEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
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
        environment: process.env.NODE_ENV || "development",
        runtime: typeof window !== "undefined" ? "browser" : "node",
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
    if (!this.isLevelEnabled("error")) {
      return;
    }

    const entry = this.createLogEntry("error", error.message, context);
    entry.error = {
      message: error.message,
      stack: error.stack,
      category: category || "unknown",
    };

    console.error(`[ERROR] ${error.message}`, entry);
  }

  logLatencyMark(mark: string, timestamp: number, duration?: number): void {
    const meta: Record<string, unknown> = {
      mark,
      timestamp,
      type: "latency_mark",
    };

    if (duration !== undefined) {
      meta.duration = duration;
    }

    this.info(`Latency mark: ${mark}`, meta);
  }

  logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const entry = this.createLogEntry("warn", message, details);
    entry.security = {
      eventType,
      severity,
      details,
    };

    // Use appropriate log level based on severity
    const logLevel = this.getSecurityLogLevel(severity);
    this.writeLog(logLevel, `[SECURITY] ${message}`, { security: entry.security });
  }

  private getSecurityLogLevel(severity: SecuritySeverity): LogLevel {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warn";
      case "high":
        return "error";
      case "critical":
        return "error";
      default:
        return "warn";
    }
  }
}
