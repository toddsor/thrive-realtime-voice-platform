/**
 * Cost Configuration
 *
 * Manages cost rates and pricing models for the platform.
 * Supports environment variable overrides for dynamic pricing updates.
 */

export interface CostConfig {
  // Model-specific pricing
  models: {
    "gpt-realtime": {
      textInputTokenPer1M: number;
      textOutputTokenPer1M: number;
      textCachedTokenPer1M: number;
      audioInputTokenPer1M: number;
      audioOutputTokenPer1M: number;
      audioCachedTokenPer1M: number;
      toolCallOverhead: number;
      retrievalOverhead: number;
      sessionOverhead: number;
      connectionOverhead: number;
    };
    "gpt-realtime-mini": {
      textInputTokenPer1M: number;
      textOutputTokenPer1M: number;
      textCachedTokenPer1M: number;
      audioInputTokenPer1M: number;
      audioOutputTokenPer1M: number;
      audioCachedTokenPer1M: number;
      toolCallOverhead: number;
      retrievalOverhead: number;
      sessionOverhead: number;
      connectionOverhead: number;
    };
  };

  // Global cost settings
  currency: string;
  precision: number; // Decimal places for cost display
  enableSessionOverhead: boolean; // Whether to include session overhead in real-time calculations
  enableConnectionOverhead: boolean; // Whether to include connection overhead in real-time calculations
}

/**
 * Default cost configuration
 */
const DEFAULT_COST_CONFIG: CostConfig = {
  models: {
    "gpt-realtime": {
      textInputTokenPer1M: 4.0,
      textOutputTokenPer1M: 16.0,
      textCachedTokenPer1M: 0.4,
      audioInputTokenPer1M: 32.0,
      audioOutputTokenPer1M: 64.0,
      audioCachedTokenPer1M: 0.4,
      toolCallOverhead: 0.001,
      retrievalOverhead: 0.002,
      sessionOverhead: 0.005,
      connectionOverhead: 0.001,
    },
    "gpt-realtime-mini": {
      textInputTokenPer1M: 0.6,
      textOutputTokenPer1M: 2.4,
      textCachedTokenPer1M: 0.06,
      audioInputTokenPer1M: 10.0,
      audioOutputTokenPer1M: 20.0,
      audioCachedTokenPer1M: 0.3,
      toolCallOverhead: 0.0005,
      retrievalOverhead: 0.001,
      sessionOverhead: 0.005,
      connectionOverhead: 0.001,
    },
  },
  currency: "USD",
  precision: 4,
  enableSessionOverhead: false, // Disabled for real-time calculations
  enableConnectionOverhead: false, // Disabled for real-time calculations
};

/**
 * Load cost configuration from environment variables
 */
