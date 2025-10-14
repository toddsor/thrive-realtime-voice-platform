import { LogEntry } from "./logger";

export interface LogSink {
  write(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
}

export class ConsoleLogSink implements LogSink {
  write(_entry: LogEntry): void {
    // This is handled by the ConsoleLogger directly
    // This sink is mainly for interface compliance
  }

  flush?(): Promise<void> {
    // No-op for console sink
    return Promise.resolve();
  }
}

export class RemoteLogSink implements LogSink {
  private buffer: LogEntry[] = [];
  private maxBufferSize: number;
  private flushInterval: number;
  private remoteUrl?: string;
  private apiKey?: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(maxBufferSize: number = 100, flushInterval: number = 5000, remoteUrl?: string, apiKey?: string) {
    this.maxBufferSize = maxBufferSize;
    this.flushInterval = flushInterval;
    this.remoteUrl = remoteUrl;
    this.apiKey = apiKey;

    if (this.remoteUrl && this.apiKey) {
      this.startFlushTimer();
    }
  }

  write(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
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
    } catch (error) {
      console.error("Failed to send logs to remote sink:", error);
      // Re-add entries to buffer for retry
      this.buffer.unshift(...entries);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Factory function to create appropriate sink based on configuration
export function createLogSink(config?: {
  sinkType?: "console" | "remote";
  remoteUrl?: string;
  apiKey?: string;
  maxBufferSize?: number;
  flushInterval?: number;
}): LogSink {
  const sinkType = config?.sinkType || "console";

  switch (sinkType) {
    case "remote":
      return new RemoteLogSink(
        config?.maxBufferSize || 100,
        config?.flushInterval || 5000,
        config?.remoteUrl,
        config?.apiKey
      );
    case "console":
    default:
      return new ConsoleLogSink();
  }
}
