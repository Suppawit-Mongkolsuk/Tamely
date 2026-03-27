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
import passport from './modules/oauth/oauth.config';

// Middlewares
import { errorHandler } from './middlewares/error';

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes); // OAuth routes (Google, GitHub)

// ========================
// Error Handler (ต้องอยู่ท้ายสุดเสมอ)
// ========================
app.use(errorHandler);

// ========================
// Start Server
// ========================
server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port} (0.0.0.0)`);
});

// Graceful shutdown — ปิด Prisma เมื่อ server หยุด
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log(' Prisma disconnected');
  process.exit(0);
});
