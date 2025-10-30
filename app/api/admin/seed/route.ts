import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { chatModels } from "@/lib/ai/models";
import { artifactsPrompt, regularPrompt } from "@/lib/ai/prompts";
import { knownPricing } from "@/lib/admin/pricing-sync";
import {
  insertAgentConfig,
  insertModelConfig,
  insertToolConfig,
  getAllModels,
  getAllAgents,
  getAllTools,
} from "@/lib/db/admin-queries";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    // Check if already seeded
    const existingModels = await getAllModels();
    const existingAgents = await getAllAgents();
    const existingTools = await getAllTools();

    if (existingModels.length > 0 || existingAgents.length > 0 || existingTools.length > 0) {
      return NextResponse.json({
        error: "Database already seeded. Clear tables first if you want to re-seed.",
      }, { status: 400 });
    }

    // Helper function to get capabilities for each model
    const getModelCapabilities = (modelId: string, provider: string) => {
      // Anthropic capabilities
      if (provider === "anthropic") {
        if (modelId.includes("opus-4") || modelId.includes("sonnet-4") || modelId.includes("3-7-sonnet")) {
          return {
            thinking: { enabled: true, budgetTokens: 8192 },
            fileInputs: { enabled: true },
            codeExecution: { enabled: true },
            webSearch: { enabled: true },
            urlContext: { enabled: true },
            imageGeneration: { enabled: false },
          };
        }
        // Other Claude models have limited capabilities
        return {
          thinking: { enabled: false },
          fileInputs: { enabled: true },
          codeExecution: { enabled: false },
          webSearch: { enabled: true },
          urlContext: { enabled: true },
          imageGeneration: { enabled: false },
        };
      }

      // OpenAI capabilities
      if (provider === "openai") {
        // O-series models (reasoning models)
        if (modelId.startsWith("o")) {
          return {
            thinking: { enabled: true, budgetTokens: 32000 },
            fileInputs: { enabled: false },
            codeExecution: { enabled: false },
            webSearch: { enabled: false },
            urlContext: { enabled: false },
            imageGeneration: { enabled: false },
          };
        }
        // GPT models with full capabilities
        return {
          thinking: { enabled: false },
          fileInputs: { enabled: true },
          codeExecution: { enabled: true },
          webSearch: { enabled: true },
          urlContext: { enabled: false },
          imageGeneration: { enabled: true },
        };
      }

      // Google capabilities
      if (provider === "google") {
        if (modelId.includes("2.5")) {
          return {
            thinking: { enabled: true, budgetTokens: 8192 },
            fileInputs: { enabled: true },
            codeExecution: { enabled: true },
            webSearch: { enabled: true },
            urlContext: { enabled: true },
            imageGeneration: { enabled: modelId.includes("image") },
          };
        }
        if (modelId.includes("2.0")) {
          return {
            thinking: { enabled: false },
            fileInputs: { enabled: true },
            codeExecution: { enabled: false },
            webSearch: { enabled: true },
            urlContext: { enabled: true },
            imageGeneration: { enabled: false },
          };
        }
        // Gemini 1.5 models
        return {
          thinking: { enabled: false },
          fileInputs: { enabled: true },
          codeExecution: { enabled: false },
          webSearch: { enabled: false },
          urlContext: { enabled: false },
          imageGeneration: { enabled: false },
        };
      }

      return null;
    };

    // Helper function to get provider-specific config
    const getProviderConfig = (modelId: string, provider: string) => {
      if (provider === "openai" && modelId.startsWith("o")) {
        return { reasoningEffort: "medium" as const };
      }
      if (provider === "google") {
        return {
          safetySettings: {
            hate: "BLOCK_MEDIUM_AND_ABOVE" as const,
            dangerous: "BLOCK_MEDIUM_AND_ABOVE" as const,
            harassment: "BLOCK_MEDIUM_AND_ABOVE" as const,
            explicit: "BLOCK_MEDIUM_AND_ABOVE" as const,
          },
        };
      }
      return null;
    };

    // Seed models
    for (const model of chatModels) {
      const providerPricing = knownPricing[model.provider as keyof typeof knownPricing];
      const pricing = providerPricing?.[model.id as keyof typeof providerPricing] || null;

      await insertModelConfig({
        id: model.id,
        provider: model.provider,
        name: model.name,
        description: model.description || "",
        modelId: model.modelId,
        contextWindow: model.contextWindow,
        isEnabled: true,
        supportsVision: model.supportsVision || false,
        supportsTools: model.supportsTools || false,
        capabilities: getModelCapabilities(model.modelId, model.provider),
        providerConfig: getProviderConfig(model.modelId, model.provider),
        allowedFileTypes: model.supportsVision ? ["image/jpeg", "image/png", "image/webp", "image/gif"] : [],
        toolPrompts: null,
        pricing: pricing,
        metadata: null,
      });
    }

    // Seed agents
    const agents = [
      {
        id: "chatModel",
        name: "Chat Model",
        description: "Main conversation agent with artifact support",
        systemPrompt: `${regularPrompt}\n\n${artifactsPrompt}`,
        defaultModelId: "claude-3-5-sonnet-20241022",
        enabledTools: ["createDocument", "updateDocument", "requestSuggestions", "getWeather", "github_tools"],
        config: null,
        status: "active" as const,
      },
      {
        id: "artifactModel",
        name: "Artifact Model",
        description: "Specialized model for creating and editing artifacts",
        systemPrompt: artifactsPrompt,
        defaultModelId: "claude-3-5-sonnet-20241022",
        enabledTools: ["createDocument", "updateDocument"],
        config: null,
        status: "active" as const,
      },
      {
        id: "titleModel",
        name: "Title Generation Model",
        description: "Generates concise chat titles from conversations",
        systemPrompt: "Generate a concise, descriptive title for the given conversation. The title should be 3-7 words and capture the main topic.",
        defaultModelId: "claude-3-5-haiku-20241022",
        enabledTools: [],
        config: null,
        status: "active" as const,
      },
      {
        id: "reasoningModel",
        name: "Reasoning Model",
        description: "O1-style reasoning model without tool support",
        systemPrompt: regularPrompt,
        defaultModelId: "o1-preview",
        enabledTools: [],
        config: null,
        status: "active" as const,
      },
      {
        id: "planningModel",
        name: "Planning Model",
        description: "Feature development planning and task breakdown",
        systemPrompt: "You are a planning assistant that helps break down features into actionable tasks.",
        defaultModelId: null,
        enabledTools: [],
        config: null,
        status: "coming_soon" as const,
      },
      {
        id: "summaryModel",
        name: "Chat History Summary Model",
        description: "Summarizes long chat histories for context compression",
        systemPrompt: "Summarize the following conversation history, preserving key information and context.",
        defaultModelId: null,
        enabledTools: [],
        config: null,
        status: "coming_soon" as const,
      },
    ];

    for (const agent of agents) {
      await insertAgentConfig(agent);
    }

    // Seed tools
    const tools = [
      {
        id: "createDocument",
        name: "Create Document",
        description: "Creates new documents/artifacts for writing and content creation",
        category: "document",
        isEnabled: true,
        parameters: { supportedKinds: ["text", "code", "image", "sheet"] },
        costPerCall: "0.001",
        rateLimitPerMinute: 10,
        rateLimitPerHour: 100,
        metadata: { autoSave: true },
      },
      {
        id: "updateDocument",
        name: "Update Document",
        description: "Updates existing documents with new content or modifications",
        category: "document",
        isEnabled: true,
        parameters: { supportedModes: ["full_rewrite", "targeted_update"] },
        costPerCall: "0.001",
        rateLimitPerMinute: 10,
        rateLimitPerHour: 100,
        metadata: { autoSave: true },
      },
      {
        id: "requestSuggestions",
        name: "Request Suggestions",
        description: "Generates editing suggestions for document improvements",
        category: "document",
        isEnabled: true,
        parameters: { maxSuggestions: 5 },
        costPerCall: "0.0005",
        rateLimitPerMinute: 10,
        rateLimitPerHour: 50,
        metadata: null,
      },
      {
        id: "getWeather",
        name: "Get Weather",
        description: "Retrieves current weather information for a city",
        category: "utility",
        isEnabled: true,
        parameters: { timeout: 5000, provider: "Open-Meteo" },
        costPerCall: "0",
        rateLimitPerMinute: 30,
        rateLimitPerHour: 300,
        metadata: { free: true },
      },
      {
        id: "github_tools",
        name: "GitHub Tools (MCP)",
        description: "Access to GitHub operations via Model Context Protocol",
        category: "integration",
        isEnabled: true,
        parameters: {
          requiresToken: true,
          availableOperations: ["repos", "issues", "pull_requests", "files", "branches", "commits"],
        },
        costPerCall: "0",
        rateLimitPerMinute: 20,
        rateLimitPerHour: 200,
        metadata: { mcpServer: "@modelcontextprotocol/server-github", requiresAuth: true },
      },
    ];

    for (const tool of tools) {
      await insertToolConfig(tool);
    }

    return NextResponse.json({
      success: true,
      seeded: {
        models: chatModels.length,
        agents: agents.length,
        tools: tools.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed database";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}
