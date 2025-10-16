export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
    user?: {
        sub?: string;
        tenant?: string;
    };
}
export interface ToolCallResponse {
    id: string;
    ok: boolean;
    result?: unknown;
    error?: string;
}
//# sourceMappingURL=ToolCall.d.ts.map
