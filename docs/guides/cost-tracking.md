# Cost Tracking Guide

A comprehensive guide for implementing cost tracking and usage analytics in the Thrive Realtime Voice Platform.

## Overview

The platform provides centralized cost calculation utilities and usage tracking patterns to help you monitor and manage costs effectively across different models and usage patterns.

## Installation

```bash
npm install @thrivereflections/realtime-usage
```

## Cost Calculation Utilities

### Basic Usage

```typescript
import {
  calculateUsageCost,
  calculateTranscriptCost,
  createInitialUsageData,
  updateUsageDataWithCost,
  formatCost,
  getCostBreakdown,
  type UsageData,
} from "@/lib/utils/costCalculation";

// Create initial usage data
const usageData = createInitialUsageData("session-123");

// Calculate cost for a transcript
const transcriptCost = calculateTranscriptCost("Hello, how can I help you?", "user", "final");

// Get model from runtime configuration
const runtimeConfig = await fetch("/api/config/runtime").then((res) => res.json());
const model = runtimeConfig.model;

// Update usage data with new information
const updatedUsage = updateUsageDataWithCost(
  usageData,
  {
    tokensInput: 50,
    tokensOutput: 100,
    audioMinutes: 2.5,
    toolCalls: 3,
  },
  model
);

console.log(updatedUsage.estimatedCost); // 0.0024
```

### Model-Specific Pricing

The utilities support different pricing models:

```typescript
// Get model from runtime configuration
const runtimeConfig = await fetch("/api/config/runtime").then((res) => res.json());
const model = runtimeConfig.model;

// Calculate cost using the configured model
const cost = calculateUsageCost(usageData, model);
```

### Cost Breakdown

Get detailed cost breakdown for analysis:

```typescript
// Get model from runtime configuration
const runtimeConfig = await fetch("/api/config/runtime").then((res) => res.json());
const model = runtimeConfig.model;

const breakdown = getCostBreakdown(usageData, model);
console.log(breakdown);
// {
//   textInputCost: 0.0003,
//   textOutputCost: 0.0006,
//   audioInputCost: 0.001,
//   audioOutputCost: 0.002,
//   toolCallCost: 0.003,
//   totalCost: 0.0069
// }
```

## Usage Data Interface

```typescript
interface UsageData {
  sessionId: string;
  startTime: number;
  durationMs: number;
  audioMinutes: number;
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  textTokensInput: number;
  audioTokensInput: number;
  textTokensOutput: number;
  audioTokensOutput: number;
  textTokensCached: number;
  audioTokensCached: number;
  toolCalls: number;
  retrievals: number;
  estimatedCost: number;
}
```

## Integration Patterns

### With React Hooks

```typescript
import { useState, useCallback, useEffect } from "react";
import { createInitialUsageData, updateUsageDataWithCost, calculateUsageCost } from "@/lib/utils/costCalculation";

export function useCostTracking(sessionId: string) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [model, setModel] = useState<string>("gpt-realtime-mini");

  // Fetch model from runtime config
  useEffect(() => {
    fetch("/api/config/runtime")
      .then((res) => res.json())
      .then((config) => setModel(config.model))
      .catch(console.error);
  }, []);

  const updateUsage = useCallback(
    (updates: Partial<UsageData>) => {
      setUsageData((prev) => {
        if (!prev) return null;
        return updateUsageDataWithCost(prev, updates, model as "gpt-realtime" | "gpt-realtime-mini");
      });
    },
    [model]
  );

  const initializeUsage = useCallback(() => {
    const initial = createInitialUsageData(sessionId);
    setUsageData({ ...initial, estimatedCost: 0 });
  }, [sessionId]);

  return {
    usageData,
    updateUsage,
    initializeUsage,
    formatCost: (cost: number) => formatCost(cost),
  };
}
```

### With Realtime Events

```typescript
import { RealtimeEventRouter } from "@thrivereflections/realtime-core";
import { calculateTranscriptCost } from "@/lib/utils/costCalculation";

const router = new RealtimeEventRouter({
  onTranscript: (transcript) => {
    if (transcript.type === "final") {
      const cost = calculateTranscriptCost(transcript.text, transcript.role, transcript.type);

      // Update usage tracking
      updateUsageData({
        tokensInput: transcript.role === "user" ? estimatedTokens : 0,
        tokensOutput: transcript.role === "assistant" ? estimatedTokens : 0,
        estimatedCost: cost,
      });
    }
  },

  onUsageUpdate: (usage) => {
    updateUsageData({
      tokensInput: usage.input_tokens || 0,
      tokensOutput: usage.output_tokens || 0,
      tokensCached: usage.cached_tokens || 0,
    });
  },
});
```

### With API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { calculateUsageCost } from "@/lib/utils/costCalculation";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";

export async function POST(request: NextRequest) {
  const { sessionId, usageData } = await request.json();

  // Get model from runtime configuration
  const runtimeConfig = loadRuntimeConfig();
  const model = runtimeConfig.model;

  // Calculate final cost
  const finalCost = calculateUsageCost(usageData, model);

  // Store cost data
  await store.updateSessionCost(sessionId, finalCost);

  return NextResponse.json({
    sessionId,
    finalCost: formatCost(finalCost),
  });
}
```

## Cost Display Components

### Basic Cost Display

```typescript
import { formatCost, getCostBreakdown } from "@/lib/utils/costCalculation";

