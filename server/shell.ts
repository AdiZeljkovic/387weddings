import fs from 'fs';
import path from 'path';
import { pool } from './db.js';
import { storyExcerpt } from '../src/lib/excerpt.js';
import { stripLang, routeOf, pathFor } from '../src/lib/lang.js';
import { DEFAULT_META } from '../src/lib/seoDefaults.js';
import { fanStories } from './routes/storyRoutes.js';

/**
 * Server-rendered <head>, plus the data the page needs to draw itself.
 *
 * The app sets title and description in the browser, so crawlers and link
 * previews (Facebook, WhatsApp, Slack) saw whatever was baked into index.html
 * — the same title on every page. This rewrites the handful of tags they read
 * before the HTML leaves the server. It is not SSR: the page body still comes
 * from React, only the <head> is correct up front.
 *
 * The public settings and texts also travel inside the HTML (window.__BOOT__).
 * The page used to fetch them only after its scripts had loaded, so the hero
 * photograph could not even be placed until two more round trips were done.
 */

type Meta = { title: string; desc: string; url: string; image: string; locale: string };

let shellHtml: string | null = null;
const readShell = () => {
  if (shellHtml) return shellHtml;
  shellHtml = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
  return shellHtml;
};

// Settings and texts change rarely and this runs on every page view, so they
// are kept briefly — and dropped the moment the panel saves (see the routes)
const PRIVATE_KEYS = new Set(['contact_recipient', 'robots_txt']);
type ContentRow = { key: string; value_en: string; value_bs: string; font_size?: string; font_family?: string; text_color?: string };
let cache: { at: number; settings: Record<string, string>; content: ContentRow[] } | null = null;
const TTL = 60_000;

export const invalidateShellCache = () => { cache = null; };

const load = async () => {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const [s, c] = await Promise.all([
    pool.query('SELECT key, value FROM site_settings'),
    pool.query('SELECT key, value_en, value_bs, font_size, font_family, text_color FROM page_content ORDER BY page, section, sort_order'),
  ]);
  const settings: Record<string, string> = {};
  for (const r of s.rows) settings[r.key] = r.value;
  cache = { at: Date.now(), settings, content: c.rows };
  return cache;
};

const esc = (s: string) =>
  String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

// Replacements are always functions: a plain string would read $& $' $` in a
// page address or a couple's name as patterns and paste other parts of the
// page into the tags
const replaceTag = (html: string, selector: RegExp, attr: string, value: string) =>
  html.replace(selector, m => m.replace(new RegExp(`${attr}="[^"]*"`), () => `${attr}="${esc(value)}"`));
const put = (html: string, find: RegExp | string, value: string) => html.replace(find, () => value);

// JSON inside <script>: nothing in it can close the tag or open a comment
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const inlineJson = (v: unknown) =>
  JSON.stringify(v).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');