export function loadCostConfig(): CostConfig {
  const config = { ...DEFAULT_COST_CONFIG };

  // Override currency
  if (process.env.COST_CURRENCY) {
    config.currency = process.env.COST_CURRENCY;
  }

  // Override precision
  if (process.env.COST_PRECISION) {
    const precision = parseInt(process.env.COST_PRECISION, 10);
    if (!isNaN(precision) && precision >= 0 && precision <= 6) {
      config.precision = precision;
    }
  }

  // Override session overhead settings
  if (process.env.COST_ENABLE_SESSION_OVERHEAD) {
    config.enableSessionOverhead = process.env.COST_ENABLE_SESSION_OVERHEAD.toLowerCase() === "true";
  }

  if (process.env.COST_ENABLE_CONNECTION_OVERHEAD) {
    config.enableConnectionOverhead = process.env.COST_ENABLE_CONNECTION_OVERHEAD.toLowerCase() === "true";
  }

  // Override model pricing
  const modelOverrides = ["gpt-realtime", "gpt-realtime-mini"] as const;

  for (const model of modelOverrides) {
    const modelPrefix = `COST_${model.toUpperCase().replace("-", "_")}`;

    // Text input tokens
    if (process.env[`${modelPrefix}_TEXT_INPUT_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_TEXT_INPUT_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].textInputTokenPer1M = value;
      }
    }

    // Text output tokens
    if (process.env[`${modelPrefix}_TEXT_OUTPUT_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_TEXT_OUTPUT_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].textOutputTokenPer1M = value;
      }
    }

    // Text cached tokens
    if (process.env[`${modelPrefix}_TEXT_CACHED_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_TEXT_CACHED_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].textCachedTokenPer1M = value;
      }
    }

    // Audio input tokens
    if (process.env[`${modelPrefix}_AUDIO_INPUT_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_AUDIO_INPUT_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].audioInputTokenPer1M = value;
      }
    }

    // Audio output tokens
    if (process.env[`${modelPrefix}_AUDIO_OUTPUT_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_AUDIO_OUTPUT_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].audioOutputTokenPer1M = value;
      }
    }

    // Audio cached tokens
    if (process.env[`${modelPrefix}_AUDIO_CACHED_PER_1M`]) {
      const value = parseFloat(process.env[`${modelPrefix}_AUDIO_CACHED_PER_1M`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].audioCachedTokenPer1M = value;
      }
    }

    // Tool call overhead
    if (process.env[`${modelPrefix}_TOOL_CALL_OVERHEAD`]) {
      const value = parseFloat(process.env[`${modelPrefix}_TOOL_CALL_OVERHEAD`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].toolCallOverhead = value;
      }
    }

    // Retrieval overhead
    if (process.env[`${modelPrefix}_RETRIEVAL_OVERHEAD`]) {
      const value = parseFloat(process.env[`${modelPrefix}_RETRIEVAL_OVERHEAD`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].retrievalOverhead = value;
      }
    }

    // Session overhead
    if (process.env[`${modelPrefix}_SESSION_OVERHEAD`]) {
      const value = parseFloat(process.env[`${modelPrefix}_SESSION_OVERHEAD`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].sessionOverhead = value;
      }
    }

    // Connection overhead
    if (process.env[`${modelPrefix}_CONNECTION_OVERHEAD`]) {
      const value = parseFloat(process.env[`${modelPrefix}_CONNECTION_OVERHEAD`]!);
      if (!isNaN(value) && value >= 0) {
        config.models[model].connectionOverhead = value;
      }
    }
  }

  return config;
}

/**
 * Get pricing model for a specific model
 */
export function getPricingModel(
  model: "gpt-realtime" | "gpt-realtime-mini",
  config?: CostConfig
): CostConfig["models"][typeof model] {
  const costConfig = config || loadCostConfig();
  return costConfig.models[model];
}

// Cost formatting is handled by the frontend components

/**
 * Validate cost configuration
 */
export function validateCostConfig(config: CostConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate currency
  if (!config.currency || config.currency.length !== 3) {
    errors.push("Currency must be a 3-letter ISO code");
  }

  // Validate precision
  if (config.precision < 0 || config.precision > 6) {
    errors.push("Precision must be between 0 and 6");
  }

  // Validate model pricing
  const models = Object.keys(config.models) as Array<keyof CostConfig["models"]>;

  for (const model of models) {
    const modelConfig = config.models[model];

    // Check for negative values
    const fields = [
      "textInputTokenPer1M",
      "textOutputTokenPer1M",
      "textCachedTokenPer1M",
      "audioInputTokenPer1M",
      "audioOutputTokenPer1M",
      "audioCachedTokenPer1M",
      "toolCallOverhead",
      "retrievalOverhead",
      "sessionOverhead",
      "connectionOverhead",
    ] as const;

    for (const field of fields) {
      if (modelConfig[field] < 0) {
        errors.push(`${model}.${field} cannot be negative`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get cost configuration summary
 */
export function getCostConfigSummary(config?: CostConfig): {
  currency: string;
  precision: number;
  models: string[];
  sessionOverheadEnabled: boolean;
  connectionOverheadEnabled: boolean;
} {
  const costConfig = config || loadCostConfig();

  return {
    currency: costConfig.currency,
    precision: costConfig.precision,
    models: Object.keys(costConfig.models),
    sessionOverheadEnabled: costConfig.enableSessionOverhead,
    connectionOverheadEnabled: costConfig.enableConnectionOverhead,
  };
}
