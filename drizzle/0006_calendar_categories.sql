CREATE TABLE "calendar_category" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  CONSTRAINT "calendar_category_name_unique" UNIQUE("name")
);
