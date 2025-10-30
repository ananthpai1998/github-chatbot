import { desc, eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminAuditLog, type AdminAuditLog } from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ========== Admin Audit Log Queries ==========

export interface LogAdminActionParams {
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: "model" | "tool" | "agent" | "settings";
  resourceId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

/**
 * Log an admin action for audit purposes
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  await db.insert(adminAuditLog).values({
    adminId: params.adminId,
    adminEmail: params.adminEmail,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    changes: {
      before: params.before,
      after: params.after,
    },
  });
}

/**
 * Get audit log entries for a specific resource
 */
export async function getAuditLogForResource(
  resourceType: string,
  resourceId: string,
  limit = 50
): Promise<AdminAuditLog[]> {
  return await db
    .select()
    .from(adminAuditLog)
    .where(
      and(
        eq(adminAuditLog.resourceType, resourceType),
        eq(adminAuditLog.resourceId, resourceId)
      )
    )
    .orderBy(desc(adminAuditLog.timestamp))
    .limit(limit);
}

/**
 * Get recent audit log entries (for admin dashboard)
 */
export async function getRecentAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  return await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.timestamp))
    .limit(limit);
}

/**
 * Get audit logs for a specific admin user
 */
export async function getAuditLogsByAdmin(
  adminId: string,
  limit = 100
): Promise<AdminAuditLog[]> {
  return await db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.adminId, adminId))
    .orderBy(desc(adminAuditLog.timestamp))
    .limit(limit);
}
