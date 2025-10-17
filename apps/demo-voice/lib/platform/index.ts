/**
 * Platform Integration Examples
 *
 * This directory contains examples of how to integrate with the Thrive Realtime Voice Platform.
 * These are reusable patterns that developers can follow when building their own applications.
 */

// Re-export platform utilities for easy access
export {
  calculateUsageCostForDemo as calculateUsageCost,
  calculateTranscriptCost,
  createInitialUsageData,
  updateUsageDataWithCost,
  formatCost,
  getCostBreakdownForDemo as getCostBreakdown,
  type UsageData,
} from "../utils/costCalculation";

export {
  createCustomAgentConfig,
  agentConfigs,
  getAgentConfigForContext,
  validateAgentConfig,
} from "../config/agentConfig";

export {
  initializeToolRegistry,
  executeToolCall,
  getAllToolDefinitions,
  addCustomTool,
  removeTool,
  listAvailableTools,
  getToolStats,
} from "../tools/registry";

export {
  handleWeatherToolCall,
  weatherToolDefinition,
  handleCalendarToolCall,
  calendarToolDefinition,
} from "../tools/weatherTool";
