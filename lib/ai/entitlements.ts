import { chatModels, type ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

// All users have the same entitlements (no guest mode)
// Users provide their own API keys, so all models are available
export const defaultEntitlements: Entitlements = {
  maxMessagesPerDay: -1, // Unlimited for self-hosted with own API keys
  availableChatModelIds: chatModels.map((model) => model.id), // All models available
};
