import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/demo/analytics?userId=xxx - Get demo analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!prisma) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Build analytics queries
    const whereClause = userId ? { userId } : {};

    const [sessions, feedback, userStats] = await Promise.all([
      // Demo sessions
      prisma.demoSession.findMany({
        where: whereClause,
        include: {
          user: true,
          feedback: true
        }
      }),
      // Feedback data
      prisma.demoFeedback.findMany({
        where: userId ? { userId } : {},
        include: {
          session: true
        }
      }),
      // User stats (if userId provided)
      userId ? prisma.appUser.findUnique({
        where: { id: userId },
        include: {
          sessions: true,
          demoSessions: true
        }
      }) : null
    ]);

    // Calculate analytics
    const analytics = {
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length 
        : 0,
      sessionsByType: sessions.reduce((acc: Record<string, number>, session: any) => {
        acc[session.demoType] = (acc[session.demoType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      feedbackByCategory: feedback.reduce((acc: Record<string, number>, f: any) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      userStats: userStats ? {
        totalPlatformSessions: userStats.sessions.length,
        totalDemoSessions: userStats.demoSessions.length,
        plan: userStats.plan,
        lastSignIn: userStats.lastSignInAt
      } : null,
      recentSessions: sessions
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
    };
    
    return NextResponse.json({ 
      analytics,
      message: "Demo analytics retrieved successfully" 
    });
  } catch (error) {
    console.error("Failed to get demo analytics:", error);
    return NextResponse.json(
      { error: "Failed to get demo analytics" },
      { status: 500 }
    );
  }
}
