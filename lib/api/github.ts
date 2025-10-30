/**
 * GitHub API utilities for searching and fetching repositories
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

/**
 * Search GitHub repositories accessible by the authenticated user
 */
export async function searchRepositories(
  query: string,
  token: string,
  options?: {
    limit?: number;
    sort?: "stars" | "forks" | "updated";
    order?: "asc" | "desc";
  }
): Promise<GitHubRepository[]> {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  if (!query || query.trim().length === 0) {
    // If no query, fetch user's repositories
    return fetchUserRepositories(token, options?.limit || 30);
  }

  const limit = options?.limit || 30;
  const sort = options?.sort || "updated";
  const order = options?.order || "desc";

  try {
    const searchParams = new URLSearchParams({
      q: `${query} in:name`,
      per_page: limit.toString(),
      sort,
      order,
    });

    const response = await fetch(
      `https://api.github.com/search/repositories?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Chatbot",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data: GitHubSearchResponse = await response.json();
    return data.items;
  } catch (error) {
    console.error("Error searching repositories:", error);
    throw error;
  }
}

/**
 * Fetch repositories for the authenticated user
 */
export async function fetchUserRepositories(
  token: string,
  limit: number = 30
): Promise<GitHubRepository[]> {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  try {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${limit}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Chatbot",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data: GitHubRepository[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user repositories:", error);
    throw error;
  }
}

/**
 * Fetch branches for a specific repository
 */
export async function fetchRepositoryBranches(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubBranch[]> {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitHub-Chatbot",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data: GitHubBranch[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching repository branches:", error);
    throw error;
  }
}

/**
 * Verify GitHub token validity
 */
export async function verifyGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Chatbot",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error verifying GitHub token:", error);
    return false;
  }
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser(token: string) {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Chatbot",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching authenticated user:", error);
    throw error;
  }
}
