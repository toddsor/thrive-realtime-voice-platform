import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { sessionId, authUserId, config, timings, consent } = await request.json();

    if (!sessionId || !config || !timings || !consent) {
      logger.warn("Missing required fields", { sessionId });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    logger.info("Session persistence requested", { sessionId, consent, authUserId });

    // Use the platform's store interface for session creation
    await demoStore.saveSessionMeta(
      sessionId,
      authUserId ? { appUserId: authUserId, authUserId } : null,
      config,
      timings,
      consent
    );

    logger.info("Session created successfully", { sessionId, consent });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Session persistence failed", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
