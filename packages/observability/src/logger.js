export var LogLevelEnum;
(function (LogLevelEnum) {
    LogLevelEnum[LogLevelEnum["DEBUG"] = 0] = "DEBUG";
    LogLevelEnum[LogLevelEnum["INFO"] = 1] = "INFO";
    LogLevelEnum[LogLevelEnum["WARN"] = 2] = "WARN";
    LogLevelEnum[LogLevelEnum["ERROR"] = 3] = "ERROR";
})(LogLevelEnum || (LogLevelEnum = {}));
export class ConsoleLogger {
    constructor(correlationId) {
        this.correlationId = correlationId;
        this.logLevel = this.getLogLevelFromEnv();
    }
    getLogLevelFromEnv() {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase();
        switch (envLevel) {
            case 'debug': return LogLevelEnum.DEBUG;
            case 'info': return LogLevelEnum.INFO;
            case 'warn': return LogLevelEnum.WARN;
            case 'error': return LogLevelEnum.ERROR;
            default: return LogLevelEnum.INFO;
        }
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
                environment: process.env.NODE_ENV || 'development',
                runtime: typeof window !== 'undefined' ? 'browser' : 'node'
            }
        };
    }
    writeLog(level, message, meta) {
        if (!this.isLevelEnabled(level)) {
            return;
        }
        const entry = this.createLogEntry(level, message, meta);
        switch (level) {
            case 'debug':
                console.debug(`[DEBUG] ${message}`, entry);
                break;
            case 'info':
                console.info(`[INFO] ${message}`, entry);
                break;
            case 'warn':
                console.warn(`[WARN] ${message}`, entry);
                break;
            case 'error':
                console.error(`[ERROR] ${message}`, entry);
                break;
        }
    }
    debug(message, meta) {
        this.writeLog('debug', message, meta);
    }
    info(message, meta) {
        this.writeLog('info', message, meta);
    }
    warn(message, meta) {
        this.writeLog('warn', message, meta);
    }
    error(message, meta) {
        this.writeLog('error', message, meta);
    }
    logError(error, context, category) {
        if (!this.isLevelEnabled('error')) {
            return;
        }
        const entry = this.createLogEntry('error', error.message, context);
        entry.error = {
            message: error.message,
            stack: error.stack,
            category: category || 'unknown'
        };
        console.error(`[ERROR] ${error.message}`, entry);
    }
    logLatencyMark(mark, timestamp, duration) {
        const meta = {
            mark,
            timestamp,
            type: 'latency_mark'
        };
        if (duration !== undefined) {
            meta.duration = duration;
        }
        this.info(`Latency mark: ${mark}`, meta);
    }
    logSecurityEvent(eventType, severity, message, details) {
        const entry = this.createLogEntry('warn', message, details);
        entry.security = {
            eventType,
            severity,
            details
        };
        // Use appropriate log level based on severity
        const logLevel = this.getSecurityLogLevel(severity);
        this.writeLog(logLevel, `[SECURITY] ${message}`, { security: entry.security });
    }
    getSecurityLogLevel(severity) {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warn';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'warn';
        }
    }
}