/** A photograph at a sensible width for link previews (the original can be 40 MB) */
const previewImage = (base: string, url: string) => {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${base}/img/${url.slice('/uploads/'.length)}?w=1200`;
  return base + (url.startsWith('/') ? url : `/${url}`);
};

export async function renderShell(pathname: string, lang: 'bs' | 'en'): Promise<string> {
  let html = readShell();
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch {
    return html; // never fail a page over meta tags
  }
  const s = data.settings;

  const base = (s['sitemap.base_url']?.trim() || 'https://387weddings.ba').replace(/\/$/, '');
  const siteName = s['seo.site_name']?.trim() || '387 Weddings';
  // Which page this is comes from the shared address table, whatever language
  // the path is named in; the two addresses may differ by more than /en
  // (/radovi and /en/work).
  const route = routeOf(stripLang(pathname));
  const bsPath = pathFor('BOS', pathname);
  const enPath = pathFor('ENG', pathname);

  let title = `${siteName}`;
  let desc = '';
  // The default preview picture: the one set in the panel, else the first hero
  let image = previewImage(base, s['seo.og_image']?.trim() || s['img.home.hero.1']?.trim() || '');

  const key = route && !route.slug ? route.key : null;
  if (key) {
    const [defTitle, defDesc] = DEFAULT_META[key]?.[lang] ?? [siteName, ''];
    title = s[`seo.${key}.title.${lang}`]?.trim() || `${defTitle} | ${siteName}`;
    desc = s[`seo.${key}.desc.${lang}`]?.trim() || defDesc;
  } else if (route?.slug) {
    // One story: its own couple name, so a shared link says who it is about
    try {
      const { rows } = await pool.query(
        `SELECT couple, location, date_text, cover_url, quote_bs, quote_en, text_bs, text_en,
                seo_desc_bs, seo_desc_en
           FROM stories WHERE slug = $1 AND is_published = TRUE`,
        [route.slug]
      );
      if (rows[0]) {
        title = `${rows[0].couple} | ${siteName}`;
        // What the story is about, not only its date
        const general = s[`seo.story.desc.${lang}`]?.trim()
          || s[`seo.portfolio.desc.${lang}`]?.trim() || DEFAULT_META.portfolio[lang][1];
        desc = storyExcerpt(rows[0], lang, general);
        if (rows[0].cover_url) image = previewImage(base, rows[0].cover_url);
      }
    } catch { /* fall through to the defaults */ }
  }

  const meta: Meta = {
    title,
    desc,
    url: `${base}${lang === 'en' ? enPath : bsPath}`,
    image,
    locale: lang === 'en' ? 'en_US' : 'bs_BA',
  };

  html = put(html, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = put(html, /<html lang="[^"]*"/, `<html lang="${lang}"`);
  if (meta.desc) {
    html = replaceTag(html, /<meta name="description"[^>]*>/, 'content', meta.desc);
    html = replaceTag(html, /<meta property="og:description"[^>]*>/, 'content', meta.desc);
    html = replaceTag(html, /<meta name="twitter:description"[^>]*>/, 'content', meta.desc);
  }
  html = replaceTag(html, /<meta property="og:title"[^>]*>/, 'content', meta.title);
  html = replaceTag(html, /<meta name="twitter:title"[^>]*>/, 'content', meta.title);
  html = replaceTag(html, /<meta property="og:url"[^>]*>/, 'content', meta.url);
  html = replaceTag(html, /<meta property="og:locale"[^>]*>/, 'content', meta.locale);
  html = put(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(meta.url)}" />`);
  if (meta.image) {
    html = replaceTag(html, /<meta property="og:image"[^>]*>/, 'content', meta.image);
    html = replaceTag(html, /<meta name="twitter:image"[^>]*>/, 'content', meta.image);
  } else {
    // No picture at all: better no tag than one pointing at a missing file
    html = put(html, /\s*<meta property="og:image(:width|:height)?"[^>]*>/g, '');
    html = put(html, /\s*<meta name="twitter:image"[^>]*>/, '');
  }

  const head: string[] = [];

  // Google Search Console reads the tag from the HTML the server sends; set in
  // the browser after cookie consent (as it was) it was never seen
  const gsc = s['analytics.gsc_verification']?.trim();
  if (gsc) head.push(`<meta name="google-site-verification" content="${esc(gsc)}" />`);

  // The home page's largest element is the first hero frame. Preloading it
  // here starts the request with the HTML. Mirrors the widths and `sizes` that
  // Home.tsx renders — separately for phones when the slot has its own phone
  // frame, so the phone is not handed the desktop picture.
  if (route?.key === 'home') {
    const variant = (src: string | undefined) => (src?.startsWith('/uploads/') ? src.slice('/uploads/'.length) : '');
    const desk = variant(s['img.home.hero.1']?.trim());
    const mob = variant(s['img.home.hero.mobile.1']?.trim());
    const set = (file: string) => [600, 900, 1200, 1600, 2000, 2400].map(w => `/img/${file}?w=${w} ${w}w`).join(', ');
    const preload = (file: string, sizes: string, media?: string) =>
      `<link rel="preload" as="image" href="${esc(`/img/${file}?w=1200`)}" imagesrcset="${esc(set(file))}"`
      + ` imagesizes="${sizes}" fetchpriority="high"${media ? ` media="${media}"` : ''} />`;
    const blur = (file: string, media?: string) =>
      `<link rel="preload" as="image" href="${esc(`/img/${file}?w=24`)}"${media ? ` media="${media}"` : ''} />`;
    if (desk && mob) {
      head.push(blur(mob, '(max-width: 1023px)'), blur(desk, '(min-width: 1024px)'));
      head.push(preload(mob, '150vw', '(max-width: 1023px)'), preload(desk, '100vw', '(min-width: 1024px)'));
    } else if (desk || mob) {
      const one = desk || mob;
      head.push(blur(one), preload(one, '(max-width: 1023px) 200vw, 100vw'));
    }
  }

  // hreflang, so the two language variants are declared in the source. Each is
  // its own address now rather than the same one with a parameter.
  head.push(
    `<link rel="alternate" hreflang="bs" href="${esc(base + bsPath)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(base + enPath)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(base + bsPath)}" />`,
  );

  // Structured data from what the owner set in the panel, rather than a fixed
  // block with a placeholder telephone number and invented opening hours
  const instagram = s.instagram && s.instagram !== '#'
    ? s.instagram
    : `https://www.instagram.com/${s.instagram_handle?.trim() || '387.weddings'}`;
  const business: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${base}/#business`,
    name: siteName,
    url: base,
    address: { '@type': 'PostalAddress', addressLocality: 'Sarajevo', addressCountry: 'BA' },
    sameAs: [instagram],
  };
  const bizDesc = s[`seo.home.desc.${lang}`]?.trim() || DEFAULT_META.home[lang][1];
  if (bizDesc) business.description = bizDesc;
  if (s.email?.trim()) business.email = s.email.trim();
  if (s.phone?.trim()) business.telephone = s.phone.trim();
  const bizImage = previewImage(base, s['seo.og_image']?.trim() || s['img.home.hero.1']?.trim() || '');
  if (bizImage) business.image = bizImage;
  html = put(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${inlineJson(business)}</script>`);

  // The data the page draws from, so it does not have to ask for it first
  const publicSettings: Record<string, string> = {};
  for (const [k, v] of Object.entries(s)) {
    if (k.startsWith('migr.') || PRIVATE_KEYS.has(k)) continue;
    publicSettings[k] = v;
  }
  // On the home page the fan's stories too: the section then has its full
  // height from the first render, so a reload in the middle of the fan comes
  // back to the same place instead of to where the shorter page ended
  let fan: unknown[] | undefined;
  if (route?.key === 'home') {
    try { fan = await fanStories(); } catch { /* the page asks for it itself */ }
  }
  head.push(`<script>window.__BOOT__=${inlineJson({ settings: publicSettings, content: data.content, fan })}</script>`);

  return put(html, '</head>', `  ${head.join('\n    ')}\n  </head>`);
}
