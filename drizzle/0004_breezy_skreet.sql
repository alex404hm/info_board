DROP TABLE "feedback" CASCADE;--> statement-breakpoint
DROP TABLE "request_log" CASCADE;--> statement-breakpoint
DROP TABLE "twoFactor" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "twoFactorEnabled";