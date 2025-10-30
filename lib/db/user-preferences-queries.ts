/**
 * User Preferences Database Queries
 *
 * Manages user-specific preferences like thinking toggle state
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { userPreferences, type UserPreferences } from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Get user preferences by user ID
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const [result] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return result || null;
}

/**
 * Create or update user preferences
 */
export async function upsertUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<UserPreferences> {
  // Try to get existing preferences
  const existing = await getUserPreferences(userId);

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(userPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    return updated;
  } else {
    // Create new
    const [created] = await db
      .insert(userPreferences)
      .values({
        userId,
        ...updates,
      })
      .returning();

    return created;
  }
}

/**
 * Toggle thinking enabled state for a user
 */
export async function toggleUserThinking(
  userId: string,
  enabled: boolean
): Promise<UserPreferences> {
  return upsertUserPreferences(userId, { thinkingEnabled: enabled });
}

/**
 * Get user's thinking enabled state
 */
export async function isThinkingEnabledForUser(
  userId: string
): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return prefs?.thinkingEnabled ?? false;
}
