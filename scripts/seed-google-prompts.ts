/**
 * Script to seed Google-specific prompts for Gemini models
 * Adds optimized prompts to all Google models in the database
 *
 * Usage: npx tsx scripts/seed-google-prompts.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { getAllModels, updateModelConfig } from "../lib/db/admin-queries";
import {
  googleBasePrompt,
  googleThinkingPrompt,
  googleFileInputPrompt,
  googleCodeExecutionPrompt,
  googleWebSearchPrompt,
  googleUrlContextPrompt,
} from "../lib/ai/prompts";

async function seedGooglePrompts() {
  console.log("========================================");
  console.log("Seeding Google-Specific Prompts");
  console.log("========================================\n");

  try {
    const models = await getAllModels();
    const googleModels = models.filter((model) => model.provider === "google");

    console.log(`Found ${googleModels.length} Google models\n`);

    let updatedCount = 0;

    for (const model of googleModels) {
      console.log(`Updating ${model.name} (${model.id})...`);

      const toolPrompts = {
        base: googleBasePrompt,
        thinking: model.capabilities?.thinking?.enabled ? googleThinkingPrompt : undefined,
        fileInput: model.capabilities?.fileInputs?.enabled ? googleFileInputPrompt : undefined,
        codeExecution: model.capabilities?.codeExecution?.enabled
          ? googleCodeExecutionPrompt
          : undefined,
        webSearch: model.capabilities?.webSearch?.enabled ? googleWebSearchPrompt : undefined,
        urlContext: model.capabilities?.urlContext?.enabled ? googleUrlContextPrompt : undefined,
      };

      await updateModelConfig(model.id, {
        toolPrompts,
      });

      console.log(`  ✓ Updated with ${Object.keys(toolPrompts).filter(k => toolPrompts[k as keyof typeof toolPrompts]).length} prompts`);
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} Google models`);
    console.log("\nPrompts added:");
    console.log("- Base system prompt (all models)");
    console.log("- Thinking prompt (models with thinking enabled)");
    console.log("- File input prompt (models with file inputs enabled)");
    console.log("- Code execution prompt (models with code execution enabled)");
    console.log("- Web search prompt (models with web search enabled)");
    console.log("- URL context prompt (models with URL context enabled)");
  } catch (error) {
    console.error("\n❌ Failed to seed Google prompts:");
    console.error(error);
    process.exit(1);
  }
}

seedGooglePrompts();
