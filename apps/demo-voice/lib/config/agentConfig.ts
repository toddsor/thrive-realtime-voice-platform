import { AgentConfig } from "@thrivereflections/realtime-contracts";
import { getPersonaOnly } from "@/lib/config/systemPrompts";
import { featureFlagManager, getAgentConfigWithUser } from "@thrivereflections/realtime-config";

export const defaultAgentConfig: AgentConfig = {
  persona: getPersonaOnly(),
  voice: "alloy",
  capabilities: ["speech", "captions", "tools"],
  toolPolicy: "allow_list",
  allowedTools: ["echo", "retrieve_docs"],
  user: {
    sub: "anonymous",
    tenant: "default",
  },
  featureFlags: {
    transport: "webrtc",
    bargeIn: true,
    captions: "partial",
    memory: "off",
  },
};

/**
 * Example: How to create a custom agent configuration
 * This shows how developers can override the default agent with their own settings
 */
export function createCustomAgentConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    ...defaultAgentConfig,
    ...overrides,
    // Ensure feature flags are properly merged
    featureFlags: {
      ...defaultAgentConfig.featureFlags,
      ...overrides.featureFlags,
    },
  };
}

/**
 * Example: How to create a specialized agent for different use cases
 */
export const agentConfigs = {
  // Customer support agent
  support: createCustomAgentConfig({
    persona: "You are a helpful customer support agent. Be empathetic, patient, and solution-oriented.",
    voice: "nova",
    capabilities: ["speech", "captions", "tools"],
    allowedTools: ["echo", "retrieve_docs", "create_ticket"],
    featureFlags: {
      transport: "webrtc",
      bargeIn: true,
      captions: "full",
      memory: "short",
    },
  }),

  // Sales agent
  sales: createCustomAgentConfig({
    persona:
      "You are a professional sales representative. Be persuasive, knowledgeable, and focused on understanding customer needs.",
    voice: "shimmer",
    capabilities: ["speech", "captions", "tools"],
    allowedTools: ["echo", "retrieve_docs", "get_product_info", "schedule_demo"],
    featureFlags: {
      transport: "webrtc",
      bargeIn: false, // Don't interrupt sales conversations
      captions: "partial",
      memory: "long", // Remember conversation history for sales context
    },
  }),

  // Technical assistant
  technical: createCustomAgentConfig({
    persona: "You are a technical assistant. Be precise, detailed, and provide accurate technical information.",
    voice: "alloy",
    capabilities: ["speech", "captions", "tools"],
    allowedTools: ["echo", "retrieve_docs", "run_code", "check_system_status"],
    featureFlags: {
      transport: "webrtc",
      bargeIn: true,
      captions: "full",
      memory: "short",
    },
  }),
} as const;

/**
 * Example: How to get agent config based on user preferences or context
 */
export function getAgentConfigForContext(
  context: "support" | "sales" | "technical" | "default",
  userOverrides?: Partial<AgentConfig>
): AgentConfig {
  const baseConfig = context === "default" ? defaultAgentConfig : agentConfigs[context];

  if (userOverrides) {
    return createCustomAgentConfig({
      ...baseConfig,
      ...userOverrides,
    });
  }

  return baseConfig;
}

/**
 * Example: How to validate agent configuration
 */
export function validateAgentConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.persona || config.persona.trim().length === 0) {
    errors.push("Persona is required");
  }

  if (!config.voice || !["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(config.voice)) {
    errors.push("Invalid voice selection");
  }

  if (!config.capabilities || config.capabilities.length === 0) {
    errors.push("At least one capability must be specified");
  }

  if (config.toolPolicy === "allow_list" && (!config.allowedTools || config.allowedTools.length === 0)) {
    errors.push("Allowed tools must be specified when using allow_list policy");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Re-export the platform's getAgentConfigWithUser function
// This demonstrates how to use the platform's configuration system
export { getAgentConfigWithUser } from "@thrivereflections/realtime-config";
