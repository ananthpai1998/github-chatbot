/**
 * Script to seed tool configurations
 * Run this script to populate initial data for tool_config table
 *
 * Usage: npx tsx scripts/seed-tools.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { insertToolConfig } from "../lib/db/admin-queries";

async function seedTools() {
  console.log("========================================");
  console.log("Seeding Tool Configurations");
  console.log("========================================\n");

  const tools = [
    {
      id: "createDocument",
      name: "Create Document",
      description: "Creates new documents/artifacts for writing and content creation. Use this tool to create documents, diagrams (using Mermaid syntax), code snippets, or spreadsheets that will be displayed in a dedicated panel for the user.",
      category: "document",
      isEnabled: true,
      parameters: {
        supportedKinds: ["text", "code", "image", "sheet"],
      },
      costPerCall: "0.001",
      rateLimitPerMinute: 10,
      rateLimitPerHour: 100,
      metadata: { autoSave: true },
      toolPrompts: {
        description: "Creates artifacts that appear in a dedicated panel. Use for documents, Mermaid diagrams, code, or spreadsheets. When user asks for 'diagram' or 'flowchart', use kind='text' with Mermaid syntax.",
        usageGuidelines: "ALWAYS use this tool when user requests: diagrams, flowcharts, documents, code examples, or data tables. For diagrams, use kind='text' and write Mermaid syntax. Do not say you cannot create these - you have the tool to do so.",
        examples: "User: 'create a flowchart' → Call createDocument with kind='text', then generate Mermaid flowchart syntax. User: 'write code to sort array' → Call createDocument with kind='code', then generate Python code.",
      },
    },
    {
      id: "updateDocument",
      name: "Update Document",
      description: "Updates existing documents with new content or modifications",
      category: "document",
      isEnabled: true,
      parameters: {
        supportedModes: ["full_rewrite", "targeted_update"],
      },
      costPerCall: "0.001",
      rateLimitPerMinute: 10,
      rateLimitPerHour: 100,
      metadata: { autoSave: true },
    },
    {
      id: "requestSuggestions",
      name: "Request Suggestions",
      description: "Generates editing suggestions for document improvements",
      category: "document",
      isEnabled: true,
      parameters: {
        maxSuggestions: 5,
      },
      costPerCall: "0.0005",
      rateLimitPerMinute: 10,
      rateLimitPerHour: 50,
      metadata: null,
    },
    {
      id: "getWeather",
      name: "Get Weather",
      description: "Retrieves current weather information for a city",
      category: "utility",
      isEnabled: true,
      parameters: {
        timeout: 5000,
        provider: "Open-Meteo",
      },
      costPerCall: "0",
      rateLimitPerMinute: 30,
      rateLimitPerHour: 300,
      metadata: { free: true },
    },
    {
      id: "github_tools",
      name: "GitHub Tools (MCP)",
      description: "Access to GitHub operations via Model Context Protocol",
      category: "integration",
      isEnabled: true,
      parameters: {
        requiresToken: true,
        availableOperations: [
          "repos",
          "issues",
          "pull_requests",
          "files",
          "branches",
          "commits",
        ],
      },
      costPerCall: "0",
      rateLimitPerMinute: 20,
      rateLimitPerHour: 200,
      metadata: {
        mcpServer: "@modelcontextprotocol/server-github",
        requiresAuth: true,
      },
    },
  ];

  try {
    for (const tool of tools) {
      await insertToolConfig(tool);
      console.log(`  ✓ Seeded tool: ${tool.name}`);
    }

    console.log("\n========================================");
    console.log(`✅ Successfully seeded ${tools.length} tools!`);
    console.log("========================================");
    process.exit(0);
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ Seeding failed:");
    console.error(error);
    console.error("========================================");
    process.exit(1);
  }
}

seedTools();
