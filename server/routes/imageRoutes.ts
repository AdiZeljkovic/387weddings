import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

const UPLOADS = path.join(process.cwd(), 'uploads');
const CACHE = path.join(UPLOADS, '.cache');
// Fixed set of widths keeps the cache bounded (no cache-busting via ?w=999999).
// 24 is the blurred placeholder shown while a hero image is still decoding;
// 300 and 400 serve small frames on phones (the fan's cards, the pile, a
// two-column gallery); the rest are the delivery widths the brief asks for, up
// to 2400 so a retina screen gets twice what it displays.
const WIDTHS = [24, 300, 400, 600, 900, 1200, 1600, 2000, 2400];

// 75 left photographs visibly soft once they were scaled down; the brief asks
// for 82-85 on galleries, lightbox and hero, which is every image here.
const QUALITY = 84;

// An original's width, read once: sharp used to open the original (often
// 3-40 MB) on every request, even when the variant was already on disk
const widthOf = new Map<string, number | null>();
async function originalWidth(src: string, file: string) {
  if (widthOf.has(file)) return widthOf.get(file)!;
  let width: number | null = null;
  try { width = (await sharp(src).metadata()).width ?? null; } catch { /* unreadable */ }
  widthOf.set(file, width);
  return width;
}

// At most two variants are made at once, and two requests for the same one
// share the work: a burst of first visits used to start a full decode of the
// same large original for every request in parallel
const MAX_JOBS = 2;
let running = 0;
const queue: (() => void)[] = [];
const inFlight = new Map<string, Promise<void>>();
const slot = () => new Promise<void>(resolve => {
  if (running < MAX_JOBS) { running++; resolve(); }
  else queue.push(() => { running++; resolve(); });
});
const release = () => { running--; queue.shift()?.(); };

function makeVariant(src: string, cached: string, w: number) {
  const existing = inFlight.get(cached);
  if (existing) return existing;
  const job = (async () => {
    await slot();
    try {
      if (fs.existsSync(cached)) return;
      fs.mkdirSync(CACHE, { recursive: true });
      // Write to a temp file then rename — no request ever reads a half-written file
      const tmp = `${cached}.tmp-${process.pid}-${Date.now()}`;
      await sharp(src)
        .rotate()  // honour EXIF orientation, so portraits are not served sideways
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(tmp);
      fs.renameSync(tmp, cached);
    } finally {
      release();
    }
  })();
  inFlight.set(cached, job);
  job.finally(() => inFlight.delete(cached)).catch(() => {});
  return job;
}

// GET /img/:file?w=640 — on-demand resized webp with a disk cache.
// First request generates the variant; every later request is a static file hit.
router.get('/img/:file', async (req, res) => {
  // basename() strips any path-traversal attempts ("..", slashes)
  const file = path.basename(req.params.file);
  const src = path.join(UPLOADS, file);
  if (!file || file.startsWith('.') || !fs.existsSync(src)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // Only a plain number is a width; anything else (?w[x]=1 arrives as an
  // object) means the original
  const q = req.query.w;
  const requested = typeof q === 'string' ? parseInt(q, 10) : NaN;
  if (!Number.isFinite(requested)) {
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
    const width = await originalWidth(src, file);
    if (width) {
      const fits = WIDTHS.filter(c => c > 24 && c <= width);
      if (!fits.length) w = Math.min(w, WIDTHS[1]);
      else if (w > fits[fits.length - 1]) w = fits[fits.length - 1];
    }
  }

  const cached = path.join(CACHE, `w${w}-${file.replace(/\.[^.]+$/, '')}.webp`);

  try {
    if (!fs.existsSync(cached)) await makeVariant(src, cached, w);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/webp');
    res.sendFile(cached);
  } catch (err) {
    console.error('[img] resize failed, serving original:', err);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(src);
  }
});

export default router;
