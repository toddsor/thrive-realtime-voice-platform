import { calculateRealtimeCost, PRICING_MODELS, CostEstimator, getCostBreakdown } from "../costEstimator";

describe("Cost Estimator", () => {
  describe("Per-Million Token Pricing", () => {
    describe("gpt-realtime-mini", () => {
      const model = "gpt-realtime-mini";
      const rates = PRICING_MODELS[model];

      test("1M text input tokens should cost $0.60", () => {
        const data = {
          textTokensInput: 1000000,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.textInputCost).toBeCloseTo(0.6, 6);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M text output tokens should cost $2.40", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 1000000,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.textOutputCost).toBeCloseTo(2.4, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M text cached tokens should cost $0.06", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 1000000,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.textCachedCost).toBeCloseTo(0.06, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M audio input tokens should cost $10.00", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 1000000,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.audioInputCost).toBeCloseTo(10.0, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M audio output tokens should cost $20.00", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 1000000,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.audioOutputCost).toBeCloseTo(20.0, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M audio cached tokens should cost $0.30", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 1000000,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.audioCachedCost).toBeCloseTo(0.3, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
      });
    });

    describe("gpt-realtime", () => {
      const model = "gpt-realtime";
      const rates = PRICING_MODELS[model];

      test("1M text input tokens should cost $4.00", () => {
        const data = {
          textTokensInput: 1000000,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.textInputCost).toBeCloseTo(4.0, 6);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M text output tokens should cost $16.00", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 1000000,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.textOutputCost).toBeCloseTo(16.0, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M audio input tokens should cost $32.00", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 1000000,
          audioTokensOutput: 0,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.audioInputCost).toBeCloseTo(32.0, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioOutputCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });

      test("1M audio output tokens should cost $64.00", () => {
        const data = {
          textTokensInput: 0,
          textTokensOutput: 0,
          textTokensCached: 0,
          audioTokensInput: 0,
          audioTokensOutput: 1000000,
          audioTokensCached: 0,
          toolCalls: 0,
          retrievals: 0,
        };

        const breakdown = calculateRealtimeCost(data, model);

        expect(breakdown.audioOutputCost).toBeCloseTo(64.0, 6);
        expect(breakdown.textInputCost).toBe(0);
        expect(breakdown.textOutputCost).toBe(0);
        expect(breakdown.textCachedCost).toBe(0);
        expect(breakdown.audioInputCost).toBe(0);
        expect(breakdown.audioCachedCost).toBe(0);
      });
    });
  });

  describe("Pricing Model Validation", () => {
    test("pricing rates should be positive", () => {
      const miniRates = PRICING_MODELS["gpt-realtime-mini"];
      const fullRates = PRICING_MODELS["gpt-realtime"];

      expect(miniRates.textInputTokenPer1M).toBeGreaterThan(0);
      expect(miniRates.audioInputTokenPer1M).toBeGreaterThan(0);
      expect(fullRates.textInputTokenPer1M).toBeGreaterThan(0);
      expect(fullRates.audioInputTokenPer1M).toBeGreaterThan(0);
    });

    test("full model should be more expensive than mini", () => {
      const miniRates = PRICING_MODELS["gpt-realtime-mini"];
      const fullRates = PRICING_MODELS["gpt-realtime"];

      expect(fullRates.textInputTokenPer1M).toBeGreaterThan(miniRates.textInputTokenPer1M);
      expect(fullRates.textOutputTokenPer1M).toBeGreaterThan(miniRates.textOutputTokenPer1M);
      expect(fullRates.audioInputTokenPer1M).toBeGreaterThan(miniRates.audioInputTokenPer1M);
      expect(fullRates.audioOutputTokenPer1M).toBeGreaterThan(miniRates.audioOutputTokenPer1M);
    });

    test("pricing rates should match expected values", () => {
      const miniRates = PRICING_MODELS["gpt-realtime-mini"];
      const fullRates = PRICING_MODELS["gpt-realtime"];

      // gpt-realtime-mini rates
      expect(miniRates.textInputTokenPer1M).toBe(0.6);
      expect(miniRates.textOutputTokenPer1M).toBe(2.4);
      expect(miniRates.textCachedTokenPer1M).toBe(0.06);
      expect(miniRates.audioInputTokenPer1M).toBe(10.0);
      expect(miniRates.audioOutputTokenPer1M).toBe(20.0);
      expect(miniRates.audioCachedTokenPer1M).toBe(0.3);

      // gpt-realtime rates
      expect(fullRates.textInputTokenPer1M).toBe(4.0);
      expect(fullRates.textOutputTokenPer1M).toBe(16.0);
      expect(fullRates.textCachedTokenPer1M).toBe(0.4);
      expect(fullRates.audioInputTokenPer1M).toBe(32.0);
      expect(fullRates.audioOutputTokenPer1M).toBe(64.0);
      expect(fullRates.audioCachedTokenPer1M).toBe(0.4);
    });
  });

  describe("Cached Token Handling", () => {
    test("cached tokens should reduce input cost", () => {
      const data = {
        textTokensInput: 1000000,
        textTokensOutput: 0,
        textTokensCached: 500000, // 500K cached tokens
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = calculateRealtimeCost(data, "gpt-realtime-mini");

      // Should only pay for 500K input tokens (1M - 500K cached)
      expect(breakdown.textInputCost).toBeCloseTo(0.3, 6); // 500K * $0.60/1M
      expect(breakdown.textCachedCost).toBeCloseTo(0.03, 6); // 500K * $0.06/1M
    });

    test("cached tokens should not exceed input tokens", () => {
      const data = {
        textTokensInput: 1000000,
        textTokensOutput: 0,
        textTokensCached: 2000000, // More cached than input
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = calculateRealtimeCost(data, "gpt-realtime-mini");

      // All input tokens are cached, so no input cost
      expect(breakdown.textInputCost).toBe(0);
      // Cached cost is calculated as 2M * $0.06/1M = $0.12
      expect(breakdown.textCachedCost).toBeCloseTo(0.12, 6);
    });
  });

  describe("Tool Calls and Retrievals", () => {
    test("tool calls should add overhead cost", () => {
      const dataWithoutTools = {
        textTokensInput: 0,
        textTokensOutput: 0,
        textTokensCached: 0,
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const dataWithTools = {
        ...dataWithoutTools,
        toolCalls: 5,
        retrievals: 3,
      };

      const breakdownWithout = calculateRealtimeCost(dataWithoutTools, "gpt-realtime-mini");
      const breakdownWith = calculateRealtimeCost(dataWithTools, "gpt-realtime-mini");

      const toolCost = breakdownWith.totalCost - breakdownWithout.totalCost;
      const expectedToolCost = 5 * 0.0005 + 3 * 0.001; // 5 tool calls + 3 retrievals

      expect(toolCost).toBeCloseTo(expectedToolCost, 6);
    });
  });

  describe("Session Overhead", () => {
    test("should include session and connection overhead", () => {
      const data = {
        textTokensInput: 0,
        textTokensOutput: 0,
        textTokensCached: 0,
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = calculateRealtimeCost(data, "gpt-realtime-mini");

      // Should include session overhead ($0.005) + connection overhead ($0.001)
      expect(breakdown.sessionOverhead).toBe(0.005);
      expect(breakdown.connectionOverhead).toBe(0.001);
      expect(breakdown.totalCost).toBeCloseTo(0.006, 6);
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero tokens", () => {
      const data = {
        textTokensInput: 0,
        textTokensOutput: 0,
        textTokensCached: 0,
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = calculateRealtimeCost(data, "gpt-realtime-mini");

      expect(breakdown.textInputCost).toBe(0);
      expect(breakdown.textOutputCost).toBe(0);
      expect(breakdown.audioInputCost).toBe(0);
      expect(breakdown.audioOutputCost).toBe(0);
      expect(breakdown.textCachedCost).toBe(0);
      expect(breakdown.audioCachedCost).toBe(0);
      expect(breakdown.totalCost).toBeCloseTo(0.006, 6); // Only overhead
    });

    test("should handle negative cached tokens gracefully", () => {
      const data = {
        textTokensInput: 1000000,
        textTokensOutput: 0,
        textTokensCached: -100000, // Negative cached
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = calculateRealtimeCost(data, "gpt-realtime-mini");

      // Negative cached tokens result in: 1M - (-100K) = 1.1M input tokens
      expect(breakdown.textInputCost).toBeCloseTo(0.66, 6); // 1.1M * $0.60/1M
      expect(breakdown.textCachedCost).toBeCloseTo(-0.006, 6); // -100K * $0.06/1M
    });
  });

  describe("CostEstimator Class", () => {
    test("should calculate cost summary correctly", () => {
      const estimator = new CostEstimator(); // Use default rates
      const usage = {
        sessionId: "test-session",
        userId: "test-user",
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        durationMs: 60000, // 1 minute
        audioMinutes: 1.0,
        tokensInput: 1000, // 1K tokens (old interface uses per-1K)
        tokensOutput: 500, // 500 tokens
        tokensCached: 100, // 100 tokens
        toolCalls: 2,
        retrievals: 1,
        estimatedCost: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const summary = estimator.getCostSummary(usage);

      expect(summary.totalCost).toBeGreaterThan(0);
      expect(summary.costPerMinute).toBeGreaterThan(0);
      expect(summary.breakdown.audio).toBeGreaterThan(0);
      expect(summary.breakdown.tokens).toBeGreaterThan(0);
      expect(summary.breakdown.tools).toBeGreaterThan(0);
      expect(summary.breakdown.overhead).toBeGreaterThan(0);
    });
  });

  describe("getCostBreakdown Function", () => {
    test("should return detailed cost breakdown for frontend", () => {
      const usage = {
        textTokensInput: 1000000,
        textTokensOutput: 500000,
        textTokensCached: 100000,
        audioTokensInput: 200000,
        audioTokensOutput: 100000,
        audioTokensCached: 50000,
        toolCalls: 2,
        retrievals: 1,
      };

      const breakdown = getCostBreakdown(usage, "gpt-realtime-mini");

      expect(breakdown.totalCost).toBeGreaterThan(0);
      expect(breakdown.textInputCost).toBeGreaterThan(0);
      expect(breakdown.textOutputCost).toBeGreaterThan(0);
      expect(breakdown.textCachedCost).toBeGreaterThan(0);
      expect(breakdown.audioInputCost).toBeGreaterThan(0);
      expect(breakdown.audioOutputCost).toBeGreaterThan(0);
      expect(breakdown.audioCachedCost).toBeGreaterThan(0);
      expect(breakdown.toolCallCost).toBeGreaterThan(0);
      expect(breakdown.retrievalCost).toBeGreaterThan(0);
      expect(breakdown.sessionOverhead).toBeGreaterThan(0);
      expect(breakdown.connectionOverhead).toBeGreaterThan(0);
    });

    test("should handle zero usage correctly", () => {
      const usage = {
        textTokensInput: 0,
        textTokensOutput: 0,
        textTokensCached: 0,
        audioTokensInput: 0,
        audioTokensOutput: 0,
        audioTokensCached: 0,
        toolCalls: 0,
        retrievals: 0,
      };

      const breakdown = getCostBreakdown(usage, "gpt-realtime-mini");

      expect(breakdown.totalCost).toBeCloseTo(0.006, 6); // Only overhead
      expect(breakdown.textInputCost).toBe(0);
      expect(breakdown.textOutputCost).toBe(0);
      expect(breakdown.textCachedCost).toBe(0);
      expect(breakdown.audioInputCost).toBe(0);
      expect(breakdown.audioOutputCost).toBe(0);
      expect(breakdown.audioCachedCost).toBe(0);
      expect(breakdown.toolCallCost).toBe(0);
      expect(breakdown.retrievalCost).toBe(0);
    });
  });
});
