import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/demo/feedback - Create demo feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sessionId || !body.userId || !body.rating || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userId, rating, category" },
        { status: 400 }
      );
    }

    // Validate rating
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const feedback = await demoStore.createDemoFeedback({
      sessionId: body.sessionId,
      userId: body.userId,
      rating: body.rating,
      feedback: body.feedback,
      category: body.category,
    });

    return NextResponse.json({
      feedback,
      message: "Demo feedback submitted successfully",
    });
  } catch (error) {
    console.error("Failed to create demo feedback:", error);
    return NextResponse.json({ error: "Failed to submit demo feedback" }, { status: 500 });
  }
}

// GET /api/demo/feedback?sessionId=xxx - Get feedback for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const feedback = await demoStore.getDemoFeedback(sessionId);

    return NextResponse.json({
      feedback,
      count: feedback.length,
    });
  } catch (error) {
    console.error("Failed to get demo feedback:", error);
    return NextResponse.json({ error: "Failed to get demo feedback" }, { status: 500 });
  }
}
