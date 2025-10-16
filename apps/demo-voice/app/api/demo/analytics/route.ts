import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// GET /api/demo/analytics?userId=xxx - Get demo analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Build analytics queries using the platform store
    const [sessions, feedback, userStats] = await Promise.all([
      // Demo sessions
      demoStore.getDemoSessions(userId || undefined),
      // Feedback data
      demoStore.getDemoFeedback(undefined, userId || undefined),
      // User stats (if userId provided)
      userId ? demoStore.getUserByAuthId(userId) : null,
    ]);

    // Calculate analytics
    const analytics = {
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
      averageRating:
        feedback.length > 0 ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length : 0,
      sessionsByType: sessions.reduce((acc: Record<string, number>, session: any) => {
        acc[session.demoType] = (acc[session.demoType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      feedbackByCategory: feedback.reduce((acc: Record<string, number>, f: any) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      userStats: userStats
        ? {
            totalDemoSessions: sessions.length,
            plan: "FREE", // Default plan since we don't have plan info in userStats
            lastSignIn: null, // Not available in the current userStats interface
          }
        : null,
      recentSessions: sessions.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5),
    };

    return NextResponse.json({
      analytics,
      message: "Demo analytics retrieved successfully",
    });
  } catch (error) {
    console.error("Failed to get demo analytics:", error);
    return NextResponse.json({ error: "Failed to get demo analytics" }, { status: 500 });
  }
}
