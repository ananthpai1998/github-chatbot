"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { createProviderInstance } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Use a simple prompt-based title generation
  // Extract first text content from the message
  let messageText = "";

  if ("content" in message && typeof message.content === "string") {
    messageText = message.content;
  } else if ("parts" in message && Array.isArray(message.parts)) {
    const textPart = message.parts.find((part: any) => part.type === "text") as any;
    if (textPart && "text" in textPart) {
      messageText = textPart.text;
    }
  }

  // Generate a simple title from the first few words
  if (!messageText) {
    return "New Chat";
  }

  const words = messageText.split(" ").slice(0, 10).join(" ");
  const title = words.length > 50 ? words.substring(0, 50) + "..." : words;

  return title || "New Chat";
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
