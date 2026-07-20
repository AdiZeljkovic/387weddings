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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
        res.status(400).json({ error: 'Fajl je prevelik. Maksimalna veličina je 10 MB.' });
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
    const baseName  = path.basename(req.file.filename, path.extname(req.file.filename));
    const outName   = `${baseName}.webp`;
    const outputPath = path.join(process.cwd(), 'uploads', outName);

    try {
      await sharp(inputPath)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outputPath);

      fs.unlinkSync(inputPath);
      res.json({ url: `/uploads/${outName}` });
    } catch (sharpErr) {
      // If sharp can't process it, the file isn't a valid image we trust —
      // delete it rather than serving an unverified upload.
      console.error('sharp processing failed, rejecting upload:', sharpErr);
      try { fs.unlinkSync(inputPath); } catch { /* already gone */ }
      res.status(400).json({ error: 'Datoteka nije važeća slika.' });
    }
  });
});

export default router;
