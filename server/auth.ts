import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// JWT_SECRET is validated at startup in server.ts — it is always defined here
const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: { id: number; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; username: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = verifyToken(token);
    (req as any).admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
