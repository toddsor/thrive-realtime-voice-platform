import { IdentityLevel } from "./Identity";

export interface ToolPolicy {
  minIdentityLevel: IdentityLevel;
  allowedLevels?: IdentityLevel[];
  requiresExternalAccess: boolean;
  piiHandling: "block" | "redact" | "allow";
  maxCallsPerSession?: number;
  requiresConsent?: boolean;
}

export interface ToolDefinition {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  policy: ToolPolicy;
}
