-- AlterTable
ALTER TABLE "RoomMember" ADD COLUMN "lastReadAt" TIMESTAMP(3);

-- Backfill existing members so old messages before they joined are not counted as unread
UPDATE "RoomMember"
SET "lastReadAt" = "joinedAt"
WHERE "lastReadAt" IS NULL;

-- Make column required for future unread calculations
ALTER TABLE "RoomMember" ALTER COLUMN "lastReadAt" SET NOT NULL;
ALTER TABLE "RoomMember" ALTER COLUMN "lastReadAt" SET DEFAULT CURRENT_TIMESTAMP;
