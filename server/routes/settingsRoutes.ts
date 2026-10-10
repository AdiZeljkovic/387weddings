import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, verifyToken } from '../auth.js';

const router = Router();

// Values the front end never reads. They were being handed to every visitor.
const PRIVATE_KEYS = new Set(['contact_recipient', 'robots_txt']);

// The panel reads its settings through this same route, so a signed-in admin
// still gets the private keys — otherwise the field for the address the form
// is sent to showed up empty and the owner could not see where mail was going.
const isAdmin = (req: { cookies?: Record<string, string> }) => {
  const token = req.cookies?.admin_token;
  if (!token) return false;
  try { verifyToken(token); return true; } catch { return false; }
};

// GET /api/settings — public, plus the private keys for a signed-in admin
router.get('/', async (req, res) => {
  try {
    const admin = isAdmin(req);
    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      // migr.* are one-time migration markers, of no use to anyone outside
      if (row.key.startsWith('migr.')) continue;
      if (!admin && PRIVATE_KEYS.has(row.key)) continue;
      settings[row.key] = row.value;
    }
    // The admin's copy must never sit in a shared cache
    res.setHeader('Cache-Control', admin ? 'private, no-store' : 'no-cache');
    if (!admin) res.setHeader('Vary', 'Cookie');
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
    const [gallery, stories, submissions, newSubmissions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM gallery_images WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM stories WHERE is_published = TRUE'),
      pool.query('SELECT COUNT(*) FROM contact_submissions'),
      pool.query("SELECT COUNT(*) FROM contact_submissions WHERE status = 'new'"),
    ]);

    res.json({
      gallery: parseInt(gallery.rows[0].count),
      stories: parseInt(stories.rows[0].count),
      total_submissions: parseInt(submissions.rows[0].count),
      new_submissions: parseInt(newSubmissions.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
