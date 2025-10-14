export const AVAILABLE_MODELS = ["gpt-realtime", "gpt-realtime-mini"] as const;
export type RealtimeModel = (typeof AVAILABLE_MODELS)[number];

export interface ModelValidationResult {
  success: boolean;
  model?: RealtimeModel;
  error?: string;
}

/**
 * Validates and returns the configured OpenAI Realtime model
 * Defaults to 'gpt-realtime-mini' if not configured
 * @throws Error if model is invalid (but not if not configured)
 */
export function getValidatedModel(): RealtimeModel {
  const model = process.env.OPENAI_API_REALTIME_MODEL || "gpt-realtime-mini";

  if (!AVAILABLE_MODELS.includes(model as RealtimeModel)) {
    throw new Error(`Invalid model '${model}'. Must be one of: ${AVAILABLE_MODELS.join(", ")}`);
  }

  return model as RealtimeModel;
}

/**
 * Safe version that returns validation result instead of throwing
 */
export function validateModel(): ModelValidationResult {
  try {
    const model = getValidatedModel();
    return { success: true, model };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
