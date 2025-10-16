import { NextRequest, NextResponse } from "next/server";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { usageStore } from "@thrivereflections/realtime-usage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "anonymous";
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const period = (searchParams.get("period") as "hour" | "day" | "week" | "month") || "day";
    const format = (searchParams.get("format") as "json" | "csv") || "json";

    logger.info("Usage history request", {
      userId,
      startTime,
      endTime,
      period,
      format,
      correlationId,
    });

    // Parse time range
    const now = Date.now();
    const start = startTime ? parseInt(startTime) : now - 24 * 60 * 60 * 1000; // Default to 24 hours ago
    const end = endTime ? parseInt(endTime) : now;

    // Get aggregated metrics
    const aggregatedMetrics = await usageStore.getAggregatedMetrics(period, start, end);

    // Get detailed usage data
    const usageData = await usageStore.queryUsage({
      userId,
      startTime: start,
      endTime: end,
    });

    // Get cost summary (convert period to day/month for cost summary)
    const costPeriod = period === "hour" || period === "week" ? "day" : (period as "day" | "month");
    const costSummary = await usageStore.getUserCostSummary(userId, costPeriod);

    const response = {
      userId,
      period,
      startTime: start,
      endTime: end,
      timestamp: now,
      aggregated: aggregatedMetrics,
      usage: usageData,
      costSummary,
    };

    logger.info("Usage history response prepared", {
      userId,
      period,
      correlationId,
      totalSessions: aggregatedMetrics.totalSessions,
      totalCost: aggregatedMetrics.totalCost,
    });

    if (format === "csv") {
      // Export as CSV
      const csvData = await usageStore.exportUsageData(
        usageData.map((u) => u.sessionId),
        "csv"
      );

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="usage-history-${userId}-${period}.csv"`,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Usage history error", { error: errorMessage, correlationId });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
