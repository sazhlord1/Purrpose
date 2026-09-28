-- Purrpose v2: accounts + admin, PURR token & cat unlocks, server-side focus
-- sessions, web push, hashed session tokens, Supabase row-level security.
--
-- Written to be IDEMPOTENT: it is safe to run more than once. The same file is
-- shipped as infra/supabase_upgrade_v2.sql for databases that were created by
-- running infra/supabase_setup.sql in the Supabase SQL editor.

-- ─── Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PurrTxnType" AS ENUM ('PURCHASE', 'SANDBOX_PURCHASE', 'ADMIN_GRANT', 'SPEND');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationKind" AS ENUM ('T24H', 'T1H', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── User: account fields ───────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "purrBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_purrBalance_nonneg" CHECK ("purrBalance" >= 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Session: store only a SHA-256 hash of the bearer token ─────────────────
-- Existing raw tokens (UUID/cuid) are hashed in place, so everyone stays signed
-- in: clients keep sending the raw token and the server hashes it on lookup.
-- The WHERE clause skips values that are already a 64-char hex hash, which is
-- what makes this re-runnable.
UPDATE "Session"
SET "token" = encode(sha256(convert_to("token", 'UTF8')), 'hex')
WHERE "token" !~ '^[0-9a-f]{64}$';

ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- Sessions now cascade when a user is deleted.
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Cat table: removed. The catalog lives in code (packages/shared/src/cats.ts)
DROP TABLE IF EXISTS "Cat";

-- ─── PURR ledger ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PurrTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PurrTxnType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "itemId" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurrTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurrTransaction_amount_pos" CHECK ("amount" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "PurrTransaction_reference_key" ON "PurrTransaction"("reference");
CREATE INDEX IF NOT EXISTS "PurrTransaction_userId_createdAt_idx" ON "PurrTransaction"("userId", "createdAt");
DO $$ BEGIN
    ALTER TABLE "PurrTransaction" ADD CONSTRAINT "PurrTransaction_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Cat unlocks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CatUnlock" (
    "userId" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatUnlock_pkey" PRIMARY KEY ("userId", "catId")
);
DO $$ BEGIN
    ALTER TABLE "CatUnlock" ADD CONSTRAINT "CatUnlock_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Focus sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commitmentId" TEXT,
    "catId" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FocusSession_duration_pos" CHECK ("durationSec" > 0)
);
CREATE INDEX IF NOT EXISTS "FocusSession_userId_createdAt_idx" ON "FocusSession"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "FocusSession_commitmentId_idx" ON "FocusSession"("commitmentId");
DO $$ BEGIN
    ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_commitmentId_fkey"
        FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Web push ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
DO $$ BEGIN
    ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "commitmentId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("commitmentId", "kind")
);
DO $$ BEGIN
    ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_commitmentId_fkey"
        FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Supabase hardening: row-level security ─────────────────────────────────
-- Supabase publishes every table in "public" through its REST API. The API
-- server connects as the table owner, which bypasses RLS, so enabling RLS with
-- NO policies keeps the app working while blocking all access through the
-- anon/authenticated API keys (e.g. reading session hashes or balances).
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'User', 'Session', 'Commitment', 'CreditBalance', 'CreditTransaction',
        'AppEvent', 'PurrTransaction', 'CatUnlock', 'FocusSession',
        'PushSubscription', 'NotificationLog', '_prisma_migrations'
    ] LOOP
        IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;
