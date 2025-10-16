import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";
import { ConsoleLogger } from "@thrive/realtime-observability";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { sessionId, toolEvent } = await request.json();

    if (!sessionId || !toolEvent) {
      logger.warn("Missing required fields for tool event append", { sessionId, toolEvent });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use the platform's store interface for tool event appending
    await demoStore.appendToolEvent(sessionId, toolEvent);

    logger.info("Tool event appended successfully", { sessionId, toolName: toolEvent.name });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to append tool event", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
