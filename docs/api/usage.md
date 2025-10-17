# @thrivereflections/realtime-usage

Usage tracking and cost estimation for the Thrive Realtime Voice Platform.

## Overview

This package provides comprehensive usage tracking, cost estimation, quota management, and analytics for OpenAI API usage across the platform.

## Installation

```bash
npm install @thrivereflections/realtime-usage
```

## Main Exports

### Cost Estimation

- **`CostEstimator`** - Main cost estimation class
- **`costEstimator`** - Default cost estimator instance
- **`estimateSessionCost(usage)`** - Estimate cost for a session
- **`formatCost(amount)`** - Format cost for display
- **`getCostSummary(usage)`** - Get detailed cost breakdown
- **`calculateCachingSavings(usage)`** - Calculate caching savings

### Usage Tracking

- **`usageTracker`** - Default usage tracker instance
- **`UsageTracker`** - Usage tracking interface
- **`SessionUsage`** - Session usage data
- **`UserQuota`** - User quota information
- **`QuotaStatus`** - Quota status enumeration
- **`UsageAggregation`** - Usage aggregation data

### Metrics Collection

- **`metricsCollector`** - Default metrics collector instance
- **`MetricsCollector`** - Metrics collection interface
- **`PerformanceMetrics`** - Performance metrics data
- **`MetricsAggregation`** - Aggregated metrics data

### Quota Management

- **`quotaManager`** - Default quota manager instance
- **`QuotaManager`** - Quota management interface
- **`QuotaConfig`** - Quota configuration
- **`UserTier`** - User tier enumeration

### Usage Store

- **`usageStore`** - Default usage store instance
- **`UsageStore`** - Usage store interface

## Usage Example

### Cost Estimation

```typescript
import { CostEstimator, estimateSessionCost, formatCost, getCostSummary } from "@thrivereflections/realtime-usage";

// Estimate session cost
const sessionUsage = {
  inputTokens: 1000,
  outputTokens: 500,
  audioDuration: 30000, // 30 seconds
  toolCalls: 3,
};

const cost = estimateSessionCost(sessionUsage);
console.log(cost); // { total: 0.0025, breakdown: {...} }

// Format cost for display
const formatted = formatCost(0.0025);
console.log(formatted); // "$0.0025"

// Get detailed cost breakdown
const summary = getCostSummary(sessionUsage);
console.log(summary);
// {
//   total: 0.0025,
//   inputTokens: 0.0015,
//   outputTokens: 0.00075,
//   audio: 0.00015,
//   tools: 0.0001
// }
```

### Usage Tracking

```typescript
import { usageTracker } from "@thrivereflections/realtime-usage";

// Track session usage
const sessionId = "session-123";
const userId = "user-456";

await usageTracker.trackSessionStart(sessionId, userId);

// Track token usage
await usageTracker.trackTokens(sessionId, {
  input: 1000,
  output: 500,
  total: 1500,
});

// Track audio usage
await usageTracker.trackAudio(sessionId, {
  duration: 30000,
  bytes: 240000,
});

// Track tool usage
await usageTracker.trackToolCall(sessionId, {
  toolName: "echo",
  inputTokens: 50,
  outputTokens: 25,
});

// Get session usage
const usage = await usageTracker.getSessionUsage(sessionId);
console.log(usage);
// {
//   sessionId: "session-123",
//   userId: "user-456",
//   startTime: Date,
//   endTime: Date,
//   totalTokens: 1500,
//   audioDuration: 30000,
//   toolCalls: 1,
//   cost: 0.0025
// }
```

### Quota Management

```typescript
import { quotaManager } from "@thrivereflections/realtime-usage";

// Check user quota
const quotaStatus = await quotaManager.checkQuota("user-456");
console.log(quotaStatus);
// {
//   allowed: true,
//   remaining: 9500,
//   resetTime: Date,
//   tier: "premium"
// }

// Get user quota
const quota = await quotaManager.getUserQuota("user-456");
console.log(quota);
// {
//   userId: "user-456",
//   tier: "premium",
//   dailyLimit: 10000,
//   monthlyLimit: 300000,
//   used: 500,
//   remaining: 9500
// }

// Update quota usage
await quotaManager.updateUsage("user-456", {
  tokens: 1500,
  cost: 0.0025,
});
```

