import { getGitHubMCPClient, type GitHubMCPClientConfig } from "@/lib/mcp/github-client";
import {
  convertMCPToolsToAISDK,
  formatMCPToolResult,
  getGitHubToolDescription,
} from "@/lib/mcp/tool-converter";

/**
 * Create GitHub tools for use with Vercel AI SDK
 *
 * This function connects to the GitHub MCP server and converts
 * all available tools to the AI SDK format.
 *
 * @param githubToken - GitHub Personal Access Token
 * @returns Object containing all GitHub tools in AI SDK format
 */
export async function createGitHubTools(
  githubToken: string
): Promise<Record<string, any>> {
  try {
    // Create MCP client configuration
    const config: GitHubMCPClientConfig = {
      githubToken,
    };

    // Get or create MCP client
    const mcpClient = await getGitHubMCPClient(config);

    // Get available tools from MCP server
    const mcpTools = mcpClient.getTools();

    console.log(`[GitHub Tools] Loaded ${mcpTools.length} tools from MCP server`);

    // Create executor function that calls MCP client
    const executor = async (toolName: string, args: any) => {
      console.log(`[GitHub Tools] Executing ${toolName} with args:`, args);

      try {
        const result = await mcpClient.callTool(toolName, args);

        // Format the result for display
        const formattedResult = formatMCPToolResult(result);

        console.log(`[GitHub Tools] ${toolName} completed successfully`);

        return formattedResult;
      } catch (error: any) {
        console.error(`[GitHub Tools] ${toolName} failed:`, error);
        throw error;
      }
    };

    // Convert MCP tools to AI SDK format
    const aiTools = convertMCPToolsToAISDK(mcpTools, executor);

    // Enhance tool descriptions with friendly names
    for (const [toolName, tool] of Object.entries(aiTools)) {
      if (!tool.description || tool.description.startsWith("GitHub tool:")) {
        tool.description = getGitHubToolDescription(toolName);
      }
    }

    return aiTools;
  } catch (error) {
    console.error("[GitHub Tools] Failed to create GitHub tools:", error);

    // Return empty object if GitHub tools can't be initialized
    // This allows the chat to continue working without GitHub integration
    return {};
  }
}

/**
 * Get a list of commonly used GitHub tool names
 * Useful for limiting which tools are active in the chat
 */
export function getCommonGitHubTools(): string[] {
  return [
    // Repository operations
    "get_repository",
    "list_repositories",
    "search_repositories",

    // Issue operations
    "create_issue",
    "get_issue",
    "list_issues",
    "update_issue",
    "search_issues",

    // Pull request operations
    "create_pull_request",
    "get_pull_request",
    "list_pull_requests",

    // File operations
    "get_file_contents",
    "search_code",

    // Branch operations
    "list_branches",

    // Commit operations
    "list_commits",
  ];
}

/**
 * Check if GitHub MCP server is available
 * This can be used to show/hide GitHub features in the UI
 */
export async function isGitHubMCPAvailable(): Promise<boolean> {
  try {
    // Try to spawn the MCP server process
    // This is a quick check without establishing full connection
    const { spawn } = await import("child_process");
    const process = spawn("npx", ["-y", "@modelcontextprotocol/server-github", "--help"]);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        process.kill();
        resolve(false);
      }, 5000);

      process.on("spawn", () => {
        clearTimeout(timeout);
        process.kill();
        resolve(true);
      });

      process.on("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}
