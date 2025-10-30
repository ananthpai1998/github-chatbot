import { tool, type UIMessageStreamWriter } from "ai";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import { getDocumentById } from "@/lib/db/queries";
import type { ToolConfig } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";

type UpdateDocumentProps = {
  user: User;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  toolConfig?: ToolConfig;
};

export const updateDocument = ({ user, dataStream, toolConfig }: UpdateDocumentProps) => {
  const description = toolConfig?.toolPrompts?.description ||
    "Update a document with the given description.";

  console.log("[updateDocument Tool] Initializing with config:", {
    hasToolConfig: !!toolConfig,
    description: description.substring(0, 100) + "...",
    hasUsageGuidelines: !!toolConfig?.toolPrompts?.usageGuidelines,
    hasExamples: !!toolConfig?.toolPrompts?.examples,
  });

  return tool({
    description,
    inputSchema: z.object({
      id: z.string().describe("The ID of the document to update"),
      description: z
        .string()
        .describe("The description of changes that need to be made"),
    }),
    execute: async ({ id, description }) => {
      console.log("[updateDocument Tool] EXECUTE CALLED!", {
        id,
        description: description.substring(0, 100),
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const document = await getDocumentById({ id });

      if (!document) {
        console.error("[updateDocument Tool] ❌ Document not found:", id);
        return {
          error: "Document not found",
        };
      }

      console.log("[updateDocument Tool] Document found:", {
        id: document.id,
        title: document.title,
        kind: document.kind,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind
      );

      if (!documentHandler) {
        console.error("[updateDocument Tool] ❌ No handler found for kind:", document.kind);
        console.error("[updateDocument Tool] Available handlers:",
          documentHandlersByArtifactKind.map(h => h.kind)
        );
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      console.log("[updateDocument Tool] Handler found, calling onUpdateDocument...");

      try {
        await documentHandler.onUpdateDocument({
          document,
          description,
          dataStream,
          user,
        });
        console.log("[updateDocument Tool] ✅ Document updated successfully");
      } catch (error) {
        console.error("[updateDocument Tool] ❌ Error in document handler:", error);
        throw error;
      }

      dataStream.write({ type: "data-finish", data: null, transient: true });

      const result = {
        id,
        title: document.title,
        kind: document.kind,
        content: "The document has been updated successfully.",
      };

      console.log("[updateDocument Tool] Returning result:", result);
      return result;
    },
  });
};
