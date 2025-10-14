export class ConsoleLogSink {
    write(_entry) {
        // This is handled by the ConsoleLogger directly
        // This sink is mainly for interface compliance
    }
    flush() {
        // No-op for console sink
        return Promise.resolve();
    }
}
export class RemoteLogSink {
    constructor(maxBufferSize = 100, flushInterval = 5000, remoteUrl, apiKey) {
        this.buffer = [];
        this.maxBufferSize = maxBufferSize;
        this.flushInterval = flushInterval;
        this.remoteUrl = remoteUrl;
        this.apiKey = apiKey;
        if (this.remoteUrl && this.apiKey) {
            this.startFlushTimer();
        }
    }
    write(entry) {
        this.buffer.push(entry);
        if (this.buffer.length >= this.maxBufferSize) {
            this.flush();
        }
    }
    async flush() {
        if (this.buffer.length === 0) {
            return;
        }
        const entries = [...this.buffer];
        this.buffer = [];
        if (!this.remoteUrl || !this.apiKey) {
            // Fallback to console if remote not configured
            entries.forEach((entry) => {
                console.log("[REMOTE_LOG]", entry);
            });
            return;
        }
        try {
            await fetch(this.remoteUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    entries,
                    timestamp: new Date().toISOString(),
                    source: "voice-app",
                }),
            });
        }
        catch (error) {
            console.error("Failed to send logs to remote sink:", error);
            // Re-add entries to buffer for retry
            this.buffer.unshift(...entries);
        }
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }
    destroy() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
// Factory function to create appropriate sink based on configuration
export function createLogSink(config) {
    const sinkType = config?.sinkType || "console";
    switch (sinkType) {
        case "remote":
            return new RemoteLogSink(config?.maxBufferSize || 100, config?.flushInterval || 5000, config?.remoteUrl, config?.apiKey);
        case "console":
        default:
            return new ConsoleLogSink();
    }
}
