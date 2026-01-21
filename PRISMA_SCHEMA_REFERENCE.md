# 📊 Prisma Schema - MVP Summary

## 📋 Quick Reference

### ✅ MVP TABLES (11 core tables - Use these now)

| Model             | Purpose                  | Fields                                                                                   | Relations                                       |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `User`            | Authentication & Profile | id, email, passwordHash, displayName, avatarUrl, bio, isActive, lastSeenAt, timestamps   | Owns workspaces, sent messages, posts, comments |
| `Workspace`       | Community/Group          | id, name, description, iconUrl, ownerId, isActive, timestamps                            | Owner (User), members, rooms, posts, AI data    |
| `WorkspaceMember` | Workspace Membership     | id, workspaceId, userId, role (MEMBER/ADMIN), joinedAt                                   | Links User + Workspace                          |
| `Room`            | Chat Channel             | id, workspaceId, name, description, isPrivate, createdById, isActive, timestamps         | Workspace, creator (User), members, messages    |
| `RoomMember`      | Room Membership          | id, roomId, userId, joinedAt                                                             | Links User + Room                               |
| `Message`         | Chat Messages            | id, roomId, senderId, type (TEXT/SYSTEM), content, createdAt                             | Room, sender (User)                             |
| `Post`            | Announcement             | id, workspaceId, authorId, title, body, isPinned, timestamps                             | Workspace, author (User), comments              |
| `PostComment`     | Comment on Post          | id, postId, userId, content, timestamps                                                  | Post, user (User)                               |
| `AiSummary`       | AI Summary Cache         | id, workspaceId?, roomId?, requestedById, periodStart, periodEnd, summaryText, createdAt | Workspace/Room (optional), requester (User)     |
| `AiQuery`         | AI Q&A Log               | id, workspaceId, roomId?, userId, question, answer, tokensUsed?, createdAt               | Workspace, Room?, user (User)                   |

**Total: 11 models (MVP)**

---

### 📌 ENUMS (MVP)

```prisma
enum WorkspaceRole {
  MEMBER  // Regular user
  ADMIN   // Can manage workspace
}

enum MessageType {
  TEXT    // Regular text message
  SYSTEM  // System notification (user joined, etc)
}
```

---

## 🔍 Database Relationships (MVP Only)

```
User (1) ──→ (many) Workspace (owner)
User (1) ──→ (many) WorkspaceMember ←─ (1) Workspace
  ↓
User (1) ──→ (many) RoomMember ←─ (1) Room ←─ (1) Workspace
  ↓
User (1) ──→ (many) Message ←─ (1) Room

User (1) ──→ (many) Post ←─ (1) Workspace
  ↓
User (1) ──→ (many) PostComment ←─ (1) Post

User (1) ──→ (many) AiSummary (requestedBy)
User (1) ──→ (many) AiQuery
```

---

## 💾 What's Included & What's Not

### ✅ Included in MVP

```
Authentication:
- User registration/login ready
- Password hashing support

Workspace Features:
- Create workspace
- Add members
- Admin role support

Chat Features:
- Real-time messaging via Socket.IO
- Message history
- Room management (public/private)

Announcements:
- Create posts
- Pin important posts
- Comment on posts

AI Features:
- Summarize conversations (cache results)
- Log Q&A interactions
- Track token usage
```

### 📌 NOT Included (Phase 2+)

```
Communication:
✗ File/image upload (Attachment model)
✗ Message reactions (emoji)
✗ Message mentions (@user)
✗ Message threading/replies
✗ Read receipts
✗ Typing indicator

Notifications:
✗ Email notifications
✗ Push notifications
✗ In-app notification center

Workspace:
✗ Advanced roles (Manager, Executive)
✗ Invitation links
✗ Permission matrix

AI Features:
✗ Vector embeddings (RAG)
✗ Advanced AI analytics
✗ Usage tracking/billing

Admin:
✗ Detailed activity logs
✗ Workspace analytics
✗ User management dashboard
```

---

## 🚀 How to Use This Schema

### 1. Initial Setup

```bash
# Copy PISMA_SETUP.md to prisma/schema.prisma
cp PISMA_SETUP.md prisma/schema.prisma

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 2. Running Queries

```typescript
// Create workspace
const workspace = await prisma.workspace.create({
  data: {
    name: 'My Team',
    ownerId: userId,
    members: {
      create: [
        { userId, role: 'ADMIN' },
        { userId: otherUserId, role: 'MEMBER' },
      ],
    },
  },
  include: { members: true },
});

