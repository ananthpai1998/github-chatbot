CREATE TABLE IF NOT EXISTS "UserPreferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"thinkingEnabled" boolean DEFAULT false NOT NULL,
	"preferredAgentType" varchar(50) DEFAULT 'chat',
	"preferences" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserPreferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "ModelConfig" ADD COLUMN "allowedFileTypes" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ModelConfig" ADD COLUMN "toolPrompts" jsonb DEFAULT 'null'::jsonb;