import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, adminFromRequest } from '../auth.js';
import { invalidateShellCache } from '../shell.js';
import { orphanFiles, removeIfUnused } from '../uploadsCleanup.js';

const router = Router();

// Values the front end never reads. They were being handed to every visitor.
const PRIVATE_KEYS = new Set(['contact_recipient', 'robots_txt']);

// The panel reads its settings through this same route, so a signed-in admin
// still gets the private keys — otherwise the field for the address the form
// is sent to showed up empty and the owner could not see where mail was going.
const isAdmin = async (req: Parameters<typeof adminFromRequest>[0]) =>
  Boolean(await adminFromRequest(req).catch(() => null));

// GET /api/settings — public, plus the private keys for a signed-in admin
router.get('/', async (req, res) => {
  try {
    const admin = await isAdmin(req);
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
  const updates = req.body as Record<string, unknown>;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    res.status(400).json({ error: 'Body must be a key-value object' });
    return;
  }
  // Text values only, and never the migration markers (migr.*), which only
  // the server writes
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('migr.') || key.length > 200) continue;
    if (value !== null && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      res.status(400).json({ error: `Neispravna vrijednost za ${key}` });
      return;
    }
    entries.push([key, value === null ? '' : String(value)]);
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of entries) {
        await client.query(
          `INSERT INTO site_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, value]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
    // The pages' head and inlined data show the change on the next view
    invalidateShellCache();

    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      if (row.key.startsWith('migr.')) continue;
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings/uploads/orphans — photographs on disk nothing uses, to
// show the owner before anything is removed
router.get('/uploads/orphans', requireAuth, async (_req, res) => {
  try {
    res.json({ files: await orphanFiles() });
  } catch (err) {
    console.error('[orphans]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/settings/uploads/orphans/delete — removes the listed files that
// are still unused at this moment
router.post('/uploads/orphans/delete', requireAuth, async (req, res) => {
  const files = Array.isArray(req.body?.files)
    ? (req.body.files as unknown[]).filter((f): f is string => typeof f === 'string').slice(0, 5000)
    : [];
  try {
    res.json(await removeIfUnused(files));
  } catch (err) {
    console.error('[orphans/delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings/stats — admin dashboard
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const [stories, submissions, newSubmissions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM stories WHERE is_published = TRUE'),
      pool.query('SELECT COUNT(*) FROM contact_submissions'),
      pool.query("SELECT COUNT(*) FROM contact_submissions WHERE status = 'new'"),
    ]);

    res.json({
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
