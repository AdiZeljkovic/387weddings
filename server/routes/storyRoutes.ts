import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

const CATEGORIES = ['WEDDINGS', 'STUDIO', 'PORTRAITS'] as const;
const LAYOUTS = ['TALL', 'WIDE', 'SQUARE'] as const;

const slugify = (input: string) =>
  String(input)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

// GET /api/stories — published cards for the Radovi grid.
// While the client is still migrating, a site with no stories yet falls back to
// the old gallery_images so the page is never empty and nothing is lost.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, couple, category, cover_url, cover_alt, cover_layout, location, date_text
         FROM stories
        WHERE is_published = TRUE
        ORDER BY sort_order, id`
    );

    if (rows.length > 0) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(rows);
      return;
    }

    const legacy = await pool.query(
      `SELECT id, url AS cover_url, category, title AS couple, location,
              COALESCE(layout, 'TALL') AS cover_layout
         FROM gallery_images
        WHERE is_active = TRUE
        ORDER BY sort_order, id`
    );
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(legacy.rows.map(r => ({ ...r, slug: null, cover_alt: r.couple, legacy: true })));
  } catch (err) {
    console.error('[stories]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stories/:slug — one story, its gallery, and its neighbours
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM stories WHERE slug = $1 AND is_published = TRUE`,
      [req.params.slug]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const story = rows[0];

    const [images, neighbours] = await Promise.all([
      pool.query(
        `SELECT id, url, alt, caption, layout FROM story_images
          WHERE story_id = $1 ORDER BY sort_order, id`,
        [story.id]
      ),
      // Previous / next follow the same order the cards are listed in
      pool.query(
        `WITH ordered AS (
           SELECT slug, couple,
                  LAG(slug)    OVER w AS prev_slug,  LAG(couple)  OVER w AS prev_couple,
                  LEAD(slug)   OVER w AS next_slug,  LEAD(couple) OVER w AS next_couple
             FROM stories
            WHERE is_published = TRUE
           WINDOW w AS (ORDER BY sort_order, id)
         )
         SELECT prev_slug, prev_couple, next_slug, next_couple FROM ordered WHERE slug = $1`,
        [story.slug]
      ),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ ...story, images: images.rows, ...(neighbours.rows[0] || {}) });
  } catch (err) {
    console.error('[story]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM story_images i WHERE i.story_id = s.id) AS image_count
         FROM stories s ORDER BY s.sort_order, s.id`
    );
    res.json(rows);
  } catch (err) {
    console.error('[stories/admin]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stories/admin/:id/images — the editor needs these for drafts too,
// which the public :slug route would never return.
router.get('/admin/:id/images', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, url, alt, caption, layout, sort_order FROM story_images
        WHERE story_id = $1 ORDER BY sort_order, id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[story/images]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const readBody = (b: Record<string, unknown>) => ({
  couple: String(b.couple ?? '').trim(),
  category: CATEGORIES.includes(b.category as typeof CATEGORIES[number])
    ? (b.category as string) : 'WEDDINGS',
  location: (b.location as string) || null,
  date_text: (b.date_text as string) || null,
  tag: (b.tag as string) || null,
  cover_url: (b.cover_url as string) || null,
  cover_alt: (b.cover_alt as string) || null,
  cover_layout: LAYOUTS.includes(b.cover_layout as typeof LAYOUTS[number])
    ? (b.cover_layout as string) : 'TALL',
  quote_bs: (b.quote_bs as string) || null,
  quote_en: (b.quote_en as string) || null,
  text_bs: (b.text_bs as string) || null,
  text_en: (b.text_en as string) || null,
  sort_order: Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
  is_published: b.is_published !== false,
});

router.post('/', requireAuth, async (req, res) => {
  const v = readBody(req.body);
  if (!v.couple) {
    res.status(400).json({ error: 'Ime para je obavezno' });
    return;
  }
  const slug = slugify(String(req.body.slug || v.couple)) || `prica-${Date.now()}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO stories
         (slug, couple, category, location, date_text, tag, cover_url, cover_alt,
          cover_layout, quote_bs, quote_en, text_bs, text_en, sort_order, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.cover_url, v.cover_alt,
       v.cover_layout, v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published]
    );
    res.json(rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Adresa stranice (slug) već postoji' });
      return;
    }
    console.error('[stories/create]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const v = readBody(req.body);
  if (!v.couple) {
    res.status(400).json({ error: 'Ime para je obavezno' });
    return;
  }
  const slug = slugify(String(req.body.slug || v.couple));
  try {
    const { rows } = await pool.query(
      `UPDATE stories SET
         slug = COALESCE(NULLIF($1, ''), slug), couple = $2, category = $3, location = $4,
         date_text = $5, tag = $6, cover_url = $7, cover_alt = $8, cover_layout = $9,
         quote_bs = $10, quote_en = $11, text_bs = $12, text_en = $13,
         sort_order = $14, is_published = $15
       WHERE id = $16 RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.cover_url, v.cover_alt,
       v.cover_layout, v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published,
       req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Adresa stranice (slug) već postoji' });
      return;
    }
    console.error('[stories/update]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM stories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[stories/delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Gallery images of one story ──────────────────────────────────────────────

router.post('/:id/images', requireAuth, async (req, res) => {
  const { url, alt, caption, layout, sort_order } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL slike je obavezan' });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO story_images (story_id, url, alt, caption, layout, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, url, alt || null, caption || null,
       LAYOUTS.includes(layout) ? layout : 'TALL',
       Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[story/image]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/images/:imageId', requireAuth, async (req, res) => {
  const { alt, caption, layout, sort_order } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE story_images
          SET alt = $1, caption = $2,
              layout = COALESCE($3, layout),
              sort_order = COALESCE($4, sort_order)
        WHERE id = $5 RETURNING *`,
      [alt || null, caption || null,
       LAYOUTS.includes(layout) ? layout : null,
       Number.isFinite(Number(sort_order)) ? Number(sort_order) : null,
       req.params.imageId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[story/image/update]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/images/:imageId', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM story_images WHERE id = $1', [req.params.imageId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[story/image/delete]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
