-- Drop foreign key constraints first (before dropping User table)
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk";
--> statement-breakpoint
-- Now safe to drop User table
DROP TABLE IF EXISTS "User";
