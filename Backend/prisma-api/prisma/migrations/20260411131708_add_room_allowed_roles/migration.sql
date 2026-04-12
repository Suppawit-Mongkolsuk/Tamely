-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "allowedRoles" "WorkspaceRole"[] DEFAULT ARRAY[]::"WorkspaceRole"[];
