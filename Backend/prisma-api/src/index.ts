// ⚠️ ต้องโหลด dotenv ก่อน import อื่นๆ
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './modules/auth/auth.routes';
import oauthRoutes from './modules/oauth/oauth.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';
import customRoleRoutes from './modules/custom-role/custom-role.routes';
import roomRoutes from './modules/room/room.routes';
import messageRoutes from './modules/message/message.routes';
import postRoutes from './modules/post/post.routes';
import taskRoutes from './modules/task/task.routes';
import notificationRoutes from './modules/notification/notification.routes';
import dmRoutes from './modules/dm/dm.routes';
import aiRoutes from './modules/ai/ai.routes';
import passport from './modules/oauth/oauth.config';
import { initSocketIO } from './modules/chat/chat.gateway';
import { ensureBucket, CHAT_FILES_BUCKET } from './utils/supabase-storage';

// Middlewares
import { errorHandler } from './middlewares/error';

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const initialPort = Number(process.env.PORT) || 8080;

// ========================
// Global Middlewares
// ========================
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // อนุญาต request ที่ไม่มี origin (เช่น curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize()); // Passport (OAuth)

// ========================
// Routes
// ========================
app.get('/', (req, res) => {
  res.send('Hello from Tamely API!');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', db: 'connected to Supabase' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

// TURN credentials endpoint (ให้ Frontend ดึง ICE servers ที่มี TURN)
app.get('/api/turn-credentials', async (_req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    res.json({ iceServers: [] });
    return;
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`,
      { method: 'POST', headers: { Authorization: `Basic ${credentials}` } },
    );
    const data = await response.json() as { ice_servers?: { url?: string; urls?: string; username?: string; credential?: string }[] };
    const iceServers = (data.ice_servers ?? []).map((s) => ({
      urls: s.urls ?? s.url ?? '',
      ...(s.username ? { username: s.username } : {}),
      ...(s.credential ? { credential: s.credential } : {}),
    }));
    res.json({ iceServers });
  } catch {
    res.json({ iceServers: [] });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', customRoleRoutes);
app.use('/api', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', postRoutes);
app.use('/api', taskRoutes);
app.use('/api', notificationRoutes);
app.use('/api', dmRoutes);
app.use('/api', aiRoutes);

// ========================
// Error Handler (ต้องอยู่ท้ายสุดเสมอ)
// ========================
app.use(errorHandler);

// ========================
// Socket.IO
// ========================
initSocketIO(server, allowedOrigins);

// ========================
// Start Server
// ========================

const startServer = (port: number) => {
  server
    .once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, trying ${port + 1}...`);
        startServer(port + 1);
        return;
      }
      throw error;
    })
    .listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      // Ensure Supabase buckets exist on startup
      ensureBucket(CHAT_FILES_BUCKET, true).catch(() => {});
    });
};

startServer(initialPort);


// Graceful shutdown — ปิด Prisma เมื่อ server หยุด
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log(' Prisma disconnected');
  process.exit(0);
});
