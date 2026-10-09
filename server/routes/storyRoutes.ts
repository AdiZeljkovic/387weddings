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
      `SELECT id, slug, couple, category, cover_url, cover_alt, cover_layout, cover_focus,
              location, date_text
         FROM stories
        WHERE is_published = TRUE
        ORDER BY sort_order, id`
    );

    // Every card is a real story with a slug, so every card is a link. Old
    // gallery rows were migrated into stories by initDB rather than faked here.
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(rows);
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
        `SELECT id, url, alt, caption, layout, focus FROM story_images
          WHERE story_id = $1 ORDER BY sort_order, id`,
        [story.id]
      ),
      // Previous / next follow the order the cards are listed in, and wrap
      // around: the last story's "next" is the first one, so both links are
      // always there. Owner's decision.
      pool.query(
        `WITH ordered AS (
           SELECT slug, couple,
                  LAG(slug)    OVER w AS prev_slug,  LAG(couple)  OVER w AS prev_couple,
                  LEAD(slug)   OVER w AS next_slug,  LEAD(couple) OVER w AS next_couple,
                  FIRST_VALUE(slug)   OVER w AS first_slug,
                  FIRST_VALUE(couple) OVER w AS first_couple,
                  LAST_VALUE(slug)    OVER wf AS last_slug,
                  LAST_VALUE(couple)  OVER wf AS last_couple,
                  COUNT(*) OVER () AS total
             FROM stories
            WHERE is_published = TRUE
           WINDOW w  AS (ORDER BY sort_order, id),
                  wf AS (ORDER BY sort_order, id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
         )
         SELECT total,
                COALESCE(prev_slug,   last_slug)   AS prev_slug,
                COALESCE(prev_couple, last_couple) AS prev_couple,
                COALESCE(next_slug,   first_slug)  AS next_slug,
                COALESCE(next_couple, first_couple) AS next_couple
           FROM ordered WHERE slug = $1`,
        [story.slug]
      ),
    ]);

    // A single story has nowhere to go, so it gets no navigation at all
    const n = neighbours.rows[0];
    const nav = !n || Number(n.total) < 2
      ? { prev_slug: null, prev_couple: null, next_slug: null, next_couple: null }
      : {
          prev_slug: n.prev_slug, prev_couple: n.prev_couple,
          next_slug: n.next_slug, next_couple: n.next_couple,
        };

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ ...story, images: images.rows, ...nav });
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
      `SELECT id, url, alt, caption, layout, focus, sort_order FROM story_images
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
  tag_bs: (b.tag_bs as string) || (b.tag as string) || null,
  tag_en: (b.tag_en as string) || (b.tag as string) || null,
  cover_url: (b.cover_url as string) || null,
  cover_alt: (b.cover_alt as string) || null,
  cover_layout: LAYOUTS.includes(b.cover_layout as typeof LAYOUTS[number])
    ? (b.cover_layout as string) : 'TALL',
  // "50% 30%" — where the owner clicked on the photograph
  cover_focus: typeof b.cover_focus === 'string' && /^[\d.%\s a-z-]{0,40}$/i.test(b.cover_focus)
    ? (b.cover_focus || null) : null,
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
         (slug, couple, category, location, date_text, tag, tag_bs, tag_en,
          cover_url, cover_alt, cover_layout, cover_focus,
          quote_bs, quote_en, text_bs, text_en, sort_order, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.tag_bs, v.tag_en,
       v.cover_url, v.cover_alt, v.cover_layout, v.cover_focus,
       v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published]
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
         date_text = $5, tag = $6, tag_bs = $7, tag_en = $8,
         cover_url = $9, cover_alt = $10, cover_layout = $11, cover_focus = $12,
         quote_bs = $13, quote_en = $14, text_bs = $15, text_en = $16,
         sort_order = $17, is_published = $18
       WHERE id = $19 RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.tag_bs, v.tag_en,
       v.cover_url, v.cover_alt, v.cover_layout, v.cover_focus,
       v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published,
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
  const { url, alt, caption, layout, focus, sort_order } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL slike je obavezan' });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO story_images (story_id, url, alt, caption, layout, focus, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, url, alt || null, caption || null,
       LAYOUTS.includes(layout) ? layout : 'TALL',
       typeof focus === 'string' && focus ? focus.slice(0, 40) : null,
       Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[story/image]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/images/:imageId', requireAuth, async (req, res) => {
  const { alt, caption, layout, focus, sort_order } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE story_images
          SET alt = $1, caption = $2,
              layout = COALESCE($3, layout),
              focus = COALESCE($4, focus),
              sort_order = COALESCE($5, sort_order)
        WHERE id = $6 RETURNING *`,
      [alt || null, caption || null,
       LAYOUTS.includes(layout) ? layout : null,
       typeof focus === 'string' && focus ? focus.slice(0, 40) : null,
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
