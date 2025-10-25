"use client";

import type { User } from "@supabase/supabase-js";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAPIKeys } from "@/hooks/use-api-keys";
import { defaultEntitlements } from "@/lib/ai/entitlements";
import {
  chatModels,
  claudeModels,
  geminiModels,
  gptModels,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const { getConfiguredProviders } = useAPIKeys();
  const configuredProviders = getConfiguredProviders();

  // Filter models based on configured API keys
  const availableChatModels = chatModels.filter((chatModel) =>
    configuredProviders.includes(chatModel.provider)
  );

  // Group models by provider for organized display
  const availableClaudeModels = claudeModels.filter((model) =>
    configuredProviders.includes("anthropic")
  );
  const availableGeminiModels = geminiModels.filter((model) =>
    configuredProviders.includes("google")
  );
  const availableGPTModels = gptModels.filter((model) =>
    configuredProviders.includes("openai")
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId
      ),
    [optimisticModelId, availableChatModels]
  );

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[280px] max-w-[90vw] sm:min-w-[300px]"
      >
        {availableChatModels.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No API keys configured. Please add API keys in settings to use models.
          </div>
        ) : (
          <>
            {availableClaudeModels.length > 0 && (
              <>
                <DropdownMenuLabel>Anthropic Claude</DropdownMenuLabel>
                {availableClaudeModels.map((chatModel) => {
                  const { id } = chatModel;

                  return (
                    <DropdownMenuItem
                      asChild
                      data-active={id === optimisticModelId}
                      data-testid={`model-selector-item-${id}`}
                      key={id}
                      onSelect={() => {
                        setOpen(false);

                        startTransition(() => {
                          setOptimisticModelId(id);
                          saveChatModelAsCookie(id);
                        });
                      }}
                    >
                      <button
                        className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4"
                        type="button"
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-sm sm:text-base">
                            {chatModel.name}
                          </div>
                          <div className="line-clamp-2 text-muted-foreground text-xs">
                            {chatModel.description}
                          </div>
                        </div>

                        <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                          <CheckCircleFillIcon />
                        </div>
                      </button>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            {availableGeminiModels.length > 0 && (
              <>
                {availableClaudeModels.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>Google Gemini</DropdownMenuLabel>
                {availableGeminiModels.map((chatModel) => {
                  const { id } = chatModel;

                  return (
                    <DropdownMenuItem
                      asChild
                      data-active={id === optimisticModelId}
                      data-testid={`model-selector-item-${id}`}
                      key={id}
                      onSelect={() => {
                        setOpen(false);

                        startTransition(() => {
                          setOptimisticModelId(id);
                          saveChatModelAsCookie(id);
                        });
                      }}
                    >
                      <button
                        className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4"
                        type="button"
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-sm sm:text-base">
                            {chatModel.name}
                          </div>
                          <div className="line-clamp-2 text-muted-foreground text-xs">
                            {chatModel.description}
                          </div>
                        </div>

                        <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                          <CheckCircleFillIcon />
                        </div>
                      </button>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            {availableGPTModels.length > 0 && (
              <>
                {(availableClaudeModels.length > 0 ||
                  availableGeminiModels.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuLabel>OpenAI GPT</DropdownMenuLabel>
                {availableGPTModels.map((chatModel) => {
                  const { id } = chatModel;

                  return (
                    <DropdownMenuItem
                      asChild
                      data-active={id === optimisticModelId}
                      data-testid={`model-selector-item-${id}`}
                      key={id}
                      onSelect={() => {
                        setOpen(false);

                        startTransition(() => {
                          setOptimisticModelId(id);
                          saveChatModelAsCookie(id);
                        });
                      }}
                    >
                      <button
                        className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4"
                        type="button"
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-sm sm:text-base">
                            {chatModel.name}
                          </div>
                          <div className="line-clamp-2 text-muted-foreground text-xs">
                            {chatModel.description}
                          </div>
                        </div>

                        <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                          <CheckCircleFillIcon />
                        </div>
                      </button>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
