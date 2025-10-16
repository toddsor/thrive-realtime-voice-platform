export type TransportKind = "webrtc" | "websocket";
export interface FeatureFlags {
    transport: TransportKind;
    bargeIn: boolean;
    captions: boolean;
    tools: boolean;
    memory: "off" | "short" | "long";
}
export interface PolicyConfig {
    maxPayloadBytes: number;
    maxSessionMinutes: number;
    allowUnconsentedStorage: boolean;
    rateLimit: {
        sessions: {
            max: number;
            window: number;
        };
        toolCalls: {
            max: number;
            window: number;
        };
    };
}
export interface RuntimeConfig {
    model: string;
    openaiKey: string;
    baseUrl?: string;
    featureFlags: FeatureFlags;
    policies: PolicyConfig;
}
export interface DatabaseConfig {
    url: string;
    directUrl?: string;
}
export interface AuthConfig {
    supabase?: {
        url: string;
        anonKey: string;
        providers: {
            google?: {
                clientId: string;
                secret: string;
            };
            linkedin?: {
                clientId: string;
                secret: string;
            };
            facebook?: {
                clientId: string;
                secret: string;
            };
        };
    };
}
//# sourceMappingURL=RuntimeConfig.d.ts.map
