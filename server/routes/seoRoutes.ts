import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const STATIC_PAGES = [
  { path: '/',          changefreq: 'weekly',  priority: '1.0' },
  { path: '/portfolio', changefreq: 'weekly',  priority: '0.9' },
  { path: '/about',     changefreq: 'monthly', priority: '0.7' },
  { path: '/contact',   changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy',   changefreq: 'yearly',  priority: '0.3' },
];

// GET /sitemap.xml — dynamically generated from settings
router.get('/sitemap.xml', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM site_settings WHERE key = 'sitemap.base_url'"
    );
    const baseUrl = (result.rows[0]?.value || 'https://387weddings.ba').replace(/\/$/, '');
    const today   = new Date().toISOString().split('T')[0];

    // Published stories are real pages, so they belong in the sitemap too
    const stories = await pool.query(
      'SELECT slug FROM stories WHERE is_published = TRUE ORDER BY sort_order, id'
    );
    const pages = [
      ...STATIC_PAGES,
      ...stories.rows.map(r => ({ path: `/prica/${r.slug}`, changefreq: 'monthly', priority: '0.7' })),
    ];

    // Each entry declares both language variants, matching the hreflang tags
    const urls = pages.map(p => `
  <url>
    <loc>${baseUrl}${p.path}</loc>
    <xhtml:link rel="alternate" hreflang="bs" href="${baseUrl}${p.path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${p.path}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${p.path}"/>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap]', err);
    res.status(500).send('Error generating sitemap');
  }
});

// GET /robots.txt — from DB or sensible default
router.get('/robots.txt', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM site_settings WHERE key IN ('robots_txt', 'sitemap.base_url')"
    );
    const map: Record<string, string> = {};
    for (const row of result.rows) map[row.key] = row.value;

    const baseUrl = (map['sitemap.base_url'] || 'https://387weddings.ba').replace(/\/$/, '');
    const content = map['robots_txt']
      || `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${baseUrl}/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(content);
  } catch (err) {
    console.error('[robots]', err);
    res.status(500).send('Error loading robots.txt');
  }
});

export default router;
