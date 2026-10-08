import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

/**
 * Server-rendered meta tags.
 *
 * The app sets title and description in the browser, so crawlers and link
 * previews (Facebook, WhatsApp, Slack) saw whatever was baked into index.html
 * — the same title on every page. This rewrites the handful of tags they read
 * before the HTML leaves the server. It is not SSR: the page body still comes
 * from React, only the <head> is correct up front.
 */

type Meta = { title: string; desc: string; url: string; image: string; locale: string };

let shellHtml: string | null = null;
const readShell = () => {
  if (shellHtml) return shellHtml;
  shellHtml = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
  return shellHtml;
};

// Settings change rarely and this runs on every page view, so cache briefly
let cache: { at: number; map: Record<string, string> } | null = null;
const TTL = 60_000;

const settings = async (): Promise<Record<string, string>> => {
  if (cache && Date.now() - cache.at < TTL) return cache.map;
  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  cache = { at: Date.now(), map };
  return map;
};

const PAGE_KEYS: Record<string, string> = {
  '/': 'home',
  '/portfolio': 'portfolio',
  '/about': 'about',
  '/contact': 'contact',
  '/privacy': 'privacy',
};

const esc = (s: string) =>
  String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

const replaceTag = (html: string, selector: RegExp, attr: string, value: string) =>
  html.replace(selector, m => m.replace(new RegExp(`${attr}="[^"]*"`), `${attr}="${esc(value)}"`));

export async function renderShell(pathname: string, lang: 'bs' | 'en'): Promise<string> {
  let html = readShell();
  let s: Record<string, string>;
  try {
    s = await settings();
  } catch {
    return html; // never fail a page over meta tags
  }

  const base = (s['sitemap.base_url']?.trim() || 'https://387weddings.ba').replace(/\/$/, '');
  const siteName = s['seo.site_name']?.trim() || '387 Weddings';
  const clean = pathname.replace(/\/$/, '') || '/';

  let title = `${siteName}`;
  let desc = '';

  const key = PAGE_KEYS[clean];
  if (key) {
    title = s[`seo.${key}.title.${lang}`]?.trim() || s[`seo.${key}.title`]?.trim() || title;
    desc = s[`seo.${key}.desc.${lang}`]?.trim() || s[`seo.${key}.desc`]?.trim() || desc;
  } else if (clean.startsWith('/portfolio/')) {
    // One story: its own couple name, so a shared link says who it is about
    try {
      const slug = decodeURIComponent(clean.slice('/portfolio/'.length));
      const { rows } = await pool.query(
        'SELECT couple, location, date_text, cover_url FROM stories WHERE slug = $1 AND is_published = TRUE',
        [slug]
      );
      if (rows[0]) {
        title = `${rows[0].couple} | ${siteName}`;
        desc = [rows[0].location, rows[0].date_text].filter(Boolean).join(' · ');
        if (rows[0].cover_url) s = { ...s, 'seo.og_image': base + rows[0].cover_url };
      }
    } catch { /* fall through to the defaults */ }
  }

  const meta: Meta = {
    title,
    desc,
    url: `${base}${pathname}${lang === 'en' ? '?lang=en' : ''}`,
    image: s['seo.og_image']?.trim() || '',
    locale: lang === 'en' ? 'en_US' : 'bs_BA',
  };

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  if (meta.desc) {
    html = replaceTag(html, /<meta name="description"[^>]*>/, 'content', meta.desc);
    html = replaceTag(html, /<meta property="og:description"[^>]*>/, 'content', meta.desc);
    html = replaceTag(html, /<meta name="twitter:description"[^>]*>/, 'content', meta.desc);
  }
  html = replaceTag(html, /<meta property="og:title"[^>]*>/, 'content', meta.title);
  html = replaceTag(html, /<meta name="twitter:title"[^>]*>/, 'content', meta.title);
  html = replaceTag(html, /<meta property="og:url"[^>]*>/, 'content', meta.url);
  html = replaceTag(html, /<meta property="og:locale"[^>]*>/, 'content', meta.locale);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(meta.url)}" />`);
  if (meta.image) {
    html = replaceTag(html, /<meta property="og:image"[^>]*>/, 'content', meta.image);
    html = replaceTag(html, /<meta name="twitter:image"[^>]*>/, 'content', meta.image);
  }

  // The home page's largest element is the first hero frame, and the browser
  // only discovers it once React has run. Preloading it here starts the request
  // with the HTML. Mirrors the widths and `sizes` that Home.tsx renders.
  if (clean === '/') {
    const hero = s['img.home.hero.1']?.trim();
    if (hero?.startsWith('/uploads/')) {
      const file = hero.slice('/uploads/'.length);
      const srcset = [768, 1280, 1920, 2400].map(w => `/img/${file}?w=${w} ${w}w`).join(', ');
      const pre = [
        `<link rel="preload" as="image" href="${esc(`/img/${file}?w=24`)}" fetchpriority="high" />`,
        `<link rel="preload" as="image" href="${esc(`/img/${file}?w=1920`)}" imagesrcset="${esc(srcset)}"`
          + ` imagesizes="(max-width: 1023px) 200vw, 100vw" fetchpriority="high" />`,
      ].join('\n    ');
      html = html.replace('</head>', `  ${pre}\n  </head>`);
    }
  }

  // hreflang, so the two language variants are declared in the source
  const alts = [
    `<link rel="alternate" hreflang="bs" href="${esc(base + pathname)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(base + pathname)}?lang=en" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(base + pathname)}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `  ${alts}\n  </head>`);

  return html;
}
