/**
 * Tool Builder Module
 *
 * Dynamically builds provider-specific tools and options based on model capabilities.
 * Supports built-in tools from Anthropic, OpenAI, and Google SDKs.
 */

import type { ModelConfig } from "@/lib/db/schema";
import type { ProviderType } from "./providers";
import { createImageGenerationTool } from "./tools/image-generation";

/**
 * Build provider-specific tools based on model capabilities
 *
 * @param provider - The AI provider (anthropic, google, openai)
 * @param capabilities - Model capabilities from database
 * @param providerInstance - The provider instance (created with API key)
 * @param apiKey - API key for custom tools (like image generation)
 * @returns Object with tool definitions
 */
export function buildProviderTools(
  provider: ProviderType,
  capabilities: ModelConfig["capabilities"],
  providerInstance: any,
  apiKey?: string
): Record<string, any> {
  const tools: Record<string, any> = {};

  if (!capabilities) {
    console.log("[Tool Builder] No capabilities defined for model");
    return tools;
  }

  console.log("[Tool Builder] Building tools for provider:", provider, {
    codeExecution: capabilities.codeExecution?.enabled,
    webSearch: capabilities.webSearch?.enabled,
    urlContext: capabilities.urlContext?.enabled,
  });

  // Code Execution Tool
  if (capabilities.codeExecution?.enabled) {
    if (provider === "anthropic") {
      // Anthropic Code Execution: anthropic.tools.codeExecution_20250825()
      tools.code_execution = providerInstance.tools.codeExecution_20250825();
      console.log("[Tool Builder] ✅ Added Anthropic code execution tool");
    } else if (provider === "openai") {
      // OpenAI Code Interpreter: openai.tools.codeInterpreter()
      tools.code_interpreter = providerInstance.tools.codeInterpreter({});
      console.log("[Tool Builder] ✅ Added OpenAI code interpreter tool");
    } else if (provider === "google") {
      // Google Code Execution: google.tools.codeExecution()
      tools.code_execution = providerInstance.tools.codeExecution({});
      console.log("[Tool Builder] ✅ Added Google code execution tool");
    }
  }

  // Web Search Tool
  if (capabilities.webSearch?.enabled) {
    if (provider === "anthropic") {
      // Anthropic Web Search: anthropic.tools.webSearch_20250305()
      tools.web_search = providerInstance.tools.webSearch_20250305({
        maxUses: 5, // Limit number of searches per request
      });
      console.log("[Tool Builder] ✅ Added Anthropic web search tool");
    } else if (provider === "openai") {
      // OpenAI Web Search: openai.tools.webSearch()
      tools.web_search = providerInstance.tools.webSearch({});
      console.log("[Tool Builder] ✅ Added OpenAI web search tool");
    } else if (provider === "google") {
      // Google Search: google.tools.googleSearch()
      tools.google_search = providerInstance.tools.googleSearch({});
      console.log("[Tool Builder] ✅ Added Google search tool");
    }
  }

  // URL Context Tool (Google only)
  if (capabilities.urlContext?.enabled && provider === "google") {
    // Google URL Context: google.tools.urlContext()
    tools.url_context = providerInstance.tools.urlContext({});
    console.log("[Tool Builder] ✅ Added Google URL context tool");
  }

  // Image Generation Tool (OpenAI only)
  if (capabilities.imageGeneration?.enabled && provider === "openai" && apiKey) {
    // Custom DALL-E 3 image generation tool
    tools.image_generation = createImageGenerationTool(apiKey);
    console.log("[Tool Builder] ✅ Added OpenAI image generation tool (DALL-E 3)");
  }

  const toolCount = Object.keys(tools).length;
  console.log(`[Tool Builder] Built ${toolCount} provider tools`);

  return tools;
}

/**
 * Build provider-specific options for streamText/generateText
 *
 * @param provider - The AI provider
 * @param capabilities - Model capabilities from database
 * @param providerConfig - Provider-specific configuration
 * @returns Provider options object or undefined
 */
