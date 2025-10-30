import { NextResponse } from "next/server";
import { getAllModels } from "@/lib/db/admin-queries";

/**
 * Debug endpoint to check if model capabilities are set correctly
 */
export async function GET() {
  try {
    const models = await getAllModels();

    const diagnostics = models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      isEnabled: model.isEnabled,
      capabilities: model.capabilities,
      allowedFileTypes: model.allowedFileTypes,
      toolPrompts: model.toolPrompts,
    }));

    return NextResponse.json({
      total: models.length,
      models: diagnostics
    });
  } catch (error) {
    console.error("Failed to fetch models for diagnostics:", error);
    return NextResponse.json(
      { error: "Failed to fetch models", details: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
