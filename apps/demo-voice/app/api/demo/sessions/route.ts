import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/demo/sessions - Create a new demo session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.sessionName || !body.demoType) {
      return NextResponse.json({ error: "Missing required fields: userId, sessionName, demoType" }, { status: 400 });
    }

    // Validate demoType
    if (!["VOICE", "CHAT", "VIDEO"].includes(body.demoType)) {
      return NextResponse.json({ error: "Invalid demoType. Must be 'VOICE', 'CHAT', or 'VIDEO'" }, { status: 400 });
    }

    const session = await demoStore.createDemoSession({
      userId: body.userId,
      sessionName: body.sessionName,
      demoType: body.demoType,
      metadata: body.metadata,
    });

    return NextResponse.json({
      session,
      message: "Demo session created successfully",
    });
  } catch (error) {
    console.error("Failed to create demo session:", error);
    return NextResponse.json({ error: "Failed to create demo session" }, { status: 500 });
  }
}

// GET /api/demo/sessions - Get demo sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sessions = await demoStore.getDemoSessions(userId);

    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Failed to get demo sessions:", error);
    return NextResponse.json({ error: "Failed to get demo sessions" }, { status: 500 });
  }
}

// PUT /api/demo/sessions/[id] - Update a demo session
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const body = await request.json();

    const session = await demoStore.updateDemoSession(sessionId, body);

    return NextResponse.json({
      session,
      message: "Demo session updated successfully",
    });
  } catch (error) {
    console.error("Failed to update demo session:", error);
    return NextResponse.json({ error: "Failed to update demo session" }, { status: 500 });
  }
}
