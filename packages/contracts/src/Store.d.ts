export interface SessionMeta {
    sessionId: string;
    userId?: string;
    openAiSessionId: string;
    persona: string;
    config: unknown;
    timings: unknown;
    consent?: "ACCEPTED" | "DECLINED";
    startedAt: Date;
}
export interface TranscriptInput {
    sessionId: string;
    role: "user" | "assistant";
    text: string;
    startedAt: number;
    endedAt: number;
}
export interface ToolEventInput {
    sessionId: string;
    name: string;
    args: unknown;
    result?: unknown;
    timestamp: number;
}
export interface Store {
    saveSession(meta: SessionMeta): Promise<void>;
    saveTranscript(input: TranscriptInput): Promise<void>;
    saveToolEvent(evt: ToolEventInput): Promise<void>;
}
//# sourceMappingURL=Store.d.ts.map
