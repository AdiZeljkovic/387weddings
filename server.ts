import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { initDB, pool } from './server/db.js';
import authRoutes from './server/routes/authRoutes.js';
import galleryRoutes from './server/routes/galleryRoutes.js';
import packageRoutes from './server/routes/packageRoutes.js';
import testimonialRoutes from './server/routes/testimonialRoutes.js';
import submissionRoutes from './server/routes/submissionRoutes.js';
import contactRoutes from './server/routes/contactRoutes.js';
import settingsRoutes from './server/routes/settingsRoutes.js';
import contentRoutes from './server/routes/contentRoutes.js';
import seoRoutes from './server/routes/seoRoutes.js';

dotenv.config();

// ── Env validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}


const isProd = process.env.NODE_ENV === 'production';

// ── Rate limiters ────────────────────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: 'Too many requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // tight cap to slow brute-force against admin login
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ── Security headers ───────────────────────────────────────────────────────
  // Explicit CSP in production allowing the exact external origins the app uses
  // (Google Fonts, Google Tag Manager / Analytics, Unsplash images). Inline
  // scripts/styles are needed for the injected GA/GTM snippets and inline styles.
  app.use(helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
            connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://www.googletagmanager.com'],
            frameSrc: ["'self'", 'https://www.googletagmanager.com'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false, // relax CSP in dev (Vite HMR needs it)
    crossOriginEmbedderPolicy: false, // needed for fonts/images from external CDNs
  }));

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = isProd
    ? [process.env.SITE_URL || 'https://387cinematicweddings.com']
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  // ── Compression ────────────────────────────────────────────────────────────
  app.use(compression());

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Serve uploaded files — immutable because every upload gets a unique timestamp filename
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Initialize database
  await initDB();

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/contact', contactLimiter, contactRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/content', contentRoutes);

  // Sitemap + robots.txt — served dynamically from DB (before Vite/static middleware)
  app.use(seoRoutes);

  // ── Static / SPA ───────────────────────────────────────────────────────────
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist'), {
      maxAge: '1y',
      immutable: true,
      index: false,
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    if (!isProd) console.log(`Run POST /api/auth/setup to create the first admin user`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000); // force-kill after 10s
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

startServer().catch(console.error);
