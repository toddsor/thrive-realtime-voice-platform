export type TransportKind = "webrtc" | "websocket";

export interface FeatureFlags {
  transport: TransportKind;
  bargeIn: boolean;
  captions: boolean;
  tools: boolean;
  memory: "off" | "short" | "long";
  // Anonymity/identity feature gates
  anonymityEphemeralEnabled?: boolean;
  anonymityLocalEnabled?: boolean;
  anonymityAnonymousEnabled?: boolean;
  anonymityPseudonymousEnabled?: boolean;
  anonymityAuthenticatedEnabled?: boolean;
}

export interface PolicyConfig {
  maxPayloadBytes: number; // default: 524288 (512KB)
  maxSessionMinutes: number; // default: 15
  allowUnconsentedStorage: boolean; // default: false
  rateLimit: {
    sessions: { max: number; window: number };
    toolCalls: { max: number; window: number };
  };
  retention?: {
    ephemeral?: { maxAgeMs: number };
    local?: { maxAgeMs: number };
    anonymous?: { maxAgeMs: number };
    pseudonymous?: { maxAgeMs: number };
    authenticated?: { maxAgeMs: number };
  };
}

export interface RuntimeConfig {
  model: string;
  openaiKey: string;
  baseUrl?: string;
  featureFlags: FeatureFlags;
  policies: PolicyConfig;
}

export interface PublicRuntimeConfig {
  model: string;
  baseUrl?: string;
  featureFlags: FeatureFlags;
  policies: PolicyConfig;
  // Note: openaiKey is intentionally excluded for security
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
      google?: { clientId: string; secret: string };
      linkedin?: { clientId: string; secret: string };
      facebook?: { clientId: string; secret: string };
    };
  };
}
