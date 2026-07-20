import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/testimonials — public
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC'
    );
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/testimonials/all — admin
router.get('/all', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/testimonials — admin
router.post('/', requireAuth, async (req, res) => {
  const { client_name, text, location, wedding_date, is_active, sort_order } = req.body;
  if (!client_name || !text) {
    res.status(400).json({ error: 'Client name and text are required' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO testimonials (client_name, text, location, wedding_date, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [client_name, text, location || null, wedding_date || null, is_active ?? true, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/testimonials/:id — admin
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { client_name, text, location, wedding_date, is_active, sort_order } = req.body;
  try {
    const result = await pool.query(
      `UPDATE testimonials
       SET client_name = COALESCE($1, client_name),
           text = COALESCE($2, text),
           location = COALESCE($3, location),
           wedding_date = COALESCE($4, wedding_date),
           is_active = COALESCE($5, is_active),
           sort_order = COALESCE($6, sort_order)
       WHERE id = $7 RETURNING *`,
      [client_name, text, location, wedding_date, is_active, sort_order, id]
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

// DELETE /api/testimonials/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
