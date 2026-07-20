import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// POST /api/contact — public (main site contact form)
router.post('/', async (req, res) => {
  const { name, email, date, location, message } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  // Basic shape + length limits to reject junk/abuse before it hits the DB.
  const isEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmail) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (String(name).length > 255 || String(email).length > 255 ||
      String(location ?? '').length > 255 || String(message ?? '').length > 5000) {
    res.status(400).json({ error: 'Input too long' });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO contact_submissions (name, email, wedding_date, location, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, date || null, location || null, message || null]
    );
    res.json({ success: true, message: 'Thank you for your inquiry. We will get back to you soon.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
