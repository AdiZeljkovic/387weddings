import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

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

/**
 * Analytics was loading before anyone agreed to it. Nothing is injected now
 * until this returns "granted" — see AnalyticsInjector in App.tsx.
 */
const CookieBanner = () => {
  const { t, getContentStyle } = useLanguage();
  const [visible, setVisible] = useState(false);
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
    // Give the page a moment so the banner never competes with the intro
    const id = window.setTimeout(() => setVisible(readConsent() === null), 1200);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const decide = (v: Exclude<Consent, null>) => { write(v); setVisible(false); };

  return (
    <div
      ref={box}
      role="dialog"
      aria-live="polite"
      aria-label={t('cookie.title')}
      className="fixed inset-x-0 bottom-0 z-[1200] bg-white border-t border-rule px-5 sm:px-8 py-3.5 lg:py-5 shadow-[0_-2px_24px_rgba(0,0,0,0.08)]"
    >
      {/* Compact on a phone: the text in two short lines, both buttons beside
          each other under it */}
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-8">
        <p
          style={getContentStyle('cookie.text')}
          className="flex-1 text-[12px] lg:text-[13px] font-light leading-[1.6] lg:leading-[1.8] text-ink-700 m-0"
        >
          {t('cookie.text')}{' '}
          <Link to="/privacy" className="text-ink-900 border-b border-[#bfb3a0] hover:opacity-70 transition-opacity">
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
