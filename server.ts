import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { initDB, pool } from './server/db.js';
import { backfillImageMeta } from './server/imageBackfill.js';
import authRoutes from './server/routes/authRoutes.js';
import galleryRoutes from './server/routes/galleryRoutes.js';
import submissionRoutes from './server/routes/submissionRoutes.js';
import contactRoutes from './server/routes/contactRoutes.js';
import settingsRoutes from './server/routes/settingsRoutes.js';
import contentRoutes from './server/routes/contentRoutes.js';
import seoRoutes from './server/routes/seoRoutes.js';
import imageRoutes from './server/routes/imageRoutes.js';
import storyRoutes from './server/routes/storyRoutes.js';
import { renderShell } from './server/shell.js';

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

  // ── Canonical host ─────────────────────────────────────────────────────────
  // The site answered on two domains, which split the SEO signal. Everything
  // that is not the canonical host gets a permanent redirect to it.
  if (isProd) {
    app.set('trust proxy', 1);
    const canonicalHost = (() => {
      try { return new URL(process.env.SITE_URL || 'https://387weddings.ba').host; }
      catch { return '387weddings.ba'; }
    })();
    app.use((req, res, next) => {
      const host = req.headers.host;
      // Health checks hit the container directly, so never bounce them
      if (!host || req.path === '/api/health' || host === canonicalHost) return next();
      res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
    });
  }

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = isProd
    ? [process.env.SITE_URL || 'https://387weddings.ba']
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  // ── Compression ────────────────────────────────────────────────────────────
  app.use(compression());

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // On-demand resized image variants (/img/:file?w=640) — must come before static
  app.use(imageRoutes);

  // Serve uploaded files — immutable because every upload gets a unique timestamp filename
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Initialize database
  await initDB();

  // Dimensions for uploads that predate image_meta. Not awaited: the site does
  // not need it to start, and it falls back to the stored shape until it lands.
  backfillImageMeta().catch(err => console.error('[image-meta]', err));

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });

  // The story page used to live under /prica/:slug; keep those links alive
  app.get('/prica/:slug', (req, res) => {
    res.redirect(301, `/portfolio/${encodeURIComponent(req.params.slug)}`);
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/stories', storyRoutes);
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
    // A single-page app answered 200 for every URL, so unknown pages looked
    // like real pages to crawlers (soft 404) and /favicon.ico returned HTML.
    // Known routes still get the shell; anything else gets a real 404.
    const KNOWN_ROUTES = new Set(['/', '/portfolio', '/about', '/contact', '/privacy']);
    const isKnownRoute = (p: string) =>
      KNOWN_ROUTES.has(p.replace(/\/$/, '') || '/') || p.startsWith('/admin') || p.startsWith('/portfolio/');

    const shell = path.join(process.cwd(), 'dist', 'index.html');

    app.get('*', async (req, res) => {
      // Anything with a file extension that reached this point does not exist
      if (path.extname(req.path)) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }

      // A story URL is only real if that slug is published. Without this check
      // every /portfolio/<anything> answered 200, which is a soft 404.
      let ok = isKnownRoute(req.path);
      const story = req.path.match(/^\/portfolio\/([^/]+)\/?$/);
      if (story) {
        try {
          const { rowCount } = await pool.query(
            'SELECT 1 FROM stories WHERE slug = $1 AND is_published = TRUE',
            [decodeURIComponent(story[1])]
          );
          ok = (rowCount ?? 0) > 0;
        } catch {
          ok = true; // a database hiccup must not turn a real page into a 404
        }
      }

      // The shell must revalidate every time: the asset filenames inside it
      // change on each build, so a cached shell would point at files that no
      // longer exist. The hashed assets themselves keep their one-year headers.
      res.setHeader('Cache-Control', 'no-cache');

      // Meta tags are written in before the HTML leaves, so crawlers and link
      // previews see this page rather than the homepage's defaults.
      const lang = req.query.lang === 'en' ? 'en' : 'bs';
      try {
        const html = await renderShell(req.path, lang);
        res.status(ok ? 200 : 404).type('html').send(html);
      } catch {
        res.status(ok ? 200 : 404).sendFile(shell);
      }
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
