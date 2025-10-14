import { NextRequest, NextResponse } from "next/server";
import { ConsoleLogger } from "@thrive/realtime-observability";
import { alertManager } from "@thrive/realtime-sre";
import { registerAllAlertRules } from "@thrive/realtime-sre";

export const runtime = "nodejs";

// Initialize alert rules on startup
registerAllAlertRules(alertManager);

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const body = await request.json();
    const { action, alertId, acknowledgedBy, data } = body;

    logger.info("Alert webhook received", { action, alertId, correlationId });

    switch (action) {
      case "acknowledge":
        if (!alertId || !acknowledgedBy) {
          return NextResponse.json({ error: "Missing alertId or acknowledgedBy" }, { status: 400 });
        }

        const acknowledged = alertManager.acknowledgeAlert(alertId, acknowledgedBy);
        if (!acknowledged) {
          return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, alertId });

      case "resolve":
        if (!alertId) {
          return NextResponse.json({ error: "Missing alertId" }, { status: 400 });
        }

        const resolved = alertManager.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, alertId });

      case "create":
        if (!data || !data.ruleId) {
          return NextResponse.json({ error: "Missing data or ruleId" }, { status: 400 });
        }

        const alert = alertManager.createAlert(data.ruleId, data, data.customMessage);
        if (!alert) {
          return NextResponse.json({ error: "Failed to create alert" }, { status: 400 });
        }

        return NextResponse.json({ success: true, alert });

      case "get_stats":
        const stats = alertManager.getAlertStats();
        return NextResponse.json({ success: true, stats });

      case "get_active":
        const activeAlerts = alertManager.getActiveAlerts();
        return NextResponse.json({ success: true, alerts: activeAlerts });

      case "get_recent":
        const since = data?.since || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
        const recentAlerts = alertManager.getRecentAlerts(since);
        return NextResponse.json({ success: true, alerts: recentAlerts });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Alert webhook error", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "get_active";

    logger.info("Alert webhook GET request", { action, correlationId });

    switch (action) {
      case "stats":
        const stats = alertManager.getAlertStats();
        return NextResponse.json({ success: true, stats });

      case "active":
        const activeAlerts = alertManager.getActiveAlerts();
        return NextResponse.json({ success: true, alerts: activeAlerts });

      case "recent":
        const since = parseInt(searchParams.get("since") || "0");
        const recentAlerts = alertManager.getRecentAlerts(since);
        return NextResponse.json({ success: true, alerts: recentAlerts });

      case "rules":
        const rules = alertManager.getAllRules();
        return NextResponse.json({ success: true, rules });

      case "health":
        const healthStats = alertManager.getAlertStats();
        const isHealthy = healthStats.bySeverity.critical === 0;
        return NextResponse.json({
          success: true,
          healthy: isHealthy,
          stats: healthStats,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Alert webhook GET error", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
