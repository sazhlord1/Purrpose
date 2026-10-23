-- Honor (PURR) and strict (food + proof) pacts, witnesses, proofs, welcome PURR.
-- Additive only: the previous server version keeps working on this schema.

ALTER TYPE "PurrTxnType" ADD VALUE IF NOT EXISTS 'WELCOME';
ALTER TYPE "PurrTxnType" ADD VALUE IF NOT EXISTS 'STAKE_LOST';
ALTER TYPE "PurrTxnType" ADD VALUE IF NOT EXISTS 'PACT_BONUS';

DO $$ BEGIN
    CREATE TYPE "CommitmentMode" AS ENUM ('STRICT', 'HONOR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "welcomeSeenAt" TIMESTAMP(3);

ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "mode" "CommitmentMode" NOT NULL DEFAULT 'STRICT';
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "purrStake" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "starter" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "proofRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "witnessEmail" TEXT;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "witnessToken" TEXT;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "proofSubmittedAt" TIMESTAMP(3);
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "reviewDueAt" TIMESTAMP(3);
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "Commitment" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Commitment_witnessToken_key" ON "Commitment"("witnessToken");
CREATE INDEX IF NOT EXISTS "Commitment_reviewDueAt_idx" ON "Commitment"("reviewDueAt");

CREATE TABLE IF NOT EXISTS "CommitmentProof" (
    "commitmentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "image" BYTEA,
    "imageType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommitmentProof_pkey" PRIMARY KEY ("commitmentId")
);
DO $$ BEGIN
    ALTER TABLE "CommitmentProof" ADD CONSTRAINT "CommitmentProof_commitmentId_fkey"
        FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Same Supabase hardening as the other tables: RLS on, no policies (only the API server reads it).
ALTER TABLE "CommitmentProof" ENABLE ROW LEVEL SECURITY;
