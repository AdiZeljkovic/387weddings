/**
 * One address per language, with names in that language.
 *
 * Bosnian pages live at Bosnian addresses (/radovi, /o-nama, /kontakt,
 * /privatnost, /radovi/<story>), English pages under /en with English names
 * (/en/portfolio, /en/about, /en/contact, /en/privacy, /en/portfolio/<story>).
 * Switching language moves to the same page in the other language.
 *
 * React Router carries the /en prefix for us: the Router is mounted with /en as
 * its basename on an English URL, so route paths never mention it.
 *
 * This file has no React in it, so the server reads the same table for its
 * redirects, meta tags and sitemap — one source of truth for every address.
 */
export type Language = 'ENG' | 'BOS';

export const EN_PREFIX = '/en';

/** Router paths (without the /en prefix) of every page, per language */
export const ROUTES = {
  home:      { bs: '/',           en: '/' },
  portfolio: { bs: '/radovi',     en: '/portfolio' },
  about:     { bs: '/o-nama',     en: '/about' },
  contact:   { bs: '/kontakt',    en: '/contact' },
  privacy:   { bs: '/privatnost', en: '/privacy' },
} as const;

export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

const code = (lang: Language) => (lang === 'ENG' ? 'en' : 'bs') as 'bs' | 'en';

/** Which language an address belongs to. */
export const langFromPath = (pathname: string): Language =>
  pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? 'ENG' : 'BOS';

/** The same page with the language prefix taken off: /en/portfolio → /portfolio */
export const stripLang = (pathname: string): string => {
  if (pathname === EN_PREFIX) return '/';
  if (pathname.startsWith(`${EN_PREFIX}/`)) return pathname.slice(EN_PREFIX.length) || '/';
  return pathname || '/';
};

/** A page's router path in a language; with a slug, a story under Radovi. */
export const pathOf = (lang: Language, key: RouteKey, slug?: string) => {
  const base = ROUTES[key][code(lang)];
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
};

/** Which page a router path names, in either language, and the story slug if any */
export const routeOf = (routerPath: string): { key: RouteKey; slug?: string } | null => {
  const clean = routerPath.replace(/\/+$/, '') || '/';
  for (const key of ROUTE_KEYS) {
    for (const p of [ROUTES[key].bs, ROUTES[key].en]) {
      if (clean === p) return { key };
      if (key === 'portfolio' && clean.startsWith(`${p}/`) && clean.length > p.length + 1) {
        const rest = clean.slice(p.length + 1);
        if (!rest.includes('/')) return { key, slug: decodeURIComponent(rest) };
      }
    }
  }
  return null;
};

/** A router path renamed into another language: /radovi → /portfolio */
export const translatePath = (routerPath: string, to: Language) => {
  const r = routeOf(routerPath);
  return r ? pathOf(to, r.key, r.slug) : routerPath;
};

/** The full address of a page in a given language, from any full address. */
export const pathFor = (lang: Language, pathname: string): string => {
  const base = translatePath(stripLang(pathname), lang);
  if (lang !== 'ENG') return base;
  return base === '/' ? EN_PREFIX : `${EN_PREFIX}${base}`;
};

/** The basename React Router is mounted with for the current address. */
export const routerBasename = (pathname: string): string =>
  langFromPath(pathname) === 'ENG' ? EN_PREFIX : '/';
