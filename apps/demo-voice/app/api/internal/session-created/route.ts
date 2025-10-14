import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConsoleLogger } from "@thrive/realtime-observability";

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

    // Check if database is available
    if (!prisma) {
      logger.warn("Database not available, skipping session persistence", { sessionId });
      return NextResponse.json({ success: true, skipped: true, reason: "Database not available" });
    }

    // Check for existing session
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (existingSession) {
      logger.info("Session already exists, skipping creation", { sessionId });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Create new session
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: authUserId, // Use the Supabase auth user ID
        openAiSession: timings.providerSessionId,
        skill: config.persona || "default",
        configJson: config as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        timingsJson: timings as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        consent: consent as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });

    logger.info("Session created successfully", { sessionId, consent });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Session persistence failed", { error: errorMessage, correlationId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
