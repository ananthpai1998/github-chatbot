import { getAllModels, setSetting, updateModelConfig } from "../db/admin-queries";

/**
 * Known pricing data for different models (as of January 2025)
 * Prices are per million tokens in USD
 * Source: Official provider pricing pages
 */
export const knownPricing = {
  anthropic: {
    "claude-sonnet-4-20250514": {
      inputPerMillion: 3.0, // Estimated, update when official pricing released
      outputPerMillion: 15.0,
      currency: "USD",
    },
    "claude-3-7-sonnet-20250219": {
      inputPerMillion: 3.0, // Estimated, update when official pricing released
      outputPerMillion: 15.0,
      currency: "USD",
    },
    "claude-3-5-sonnet-20241022": {
      inputPerMillion: 3.0,
      outputPerMillion: 15.0,
      currency: "USD",
    },
    "claude-3-5-haiku-20241022": {
      inputPerMillion: 0.8,
      outputPerMillion: 4.0,
      currency: "USD",
    },
    "claude-3-opus-20240229": {
      inputPerMillion: 15.0,
      outputPerMillion: 75.0,
      currency: "USD",
    },
  },
  openai: {
    "gpt-4.1": {
      inputPerMillion: 2.5, // Estimated, update when official pricing released
      outputPerMillion: 10.0,
      currency: "USD",
    },
    "gpt-4.1-mini": {
      inputPerMillion: 0.15, // Estimated, update when official pricing released
      outputPerMillion: 0.6,
      currency: "USD",
    },
    "gpt-4o": {
      inputPerMillion: 2.5,
      outputPerMillion: 10.0,
      currency: "USD",
    },
    "gpt-4o-mini": {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
      currency: "USD",
    },
    "o3": {
      inputPerMillion: 15.0, // Estimated, update when official pricing released
      outputPerMillion: 60.0,
      currency: "USD",
    },
    "o4-mini": {
      inputPerMillion: 3.0, // Estimated, update when official pricing released
      outputPerMillion: 12.0,
      currency: "USD",
    },
    "o1-preview": {
      inputPerMillion: 15.0,
      outputPerMillion: 60.0,
      currency: "USD",
    },
    "o1-mini": {
      inputPerMillion: 3.0,
      outputPerMillion: 12.0,
      currency: "USD",
    },
  },
  google: {
    "gemini-2.5-pro": {
      inputPerMillion: 1.25, // Estimated, update when official pricing released
      outputPerMillion: 5.0,
      currency: "USD",
    },
    "gemini-2.5-flash": {
      inputPerMillion: 0.075, // Estimated, update when official pricing released
      outputPerMillion: 0.3,
      currency: "USD",
    },
    "gemini-2.5-flash-lite": {
      inputPerMillion: 0.0, // Free during preview
      outputPerMillion: 0.0,
      currency: "USD",
    },
    "gemini-2.0-flash": {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
      currency: "USD",
    },
    "gemini-1.5-pro": {
      inputPerMillion: 1.25,
      outputPerMillion: 5.0,
      currency: "USD",
    },
    "gemini-1.5-flash": {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
      currency: "USD",
    },
  },
} as const;

/**
 * Sync all model pricing from known pricing data
 */
export async function syncAllPricing(): Promise<{
  updated: number;
  skipped: number;
  errors: string[];
}> {
  const models = await getAllModels();
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const model of models) {
    try {
      // Find pricing for this model
      const providerPricing = knownPricing[model.provider as keyof typeof knownPricing];

      if (!providerPricing) {
        errors.push(`No pricing data available for provider: ${model.provider}`);
        skipped++;
        continue;
      }

      const modelPricing = providerPricing[model.id as keyof typeof providerPricing];

      if (!modelPricing) {
        errors.push(`No pricing data available for model: ${model.id}`);
        skipped++;
        continue;
      }

      // Update model with new pricing
      await updateModelConfig(model.id, {
        pricing: modelPricing,
      });

      updated++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to update ${model.id}: ${message}`);
      skipped++;
    }
  }

  // Store last sync timestamp
  await setSetting(
    "pricing_last_synced",
    new Date().toISOString(),
    "pricing",
    "system"
  );

  return {
    updated,
    skipped,
    errors,
  };
}

/**
 * Get the last time pricing was synced
 */
export async function getPricingLastSynced(): Promise<string | null> {
  const { getSetting } = await import("../db/admin-queries");
  const setting = await getSetting("pricing_last_synced");
  return setting?.value as string | null;
}

/**
 * Get pricing for a specific model
 */
export function getModelPricing(
  provider: string,
  modelId: string
): {
  inputPerMillion: number;
  outputPerMillion: number;
  currency: string;
} | null {
  const providerPricing = knownPricing[provider as keyof typeof knownPricing];
  if (!providerPricing) return null;

  const pricing = providerPricing[modelId as keyof typeof providerPricing];
  return pricing || null;
}

/**
 * Calculate cost for a given token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: { inputPerMillion: number; outputPerMillion: number }
): number {
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}
