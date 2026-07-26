import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

const UPLOADS = path.join(process.cwd(), 'uploads');
const CACHE = path.join(UPLOADS, '.cache');
// Fixed set of widths keeps the cache bounded (no cache-busting via ?w=999999)
const WIDTHS = [320, 480, 640, 960, 1280, 1920];

// GET /img/:file?w=640 — on-demand resized webp with a disk cache.
// First request generates the variant; every later request is a static file hit.
router.get('/img/:file', async (req, res) => {
  // basename() strips any path-traversal attempts ("..", slashes)
  const file = path.basename(String(req.params.file));
  const src = path.join(UPLOADS, file);
  if (!fs.existsSync(src)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const requested = parseInt(String(req.query.w), 10);
  if (!Number.isFinite(requested)) {
    // No width requested — serve the original
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(src);
    return;
  }

  // Snap to the nearest allowed width
  const w = WIDTHS.reduce(
    (best, cur) => (Math.abs(cur - requested) < Math.abs(best - requested) ? cur : best),
    WIDTHS[WIDTHS.length - 1],
  );

  const cacheName = `w${w}-${file.replace(/\.[^.]+$/, '')}.webp`;
  const cached = path.join(CACHE, cacheName);

  if (fs.existsSync(cached)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/webp');
    res.sendFile(cached);
    return;
  }

  try {
    fs.mkdirSync(CACHE, { recursive: true });
    // Write to a temp file then rename — concurrent requests never read a half-written file
    const tmp = `${cached}.tmp-${process.pid}-${Date.now()}`;
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(tmp);
    fs.renameSync(tmp, cached);

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/webp');
    res.sendFile(cached);
  } catch (err) {
    console.error('[img] resize failed, serving original:', err);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(src);
  }
});

export default router;
