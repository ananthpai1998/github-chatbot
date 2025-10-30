CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adminId" uuid NOT NULL,
	"adminEmail" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resourceType" varchar(50) NOT NULL,
	"resourceId" varchar(100) NOT NULL,
	"changes" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UsageLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid NOT NULL,
	"messageId" uuid,
	"modelId" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"inputTokens" integer DEFAULT 0 NOT NULL,
	"outputTokens" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"estimatedCost" numeric(10, 6) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"toolsUsed" jsonb DEFAULT '[]'::jsonb,
	"toolCallCount" integer DEFAULT 0,
	"responseTimeMs" integer,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
