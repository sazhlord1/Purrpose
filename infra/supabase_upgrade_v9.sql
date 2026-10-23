-- Purrpose v9 upgrade for an existing Supabase database (run after supabase_upgrade_v8.sql).
-- Same statements as prisma/migrations/20261024000000_payments. Idempotent: safe to run twice.

-- Stripe Checkout purchases (PURR packs and pantry food).
-- A new table only: the previous server version keeps working on this schema.

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- Same Supabase hardening as the other tables: RLS on, no policies (only the API server reads it).
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
