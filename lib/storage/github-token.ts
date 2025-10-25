export type GitHubTokenSource = "oauth" | "manual";

const GITHUB_TOKEN_KEY = "devmate_github_token";
const GITHUB_TOKEN_SOURCE_KEY = "devmate_github_token_source";

/**
 * Get GitHub token from localStorage
 */
export function getGitHubToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  } catch (error) {
    console.error("Error reading GitHub token:", error);
    return null;
  }
}

/**
 * Save GitHub token to localStorage
 */
export function saveGitHubToken(
  token: string,
  source: GitHubTokenSource = "manual"
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
    localStorage.setItem(GITHUB_TOKEN_SOURCE_KEY, source);
  } catch (error) {
    console.error("Error saving GitHub token:", error);
    throw new Error("Failed to save GitHub token");
  }
}

/**
 * Get the source of the GitHub token (OAuth or manual)
 */
export function getGitHubTokenSource(): GitHubTokenSource | null {
  if (typeof window === "undefined") return null;

  try {
    return (localStorage.getItem(GITHUB_TOKEN_SOURCE_KEY) as GitHubTokenSource) || null;
  } catch (error) {
    console.error("Error reading GitHub token source:", error);
    return null;
  }
}

/**
 * Delete GitHub token from localStorage
 */
export function deleteGitHubToken(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    localStorage.removeItem(GITHUB_TOKEN_SOURCE_KEY);
  } catch (error) {
    console.error("Error deleting GitHub token:", error);
  }
}

/**
 * Check if GitHub token exists
 */
export function hasGitHubToken(): boolean {
  return getGitHubToken() !== null;
}

/**
 * Validate GitHub token format
 */
export function validateGitHubTokenFormat(token: string): boolean {
  // GitHub Personal Access Tokens start with ghp_
  // GitHub OAuth tokens start with gho_
  // GitHub fine-grained tokens start with github_pat_
  return (
    token.startsWith("ghp_") ||
    token.startsWith("gho_") ||
    token.startsWith("github_pat_")
  );
}

/**
 * Get masked version of GitHub token for display
 */
export function maskGitHubToken(token: string): string {
  if (!token || token.length < 8) return "***";
  return `${token.substring(0, 8)}...`;
}
