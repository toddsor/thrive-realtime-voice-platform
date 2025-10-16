import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { redact } from "@thrivereflections/realtime-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const { sessionId, transcript } = await request.json();

    if (!sessionId || !transcript) {
      logger.warn("Missing required fields for transcript append", { sessionId, transcript });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use the platform's store interface for transcript appending
    await demoStore.appendTranscript(sessionId, {
      role: transcript.role,
      text: transcript.text,
      startedAt: transcript.startedAt,
      endedAt: transcript.endedAt,
    });

    logger.info("Transcript appended successfully", { sessionId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to append transcript", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
