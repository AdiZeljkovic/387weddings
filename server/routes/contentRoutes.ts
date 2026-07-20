import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/content — public, used by LanguageContext to override hardcoded translations + styles
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value_en, value_bs, font_size, font_family, text_color FROM page_content ORDER BY page, section, sort_order'
    );
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/content/admin — admin, full rows for the editor UI
router.get('/admin', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM page_content ORDER BY page, section, sort_order'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/content/bulk — admin, update multiple fields in a single transaction
router.post('/bulk', requireAuth, async (req, res) => {
  const { items } = req.body as {
    items: {
      key: string;
      value_en: string;
      value_bs: string;
      font_size?: string | null;
      font_family?: string | null;
      text_color?: string | null;
    }[];
  };
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items must be a non-empty array' });
    return;
  }

  const valid = items.filter(i => i.key);
  if (valid.length === 0) {
    res.status(400).json({ error: 'No valid items with keys' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const keys        = valid.map(i => i.key);
    const valuesEn    = valid.map(i => i.value_en ?? '');
    const valuesBs    = valid.map(i => i.value_bs ?? '');
    const fontSizes   = valid.map(i => i.font_size   ?? null);
    const fontFamilies = valid.map(i => i.font_family ?? null);
    const textColors  = valid.map(i => i.text_color  ?? null);

    await client.query(
      `UPDATE page_content AS pc
       SET value_en    = v.value_en,
           value_bs    = v.value_bs,
           font_size   = v.font_size,
           font_family = v.font_family,
           text_color  = v.text_color
       FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])
         AS v(key, value_en, value_bs, font_size, font_family, text_color)
       WHERE pc.key = v.key`,
      [keys, valuesEn, valuesBs, fontSizes, fontFamilies, textColors]
    );

    await client.query('COMMIT');
    res.json({ success: true, updated: valid.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/content/:key — admin, update a single field
// Note: keys like 'hero.title.part1' are passed via request body to avoid URL encoding issues
router.put('/:key', requireAuth, async (req, res) => {
  const key = req.params.key;
  const { value_en, value_bs } = req.body;
  try {
    const result = await pool.query(
      `UPDATE page_content
       SET value_en = COALESCE($1, value_en),
           value_bs = COALESCE($2, value_bs)
       WHERE key = $3
       RETURNING *`,
      [value_en ?? null, value_bs ?? null, key]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Content key not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
