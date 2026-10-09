import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

const UPLOADS = path.join(process.cwd(), 'uploads');
const CACHE = path.join(UPLOADS, '.cache');
// Fixed set of widths keeps the cache bounded (no cache-busting via ?w=999999).
// 24 is the blurred placeholder shown while a hero image is still decoding;
// the rest are the delivery widths the brief asks for, up to 2400 so a retina
// screen gets twice what it displays.
const WIDTHS = [24, 600, 900, 1200, 1600, 2000, 2400];

// 75 left photographs visibly soft once they were scaled down; the brief asks
// for 82-85 on galleries, lightbox and hero, which is every image here.
const QUALITY = 84;

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
  let w = WIDTHS.reduce(
    (best, cur) => (Math.abs(cur - requested) < Math.abs(best - requested) ? cur : best),
    WIDTHS[WIDTHS.length - 1],
  );

  // Never ask for more pixels than the photograph has. sharp would not enlarge
  // anyway, but without this every oversized request writes its own cache file
  // holding the same image at the original's size.
  if (w > 24) {
    try {
      const { width } = await sharp(src).metadata();
      if (width) {
        const fits = WIDTHS.filter(c => c > 24 && c <= width);
        if (!fits.length) w = Math.min(w, WIDTHS[1]);
        else if (w > fits[fits.length - 1]) w = fits[fits.length - 1];
      }
    } catch { /* unreadable metadata — fall through and let the resize decide */ }
  }

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
      .rotate()  // honour EXIF orientation, so portraits are not served sideways
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
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
