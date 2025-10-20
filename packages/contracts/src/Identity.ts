export type IdentityLevel = "ephemeral" | "local" | "anonymous" | "pseudonymous" | "authenticated";

export type ConsentState = "ACCEPTED" | "DECLINED" | "UNKNOWN";

export interface RetentionPolicy {
  maxAgeMs: number;
  maxBytes?: number;
}

export interface ClientIdentity {
  level: IdentityLevel;
  anonymousId?: string;
  pseudonymousId?: string;
  userId?: string;
  consent?: ConsentState;
}

export interface SessionIdentity extends ClientIdentity {
  sessionId?: string;
  retention?: RetentionPolicy;
}
