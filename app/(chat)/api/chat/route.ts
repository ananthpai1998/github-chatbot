import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { createClient } from "@/lib/supabase/server";
import type { VisibilityType } from "@/components/visibility-selector";
import { defaultEntitlements } from "@/lib/ai/entitlements";
import { getModelById, type ChatModel } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel, myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { createGitHubTools } from "@/lib/ai/tools/github-tools";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment, isTestEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  console.log("[Chat API] ========== NEW CHAT REQUEST ==========");
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log("[Chat API] Request body received:", {
      hasId: !!json.id,
      hasMessage: !!json.message,
      selectedChatModel: json.selectedChatModel,
      hasApiKey: !!json.apiKey,
      hasGithubToken: !!json.githubToken,
    });
    requestBody = postRequestBodySchema.parse(json);
    console.log("[Chat API] ✅ Request body validation passed");
  } catch (error) {
    console.error("[Chat API] ❌ Request validation failed:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      apiKey,
      githubToken,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
      apiKey: string;
      githubToken?: string;
    } = requestBody;

    console.log("[Chat API] Processing chat:", {
      chatId: id,
      model: selectedChatModel,
      messageId: message.id,
      visibility: selectedVisibilityType,
    });

    // Get model configuration
    const modelConfig = getModelById(selectedChatModel);
    if (!modelConfig) {
      console.error("[Chat API] ❌ Invalid model:", selectedChatModel);
      return new ChatSDKError(
        "bad_request:api",
        "Invalid model selected"
      ).toResponse();
    }
    console.log("[Chat API] ✅ Model config loaded:", {
      provider: modelConfig.provider,
      modelId: modelConfig.modelId,
      supportsTools: modelConfig.supportsTools,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("[Chat API] ❌ No authenticated user found");
      return new ChatSDKError("unauthorized:chat").toResponse();
    }
    console.log("[Chat API] ✅ User authenticated:", {
      userId: user.id,
      email: user.email,
    });

    const messageCount = await getMessageCountByUserId({
      id: user.id,
      differenceInHours: 24,
    });
    console.log("[Chat API] Message count (24h):", messageCount);

    // Check rate limit (for self-hosted with API keys, we allow unlimited, but keeping the check for future use)
    if (defaultEntitlements.maxMessagesPerDay > 0 && messageCount > defaultEntitlements.maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await getChatById({ id });
    console.log("[Chat API] Chat lookup:", chat ? "exists" : "new chat");

    if (chat) {
      if (chat.userId !== user.id) {
        console.error("[Chat API] ❌ Forbidden: User doesn't own this chat");
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      console.log("[Chat API] ✅ Using existing chat");
    } else {
      console.log("[Chat API] Creating new chat...");
      const title = await generateTitleFromUserMessage({
        message,
      });
      console.log("[Chat API] Generated title:", title);

      try {
        await saveChat({
          id,
          userId: user.id,
          title,
          visibility: selectedVisibilityType,
        });
        console.log("[Chat API] ✅ Chat saved to database");
      } catch (error) {
        console.error("[Chat API] ❌ Failed to save chat:", error);
        throw error;
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    console.log("[Chat API] Messages from DB:", messagesFromDb.length);
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    console.log("[Chat API] Total messages for context:", uiMessages.length);

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log("[Chat API] Saving user message to DB...");
    try {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
      console.log("[Chat API] ✅ User message saved");
    } catch (error) {
      console.error("[Chat API] ❌ Failed to save message:", error);
      throw error;
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    console.log("[Chat API] Stream ID created:", streamId);

    let finalMergedUsage: AppUsage | undefined;

    console.log("[Chat API] Creating UI message stream...");
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        console.log("[Chat API] Stream execute started");
        // Get the appropriate model instance
        console.log("[Chat API] Initializing language model...", {
          isTest: isTestEnvironment,
          provider: modelConfig.provider,
          modelId: modelConfig.modelId,
        });

        const model = isTestEnvironment
          ? myProvider?.languageModel(selectedChatModel)
          : getLanguageModel(
              modelConfig.provider,
              modelConfig.modelId,
              apiKey
            );

        if (!model) {
          console.error("[Chat API] ❌ Failed to initialize language model");
          throw new Error("Failed to initialize language model");
        }
        console.log("[Chat API] ✅ Language model initialized");

        // Initialize base tools
        const baseTools: Record<string, any> = {
          getWeather,
          createDocument: createDocument({ user, dataStream }),
          updateDocument: updateDocument({ user, dataStream }),
          requestSuggestions: requestSuggestions({
            user,
            dataStream,
          }),
        };

        const baseToolNames = Object.keys(baseTools);

        // Load GitHub tools if token is provided
        let githubTools: Record<string, any> = {};
        let githubToolNames: string[] = [];

        if (githubToken && modelConfig.supportsTools !== false) {
          try {
            console.log("[Chat API] Loading GitHub MCP tools...");
            githubTools = await createGitHubTools(githubToken);
            githubToolNames = Object.keys(githubTools);
            console.log(`[Chat API] Loaded ${githubToolNames.length} GitHub tools`);
          } catch (error) {
            console.error("[Chat API] Failed to load GitHub tools:", error);
            // Continue without GitHub tools if initialization fails
          }
        }

        // Merge tools
        const allTools = { ...baseTools, ...githubTools };
        const activeToolNames = modelConfig.supportsTools !== false
          ? [...baseToolNames, ...githubToolNames]
          : [];

        console.log("[Chat API] Starting streamText with:", {
          toolCount: Object.keys(allTools).length,
          activeToolsCount: activeToolNames.length,
          messageCount: uiMessages.length,
        });

        const result = streamText({
          model,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools: activeToolNames,
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: allTools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            console.log("[Chat API] Stream finished, processing usage...");
            try {
              const providers = await getTokenlensCatalog();
              const modelId = modelConfig.modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