// Create room
const room = await prisma.room.create({
  data: {
    workspaceId,
    name: 'general',
    createdById: userId,
    members: {
      create: [{ userId }, { userId: otherUserId }],
    },
  },
});

// Send message
const message = await prisma.message.create({
  data: {
    roomId,
    senderId: userId,
    content: 'Hello!',
  },
  include: { sender: true },
});

// Create announcement
const post = await prisma.post.create({
  data: {
    workspaceId,
    authorId: userId,
    title: 'Important Update',
    body: 'This is important...',
  },
});

// Save AI summary
const summary = await prisma.aiSummary.create({
  data: {
    roomId,
    requestedById: userId,
    periodStart: new Date('2025-01-21'),
    periodEnd: new Date('2025-01-22'),
    summaryText: 'Summary of today...',
  },
});
```

---

## 🔑 Important Notes

### Data Integrity

✅ **Cascade Delete** - When workspace is deleted, all rooms, messages, posts are deleted  
✅ **Unique Constraints** - No duplicate workspace members or room names in same workspace  
✅ **Foreign Keys** - All relations are enforced at database level

### Indexing Strategy

```
Search by:
- Room messages: @@index([roomId, createdAt])
- User activity: @@index([userId, createdAt])
- Workspace content: @@index([workspaceId, createdAt])
- Pinned posts: @@index([workspaceId, isPinned, createdAt])

Unique:
- Workspace member per workspace
- Room name per workspace
```

### Performance Considerations

1. **Message Query** - Use pagination (limit 50)

   ```typescript
   const messages = await prisma.message.findMany({
     where: { roomId },
     orderBy: { createdAt: 'desc' },
     skip: (page - 1) * 50,
     take: 50,
   });
   ```

2. **Room List** - Include only essential data

   ```typescript
   const rooms = await prisma.room.findMany({
     where: { workspaceId },
     include: { _count: { select: { members: true } } },
   });
   ```

3. **AI Summary** - Cache aggressively
   ```typescript
   const cached = await prisma.aiSummary.findFirst({
     where: {
       roomId,
       periodStart: { gte: today },
       periodEnd: { lte: tomorrow },
     },
   });
   ```

---

## 🔄 Migration Path to Phase 2

When you're ready for Phase 2, uncomment these models in order:

```
Week 1: Attachment (file uploads)
Week 2: Notification (in-app notifications)
Week 3: MessageReaction (emoji support)
Week 4: MessageMention (@user tagging)
Week 5: ReadReceipt (seen status)
Week 6: WorkspaceInvitation (invite links)
Week 7: AiUsageLog (advanced analytics)
Week 8: Message threading (replies)
```

Each addition requires:

1. Uncomment model in schema
2. Create migration: `npx prisma migrate dev`
3. Update API endpoints
4. Update frontend components

---

## 📝 Example: Complete Flow

### User A creates workspace and invites User B

```typescript
// 1. A creates workspace
const workspace = await prisma.workspace.create({
  data: {
    name: 'Tamely Team',
    ownerId: userAId,
    members: {
      create: [{ userId: userAId, role: 'ADMIN' }],
    },
  },
});

// 2. A creates room
const room = await prisma.room.create({
  data: {
    workspaceId: workspace.id,
    name: 'general',
    createdById: userAId,
  },
});

// 3. A adds B to workspace
await prisma.workspaceMember.create({
  data: {
    workspaceId: workspace.id,
    userId: userBId,
    role: 'MEMBER',
  },
});

// 4. B joins room
await prisma.roomMember.create({
  data: {
    roomId: room.id,
    userId: userBId,
  },
});

// 5. A sends message to room
const message = await prisma.message.create({
  data: {
    roomId: room.id,
    senderId: userAId,
    content: 'Welcome to our workspace!',
  },
});

// 6. A creates announcement
await prisma.post.create({
  data: {
    workspaceId: workspace.id,
    authorId: userAId,
    title: 'Welcome',
    body: 'Hello team!',
    isPinned: true,
  },
});

// 7. AI generates summary
await prisma.aiSummary.create({
  data: {
    workspaceId: workspace.id,
    requestedById: userAId,
    periodStart: new Date('2025-01-20'),
    periodEnd: new Date('2025-01-21'),
    summaryText: 'Today: 1 message, 1 announcement',
  },
});
```

---

## ✨ That's It!

This schema is production-ready for MVP. All queries will work smoothly with proper indexing.

**Ready to start development? Go to ROADMAP_3MONTHS.md! 🚀**
