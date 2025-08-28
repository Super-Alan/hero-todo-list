-- Migration: Make ModelProvider system-level instead of user-associated
-- This migration preserves all existing provider data by removing the user constraint
-- but keeping the userId field temporarily for data preservation

BEGIN;

-- Step 1: Remove the unique constraint that includes userId
ALTER TABLE "model_providers" DROP CONSTRAINT IF EXISTS "ModelProvider_userId_name_key";

-- Step 2: Remove the foreign key constraint to User
ALTER TABLE "model_providers" DROP CONSTRAINT IF EXISTS "ModelProvider_userId_fkey";

-- Step 3: Make userId nullable (but don't drop it yet to preserve data)
ALTER TABLE "model_providers" ALTER COLUMN "userId" DROP NOT NULL;

-- Step 4: Create new unique constraint on name only (system-wide unique names)
-- First, handle potential name conflicts by appending userId to duplicate names
UPDATE "model_providers" 
SET "name" = "name" || '_user_' || "userId" 
WHERE "id" IN (
    SELECT "id" FROM (
        SELECT "id", "name",
               ROW_NUMBER() OVER (PARTITION BY "name" ORDER BY "createdAt") as rn
        FROM "model_providers"
    ) t 
    WHERE t.rn > 1
);

-- Now create the unique constraint
ALTER TABLE "model_providers" ADD CONSTRAINT "ModelProvider_name_key" UNIQUE ("name");

-- Step 5: Add a comment to document the migration
COMMENT ON TABLE "model_providers" IS 'System-level model providers. userId field is deprecated and will be removed in future migration.';

COMMIT;