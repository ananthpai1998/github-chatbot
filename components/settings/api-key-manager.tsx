"use client";

import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, CheckIcon, XIcon } from "lucide-react";
import { useAPIKeys } from "@/hooks/use-api-keys";
import type { ProviderType } from "@/lib/ai/providers";
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

type ProviderConfig = {
  type: ProviderType;
  name: string;
  description: string;
  placeholder: string;
  docsUrl: string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    type: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Haiku, and Opus models",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    type: "google",
    name: "Google AI",
    description: "Gemini 2.0 Flash and 1.5 Pro/Flash models",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    type: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, and o1 models",
    placeholder: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
];

export function APIKeyManager() {
  const { apiKeys, setAPIKey, removeAPIKey, hasAPIKey, isLoaded } = useAPIKeys();
  const [inputs, setInputs] = useState<Record<ProviderType, string>>({
    anthropic: "",
    google: "",
    openai: "",
  });
  const [showKeys, setShowKeys] = useState<Record<ProviderType, boolean>>({
    anthropic: false,
    google: false,
    openai: false,
  });
  const [validating, setValidating] = useState<Record<ProviderType, boolean>>({
    anthropic: false,
    google: false,
    openai: false,
  });

  // Load existing keys into input fields (masked)
  useEffect(() => {
    if (isLoaded) {
      setInputs({
        anthropic: apiKeys.anthropic ? "••••••••••••••••" : "",
        google: apiKeys.google ? "••••••••••••••••" : "",
        openai: apiKeys.openai ? "••••••••••••••••" : "",
      });
    }
  }, [isLoaded, apiKeys]);

  const handleInputChange = (provider: ProviderType, value: string) => {
    setInputs((prev) => ({ ...prev, [provider]: value }));
  };

  const toggleShowKey = (provider: ProviderType) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = async (provider: ProviderType) => {
    const key = inputs[provider].trim();
    if (!key || key === "••••••••••••••••") {
      toast({
        type: "error",
        description: "Please enter a valid API key",
      });
      return;
    }

    setValidating((prev) => ({ ...prev, [provider]: true }));

    try {
      // Validate key format
      const providerConfig = PROVIDERS.find((p) => p.type === provider);
      if (providerConfig && !key.startsWith(providerConfig.placeholder.split("...")[0])) {
        toast({
          type: "error",
          description: `Invalid ${providerConfig.name} API key format`,
        });
        setValidating((prev) => ({ ...prev, [provider]: false }));
        return;
      }

      // Save the key
      setAPIKey(provider, key);

      // Mask the input
      setInputs((prev) => ({ ...prev, [provider]: "••••••••••••••••" }));

      toast({
        type: "success",
        description: `${PROVIDERS.find((p) => p.type === provider)?.name} API key saved successfully`,
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to save API key",
      });
    } finally {
      setValidating((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemove = (provider: ProviderType) => {
    removeAPIKey(provider);
    setInputs((prev) => ({ ...prev, [provider]: "" }));
    toast({
      type: "success",
      description: `${PROVIDERS.find((p) => p.type === provider)?.name} API key removed`,
    });
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Add your LLM provider API keys to use different models. Keys are stored
          locally in your browser and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {PROVIDERS.map((provider) => {
          const isConfigured = hasAPIKey(provider.type);
          const isInputMasked = inputs[provider.type] === "••••••••••••••••";

          return (
            <div key={provider.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`api-key-${provider.type}`} className="text-base font-medium">
                    {provider.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
                {isConfigured && (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckIcon className="h-4 w-4" />
                    Configured
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`api-key-${provider.type}`}
                    type={showKeys[provider.type] ? "text" : "password"}
                    placeholder={provider.placeholder}
                    value={inputs[provider.type]}
                    onChange={(e) => handleInputChange(provider.type, e.target.value)}
                    onFocus={() => {
                      // Clear masked input on focus
                      if (isInputMasked) {
                        setInputs((prev) => ({ ...prev, [provider.type]: "" }));
                      }
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider.type)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[provider.type] ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <Button
                  onClick={() => handleSave(provider.type)}
                  disabled={validating[provider.type] || isInputMasked}
                  variant="default"
                  size="default"
                >
                  {validating[provider.type] ? "Saving..." : "Save"}
                </Button>

                {isConfigured && (
                  <Button
                    onClick={() => handleRemove(provider.type)}
                    variant="outline"
                    size="default"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {provider.name} Console
                </a>
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
