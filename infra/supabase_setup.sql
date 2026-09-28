-- Fresh install: run this file first, then infra/supabase_upgrade_v2.sql.
-- (The Cat table created below is dropped by the v2 upgrade; the cat catalog now lives in code.)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConsequenceType" AS ENUM ('MEALS', 'DRY_FOOD', 'VET_CARE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('STARTER_GRANT', 'TOPUP', 'FAILURE_DEDUCTION');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

CREATE TABLE IF NOT EXISTS "Cat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    CONSTRAINT "Cat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Commitment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "catId" TEXT NOT NULL,
    "consequenceType" "ConsequenceType" NOT NULL,
    "consequenceAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreditBalance" (
    "userId" TEXT NOT NULL,
    "creditType" "ConsequenceType" NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "CreditBalance_pkey" PRIMARY KEY ("userId","creditType")
);

CREATE TABLE IF NOT EXISTS "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "creditType" "ConsequenceType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "commitmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AppEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes & Constraints
CREATE INDEX IF NOT EXISTS "Commitment_userId_status_idx" ON "Commitment"("userId", "status");
CREATE INDEX IF NOT EXISTS "Commitment_status_deadline_idx" ON "Commitment"("status", "deadline");
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

DO $$ BEGIN
    CREATE UNIQUE INDEX "ux_failure_deduction_once"
        ON "CreditTransaction"("commitmentId")
        WHERE "type" = 'FAILURE_DEDUCTION' AND "commitmentId" IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN null;
