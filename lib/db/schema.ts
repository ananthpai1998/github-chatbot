import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

// User management is handled by Supabase Auth (auth.users table)
// No custom User table needed - Supabase handles authentication, passwords, OAuth, etc.

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId").notNull(), // References auth.users (Supabase Auth managed)
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId").notNull(), // References auth.users (Supabase Auth managed)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId").notNull(), // References auth.users (Supabase Auth managed)
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// ========== Admin Tables ==========

// Model Capabilities Type
export type ModelCapabilities = {
  thinking?: {
    enabled: boolean;
    budgetTokens?: number; // Max reasoning tokens (e.g., 8192 for Claude, configurable for Gemini)
  };
  fileInputs?: {
    enabled: boolean;
  };
  codeExecution?: {
    enabled: boolean;
  };
  webSearch?: {
    enabled: boolean;
  };
  imageGeneration?: {
    enabled: boolean;
  };
  urlContext?: {
    enabled: boolean;
  };
};

// Provider-specific configuration
export type ProviderConfig = {
  // OpenAI specific
  reasoningEffort?: "minimal" | "low" | "medium" | "high"; // For o-series models
  // Gemini specific
  safetySettings?: {
    hate?: "BLOCK_NONE" | "BLOCK_LOW_AND_ABOVE" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_ONLY_HIGH";
    dangerous?: "BLOCK_NONE" | "BLOCK_LOW_AND_ABOVE" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_ONLY_HIGH";
    harassment?: "BLOCK_NONE" | "BLOCK_LOW_AND_ABOVE" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_ONLY_HIGH";
    explicit?: "BLOCK_NONE" | "BLOCK_LOW_AND_ABOVE" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_ONLY_HIGH";
  };
  // Claude specific (can be extended in future)
};

// Tool-specific prompts for capabilities
export type ToolPrompts = {
  base?: string; // Base system prompt override
  thinking?: string;
  fileInput?: string;
  codeExecution?: string;
  webSearch?: string;
  imageGeneration?: string;
  urlContext?: string;
};

// Model Configuration Table
export const modelConfig = pgTable("ModelConfig", {
  id: varchar("id", { length: 100 }).primaryKey(), // e.g., 'claude-3-5-sonnet-20241022'
  provider: varchar("provider", { length: 50 }).notNull(), // 'anthropic' | 'google' | 'openai'
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  modelId: varchar("modelId", { length: 100 }).notNull(), // Actual provider model ID
  contextWindow: integer("contextWindow").notNull(),
  isEnabled: boolean("isEnabled").notNull().default(true),
  supportsVision: boolean("supportsVision").notNull().default(false),
  supportsTools: boolean("supportsTools").notNull().default(false),
  capabilities: jsonb("capabilities").$type<ModelCapabilities | null>().default(null),
  providerConfig: jsonb("providerConfig").$type<ProviderConfig | null>().default(null),
  allowedFileTypes: jsonb("allowedFileTypes").$type<string[]>().default([]),
  toolPrompts: jsonb("toolPrompts").$type<ToolPrompts | null>().default(null),
  pricing: jsonb("pricing").$type<{
    inputPerMillion: number;
    outputPerMillion: number;
    currency: string;
  } | null>(),
  metadata: jsonb("metadata").$type<Record<string, any> | null>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ModelConfig = InferSelectModel<typeof modelConfig>;

// Agent Configuration Table
export const agentConfig = pgTable("AgentConfig", {
  id: varchar("id", { length: 50 }).primaryKey(), // 'chatModel' | 'artifactModel' | 'titleModel' | 'reasoningModel'
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(),
  defaultModelId: varchar("defaultModelId", { length: 100 }),
  enabledTools: jsonb("enabledTools").$type<string[]>().notNull().default([]),
  config: jsonb("config").$type<Record<string, any> | null>(),
  status: varchar("status", { length: 20, enum: ["active", "coming_soon"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AgentConfig = InferSelectModel<typeof agentConfig>;

// Tool Prompts Type
export type ToolPromptConfig = {
  description?: string;       // Tool description shown to model
  usageGuidelines?: string;   // How and when to use this tool
  examples?: string;          // Usage examples
};

// Tool Configuration Table
export const toolConfig = pgTable("ToolConfig", {
  id: varchar("id", { length: 100 }).primaryKey(), // 'createDocument' | 'updateDocument' | 'getWeather' | 'github_*'
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // 'document' | 'integration' | 'utility' | 'search'
  isEnabled: boolean("isEnabled").notNull().default(true),
  parameters: jsonb("parameters").$type<Record<string, any> | null>(),
  toolPrompts: jsonb("toolPrompts").$type<ToolPromptConfig | null>().default(null),
  costPerCall: decimal("costPerCall", { precision: 10, scale: 6 })
    .notNull()
    .default("0"),
  rateLimitPerMinute: integer("rateLimitPerMinute"),
  rateLimitPerHour: integer("rateLimitPerHour"),
  metadata: jsonb("metadata").$type<Record<string, any> | null>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ToolConfig = InferSelectModel<typeof toolConfig>;

// App Settings Table
export const appSettings = pgTable("AppSettings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'pricing' | 'features' | 'limits' | 'system'
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  updatedBy: uuid("updatedBy"), // References auth.users (Supabase Auth managed)
});

export type AppSettings = InferSelectModel<typeof appSettings>;

// Usage Log Table - Tracks individual API calls and token usage
export const usageLog = pgTable("UsageLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull(), // References auth.users (Supabase Auth managed)
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  messageId: uuid("messageId"), // Optional: references message if applicable
  modelId: varchar("modelId", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),

  // Token usage
  inputTokens: integer("inputTokens").notNull().default(0),
  outputTokens: integer("outputTokens").notNull().default(0),
  totalTokens: integer("totalTokens").notNull().default(0),

  // Cost tracking
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 6 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),

  // Tool usage
  toolsUsed: jsonb("toolsUsed").$type<string[]>().default([]),
  toolCallCount: integer("toolCallCount").default(0),

  // Timing
  responseTimeMs: integer("responseTimeMs"), // milliseconds

  // Metadata for additional tracking
  metadata: jsonb("metadata").$type<Record<string, any> | null>(),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type UsageLog = InferSelectModel<typeof usageLog>;

// Admin Audit Log Table - Tracks admin actions
export const adminAuditLog = pgTable("AdminAuditLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  adminId: uuid("adminId").notNull(), // References auth.users (Supabase Auth managed)
  adminEmail: varchar("adminEmail", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // 'update_model', 'toggle_tool', 'update_agent', etc.
  resourceType: varchar("resourceType", { length: 50 }).notNull(), // 'model', 'tool', 'agent', 'settings'
  resourceId: varchar("resourceId", { length: 100 }).notNull(),
  changes: jsonb("changes").$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null>(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type AdminAuditLog = InferSelectModel<typeof adminAuditLog>;

// User Preferences Table - Stores user-specific preferences
export const userPreferences = pgTable("UserPreferences", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().unique(), // References auth.users (Supabase Auth managed)
  thinkingEnabled: boolean("thinkingEnabled").notNull().default(false),
  preferredAgentType: varchar("preferredAgentType", { length: 50 }).default("chat"),
  preferences: jsonb("preferences").$type<Record<string, any> | null>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserPreferences = InferSelectModel<typeof userPreferences>;
