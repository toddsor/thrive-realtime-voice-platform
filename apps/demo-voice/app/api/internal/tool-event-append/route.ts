import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@thrive/realtime-lib";
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

    // Check if prisma is available
    if (!prisma) {
      logger.warn("Database not available, skipping tool event persistence", { sessionId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Check session consent
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { consent: true },
    });

    if (session?.consent !== "ACCEPTED") {
      logger.info("Session consent not accepted, skipping tool event persistence", { sessionId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Create tool event
    await prisma.toolEvent.create({
      data: {
        sessionId,
        name: toolEvent.name,
        argsJson: toolEvent.args as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        resultJson: toolEvent.result as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });

    logger.info("Tool event appended successfully", { sessionId, toolName: toolEvent.name });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to append tool event", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
