"use client";

import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, CheckIcon, GithubIcon } from "lucide-react";
import { useGitHubToken } from "@/hooks/use-github-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/toast";

export function GitHubTokenManager() {
  const { token, setGitHubToken, removeGitHubToken, hasToken, isLoaded } = useGitHubToken();
  const [input, setInput] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Load existing token into input field (masked)
  useEffect(() => {
    if (isLoaded && token) {
      setInput("••••••••••••••••••••••••••••••••••••••••");
    }
  }, [isLoaded, token]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const toggleShowToken = () => {
    setShowToken((prev) => !prev);
  };

  const handleSave = () => {
    const trimmedToken = input.trim();
    if (!trimmedToken || trimmedToken === "••••••••••••••••••••••••••••••••••••••••") {
      toast({
        type: "error",
        description: "Please enter a valid GitHub token",
      });
      return;
    }

    // Basic validation: GitHub tokens start with specific prefixes
    if (!trimmedToken.startsWith("ghp_") && !trimmedToken.startsWith("github_pat_")) {
      toast({
        type: "error",
        description: "Invalid GitHub token format. Token should start with 'ghp_' or 'github_pat_'",
      });
      return;
    }

    // Save the token
    setGitHubToken(trimmedToken);

    // Mask the input
    setInput("••••••••••••••••••••••••••••••••••••••••");

    toast({
      type: "success",
      description: "GitHub token saved successfully",
    });
  };

  const handleRemove = () => {
    removeGitHubToken();
    setInput("");
    toast({
      type: "success",
      description: "GitHub token removed",
    });
  };

  const handleOAuthConnect = () => {
    // This will be implemented in Phase 5 when we integrate GitHub OAuth
    toast({
      type: "success",
      description: "GitHub OAuth coming soon! Please use a Personal Access Token for now.",
    });
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const isConfigured = hasToken();
  const isInputMasked = input === "••••••••••••••••••••••••••••••••••••••••";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GithubIcon className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to enable repository access, issue management,
          and code analysis features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth Connection (Coming Soon) */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Quick Connect</Label>
          <p className="text-sm text-muted-foreground">
            Connect with GitHub OAuth (Coming in Phase 5)
          </p>
          <Button
            onClick={handleOAuthConnect}
            variant="outline"
            disabled
            className="w-full"
          >
            <GithubIcon className="mr-2 h-4 w-4" />
            Connect with GitHub (Coming Soon)
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or use Personal Access Token
            </span>
          </div>
        </div>

        {/* Manual Token Entry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="github-token" className="text-base font-medium">
                Personal Access Token
              </Label>
              <p className="text-sm text-muted-foreground">
                Fine-grained token with repo and user permissions
              </p>
            </div>
            {isConfigured && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckIcon className="h-4 w-4" />
                Connected
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="github-token"
                type={showToken ? "text" : "password"}
                placeholder="ghp_... or github_pat_..."
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  // Clear masked input on focus
                  if (isInputMasked) {
                    setInput("");
                  }
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={toggleShowToken}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              onClick={handleSave}
              disabled={isInputMasked}
              variant="default"
              size="default"
            >
              Save
            </Button>

            {isConfigured && (
              <Button
                onClick={handleRemove}
                variant="outline"
                size="default"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Create a token at{" "}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Settings
              </a>
            </p>
            <p className="text-xs">
              Required scopes: <code className="rounded bg-muted px-1 py-0.5">repo</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5">user</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
