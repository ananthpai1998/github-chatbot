import type { Tool as MCPTool } from "@modelcontextprotocol/sdk/types.js";
import { tool } from "ai";
import { z } from "zod";

/**
 * Convert MCP JSON Schema to Zod schema
 *
 * This is a simplified converter that handles common JSON Schema types.
 * For more complex schemas, you may need to extend this function.
 */
function jsonSchemaToZod(schema: any): z.ZodType<any> {
  // Handle missing schema or empty schema
  if (!schema || Object.keys(schema).length === 0) {
    return z.object({});
  }

  const type = schema.type;

  // Handle object types
  if (type === "object" || schema.properties) {
    const shape: Record<string, z.ZodType<any>> = {};
    const required = schema.required || [];

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        let zodField = jsonSchemaToZod(propSchema);

        // Make field optional if not in required array
        if (!required.includes(key)) {
          zodField = zodField.optional();
        }

        shape[key] = zodField;
      }
    }

    return z.object(shape);
  }

  // Handle array types
  if (type === "array") {
    const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any();
    return z.array(itemSchema);
  }

  // Handle primitive types
  switch (type) {
    case "string":
      if (schema.enum) {
        return z.enum(schema.enum as [string, ...string[]]);
      }
      return z.string();

    case "number":
    case "integer":
      return z.number();

    case "boolean":
      return z.boolean();

    case "null":
      return z.null();

    default:
      // Fallback to any for unknown types
      return z.any();
  }
}

/**
 * Convert an MCP Tool to Vercel AI SDK tool format
 */
export function convertMCPToolToAISDK(
  mcpTool: MCPTool,
  executor: (args: any) => Promise<any>
): any {
  // Convert input schema from JSON Schema to Zod
  const parametersSchema = mcpTool.inputSchema
    ? jsonSchemaToZod(mcpTool.inputSchema)
    : z.object({});

  // Create the AI SDK tool using the tool() function
  return tool({
    description: mcpTool.description || `GitHub tool: ${mcpTool.name}`,
    inputSchema: parametersSchema,
    execute: async (args: any) => {
      try {
        const result = await executor(args);
        return result;
      } catch (error: any) {
        console.error(`[MCP Tool] Error executing ${mcpTool.name}:`, error);
        return {
          error: error.message || "Tool execution failed",
          tool: mcpTool.name,
        };
      }
    },
  });
}

/**
 * Convert all MCP tools to AI SDK format
 */
export function convertMCPToolsToAISDK(
  mcpTools: MCPTool[],
  executor: (toolName: string, args: any) => Promise<any>
): Record<string, any> {
  const aiTools: Record<string, any> = {};

  for (const mcpTool of mcpTools) {
    // Create a tool-specific executor
    const toolExecutor = (args: any) => executor(mcpTool.name, args);

    // Convert and add to tools object
    aiTools[mcpTool.name] = convertMCPToolToAISDK(mcpTool, toolExecutor);
  }

  return aiTools;
}

/**
 * Format MCP tool result for display
 *
 * MCP tools may return complex objects. This function formats them
 * into a readable string for the AI model.
 */
export function formatMCPToolResult(result: any): string {
  if (typeof result === "string") {
    return result;
  }

  if (result.content) {
    // Handle MCP content response format
    if (Array.isArray(result.content)) {
      return result.content
        .map((item: any) => {
          if (item.type === "text") {
            return item.text;
          }
          if (item.type === "resource") {
            return `Resource: ${item.uri || item.url}`;
          }
          return JSON.stringify(item, null, 2);
        })
        .join("\n\n");
    }
    return JSON.stringify(result.content, null, 2);
  }

  // Fallback: stringify the entire result
  return JSON.stringify(result, null, 2);
}

/**
 * Get a friendly description for common GitHub tools
 */
export function getGitHubToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    // Repository operations
    create_repository: "Create a new GitHub repository",
    get_repository: "Get information about a GitHub repository",
    list_repositories: "List repositories for a user or organization",
    search_repositories: "Search for GitHub repositories",

    // Issue operations
    create_issue: "Create a new issue in a repository",
    get_issue: "Get details about a specific issue",
    list_issues: "List issues in a repository",
    update_issue: "Update an existing issue",
    search_issues: "Search for issues across repositories",

    // Pull request operations
    create_pull_request: "Create a new pull request",
    get_pull_request: "Get details about a specific pull request",
    list_pull_requests: "List pull requests in a repository",
    update_pull_request: "Update an existing pull request",
    merge_pull_request: "Merge a pull request",

    // File operations
    get_file_contents: "Get the contents of a file from a repository",
    create_or_update_file: "Create or update a file in a repository",
    search_code: "Search for code across GitHub",

    // Branch operations
    create_branch: "Create a new branch",
    list_branches: "List branches in a repository",

    // Commit operations
    create_commit: "Create a new commit",
    list_commits: "List commits in a repository",

    // Other operations
    fork_repository: "Fork a repository",
    create_tree: "Create a git tree object",
    push_files: "Push multiple files to a repository",
  };

  return descriptions[toolName] || `GitHub operation: ${toolName}`;
}
