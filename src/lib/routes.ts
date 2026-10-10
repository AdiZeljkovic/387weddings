import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { pathOf, type RouteKey } from './lang';

export { ROUTES, pathOf, routeOf, translatePath, type RouteKey } from './lang';

/**
 * Links in the current language:
 *   const p = usePaths();  <Link to={p('about')} />  <Link to={p('portfolio', slug)} />
 * The Router adds /en on an English page, so these stay prefix-free.
 */
export function usePaths() {
  const { language } = useLanguage();
  return useCallback((key: RouteKey, slug?: string) => pathOf(language, key, slug), [language]);
}
