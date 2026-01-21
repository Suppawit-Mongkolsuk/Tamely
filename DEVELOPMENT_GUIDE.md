# 📋 Development Guidelines - Tamely Project

## ⚡ Quick Start Commands

```bash
# Setup Backend
npm init -y
npm install express prisma @prisma/client typescript socket.io bcrypt jsonwebtoken joi cors
npm install -D nodemon ts-node @types/express @types/node

# Setup Frontend
npm create vite@latest tamely-web -- --template react
cd tamely-web
npm install axios socket.io-client zustand react-router-dom

# Prisma Setup
npx prisma init
# Configure DATABASE_URL in .env

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Start dev servers
# Terminal 1 (Backend)
npm run dev

# Terminal 2 (Frontend)
npm run dev
```

---

## 🏗️ Folder Structure (Recommended)

```
tamely/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── socket/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Workspace/
│   │   │   ├── Room/
│   │   │   ├── Chat/
│   │   │   └── Feed/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── .env
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── ROADMAP_3MONTHS.md
```

---

## 🔑 Key Architecture Decisions

### 1. Socket.IO Setup (Real-time Messaging)

```typescript
// backend/src/socket/messageHandler.ts
import { Server, Socket } from 'socket.io';

export const setupMessageHandlers = (io: Server, socket: Socket) => {
  socket.on('join-room', (roomId: string) => {
    socket.join(`room:${roomId}`);
  });

  socket.on(
    'send-message',
    async (data: { roomId: string; content: string; senderId: string }) => {
      // 1. Save to database
      const message = await prisma.message.create({
        data: {
          roomId: data.roomId,
          senderId: data.senderId,
          content: data.content,
        },
        include: { sender: true },
      });

      // 2. Broadcast to room
      io.to(`room:${data.roomId}`).emit('new-message', message);
    },
  );

  socket.on('leave-room', (roomId: string) => {
    socket.leave(`room:${roomId}`);
  });
};
```

### 2. API-First Approach

```typescript
// backend/src/routes/messages.ts
router.get('/rooms/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 50;

  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: { sender: true },
  });

  res.json(messages.reverse());
});
```

### 3. Authentication Flow

```typescript
// backend/src/middleware/auth.ts
export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### 4. Frontend State Management (Zustand)

```typescript
// frontend/src/store/chatStore.ts
import { create } from 'zustand';

interface ChatStore {
  messages: Message[];
  currentRoom: string | null;
  addMessage: (msg: Message) => void;
  setCurrentRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  currentRoom: null,
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
}));
```

---

## 📱 Component Templates

### Chat Room Component

```tsx
// frontend/src/components/Chat/ChatRoom.tsx
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';

export const ChatRoom = ({ roomId }: { roomId: string }) => {
  const socket = useSocket();
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    socket?.emit('join-room', roomId);

    socket?.on('new-message', (msg) => {
      addMessage(msg);
    });

    return () => {
      socket?.emit('leave-room', roomId);
    };
  }, [roomId]);

  const sendMessage = () => {
    socket?.emit('send-message', {
      roomId,
      content: input,
      senderId: user.id,
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4">
            <span className="font-bold">{msg.sender.displayName}</span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

```
Authentication:
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] JWT token refresh

Workspace:
- [ ] Create workspace
- [ ] Join workspace with code
- [ ] View workspace members
- [ ] Leave workspace

Rooms:
- [ ] Create room in workspace
- [ ] Join room
- [ ] View room members
- [ ] Leave room

Messaging:
- [ ] Send message in room
- [ ] Message appears for all users in room <500ms
- [ ] Load message history
- [ ] Messages persist after refresh

Announcements:
- [ ] Create post
- [ ] Edit post (if author)
- [ ] Delete post (if admin)
- [ ] Pin post (if admin)

AI:
- [ ] Request summary
- [ ] Summary appears within 5 seconds
- [ ] Same summary used if requested again same day
```

---

## 🚨 Common Pitfalls to Avoid

### 1. Socket.IO Message Ordering

```typescript
// ❌ WRONG: Race condition
socket.on('send-message', (data) => {
  saveToDb(data);
  broadcast(data);
});

// ✅ RIGHT: Atomic operation
socket.on('send-message', async (data) => {
  const msg = await db.message.create(data);
  broadcast(msg); // Use DB data, not request data
});
```

### 2. Missing Permissions Check

```typescript
// ❌ WRONG
router.post('/rooms/:roomId/leave', (req, res) => {
  // Just remove user
});

// ✅ RIGHT
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
  const member = await db.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: req.user.id } },
  });
  if (!member) return res.status(403).json({ error: 'Not a member' });
  // Remove user
});
```

### 3. N+1 Query Problem

```typescript
// ❌ WRONG
const rooms = await db.room.findMany();
const roomsWithMembers = await Promise.all(
  rooms.map((r) => db.roomMember.findMany({ where: { roomId: r.id } })),
);

// ✅ RIGHT (Prisma)
const roomsWithMembers = await db.room.findMany({
  include: { members: true },
});
```

### 4. Missing CORS for Socket.IO

```typescript
// backend/src/app.ts
import cors from 'cors';
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
```

---

## 💾 Database Backup Strategy

```bash
# Backup PostgreSQL
docker exec postgres pg_dump -U postgres tamely > backup.sql

# Restore
docker exec -i postgres psql -U postgres < backup.sql

# For production: Use managed database (Railway/Supabase)
```

---

## 🔒 Environment Variables Template

```env
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/tamely"
JWT_SECRET="your-super-secret-key-change-this"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# AI
OPENAI_API_KEY="sk-xxxx"
OPENAI_MODEL="gpt-3.5-turbo"

# frontend/.env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
```

---

## 📊 Performance Checklist

Before submitting:

- [ ] No console errors
- [ ] API response time <200ms
- [ ] Socket message delivery <500ms
- [ ] Database queries optimized (show indexed queries)
- [ ] No memory leaks (Chrome DevTools)
- [ ] Works with 50 concurrent users

---

## 🎯 Submission Checklist

- [ ] All features in MVP implemented
- [ ] 3-5 test users successfully tested
- [ ] README with setup instructions
- [ ] GitHub repository with commit history
- [ ] Demo script prepared (10 minutes)
- [ ] Code commented
- [ ] No hardcoded secrets
- [ ] Database schema included (schema.prisma)

---

**Questions? Keep this guide for reference! 💪**
