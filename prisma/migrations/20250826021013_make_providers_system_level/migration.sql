-- DropForeignKey
ALTER TABLE "model_providers" DROP CONSTRAINT "model_providers_userId_fkey";

-- DropIndex
DROP INDEX "model_providers_userId_name_key";

-- RenameIndex
ALTER INDEX "ModelProvider_name_key" RENAME TO "model_providers_name_key";
