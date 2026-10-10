import { Router } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

const CATEGORIES = ['WEDDINGS', 'STUDIO', 'PORTRAITS'] as const;
// AUTO follows the photograph's own shape; the other three are the owner's
// explicit choice and always win
const LAYOUTS = ['AUTO', 'TALL', 'WIDE', 'SQUARE'] as const;
const FAN_MAX = 5;

export const slugify = (input: string) =>
  String(input)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

// Lists change in the panel and must show on the next page load, so they are
// revalidated every time instead of sitting in a browser cache for a minute.
const FRESH = 'no-cache';

// Real pixel size of an upload, joined from image_meta by its file name, so a
// frame can be reserved at the photograph's own ratio in the very first render
const META = (col: string, alias: string) => `
  LEFT JOIN image_meta ${alias}
         ON ${alias}.file = regexp_replace(${col}, '^/uploads/', '')`;

// GET /api/stories — published cards for the Radovi grid
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.slug, s.couple, s.category, s.cover_url, s.cover_alt, s.cover_layout,
              s.cover_focus, s.location, s.date_text,
              m.width AS cover_width, m.height AS cover_height
         FROM stories s ${META('s.cover_url', 'm')}
        WHERE s.is_published = TRUE
        ORDER BY s.sort_order, s.id`
    );
    res.setHeader('Cache-Control', FRESH);
    res.json(rows);
  } catch (err) {
    console.error('[stories]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stories/fan — the stories chosen for the fan on the home page, in
// their fan order. The fan has no data of its own: name and link come from the
// story, the picture is the story's fan picture or else its cover.
router.get('/fan', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.slug, s.couple, s.fan_order,
              COALESCE(NULLIF(s.fan_image, ''), s.cover_url) AS image,
              CASE WHEN COALESCE(s.fan_image, '') <> '' THEN s.fan_focus ELSE s.cover_focus END AS focus,
              s.cover_alt AS alt,
              m.width, m.height
         FROM stories s
         ${META("COALESCE(NULLIF(s.fan_image, ''), s.cover_url)", 'm')}
        WHERE s.is_published = TRUE AND s.fan_order IS NOT NULL
        ORDER BY s.fan_order, s.id
        LIMIT ${FAN_MAX}`
    );
    res.setHeader('Cache-Control', FRESH);
    res.json(rows);
  } catch (err) {
    console.error('[stories/fan]', err);
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
      // An old address of a story whose title has since changed
      const moved = await pool.query(
        `SELECT s.slug FROM story_redirects r JOIN stories s ON s.id = r.story_id
          WHERE r.old_slug = $1 AND s.is_published = TRUE`,
        [req.params.slug]
      );
      if (moved.rows[0]) {
        res.status(404).json({ error: 'Moved', moved_to: moved.rows[0].slug });
        return;
      }
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const story = rows[0];

    const [images, neighbours] = await Promise.all([
      pool.query(
        `SELECT i.id, i.url, i.alt, i.caption, i.layout, i.focus, m.width, m.height
           FROM story_images i ${META('i.url', 'm')}
          WHERE i.story_id = $1 ORDER BY i.sort_order, i.id`,
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

    res.setHeader('Cache-Control', FRESH);
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
      `SELECT s.*, (SELECT COUNT(*) FROM story_images i WHERE i.story_id = s.id) AS image_count,
              mc.width AS cover_width, mc.height AS cover_height,
              mf.width AS fan_width, mf.height AS fan_height
         FROM stories s
         ${META('s.cover_url', 'mc')}
         ${META('s.fan_image', 'mf')}
        ORDER BY s.sort_order, s.id`
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

// PUT /api/stories/admin/fan — the fan's order, as dragged in the panel
router.put('/admin/fan', requireAuth, async (req, res) => {
  const ids: number[] = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter(Number.isFinite).slice(0, FAN_MAX) : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE stories SET fan_order = NULL WHERE fan_order IS NOT NULL AND NOT (id = ANY($1))', [ids]);
    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE stories SET fan_order = $1 WHERE id = $2', [i + 1, ids[i]]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[stories/fan/order]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

const focusOk = (v: unknown) =>
  typeof v === 'string' && /^[\d.%\s a-z-]{0,40}$/i.test(v) ? (v || null) : null;

const readBody = (b: Record<string, unknown>) => {
  const fanOn = b.fan_on === true || (b.fan_on === undefined && Number(b.fan_order) > 0);
  const fanOrder = Number(b.fan_order);
  return {
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
      ? (b.cover_layout as string) : 'AUTO',
    // "50% 30%" — where the owner clicked on the photograph
    cover_focus: focusOk(b.cover_focus),
    quote_bs: (b.quote_bs as string) || null,
    quote_en: (b.quote_en as string) || null,
    text_bs: (b.text_bs as string) || null,
    text_en: (b.text_en as string) || null,
    sort_order: Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
    is_published: b.is_published !== false,
    fan_on: fanOn,
    fan_order: fanOn && fanOrder >= 1 && fanOrder <= FAN_MAX ? Math.round(fanOrder) : null,
    fan_image: (b.fan_image as string) || null,
    fan_focus: focusOk(b.fan_focus),
    // The story that makes room, when the fan is already full
    fan_replace: Number.isFinite(Number(b.fan_replace)) ? Number(b.fan_replace) : null,
  };
};

/**
 * Puts a story into the fan (or takes it out) under the rules the owner asked
 * for: never more than five, never a sixth added quietly — the caller has to
 * say which story gives up its place — and an unpublished story is never in it.
 * Returns an error body when the fan is full and no replacement was named.
 */
async function placeInFan(
  client: PoolClient,
  id: number, v: ReturnType<typeof readBody>,
): Promise<{ status: number; body: unknown } | null> {
  if (!v.fan_on || !v.is_published) {
    await client.query('UPDATE stories SET fan_order = NULL WHERE id = $1', [id]);
    return null;
  }
  const others = await client.query(
    `SELECT id, couple, fan_order FROM stories
      WHERE fan_order IS NOT NULL AND is_published = TRUE AND id <> $1
      ORDER BY fan_order`,
    [id]
  );
  if (others.rows.length >= FAN_MAX) {
    if (!v.fan_replace || !others.rows.some(r => r.id === v.fan_replace)) {
      return { status: 409, body: { error: 'fan_full', fan: others.rows } };
    }
    const out = others.rows.find(r => r.id === v.fan_replace)!;
    await client.query('UPDATE stories SET fan_order = NULL WHERE id = $1', [out.id]);
    await client.query('UPDATE stories SET fan_order = $1 WHERE id = $2', [v.fan_order ?? out.fan_order, id]);
    return null;
  }
  // A free place: the one asked for, else the first one not taken
  const taken = new Set(others.rows.map(r => r.fan_order));
  let place = v.fan_order;
  if (!place || taken.has(place)) {
    // The asked-for place is taken: the story already there moves down a slot
    if (place && taken.has(place)) {
      await client.query(
        `UPDATE stories SET fan_order = fan_order + 1
          WHERE fan_order >= $1 AND id <> $2 AND fan_order IS NOT NULL`,
        [place, id]
      );
    } else {
      place = 1;
      while (taken.has(place)) place++;
    }
  }
  await client.query('UPDATE stories SET fan_order = $1 WHERE id = $2', [place, id]);
  // Keep the places 1..n with no gaps
  await client.query(
    `UPDATE stories s SET fan_order = r.n FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY fan_order, id) AS n
         FROM stories WHERE fan_order IS NOT NULL
     ) r WHERE s.id = r.id`
  );
  return null;
}

router.post('/', requireAuth, async (req, res) => {
  const v = readBody(req.body);
  if (!v.couple) {
    res.status(400).json({ error: 'Ime para je obavezno' });
    return;
  }
  const slug = slugify(String(req.body.slug || v.couple)) || `prica-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO stories
         (slug, couple, category, location, date_text, tag, tag_bs, tag_en,
          cover_url, cover_alt, cover_layout, cover_focus,
          quote_bs, quote_en, text_bs, text_en, sort_order, is_published,
          fan_image, fan_focus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.tag_bs, v.tag_en,
       v.cover_url, v.cover_alt, v.cover_layout, v.cover_focus,
       v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published,
       v.fan_image, v.fan_focus]
    );
    const problem = await placeInFan(client, rows[0].id, v);
    if (problem) {
      await client.query('ROLLBACK');
      res.status(problem.status).json(problem.body);
      return;
    }
    await client.query('COMMIT');
    const fresh = await pool.query('SELECT * FROM stories WHERE id = $1', [rows[0].id]);
    res.json(fresh.rows[0]);
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Adresa stranice (slug) već postoji' });
      return;
    }
    console.error('[stories/create]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const v = readBody(req.body);
  if (!v.couple) {
    res.status(400).json({ error: 'Ime para je obavezno' });
    return;
  }
  // The address follows the title unless the owner wrote one of their own
  const slug = slugify(String(req.body.slug || v.couple)) || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query('SELECT slug FROM stories WHERE id = $1', [req.params.id]);
    if (before.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const { rows } = await client.query(
      `UPDATE stories SET
         slug = COALESCE($1, slug), couple = $2, category = $3, location = $4,
         date_text = $5, tag = $6, tag_bs = $7, tag_en = $8,
         cover_url = $9, cover_alt = $10, cover_layout = $11, cover_focus = $12,
         quote_bs = $13, quote_en = $14, text_bs = $15, text_en = $16,
         sort_order = $17, is_published = $18, fan_image = $19, fan_focus = $20
       WHERE id = $21 RETURNING *`,
      [slug, v.couple, v.category, v.location, v.date_text, v.tag, v.tag_bs, v.tag_en,
       v.cover_url, v.cover_alt, v.cover_layout, v.cover_focus,
       v.quote_bs, v.quote_en, v.text_bs, v.text_en, v.sort_order, v.is_published,
       v.fan_image, v.fan_focus, req.params.id]
    );
    // The old address keeps working, permanently pointing at the new one
    const oldSlug = before.rows[0].slug;
    if (oldSlug && oldSlug !== rows[0].slug) {
      await client.query(
        `INSERT INTO story_redirects (old_slug, story_id) VALUES ($1, $2)
         ON CONFLICT (old_slug) DO UPDATE SET story_id = EXCLUDED.story_id`,
        [oldSlug, rows[0].id]
      );
      await client.query('DELETE FROM story_redirects WHERE old_slug = $1', [rows[0].slug]);
    }
    const problem = await placeInFan(client, rows[0].id, v);
    if (problem) {
      await client.query('ROLLBACK');
      res.status(problem.status).json(problem.body);
      return;
    }
    await client.query('COMMIT');
    const fresh = await pool.query('SELECT * FROM stories WHERE id = $1', [rows[0].id]);
    res.json(fresh.rows[0]);
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Adresa stranice (slug) već postoji' });
      return;
    }
    console.error('[stories/update]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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
       ['TALL', 'WIDE', 'SQUARE'].includes(layout) ? layout : 'TALL',
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
       ['TALL', 'WIDE', 'SQUARE'].includes(layout) ? layout : null,
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
