import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Basic Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'AI Ticket Management Backend API',
    database: 'helpdesk (PostgreSQL via Prisma)',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dbStatus: '/api/db-status',
      api: '/api',
    },
  });
});

// Health check with DB status
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      runtime: 'Bun',
      database: 'connected (helpdesk)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Explicit Database Status Endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const result: any[] = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    res.status(200).json({
      success: true,
      message: 'Successfully connected to PostgreSQL database',
      databaseInfo: result[0] || {},
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AI Ticket Management Backend API',
    version: '1.0.0',
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}
⚡ Runtime: Bun + Express + TypeScript
🗄️ Database: PostgreSQL (helpdesk) via Prisma
🌍 Client Origin: ${CLIENT_URL}
  `);
});
