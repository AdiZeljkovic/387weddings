import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { pool } from './db.js';

/**
 * Record the real dimensions of uploads that arrived before image_meta existed.
 *
 * Frames are reserved at each photograph's own ratio from that table, and the
 * card shapes on Radovi are chosen from it. Without this, every image the
 * client has already uploaded would fall back to whatever shape was picked by
 * hand, which is exactly what the brief asks us to stop doing.
 *
 * Runs once at startup, after the schema is in place. It only reads files and
 * inserts rows, never writes an image, and a failure on one file is skipped
 * rather than holding up the server.
 */
export async function backfillImageMeta(): Promise<void> {
  const dir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) return;

  let known: Set<string>;
  try {
    const { rows } = await pool.query('SELECT file FROM image_meta');
    known = new Set(rows.map(r => r.file));
  } catch (err) {
    console.error('[image-meta] could not read existing rows, skipping backfill:', err);
    return;
  }

  const files = fs.readdirSync(dir).filter(f =>
    /\.(jpe?g|png|webp|avif)$/i.test(f) && !known.has(f)
  );
  if (!files.length) return;

  let done = 0;
  for (const file of files) {
    try {
      const meta = await sharp(path.join(dir, file)).metadata();
      const turned = (meta.orientation ?? 1) >= 5;
      const width = (turned ? meta.height : meta.width) ?? 0;
      const height = (turned ? meta.width : meta.height) ?? 0;
      if (!width || !height) continue;

      await pool.query(
        `INSERT INTO image_meta (file, width, height, orientation)
         VALUES ($1, $2, $3, $4) ON CONFLICT (file) DO NOTHING`,
        [file, width, height, width === height ? 'square' : width > height ? 'landscape' : 'portrait']
      );
      done++;
    } catch {
      // Not a readable image, or gone since the listing — leave it out
    }
  }
  if (done) console.log(`[image-meta] recorded dimensions for ${done} existing upload(s)`);
}
