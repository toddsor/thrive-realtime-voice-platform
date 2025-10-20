import { ToolDefinition, ToolPolicy, ClientIdentity, IdentityLevel } from "@thrivereflections/realtime-contracts";
import { redactPII } from "@thrivereflections/realtime-security";

const LEVEL_ORDER: IdentityLevel[] = ["ephemeral", "local", "anonymous", "pseudonymous", "authenticated"];

export interface PolicyEnforcementResult {
  allowed: boolean;
  reason?: string;
  input?: unknown;
  blocked?: boolean;
}

export function canExecuteTool(
  tool: ToolDefinition,
  identity: ClientIdentity,
  callCount: number
): PolicyEnforcementResult {
  const { policy } = tool;

  // Check min identity level
  const currentLevelIndex = LEVEL_ORDER.indexOf(identity.level);
  const minLevelIndex = LEVEL_ORDER.indexOf(policy.minIdentityLevel);

  if (currentLevelIndex < minLevelIndex) {
    return {
      allowed: false,
      reason: `Requires ${policy.minIdentityLevel} or higher, current level is ${identity.level}`,
    };
  }

  // Check explicit whitelist
  if (policy.allowedLevels && !policy.allowedLevels.includes(identity.level)) {
    return {
      allowed: false,
      reason: `Identity level ${identity.level} not in allowed list: ${policy.allowedLevels.join(", ")}`,
    };
  }

  // Check rate limit
  if (policy.maxCallsPerSession && callCount >= policy.maxCallsPerSession) {
    return {
      allowed: false,
      reason: `Session call limit exceeded (${callCount}/${policy.maxCallsPerSession})`,
    };
  }

  // Check external access for ephemeral users
  if (policy.requiresExternalAccess && identity.level === "ephemeral") {
    return {
      allowed: false,
      reason: "External access not allowed for ephemeral identity level",
    };
  }

  // Check consent requirement
  if (policy.requiresConsent && identity.consent !== "ACCEPTED") {
    return {
      allowed: false,
      reason: "Explicit consent required for this tool",
    };
  }

  return { allowed: true };
}

export function handleToolInput(input: unknown, policy: ToolPolicy, identity: ClientIdentity): PolicyEnforcementResult {
  if (policy.piiHandling === "allow") {
    return { allowed: true, input, blocked: false };
  }

  const inputStr = JSON.stringify(input);
  const hasPII = containsPII(inputStr);

  if (!hasPII) {
    return { allowed: true, input, blocked: false };
  }

  if (policy.piiHandling === "block") {
    return {
      allowed: false,
      reason: "PII detected in input and blocking is required by tool policy",
      blocked: true,
    };
  }

  // Redact PII
  const redacted = redactPII(inputStr);
  try {
    const redactedInput = JSON.parse(redacted);
    return { allowed: true, input: redactedInput, blocked: false };
  } catch (error) {
    return {
      allowed: false,
      reason: "Failed to redact PII from input",
      blocked: true,
    };
  }
}

function containsPII(text: string): boolean {
  // Simple PII detection patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;

  return emailPattern.test(text) || phonePattern.test(text) || ssnPattern.test(text);
}

export function enforceToolPolicy(
  tool: ToolDefinition,
  input: unknown,
  identity: ClientIdentity,
  callCount: number
): PolicyEnforcementResult {
  // First check if tool can be executed
  const executionCheck = canExecuteTool(tool, identity, callCount);
  if (!executionCheck.allowed) {
    return executionCheck;
  }

  // Then handle input processing
  const inputCheck = handleToolInput(input, tool.policy, identity);
  if (!inputCheck.allowed) {
    return inputCheck;
  }

  return {
    allowed: true,
    input: inputCheck.input,
    blocked: inputCheck.blocked,
  };
}
