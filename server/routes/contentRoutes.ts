import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { invalidateShellCache } from '../shell.js';

const router = Router();

// GET /api/content — public, used by LanguageContext to override hardcoded translations + styles
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value_en, value_bs, font_size, font_family, text_color FROM page_content ORDER BY page, section, sort_order'
    );
    // Revalidated every time, so a text saved in the panel shows at once
    res.setHeader('Cache-Control', 'no-cache');
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

  // A null or non-text entry used to throw before the try and end the process
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? null : String(v));
  const valid = items.filter(i => i && typeof i === 'object' && typeof i.key === 'string' && i.key);
  if (valid.length === 0) {
    res.status(400).json({ error: 'No valid items with keys' });
    return;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const keys        = valid.map(i => i.key);
    const valuesEn    = valid.map(i => str(i.value_en) ?? '');
    const valuesBs    = valid.map(i => str(i.value_bs) ?? '');
    const fontSizes   = valid.map(i => str(i.font_size));
    const fontFamilies = valid.map(i => str(i.font_family));
    const textColors  = valid.map(i => str(i.text_color));

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
    invalidateShellCache();
    res.json({ success: true, updated: valid.length });
  } catch (err) {
    await client?.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client?.release();
  }
});

export default router;
