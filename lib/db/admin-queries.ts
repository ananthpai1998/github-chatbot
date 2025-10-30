import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  type AgentConfig,
  agentConfig,
  type AppSettings,
  appSettings,
  type ModelConfig,
  type ModelCapabilities,
  type ProviderConfig,
  modelConfig,
  type ToolConfig,
  toolConfig,
} from "./schema";

// Lazy initialization to ensure env vars are loaded
let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL environment variable is not set");
    }
    client = postgres(process.env.POSTGRES_URL);
    db = drizzle(client);
  }
  return db;
}

// ========== Model Configuration Queries ==========

export async function getAllModels(): Promise<ModelConfig[]> {
  return await getDb().select().from(modelConfig);
}

export async function getModelById(id: string): Promise<ModelConfig | undefined> {
  const result = await getDb().select().from(modelConfig).where(eq(modelConfig.id, id));
  return result[0];
}

export async function updateModelConfig(
  id: string,
  data: Partial<Omit<ModelConfig, "id" | "createdAt">>
): Promise<void> {
  console.log("[DB] Updating model config:", id);
  console.log("[DB] Data to update:", {
    capabilities: data.capabilities,
    allowedFileTypes: data.allowedFileTypes,
    toolPrompts: data.toolPrompts,
    hasOtherFields: Object.keys(data).filter(k => !['capabilities', 'allowedFileTypes', 'toolPrompts'].includes(k)),
  });

  const result = await getDb()
    .update(modelConfig)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(modelConfig.id, id));

  console.log("[DB] ✓ Update complete");
}

export async function updateModelCapabilities(
  id: string,
  capabilities: ModelConfig["capabilities"]
): Promise<void> {
  await getDb()
    .update(modelConfig)
    .set({
      capabilities,
      updatedAt: new Date(),
    })
    .where(eq(modelConfig.id, id));
}

export async function updateModelProviderConfig(
  id: string,
  providerConfig: ModelConfig["providerConfig"]
): Promise<void> {
  await getDb()
    .update(modelConfig)
    .set({
      providerConfig,
      updatedAt: new Date(),
    })
    .where(eq(modelConfig.id, id));
}

export async function toggleModelEnabled(id: string, enabled: boolean): Promise<void> {
  await getDb()
    .update(modelConfig)
    .set({
      isEnabled: enabled,
      updatedAt: new Date(),
    })
    .where(eq(modelConfig.id, id));
}

export async function insertModelConfig(data: Omit<ModelConfig, "createdAt" | "updatedAt">): Promise<void> {
  await getDb().insert(modelConfig).values(data);
}

// ========== Agent Configuration Queries ==========

export async function getAllAgents(): Promise<AgentConfig[]> {
  return await getDb().select().from(agentConfig);
}

export async function getAgentById(id: string): Promise<AgentConfig | undefined> {
  const result = await getDb().select().from(agentConfig).where(eq(agentConfig.id, id));
  return result[0];
}

export async function updateAgentConfig(
  id: string,
  data: Partial<Omit<AgentConfig, "id" | "createdAt">>
): Promise<void> {
  await getDb()
    .update(agentConfig)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(agentConfig.id, id));
}

export async function updateAgentTools(id: string, toolIds: string[]): Promise<void> {
  await getDb()
    .update(agentConfig)
    .set({
      enabledTools: toolIds,
      updatedAt: new Date(),
    })
    .where(eq(agentConfig.id, id));
}

export async function insertAgentConfig(data: Omit<AgentConfig, "createdAt" | "updatedAt">): Promise<void> {
  await getDb().insert(agentConfig).values(data);
}

// ========== Tool Configuration Queries ==========

export async function getAllTools(): Promise<ToolConfig[]> {
  return await getDb().select().from(toolConfig);
}

export async function getToolById(id: string): Promise<ToolConfig | undefined> {
  const result = await getDb().select().from(toolConfig).where(eq(toolConfig.id, id));
  return result[0];
}

export async function updateToolConfig(
  id: string,
  data: Partial<Omit<ToolConfig, "id" | "createdAt">>
): Promise<void> {
  await getDb()
    .update(toolConfig)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(toolConfig.id, id));
}

export async function toggleToolEnabled(id: string, enabled: boolean): Promise<void> {
  await getDb()
    .update(toolConfig)
    .set({
      isEnabled: enabled,
      updatedAt: new Date(),
    })
    .where(eq(toolConfig.id, id));
}

export async function insertToolConfig(data: Omit<ToolConfig, "createdAt" | "updatedAt">): Promise<void> {
  await getDb().insert(toolConfig).values(data);
}

// ========== App Settings Queries ==========

export async function getSetting(key: string): Promise<AppSettings | undefined> {
  const result = await getDb().select().from(appSettings).where(eq(appSettings.key, key));
  return result[0];
}

export async function setSetting(
  key: string,
  value: any,
  category: string,
  updatedBy?: string
): Promise<void> {
  // Try to update first
  const existing = await getSetting(key);

  if (existing) {
    await getDb()
      .update(appSettings)
      .set({
        value,
        category,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(appSettings.key, key));
  } else {
    // Insert if doesn't exist
    await getDb().insert(appSettings).values({
      key,
      value,
      category,
      updatedBy,
    });
  }
}

export async function getAllSettings(): Promise<AppSettings[]> {
  return await getDb().select().from(appSettings);
}

export async function getSettingsByCategory(category: string): Promise<AppSettings[]> {
  return await getDb().select().from(appSettings).where(eq(appSettings.category, category));
}
