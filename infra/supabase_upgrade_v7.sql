-- Purrpose v7 upgrade for an existing Supabase database (run after supabase_upgrade_v6.sql).
-- Same statements as prisma/migrations/20261008000000_push_locale.

-- Push notifications in the device's language. Idempotent: safe to run twice.

ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
