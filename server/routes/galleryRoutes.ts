import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// A 6000x4000 original off a full-frame camera runs well past 10MB, which the
// old limit rejected outright. The brief asks for originals at 2400px or more
// on the long edge, so the ceiling has to leave room for them.
const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|avif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// GET /api/gallery — public
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gallery_images WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC'
    );
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/gallery/all — admin (sve, uključujući neaktivne)
router.get('/all', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/gallery — admin
router.post('/', requireAuth, async (req, res) => {
  const { url, category, title, location, sort_order, layout } = req.body;
  if (!url || !category) {
    res.status(400).json({ error: 'URL and category are required' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO gallery_images (url, category, layout, title, location, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [url, category, layout || 'TALL', title || null, location || null, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/gallery/:id — admin
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { url, category, layout, title, location, sort_order, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE gallery_images
       SET url = COALESCE($1, url),
           category = COALESCE($2, category),
           layout = COALESCE($3, layout),
           title = COALESCE($4, title),
           location = COALESCE($5, location),
           sort_order = COALESCE($6, sort_order),
           is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [url, category, layout, title, location, sort_order, is_active, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/gallery/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM gallery_images WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/gallery/upload — admin, file upload
router.post('/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Fajl je prevelik. Maksimalna veličina je 40 MB.' });
      } else {
        res.status(400).json({ error: err.message || 'Upload nije uspio.' });
      }
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Nije odabran fajl.' });
      return;
    }

    const inputPath = path.join(process.cwd(), 'uploads', req.file.filename);

    // The original is KEPT, exactly as the owner sent it. It used to be
    // resized to 1920 and re-encoded to webp here, which permanently threw
    // away resolution the photographer had paid for and softened every frame
    // on a retina screen. Delivery sizes are derived on demand by /img
    // instead, so the file on disk stays the master copy.
    try {
      const meta = await sharp(inputPath).metadata();
      // EXIF orientation 5-8 stores the image rotated a quarter turn
      const turned = (meta.orientation ?? 1) >= 5;
      const width  = (turned ? meta.height : meta.width) ?? 0;
      const height = (turned ? meta.width : meta.height) ?? 0;
      if (!width || !height) throw new Error('no dimensions');

      const orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';

      await pool.query(
        `INSERT INTO image_meta (file, width, height, orientation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (file) DO UPDATE
           SET width = $2, height = $3, orientation = $4`,
        [req.file.filename, width, height, orientation]
      );

      // The brief asks the panel to say so rather than silently accept it
      const long = Math.max(width, height);
      res.json({
        url: `/uploads/${req.file.filename}`,
        width,
        height,
        orientation,
        warning: long < 2000
          ? `Fotografija je ${width}x${height} px. Preporučeno je najmanje 2000 px `
            + `po dužoj strani, inače može izgledati mekano na velikim ekranima.`
          : undefined,
      });
    } catch (sharpErr) {
      // If sharp can't read it, the file isn't an image we trust — delete it
      // rather than serving an unverified upload.
      console.error('sharp could not read the upload, rejecting it:', sharpErr);
      try { fs.unlinkSync(inputPath); } catch { /* already gone */ }
      res.status(400).json({ error: 'Datoteka nije važeća slika.' });
    }
  });
});

// GET /api/gallery/meta?files=a.jpg,b.jpg — real dimensions, so the front end
// can reserve each frame at the photograph's own aspect ratio and never crop.
router.get('/meta', async (req, res) => {
  const files = String(req.query.files || '')
    .split(',')
    .map(f => path.basename(f.trim()))
    .filter(Boolean)
    .slice(0, 200);
  if (!files.length) {
    res.json({});
    return;
  }
  try {
    const { rows } = await pool.query(
      'SELECT file, width, height, orientation FROM image_meta WHERE file = ANY($1)',
      [files]
    );
    const out: Record<string, { width: number; height: number; orientation: string }> = {};
    for (const r of rows) out[r.file] = { width: r.width, height: r.height, orientation: r.orientation };
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
