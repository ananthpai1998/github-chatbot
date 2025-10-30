/**
 * Script to update the chatModel agent system prompt
 * Run this after updating the artifacts prompt in lib/ai/prompts.ts
 *
 * Usage: npx tsx scripts/update-agent-prompt.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { artifactsPrompt, regularPrompt } from "../lib/ai/prompts";
import { updateAgentConfig } from "../lib/db/admin-queries";

async function updateAgentPrompt() {
  console.log("========================================");
  console.log("Updating chatModel Agent System Prompt");
  console.log("========================================\n");

  try {
    const newSystemPrompt = `${regularPrompt}\n\n${artifactsPrompt}`;

    console.log("New system prompt length:", newSystemPrompt.length);
    console.log("Updating database...\n");

    await updateAgentConfig("chatModel", {
      systemPrompt: newSystemPrompt,
    });

    console.log("✅ Successfully updated chatModel agent system prompt");
    console.log("\nPlease restart your application to pick up the changes.");
  } catch (error) {
    console.error("❌ Update failed:");
    console.error(error);
    process.exit(1);
  }
}

updateAgentPrompt();
