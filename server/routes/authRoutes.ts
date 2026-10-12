import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, requireAuth, forgetVersion, COOKIE, type AdminToken } from '../auth.js';
import type { Request } from 'express';
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

    const token = signToken({ id: user.id, username: user.username, tv: user.token_version ?? 0 });

    res.cookie('admin_token', token, { ...COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  // Cleared with the same flags it was set with, or some browsers keep it
  res.clearCookie('admin_token', COOKIE);
  res.json({ success: true });
});

const adminOf = (req: Request) => (req as Request & { admin: AdminToken }).admin;

// POST /api/auth/password — a new password; every other sign-in ends, this
// one carries on with a fresh cookie
router.post('/password', requireAuth, async (req, res) => {
  const { current, next } = req.body ?? {};
  if (typeof current !== 'string' || typeof next !== 'string') {
    res.status(400).json({ error: 'Upiši trenutnu i novu lozinku.' });
    return;
  }
  if (next.length < 10) {
    res.status(400).json({ error: 'Nova lozinka mora imati najmanje 10 znakova.' });
    return;
  }
  try {
    const me = adminOf(req);
    const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [me.id]);
    if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
      res.status(400).json({ error: 'Trenutna lozinka nije tačna.' });
      return;
    }
    const hash = await bcrypt.hash(next, 12);
    const up = await pool.query(
      `UPDATE admin_users SET password_hash = $1, token_version = token_version + 1
        WHERE id = $2 RETURNING token_version`,
      [hash, me.id]
    );
    forgetVersion(me.id);
    const token = signToken({ id: me.id, username: me.username, tv: up.rows[0].token_version });
    res.cookie('admin_token', token, { ...COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout-all — ends every sign-in, this one included
router.post('/logout-all', requireAuth, async (req, res) => {
  try {
    const me = adminOf(req);
    await pool.query('UPDATE admin_users SET token_version = token_version + 1 WHERE id = $1', [me.id]);
    forgetVersion(me.id);
    res.clearCookie('admin_token', COOKIE);
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/logout-all]', err);
    res.status(500).json({ error: 'Server error' });
  }
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
