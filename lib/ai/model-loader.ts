import { unstable_cache as cache } from "next/cache";
import { getAllModels } from "@/lib/db/admin-queries";
import type { ModelConfig } from "@/lib/db/schema";

/**
 * Get all enabled models from the database
 * NO CACHE - Always fetch fresh data so changes are immediately reflected
 */
export const getEnabledModels = async (): Promise<ModelConfig[]> => {
  const models = await getAllModels();
  return models.filter((model) => model.isEnabled);
};

/**
 * Get a specific model by ID with all its capabilities
 * Results are cached for 5 minutes
 */
export const getModelWithCapabilities = cache(
  async (modelId: string): Promise<ModelConfig | undefined> => {
    const models = await getAllModels();
    return models.find((model) => model.id === modelId);
  },
  ["model-with-capabilities"],
  { revalidate: 300 } // 5 minutes
);

/**
 * Get models grouped by provider
 * Results are cached for 5 minutes
 */
export const getModelsByProvider = cache(
  async (): Promise<Record<string, ModelConfig[]>> => {
    const models = await getAllModels();
    const enabledModels = models.filter((model) => model.isEnabled);

    return enabledModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, ModelConfig[]>);
  },
  ["models-by-provider"],
  { revalidate: 300 } // 5 minutes
);

/**
 * Check if a specific capability is enabled for a model
 */
export function hasCapability(
  model: ModelConfig,
  capability: keyof NonNullable<ModelConfig["capabilities"]>
): boolean {
  return model.capabilities?.[capability]?.enabled === true;
}

/**
 * Get thinking budget tokens for a model (if thinking is enabled)
 */
export function getThinkingBudget(model: ModelConfig): number | undefined {
  if (model.capabilities?.thinking?.enabled) {
    return model.capabilities.thinking.budgetTokens;
  }
  return undefined;
}
