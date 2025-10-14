export interface AgentConfig {
    persona: string;
    voice: string;
    capabilities: ("speech" | "captions" | "tools")[];
    toolPolicy: "deny_all" | "allow_list";
    allowedTools: string[];
    user?: {
        sub: string;
        tenant?: string;
    };
    featureFlags: {
        transport: "webrtc" | "websocket";
        bargeIn: boolean;
        captions: "off" | "partial" | "full";
        memory?: "off" | "short" | "long";
    };
}
//# sourceMappingURL=AgentConfig.d.ts.map