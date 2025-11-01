ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "published_at" timestamp;

-- Backfill: mark existing public profiles as published now to avoid breaking public pages
UPDATE "profiles" SET "published_at" = now() WHERE "is_public" = true AND "published_at" IS NULL;

