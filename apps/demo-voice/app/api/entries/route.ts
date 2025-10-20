import { NextRequest, NextResponse } from "next/server";
import { entryStore } from "@/lib/stores/entryStore";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";
import { redact } from "@thrivereflections/realtime-security";

export const runtime = "edge";

function getIdentity(req: NextRequest): { level: "anonymous" | "pseudonymous" | "authenticated"; id: string } | null {
  const anon = req.cookies.get("anon_id")?.value;
  if (anon) return { level: "anonymous", id: anon };
  // Placeholder: authenticated/pseudonymous detection can be wired later
  return null;
}

export async function GET(req: NextRequest) {
  const id = getIdentity(req);
  const correlationId = crypto.randomUUID();
  const logger = createLoggerFromEnv(correlationId);
  if (id) logger.setIdentity(id.level, id.id);

  if (!id) {
    logger.warn("GET /entries with no identity");
    return NextResponse.json({ entries: [] });
  }
  const entries = entryStore.listEntries(id);
  logger.info("Entries listed", { count: entries.length });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const id = getIdentity(req);
  const correlationId = crypto.randomUUID();
  const logger = createLoggerFromEnv(correlationId);
  if (id) logger.setIdentity(id.level, id.id);

  if (!id) {
    logger.warn("POST /entries with no identity");
    return NextResponse.json({ error: "no_identity" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text : "";
  const cleaned = redact(text);
  const entry = entryStore.addEntry(id, cleaned);
  logger.info("Entry created", { entryId: entry.id });
  return NextResponse.json({ entry });
}
