import type { User } from "@supabase/supabase-js";

/**
 * Check if a user has admin role
 * Admin role is stored in user_metadata.role
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;

  // Check user_metadata for role field
  const role = user.user_metadata?.role;
  return role === "admin";
}

/**
 * Require admin access - throws error if user is not admin
 */
export function requireAdmin(user: User | null | undefined): asserts user is User {
  if (!user) {
    throw new Error("Authentication required");
  }

  if (!isAdmin(user)) {
    throw new Error("Admin access required");
  }
}

/**
 * Get user role
 */
export function getUserRole(user: User | null | undefined): "admin" | "user" | null {
  if (!user) return null;

  const role = user.user_metadata?.role;
  if (role === "admin") return "admin";
  return "user";
}
