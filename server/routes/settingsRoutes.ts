import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/settings — public
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings — admin (bulk update)
router.put('/', requireAuth, async (req, res) => {
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'Body must be a key-value object' });
    return;
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(updates)) {
        await client.query(
          `INSERT INTO site_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, value]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats — admin dashboard
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const [gallery, packages, testimonials, submissions, newSubmissions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM gallery_images WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM packages WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM testimonials WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM contact_submissions'),
      pool.query("SELECT COUNT(*) FROM contact_submissions WHERE status = 'new'"),
    ]);

    res.json({
      gallery: parseInt(gallery.rows[0].count),
      packages: parseInt(packages.rows[0].count),
      testimonials: parseInt(testimonials.rows[0].count),
      total_submissions: parseInt(submissions.rows[0].count),
      new_submissions: parseInt(newSubmissions.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