END $$;

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CreditBalance" ADD CONSTRAINT "CreditBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Seed the 8 Cats
INSERT INTO "Cat" ("id", "name", "type", "personality", "config")
VALUES
('orange', 'Miso', 'TABBY', 'Joyful / optimistic / warm sunbather', '{
  "palette": { "body": "#EEB038", "belly": "#EEB038", "ink": "#26201D", "markings": "#26201D", "eyes": "#26201D", "eyeGlint": "#FFFDF9", "nose": "#26201D" },
  "structure": { "ears": "pointy", "tailPath": "spiralCurl", "eyeShape": "joyfulArch", "bodyLength": 1, "headSize": 1, "postureDefault": "seatedPaws" },
  "motion": { "overshootMul": 1.2, "stepFreq": 1.1, "pauseBias": 0.7 },
  "quirks": { "winLine": "I KNEW IT!!! NOM NOM NOM", "loseLine": "aw man. okay. maybe next time.", "chosenLine": "oh!! oh!! deal!!", "closeLines": ["I''M SO READY. ARE YOU??"], "waitingLines": ["taking my time in the sun.", "is that… the snack cabinet??"] }
}'::jsonb),
('tuxedo', 'Winston', 'TUXEDO', 'Aristocratic / dignified / sardonic', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#26201D", "eyes": "#26201D", "eyeGlint": "#FFFDF9", "nose": "#26201D", "patch": "#F4978E" },
  "structure": { "ears": "tallStriped", "tailPath": "rootedStripedCurl", "eyeShape": "dotWide", "bodyLength": 1, "headSize": 1, "postureDefault": "aristocratSeated" },
  "motion": { "overshootMul": 0.8, "stepFreq": 0.85, "pauseBias": 1.4 },
  "quirks": { "winLine": "Naturally. Bon appétit — moi.", "loseLine": "Hm. Adequate, I suppose.", "chosenLine": "Very well. I shall wait.", "closeLines": ["The hour grows late."], "waitingLines": ["I''ve seen faster humans.", "I do enjoy a good suspense."] }
}'::jsonb),
('black', 'Nyx', 'MIDNIGHT', 'Mysterious / graceful / luminous-eyed', '{
  "palette": { "body": "#1E1B18", "belly": "#1E1B18", "ink": "#26201D", "markings": "#FFFDF9", "eyes": "#FFFDF9", "eyeGlint": "#1E1B18", "nose": "#E05368", "innerEar": "#E05368" },
  "structure": { "ears": "pinkInner", "tailPath": "sleekUpright", "eyeShape": "luminousOval", "bodyLength": 0.95, "headSize": 0.95, "postureDefault": "slenderSeated" },
  "motion": { "overshootMul": 1, "stepFreq": 1, "pauseBias": 1 },
  "quirks": { "winLine": "I KNEW IT. feast mode.", "loseLine": "…fine.", "chosenLine": "heh. sure you will.", "closeLines": ["you won''t make it. i can smell it."], "waitingLines": ["tick tock.", "the bowl is RIGHT THERE."] }
}'::jsonb),
('boba', 'Boba', 'CALICO', 'Curious / sweet / cheeky side-glancer', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#E07A5F", "patch": "#E07A5F", "eyes": "#FFFDF9", "eyeGlint": "#26201D", "nose": "#26201D" },
  "structure": { "ears": "splitCalico", "tailPath": "groundTail", "eyeShape": "sideGlance", "bodyLength": 1.05, "headSize": 1, "postureDefault": "calicoSeated" },
  "motion": { "overshootMul": 0.9, "stepFreq": 0.9, "pauseBias": 1.2 },
  "quirks": { "winLine": "YESSS! CHONK FEAST COMMENCES!", "loseLine": "yawn… back to nap then.", "chosenLine": "deal! wake me up when it is food time…", "closeLines": ["the aroma of victory is in the air…"], "waitingLines": ["is it snack time yet?", "side-eyeing your procrastination…"] }
}'::jsonb),
('mochi', 'Mochi', 'BICOLOR', 'Quiet / gentle / marshmallow soft', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#26201D", "eyes": "#26201D", "eyeGlint": "#FFFDF9", "nose": "#26201D" },
  "structure": { "ears": "blackLeftComb", "tailPath": "hookLeft", "eyeShape": "dotWide", "bodyLength": 1, "headSize": 1, "postureDefault": "jjLegs" },
  "motion": { "overshootMul": 0.85, "stepFreq": 0.9, "pauseBias": 1.3 },
  "quirks": { "winLine": "Mochi is very, very happy!", "loseLine": "oh well... i still like you.", "chosenLine": "purr... i believe in you.", "closeLines": ["almost done, right?"], "waitingLines": ["sitting very still.", "watching your screen quietly."] }
}'::jsonb),
('oreo', 'Oreo', 'MASKED', 'Inquisitive / observant / mustache gentleman', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#26201D", "eyes": "#FFFDF9", "eyeGlint": "#26201D", "nose": "#26201D" },
  "structure": { "ears": "blackMaskEars", "tailPath": "uprightLedge", "eyeShape": "bigRoundStare", "bodyLength": 1, "headSize": 1.05, "postureDefault": "ledgePaws" },
  "motion": { "overshootMul": 1.1, "stepFreq": 1, "pauseBias": 0.9 },
  "quirks": { "winLine": "Spectacular achievement! A feast well earned.", "loseLine": "A momentary setback. Re-strategize!", "chosenLine": "Eyes on the prize! Let us begin.", "closeLines": ["The ledge is vibrating with anticipation!"], "waitingLines": ["Observing every keystroke.", "My mustache senses progress."] }
}'::jsonb),
('pepper', 'Pepper', 'POLKADOT', 'Playful / bubbly / spotty sweetheart', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#26201D", "eyes": "#26201D", "eyeGlint": "#FFFDF9", "nose": "#26201D", "patch": "#F4978E" },
  "structure": { "ears": "combForehead", "tailPath": "ringLoop", "eyeShape": "dotWide", "bodyLength": 1, "headSize": 1, "postureDefault": "polkaDots" },
  "motion": { "overshootMul": 1.25, "stepFreq": 1.2, "pauseBias": 0.6 },
  "quirks": { "winLine": "YAAAAY!! Pepper party time!!", "loseLine": "Aww pouts... but next time for sure!", "chosenLine": "Every dot on my fur is cheering for you!!", "closeLines": ["My ring tail is spinning with joy!"], "waitingLines": ["Counting my spots while you work!", "Wiggle wiggle! You can do it!"] }
}'::jsonb),
('yuki', 'Yuki', 'SKETCH', 'Energetic / expressive / playful ghost', '{
  "palette": { "body": "#FFFDF9", "belly": "#FFFDF9", "ink": "#26201D", "markings": "#26201D", "eyes": "#26201D", "eyeGlint": "#FFFDF9", "nose": "#26201D" },
  "structure": { "ears": "alertPointy", "tailPath": "hookRight", "eyeShape": "dotWide", "bodyLength": 1, "headSize": 1, "postureDefault": "wLegs" },
  "motion": { "overshootMul": 1.3, "stepFreq": 1.25, "pauseBias": 0.5 },
  "quirks": { "winLine": "BAM! Target destroyed! Delicious victory!", "loseLine": "Whoosh... scattered into the wind.", "chosenLine": "ALERT! Commitment registered! Engage!", "closeLines": ["Maximum energy surge! Finish strong!"], "waitingLines": ["Sparks of creativity incoming!", "Tail is hooked and ready!"] }
}'::jsonb)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "personality" = EXCLUDED."personality",
  "config" = EXCLUDED."config";
