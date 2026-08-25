-- AlterTable
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "aiLevel" TEXT NOT NULL DEFAULT 'Standard AI';
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "dailyTokenLimit" INTEGER NOT NULL DEFAULT 50000;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "defaultModelId" TEXT;

-- AlterTable
ALTER TABLE "AiModel" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ENABLED';
ALTER TABLE "AiModel" ADD COLUMN IF NOT EXISTS "isChatModel" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "AiMessage" ADD COLUMN IF NOT EXISTS "modelKey" TEXT;
ALTER TABLE "AiMessage" ADD COLUMN IF NOT EXISTS "provider" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Plan_defaultModelId_fkey'
    ) THEN
        ALTER TABLE "Plan" ADD CONSTRAINT "Plan_defaultModelId_fkey" FOREIGN KEY ("defaultModelId") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiModel_status_idx" ON "AiModel"("status");
CREATE INDEX IF NOT EXISTS "AiModel_provider_status_idx" ON "AiModel"("provider", "status");
