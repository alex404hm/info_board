CREATE TABLE "account_lockout" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"reason" text NOT NULL,
	"lockedAt" timestamp NOT NULL,
	"lockedUntil" timestamp NOT NULL,
	"unlockedAt" timestamp,
	"ipAddress" text,
	"userAgent" text,
	"notificationSentAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "calendar_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "calendar_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "device_fingerprint" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"fingerprint" text NOT NULL,
	"ipAddress" text NOT NULL,
	"userAgent" text NOT NULL,
	"deviceName" text,
	"isFirstSeen" boolean DEFAULT true NOT NULL,
	"lastSeenAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "device_fingerprint_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "login_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"email" text NOT NULL,
	"ipAddress" text NOT NULL,
	"userAgent" text,
	"deviceFingerprint" text,
	"success" boolean NOT NULL,
	"reason" text,
	"attemptCount" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"eventType" text NOT NULL,
	"severity" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"details" json DEFAULT '{}'::json,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_lockout" ADD CONSTRAINT "account_lockout_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_fingerprint" ADD CONSTRAINT "device_fingerprint_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempt" ADD CONSTRAINT "login_attempt_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_log" ADD CONSTRAINT "security_audit_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;