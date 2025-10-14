"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { DollarSign, Zap } from "lucide-react";
const DEFAULT_MODEL_PRICING = {
    "gpt-realtime": {
        name: "GPT Realtime",
        audioInputTokens: 32.0,
        audioCachedTokens: 0.4,
        audioOutputTokens: 64.0,
        textInputTokens: 4.0,
        textCachedTokens: 0.4,
        textOutputTokens: 16.0,
        description: "Full-featured realtime model",
    },
    "gpt-realtime-mini": {
        name: "GPT Realtime Mini",
        audioInputTokens: 10.0,
        audioCachedTokens: 0.3,
        audioOutputTokens: 20.0,
        textInputTokens: 0.6,
        textCachedTokens: 0.06,
        textOutputTokens: 2.4,
        description: "Lightweight realtime model",
    },
};
export function CostDisplay({ className, currentModel = "gpt-realtime", modelPricing = DEFAULT_MODEL_PRICING, }) {
    const models = Object.entries(modelPricing);
    return (<Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5"/>
          Model Pricing
        </CardTitle>
        <CardDescription>Current pricing for OpenAI Realtime API models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {models.map(([modelKey, pricing]) => (<div key={modelKey} className={`p-4 border rounded-lg ${currentModel === modelKey
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-gray-700"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{pricing.name}</h3>
                  {currentModel === modelKey && (<Badge variant="default" className="text-xs">
                      Current
                    </Badge>)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {pricing.description}
                </Badge>
              </div>

              {/* Detailed Breakdown Table for this model */}
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
                          <Zap className="h-4 w-4 text-blue-500"/>
                          Audio (per 1M tokens)
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        ${pricing.audioInputTokens.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        ${pricing.audioCachedTokens.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        ${pricing.audioOutputTokens.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500"/>
                          Text (per 1M tokens)
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        ${pricing.textInputTokens.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono text-green-600">
                        ${pricing.textCachedTokens.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center font-mono">
                        ${pricing.textOutputTokens.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-gray-500 text-center">
                All pricing is per 1M tokens. Cached tokens provide significant savings for repeated content.
              </div>
            </div>))}

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Costs are calculated based on actual usage during your conversation. Tool calls and
              retrievals may incur additional small charges.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
}
