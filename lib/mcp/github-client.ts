import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * GitHub MCP Client
 *
 * Connects to the GitHub MCP server to enable repository operations,
 * issue management, and code analysis through the Model Context Protocol.
 *
 * Note: This implementation uses the stdio transport for the local
 * @modelcontextprotocol/server-github package. For production, you may
 * want to implement HTTP/SSE transport for remote servers.
 */

export interface GitHubMCPClientConfig {
  githubToken: string;
  owner?: string; // Optional: default repository owner
  repo?: string; // Optional: default repository name
}

export class GitHubMCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private config: GitHubMCPClientConfig;
  private tools: Tool[] = [];
  private isConnected = false;

  constructor(config: GitHubMCPClientConfig) {
    this.config = config;
    this.client = new Client(
      {
        name: "devmate-github-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Connect to the GitHub MCP server
   *
   * Note: This requires the @modelcontextprotocol/server-github package
   * to be installed globally or available in PATH.
   *
   * Install: npm install -g @modelcontextprotocol/server-github
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Create stdio transport to communicate with the GitHub MCP server
      this.transport = new StdioClientTransport({
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-github",
        ],
        env: {
          ...process.env,
          GITHUB_PERSONAL_ACCESS_TOKEN: this.config.githubToken,
        },
      });

      // Connect the client
      await this.client.connect(this.transport);

      // List available tools
      const toolsResponse = await this.client.listTools();
      this.tools = toolsResponse.tools;
      this.isConnected = true;

      console.log(`[GitHub MCP] Connected successfully. Found ${this.tools.length} tools.`);
    } catch (error) {
      console.error("[GitHub MCP] Connection failed:", error);
      throw new Error(`Failed to connect to GitHub MCP server: ${error}`);
    }
  }

  /**
   * Get all available GitHub tools
   */
  getTools(): Tool[] {
    return this.tools;
  }

  /**
   * Call a GitHub MCP tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    if (!this.isConnected) {
      throw new Error("GitHub MCP client is not connected");
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      return response;
    } catch (error) {
      console.error(`[GitHub MCP] Tool call failed for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the GitHub MCP server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.client.close();
      this.transport = null;
      this.isConnected = false;
      this.tools = [];
      console.log("[GitHub MCP] Disconnected successfully.");
    }
  }

  /**
   * Check if client is connected
   */
  isActive(): boolean {
    return this.isConnected;
  }
}

// Singleton instance cache for reusing connections
const clientCache = new Map<string, GitHubMCPClient>();

/**
 * Get or create a GitHub MCP client
 * Uses token as cache key to reuse connections
 */
export async function getGitHubMCPClient(
  config: GitHubMCPClientConfig
): Promise<GitHubMCPClient> {
  const cacheKey = config.githubToken.substring(0, 10); // Use token prefix as key

  if (clientCache.has(cacheKey)) {
    const client = clientCache.get(cacheKey)!;
    if (client.isActive()) {
      return client;
    }
    // Client exists but not active, remove from cache
    clientCache.delete(cacheKey);
  }

  // Create new client and connect
  const client = new GitHubMCPClient(config);
  await client.connect();
  clientCache.set(cacheKey, client);

  return client;
}

/**
 * Cleanup all cached clients
 */
export async function cleanupGitHubMCPClients(): Promise<void> {
  for (const client of clientCache.values()) {
    await client.disconnect();
  }
  clientCache.clear();
}
