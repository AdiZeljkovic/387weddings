import React, { useEffect, useRef } from 'react';

/**
 * Scroll reveals from the brief, done with one shared IntersectionObserver and
 * plain CSS transitions — no animation library on the public bundle.
 *
 *  up   — headings, paragraphs, cards: fade in and rise 28px
 *  mask — photographs: a curtain opens from the top down
 *  line — the gold rules beside small labels: draw out from the centre
 *
 * Everything is disabled under prefers-reduced-motion, where the CSS simply
 * leaves elements in their final state.
 */
export type RevealKind = 'up' | 'mask' | 'line';

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
    // Fire a little before the element is fully on screen
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  return observer;
};

export const useReveal = <T extends HTMLElement>(delay = 0) => {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delay) el.style.transitionDelay = `${delay}s`;
    // Already on screen at mount (above the fold): show it without waiting
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-in');
      return;
    }
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, [delay]);
  return ref;
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
};

export function Reveal<E extends keyof React.JSX.IntrinsicElements = 'div'>({
  as, kind = 'up', delay = 0, className = '', children, ...rest
}: Props<E>) {
  const ref = useReveal<HTMLElement>(delay);
  const Tag = (as || 'div') as React.ElementType;
  return (
    <Tag ref={ref} className={`${CLASS[kind]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default Reveal;
