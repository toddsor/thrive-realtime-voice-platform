import { NextResponse } from "next/server";
import { loadPublicRuntimeConfig } from "@thrivereflections/realtime-config";

export async function GET() {
  try {
    const publicConfig = loadPublicRuntimeConfig();
    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error("Failed to load runtime config:", error);
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 });
  }
}
