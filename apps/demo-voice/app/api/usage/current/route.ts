import { NextRequest, NextResponse } from "next/server";
import { ConsoleLogger } from "@thrive/realtime-observability";
import { usageTracker } from "@thrive/realtime-usage";
import { quotaManager } from "@thrive/realtime-usage";
import { sessionLimitManager } from "@thrive/realtime-config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "anonymous";
    const sessionId = searchParams.get("sessionId");

    logger.info("Usage current request", { userId, sessionId, correlationId });

    // Get current user usage
    const dailyUsage = await usageTracker.getUserUsage(userId, "day");
    const monthlyUsage = await usageTracker.getUserUsage(userId, "month");

    // Get quota status
    const dailyQuota = await quotaManager.checkQuota(userId, "free", "day");
    const monthlyQuota = await quotaManager.checkQuota(userId, "free", "month");

    // Get session status if sessionId provided
    let sessionStatus = null;
    if (sessionId) {
      sessionStatus = sessionLimitManager.getSessionStatus(sessionId);
    }

    // Calculate cost summary
    const costSummary = {
      daily: {
        totalCost: dailyUsage.totalCost,
        averageCostPerSession: dailyUsage.averageCostPerSession,
        sessions: dailyUsage.totalSessions,
      },
      monthly: {
        totalCost: monthlyUsage.totalCost,
        averageCostPerSession: monthlyUsage.averageCostPerSession,
        sessions: monthlyUsage.totalSessions,
      },
    };

    const response = {
      userId,
      sessionId,
      timestamp: Date.now(),
      usage: {
        daily: dailyUsage,
        monthly: monthlyUsage,
      },
      quota: {
        daily: dailyQuota,
        monthly: monthlyQuota,
      },
      sessionStatus,
      costSummary,
    };

    logger.info("Usage current response prepared", {
      userId,
      sessionId,
      correlationId,
      dailySessions: dailyUsage.totalSessions,
      monthlySessions: monthlyUsage.totalSessions,
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Usage current error", { error: errorMessage, correlationId });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
