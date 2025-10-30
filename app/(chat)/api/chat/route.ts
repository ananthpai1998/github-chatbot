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
import { getModelWithCapabilities, hasCapability } from "@/lib/ai/model-loader";
import { type RequestHints, systemPrompt, getRequestPromptFromHints } from "@/lib/ai/prompts";
import { getLanguageModel, createProviderInstance, myProvider, type ProviderType } from "@/lib/ai/providers";
import { buildProviderTools, buildProviderOptions, buildToolPrompts } from "@/lib/ai/tool-builder";
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
import { logUsage, calculateCost } from "@/lib/db/usage-queries";
import { isThinkingEnabledForUser } from "@/lib/db/user-preferences-queries";
import { getAgentById, getAllTools } from "@/lib/db/admin-queries";
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

    // Get model configuration from database (with capabilities)
    const dbModelConfig = await getModelWithCapabilities(selectedChatModel);

    // Fallback to static config if not in database
    const modelConfig = dbModelConfig || getModelById(selectedChatModel);

    if (!modelConfig) {
      console.error("[Chat API] ❌ Invalid model:", selectedChatModel);
      return new ChatSDKError(
        "bad_request:api",
        "Invalid model selected"
      ).toResponse();
    }

    // Check if model is enabled (only for database-configured models)
    if (dbModelConfig && !dbModelConfig.isEnabled) {
      console.error("[Chat API] ❌ Model disabled:", selectedChatModel);
      return new ChatSDKError(
        "bad_request:api",
        "This model is currently disabled by the administrator"
      ).toResponse();
    }

    console.log("[Chat API] ✅ Model config loaded:", {
      provider: modelConfig.provider,
      modelId: modelConfig.modelId,
      supportsTools: modelConfig.supportsTools,
      hasCapabilities: !!dbModelConfig?.capabilities,
      source: dbModelConfig ? "database" : "static",
      isEnabled: dbModelConfig?.isEnabled ?? true,
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
    let capturedActiveToolNames: string[] = []; // Capture tool names for usage logging

    console.log("[Chat API] Creating UI message stream...");
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        console.log("[Chat API] Stream execute started");

        // Get the appropriate model instance and provider
        console.log("[Chat API] Initializing language model...", {
          isTest: isTestEnvironment,
          provider: modelConfig.provider,
          modelId: modelConfig.modelId,
        });

        let model;
        let providerInstance;

        if (isTestEnvironment) {
          model = myProvider?.languageModel(selectedChatModel);
        } else {
          // Create provider instance for tool building
          providerInstance = createProviderInstance(
            modelConfig.provider as ProviderType,
            apiKey
          );
          model = providerInstance(modelConfig.modelId);
        }

        if (!model) {
          console.error("[Chat API] ❌ Failed to initialize language model");
          throw new Error("Failed to initialize language model");
        }
        console.log("[Chat API] ✅ Language model initialized");

        // Load tool configurations from database
        console.log("[Chat API] Loading tool configurations...");
        const toolConfigs = await getAllTools();
        const toolConfigMap = new Map(toolConfigs.map(tc => [tc.id, tc]));
        console.log(`[Chat API] Loaded ${toolConfigs.length} tool configs`);

        // Initialize base tools with their configurations
        const baseTools: Record<string, any> = {};

        // Only include enabled tools
        if (toolConfigMap.get('getWeather')?.isEnabled !== false) {
          console.log("[Chat API] ✓ Adding getWeather tool");
          baseTools.getWeather = getWeather;
        } else {
          console.log("[Chat API] ✗ Skipping getWeather (disabled)");
        }

        if (toolConfigMap.get('createDocument')?.isEnabled !== false) {
          console.log("[Chat API] ✓ Adding createDocument tool");
          const createDocConfig = toolConfigMap.get('createDocument');
          console.log("[Chat API] createDocument config:", {
            isEnabled: createDocConfig?.isEnabled,
            hasToolPrompts: !!createDocConfig?.toolPrompts,
            description: createDocConfig?.toolPrompts?.description?.substring(0, 50),
          });
          baseTools.createDocument = createDocument({
            user,
            dataStream,
            toolConfig: createDocConfig
          });
        } else {
          console.log("[Chat API] ✗ Skipping createDocument (disabled)");
        }

        if (toolConfigMap.get('updateDocument')?.isEnabled !== false) {
          console.log("[Chat API] ✓ Adding updateDocument tool");
          baseTools.updateDocument = updateDocument({
            user,
            dataStream,
            toolConfig: toolConfigMap.get('updateDocument')
          });
        } else {
          console.log("[Chat API] ✗ Skipping updateDocument (disabled)");
        }

        if (toolConfigMap.get('requestSuggestions')?.isEnabled !== false) {
          console.log("[Chat API] ✓ Adding requestSuggestions tool");
          baseTools.requestSuggestions = requestSuggestions({
            user,
            dataStream,
            toolConfig: toolConfigMap.get('requestSuggestions')
          });
        } else {
          console.log("[Chat API] ✗ Skipping requestSuggestions (disabled)");
        }

        const baseToolNames = Object.keys(baseTools);
        console.log("[Chat API] Base tools enabled:", baseToolNames);
        console.log("[Chat API] Base tools count:", baseToolNames.length);

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

        // Build provider-specific tools (code execution, web search, etc.)
        let providerTools: Record<string, any> = {};
        if (!isTestEnvironment && providerInstance && dbModelConfig?.capabilities) {
          try {
            console.log("[Chat API] Building provider-specific tools...");
            providerTools = buildProviderTools(
              modelConfig.provider as ProviderType,
              dbModelConfig.capabilities,
              providerInstance,
              apiKey // Pass API key for custom tools like image generation
            );
            console.log(`[Chat API] Built ${Object.keys(providerTools).length} provider tools`);
          } catch (error) {
            console.error("[Chat API] Failed to build provider tools:", error);
            // Continue without provider tools if building fails
          }
        }

        // Load agent configuration (chatModel agent)
        const agentConfig = await getAgentById("chatModel");
        console.log("[Chat API] Agent config loaded:", {
          name: agentConfig?.name,
          enabledTools: agentConfig?.enabledTools,
          hasSystemPrompt: !!agentConfig?.systemPrompt,
          systemPromptLength: agentConfig?.systemPrompt?.length,
        });

        // Merge all tools
        const allTools = { ...baseTools, ...githubTools, ...providerTools };
        const providerToolNames = Object.keys(providerTools);

        // Filter tools based on agent's enabledTools + provider tools
        let activeToolNames: string[] = [];
        if (modelConfig.supportsTools !== false) {
          if (agentConfig?.enabledTools && agentConfig.enabledTools.length > 0) {
            // Use agent's enabled tools + provider tools (if admin enabled)
            const agentToolNames = agentConfig.enabledTools.filter(
              (toolName) => {
                const exists = toolName in allTools;
                console.log(`[Chat API] Checking agent tool "${toolName}": ${exists ? "✓ found" : "✗ not found"}`);
                return exists;
              }
            );
            activeToolNames = [...agentToolNames, ...providerToolNames];
            console.log("[Chat API] Using agent-filtered tools:", {
              agentTools: agentToolNames,
              providerTools: providerToolNames,
              totalActive: activeToolNames.length,
            });
          } else {
            // No agent filtering, use all tools
            activeToolNames = [...baseToolNames, ...githubToolNames, ...providerToolNames];
            console.log("[Chat API] No agent filtering, using all tools:", activeToolNames);
          }
        } else {
          console.log("[Chat API] Model does not support tools");
        }

        console.log("[Chat API] === FINAL ACTIVE TOOLS ===");
        console.log("[Chat API] Active tool names:", activeToolNames);
        console.log("[Chat API] Active tools count:", activeToolNames.length);

        // Capture for usage logging
        capturedActiveToolNames = activeToolNames;

        // Build provider options (for thinking, etc.)
        const providerOptions = !isTestEnvironment && dbModelConfig
          ? buildProviderOptions(
              modelConfig.provider as ProviderType,
              dbModelConfig.capabilities,
              dbModelConfig.providerConfig
            )
          : undefined;

        // Build enhanced system prompt with tool prompts
        // Get user's thinking preference from database
        const userThinkingEnabled = await isThinkingEnabledForUser(user.id);
        console.log("[Chat API] User thinking enabled:", userThinkingEnabled);

        // Build tool prompt additions based on capabilities
        const toolPromptAdditions = dbModelConfig
          ? buildToolPrompts(
              dbModelConfig.capabilities,
              dbModelConfig.toolPrompts,
              userThinkingEnabled
            )
          : [];

        // Add tool-specific prompts from ToolConfig for enabled tools
        const toolSpecificPrompts: string[] = [];
        for (const toolId of activeToolNames) {
          const toolCfg = toolConfigMap.get(toolId);
          if (toolCfg?.toolPrompts) {
            const prompts = [];
            if (toolCfg.toolPrompts.description) {
              prompts.push(`**${toolCfg.name}**: ${toolCfg.toolPrompts.description}`);
            }
            if (toolCfg.toolPrompts.usageGuidelines) {
              prompts.push(`Usage: ${toolCfg.toolPrompts.usageGuidelines}`);
            }
            if (toolCfg.toolPrompts.examples) {
              prompts.push(`Examples: ${toolCfg.toolPrompts.examples}`);
            }
            if (prompts.length > 0) {
              toolSpecificPrompts.push(prompts.join('\n'));
            }
          }
        }

        if (toolSpecificPrompts.length > 0) {
          toolPromptAdditions.push(`\n## Available Tools\n\n${toolSpecificPrompts.join('\n\n')}`);
        }

        console.log(`[Chat API] Added ${toolSpecificPrompts.length} tool-specific prompts`);

        // Build system prompt from agent config
        const agentBasePrompt = agentConfig?.systemPrompt || systemPrompt({ selectedChatModel, requestHints });

        // Append request hints
        const requestPrompt = getRequestPromptFromHints(requestHints);
        const agentPromptWithHints = `${agentBasePrompt}\n\n${requestPrompt}`;

        // Add model-specific base prompt if available (for provider-specific instructions)
        const modelToolPromptBase = dbModelConfig?.toolPrompts?.base;
        const baseWithModel = modelToolPromptBase
          ? `${agentPromptWithHints}\n\n${modelToolPromptBase}`
          : agentPromptWithHints;

        // Append capability-specific tool prompts
        const enhancedSystemPrompt = toolPromptAdditions.length > 0
          ? `${baseWithModel}\n\n${toolPromptAdditions.join("\n\n")}`
          : baseWithModel;

        console.log("[Chat API] System prompt construction:", {
          hasAgentConfig: !!agentConfig,
          hasAgentSystemPrompt: !!agentConfig?.systemPrompt,
          agentPromptLength: agentBasePrompt.length,
          hasModelToolPromptBase: !!modelToolPromptBase,
          modelPromptLength: modelToolPromptBase?.length || 0,
          toolPromptAdditionsCount: toolPromptAdditions.length,
          finalPromptLength: enhancedSystemPrompt.length,
          includesArtifactsPrompt: enhancedSystemPrompt.includes("createDocument"),
        });

        // Temporary: Print full system prompt for debugging
        console.log("[Chat API] === FULL SYSTEM PROMPT ===");
        console.log(enhancedSystemPrompt);
        console.log("[Chat API] === END SYSTEM PROMPT ===");

        console.log("[Chat API] Starting streamText with:", {
          toolCount: Object.keys(allTools).length,
          activeToolsCount: activeToolNames.length,
          messageCount: uiMessages.length,
          hasProviderOptions: !!providerOptions,
          toolPromptCount: toolPromptAdditions.length,
        });

        // Verify tool structure
        console.log("[Chat API] === TOOL VERIFICATION ===");
        for (const toolName of activeToolNames) {
          const toolObj = allTools[toolName];
          console.log(`[Chat API] Tool "${toolName}":`, {
            exists: !!toolObj,
            type: typeof toolObj,
            hasDescription: !!(toolObj?.description),
            hasParameters: !!(toolObj?.parameters),
            hasExecute: !!(toolObj?.execute),
            actualKeys: toolObj ? Object.keys(toolObj) : [],
          });

          // Debug: Log the actual tool object structure
          if (toolName === "createDocument") {
            console.log("[Chat API] createDocument full structure:", JSON.stringify(toolObj, null, 2));
          }
        }
        console.log("[Chat API] === END TOOL VERIFICATION ===");

        console.log("[Chat API] About to call streamText with:", {
          modelProvider: modelConfig.provider,
          modelId: modelConfig.id,
          toolsCount: Object.keys(allTools).length,
          activeToolsCount: activeToolNames.length,
          messagesCount: uiMessages.length,
        });

        let result;
        try {
          result = streamText({
            model,
            system: enhancedSystemPrompt,
            messages: convertToModelMessages(uiMessages),
            stopWhen: stepCountIs(5),
            experimental_activeTools: activeToolNames,
            experimental_transform: smoothStream({ chunking: "word" }),
            tools: allTools,
            providerOptions, // Add provider options for thinking, code execution, etc.
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
          console.log("[Chat API] streamText call successful, result object created");
        } catch (error) {
          console.error("[Chat API] ❌ Error calling streamText:", error);
          console.error("[Chat API] Error details:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }

        result.consumeStream();
        console.log("[Chat API] Stream consumption started");

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
        console.log("[Chat API] Data stream merged with UI message stream");
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

            // Log usage to database for analytics
            const cost = calculateCost(finalMergedUsage, dbModelConfig?.pricing);
            const assistantMessage = messages.find(m => m.role === "assistant");

            // Map AI SDK usage properties to our schema
            const inputTokens = (finalMergedUsage as any).promptTokens ?? 0;
            const outputTokens = (finalMergedUsage as any).completionTokens ?? 0;

            await logUsage({
              userId: user.id,
              chatId: id,
              messageId: assistantMessage?.id,
              modelId: selectedChatModel,
              provider: modelConfig.provider,
              inputTokens,
              outputTokens,
              totalTokens: finalMergedUsage.totalTokens ?? 0,
              estimatedCost: cost,
              currency: "USD",
              toolsUsed: capturedActiveToolNames,
              toolCallCount: 0, // Could be enhanced to track actual tool calls
              metadata: {
                modelIdActual: (finalMergedUsage as any).modelId,
                contextWindow: modelConfig.contextWindow,
              },
            });
            console.log("[Chat API] ✅ Usage logged:", {
              tokens: finalMergedUsage.totalTokens,
              cost: cost.toFixed(6),
            });
          } catch (err) {
            console.warn("Unable to persist usage data:", err);
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
