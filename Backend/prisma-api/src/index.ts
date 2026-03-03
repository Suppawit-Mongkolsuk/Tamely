import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Tamely API!');
});

// Test DB connection
app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', db: 'connected to Supabase' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});