import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import { stripLang } from '../lib/lang';

// The board loops at 9s for display; in production the whole thing is ~2.2s.
// It used to be gated on sessionStorage, which meant it never showed on a
// refresh or on returning to the tab. It now plays on every full page load.
const LIFT_AT = 1300;   // overlay starts rising
const DONE_AT = 2200;   // overlay is gone and unmounts
const HARD_STOP = 3000; // never hold the page longer than this
// The hero entrance is still running when the curtain goes; clearing the delay
// variable mid-flight would make those animations recompute and jump, so it is
// cleared only once they have finished.
const CLEAR_DELAY_AT = 4800;

// Set the moment the curtain decides to play, before the page under it renders,
// so the hero knows to open its first frame from 1.12 as the curtain lifts.
let playing = false;
export const introPlaying = () => playing;
export const INTRO_LIFT_S = LIFT_AT / 1000;

/**
 * Opening curtain. It never blocks: the page (and the hero image) render
 * underneath while this sits on top, and a hard timer removes it even if
 * something goes wrong. It plays on every full load of the home page — /en as
 * much as / — on a phone as much as on a desktop, and is skipped only on
 * navigation between pages and under prefers-reduced-motion.
 *
 * As on the board: "387" rises into place, "WEDDINGS" follows 0.35s later, a
 * 120px gold rule draws left to right under them, then the sheet lifts away.
 */
const Preloader = () => {
  const [state, setState] = useState<'hidden' | 'showing' | 'lifting'>(() => {
    if (typeof window === 'undefined') return 'hidden';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'hidden';
    // Only the entry page gets the curtain, never an in-app navigation. The
    // language prefix comes off first, or the English home never had one.
    if (stripLang(window.location.pathname).replace(/\/$/, '') !== '') return 'hidden';
    playing = true;
    return 'showing';
  });

  useEffect(() => {
    if (state === 'hidden') return;

    // Hero animations hold back until the curtain starts moving
    document.documentElement.style.setProperty('--intro-delay', `${LIFT_AT / 1000}s`);

    const lift = window.setTimeout(() => setState('lifting'), LIFT_AT);
    const done = window.setTimeout(() => { setState('hidden'); playing = false; }, DONE_AT);
    const bail = window.setTimeout(() => { setState('hidden'); playing = false; }, HARD_STOP);
    const clear = window.setTimeout(
      () => document.documentElement.style.removeProperty('--intro-delay'),
      CLEAR_DELAY_AT
    );

    return () => {
      clearTimeout(lift);
      clearTimeout(done);
      clearTimeout(bail);
      clearTimeout(clear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'hidden') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[3000] bg-cream flex flex-col items-center justify-center ${
        state === 'lifting' ? 'animate-[introLift_0.9s_cubic-bezier(.76,0,.24,1)_both]' : ''
      }`}
    >
      {/* The same mark as the header, at the intro sizes from the brief: 88px
          numerals over a 30px wordmark, the two arriving one after the other */}
      <Logo size={88} word={30} color="#151311" intro />
      <span
        className="block w-[120px] h-px bg-gold-600 origin-left mt-10 scale-x-0 animate-[introLine_0.7s_cubic-bezier(.6,0,.3,1)_0.75s_both]"
      />
    </div>
  );
};

export default Preloader;
