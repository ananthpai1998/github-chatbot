import { NextResponse } from "next/server";
import { getEnabledModels } from "@/lib/ai/model-loader";

/**
 * GET /api/models/enabled
 * Returns all enabled models for the model selector
 * This endpoint is public (no auth required) as it only returns enabled models
 * NO CACHE - Always fetch fresh data so dropdown shows immediate updates
 */
export async function GET() {
  try {
    const models = await getEnabledModels();

    // Transform to match the ChatModel type expected by the frontend
    const transformedModels = models.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description || "",
      provider: model.provider,
      modelId: model.modelId,
      contextWindow: model.contextWindow,
      supportsVision: model.supportsVision,
      supportsTools: model.supportsTools,
      capabilities: model.capabilities,
      pricing: model.pricing,
    }));

    return NextResponse.json({ models: transformedModels });
  } catch (error) {
    console.error("Failed to fetch enabled models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0; // No cache - always fetch fresh data
