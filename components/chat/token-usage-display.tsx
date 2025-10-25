"use client";

import { useMemo } from "react";
import type { AppUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";

type TokenUsageDisplayProps = {
  usage?: AppUsage;
  className?: string;
  showCost?: boolean;
};

// Approximate cost per 1M tokens (updated as of Jan 2025)
const PROVIDER_COSTS = {
  anthropic: {
    "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
    "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
    "claude-3-opus-20240229": { input: 15, output: 75 },
  },
  google: {
    "gemini-2.0-flash-exp": { input: 0, output: 0 }, // Free during preview
    "gemini-exp-1206": { input: 0, output: 0 }, // Free during preview
    "gemini-1.5-pro-002": { input: 1.25, output: 5 },
    "gemini-1.5-flash-002": { input: 0.075, output: 0.3 },
  },
  openai: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "o1-preview": { input: 15, output: 60 },
    "o1-mini": { input: 3, output: 12 },
  },
} as const;

export function TokenUsageDisplay({
  usage,
  className,
  showCost = false,
}: TokenUsageDisplayProps) {
  const { totalTokens, inputTokens, outputTokens, estimatedCost } = useMemo(() => {
    if (!usage) {
      return { totalTokens: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 };
    }

    // AppUsage combines LanguageModelUsage and UsageData
    // Check for different possible property names
    const input = (usage as any).promptTokens || (usage as any).inputTokens || 0;
    const output = (usage as any).completionTokens || (usage as any).outputTokens || 0;
    const total = (usage as any).totalTokens || input + output;

    // Try to estimate cost if we have model info
    let cost = 0;
    // You could enhance this to track the actual model used
    // For now, this is a placeholder

    return { totalTokens: total, inputTokens: input, outputTokens: output, estimatedCost: cost };
  }, [usage]);

  if (!usage || totalTokens === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      {inputTokens > 0 && outputTokens > 0 && (
        <>
          <div className="flex items-center gap-1">
            <span className="font-mono">{inputTokens.toLocaleString()}</span>
            <span>→</span>
            <span className="font-mono">
              {outputTokens.toLocaleString()}
            </span>
          </div>
          <span className="text-muted-foreground/50">•</span>
        </>
      )}
      <div className="font-mono">{totalTokens.toLocaleString()} tokens</div>
      {showCost && estimatedCost > 0 && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <div className="font-mono">~${estimatedCost.toFixed(4)}</div>
        </>
      )}
    </div>
  );
}

export function ConversationUsageSummary({
  messages,
  className,
}: {
  messages: Array<{ metadata?: { usage?: AppUsage } }>;
  className?: string;
}) {
  const summary = useMemo(() => {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    messages.forEach((message) => {
      const usage = message.metadata?.usage;
      if (usage) {
        const input = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const output = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        totalInputTokens += input;
        totalOutputTokens += output;
      }
    });

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
    };
  }, [messages]);

  if (summary.totalTokens === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 text-sm",
        className
      )}
    >
      <span className="text-muted-foreground">Conversation Usage</span>
      <div className="flex items-center gap-2">
        {summary.totalInputTokens > 0 && summary.totalOutputTokens > 0 && (
          <>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="font-mono">
                {summary.totalInputTokens.toLocaleString()}
              </span>
              <span>→</span>
              <span className="font-mono">
                {summary.totalOutputTokens.toLocaleString()}
              </span>
            </div>
            <span className="text-muted-foreground/50">•</span>
          </>
        )}
        <div className="font-mono font-semibold">
          {summary.totalTokens.toLocaleString()} tokens
        </div>
      </div>
    </div>
  );
}
