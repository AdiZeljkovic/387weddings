/**
 * One-time SEO migration script.
 * Upserts bilingual SEO meta tags into site_settings.
 * Run with: node scripts/seed-seo.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ---------------------------------------------------------------------------
// SEO content — crafted as a senior SEO expert, not AI boilerplate.
//
// Strategy:
//  EN — targets international destination couples searching in English.
//       Primary intent: "fine art wedding photography Sarajevo", "destination
//       wedding photographer Bosnia", "cinematic wedding film Europe".
//  BS — targets local/regional Bosnian/Croatian/Serbian market.
//       Primary intent: "vjenčana fotografija Sarajevo", "fotografiranje
//       vjenčanja BiH", "profesionalni vjenčani fotograf Sarajevo".
//
// Title rules: 50–60 chars | primary keyword first | brand name at end.
// Desc rules:  140–160 chars | emotional hook + keyword + CTA.
// ---------------------------------------------------------------------------

const SEO = [
  // ── Global ──────────────────────────────────────────────────────────────
  ['seo.site_name', '387 Cinematic Weddings'],
  ['seo.og_image',  ''],   // owner uploads their own OG image

  // ── Home / Naslovna ─────────────────────────────────────────────────────
  // EN — 53 chars
  ['seo.home.title.en', 'Fine Art Wedding Photography Sarajevo | 387 Cinematic'],
  // EN — 154 chars
  ['seo.home.desc.en',
    'Fine art wedding photography & cinematic film in Sarajevo. ' +
    'Editorial, emotional, timeless — two artists, one story. ' +
    'Based in Bosnia, traveling worldwide. Limited 2026 dates.'],

  // BS — 54 chars
  ['seo.home.title.bs', 'Vjenčana Fotografija Sarajevo | 387 Cinematic Weddings'],
  // BS — 148 chars
  ['seo.home.desc.bs',
    'Fine art vjenčana fotografija i kinematski film u Sarajevu. ' +
    'Editorijalni, emotivni, bezvremeni stil. ' +
    'Putujemo širom svijeta. Slobodnih termina za 2026. je malo.'],

  // ── About / O nama ──────────────────────────────────────────────────────
  // EN — 53 chars
  ['seo.about.title.en', 'About Melisa & Aldin | Wedding Photographers Sarajevo'],
  // EN — 158 chars
  ['seo.about.desc.en',
    'Melisa & Aldin — a husband-and-wife fine art photography and film team from Sarajevo. ' +
    'Two perspectives, one shared vision. ' +
    'Meet the artists who will tell your wedding story.'],

  // BS — 47 chars
  ['seo.about.title.bs', 'O Melisi i Aldinu | Vjenčani Fotografi Sarajevo'],
  // BS — 146 chars
  ['seo.about.desc.bs',
    'Melisa i Aldin — muž i žena tim fotografa i filmaša iz Sarajeva. ' +
    'Dvije perspektive, jedna vizija. ' +
    'Upoznajte umjetnike koji će ispričati vašu priču.'],

  // ── Services / Usluge ───────────────────────────────────────────────────
  // EN — 53 chars
  ['seo.services.title.en', 'Wedding Photography Packages Sarajevo | 387 Cinematic'],
  // EN — 151 chars
  ['seo.services.desc.en',
    'Explore our cinematic wedding photography & film packages. ' +
    'Two dedicated artists, one wedding day. ' +
    'Booking 2026 weddings in Sarajevo & worldwide. Limited availability.'],

  // BS — 53 chars
  ['seo.services.title.bs', 'Paketi Fotografije Vjenčanja Sarajevo | 387 Cinematic'],
  // BS — 150 chars
  ['seo.services.desc.bs',
    'Pogledajte naše pakete vjenčane fotografije i filma. ' +
    'Dva posvećena umjetnika za vaš poseban dan. ' +
    'Rezervirajte za 2026. vjenčanja u BiH i inostranstvu.'],

  // ── Portfolio ───────────────────────────────────────────────────────────
  // EN — 54 chars
  ['seo.portfolio.title.en', 'Wedding Photography Portfolio | 387 Cinematic Weddings'],
  // EN — 141 chars
  ['seo.portfolio.desc.en',
    'Real weddings from Sarajevo, Europe and beyond. ' +
    'Fine art documentary storytelling at its most intimate — ' +
    'cinematic photography and film by Melisa & Aldin.'],

  // BS — 55 chars
  ['seo.portfolio.title.bs', 'Portfolio Vjenčane Fotografije | 387 Cinematic Weddings'],
  // BS — 145 chars
  ['seo.portfolio.desc.bs',
    'Stvarna vjenčanja iz Sarajeva, Europe i cijelog svijeta. ' +
    'Fine art dokumentarni i kinematski stil — ' +
    'iskreni trenuci, vječna sjećanja, vaša priča.'],

  // ── Contact / Kontakt ───────────────────────────────────────────────────
  // EN — 55 chars
  ['seo.contact.title.en', 'Book Your Wedding Photographer Sarajevo | 387 Cinematic'],
  // EN — 145 chars
  ['seo.contact.desc.en',
    'Ready to tell your story? Contact Melisa & Aldin — ' +
    "Sarajevo's fine art wedding photography team. " +
    'We travel worldwide. Limited 2026 dates remaining.'],

  // BS — 57 chars (prihvatljivo)
  ['seo.contact.title.bs', 'Rezervirajte Vjenčanog Fotografa Sarajevo | 387 Cinematic'],
  // BS — 151 chars
  ['seo.contact.desc.bs',
    'Pošaljite upit Melisi i Aldinu — ' +
    'fine art vjenčani tim iz Sarajeva, putujemo širom svijeta. ' +
    'Slobodnih termina za 2026. je malo — kontaktirajte nas danas.'],
];

const client = await pool.connect();
try {
  let count = 0;
  for (const [key, value] of SEO) {
    await client.query(
      `INSERT INTO site_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
    count++;
    console.log(`  ✓ ${key}`);
  }
  console.log(`\nDone — ${count} SEO settings upserted.`);
} finally {
  client.release();
  await pool.end();
}
