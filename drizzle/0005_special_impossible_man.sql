CREATE TABLE "calendar_event" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"start" text NOT NULL,
	"end" text,
	"all_day" boolean DEFAULT true NOT NULL,
	"location" text,
	"description" text,
	"category" text,
	"authorId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "intranet_page" ADD COLUMN "is_draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;