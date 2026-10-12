import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';

// JWT_SECRET is validated at startup in server.ts — it is always defined here
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * A sign-in carries the account's token version (tv). Changing the password,
 * or "Odjavi sve uređaje", raises the version, and every sign-in made before
 * stops working at once — a 7-day cookie on a lost phone no longer stays good
 * until it expires.
 */
export type AdminToken = { id: number; username: string; tv?: number };

export function signToken(payload: AdminToken) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AdminToken;
}

// Read on every panel request, so kept for a few seconds
const versions = new Map<number, { tv: number; at: number }>();
const VERSION_TTL = 10_000;

async function currentVersion(id: number): Promise<number | null> {
  const hit = versions.get(id);
  if (hit && Date.now() - hit.at < VERSION_TTL) return hit.tv;
  const { rows } = await pool.query('SELECT token_version FROM admin_users WHERE id = $1', [id]);
  if (!rows[0]) return null;
  versions.set(id, { tv: rows[0].token_version ?? 0, at: Date.now() });
  return rows[0].token_version ?? 0;
}

/** Forget the cached version after it changed */
export const forgetVersion = (id: number) => versions.delete(id);

/** The signed-in admin, or null — signature, expiry and token version checked */
export async function adminFromRequest(req: Request): Promise<AdminToken | null> {
  const token = req.cookies?.admin_token;
  if (!token) return null;
  let decoded: AdminToken;
  try { decoded = verifyToken(token); } catch { return null; }
  const tv = await currentVersion(decoded.id);
  if (tv === null || (decoded.tv ?? 0) !== tv) return null;
  return decoded;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  adminFromRequest(req)
    .then(admin => {
      if (!admin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      (req as Request & { admin?: AdminToken }).admin = admin;
      next();
    })
    .catch(next);
}

export const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};
