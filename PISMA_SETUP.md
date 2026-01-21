// prisma/schema.prisma
// ======================================================
// TAMELY - 3 Month Semester Project (MVP Only)
// ======================================================
// Database: PostgreSQL + Prisma ORM
//
// ✅ MVP MODELS (Required for 3-month deployment)
// 📌 Phase 2+ MODELS (Optional/commented out)
//
// Last Updated: Jan 21, 2025
// ======================================================

generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

// ======================================================
// ✅ MVP ENUMS (Required)
// ======================================================

enum WorkspaceRole {
MEMBER
ADMIN
}

enum MessageType {
TEXT
SYSTEM
}

// ======================================================
// 📌 PHASE 2+ ENUMS (Optional - commented out)
// ======================================================

// enum WorkspaceRoleAdvanced {
// MEMBER
// MANAGER
// EXECUTIVE
// ADMIN
// }

// enum MessageTypeExtended {
// TEXT
// SYSTEM
// FILE
// IMAGE
// VIDEO
// }

// enum NotificationType {
// MENTION
// REPLY
// POST_COMMENT
// SYSTEM
// AI_SUMMARY_READY
// }

// enum AiUsageType {
// SUMMARY
// QUERY
// EMBEDDINGS
// }

// ======================================================
// ✅ MVP MODELS (Required)
// ======================================================

// ----------------------------
// CORE: USER / AUTH
// ----------------------------
model User {
id String @id @default(cuid())
email String @unique
passwordHash String? // ถ้าใช้ OAuth อาจเป็น null ได้
displayName String
avatarUrl String?
bio String?
isActive Boolean @default(true)
lastSeenAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations (MVP)
ownedWorkspaces Workspace[] @relation("WorkspaceOwner")
workspaceMembers WorkspaceMember[]
createdRooms Room[] @relation("RoomCreator")
roomMembers RoomMember[]
sentMessages Message[]
authoredPosts Post[]
postComments PostComment[]
aiSummariesRequest AiSummary[] @relation("AiSummaryRequestedBy")
aiQueries AiQuery[]

@@index([createdAt])
@@index([email])
}

// ----------------------------
// WORKSPACE / COMMUNITY
// ----------------------------
model Workspace {
id String @id @default(cuid())
name String
description String?
iconUrl String?
ownerId String
isActive Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations (MVP)
owner User @relation("WorkspaceOwner", fields: [ownerId], references: [id])
members WorkspaceMember[]
rooms Room[]
posts Post[]
aiSummaries AiSummary[]
aiQueries AiQuery[]

@@index([ownerId])
@@index([createdAt])
@@index([isActive])
}

model WorkspaceMember {
id String @id @default(cuid())
workspaceId String
userId String
role WorkspaceRole @default(MEMBER)
joinedAt DateTime @default(now())

// Relations
workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// ป้องกัน user คนเดิม join workspace เดิมซ้ำ
@@unique([workspaceId, userId])

@@index([userId])
@@index([workspaceId])
}

// ----------------------------
// ROOMS / CHANNELS
// ----------------------------
model Room {
id String @id @default(cuid())
workspaceId String
name String
description String?
isPrivate Boolean @default(false)
createdById String
isActive Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations (MVP)
workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
createdBy User @relation("RoomCreator", fields: [createdById], references: [id])
members RoomMember[]
messages Message[]
aiSummaries AiSummary[]
aiQueries AiQuery[]

@@unique([workspaceId, name])
@@index([workspaceId])
@@index([createdAt])
@@index([isActive])
}

model RoomMember {
id String @id @default(cuid())
roomId String
userId String
joinedAt DateTime @default(now())

// Relations
room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// ป้องกัน join room ซ้ำ
@@unique([roomId, userId])

@@index([userId])
@@index([roomId])
}

// ----------------------------
// MESSAGING
// ----------------------------
model Message {
id String @id @default(cuid())
roomId String
senderId String
type MessageType @default(TEXT)
content String
createdAt DateTime @default(now())

// Relations (MVP)
room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
sender User @relation(fields: [senderId], references: [id], onDelete: Cascade)

@@index([roomId, createdAt])
@@index([senderId, createdAt])
}

// ----------------------------
// ANNOUNCEMENTS / FEED
// ----------------------------
model Post {
id String @id @default(cuid())
workspaceId String
authorId String
title String
body String
isPinned Boolean @default(false)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations (MVP)
workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
comments PostComment[]

@@index([workspaceId, createdAt])
@@index([workspaceId, isPinned, createdAt])
@@index([authorId])
}

model PostComment {
id String @id @default(cuid())
postId String
userId String
content String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations (MVP)
post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([postId, createdAt])
@@index([userId])
}

