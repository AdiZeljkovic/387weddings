import React, { useEffect, useState } from 'react';
import Logo from './Logo';

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

/**
 * First-visit curtain. It never blocks: the page (and the hero image) render
 * underneath while this sits on top, and a hard timer removes it even if
 * something goes wrong. Skipped on repeat views, on navigation between pages,
 * and under prefers-reduced-motion.
 */
const Preloader = () => {
  const [state, setState] = useState<'hidden' | 'showing' | 'lifting'>(() => {
    if (typeof window === 'undefined') return 'hidden';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'hidden';
    // Only the entry page gets the curtain, never an in-app navigation
    if (window.location.pathname.replace(/\/$/, '') !== '') return 'hidden';
    return 'showing';
  });

  useEffect(() => {
    if (state === 'hidden') return;

    // Hero animations hold back until the curtain starts moving
    document.documentElement.style.setProperty('--intro-delay', `${LIFT_AT / 1000}s`);

    const lift = window.setTimeout(() => setState('lifting'), LIFT_AT);
    const done = window.setTimeout(() => setState('hidden'), DONE_AT);
    const bail = window.setTimeout(() => setState('hidden'), HARD_STOP);
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
      {/* The same mark as the header, at the intro size from the brief */}
      <span className="block text-ink-900 opacity-0 animate-[introFade_0.6s_ease_0.1s_both]">
        <Logo size={88} color="currentColor" />
      </span>
      <span
        className="block w-[120px] h-px bg-gold-600 origin-left mt-7 scale-x-0 animate-[introLine_0.7s_cubic-bezier(.6,0,.3,1)_0.55s_both]"
      />
    </div>
  );
};

export default Preloader;
