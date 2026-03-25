CREATE TABLE "intranet_page" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"icon" text DEFAULT 'Info' NOT NULL,
	"icon_color" text DEFAULT '#60a5fa' NOT NULL,
	"icon_bg" text DEFAULT 'rgba(96,165,250,0.22)' NOT NULL,
	"bg_from" text DEFAULT 'rgba(30,58,138,0.95)' NOT NULL,
	"bg_to" text DEFAULT 'rgba(15,23,42,0.99)' NOT NULL,
	"glow_a" text DEFAULT 'rgba(96,165,250,0.22)' NOT NULL,
	"glow_b" text DEFAULT 'rgba(59,130,246,0.12)' NOT NULL,
	"accent_color" text DEFAULT '#60a5fa' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "intranet_page_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"secret" text,
	"backupCodes" text
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "activeFrom" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "twoFactorEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;