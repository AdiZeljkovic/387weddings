/**
 * Batch image optimizer — run once on the server to convert all existing
 * uploads to WebP (max 1920px, quality 82) and update DB URLs accordingly.
 *
 * Usage:  npx tsx scripts/optimize-uploads.ts
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

interface Result {
  file: string;
  status: 'converted' | 'skipped' | 'error';
  sizeBefore?: number;
  sizeAfter?: number;
  error?: string;
}

async function optimizeFile(filename: string): Promise<Result> {
  const inputPath  = path.join(UPLOADS_DIR, filename);
  const ext        = path.extname(filename).toLowerCase();
  const baseName   = path.basename(filename, ext);
  const outputName = `${baseName}.webp`;
  const outputPath = path.join(UPLOADS_DIR, outputName);

  // Already optimized WebP with same name — check if resize is needed
  const meta = await sharp(inputPath).metadata();
  const needsResize = (meta.width ?? 0) > 1920 || (meta.height ?? 0) > 1920;
  const isAlreadyWebP = ext === '.webp';

  if (isAlreadyWebP && !needsResize) {
    return { file: filename, status: 'skipped' };
  }

  const sizeBefore = fs.statSync(inputPath).size;

  // If input is already .webp, overwrite in-place via temp file
  const tmpPath = outputPath + '.tmp';

  await sharp(inputPath)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(tmpPath);

  const sizeAfter = fs.statSync(tmpPath).size;

  if (isAlreadyWebP) {
    fs.renameSync(tmpPath, outputPath);
  } else {
    fs.renameSync(tmpPath, outputPath);
    fs.unlinkSync(inputPath); // remove original non-webp
  }

  return { file: filename, status: 'converted', sizeBefore, sizeAfter };
}

async function updateDB(oldUrl: string, newUrl: string, client: pg.PoolClient) {
  if (oldUrl === newUrl) return;
  await client.query(
    `UPDATE gallery_images SET url = $1 WHERE url = $2`,
    [newUrl, oldUrl]
  );
  await client.query(
    `UPDATE site_settings SET value = $1 WHERE value = $2`,
    [newUrl, oldUrl]
  );
}

async function main() {
  console.log('🔍 Scanning uploads folder:', UPLOADS_DIR);

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('❌ Uploads folder not found:', UPLOADS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED.has(ext) && !f.startsWith('.');
  });

  console.log(`📁 Found ${files.length} image(s) to process\n`);

  const results: Result[] = [];
  const dbUpdates: Array<{ old: string; new: string }> = [];

  for (const file of files) {
    process.stdout.write(`  Processing: ${file} ... `);
    try {
      const result = await optimizeFile(file);
      results.push(result);

      const ext     = path.extname(file).toLowerCase();
      const newName = path.basename(file, ext) + '.webp';

      if (result.status === 'converted' && file !== newName) {
        dbUpdates.push({
          old: `/uploads/${file}`,
          new: `/uploads/${newName}`,
        });
        const saved = result.sizeBefore && result.sizeAfter
          ? Math.round((1 - result.sizeAfter / result.sizeBefore) * 100)
          : 0;
        console.log(`✅ converted (${saved}% smaller)`);
      } else if (result.status === 'skipped') {
        console.log('⏭  already optimized');
      } else {
        console.log('✅ resized');
      }
    } catch (err: any) {
      results.push({ file, status: 'error', error: err.message });
      console.log(`❌ error: ${err.message}`);
    }
  }

  // Update DB
  if (dbUpdates.length > 0) {
    console.log(`\n📦 Updating ${dbUpdates.length} URL(s) in database...`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { old: oldUrl, new: newUrl } of dbUpdates) {
        await updateDB(oldUrl, newUrl, client);
        console.log(`  ${oldUrl} → ${newUrl}`);
      }
      await client.query('COMMIT');
      console.log('✅ Database updated');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ DB update failed, rolling back:', err);
    } finally {
      client.release();
    }
  } else {
    console.log('\n📦 No DB updates needed');
  }

  // Summary
  const converted = results.filter(r => r.status === 'converted');
  const skipped   = results.filter(r => r.status === 'skipped');
  const errors    = results.filter(r => r.status === 'error');

  const totalBefore = converted.reduce((s, r) => s + (r.sizeBefore ?? 0), 0);
  const totalAfter  = converted.reduce((s, r) => s + (r.sizeAfter  ?? 0), 0);
  const savedMB     = ((totalBefore - totalAfter) / 1024 / 1024).toFixed(1);

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Converted : ${converted.length}`);
  console.log(`⏭  Skipped   : ${skipped.length}`);
  console.log(`❌ Errors    : ${errors.length}`);
  if (converted.length > 0) {
    console.log(`💾 Space saved: ~${savedMB} MB`);
  }
  console.log('─────────────────────────────────────\n');

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
