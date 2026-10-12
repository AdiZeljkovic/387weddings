import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Compared against when the username does not exist, so a wrong name takes
// as long as a wrong password and the answer time does not reveal which
// accounts exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    res.status(400).json({ error: 'Upiši korisničko ime i lozinku.' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !valid) {
      res.status(401).json({ error: 'Pogrešno korisničko ime ili lozinka.' });
      return;
    }

    const token = signToken({ id: user.id, username: user.username });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  // Cleared with the same flags it was set with, or some browsers keep it
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ admin: (req as any).admin });
});

// POST /api/auth/setup — only works when ALLOW_SETUP=true env var is set AND no admin exists yet
router.post('/setup', async (req, res) => {
  if (process.env.ALLOW_SETUP !== 'true') {
    res.status(403).json({ error: 'Setup is disabled' });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM admin_users LIMIT 1');
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Admin already exists' });
      return;
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      res.status(400).json({ error: 'ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      [username, hash]
    );

    res.json({ success: true, message: `Admin '${username}' created. Remove ALLOW_SETUP=true from .env now.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
