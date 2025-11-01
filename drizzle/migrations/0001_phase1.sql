CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "action" text NOT NULL,
    "entity" text,
    "entity_id" text,
    "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "rate_limits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "action" text NOT NULL,
    "key" text NOT NULL,
    "window_start" timestamp NOT NULL,
    "count" integer NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "rate_limits_action_key_window_idx"
  ON "rate_limits" ("action", "key", "window_start");

