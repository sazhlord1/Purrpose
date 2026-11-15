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
