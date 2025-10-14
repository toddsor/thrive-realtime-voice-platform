"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Separator } from "./separator";
export function UsageStats({ sessionUsage, quotaStatus, sessionStatus, isLoading = false, error = null, onRefresh, className, }) {
    // Format duration
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };
    // Format cost
    const formatCost = (cost) => {
        if (cost < 0.001) {
            return `$${(cost * 1000).toFixed(2)}m`;
        }
        return `$${cost.toFixed(4)}`;
    };
    // Format quota remaining
    const formatQuotaRemaining = (remaining) => {
        if (remaining <= 0)
            return "0 minutes";
        if (remaining < 60)
            return `${Math.round(remaining)} minutes`;
        const hours = Math.floor(remaining / 60);
        const minutes = Math.round(remaining % 60);
        if (minutes === 0) {
            return `${hours} hour${hours !== 1 ? "s" : ""}`;
        }
        return `${hours}h ${minutes}m`;
    };
    // Get warning color based on quota usage
    const getQuotaColor = (percentUsed) => {
        if (percentUsed >= 90)
            return "destructive";
        if (percentUsed >= 70)
            return "secondary";
        return "default";
    };
    // Get session status color
    const getSessionStatusColor = (status) => {
        if (status.gracePeriodActive)
            return "destructive";
        if (status.percentComplete >= 0.8)
            return "secondary";
        return "default";
    };
    if (isLoading && !sessionUsage) {
        return (<Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>);
    }
    if (error) {
        return (<Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading usage data</p>
            <p className="text-sm">{error}</p>
            {onRefresh && (<Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
                Retry
              </Button>)}
          </div>
        </CardContent>
      </Card>);
    }
    return (<div className={`space-y-4 ${className}`}>
      {/* Current Session Stats */}
      {sessionUsage && (<Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Session
              {onRefresh && (<Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>)}
            </CardTitle>
            <CardDescription>Real-time usage statistics for your current session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(sessionUsage.durationMs)}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{sessionUsage.audioMinutes.toFixed(1)}m</div>
                <div className="text-sm text-gray-600">Audio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{sessionUsage.tokensInput + sessionUsage.tokensOutput}</div>
                <div className="text-sm text-gray-600">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCost(sessionUsage.estimatedCost)}</div>
                <div className="text-sm text-gray-600">Cost</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tool Calls:</span>
                <span className="ml-2 font-medium">{sessionUsage.toolCalls}</span>
              </div>
              <div>
                <span className="text-gray-600">Retrievals:</span>
                <span className="ml-2 font-medium">{sessionUsage.retrievals}</span>
              </div>
              <div>
                <span className="text-gray-600">Cached Tokens:</span>
                <span className="ml-2 font-medium">{sessionUsage.tokensCached}</span>
              </div>
            </div>
          </CardContent>
        </Card>)}

      {/* Session Status */}
      {sessionStatus && (<Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current session limits and warnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Time Remaining</span>
              <Badge variant={getSessionStatusColor(sessionStatus)}>
                {formatDuration(sessionStatus.timeUntilDisconnect)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(sessionStatus.percentComplete * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(sessionStatus.percentComplete * 100, 100)}%` }}/>
              </div>
            </div>

            {sessionStatus.warningsTriggered.length > 0 && (<div className="text-sm text-amber-600">
                ⚠️ Warnings triggered at{" "}
                {sessionStatus.warningsTriggered.map((w) => `${Math.round(w * 100)}%`).join(", ")}
              </div>)}

            {sessionStatus.gracePeriodActive && (<div className="text-sm text-red-600">🚨 Grace period active - session will end soon</div>)}

            {sessionStatus.canExtend && (<Button variant="outline" size="sm" className="w-full">
                Request Extension ({sessionStatus.extensionsUsed}/{sessionStatus.maxExtensions})
              </Button>)}
          </CardContent>
        </Card>)}

      {/* Quota Status */}
      {quotaStatus && (<Card>
          <CardHeader>
            <CardTitle>Quota Status</CardTitle>
            <CardDescription>Your current usage limits and remaining allowances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tier</span>
              <Badge variant="outline">{quotaStatus.tier}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining</span>
              <Badge variant={getQuotaColor(quotaStatus.percentUsed)}>
                {formatQuotaRemaining(quotaStatus.remaining)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{Math.round(quotaStatus.percentUsed)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${quotaStatus.percentUsed >= 90
                ? "bg-red-500"
                : quotaStatus.percentUsed >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"}`} style={{ width: `${Math.min(quotaStatus.percentUsed, 100)}%` }}/>
              </div>
            </div>

            {!quotaStatus.allowed && (<div className="text-sm text-red-600">❌ Quota exceeded - cannot start new sessions</div>)}

            <div className="text-xs text-gray-500">Resets at {new Date(quotaStatus.resetAt).toLocaleString()}</div>
          </CardContent>
        </Card>)}

      {/* Cost Breakdown */}
      {sessionUsage && (<Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Detailed cost analysis for this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Audio Processing:</span>
                <span>{formatCost(sessionUsage.audioMinutes * 0.01)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Input Tokens:</span>
                <span>{formatCost((sessionUsage.tokensInput / 1000) * 0.0005)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Output Tokens:</span>
                <span>{formatCost((sessionUsage.tokensOutput / 1000) * 0.0015)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cached Tokens (50% off):</span>
                <span className="text-green-600">-{formatCost((sessionUsage.tokensCached / 1000) * 0.0005 * 0.5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tool Calls:</span>
                <span>{formatCost(sessionUsage.toolCalls * 0.001)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retrievals:</span>
                <span>{formatCost(sessionUsage.retrievals * 0.002)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Cost:</span>
                <span>{formatCost(sessionUsage.estimatedCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
