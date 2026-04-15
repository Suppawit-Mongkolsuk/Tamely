-- AlterTable
ALTER TABLE "AiQuery" ADD COLUMN     "sessionId" UUID;

-- CreateIndex
CREATE INDEX "AiQuery_sessionId_idx" ON "AiQuery"("sessionId");
