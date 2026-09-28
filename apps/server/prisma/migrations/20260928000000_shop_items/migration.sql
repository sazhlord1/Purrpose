-- Shop items (toys, beds, bowls, wearables, decor). Idempotent: safe to run twice.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loadout" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "ItemUnlock" (
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemUnlock_pkey" PRIMARY KEY ("userId", "itemId")
);
DO $$ BEGIN
    ALTER TABLE "ItemUnlock" ADD CONSTRAINT "ItemUnlock_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Same Supabase hardening as v2: RLS on, no policies (the API server owns the table).
ALTER TABLE public."ItemUnlock" ENABLE ROW LEVEL SECURITY;