### Metrics Collection

```typescript
import { metricsCollector } from "@thrivereflections/realtime-usage";

// Record performance metrics
await metricsCollector.recordMetric("session_duration", {
  value: 30000,
  unit: "milliseconds",
  tags: { userId: "user-456", tier: "premium" },
});

// Record cost metrics
await metricsCollector.recordMetric("session_cost", {
  value: 0.0025,
  unit: "USD",
  tags: { userId: "user-456", model: "gpt-4" },
});

// Get aggregated metrics
const metrics = await metricsCollector.getAggregatedMetrics({
  timeRange: "24h",
  groupBy: ["userId", "tier"],
});
console.log(metrics);
// {
//   totalSessions: 150,
//   totalCost: 12.50,
//   averageSessionDuration: 45000,
//   byTier: { free: 50, premium: 100 }
// }
```

## Configuration

### Cost Rates

```typescript
interface CostRates {
  inputTokens: number; // Cost per input token
  outputTokens: number; // Cost per output token
  audio: number; // Cost per second of audio
  tools: number; // Cost per tool call
}
```

### Quota Configuration

```typescript
interface QuotaConfig {
  tiers: {
    [tier: string]: {
      dailyLimit: number;
      monthlyLimit: number;
      maxSessionDuration: number;
      maxToolCalls: number;
    };
  };
}
```

### Usage Tracking Configuration

```typescript
interface UsageTrackingConfig {
  enableRealTime: boolean;
  enableAggregation: boolean;
  aggregationInterval: number;
  retentionPeriod: number;
}
```

## Predefined Configurations

### User Tiers

- **`FREE`** - Basic tier with limited usage
- **`PREMIUM`** - Enhanced tier with higher limits
- **`ENTERPRISE`** - Enterprise tier with unlimited usage

### Cost Rates (OpenAI GPT-4)

- **Input Tokens**: $0.03 per 1K tokens
- **Output Tokens**: $0.06 per 1K tokens
- **Audio**: $0.015 per minute
- **Tools**: $0.01 per tool call

## Key Features

### Real-time Cost Tracking

- **Live Updates** - Real-time cost calculation during sessions
- **Detailed Breakdown** - Token, audio, and tool usage tracking
- **Caching Savings** - Calculate savings from response caching

### Quota Management

- **Multi-tier Support** - Different limits for different user tiers
- **Real-time Enforcement** - Check quotas before allowing operations
- **Usage Analytics** - Track usage patterns and trends

### Performance Metrics

- **Session Metrics** - Duration, token usage, cost per session
- **User Metrics** - Usage patterns by user and tier
- **System Metrics** - Overall platform usage and performance

### Analytics and Reporting

- **Usage Reports** - Detailed usage reports by time period
- **Cost Analysis** - Cost breakdown and optimization insights
- **Trend Analysis** - Usage trends and forecasting

## Integration

### With Core Runtime

```typescript
import { initRealtime } from "@thrivereflections/realtime-core";
import { usageTracker } from "@thrivereflections/realtime-usage";

const realtime = initRealtime(config, {
  getToken: () => fetchToken(),
  transportFactory: createTransport,
  onEvent: (event) => {
    // Track usage based on events
    if (event.type === "response.done") {
      usageTracker.trackTokens(sessionId, event.usage);
    }
  },
});
```

### With API Routes

```typescript
import { quotaManager } from "@thrivereflections/realtime-usage";

export async function POST(request: Request) {
  const userId = getUserId(request);

  // Check quota before processing
  const quotaStatus = await quotaManager.checkQuota(userId);
  if (!quotaStatus.allowed) {
    return new Response("Quota exceeded", { status: 429 });
  }

  // Process request
}
```

## Dependencies

- `@thrivereflections/realtime-contracts` - Shared type definitions
- `@thrivereflections/realtime-observability` - Logging interface

## Related Documentation

- [Core Runtime](./core.md) - Uses usage tracking
- [SRE](./sre.md) - Uses usage for monitoring
- [Package README](../../packages/usage/README.md) - Detailed package documentation
