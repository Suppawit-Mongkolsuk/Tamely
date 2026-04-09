-- ============================================================
-- Migration: add_notification
-- เพิ่ม MentionTargetType enum และ Notification model
-- รวมถึง relation arrays ใน User, Workspace, Post, PostComment
-- ============================================================

-- 1. สร้าง enum MentionTargetType
CREATE TYPE "MentionTargetType" AS ENUM ('USER', 'ROLE');

-- 2. สร้างตาราง Notification
CREATE TABLE "Notification" (
    "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID          NOT NULL,
    "userId"      UUID          NOT NULL,
    "senderId"    UUID          NOT NULL,
    "type"        "MentionTargetType" NOT NULL,
    "targetRole"  "WorkspaceRole",
    "postId"      UUID,
    "commentId"   UUID,
    "content"     TEXT          NOT NULL,
    "isRead"      BOOLEAN       NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- 3. Foreign Keys
ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Indexes
CREATE INDEX "Notification_userId_isRead_createdAt_idx"
    ON "Notification"("userId", "isRead", "createdAt");

CREATE INDEX "Notification_workspaceId_idx"
    ON "Notification"("workspaceId");

CREATE INDEX "Notification_senderId_idx"
    ON "Notification"("senderId");