export function buildProviderOptions(
  provider: ProviderType,
  capabilities: ModelConfig["capabilities"],
  providerConfig: ModelConfig["providerConfig"]
): Record<string, any> | undefined {
  if (!capabilities) {
    return undefined;
  }

  console.log("[Provider Options] Building options for:", provider, {
    thinking: capabilities.thinking?.enabled,
    budgetTokens: capabilities.thinking?.budgetTokens,
  });

  // Google-specific options
  if (provider === "google") {
    const options: any = {};

    // Thinking configuration
    if (capabilities.thinking?.enabled) {
      options.thinkingConfig = {
        thinkingBudget: capabilities.thinking.budgetTokens || 8192,
        includeThoughts: true,
      };
      console.log(
        "[Provider Options] ✅ Added Google thinking config:",
        options.thinkingConfig
      );
    }

    // Safety settings (if configured)
    if (providerConfig?.safetySettings) {
      // Convert object format to array format required by Google API
      const settings = providerConfig.safetySettings;
      options.safetySettings = [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: settings.hate || "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: settings.dangerous || "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: settings.harassment || "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: settings.explicit || "BLOCK_MEDIUM_AND_ABOVE",
        },
      ];
      console.log("[Provider Options] ✅ Added safety settings (array format)");
    }

    return Object.keys(options).length > 0 ? { google: options } : undefined;
  }

  // OpenAI-specific options
  if (provider === "openai") {
    const options: any = {};

    // Reasoning effort for o-series models (o1, o3, etc.)
    if (providerConfig?.reasoningEffort) {
      options.reasoningSummary = providerConfig.reasoningEffort;
      console.log(
        "[Provider Options] ✅ Added OpenAI reasoning effort:",
        providerConfig.reasoningEffort
      );
    }

    return Object.keys(options).length > 0 ? { openai: options } : undefined;
  }

  // Anthropic-specific options
  if (provider === "anthropic") {
    const options: any = {};

    // Thinking configuration (for models with extended thinking)
    if (capabilities.thinking?.enabled && capabilities.thinking.budgetTokens) {
      options.thinking = {
        type: "enabled",
        budgetTokens: capabilities.thinking.budgetTokens,
      };
      console.log(
        "[Provider Options] ✅ Added Anthropic thinking config:",
        options.thinking
      );
    }

    return Object.keys(options).length > 0
      ? { anthropic: options }
      : undefined;
  }

  return undefined;
}

/**
 * Build tool-specific prompts to add to system prompt
 *
 * @param capabilities - Model capabilities
 * @param toolPrompts - Custom prompts from database
 * @param userThinkingEnabled - Whether user has enabled thinking
 * @returns Array of prompt strings to append to system prompt
 */
export function buildToolPrompts(
  capabilities: ModelConfig["capabilities"],
  toolPrompts: ModelConfig["toolPrompts"],
  userThinkingEnabled: boolean
): string[] {
  const prompts: string[] = [];

  if (!capabilities) {
    return prompts;
  }

  // Thinking prompt (only if user enabled)
  if (userThinkingEnabled && capabilities.thinking?.enabled) {
    const prompt =
      toolPrompts?.thinking ||
      "You have access to extended thinking capabilities. Use them for complex reasoning, analysis, and problem-solving tasks.";
    prompts.push(prompt);
  }

  // Code execution prompt
  if (capabilities.codeExecution?.enabled) {
    const prompt =
      toolPrompts?.codeExecution ||
      "You have access to a Python code execution environment. You can write and run Python code to perform calculations, data analysis, and solve complex problems.";
    prompts.push(prompt);
  }

  // Web search prompt
  if (capabilities.webSearch?.enabled) {
    const prompt =
      toolPrompts?.webSearch ||
      "You can search the web for current information, news, and real-time data. Use this when you need up-to-date information beyond your knowledge cutoff.";
    prompts.push(prompt);
  }

  // File input prompt
  if (capabilities.fileInputs?.enabled) {
    const prompt =
      toolPrompts?.fileInput ||
      "Users can upload files for you to analyze. You can read and process various file types including images, documents, and code files.";
    prompts.push(prompt);
  }

  // Image generation prompt
  if (capabilities.imageGeneration?.enabled) {
    const prompt =
      toolPrompts?.imageGeneration ||
      "You can generate images from text descriptions using AI image generation. Describe images in detail for best results.";
    prompts.push(prompt);
  }

  // URL context prompt
  if (capabilities.urlContext?.enabled) {
    const prompt =
      toolPrompts?.urlContext ||
      "You can analyze content from specific URLs. When users provide URLs, you can fetch and analyze the content.";
    prompts.push(prompt);
  }

  console.log(`[Tool Prompts] Built ${prompts.length} tool prompts`);

  return prompts;
}
