-- Purrpose v10 upgrade for an existing Supabase database (run after supabase_upgrade_v9.sql).
-- Same statements as prisma/migrations/20261102000000_phone_login. Idempotent: safe to run twice.
-- Run it BEFORE deploying the server that needs it (the English edition on Render).

-- Sign in with a mobile number + SMS code (used by the Iranian edition; harmless here).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

CREATE TABLE IF NOT EXISTS "PhoneCode" (
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneCode_pkey" PRIMARY KEY ("phone")
);

-- Same Supabase hardening as the other tables: RLS on, no policies (only the API server reads it).
ALTER TABLE "PhoneCode" ENABLE ROW LEVEL SECURITY;
