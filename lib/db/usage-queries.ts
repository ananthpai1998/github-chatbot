import { desc, eq, sql, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { AppUsage } from "../usage";
import { usageLog, type UsageLog } from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ========== Usage Log Queries ==========

export interface CreateUsageLogParams {
  userId: string;
  chatId: string;
  messageId?: string;
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number;
  currency?: string;
  toolsUsed?: string[];
  toolCallCount?: number;
  responseTimeMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Log a usage entry for an AI API call
 */
export async function logUsage(params: CreateUsageLogParams): Promise<void> {
  await db.insert(usageLog).values({
    userId: params.userId,
    chatId: params.chatId,
    messageId: params.messageId,
    modelId: params.modelId,
    provider: params.provider,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens: params.totalTokens,
    estimatedCost: params.estimatedCost?.toString() || "0",
    currency: params.currency || "USD",
    toolsUsed: params.toolsUsed || [],
    toolCallCount: params.toolCallCount || 0,
    responseTimeMs: params.responseTimeMs,
    metadata: params.metadata || null,
  });
}

/**
 * Get usage logs for a specific user
 */
export async function getUserUsageLogs(
  userId: string,
  limit = 100
): Promise<UsageLog[]> {
  return await db
    .select()
    .from(usageLog)
    .where(eq(usageLog.userId, userId))
    .orderBy(desc(usageLog.createdAt))
    .limit(limit);
}

/**
 * Get usage logs for a specific chat
 */
export async function getChatUsageLogs(chatId: string): Promise<UsageLog[]> {
  return await db
    .select()
    .from(usageLog)
    .where(eq(usageLog.chatId, chatId))
    .orderBy(desc(usageLog.createdAt));
}

/**
 * Get aggregated usage statistics for a user
 */
export async function getUserUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { messages: number; tokens: number; cost: number }>;
  byTool: Record<string, number>;
}> {
  // Build where conditions
  const conditions = [eq(usageLog.userId, userId)];

  if (startDate) {
    conditions.push(gte(usageLog.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(usageLog.createdAt, endDate));
  }

  const logs = await db
    .select()
    .from(usageLog)
    .where(and(...conditions));

  const stats = {
    totalMessages: logs.length,
    totalTokens: 0,
    totalCost: 0,
    byModel: {} as Record<string, { messages: number; tokens: number; cost: number }>,
    byTool: {} as Record<string, number>,
  };

  for (const log of logs) {
    stats.totalTokens += log.totalTokens;
    stats.totalCost += Number.parseFloat(log.estimatedCost || "0");

    // Aggregate by model
    if (!stats.byModel[log.modelId]) {
      stats.byModel[log.modelId] = { messages: 0, tokens: 0, cost: 0 };
    }
    stats.byModel[log.modelId].messages += 1;
    stats.byModel[log.modelId].tokens += log.totalTokens;
    stats.byModel[log.modelId].cost += Number.parseFloat(log.estimatedCost || "0");

    // Aggregate by tool
    if (log.toolsUsed) {
      for (const tool of log.toolsUsed) {
        stats.byTool[tool] = (stats.byTool[tool] || 0) + 1;
      }
    }
  }

  return stats;
}

/**
 * Get recent usage activity (for admin dashboard)
 */
export async function getRecentUsageActivity(limit = 50): Promise<UsageLog[]> {
  return await db
    .select()
    .from(usageLog)
    .orderBy(desc(usageLog.createdAt))
    .limit(limit);
}

/**
 * Calculate estimated cost from usage and pricing
 */
export function calculateCost(
  usage: AppUsage,
  pricing?: { inputPerMillion: number; outputPerMillion: number } | null
): number {
  if (!pricing) return 0;

  // AppUsage has promptTokens and completionTokens from TokenLens enrichment
  const usageAny = usage as any;
  const inputCost = ((usageAny.promptTokens || 0) / 1000000) * pricing.inputPerMillion;
  const outputCost = ((usageAny.completionTokens || 0) / 1000000) * pricing.outputPerMillion;

  return inputCost + outputCost;
}
