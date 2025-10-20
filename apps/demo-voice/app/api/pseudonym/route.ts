import { NextRequest, NextResponse } from "next/server";
import { entryStore } from "@/lib/stores/entryStore";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { nickname } = await req.json().catch(() => ({ nickname: "" }));
  if (!nickname || typeof nickname !== "string") {
    return NextResponse.json({ error: "invalid_nickname" }, { status: 400 });
  }

  const profile = entryStore.createPseudonym(nickname);
  const res = NextResponse.json({ pseudonymousId: profile.id, nickname: profile.nickname });
  res.headers.set(
    "Set-Cookie",
    `pseud_id=${profile.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
  );
  return res;
}
