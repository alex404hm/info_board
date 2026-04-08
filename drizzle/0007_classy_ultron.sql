CREATE TABLE "auth_rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"keyType" text NOT NULL,
	"keyValue" text NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"windowStartedAt" timestamp NOT NULL,
	"lastAttemptAt" timestamp NOT NULL,
	"blockedUntil" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "auth_rate_limit_key_unique" UNIQUE("keyType","keyValue")
);
