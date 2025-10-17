/**
 * Shared Cost Calculation Utility
 *
 * This utility provides UI-specific cost calculation helpers for the demo app,
 * using the centralized cost calculation logic from the usage package.
 */

import { calculateUsageCost, getCostBreakdown, type DetailedCostBreakdown } from "@thrivereflections/realtime-usage";

export interface UsageData {
  sessionId: string;
  startTime: number;
  durationMs: number;
  audioMinutes: number;
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  textTokensInput: number;
  textTokensOutput: number;
  textTokensCached: number;
  audioTokensInput: number;
  audioTokensOutput: number;
  audioTokensCached: number;
  toolCalls: number;
  retrievals: number;
  estimatedCost: number;
}

/**
 * Calculate the estimated cost for usage data using the usage package
 */
export function calculateUsageCostForDemo(
  data: Omit<UsageData, "estimatedCost">,
  model: "gpt-realtime" | "gpt-realtime-mini"
): number {
  return calculateUsageCost(
    {
      textTokensInput: data.textTokensInput,
      textTokensOutput: data.textTokensOutput,
      textTokensCached: data.textTokensCached,
      audioTokensInput: data.audioTokensInput,
      audioTokensOutput: data.audioTokensOutput,
      audioTokensCached: data.audioTokensCached,
      toolCalls: data.toolCalls,
      retrievals: data.retrievals,
    },
    model
  );
}

/**
 * Calculate cost for a single transcript message
 */
export function calculateTranscriptCost(text: string, role: "user" | "assistant", type: "partial" | "final"): number {
  if (type !== "final") return 0;

  const estimatedTokens = Math.ceil(text.length / 4);

  // Use the usage package for accurate calculation
  return calculateUsageCost(
    {
      textTokensInput: role === "user" ? estimatedTokens : 0,
      textTokensOutput: role === "assistant" ? estimatedTokens : 0,
      textTokensCached: 0,
      audioTokensInput: 0,
      audioTokensOutput: 0,
      audioTokensCached: 0,
      toolCalls: 0,
      retrievals: 0,
    },
    "gpt-realtime-mini"
  );
}

/**
 * Calculate cost for audio duration
 */
export function calculateAudioCost(audioMinutes: number): number {
  // Use the usage package for accurate calculation
  return calculateUsageCost(
    {
      textTokensInput: 0,
      textTokensOutput: 0,
      textTokensCached: 0,
      audioTokensInput: Math.ceil(audioMinutes * 60), // Rough estimate: 1 token per second
      audioTokensOutput: 0,
      audioTokensCached: 0,
      toolCalls: 0,
      retrievals: 0,
    },
    "gpt-realtime-mini"
  );
}

/**
 * Format cost for display - rounds to nearest cent
 */
export function formatCost(cost: number): string {
  // Round to the nearest cent (2 decimal places)
  const roundedCost = Math.round(cost * 100) / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundedCost);
}

/**
 * Get cost breakdown for detailed display using the usage package
 */
export function getCostBreakdownForDemo(
  data: Omit<UsageData, "estimatedCost">,
  model: "gpt-realtime" | "gpt-realtime-mini"
): DetailedCostBreakdown {
  return getCostBreakdown(
    {
      textTokensInput: data.textTokensInput,
      textTokensOutput: data.textTokensOutput,
      textTokensCached: data.textTokensCached,
      audioTokensInput: data.audioTokensInput,
      audioTokensOutput: data.audioTokensOutput,
      audioTokensCached: data.audioTokensCached,
      toolCalls: data.toolCalls,
      retrievals: data.retrievals,
    },
    model
  );
}

/**
 * Create initial usage data with zero costs
 */
export function createInitialUsageData(sessionId: string): Omit<UsageData, "estimatedCost"> {
  const now = Date.now();
  return {
    sessionId,
    startTime: now,
    durationMs: 0,
    audioMinutes: 0,
    tokensInput: 0,
    tokensOutput: 0,
    tokensCached: 0,
    textTokensInput: 0,
    textTokensOutput: 0,
    textTokensCached: 0,
    audioTokensInput: 0,
    audioTokensOutput: 0,
    audioTokensCached: 0,
    toolCalls: 0,
    retrievals: 0,
  };
}

/**
 * Update usage data with new values and recalculate cost
 */
export function updateUsageDataWithCost(
  current: Omit<UsageData, "estimatedCost">,
  updates: Partial<Omit<UsageData, "estimatedCost">>,
  model: "gpt-realtime" | "gpt-realtime-mini"
): UsageData {
  const updated = { ...current, ...updates };
  return {
    ...updated,
    estimatedCost: calculateUsageCostForDemo(updated, model),
  };
}

/**
 * Validate usage data
 */
export function validateUsageData(data: Partial<UsageData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.tokensInput !== undefined && data.tokensInput < 0) {
    errors.push("Input tokens cannot be negative");
  }

  if (data.tokensOutput !== undefined && data.tokensOutput < 0) {
    errors.push("Output tokens cannot be negative");
  }

  if (data.toolCalls !== undefined && data.toolCalls < 0) {
    errors.push("Tool calls cannot be negative");
  }

  if (data.retrievals !== undefined && data.retrievals < 0) {
    errors.push("Retrievals cannot be negative");
  }

  if (data.audioMinutes !== undefined && data.audioMinutes < 0) {
    errors.push("Audio minutes cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
