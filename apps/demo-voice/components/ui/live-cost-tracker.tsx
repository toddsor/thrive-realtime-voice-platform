'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, Clock, Activity, TrendingUp } from 'lucide-react';

interface UsageData {
  sessionId: string;
  startTime: number;
  durationMs: number;
  audioMinutes: number;
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  // Detailed token breakdown
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

interface LiveCostTrackerProps {
  usageData: UsageData | null;
  isActive?: boolean;
  className?: string;
}

interface LiveUsage {
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  // Detailed token breakdown
  textTokensInput: number;
  audioTokensInput: number;
  textTokensOutput: number;
  audioTokensOutput: number;
  textTokensCached: number;
  audioTokensCached: number;
  audioMinutes: number;
  toolCalls: number;
  retrievals: number;
  durationMs: number;
  estimatedCost: number;
}

interface CostBreakdown {
  audioCost: number;
  inputTokenCost: number;
  outputTokenCost: number;
  cachedTokenDiscount: number;
  toolCallCost: number;
  retrievalCost: number;
  totalCost: number;
}

// Model-specific pricing
const MODEL_PRICING = {
  'gpt-realtime': {
    textInputTokenPer1k: 0.004, // $4.00 per 1M tokens
    textOutputTokenPer1k: 0.016, // $16.00 per 1M tokens
    textCachedTokenPer1k: 0.0004, // $0.40 per 1M tokens
    audioInputTokenPer1k: 0.032, // $32.00 per 1M tokens
    audioOutputTokenPer1k: 0.064, // $64.00 per 1M tokens
    audioCachedTokenPer1k: 0.0004, // $0.40 per 1M tokens
  },
  'gpt-realtime-mini': {
    textInputTokenPer1k: 0.0006, // $0.60 per 1M tokens
    textOutputTokenPer1k: 0.0024, // $2.40 per 1M tokens
    textCachedTokenPer1k: 0.00006, // $0.06 per 1M tokens
    audioInputTokenPer1k: 0.01, // $10.00 per 1M tokens
    audioOutputTokenPer1k: 0.02, // $20.00 per 1M tokens
    audioCachedTokenPer1k: 0.0003, // $0.30 per 1M tokens
  }
};

const OTHER_COSTS = {
  toolCallOverhead: 0.001, // $0.001 per tool call
  retrievalOverhead: 0.002, // $0.002 per retrieval
  sessionOverhead: 0.005, // $0.005 per session
  connectionOverhead: 0.001 // $0.001 per connection
};

export function LiveCostTracker({ 
  usageData, 
  isActive = false, 
  className 
}: LiveCostTrackerProps) {
  const [currentModel, setCurrentModel] = useState<string>('gpt-realtime');
  // Convert usageData to LiveUsage format
  const liveUsage: LiveUsage = usageData ? {
    tokensInput: usageData.tokensInput,
    tokensOutput: usageData.tokensOutput,
    tokensCached: usageData.tokensCached,
    textTokensInput: usageData.textTokensInput,
    audioTokensInput: usageData.audioTokensInput,
    textTokensOutput: usageData.textTokensOutput,
    audioTokensOutput: usageData.audioTokensOutput,
    textTokensCached: usageData.textTokensCached,
    audioTokensCached: usageData.audioTokensCached,
    audioMinutes: usageData.audioMinutes,
    toolCalls: usageData.toolCalls,
    retrievals: usageData.retrievals,
    durationMs: usageData.durationMs,
    estimatedCost: usageData.estimatedCost
  } : {
    tokensInput: 0,
    tokensOutput: 0,
    tokensCached: 0,
    textTokensInput: 0,
    audioTokensInput: 0,
    textTokensOutput: 0,
    audioTokensOutput: 0,
    textTokensCached: 0,
    audioTokensCached: 0,
    audioMinutes: 0,
    toolCalls: 0,
    retrievals: 0,
    durationMs: 0,
    estimatedCost: 0
  };

  // Fetch current model
  useEffect(() => {
    fetch('/api/config/model')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setCurrentModel(data.model);
      })
      .catch(err => {
        console.error('Failed to fetch model:', err);
        // Set a fallback for display purposes, but the error will be visible in console
        setCurrentModel('unknown');
      });
  }, []);

  // No need to fetch data - it comes from props

  // Calculate cost breakdown
  const calculateCostBreakdown = (): CostBreakdown => {
    const pricing = MODEL_PRICING[currentModel as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-realtime-mini'];
    
    // Calculate text input tokens (total text input - text cached)
    const textInputTokens = Math.max(0, liveUsage.textTokensInput - liveUsage.textTokensCached);
    const textInputCost = (textInputTokens / 1000) * pricing.textInputTokenPer1k;
    
    // Calculate text cached tokens as a separate cost (not discount)
    const textCachedTokenCost = (liveUsage.textTokensCached / 1000) * pricing.textCachedTokenPer1k;
    
    // Calculate text output tokens
    const textOutputTokenCost = (liveUsage.textTokensOutput / 1000) * pricing.textOutputTokenPer1k;
    
    // Calculate audio input tokens (total audio input - audio cached)
    const audioInputTokens = Math.max(0, liveUsage.audioTokensInput - liveUsage.audioTokensCached);
    const audioInputCost = (audioInputTokens / 1000) * pricing.audioInputTokenPer1k;
    
    // Calculate audio cached tokens as a separate cost (not discount)
    const audioCachedTokenCost = (liveUsage.audioTokensCached / 1000) * pricing.audioCachedTokenPer1k;
    
    // Calculate audio output tokens
    const audioOutputTokenCost = (liveUsage.audioTokensOutput / 1000) * pricing.audioOutputTokenPer1k;
    
    const toolCallCost = liveUsage.toolCalls * OTHER_COSTS.toolCallOverhead;
    const retrievalCost = liveUsage.retrievals * OTHER_COSTS.retrievalOverhead;
    
    const totalCost = textInputCost + textCachedTokenCost + textOutputTokenCost + 
                     audioInputCost + audioCachedTokenCost + audioOutputTokenCost + 
                     toolCallCost + retrievalCost;

    return {
      audioCost: audioInputCost + audioCachedTokenCost + audioOutputTokenCost,
      inputTokenCost: textInputCost,
      outputTokenCost: textOutputTokenCost,
      cachedTokenDiscount: textCachedTokenCost, // Now showing as cost, not discount
      toolCallCost,
      retrievalCost,
      totalCost
    };
  };

  const costBreakdown = calculateCostBreakdown();
  const pricing = MODEL_PRICING[currentModel as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-realtime-mini'];

  // Format cost
  const formatCost = (cost: number): string => {
    if (cost < 0.001) {
      return `$${(cost * 1000).toFixed(2)}m`;
    }
    return `$${cost.toFixed(4)}`;
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!usageData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Start a conversation to see live costs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Live Cost Tracking
        </CardTitle>
        <CardDescription>
          Real-time cost breakdown for your current conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {/* Current Usage Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCost(costBreakdown.totalCost)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatDuration(liveUsage.durationMs)}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {liveUsage.tokensInput + liveUsage.tokensOutput + liveUsage.tokensCached}
                </div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {liveUsage.tokensCached}
                </div>
                <div className="text-sm text-muted-foreground">Cached Tokens</div>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Cost Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold">Type</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Input</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Cached</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          Audio (per 1M tokens)
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {formatCost((Math.max(0, liveUsage.audioTokensInput - liveUsage.audioTokensCached) / 1000) * pricing.audioInputTokenPer1k)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        {liveUsage.audioTokensCached > 0 ? formatCost((liveUsage.audioTokensCached / 1000) * pricing.audioCachedTokenPer1k) : '$0.00'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {formatCost((liveUsage.audioTokensOutput / 1000) * pricing.audioOutputTokenPer1k)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          Text (per 1M tokens)
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {formatCost(costBreakdown.inputTokenCost)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        {liveUsage.textTokensCached > 0 ? formatCost(costBreakdown.cachedTokenDiscount) : '$0.00'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {formatCost(costBreakdown.outputTokenCost)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Token Count Table */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Token Usage</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold">Type</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Input</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Cached</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          Audio Tokens
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {Math.max(0, liveUsage.audioTokensInput - liveUsage.audioTokensCached)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        {liveUsage.audioTokensCached}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {liveUsage.audioTokensOutput}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          Text Tokens
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {Math.max(0, liveUsage.textTokensInput - liveUsage.textTokensCached)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        {liveUsage.textTokensCached}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        {liveUsage.textTokensOutput}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Additional Costs */}
            {(liveUsage.toolCalls > 0 || liveUsage.retrievals > 0) && (
              <div className="mt-4 space-y-2 text-sm">
                <h4 className="font-semibold text-sm">Additional Costs</h4>
                {liveUsage.toolCalls > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tool Calls ({liveUsage.toolCalls}):</span>
                    <span>{formatCost(costBreakdown.toolCallCost)}</span>
                  </div>
                )}
                {liveUsage.retrievals > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retrievals ({liveUsage.retrievals}):</span>
                    <span>{formatCost(costBreakdown.retrievalCost)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Model Info */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Using: {currentModel}</span>
                <span>Updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}

