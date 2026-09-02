import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { hashPassword } from 'better-auth/crypto';
import { Role } from '@prisma/client';
import { toNodeHandler } from 'better-auth/node';
import { prisma } from './db/prisma.js';
import { auth } from './config/auth.js';
import { requireAuth, requireAdmin } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

// ---------------------------------------------------------------------------
// Startup Secret Validation — refuse to start with insecure placeholder values
// ---------------------------------------------------------------------------
const PLACEHOLDER = 'super-secure-random-session-secret-key-at-least-32-chars';

function validateSecrets(): void {
  const authSecret = process.env.BETTER_AUTH_SECRET ?? '';
  const sessionSecret = process.env.SESSION_SECRET ?? '';

  const errors: string[] = [];

  if (!authSecret || authSecret === PLACEHOLDER || authSecret.length < 32) {
    errors.push(
      'BETTER_AUTH_SECRET must be set to a cryptographically random string of at least 32 characters.'
    );
  }

  if (!sessionSecret || sessionSecret === PLACEHOLDER || sessionSecret.length < 32) {
    errors.push(
      'SESSION_SECRET must be set to a cryptographically random string of at least 32 characters.'
    );
  }

  if (authSecret === sessionSecret && authSecret.length >= 32) {
    errors.push(
      'BETTER_AUTH_SECRET and SESSION_SECRET must be different values.'
    );
  }

  if (errors.length > 0) {
    console.error('\n🚨 SERVER STARTUP BLOCKED — Insecure configuration detected:\n');
    errors.forEach((e) => console.error(`  ✖ ${e}`));
    console.error(
      '\n  Generate secure secrets with:\n  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n'
    );
    process.exit(1);
  }
}

validateSecrets();

// ---------------------------------------------------------------------------
// App Setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Security Headers — must be first
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------------------------------------------------------------------------
// Rate Limiters
// ---------------------------------------------------------------------------

/** Strict limiter on authentication routes — prevents brute-force */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

/** General API limiter */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please slow down.',
  },
});

// Apply auth limiter BEFORE the Better Auth handler
app.use('/api/auth/sign-in', authLimiter);

// ---------------------------------------------------------------------------
// Better Auth Route Handler (must be before express.json())
// ---------------------------------------------------------------------------
app.all('/api/auth/*', toNodeHandler(auth));

// ---------------------------------------------------------------------------
// Body Parsing (with size limit)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Apply general rate limiter to all /api routes
app.use('/api', apiLimiter);

// ---------------------------------------------------------------------------
// Public Routes
// ---------------------------------------------------------------------------

/** Minimal root — no tech stack info leaked */
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'online' });
});

/** Health check — sanitized, no internal details in error response */
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log internally — never expose error details to the client
    console.error('[health] Database connectivity check failed:', error);
    res.status(500).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api', (_req, res) => {
  res.status(200).json({
    message: 'AI Ticket Management API',
    version: '1.0.0',
  });
});

// ---------------------------------------------------------------------------
// Protected Routes
// ---------------------------------------------------------------------------

/** Current session info */
app.get('/api/me', requireAuth, (req: any, res) => {
  res.status(200).json({
    user: req.user,
    session: req.session,
  });
});

/**
 * DB diagnostics — ADMIN only.
 * Sanitized: does not return DB user, version string, or connection details.
 */
app.get('/api/db-status', requireAuth, requireAdmin, async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'Database is connected.',
    });
  } catch (error) {
    console.error('[db-status] Database check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

// ---------------------------------------------------------------------------
// User Management Endpoints (Admin only)
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role).optional().default(Role.AGENT),
});

/** List all users */
app.get('/api/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

/** Create a new user */
app.post('/api/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors[0]?.message || 'Invalid user data',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, role } = parseResult.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: `A user with email ${email} already exists.`,
      });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const now = new Date();

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          role,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.account.create({
        data: {
          id: accountId,
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          issuer: 'local:credential',
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      user: newUser,
      message: 'User created successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Global Error Handler — must be LAST
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}
⚡ Runtime: Bun + Express + TypeScript
🛡️  Security: helmet + rate-limiting + RBAC active
🌍 Client Origin: ${CLIENT_URL}
  `);
});
