"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAPIKeys } from "@/hooks/use-api-keys";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useGitHubToken } from "@/hooks/use-github-token";
import { getModelById } from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { MissingAPIKeyBanner } from "./chat/empty-states";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { getAPIKey, hasAPIKey, isLoaded: apiKeysLoaded } = useAPIKeys();
  const { getToken: getGitHubToken } = useGitHubToken();
  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  // Store getAPIKey in ref to avoid stale closure
  const getAPIKeyRef = useRef(getAPIKey);
  useEffect(() => {
    getAPIKeyRef.current = getAPIKey;
  }, [getAPIKey]);

  // Check if API key exists for current model
  const currentModel = getModelById(currentModelId);
  // IMPORTANT: Only check API key status when loaded (to avoid SSR issues)
  const hasCurrentModelApiKey = apiKeysLoaded && currentModel ? hasAPIKey(currentModel.provider) : false;

  // Only log in browser (useEffect ensures client-side only)
  useEffect(() => {
    console.log("[Chat Client] Component initialized:", {
      chatId: id,
      currentModel: currentModelId,
      hasApiKey: hasCurrentModelApiKey,
      provider: currentModel?.provider,
      isReadonly,
      apiKeysLoaded,
    });
  }, [id, currentModelId, hasCurrentModelApiKey, currentModel?.provider, isReadonly, apiKeysLoaded]);

  // Log API key status when loaded
  useEffect(() => {
    if (apiKeysLoaded && currentModel) {
      console.log("[Chat Client] API keys loaded, checking provider:", {
        provider: currentModel.provider,
        hasKey: hasAPIKey(currentModel.provider),
      });
    }
  }, [apiKeysLoaded, currentModel, hasAPIKey]);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        console.log("[Chat Client] Preparing send message request...");

        // Get the model configuration and API key
        const modelConfig = getModelById(currentModelIdRef.current);
        if (!modelConfig) {
          console.error("[Chat Client] ❌ Invalid model:", currentModelIdRef.current);
          throw new Error(`Invalid model: ${currentModelIdRef.current}`);
        }
        console.log("[Chat Client] Model config:", {
          provider: modelConfig.provider,
          modelId: modelConfig.modelId,
        });

        // Use ref to get latest API key (avoids stale closure)
        const apiKey = getAPIKeyRef.current(modelConfig.provider);
        if (!apiKey) {
          console.error("[Chat Client] ❌ No API key for provider:", modelConfig.provider);
          throw new Error(
            `No API key configured for ${modelConfig.provider}. Please add your API key in settings.`
          );
        }
        console.log("[Chat Client] ✅ API key found for provider:", modelConfig.provider);

        // Get GitHub token if available
        const githubToken = getGitHubToken();
        console.log("[Chat Client] GitHub token:", githubToken ? "present" : "not present");

        const body = {
          id: request.id,
          message: request.messages.at(-1),
          selectedChatModel: currentModelIdRef.current,
          selectedVisibilityType: visibilityType,
          apiKey,
          githubToken: githubToken || undefined, // Only include if token exists
          ...request.body,
        };

        console.log("[Chat Client] Request prepared:", {
          chatId: body.id,
          model: body.selectedChatModel,
          hasMessage: !!body.message,
          hasApiKey: !!body.apiKey,
          hasGithubToken: !!body.githubToken,
        });

        return { body };
      },
    }),
    onData: (dataPart) => {
      console.log("[Chat Client] Data received:", dataPart.type);
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      console.log("[Chat Client] ✅ Stream finished");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error("[Chat Client] ❌ Error:", error);
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      } else {
        toast({
          type: "error",
          description: error.message || "An error occurred",
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl flex-col gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && apiKeysLoaded && !hasCurrentModelApiKey && currentModel && (
            <MissingAPIKeyBanner provider={currentModel.provider} />
          )}
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
              isDisabled={!hasCurrentModelApiKey}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
