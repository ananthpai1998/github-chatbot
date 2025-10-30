"use client";

import { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThinkingToggleProps {
  modelId: string;
  isThinkingEnabledForModel: boolean;
  currentChatHasMessages: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ThinkingToggle({
  modelId,
  isThinkingEnabledForModel,
  currentChatHasMessages,
  onToggle,
}: ThinkingToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's thinking preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.preferences?.thinkingEnabled ?? false);
        }
      } catch (error) {
        console.error("Failed to load thinking preference:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();
  }, []);

  // Don't show toggle if model doesn't support thinking
  if (!isThinkingEnabledForModel) {
    return null;
  }

  const handleToggle = async () => {
    const newValue = !enabled;

    // If chat has messages and thinking state is changing, warn user
    if (currentChatHasMessages) {
      const confirmed = window.confirm(
        `${newValue ? "Enabling" : "Disabling"} thinking requires starting a new chat. Your current conversation will be saved.\n\nContinue?`
      );

      if (!confirmed) {
        return; // User cancelled
      }
    }

    // Update state optimistically
    setEnabled(newValue);

    try {
      // Save to database
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thinkingEnabled: newValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preference");
      }

      // Notify parent component
      onToggle(newValue);
    } catch (error) {
      console.error("Failed to toggle thinking:", error);
      // Revert on error
      setEnabled(!newValue);
      alert("Failed to update thinking preference. Please try again.");
    }
  };

  if (isLoading) {
    return null; // Don't show while loading
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={enabled ? "default" : "ghost"}
            size="sm"
            onClick={handleToggle}
            className="gap-2"
            aria-label={
              enabled ? "Disable extended thinking" : "Enable extended thinking"
            }
          >
            <Brain size={16} className={enabled ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">
              {enabled ? "Thinking On" : "Thinking Off"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs space-y-1">
            <p className="font-semibold">
              {enabled ? "Extended Thinking Enabled" : "Extended Thinking"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "Model will use deeper reasoning for complex tasks. May increase response time."
                : "Enable for enhanced reasoning on complex problems. Requires starting a new chat if messages exist."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
