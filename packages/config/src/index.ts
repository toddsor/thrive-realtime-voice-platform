// Configuration loader functions
export {
  loadRuntimeConfig,
  loadPublicRuntimeConfig,
  loadDatabaseConfig,
  loadAuthConfig,
  loadAllConfigs,
} from "./loader";

// Agent configuration
export { defaultAgentConfig, getAgentConfigWithUser } from "./agentConfig";

// Feature flags
export { featureFlagManager, FeatureFlagManager } from "./featureFlags";

// Model configuration
export { AVAILABLE_MODELS, getValidatedModel, validateModel } from "./modelConfig";
export type { RealtimeModel, ModelValidationResult } from "./modelConfig";

// Session limits
export {
  DEFAULT_SESSION_LIMITS,
  sessionLimitManager,
  getSessionLimitForTier,
  isSessionLimitExceeded,
  getSessionTimeRemaining,
  formatSessionDuration,
} from "./sessionLimits";
export type { UserTier, SessionLimitConfig, SessionLimits, SessionStatus } from "./sessionLimits";
export { SessionLimitManager } from "./sessionLimits";

// System prompts
export {
  SYSTEM_PROMPTS,
  getSystemPrompt,
  getPersonaOnly,
  getSafetyGuidelines,
  getToolUseGuidance,
  getContentPolicy,
  getDisclaimers,
  getPromptVersion,
  isPromptVersionCurrent,
} from "./systemPrompts";

// Cost configuration
export { loadCostConfig, getPricingModel, validateCostConfig, getCostConfigSummary } from "./costConfig";
export type { CostConfig } from "./costConfig";
export type { SystemPromptConfig } from "./systemPrompts";

// Re-export types from contracts
export type { RuntimeConfig, PublicRuntimeConfig } from "@thrivereflections/realtime-contracts";
