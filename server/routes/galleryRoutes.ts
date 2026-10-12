import { Router } from 'express';

// Only uploading lives here now. The old gallery list/create/update/delete
// routes and /meta were left over from before stories replaced the gallery;
// nothing on the site or in the panel called them.
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
    // Whole names only (".xpng" used to pass); the file's real format is
    // checked again by sharp once it has arrived
    const ext = /^\.(jpe?g|png|webp|avif)$/.test(path.extname(file.originalname).toLowerCase());
    const mime = /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

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
    let width = 0, height = 0, orientation = '';
    let filename = req.file.filename;
    try {
      const meta = await sharp(inputPath).metadata();
      if (!meta.format || !['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) throw new Error(`format ${meta.format}`);
      // EXIF orientation 5-8 stores the image rotated a quarter turn
      const turned = (meta.orientation ?? 1) >= 5;
      width  = (turned ? meta.height : meta.width) ?? 0;
      height = (turned ? meta.width : meta.height) ?? 0;
      if (!width || !height) throw new Error('no dimensions');
      orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';

      // The stored name carries the real format, not whatever the sender claimed
      const realExt = meta.format === 'jpeg' ? '.jpg' : meta.format === 'heif' ? '.avif' : `.${meta.format}`;
      if (path.extname(filename).toLowerCase() !== realExt) {
        const renamed = filename.replace(/\.[^.]*$/, '') + realExt;
        fs.renameSync(inputPath, path.join(process.cwd(), 'uploads', renamed));
        filename = renamed;
      }
    } catch (sharpErr) {
      // If sharp can't read it, the file isn't an image we trust — delete it
      // rather than serving an unverified upload.
      console.error('sharp could not read the upload, rejecting it:', sharpErr);
      try { fs.unlinkSync(inputPath); } catch { /* already gone */ }
      res.status(400).json({ error: 'Datoteka nije važeća slika.' });
      return;
    }

    // A database hiccup here must not throw away a good photograph: the file
    // stays and is used; its size is filled in later by the start-up backfill
    try {
      await pool.query(
        `INSERT INTO image_meta (file, width, height, orientation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (file) DO UPDATE
           SET width = $2, height = $3, orientation = $4`,
        [filename, width, height, orientation]
      );
    } catch (dbErr) {
      console.error('[upload] image_meta not stored:', dbErr);
    }

    // The brief asks the panel to say so rather than silently accept it
    const long = Math.max(width, height);
    res.json({
      url: `/uploads/${filename}`,
      width,
      height,
      orientation,
      warning: long < 2000
        ? `Fotografija je ${width}x${height} px. Preporučeno je najmanje 2000 px `
          + `po dužoj strani, inače može izgledati mekano na velikim ekranima.`
        : undefined,
    });
  });
});

export default router;
