import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Scroll reveals, done with one shared IntersectionObserver and plain CSS — no
 * animation library on the public bundle.
 *
 *  up   — headings, paragraphs, cards: fade in and rise 28px
 *  mask — photographs: a curtain opens from the top down
 *  line — the gold rules beside small labels: draw out from the centre
 *  frame — the offset gold frames: slide in 28px from below-left and fade up
 *
 * The element is attached through a callback ref rather than an effect. Lists
 * here re-render once their data arrives (/api/content, /api/stories), and an
 * effect that ran only on first mount left those later nodes unobserved — they
 * stayed at opacity 0 forever. A callback ref fires for whatever node is in the
 * DOM right now, including replacements.
 *
 * A timer is the belt to that braces: if a node has not been revealed within
 * 1.5s, it is revealed regardless. Nothing stays invisible because of us.
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

    if (delay) el.style.transitionDelay = `${delay}s`;

    // On screen already (above the fold): show it without waiting for a scroll
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal(el);
      return;
    }

    getObserver().observe(el);
    timer.current = window.setTimeout(() => {
      if (node.current) reveal(node.current);
    }, SAFETY_MS + delay * 1000);
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
      {children}
    </Tag>
  );
}

export default Reveal;
