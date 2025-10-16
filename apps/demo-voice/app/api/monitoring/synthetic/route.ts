import { NextRequest, NextResponse } from "next/server";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { syntheticMonitoring } from "@thrivereflections/realtime-sre";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    logger.info("Synthetic monitoring request", { action, correlationId });

    switch (action) {
      case "status":
        const healthSummary = syntheticMonitoring.getHealthSummary();
        return NextResponse.json({
          success: true,
          ...healthSummary,
          timestamp: Date.now(),
        });

      case "results":
        const results = syntheticMonitoring.getAllResults();
        return NextResponse.json({
          success: true,
          results,
          timestamp: Date.now(),
        });

      case "checks":
        const checks = syntheticMonitoring.getAllChecks();
        return NextResponse.json({
          success: true,
          checks,
          timestamp: Date.now(),
        });

      case "run":
        const checkName = searchParams.get("check");
        if (!checkName) {
          return NextResponse.json({ error: "Missing check name" }, { status: 400 });
        }

        const result = await syntheticMonitoring.runCheck(checkName);
        return NextResponse.json({
          success: true,
          result,
          timestamp: Date.now(),
        });

      case "start":
        syntheticMonitoring.startAll();
        return NextResponse.json({
          success: true,
          message: "All synthetic checks started",
          timestamp: Date.now(),
        });

      case "stop":
        syntheticMonitoring.stopAll();
        return NextResponse.json({
          success: true,
          message: "All synthetic checks stopped",
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Synthetic monitoring error", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const body = await request.json();
    const { action, checkName, check } = body;

    logger.info("Synthetic monitoring POST request", { action, checkName, correlationId });

    switch (action) {
      case "add_check":
        if (!check) {
          return NextResponse.json({ error: "Missing check configuration" }, { status: 400 });
        }

        syntheticMonitoring.addCheck(check);
        return NextResponse.json({
          success: true,
          message: "Check added successfully",
          checkName: check.name,
        });

      case "run_check":
        if (!checkName) {
          return NextResponse.json({ error: "Missing check name" }, { status: 400 });
        }

        const result = await syntheticMonitoring.runCheck(checkName);
        return NextResponse.json({
          success: true,
          result,
        });

      case "start_check":
        if (!checkName) {
          return NextResponse.json({ error: "Missing check name" }, { status: 400 });
        }

        syntheticMonitoring.startCheck(checkName);
        return NextResponse.json({
          success: true,
          message: `Check ${checkName} started`,
        });

      case "stop_check":
        if (!checkName) {
          return NextResponse.json({ error: "Missing check name" }, { status: 400 });
        }

        syntheticMonitoring.stopCheck(checkName);
        return NextResponse.json({
          success: true,
          message: `Check ${checkName} stopped`,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Synthetic monitoring POST error", {
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
