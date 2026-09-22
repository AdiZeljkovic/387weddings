import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

// Shared house easing — used across the whole site
export const EASE = [0.16, 1, 0.3, 1] as const;

// True on tablet and up. Scroll-linked transforms of full-bleed images are the
// most expensive thing on the page, so phones opt out and render statically.
export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
};

// ── Scroll-driven parallax wrapper ───────────────────────────────────────────
// Child drifts vertically (from → to px) as it crosses the viewport.
export const ParallaxY = ({ children, from = 40, to = -40, className = '' }: {
  children: React.ReactNode; from?: number; to?: number; className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  const drifting = isDesktop && !reduced;
  return (
    <motion.div
      ref={ref}
      style={drifting ? { y } : undefined}
      // `parallax-layer` hands the drifting image its own compositor layer, so
      // scrolling moves an existing layer instead of repainting it each frame.
      className={`${drifting ? 'parallax-layer ' : ''}${className}`}
    >
      {children}
    </motion.div>
  );
};

// ── Editorial image reveal ───────────────────────────────────────────────────
// Curtain clip-path reveal + slow settle of the image scale.
export const RevealImage = ({ src, alt, className = '', srcSet, sizes, eager = false }: {
  src: string; alt: string; className?: string; srcSet?: string; sizes?: string; eager?: boolean;
}) => (
  <motion.div
    initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
    whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 1.3, ease: EASE }}
    className={`overflow-hidden ${className}`}
  >
    <motion.img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      initial={{ scale: 1.25 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1.7, ease: EASE }}
      className="w-full h-full object-cover"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
    />
  </motion.div>
);

// ── Section tag flanked by growing gold lines ────────────────────────────────
export const SectionTag = ({ children, style, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) => (
  <div className={`flex items-center justify-center gap-4 md:gap-6 ${className}`}>
    <motion.span
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.15, ease: EASE }}
      className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-right"
      aria-hidden="true"
    />
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE }}
      style={style}
      className="block text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-bold text-gold-300"
    >
      {children}
    </motion.span>
    <motion.span
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.15, ease: EASE }}
      className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-left"
      aria-hidden="true"
    />
  </div>
);

// ── Per-word mask reveal for big serif headings ──────────────────────────────
export const WordReveal = ({ words, className = '', delay = 0.3 }: {
  words: { w: string; style?: React.CSSProperties; italic?: boolean }[];
  className?: string;
  delay?: number;
}) => (
  <span className={`flex flex-wrap justify-center gap-x-[0.26em] ${className}`}>
    {words.map((tw, i) => (
      <span key={`${tw.w}-${i}`} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em]">
        <motion.span
          initial={{ y: '112%' }}
          whileInView={{ y: '0%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.15, delay: delay + i * 0.13, ease: EASE }}
          style={tw.style}
          className={`inline-block ${tw.italic ? 'italic text-gold-600' : ''}`}
        >
          {tw.w}
        </motion.span>
      </span>
    ))}
  </span>
);

// ── Gold pill CTA link ───────────────────────────────────────────────────────
export const GoldPill = ({ to, children, style, className = '' }: {
  to: string; children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) => (
  <Link
    to={to}
    className={`group relative inline-block px-12 md:px-14 py-5 overflow-hidden whitespace-nowrap border border-gold-500/40 hover:border-gold-400 transition-colors duration-700 text-center ${className}`}
  >
    <span className="absolute inset-0 bg-gold-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" aria-hidden="true" />
    <span style={style} className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-medium text-gold-200 group-hover:text-white transition-colors duration-700 flex items-center justify-center gap-3">
      {children}
      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
    </span>
  </Link>
);
