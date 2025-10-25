"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, GithubIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useGitHubToken } from "@/hooks/use-github-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * GitHub Connection Status Component
 *
 * Displays the current GitHub connection status and provides
 * quick access to settings if not connected.
 */
export function GitHubConnectionStatus() {
  const { hasToken, isLoaded } = useGitHubToken();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsConnected(hasToken());
    }
  }, [hasToken, isLoaded]);

  if (!isLoaded) {
    return null; // Don't show anything while loading
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
        <XCircleIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          GitHub not connected
        </span>
        <Link href="/settings">
          <Button size="sm" variant="ghost" className="h-auto py-1 text-xs">
            Connect
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <GithubIcon className="h-3 w-3" />
        <span>GitHub</span>
        <CheckCircleIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
      </Badge>
    </div>
  );
}

/**
 * Compact GitHub Status Badge
 * For use in headers or toolbars
 */
export function GitHubStatusBadge() {
  const { hasToken, isLoaded } = useGitHubToken();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsConnected(hasToken());
    }
  }, [hasToken, isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Badge
      variant={isConnected ? "default" : "outline"}
      className="gap-1"
    >
      <GithubIcon className="h-3 w-3" />
      {isConnected ? "Connected" : "Not connected"}
    </Badge>
  );
}
