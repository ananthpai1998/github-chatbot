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
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    description:
      "Latest experimental Gemini model with multimodal capabilities",
    provider: "google",
    modelId: "gemini-2.0-flash-exp",
    contextWindow: 1000000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: "gemini-exp-1206",
    name: "Gemini Experimental",
    description: "Experimental Gemini model with enhanced reasoning",
    provider: "google",
    modelId: "gemini-exp-1206",
    contextWindow: 200000,
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
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Previous generation with strong reasoning capabilities",
    provider: "openai",
    modelId: "gpt-4-turbo",
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
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
