import { AgentConfig, Timings } from "@thrive/realtime-contracts";
import { Transcript } from "@/lib/hooks/useRealtimeVoice";
import { redactPII } from "@thrive/realtime-security";

export interface ToolEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: number;
  duration?: number;
}

export interface SessionData {
  sessionId: string;
  user: { sub: string; tenant?: string };
  config: AgentConfig;
  timings: Timings;
  transcripts: Transcript[];
  toolEvents: ToolEvent[];
  createdAt: number;
  expiresAt: number;
}

export interface MemoryStore {
  saveSessionMeta(
    sessionId: string,
    user: { sub: string; tenant?: string },
    config: AgentConfig,
    timings: Timings,
    consent?: "DECLINED" | "ACCEPTED"
  ): Promise<void>;
  appendTranscript(sessionId: string, segment: Transcript): Promise<void>;
  appendToolEvent(sessionId: string, event: ToolEvent): Promise<void>;
  getSession(sessionId: string): Promise<SessionData | null>;
  getAllSessions(): Promise<SessionData[]>;
  deleteSession(sessionId: string): Promise<void>;
  clearExpiredSessions(): Promise<void>;
}

export class MemoryStoreImpl implements MemoryStore {
  private sessions = new Map<string, SessionData>();
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval to remove expired sessions
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.clearExpiredSessions();
    }, 60 * 60 * 1000);
  }

  private getTTL(): number {
    const envTTL = process.env.SESSION_TTL;
    if (envTTL) {
      return parseInt(envTTL) * 60 * 60 * 1000; // Convert hours to milliseconds
    }
    return this.defaultTTL;
  }

  async saveSessionMeta(
    sessionId: string,
    user: { sub: string; tenant?: string },
    config: AgentConfig,
    timings: Timings,
    consent?: "DECLINED" | "ACCEPTED"
  ): Promise<void> {
    try {
      const now = Date.now();
      const sessionData: SessionData = {
        sessionId,
        user,
        config,
        timings,
        transcripts: [],
        toolEvents: [],
        createdAt: now,
        expiresAt: now + this.getTTL(),
      };

      this.sessions.set(sessionId, sessionData);
      console.log("💾 Session metadata saved to in-memory store");

      // Also persist to database via internal API
      try {
        const response = await fetch("/api/internal/session-created", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            authUserId: user.sub, // Pass the auth user ID
            config,
            timings,
            consent: consent || "DECLINED",
          }),
        });

        if (!response.ok) {
          console.warn("Failed to persist session to database:", response.status);
        } else {
          console.log("💾 Session metadata persisted to database");
        }
      } catch (dbError) {
        console.warn("Failed to persist session to database:", dbError);
        // Don't throw - this is a non-critical operation
      }
    } catch (error) {
      console.error("Failed to save session metadata:", error);
      // Don't throw - this is a non-critical operation
    }
  }

  async appendTranscript(sessionId: string, segment: Transcript): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.warn(`Session ${sessionId} not found for transcript append`);
        return;
      }

      // Apply PII redaction to transcript text
      const redactedSegment = {
        ...segment,
        text: redactPII(segment.text),
      };

      session.transcripts.push(redactedSegment);

      // Update the session in the map
      this.sessions.set(sessionId, session);
      console.log("💾 Transcript saved to in-memory store");
    } catch (error) {
      console.error("Failed to append transcript:", error);
      // Don't throw - this is a non-critical operation
    }
  }

  async appendToolEvent(sessionId: string, event: ToolEvent): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.warn(`Session ${sessionId} not found for tool event append`);
        return;
      }

      // Apply PII redaction to tool event args and result
      const redactedEvent: ToolEvent = {
        ...event,
        args: this.redactObject(event.args) as Record<string, unknown>,
        result: event.result ? this.redactObject(event.result) : event.result,
      };

      session.toolEvents.push(redactedEvent);

      // Update the session in the map
      this.sessions.set(sessionId, session);
      console.log("💾 Tool event saved to in-memory store");
    } catch (error) {
      console.error("Failed to append tool event:", error);
      // Don't throw - this is a non-critical operation
    }
  }

  private redactObject(obj: unknown): unknown {
    if (typeof obj === "string") {
      return redactPII(obj);
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.redactObject(item));
    } else if (obj && typeof obj === "object") {
      const redacted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        redacted[key] = this.redactObject(value);
      }
      return redacted;
    }
    return obj;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  async getAllSessions(): Promise<SessionData[]> {
    const now = Date.now();
    const validSessions: SessionData[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      } else {
        validSessions.push(session);
      }
    }

    // Sort by creation date (newest first)
    return validSessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async clearExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach((sessionId) => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const memoryStore = new MemoryStoreImpl();
