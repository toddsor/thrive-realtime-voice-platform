export const AVAILABLE_MODELS = ["gpt-realtime", "gpt-realtime-mini"];
/**
 * Validates and returns the configured OpenAI Realtime model
 * Defaults to 'gpt-realtime-mini' if not configured
 * @throws Error if model is invalid (but not if not configured)
 */
export function getValidatedModel() {
    const model = process.env.OPENAI_API_REALTIME_MODEL || "gpt-realtime-mini";
    if (!AVAILABLE_MODELS.includes(model)) {
        throw new Error(`Invalid model '${model}'. Must be one of: ${AVAILABLE_MODELS.join(", ")}`);
    }
    return model;
}
/**
 * Safe version that returns validation result instead of throwing
 */
export function validateModel() {
    try {
        const model = getValidatedModel();
        return { success: true, model };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
