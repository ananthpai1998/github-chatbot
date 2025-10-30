import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion, ToolConfig } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { myProvider } from "../providers";

type RequestSuggestionsProps = {
  user: User;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  toolConfig?: ToolConfig;
};

export const requestSuggestions = ({
  user,
  dataStream,
  toolConfig,
}: RequestSuggestionsProps) => {
  const description = toolConfig?.toolPrompts?.description ||
    "Request suggestions for a document";

  console.log("[requestSuggestions Tool] Initializing with config:", {
    hasToolConfig: !!toolConfig,
    description: description.substring(0, 100) + "...",
    hasUsageGuidelines: !!toolConfig?.toolPrompts?.usageGuidelines,
    hasExamples: !!toolConfig?.toolPrompts?.examples,
  });

  return tool({
    description,
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
    }),
    execute: async ({ documentId }) => {
      console.log("[requestSuggestions Tool] EXECUTE CALLED!", {
        documentId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        console.error("[requestSuggestions Tool] ❌ Document not found or has no content:", documentId);
        return {
          error: "Document not found",
        };
      }

      console.log("[requestSuggestions Tool] Document found:", {
        id: document.id,
        title: document.title,
        kind: document.kind,
        contentLength: document.content.length,
      });

      if (!myProvider) {
        throw new Error("Suggestion generation is not available in production mode without a configured provider");
      }

      const suggestions: Omit<
        Suggestion,
        "userId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const { elementStream } = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
        prompt: document.content,
        output: "array",
        schema: z.object({
          originalSentence: z.string().describe("The original sentence"),
          suggestedSentence: z.string().describe("The suggested sentence"),
          description: z.string().describe("The description of the suggestion"),
        }),
      });

      for await (const element of elementStream) {
        // @ts-expect-error todo: fix type
        const suggestion: Suggestion = {
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          documentId,
          isResolved: false,
        };

        dataStream.write({
          type: "data-suggestion",
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      if (user?.id) {
        const userId = user.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            userId,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        });
        console.log("[requestSuggestions Tool] Saved suggestions to database:", suggestions.length);
      }

      const result = {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Suggestions have been added to the document",
      };

      console.log("[requestSuggestions Tool] ✅ Suggestions generated successfully:", {
        documentId,
        suggestionsCount: suggestions.length,
      });

      return result;
    },
  });
};
