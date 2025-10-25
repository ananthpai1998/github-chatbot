import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Provider types
export type ProviderType = "anthropic" | "google" | "openai";

// API Key configuration for each provider
export type ProviderAPIKeys = {
  anthropic?: string;
  google?: string;
  openai?: string;
};

// Factory functions for creating provider instances with API keys
export function createProviderInstance(
  provider: ProviderType,
  apiKey: string
) {
  console.log("[Providers] Creating provider instance:", {
    provider,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 10) + "...",
  });

  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey });
    case "google":
      return createGoogleGenerativeAI({ apiKey });
    case "openai":
      return createOpenAI({ apiKey });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Get language model with user-provided API key
export function getLanguageModel(
  provider: ProviderType,
  modelId: string,
  apiKey: string
): LanguageModelV2 {
  console.log("[Providers] getLanguageModel called:", {
    provider,
    modelId,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
  });

  if (!apiKey || apiKey.trim() === "") {
    console.error("[Providers] ❌ Empty or missing API key!");
    throw new Error(`No API key configured for ${provider}. Please add your API key in settings.`);
  }

  const providerInstance = createProviderInstance(provider, apiKey);
  console.log("[Providers] ✅ Provider instance created");

  const model = providerInstance(modelId);
  console.log("[Providers] ✅ Language model created");

  return model;
}

// Test environment provider (for mocking)
export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "claude-3-5-sonnet": chatModel,
          "claude-3-5-haiku": reasoningModel,
          "gemini-2-0-flash": titleModel,
          "gpt-4o": artifactModel,
        },
      });
    })()
  : null; // In production, we'll use dynamic provider creation
