import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConsoleLogger } from "@thrive/realtime-observability";
import { redact } from "@thrive/realtime-security";

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

    // Check if prisma is available
    if (!prisma) {
      logger.warn("Database not available, skipping transcript persistence", { sessionId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Check session consent
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { consent: true },
    });

    if (session?.consent !== "ACCEPTED") {
      logger.info("Session consent not accepted, skipping transcript persistence", { sessionId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Redact PII and create transcript
    const text = redact(transcript.text);
    const startedAt = transcript.startedAt ? new Date(transcript.startedAt) : new Date();
    const endedAt = transcript.endedAt ? new Date(transcript.endedAt) : new Date();

    if (isNaN(startedAt.getTime())) {
      logger.warn("Invalid startedAt, using current time", { sessionId });
      startedAt.setTime(Date.now());
    }
    if (isNaN(endedAt.getTime())) {
      logger.warn("Invalid endedAt, using current time", { sessionId });
      endedAt.setTime(Date.now());
    }

    await prisma.transcript.create({
      data: {
        sessionId,
        role: transcript.role,
        text,
        startedAt,
        endedAt,
      },
    });

    logger.info("Transcript appended successfully", { sessionId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to append transcript", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
