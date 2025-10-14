import { NextResponse } from "next/server";
import { validateModel, AVAILABLE_MODELS } from "@thrive/realtime-config";

export async function GET() {
  const result = validateModel();

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        availableModels: AVAILABLE_MODELS,
      },
      { status: result.error?.includes("not set") ? 500 : 400 }
    );
  }

  return NextResponse.json({
    model: result.model,
    availableModels: AVAILABLE_MODELS,
  });
}
