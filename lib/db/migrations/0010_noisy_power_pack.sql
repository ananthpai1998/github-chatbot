ALTER TABLE "ModelConfig" ADD COLUMN "capabilities" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "ModelConfig" ADD COLUMN "providerConfig" jsonb DEFAULT 'null'::jsonb;