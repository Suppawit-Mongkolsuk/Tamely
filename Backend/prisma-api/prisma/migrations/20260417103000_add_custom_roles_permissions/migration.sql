-- CreateTable
CREATE TABLE "CustomRole" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "position" INTEGER NOT NULL DEFAULT 0,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRoleMember" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "customRoleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomRoleMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_workspaceId_name_key" ON "CustomRole"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "CustomRole_workspaceId_idx" ON "CustomRole"("workspaceId");

-- CreateIndex
CREATE INDEX "CustomRole_workspaceId_position_idx" ON "CustomRole"("workspaceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRoleMember_customRoleId_userId_key" ON "CustomRoleMember"("customRoleId", "userId");

-- CreateIndex
CREATE INDEX "CustomRoleMember_workspaceId_userId_idx" ON "CustomRoleMember"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "CustomRole"
ADD CONSTRAINT "CustomRole_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoleMember"
ADD CONSTRAINT "CustomRoleMember_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoleMember"
ADD CONSTRAINT "CustomRoleMember_customRoleId_fkey"
FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoleMember"
ADD CONSTRAINT "CustomRoleMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
