-- Detective Cheat: habit pacts and their confessed slips. Idempotent: safe to run twice.

DO $$ BEGIN
    CREATE TYPE "HabitStatus" AS ENUM ('ACTIVE', 'KEPT', 'BROKEN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "consequenceType" "ConsequenceType" NOT NULL,
    "stakeAmount" INTEGER NOT NULL,
    "maxSlips" INTEGER NOT NULL,
    "slipCount" INTEGER NOT NULL DEFAULT 0,
    "status" "HabitStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "lostAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Habit_userId_status_idx" ON "Habit"("userId", "status");
CREATE INDEX IF NOT EXISTS "Habit_status_endsAt_idx" ON "Habit"("status", "endsAt");

CREATE TABLE IF NOT EXISTS "HabitSlip" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitSlip_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HabitSlip_habitId_idx" ON "HabitSlip"("habitId");

ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "habitId" TEXT;

DO $$ BEGIN
    ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "HabitSlip" ADD CONSTRAINT "HabitSlip_habitId_fkey"
        FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_habitId_fkey"
        FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Same Supabase hardening as before: RLS on, no policies (only the API server touches these tables).
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HabitSlip" ENABLE ROW LEVEL SECURITY;
