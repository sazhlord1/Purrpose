-- Purrpose v11 upgrade for an existing Supabase database (run after supabase_upgrade_v10.sql).
-- Same statements as prisma/migrations/20261116000000_proof_audio. Idempotent: safe to run twice.
-- Until it runs, everything works on the English edition except sending a voice note with a proof.

-- A voice note with a strict pact's proof. Idempotent: safe to run twice.
CREATE TABLE IF NOT EXISTS "ProofAudio" (
    "commitmentId" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "audioType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProofAudio_pkey" PRIMARY KEY ("commitmentId")
);

DO $$ BEGIN
    ALTER TABLE "ProofAudio" ADD CONSTRAINT "ProofAudio_commitmentId_fkey"
        FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Same Supabase hardening as the other tables: RLS on, no policies (only the API server reads it).
ALTER TABLE "ProofAudio" ENABLE ROW LEVEL SECURITY;

