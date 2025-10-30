import type { ProviderType } from "./providers";

export const DEFAULT_CHAT_MODEL = "claude-3-5-sonnet-20241022" as const;

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  provider: ProviderType;
  modelId: string; // The actual model ID used by the provider
  contextWindow: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
};

// Anthropic Claude Models
export const claudeModels: ChatModel[] = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description:
      "Latest generation Claude with advanced thinking and multimodal capabilities",
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    description:
      "Enhanced Claude 3 with improved reasoning and code understanding",
    provider: "anthropic",
    modelId: "claude-3-7-sonnet-20250219",
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    description:
      "Most intelligent model with best reasoning, coding, and analysis capabilities",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "Fast and efficient model for everyday tasks",
    provider: "anthropic",
    modelId: "claude-3-5-haiku-20241022",
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Previous generation flagship model with powerful capabilities",
    provider: "anthropic",
    modelId: "claude-3-opus-20240229",
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
];

// Google Gemini Models
export const geminiModels: ChatModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Latest flagship Gemini with advanced thinking and multimodal capabilities",
    provider: "google",
    modelId: "gemini-2.5-pro",
    contextWindow: 2000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description:
      "Fast and efficient Gemini 2.5 with enhanced performance",
    provider: "google",
    modelId: "gemini-2.5-flash",
    contextWindow: 1000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description:
      "Lightweight version optimized for speed and efficiency",
    provider: "google",
    modelId: "gemini-2.5-flash-lite",
    contextWindow: 1000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description:
      "Stable Gemini 2.0 model with multimodal capabilities",
    provider: "google",
    modelId: "gemini-2.0-flash",
    contextWindow: 1000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Powerful model with long context window",
    provider: "google",
    modelId: "gemini-1.5-pro-latest",
    contextWindow: 2000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast and efficient model for quick responses",
    provider: "google",
    modelId: "gemini-1.5-flash-latest",
    contextWindow: 1000000,
    supportsVision: true,
    supportsTools: true,
  },
];

// OpenAI GPT Models
export const gptModels: ChatModel[] = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "Latest GPT-4.1 with improved reasoning and tool use",
    provider: "openai",
    modelId: "gpt-4.1",
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    description: "Efficient GPT-4.1 variant for everyday tasks",
    provider: "openai",
    modelId: "gpt-4.1-mini",
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable GPT model with vision and tool use",
    provider: "openai",
    modelId: "gpt-4o",
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Affordable and efficient model for everyday tasks",
    provider: "openai",
    modelId: "gpt-4o-mini",
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "o3",
    name: "o3",
    description: "Advanced reasoning model with configurable reasoning effort",
    provider: "openai",
    modelId: "o3",
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    description: "Efficient reasoning model for complex problem-solving",
    provider: "openai",
    modelId: "o4-mini",
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
  {
    id: "o1-preview",
    name: "o1 Preview",
    description: "Advanced reasoning model (no tools or vision)",
    provider: "openai",
    modelId: "o1-preview",
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
  {
    id: "o1-mini",
    name: "o1 Mini",
    description: "Efficient reasoning model (no tools or vision)",
    provider: "openai",
    modelId: "o1-mini",
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
];

// All available chat models
export const chatModels: ChatModel[] = [
  ...claudeModels,
  ...geminiModels,
  ...gptModels,
];

// Helper function to get model by ID
export function getModelById(modelId: string): ChatModel | undefined {
  return chatModels.find((model) => model.id === modelId);
}

// Helper function to get models by provider
export function getModelsByProvider(provider: ProviderType): ChatModel[] {
  return chatModels.filter((model) => model.provider === provider);
}
