import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePaths } from '../lib/routes';

const KEY = '387_cookie_consent';

export type Consent = 'granted' | 'denied' | null;

export const readConsent = (): Consent => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
};

const write = (v: Exclude<Consent, null>) => {
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  // Analytics waits on this, so tell it straight away rather than on reload
  window.dispatchEvent(new CustomEvent('387:consent', { detail: v }));
};

/** Opens the banner again, so a choice can be changed (the footer's link) */
export const reopenConsent = () => window.dispatchEvent(new Event('387:consent-reopen'));

// Google Analytics' cookies, on this host and on the parent domain
const clearAnalyticsCookies = () => {
  const host = window.location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  document.cookie.split(';').map(c => c.split('=')[0].trim())
    .filter(name => /^(_ga|_gid|_gat|_gcl)/.test(name))
    .forEach(name => domains.forEach(d => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    }));
};

/**
 * Analytics was loading before anyone agreed to it. Nothing is injected now
 * until this returns "granted" — see AnalyticsInjector in App.tsx.
 */
const CookieBanner = () => {
  const { t, getContentStyle } = useLanguage();
  const paths = usePaths();
  // Up from the first render. It used to wait 1.2s so as not to compete with
  // the intro, but the curtain covers it anyway; the wait only made it the
  // page's last large paint (a late LCP) and shrank the hero in view.
  const [visible, setVisible] = useState(() => readConsent() === null);
  const box = useRef<HTMLDivElement>(null);

  // The banner sits over the bottom of the screen, which on a phone is where the
  // hero keeps its buttons. While it is up, its height is published as
  // --consent-h and the hero shortens by that much, so nothing is hidden
  // underneath it; the moment a choice is made the hero takes the room back.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!visible || !box.current) { root.style.removeProperty('--consent-h'); return; }
    const el = box.current;
    const set = () => root.style.setProperty('--consent-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty('--consent-h'); };
  }, [visible]);

  useEffect(() => {
    const reopen = () => setVisible(true);
    window.addEventListener('387:consent-reopen', reopen);
    return () => window.removeEventListener('387:consent-reopen', reopen);
  }, []);

  if (!visible) return null;

  const decide = (v: Exclude<Consent, null>) => {
    const before = readConsent();
    write(v);
    setVisible(false);
    // Withdrawing consent must undo it: the analytics cookies go, and the
    // page reloads without the scripts that were already running
    if (before === 'granted' && v === 'denied') {
      clearAnalyticsCookies();
      window.location.reload();
    }
  };

  return (
    <div
      ref={box}
      role="dialog"
      aria-live="polite"
      aria-label={t('cookie.title')}
      // Above the page, below the open mobile menu (1010) and its header
      className="fixed inset-x-0 bottom-0 z-[1000] bg-white border-t border-rule px-5 sm:px-8 py-3.5 lg:py-5 shadow-[0_-2px_24px_rgba(0,0,0,0.08)]"
    >
      {/* Compact on a phone: the text in two short lines, both buttons beside
          each other under it */}
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-8">
        <p
          style={getContentStyle('cookie.text')}
          className="flex-1 text-[12px] lg:text-[13px] font-light leading-[1.6] lg:leading-[1.8] text-ink-700 m-0"
        >
          {t('cookie.text')}{' '}
          <Link to={paths('privacy')} style={getContentStyle('cookie.more')} className="text-ink-900 border-b border-[#bfb3a0] hover:opacity-70 transition-opacity">
            {t('cookie.more')}
          </Link>
        </p>

        <div className="flex items-center justify-end lg:justify-start gap-2 lg:gap-3 flex-none">
          <button
            type="button"
            onClick={() => decide('denied')}
            style={getContentStyle('cookie.decline')}
            className="min-h-11 px-5 py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-ink-500 hover:text-ink-900 transition-colors duration-250"
          >
            {t('cookie.decline')}
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            style={getContentStyle('cookie.accept')}
            className="min-h-11 px-7 py-3 bg-ink-900 hover:bg-ink-700 text-white text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-250"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
