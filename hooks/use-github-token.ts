"use client";

import { useCallback, useEffect, useState } from "react";

// LocalStorage key
const STORAGE_KEY = "devmate_github_token";

// Encrypt/decrypt helpers (basic obfuscation)
function encodeToken(token: string): string {
  return btoa(token);
}

function decodeToken(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return "";
  }
}

// Storage helpers
function saveToLocalStorage(token: string): void {
  const encoded = encodeToken(token);
  localStorage.setItem(STORAGE_KEY, encoded);
}

function loadFromLocalStorage(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return decodeToken(stored);
  } catch {
    return null;
  }
}

export function useGitHubToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = loadFromLocalStorage();
    setToken(storedToken);
    setIsLoaded(true);
  }, []);

  // Save GitHub token
  const setGitHubToken = useCallback((newToken: string) => {
    setToken(newToken);
    saveToLocalStorage(newToken);
  }, []);

  // Remove GitHub token
  const removeGitHubToken = useCallback(() => {
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if token exists
  const hasToken = useCallback((): boolean => {
    return !!token;
  }, [token]);

  // Get token
  const getToken = useCallback((): string | null => {
    return token;
  }, [token]);

  return {
    token,
    isLoaded,
    setGitHubToken,
    removeGitHubToken,
    hasToken,
    getToken,
  };
}
