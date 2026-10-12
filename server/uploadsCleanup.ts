import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

/**
 * Photographs on disk that nothing uses any more.
 *
 * Every place a photograph can be named is looked at — story covers and fan
 * pictures, story galleries, every setting (image slots, the link-preview
 * picture) and every text — so a file is only
 * ever removed when no page, draft or setting points at it. Removing a file
 * also removes its resized copies and its size record.
 */
const UPLOADS = path.join(process.cwd(), 'uploads');
const CACHE = path.join(UPLOADS, '.cache');

const fileOf = (url: string | null | undefined) => {
  if (!url) return null;
  const i = url.indexOf('/uploads/');
  if (i < 0) return null;
  const name = url.slice(i + '/uploads/'.length).split(/[?#"'\s)]/)[0];
  return name && !name.includes('/') ? name : null;
};

/** Every upload some row still names */
export async function referencedFiles(): Promise<Set<string>> {
  const used = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v !== 'string') return;
    // A text can name several photographs
    for (const m of v.matchAll(/\/uploads\/([^/?#"'\s)]+)/g)) used.add(m[1]);
    const one = fileOf(v);
    if (one) used.add(one);
  };
  const queries = [
    'SELECT cover_url AS v FROM stories UNION ALL SELECT fan_image FROM stories',
    'SELECT url AS v FROM story_images',
    "SELECT value AS v FROM site_settings WHERE value LIKE '%/uploads/%'",
    "SELECT value_bs AS v FROM page_content WHERE value_bs LIKE '%/uploads/%' UNION ALL SELECT value_en FROM page_content WHERE value_en LIKE '%/uploads/%'",
  ];
  for (const q of queries) {
    const { rows } = await pool.query(q);
    rows.forEach(r => add(r.v));
  }
  return used;
}

/** Uploads on disk that nothing names, largest first */
export async function orphanFiles(): Promise<{ file: string; size: number }[]> {
  const used = await referencedFiles();
  let names: string[] = [];
  try { names = fs.readdirSync(UPLOADS); } catch { return []; }
  return names
    .filter(n => !n.startsWith('.') && !used.has(n))
    .map(n => {
      try {
        const st = fs.statSync(path.join(UPLOADS, n));
        return st.isFile() ? { file: n, size: st.size } : null;
      } catch { return null; }
    })
    .filter((x): x is { file: string; size: number } => Boolean(x))
    .sort((a, b) => b.size - a.size);
}

const listeners: ((file: string) => void)[] = [];
/** Told about every removed file (the image route forgets what it knew) */
export const onRemoved = (fn: (file: string) => void) => listeners.push(fn);

/**
 * Removes each of these files that nothing names any more — checked again
 * here, so a file put back into use meanwhile is kept. Returns what went.
 */
export async function removeIfUnused(candidates: (string | null | undefined)[]) {
  const files = [...new Set(candidates.map(c => (c?.includes('/') ? fileOf(c) : c)).filter(Boolean) as string[])]
    .filter(f => !f.startsWith('.') && !f.includes('/') && !f.includes('\\'));
  if (!files.length) return { deleted: 0, freed: 0 };
  const used = await referencedFiles();
  let deleted = 0;
  let freed = 0;
  let cached: string[] = [];
  try { cached = fs.readdirSync(CACHE); } catch { /* no variants yet */ }
  for (const file of files) {
    if (used.has(file)) continue;
    const full = path.join(UPLOADS, file);
    try {
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      fs.unlinkSync(full);
      deleted++;
      freed += st.size;
    } catch { continue; }
    // Its resized copies: w<width>-<name without extension>.webp
    const stem = file.replace(/\.[^.]+$/, '');
    for (const c of cached) {
      if (new RegExp(`^w\\d+-${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.webp$`).test(c)) {
        try { fs.unlinkSync(path.join(CACHE, c)); } catch { /* already gone */ }
      }
    }
    await pool.query('DELETE FROM image_meta WHERE file = $1', [file]).catch(() => {});
    listeners.forEach(fn => fn(file));
  }
  return { deleted, freed };
}
