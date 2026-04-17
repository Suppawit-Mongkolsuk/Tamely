ALTER TYPE "AdminWorkspaceActionType" ADD VALUE 'DELETE';

ALTER TABLE "AdminWorkspaceAuditLog"
ADD COLUMN "workspaceNameSnapshot" TEXT;

UPDATE "AdminWorkspaceAuditLog" log
SET "workspaceNameSnapshot" = ws."name"
FROM "Workspace" ws
WHERE log."workspaceId" = ws."id";

ALTER TABLE "AdminWorkspaceAuditLog"
ALTER COLUMN "workspaceNameSnapshot" SET NOT NULL;

ALTER TABLE "AdminWorkspaceAuditLog"
ALTER COLUMN "workspaceId" DROP NOT NULL;

ALTER TABLE "AdminWorkspaceAuditLog"
DROP CONSTRAINT "AdminWorkspaceAuditLog_workspaceId_fkey";

ALTER TABLE "AdminWorkspaceAuditLog"
ADD CONSTRAINT "AdminWorkspaceAuditLog_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
