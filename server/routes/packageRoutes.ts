import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/packages — public
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM packages WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/packages/all — admin
router.get('/all', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/packages — admin
router.post('/', requireAuth, async (req, res) => {
  const { name, price, description, features, is_featured, is_active, sort_order, name_color, name_font_size,
    name_en, name_bs, description_en, description_bs, features_en, features_bs, features_font_size } = req.body;
  const resolvedName = name_bs || name;
  if (!resolvedName || !price) {
    res.status(400).json({ error: 'Name and price are required' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO packages (name, price, description, features, is_featured, is_active, sort_order, name_color, name_font_size,
         name_en, name_bs, description_en, description_bs, features_en, features_bs, features_font_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        resolvedName, price, description_bs || description || null,
        JSON.stringify(features_bs || features || []),
        is_featured ?? false,
        is_active ?? true,
        sort_order || 0,
        name_color || null,
        name_font_size || null,
        name_en || null,
        name_bs || null,
        description_en || null,
        description_bs || null,
        JSON.stringify(features_en || []),
        JSON.stringify(features_bs || features || []),
        features_font_size || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/packages/:id — admin
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, price, description, features, is_featured, is_active, sort_order, name_color, name_font_size,
    name_en, name_bs, description_en, description_bs, features_en, features_bs, features_font_size } = req.body;
  const resolvedName = name_bs || name;
  try {
    const result = await pool.query(
      `UPDATE packages
       SET name               = COALESCE($1, name),
           price              = COALESCE($2, price),
           description        = COALESCE($3, description),
           features           = COALESCE($4, features),
           is_featured        = COALESCE($5, is_featured),
           is_active          = COALESCE($6, is_active),
           sort_order         = COALESCE($7, sort_order),
           name_color         = $9,
           name_font_size     = $10,
           name_en            = $11,
           name_bs            = $12,
           description_en     = $13,
           description_bs     = $14,
           features_en        = $15,
           features_bs        = $16,
           features_font_size = $17
       WHERE id = $8 RETURNING *`,
      [
        resolvedName, price,
        description_bs || description || null,
        features_bs ? JSON.stringify(features_bs) : (features ? JSON.stringify(features) : null),
        is_featured, is_active, sort_order, id,
        name_color || null,
        name_font_size || null,
        name_en || null,
        name_bs || null,
        description_en || null,
        description_bs || null,
        JSON.stringify(features_en || []),
        JSON.stringify(features_bs || features || []),
        features_font_size || null,
      ]
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

// DELETE /api/packages/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM packages WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
