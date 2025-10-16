import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserByAuthId } from "@/lib/auth/userSync";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = new ConsoleLogger(correlationId);

  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      logger.warn("No authorization header provided");
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    logger.info("Validating authentication", { correlationId });

    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Supabase authentication failed", {
        error: authError?.message,
        correlationId,
      });

      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Get user from AppUser table
    const appUser = await getUserByAuthId(user.id);
    if (!appUser) {
      logger.warn("User not found in AppUser table", {
        authUserId: user.id,
        correlationId,
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("Authentication successful", {
      userId: appUser.sub,
      email: appUser.email,
      correlationId,
    });

    return NextResponse.json({
      user: {
        sub: appUser.sub,
        email: appUser.email,
        name: appUser.name,
        provider: appUser.provider,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Authentication validation failed", {
      error: errorMessage,
      correlationId,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
