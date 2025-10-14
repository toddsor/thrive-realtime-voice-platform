'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, Clock } from 'lucide-react';

interface CostDisplayProps {
  className?: string;
}

const MODEL_PRICING = {
  'gpt-realtime': {
    name: 'GPT Realtime',
    audioInputTokens: 32.00,
    audioCachedTokens: 0.40,
    audioOutputTokens: 64.00,
    textInputTokens: 4.00,
    textCachedTokens: 0.40,
    textOutputTokens: 16.00,
    description: 'Full-featured realtime model'
  },
  'gpt-realtime-mini': {
    name: 'GPT Realtime Mini',
    audioInputTokens: 10.00,
    audioCachedTokens: 0.30,
    audioOutputTokens: 20.00,
    textInputTokens: 0.60,
    textCachedTokens: 0.06,
    textOutputTokens: 2.40,
    description: 'Lightweight realtime model'
  }
};

export function CostDisplay({ className }: CostDisplayProps) {
  const [currentModel, setCurrentModel] = useState<string>('gpt-realtime');
  const models = Object.entries(MODEL_PRICING);

  useEffect(() => {
    // Fetch the current model from the API
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Model Pricing
        </CardTitle>
        <CardDescription>
          Current pricing for OpenAI Realtime API models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {models.map(([modelKey, pricing]) => (
            <div 
              key={modelKey}
              className={`p-4 border rounded-lg ${
                currentModel === modelKey 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{pricing.name}</h3>
                  {currentModel === modelKey && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
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
                          <DollarSign className="h-4 w-4 text-purple-500" />
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
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Costs are calculated based on actual usage during your conversation. 
              Tool calls and retrievals may incur additional small charges.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
