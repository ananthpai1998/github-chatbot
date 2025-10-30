CREATE TABLE IF NOT EXISTS "AgentConfig" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"systemPrompt" text NOT NULL,
	"defaultModelId" varchar(100),
	"enabledTools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AppSettings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ModelConfig" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"modelId" varchar(100) NOT NULL,
	"contextWindow" integer NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"supportsVision" boolean DEFAULT false NOT NULL,
	"supportsTools" boolean DEFAULT false NOT NULL,
	"pricing" jsonb,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ToolConfig" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"parameters" jsonb,
	"costPerCall" numeric(10, 6) DEFAULT '0' NOT NULL,
	"rateLimitPerMinute" integer,
	"rateLimitPerHour" integer,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
