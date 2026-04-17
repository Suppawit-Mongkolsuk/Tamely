CREATE TYPE "AdminWorkspaceActionType" AS ENUM ('BLOCK', 'UNBLOCK');

ALTER TABLE "Workspace"
ADD COLUMN "blockedReason" TEXT,
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedByAdminUsername" TEXT;

CREATE TABLE "AdminWorkspaceAuditLog" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "action" "AdminWorkspaceActionType" NOT NULL,
    "adminUsername" TEXT NOT NULL,
    "reason" TEXT,
    "previousIsActive" BOOLEAN NOT NULL,
    "nextIsActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminWorkspaceAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminWorkspaceAuditLog_workspaceId_createdAt_idx" ON "AdminWorkspaceAuditLog"("workspaceId", "createdAt");
CREATE INDEX "AdminWorkspaceAuditLog_createdAt_idx" ON "AdminWorkspaceAuditLog"("createdAt");

ALTER TABLE "AdminWorkspaceAuditLog"
ADD CONSTRAINT "AdminWorkspaceAuditLog_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
