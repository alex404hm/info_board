CREATE TABLE "wage_data" (
	"id" integer PRIMARY KEY NOT NULL,
	"groups" json NOT NULL,
	"currency" text DEFAULT 'DKK' NOT NULL,
	"last_updated" text NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kokkenvagt_entry" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "kokkenvagt_entry" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "linkedin_url";