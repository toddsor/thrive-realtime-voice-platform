"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { DollarSign, Zap, Activity, TrendingUp } from "lucide-react";
import { getCostBreakdown } from "@thrivereflections/realtime-usage";
import { formatCost } from "../../lib/utils/costCalculation";

export interface UsageData {
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

export interface LiveCostTrackerProps {
  usageData: UsageData | null;
  isActive?: boolean;
  className?: string;
  currentModel?: string;
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

// Remove the local cost calculation interfaces and constants
// We'll use the centralized cost calculation from the usage package

export function LiveCostTracker({
  usageData,
  isActive = false,
  className,
  currentModel = "gpt-realtime-mini",
}: LiveCostTrackerProps) {
  // Convert usageData to LiveUsage format
  const liveUsage: LiveUsage = usageData
    ? {
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
        estimatedCost: usageData.estimatedCost,
      }
    : {
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
        estimatedCost: 0,
      };

  // Use centralized cost calculation from the usage package
  const costBreakdown = usageData
    ? getCostBreakdown(
        {
          textTokensInput: liveUsage.textTokensInput,
          textTokensOutput: liveUsage.textTokensOutput,
          textTokensCached: liveUsage.textTokensCached,
          audioTokensInput: liveUsage.audioTokensInput,
          audioTokensOutput: liveUsage.audioTokensOutput,
          audioTokensCached: liveUsage.audioTokensCached,
          toolCalls: liveUsage.toolCalls,
          retrievals: liveUsage.retrievals,
        },
        currentModel as "gpt-realtime" | "gpt-realtime-mini"
      )
    : {
        textInputCost: 0,
        textOutputCost: 0,
        textCachedCost: 0,
        audioInputCost: 0,
        audioOutputCost: 0,
        audioCachedCost: 0,
        toolCallCost: 0,
        retrievalCost: 0,
        sessionOverhead: 0,
        connectionOverhead: 0,
        totalCost: 0,
      };

  // Use centralized cost formatting from config package
  // formatCost is already imported from @thrivereflections/realtime-config

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
        <CardDescription>Real-time cost breakdown for your current conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Usage Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCost(costBreakdown.totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(liveUsage.durationMs)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Cost Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                      Type
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Input
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Cached
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Output
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        Audio
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                      {formatCost(costBreakdown.audioInputCost)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                      {liveUsage.audioTokensCached > 0 ? formatCost(costBreakdown.audioCachedCost) : "$0.00"}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                      {formatCost(costBreakdown.audioOutputCost)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-500" />
                        Text
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                      {formatCost(costBreakdown.textInputCost)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                      {liveUsage.textTokensCached > 0 ? formatCost(costBreakdown.textCachedCost) : "$0.00"}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                      {formatCost(costBreakdown.textOutputCost)}
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
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                      Type
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Input
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Cached
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-semibold">
                      Output
                    </th>
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
