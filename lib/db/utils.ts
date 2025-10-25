import { generateId } from "ai";

// Note: Password hashing is now handled by Supabase Auth
// These functions are kept for backward compatibility but are no longer used

export function generateHashedPassword(password: string) {
  // Supabase handles password hashing internally
  // This function is deprecated and should not be used
  return password;
}

export function generateDummyPassword() {
  // Generate a random ID for dummy password
  // In Supabase context, this is not needed as auth is managed externally
  const password = generateId();
  return password;
}
