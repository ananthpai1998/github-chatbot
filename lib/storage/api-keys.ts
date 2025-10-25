export type LLMProvider = "anthropic" | "google" | "openai";

export interface LLMKeys {
  anthropic?: string;
  google?: string;
  openai?: string;
  lastUpdated?: string;
}

const STORAGE_KEY = "devmate_llm_keys";
const DEFAULT_PROVIDER_KEY = "devmate_default_provider";
const DEFAULT_MODEL_KEY = "devmate_default_model";

/**
 * Get all stored LLM API keys
 */
export function getLLMKeys(): LLMKeys {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading LLM keys:", error);
    return {};
  }
}

/**
 * Get API key for a specific provider
 */
export function getLLMKey(provider: LLMProvider): string | null {
  const keys = getLLMKeys();
  return keys[provider] || null;
}

/**
 * Save API key for a specific provider
 */
export function saveLLMKey(provider: LLMProvider, apiKey: string): void {
  if (typeof window === "undefined") return;

  try {
    const keys = getLLMKeys();
    keys[provider] = apiKey;
    keys.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Error saving LLM key:", error);
    throw new Error("Failed to save API key");
  }
}

/**
 * Delete API key for a specific provider
 */
export function deleteLLMKey(provider: LLMProvider): void {
  if (typeof window === "undefined") return;

  try {
    const keys = getLLMKeys();
    delete keys[provider];
    keys.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Error deleting LLM key:", error);
    throw new Error("Failed to delete API key");
  }
}

/**
 * Clear all LLM API keys
 */
export function clearAllLLMKeys(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing LLM keys:", error);
  }
}

/**
 * Get default LLM provider
 */
export function getDefaultProvider(): LLMProvider | null {
  if (typeof window === "undefined") return null;

  try {
    return (localStorage.getItem(DEFAULT_PROVIDER_KEY) as LLMProvider) || null;
  } catch (error) {
    console.error("Error reading default provider:", error);
    return null;
  }
}

/**
 * Set default LLM provider
 */
export function setDefaultProvider(provider: LLMProvider): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(DEFAULT_PROVIDER_KEY, provider);
  } catch (error) {
    console.error("Error saving default provider:", error);
    throw new Error("Failed to save default provider");
  }
}

/**
 * Get default model
 */
export function getDefaultModel(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(DEFAULT_MODEL_KEY);
  } catch (error) {
    console.error("Error reading default model:", error);
    return null;
  }
}

/**
 * Set default model
 */
export function setDefaultModel(model: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(DEFAULT_MODEL_KEY, model);
  } catch (error) {
    console.error("Error saving default model:", error);
    throw new Error("Failed to save default model");
  }
}

/**
 * Export all settings as encrypted JSON
 */
export function exportSettings(): string {
  const keys = getLLMKeys();
  const defaultProvider = getDefaultProvider();
  const defaultModel = getDefaultModel();

  const settings = {
    llmKeys: keys,
    defaultProvider,
    defaultModel,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON
 */
export function importSettings(jsonString: string): void {
  if (typeof window === "undefined") return;

  try {
    const settings = JSON.parse(jsonString);

    if (settings.llmKeys) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.llmKeys));
    }

    if (settings.defaultProvider) {
      setDefaultProvider(settings.defaultProvider);
    }

    if (settings.defaultModel) {
      setDefaultModel(settings.defaultModel);
    }
  } catch (error) {
    console.error("Error importing settings:", error);
    throw new Error("Invalid settings file");
  }
}

/**
 * Validate API key format for a provider
 */
export function validateAPIKeyFormat(
  provider: LLMProvider,
  apiKey: string
): boolean {
  switch (provider) {
    case "anthropic":
      return apiKey.startsWith("sk-ant-");
    case "google":
      return apiKey.startsWith("AIza");
    case "openai":
      return apiKey.startsWith("sk-") || apiKey.startsWith("sk-proj-");
    default:
      return false;
  }
}

/**
 * Get masked version of API key for display (first 8 chars + ...)
 */
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "***";
  return `${apiKey.substring(0, 8)}...`;
}
