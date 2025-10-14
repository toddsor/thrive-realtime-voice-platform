import { LogLevelEnum } from "./logger";
export class InjectableConsoleLogger {
    constructor(correlationId, config) {
        this.correlationId = correlationId;
        this.config = config || { level: "info" };
        this.logLevel = LogLevelEnum[this.config.level.toUpperCase()];
    }
    setConfig(config) {
        this.config = config;
        this.logLevel = LogLevelEnum[config.level.toUpperCase()];
    }
    setLogLevel(level) {
        this.logLevel = LogLevelEnum[level.toUpperCase()];
    }
    isLevelEnabled(level) {
        return LogLevelEnum[level.toUpperCase()] >= this.logLevel;
    }
    setSessionIds(clientSessionId, openaiSessionId) {
        this.clientSessionId = clientSessionId;
        this.openaiSessionId = openaiSessionId;
    }
    setToolCallId(toolCallId) {
        this.toolCallId = toolCallId;
    }
    logLatencyMark(mark, timestamp) {
        this.debug(`Latency mark: ${mark}`, { mark, timestamp });
    }
    createLogEntry(level, message, meta) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId: this.correlationId,
            clientSessionId: this.clientSessionId,
            openaiSessionId: this.openaiSessionId,
            toolCallId: this.toolCallId,
            metadata: {
                ...meta,
                environment: this.config.environment || "development",
                runtime: this.config.runtime || "node",
            },
        };
    }
    writeLog(level, message, meta) {
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
    debug(message, meta) {
        this.writeLog("debug", message, meta);
    }
    info(message, meta) {
        this.writeLog("info", message, meta);
    }
    warn(message, meta) {
        this.writeLog("warn", message, meta);
    }
    error(message, meta) {
        this.writeLog("error", message, meta);
    }
    logError(error, context, category) {
        this.error("Error occurred", {
            ...context,
            error: {
                message: error.message,
                stack: error.stack,
                category: category || "unknown",
            },
        });
    }
    logSecurityEvent(eventType, severity, message, details) {
        this.warn(`Security event: ${message}`, {
            security: {
                eventType,
                severity,
                details,
            },
        });
    }
}
