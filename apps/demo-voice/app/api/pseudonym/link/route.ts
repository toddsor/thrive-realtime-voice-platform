import { NextRequest, NextResponse } from "next/server";
import { entryStore } from "@/lib/stores/entryStore";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const pseudId = req.cookies.get("pseud_id")?.value;
  const { userId } = await req.json().catch(() => ({ userId: "" }));
  if (!pseudId || !userId) return NextResponse.json({ error: "missing" }, { status: 400 });
  entryStore.linkPseudonymToUser(pseudId, userId);
  return NextResponse.json({ ok: true });
}