export function CostDisplay({ usageData, model }: { usageData: UsageData; model: string }) {
  const breakdown = getCostBreakdown(usageData, model as "gpt-realtime" | "gpt-realtime-mini");

  return (
    <div className="cost-display">
      <div className="total-cost">Total: {formatCost(usageData.estimatedCost)}</div>
      <div className="breakdown">
        <div>Text Input: {formatCost(breakdown.textInputCost)}</div>
        <div>Text Output: {formatCost(breakdown.textOutputCost)}</div>
        <div>Audio Input: {formatCost(breakdown.audioInputCost)}</div>
        <div>Audio Output: {formatCost(breakdown.audioOutputCost)}</div>
        <div>Tool Calls: {formatCost(breakdown.toolCallCost)}</div>
      </div>
    </div>
  );
}
```

### Live Cost Tracker

```typescript
import { useState, useEffect } from "react";
import { useCostTracking } from "@/hooks/useCostTracking";

export function LiveCostTracker({ sessionId }: { sessionId: string }) {
  const { usageData, updateUsage } = useCostTracking(sessionId);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (usageData) {
      setIsVisible(true);
    }
  }, [usageData]);

  if (!isVisible || !usageData) return null;

  return (
    <div className="live-cost-tracker">
      <div className="cost-indicator">💰 {formatCost(usageData.estimatedCost)}</div>
      <div className="usage-stats">
        <div>Duration: {Math.round(usageData.audioMinutes)}m</div>
        <div>Tokens: {usageData.tokensInput + usageData.tokensOutput}</div>
        <div>Tools: {usageData.toolCalls}</div>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Initialize Early

Always initialize usage tracking when a session starts:

```typescript
const handleConnect = async () => {
  // Initialize usage tracking
  const initialUsage = createInitialUsageData(sessionId);
  setUsageData({ ...initialUsage, estimatedCost: 0 });

  // Start voice connection
  await connect(agentConfig);
};
```

### 2. Update Incrementally

Update usage data as events occur rather than recalculating everything:

```typescript
// Good: Incremental updates
onTranscript: (transcript) => {
  updateUsageData({
    tokensInput: transcript.role === "user" ? estimatedTokens : 0,
    tokensOutput: transcript.role === "assistant" ? estimatedTokens : 0,
  });
},

// Avoid: Recalculating entire usage
onTranscript: (transcript) => {
  const newUsage = calculateEntireUsage(allTranscripts); // Expensive!
  setUsageData(newUsage);
},
```

### 3. Use Appropriate Models

Choose the right model for your use case:

```typescript
// Get model from runtime configuration
const runtimeConfig = await fetch("/api/config/runtime").then((res) => res.json());
const model = runtimeConfig.model;

// Calculate cost using the configured model
const cost = calculateUsageCost(usageData, model);
```

### 4. Monitor Trends

Track cost trends over time:

```typescript
const [costHistory, setCostHistory] = useState<number[]>([]);

useEffect(() => {
  if (usageData) {
    setCostHistory((prev) => [...prev, usageData.estimatedCost]);
  }
}, [usageData]);

// Calculate average cost per session
const avgCost = costHistory.reduce((a, b) => a + b, 0) / costHistory.length;
```

## Configuration

### Environment Variables

```env
# Cost tracking configuration
COST_TRACKING_ENABLED=true
DEFAULT_MODEL=gpt-realtime-mini
COST_ALERT_THRESHOLD=0.10
COST_ALERT_EMAIL=admin@example.com
```

### Cost Limits

```typescript
const COST_LIMITS = {
  perSession: 0.5, // $0.50 per session
  perHour: 5.0, // $5.00 per hour
  perDay: 50.0, // $50.00 per day
};

const checkCostLimit = (usageData: UsageData) => {
  if (usageData.estimatedCost > COST_LIMITS.perSession) {
    throw new Error("Session cost limit exceeded");
  }
};
```

## Troubleshooting

### Common Issues

1. **Cost not updating**: Ensure you're calling `updateUsageDataWithCost` with the correct model
2. **Inaccurate costs**: Verify token counting is correct for your model
3. **Performance issues**: Use incremental updates instead of full recalculations

### Debug Mode

```typescript
const DEBUG_COST = process.env.NODE_ENV === "development";

if (DEBUG_COST) {
  // Get model from runtime configuration
  const runtimeConfig = await fetch("/api/config/runtime").then((res) => res.json());
  const model = runtimeConfig.model;

  console.log("Usage update:", {
    sessionId: usageData.sessionId,
    cost: usageData.estimatedCost,
    breakdown: getCostBreakdown(usageData, model as "gpt-realtime" | "gpt-realtime-mini"),
  });
}
```

## Related Documentation

- [Usage Package API](../api/usage.md) - Detailed API reference
- [Demo App Cost Implementation](../../apps/demo-voice/lib/utils/costCalculation.ts) - Complete implementation
- [Platform Architecture](../architecture/packages.md) - Understanding the platform structure
