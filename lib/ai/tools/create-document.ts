import { tool, type UIMessageStreamWriter } from "ai";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
import type { ToolConfig } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

type CreateDocumentProps = {
  user: User;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  toolConfig?: ToolConfig;
};

export const createDocument = ({ user, dataStream, toolConfig }: CreateDocumentProps) => {
  // Use custom description from database if available, otherwise fallback to default
  const description = toolConfig?.toolPrompts?.description ||
    "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.";

  console.log("[createDocument Tool] Initializing with config:", {
    hasToolConfig: !!toolConfig,
    description: description.substring(0, 100) + "...",
    hasUsageGuidelines: !!toolConfig?.toolPrompts?.usageGuidelines,
    hasExamples: !!toolConfig?.toolPrompts?.examples,
  });

  return tool({
    description,
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      console.log("[createDocument Tool] EXECUTE CALLED!", {
        title,
        kind,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const id = generateUUID();
      console.log("[createDocument Tool] Generated document ID:", id);

      dataStream.write({
        type: "data-kind",
        data: kind,
        transient: true,
      });

      dataStream.write({
        type: "data-id",
        data: id,
        transient: true,
      });

      dataStream.write({
        type: "data-title",
        data: title,
        transient: true,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind
      );

      if (!documentHandler) {
        console.error("[createDocument Tool] ❌ No handler found for kind:", kind);
        console.error("[createDocument Tool] Available handlers:",
          documentHandlersByArtifactKind.map(h => h.kind)
        );
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      console.log("[createDocument Tool] Handler found, calling onCreateDocument...");

      try {
        await documentHandler.onCreateDocument({
          id,
          title,
          dataStream,
          user,
        });
        console.log("[createDocument Tool] ✅ Document created successfully");
      } catch (error) {
        console.error("[createDocument Tool] ❌ Error in document handler:", error);
        throw error;
      }

      dataStream.write({ type: "data-finish", data: null, transient: true });

      const result = {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      };

      console.log("[createDocument Tool] Returning result:", result);
      return result;
    },
  });
};