// ======================================================
// ✅ MVP AI MODELS (Required)
// ======================================================

// ----------------------------
// AI MODULE (CACHE + LOG)
// ----------------------------
model AiSummary {
id String @id @default(cuid())

// Scope: workspace-level summary หรือ room-level summary
workspaceId String?
roomId String?

requestedById String
periodStart DateTime
periodEnd DateTime
summaryText String
createdAt DateTime @default(now())

// Relations (MVP)
workspace Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
room Room? @relation(fields: [roomId], references: [id], onDelete: Cascade)
requestedBy User @relation("AiSummaryRequestedBy", fields: [requestedById], references: [id], onDelete: Cascade)

@@index([workspaceId, periodStart, periodEnd])
@@index([roomId, periodStart, periodEnd])
@@index([requestedById, createdAt])
}

model AiQuery {
id String @id @default(cuid())
workspaceId String
roomId String?
userId String
question String
answer String
tokensUsed Int?
createdAt DateTime @default(now())

// Relations (MVP)
workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
room Room? @relation(fields: [roomId], references: [id], onDelete: SetNull)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([workspaceId, createdAt])
@@index([roomId, createdAt])
@@index([userId, createdAt])
}

// ======================================================
// 📌 PHASE 2+ OPTIONAL MODELS (Not for MVP)
// ======================================================
// Uncomment these when you're ready for Phase 2+
// These add features like file uploads, reactions, notifications

// // ----------------------------
// // FILE ATTACHMENTS (Phase 2)
// // ----------------------------
// enum AttachmentType {
// IMAGE
// VIDEO
// DOCUMENT
// AUDIO
// OTHER
// }

// model Attachment {
// id String @id @default(cuid())
// messageId String?
// postId String?
// url String
// filename String
// mimeType String
// size Int
// type AttachmentType @default(OTHER)
// createdAt DateTime @default(now())

// message Message? @relation(fields: [messageId], references: [id], onDelete: Cascade)
// post Post? @relation(fields: [postId], references: [id], onDelete: Cascade)

// @@index([messageId])
// @@index([postId])
// }

// // ----------------------------
// // NOTIFICATIONS (Phase 2)
// // ----------------------------
// model Notification {
// id String @id @default(cuid())
// userId String
// type NotificationType
// title String
// message String
// metadata Json?
// isRead Boolean @default(false)
// createdAt DateTime @default(now())

// user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// @@index([userId, isRead, createdAt])
// }

// // ----------------------------
// // MESSAGE REACTIONS (Phase 2)
// // ----------------------------
// model MessageReaction {
// id String @id @default(cuid())
// messageId String
// userId String
// emoji String
// createdAt DateTime @default(now())

// message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
// user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// @@unique([messageId, userId, emoji])
// @@index([messageId])
// }

// // ----------------------------
// // MESSAGE MENTIONS (Phase 2)
// // ----------------------------
// model MessageMention {
// id String @id @default(cuid())
// messageId String
// mentionedId String
// createdAt DateTime @default(now())

// message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)

// @@index([messageId])
// }

// // ----------------------------
// // READ RECEIPTS (Phase 2)
// // ----------------------------
// model ReadReceipt {
// id String @id @default(cuid())
// roomId String
// userId String
// lastReadAt DateTime @default(now())
// lastMessageId String?

// room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
// user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// @@unique([roomId, userId])
// @@index([userId])
// }

// // ----------------------------
// // WORKSPACE INVITATIONS (Phase 2)
// // ----------------------------
// model WorkspaceInvitation {
// id String @id @default(cuid())
// workspaceId String
// code String @unique
// maxUses Int?
// usedCount Int @default(0)
// expiresAt DateTime?
// createdAt DateTime @default(now())

// workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

// @@index([workspaceId])
// @@index([code])
// }

// // ----------------------------
// // AI USAGE TRACKING (Phase 2)
// // ----------------------------
// model AiUsageLog {
// id String @id @default(cuid())
// userId String
// workspaceId String
// type AiUsageType
// tokensUsed Int
// cost Float?
// metadata Json?
// createdAt DateTime @default(now())

// user User @relation(fields: [userId], references: [id], onDelete: Cascade)
// workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

// @@index([userId, createdAt])
// @@index([workspaceId, createdAt])
// }

// // ----------------------------
// // MESSAGE THREADING (Phase 2)
// // ----------------------------
// // Add to Message model:
// // parentId String?
// // parent Message? @relation("MessageThread", fields: [parentId], references: [id], onDelete: SetNull)
// // replies Message[] @relation("MessageThread")
// // editedAt DateTime?
// // isDeleted Boolean @default(false)
