import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Where the page sits after a navigation:
 *  - a new page (a link) opens at the top;
 *  - an anchor (/#radovi) goes to that section;
 *  - a reload, or back / forward, returns to where the visitor was.
 *
 * The last one is done here rather than left to the browser. The browser
 * restores the position the moment the document loads, while the page is
 * still short (its code arrives a moment later), so it could only scroll as
 * far as that short page allowed — a reload in the middle of the fan came
 * back near its top. Each history entry's position is remembered, and put
 * back once the page is tall enough to hold it.
 */
const KEY = '387:scroll';

const readAll = (): Record<string, number> => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const save = (entry: string, y: number) => {
  try {
    const all = readAll();
    all[entry] = Math.round(y);
    // Only the recent entries matter
    const keys = Object.keys(all);
    if (keys.length > 60) delete all[keys[0]];
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* private mode: the browser's own behaviour remains */ }
};

const ScrollToTop = () => {
  const location = useLocation();
  const { pathname, hash } = location;
  // The history entry: its key, with the address (a first visit's key is
  // "default" for every page, so the address keeps them apart)
  const key = `${pathname}|${location.key}`;
  const navType = useNavigationType();
  const first = useRef(true);

  // We restore; the browser must not jump in first
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  // Remember where this entry is scrolled to. The position is taken from the
  // scroll itself: read while leaving, it would already be the next page's
  // (a shorter page cuts the scroll down before this entry is stored).
  useEffect(() => {
    let last = window.scrollY;
    let timer = 0;
    const onScroll = () => {
      last = window.scrollY;
      if (timer) return;
      timer = window.setTimeout(() => { timer = 0; save(key, last); }, 150);
    };
    const onHide = () => save(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      if (timer) clearTimeout(timer);
      save(key, last);
    };
  }, [key]);

  useEffect(() => {
    const initial = first.current;
    first.current = false;
    let timer = 0;

    if (hash) {
      // The section may still be waiting for its data, so look for it a few
      // times before giving up
      let tries = 0;
      const go = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) el.scrollIntoView();
        else if (tries++ < 40) timer = window.setTimeout(go, 100);
      };
      go();
      return () => clearTimeout(timer);
    }

    // Reload or back/forward: back to where this entry was left
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const returning = initial
      ? navigation?.type === 'reload' || navigation?.type === 'back_forward'
      : navType === 'POP';
    const saved = returning ? readAll()[key] : undefined;
    if (saved !== undefined) {
      const started = performance.now();
      const put = () => {
        const room = document.documentElement.scrollHeight - window.innerHeight;
        if (room >= saved || performance.now() - started > 3000) {
          window.scrollTo(0, Math.min(saved, room));
          return;
        }
        timer = window.setTimeout(put, 50);
      };
      put();
      return () => clearTimeout(timer);
    }

    if (!initial && navType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, hash, key, navType]);

  return null;
};

export default ScrollToTop;
