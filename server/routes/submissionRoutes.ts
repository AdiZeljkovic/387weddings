import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/submissions — admin
router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/submissions/:id — admin (update status)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['new', 'read', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Use: new, read, archived' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE contact_submissions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
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

// DELETE /api/submissions/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contact_submissions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
