"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProviderAPIKeys, ProviderType } from "@/lib/ai/providers";

// LocalStorage keys
const STORAGE_KEY = "devmate_api_keys";

// Encrypt/decrypt helpers (basic obfuscation - for production, consider crypto-js)
function encodeKey(key: string): string {
  return btoa(key);
}

function decodeKey(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return "";
  }
}

// Storage helpers
function saveToLocalStorage(keys: ProviderAPIKeys): void {
  const encoded: Record<string, string> = {};
  if (keys.anthropic) encoded.anthropic = encodeKey(keys.anthropic);
  if (keys.google) encoded.google = encodeKey(keys.google);
  if (keys.openai) encoded.openai = encodeKey(keys.openai);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encoded));
}

function loadFromLocalStorage(): ProviderAPIKeys {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log("[API Keys] No stored API keys found");
      return {};
    }

    const encoded = JSON.parse(stored) as Record<string, string>;
    const decoded: ProviderAPIKeys = {};

    if (encoded.anthropic) decoded.anthropic = decodeKey(encoded.anthropic);
    if (encoded.google) decoded.google = decodeKey(encoded.google);
    if (encoded.openai) decoded.openai = decodeKey(encoded.openai);

    console.log("[API Keys] Loaded from localStorage:", {
      hasAnthropic: !!decoded.anthropic,
      hasGoogle: !!decoded.google,
      hasOpenAI: !!decoded.openai,
    });

    return decoded;
  } catch (error) {
    console.error("[API Keys] Failed to load from localStorage:", error);
    return {};
  }
}

export function useAPIKeys() {
  const [apiKeys, setApiKeys] = useState<ProviderAPIKeys>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const keys = loadFromLocalStorage();
    setApiKeys(keys);
    setIsLoaded(true);
  }, []);

  // Save a specific provider's API key
  const setAPIKey = useCallback((provider: ProviderType, key: string) => {
    setApiKeys((prev) => {
      const updated = { ...prev, [provider]: key };
      saveToLocalStorage(updated);
      return updated;
    });
  }, []);

  // Remove a specific provider's API key
  const removeAPIKey = useCallback((provider: ProviderType) => {
    setApiKeys((prev) => {
      const updated = { ...prev };
      delete updated[provider];
      saveToLocalStorage(updated);
      return updated;
    });
  }, []);

  // Clear all API keys
  const clearAllAPIKeys = useCallback(() => {
    setApiKeys({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if a provider has an API key configured
  const hasAPIKey = useCallback(
    (provider: ProviderType): boolean => {
      return !!apiKeys[provider];
    },
    [apiKeys]
  );

  // Get API key for a specific provider
  const getAPIKey = useCallback(
    (provider: ProviderType): string | undefined => {
      const key = apiKeys[provider];
      console.log(`[API Keys] getAPIKey(${provider}):`, key ? "found" : "not found");
      return key;
    },
    [apiKeys]
  );

  // Get list of providers with configured API keys
  const getConfiguredProviders = useCallback((): ProviderType[] => {
    return Object.keys(apiKeys).filter((key) => !!apiKeys[key as ProviderType]) as ProviderType[];
  }, [apiKeys]);

  return {
    apiKeys,
    isLoaded,
    setAPIKey,
    removeAPIKey,
    clearAllAPIKeys,
    hasAPIKey,
    getAPIKey,
    getConfiguredProviders,
  };
}
