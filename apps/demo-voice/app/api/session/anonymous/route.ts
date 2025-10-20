import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(_req: NextRequest) {
  const anonymousId = crypto.randomUUID();
  const res = NextResponse.json({ anonymousId });
  res.headers.set("Set-Cookie", `anon_id=${anonymousId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  return res;
}
