/**
 * One address per language.
 *
 * English used to live at `?lang=en` on the same path, which meant hreflang and
 * canonical were pointing at query strings — search engines treat those as one
 * page with a parameter rather than two documents. English now sits under /en,
 * so /portfolio and /en/portfolio are separate addresses that can each be
 * linked, indexed and shared.
 *
 * React Router carries the prefix for us: the Router is mounted with /en as its
 * basename on an English URL, so every <Link to="/portfolio"> already resolves
 * to /en/portfolio and route paths never mention the language.
 */
export type Language = 'ENG' | 'BOS';

export const EN_PREFIX = '/en';

/** Which language an address belongs to. */
export const langFromPath = (pathname: string): Language =>
  pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? 'ENG' : 'BOS';

/** The same page with the language prefix taken off: /en/portfolio → /portfolio */
export const stripLang = (pathname: string): string => {
  if (pathname === EN_PREFIX) return '/';
  if (pathname.startsWith(`${EN_PREFIX}/`)) return pathname.slice(EN_PREFIX.length) || '/';
  return pathname || '/';
};

/** The address of a page in a given language. Always starts with a slash. */
export const pathFor = (lang: Language, pathname: string): string => {
  const base = stripLang(pathname);
  if (lang !== 'ENG') return base;
  return base === '/' ? EN_PREFIX : `${EN_PREFIX}${base}`;
};

/** The basename React Router is mounted with for the current address. */
export const routerBasename = (pathname: string): string =>
  langFromPath(pathname) === 'ENG' ? EN_PREFIX : '/';
