import { AgentConfig } from "@thrive/realtime-contracts";
import { authProvider } from "@/lib/auth/authProvider";
import { getPersonaOnly } from "@/lib/config/systemPrompts";
import { featureFlagManager } from "@thrive/realtime-config";

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

// Function to get config with current user and feature flags
export async function getAgentConfigWithUser(): Promise<AgentConfig> {
  const user = await authProvider.getCurrentUser();
  const userTier = "free"; // In a real app, this would come from user data

  // Evaluate feature flags for this user
  const flags = featureFlagManager.evaluateFlags(user.sub, userTier);

  // Determine capabilities based on feature flags
  const capabilities: ("speech" | "captions" | "tools")[] = ["speech"];

  if (flags.captions_enabled?.enabled) {
    capabilities.push("captions");
  }

  if (flags.tools_enabled?.enabled) {
    capabilities.push("tools");
  }

  // Determine tool policy and allowed tools
  const toolPolicy = flags.tools_enabled?.enabled ? "allow_list" : "deny_all";
  const allowedTools = flags.tools_enabled?.enabled ? ["echo", "retrieve_docs"] : [];

  // Determine transport based on feature flags
  const transport = flags.webrtc_fallback_force?.enabled ? "websocket" : "webrtc";

  // Determine captions level
  const captions = flags.captions_enabled?.enabled ? "partial" : "off";

  // Determine memory setting
  const memory = flags.session_persistence_enabled?.enabled ? "short" : "off";

  return {
    ...defaultAgentConfig,
    capabilities,
    toolPolicy,
    allowedTools,
    user: {
      sub: user.sub,
      tenant: user.tenant,
    },
    featureFlags: {
      transport,
      bargeIn: true,
      captions,
      memory,
    },
  };
}
