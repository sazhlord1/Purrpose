-- Purrpose v5 upgrade for an existing Supabase database (run after supabase_upgrade_v4.sql).
-- Same statements as prisma/migrations/20261006100000_user_names.

-- First and last name (for the greeting). Idempotent: safe to run twice.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
