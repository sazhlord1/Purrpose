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

-- 4. Seed the 5 Cats
INSERT INTO "Cat" ("id", "name", "type", "personality", "config")
VALUES
('orange', 'Miso', 'ORANGE', 'Optimistic / chaotic / playful', '{
  "palette": { "body": "#E28743", "belly": "#FBE9D2", "ink": "#2B231F", "markings": "#B85D24", "eyes": "#E76F51", "eyeGlint": "#FFFFFF", "nose": "#E76F51", "innerEar": "#F9B4A0" },
  "structure": { "ears": "pointy", "tailPath": "bigCurl", "eyeShape": "dotWide", "bodyLength": 0.95, "headSize": 1.1, "postureDefault": "upright" },
  "motion": { "overshootMul": 1.3, "stepFreq": 1.15, "pauseBias": 0.6 },
  "quirks": { "winLine": "I KNEW IT!!! NOM NOM NOM", "loseLine": "aw man. okay. maybe next time.", "chosenLine": "oh!! oh!! deal!!", "closeLines": ["I''M SO READY. ARE YOU??"], "waitingLines": ["taking my time. lots of it.", "is that… the cabinet?? nooo (yes)"] }
}'::jsonb),
('tuxedo', 'Winston', 'TUXEDO', 'Judgmental / sophisticated / sarcastic', '{
  "palette": { "body": "#2B2A29", "belly": "#FBF8F1", "ink": "#1E1B18", "markings": "#FBF8F1", "eyes": "#4E8752", "eyeGlint": "#FFFFFF", "nose": "#EFA7A7", "innerEar": "#EFA7A7", "socks": "#FBF8F1", "bib": "#FBF8F1" },
  "structure": { "ears": "roundTall", "tailPath": "longPlume", "eyeShape": "almond", "bodyLength": 1.05, "headSize": 1, "postureDefault": "poised" },
  "motion": { "overshootMul": 0.8, "stepFreq": 0.85, "pauseBias": 1.4 },
  "quirks": { "winLine": "Naturally. Bon appétit — moi.", "loseLine": "Hm. Adequate, I suppose.", "chosenLine": "Very well. I shall wait.", "closeLines": ["The hour grows late."], "waitingLines": ["I''ve seen faster humans.", "I do enjoy a good suspense."] }
}'::jsonb),
('black', 'Nyx', 'BLACK', 'Mischievous / mysterious / slightly evil', '{
  "palette": { "body": "#24202C", "belly": "#352F40", "ink": "#141219", "markings": "#443C53", "eyes": "#F7D060", "eyeGlint": "#FFFFFF", "nose": "#A08F85", "innerEar": "#6A5D7B" },
  "structure": { "ears": "pointy", "tailPath": "lowHook", "eyeShape": "narrowSly", "bodyLength": 1, "headSize": 0.95, "postureDefault": "slink" },
  "motion": { "overshootMul": 1, "stepFreq": 1, "pauseBias": 1 },
  "quirks": { "winLine": "I KNEW IT. feast mode.", "loseLine": "…fine.", "chosenLine": "heh. sure you will.", "closeLines": ["you won''t make it. i can smell it."], "waitingLines": ["tick tock.", "the bowl is RIGHT THERE."] }
}'::jsonb),
('boba', 'Boba', 'BOBA', 'Sleepy / food-obsessed / gentle chonk', '{
  "palette": { "body": "#F7F1E5", "belly": "#FFFDF9", "ink": "#2B231F", "markings": "#4A3E3D", "patch": "#E07A5F", "eyes": "#3D5A80", "eyeGlint": "#E0FBFC", "nose": "#E76F51", "innerEar": "#F4A5A5" },
  "structure": { "ears": "roundSoft", "tailPath": "fluffyPuff", "eyeShape": "bigGleam", "bodyLength": 1.15, "headSize": 1.15, "postureDefault": "chonk" },
  "motion": { "overshootMul": 0.7, "stepFreq": 0.75, "pauseBias": 1.6 },
  "quirks": { "winLine": "YESSS! CHONK FEAST COMMENCES!", "loseLine": "yawn… back to nap then.", "chosenLine": "deal! wake me up when it is food time…", "closeLines": ["the aroma of victory is in the air…", "my bowl calls to me…"], "waitingLines": ["is it snack time yet?", "i am conserving energy for the feast.", "sleeping with one ear open…"] }
}'::jsonb),
('ziggy', 'Ziggy', 'ZIGGY', 'Hyperactive / chaos gremlin / zoomies master', '{
  "palette": { "body": "#EFE8D8", "belly": "#FBF7EE", "ink": "#2B231F", "markings": "#3C2F2F", "mask": "#3C2F2F", "eyes": "#48CAE4", "eyeGlint": "#FFFFFF", "nose": "#2E2222", "innerEar": "#E29578", "socks": "#3C2F2F" },
  "structure": { "ears": "batEars", "tailPath": "zigzag", "eyeShape": "wideWild", "bodyLength": 0.9, "headSize": 1.05, "postureDefault": "gremlin" },
  "motion": { "overshootMul": 1.5, "stepFreq": 1.35, "pauseBias": 0.4 },
  "quirks": { "winLine": "VICTORY LAP AT THE SPEED OF SOUND!!", "loseLine": "REEE! I will sprint anyway!!", "chosenLine": "ZOOMIES PROTOCOL ENGAGED!!", "closeLines": ["FIVE MINUTES UNTIL MAXIMUM CHAOS!!", "PREPARING 3AM VICTORY SPRINT!"], "waitingLines": ["I HEARD A CRUMB DROP 3 MILES AWAY", "CANNOT SIT STILL MUST JUMP", "TICK TOCK GO FAST FAST FAST!"] }
}'::jsonb)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "personality" = EXCLUDED."personality",
  "config" = EXCLUDED."config";
