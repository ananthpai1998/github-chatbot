/**
 * Script to update tool prompts in existing tool configurations
 * Run this script to add detailed prompts to existing tools
 *
 * Usage: npx tsx scripts/update-tool-prompts.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { updateToolConfig } from "../lib/db/admin-queries";

async function updateToolPrompts() {
  console.log("========================================");
  console.log("Updating Tool Prompts");
  console.log("========================================\n");

  const updates = [
    {
      id: "createDocument",
      toolPrompts: {
        description: "Creates artifacts that appear in a dedicated panel. Use for documents, Mermaid diagrams, code, or spreadsheets. When user asks for 'diagram' or 'flowchart', use kind='text' with Mermaid syntax.",
        usageGuidelines: "ALWAYS use this tool when user requests: diagrams, flowcharts, documents, code examples, or data tables. For diagrams, use kind='text' and write Mermaid syntax. Do not say you cannot create these - you have the tool to do so.",
        examples: "User: 'create a flowchart' → Call createDocument with kind='text', then generate Mermaid flowchart syntax. User: 'write code to sort array' → Call createDocument with kind='code', then generate Python code.",
      },
    },
    {
      id: "updateDocument",
      toolPrompts: {
        description: "Updates existing documents/artifacts with new content or modifications. Use to edit, improve, or revise documents that were previously created.",
        usageGuidelines: "Use when user asks to modify, update, or improve existing documents. Always specify the documentId of the document to update.",
        examples: "User: 'update the diagram to add error handling' → Call updateDocument with documentId and new content. User: 'fix the code' → Call updateDocument to revise the code.",
      },
    },
    {
      id: "requestSuggestions",
      toolPrompts: {
        description: "Generates AI-powered editing suggestions to improve document quality, clarity, and style.",
        usageGuidelines: "Use when user asks for suggestions, improvements, or feedback on a document. Provides up to 5 targeted suggestions with descriptions.",
        examples: "User: 'suggest improvements for this document' → Call requestSuggestions with documentId. User: 'how can I make this better?' → Use this tool to generate suggestions.",
      },
    },
  ];

  try {
    for (const update of updates) {
      await updateToolConfig(update.id, {
        toolPrompts: update.toolPrompts,
      });
      console.log(`  ✓ Updated prompts for: ${update.id}`);
    }

    console.log("\n========================================");
    console.log(`✅ Successfully updated ${updates.length} tool prompts!`);
    console.log("========================================");
    process.exit(0);
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ Update failed:");
    console.error(error);
    console.error("========================================");
    process.exit(1);
  }
}

updateToolPrompts();
