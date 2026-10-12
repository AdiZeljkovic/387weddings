import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Scroll reveals, done with one shared IntersectionObserver and plain CSS — no
 * animation library on the public bundle.
 *
 *  up   — headings, paragraphs, cards: fade in and rise 28px
 *  mask — photographs: a curtain opens from the top down. Done with two
 *         counter-moving transforms rather than an animated clip-path: a
 *         clip-path is repainted on the main thread every frame, for every
 *         photograph at once, which is what made long galleries stutter.
 *  line — the gold rules beside small labels: draw out from the centre
 *  frame — the offset gold frames: slide in 28px from below-left and fade up
 *
 * The element is attached through a callback ref rather than an effect. Lists
 * here re-render once their data arrives (/api/content, /api/stories), and an
 * effect that ran only on first mount left those later nodes unobserved — they
 * stayed at opacity 0 forever. A callback ref fires for whatever node is in the
 * DOM right now, including replacements.
 *
 * A timer is the belt to those braces: if a node is on screen and still not
 * revealed after 1.5s, it is revealed regardless. It only looks at what is on
 * screen — it used to reveal everything after 1.5s, so a long page started
 * dozens of reveals at the same moment (a stall) and nothing further down was
 * left to appear while scrolling.
 */
export type RevealKind = 'up' | 'mask' | 'line' | 'frame';

const SAFETY_MS = 1500;

let observer: IntersectionObserver | null = null;

const getObserver = () => {
  if (observer) return observer;
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
  );
  return observer;
};

const reveal = (el: Element) => {
  el.classList.add('is-in');
  observer?.unobserve(el);
};

/** Callback ref that observes the current node and guarantees a reveal. */
export const useRevealRef = (delay = 0) => {
  const timer = useRef<number | null>(null);
  const node = useRef<HTMLElement | null>(null);

  const setNode = useCallback((el: HTMLElement | null) => {
    if (node.current && node.current !== el) {
      observer?.unobserve(node.current);
    }
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    node.current = el;
    if (!el) return;

    // Read by the reveal animations in index.css
    if (delay) el.style.setProperty('--rv-delay', `${delay}s`);

    // On screen already (above the fold): show it without waiting for a scroll
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal(el);
      return;
    }

    getObserver().observe(el);
    const check = () => {
      const n = node.current;
      if (!n || n.classList.contains('is-in')) return;
      const r = n.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal(n);
      else timer.current = window.setTimeout(check, SAFETY_MS);
    };
    timer.current = window.setTimeout(check, SAFETY_MS + delay * 1000);
  }, [delay]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (node.current) observer?.unobserve(node.current);
  }, []);

  return setNode;
};

type Props<E extends keyof React.JSX.IntrinsicElements> = {
  as?: E;
  kind?: RevealKind;
  /** Seconds added before this element starts */
  delay?: number;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'className' | 'children'>;

const CLASS: Record<RevealKind, string> = {
  up: 'rv-up',
  mask: 'rv-mask',
  line: 'rv-line',
  frame: 'rv-frame',
};

export function Reveal<E extends keyof React.JSX.IntrinsicElements = 'div'>({
  as, kind = 'up', delay = 0, className = '', children, ...rest
}: Props<E>) {
  const ref = useRevealRef(delay);
  const Tag = (as || 'div') as React.ElementType;
  return (
    <Tag ref={ref} className={`${CLASS[kind]} ${className}`} {...rest}>
      {kind === 'mask' ? (
        // The window slides down while the picture slides up by the same
        // amount, so the picture stays put and is uncovered from the top
        <span className="rv-mask-win">
          <span className="rv-mask-pic">{children}</span>
        </span>
      ) : children}
    </Tag>
  );
}

export default Reveal;
