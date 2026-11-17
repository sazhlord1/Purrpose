-- Purrpose v13 upgrade for an existing Supabase database (run after supabase_upgrade_v12.sql).
-- Same as prisma/migrations/20261118000000_food_units and 20261118000001_inbox. Safe to run twice.

-- Pantry units become smaller so smaller packs can be sold and staked:
--   dry food: 1 kilogram → 20 units of 50 g;  vet care: 1 visit → 4 care shares.
-- Runs once (a marker table remembers it), so running this file again changes nothing.
DO $$
BEGIN
  IF to_regclass('public."_FoodUnitsV2"') IS NULL THEN
    UPDATE "CreditBalance"     SET "amount" = "amount" * 20 WHERE "creditType" = 'DRY_FOOD';
    UPDATE "CreditBalance"     SET "amount" = "amount" * 4  WHERE "creditType" = 'VET_CARE';
    UPDATE "CreditTransaction" SET "amount" = "amount" * 20 WHERE "creditType" = 'DRY_FOOD';
    UPDATE "CreditTransaction" SET "amount" = "amount" * 4  WHERE "creditType" = 'VET_CARE';
    UPDATE "Commitment" SET "consequenceAmount" = "consequenceAmount" * 20 WHERE "consequenceType" = 'DRY_FOOD';
    UPDATE "Commitment" SET "consequenceAmount" = "consequenceAmount" * 4  WHERE "consequenceType" = 'VET_CARE';
    UPDATE "Habit" SET "stakeAmount" = "stakeAmount" * 20, "lostAmount" = "lostAmount" * 20 WHERE "consequenceType" = 'DRY_FOOD';
    UPDATE "Habit" SET "stakeAmount" = "stakeAmount" * 4,  "lostAmount" = "lostAmount" * 4  WHERE "consequenceType" = 'VET_CARE';
    UPDATE "Payment" SET "quantity" = "quantity" * 20 WHERE "kind" = 'food' AND "item" = 'DRY_FOOD';
    UPDATE "Payment" SET "quantity" = "quantity" * 4  WHERE "kind" = 'food' AND "item" = 'VET_CARE';
    CREATE TABLE "_FoodUnitsV2" ("doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO "_FoodUnitsV2" DEFAULT VALUES;
  END IF;
END $$;
ALTER TABLE "_FoodUnitsV2" ENABLE ROW LEVEL SECURITY;

-- Inbox (prisma/migrations/20261118000001_inbox)
-- The player's inbox ("Messages"). Idempotent.
CREATE TABLE IF NOT EXISTS "InboxMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'team',
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InboxMessage_key_key" ON "InboxMessage"("key");
CREATE INDEX IF NOT EXISTS "InboxMessage_userId_createdAt_idx" ON "InboxMessage"("userId", "createdAt");
DO $$ BEGIN
    ALTER TABLE "InboxMessage" ADD CONSTRAINT "InboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "InboxMessage" ENABLE ROW LEVEL SECURITY;
