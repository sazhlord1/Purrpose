-- Push notifications in the device's language. Idempotent: safe to run twice.

ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
