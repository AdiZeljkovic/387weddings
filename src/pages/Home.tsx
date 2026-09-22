import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE } from '../components/anim';

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000';

// One fallback per mosaic slot, so the page never renders holes before the
// client has uploaded their own nine frames in Admin → Fotografije.
const MOSAIC_FALLBACKS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1000',
];

// The mosaic from the mockup. Phones flow it into two columns (one tile goes
// full width to break the rhythm). Everything is plain auto-flow with column
// spans — no explicit line placement — so a tile can never land off-grid.
//
// Six frames sit beside the heading on a 12-column inner grid:
//   row 1 — 4 / 4 / 4      row 2 — 3 / 5 / 4 (narrow, wide, normal)
const MOSAIC_TOP = [
  { key: 'img.home.grid.1', span: 'col-span-1 md:col-span-4' },
  { key: 'img.home.grid.2', span: 'col-span-1 md:col-span-4' },
  { key: 'img.home.grid.3', span: 'col-span-1 md:col-span-4' },
  { key: 'img.home.grid.4', span: 'col-span-1 md:col-span-3' },
  { key: 'img.home.grid.5', span: 'col-span-2 md:col-span-5' },
  { key: 'img.home.grid.6', span: 'col-span-2 md:col-span-4' },
];

// Three more run the full width of the section underneath
const MOSAIC_BOTTOM = [
  { key: 'img.home.grid.7', span: 'col-span-1' },
  { key: 'img.home.grid.8', span: 'col-span-1' },
  { key: 'img.home.grid.9', span: 'col-span-2 md:col-span-1' },
];

// One frame of the mosaic — fills whatever grid cell it is handed
const Frame = ({ src, index, span, eager }: {
  src: string; index: number; span: string; eager?: boolean;
}) => {
  const r = respImg(src, [480, 640, 960]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.85, delay: Math.min(index * 0.05, 0.3), ease: EASE }}
      className={span}
    >
      <Link to="/portfolio" className="group block w-full h-full overflow-hidden bg-canvas-200">
        <img
          src={r.src}
          srcSet={r.srcSet}
          sizes="(min-width: 768px) 28vw, 50vw"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </Link>
    </motion.div>
  );
};

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => console.warn('Home: settings load failed', err));
  }, []);

  // The mobile hero slot wins on phones, but only when the client has set one
  const heroSrc =
    (isMobile ? settings['img.home.hero.mobile.1'] : '') ||
    settings['img.home.hero.1'] ||
    HERO_FALLBACK;
  const heroImg = respImg(heroSrc, [768, 1280, 1920]);

  const aboutMain = respImg(settings['img.home.team.aldin'] || MOSAIC_FALLBACKS[1], [480, 960, 1280]);
  const aboutPrint = respImg(settings['img.home.team.melisa'] || MOSAIC_FALLBACKS[6], [320, 640]);

  return (
    <div className="bg-canvas-100">
      {/* ── Hero — full-bleed frame, statement anchored left ────────────────── */}
      <section className="relative h-[92vh] min-h-[560px] max-h-[900px] overflow-hidden bg-moody-950">
        <motion.img
          key={heroImg.src}
          src={heroImg.src}
          srcSet={heroImg.srcSet}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />

        {/* Left-weighted scrim keeps the statement legible on any photograph */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-moody-950/95 via-moody-950/55 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-moody-950/80 via-transparent to-moody-950/35"
          aria-hidden="true"
        />

        <div className="relative z-10 h-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 flex items-center">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl font-serif font-light text-white leading-[1.08] tracking-tight mb-7 md:mb-8">
              {(['part1', 'part2'] as const).map((part, i) => (
                <span key={part} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1.15, delay: 0.35 + i * 0.14, ease: EASE }}
                    style={getContentStyle(`hero.title.${part}`)}
                    className="block"
                  >
                    {t(`hero.title.${part}`)}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.75, ease: EASE }}
              style={getContentStyle('hero.desc')}
              className="text-white/75 font-light text-[15px] md:text-[17px] leading-relaxed max-w-sm mb-10 md:mb-12 whitespace-pre-line"
            >
              {t('hero.desc')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.95, ease: EASE }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-7"
            >
              {/* Primary — solid ink block, as in the mockup */}
              <Link
                to="/portfolio"
                className="group relative block px-9 md:px-11 py-[1.15rem] whitespace-nowrap overflow-hidden bg-ink-900 border border-white/15 hover:border-white/35 transition-colors duration-500 text-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <span
                  style={getContentStyle('hero.portfolio')}
                  className="relative z-10 text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium text-white flex items-center justify-center gap-3"
                >
                  {t('hero.portfolio')}
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform duration-500"
                    aria-hidden="true"
                  />
                </span>
              </Link>

              {/* Secondary — quiet label, rule draws across on hover */}
              <Link to="/contact" className="group relative px-1 py-3 whitespace-nowrap text-center sm:text-left">
                <span
                  style={getContentStyle('hero.inquire')}
                  className="text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium text-white/85 group-hover:text-white transition-colors duration-500 flex items-center justify-center sm:justify-start gap-3"
                >
                  {t('hero.inquire')}
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform duration-500"
                    aria-hidden="true"
                  />
                </span>
                <span className="relative block h-[1px] bg-white/25 mt-2 overflow-hidden" aria-hidden="true">
                  <span className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue — mouse outline with a drifting dot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5, ease: EASE }}
          className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2.5"
          aria-hidden="true"
        >
          <span className="w-[22px] h-[34px] rounded-full border border-white/45 flex items-start justify-center pt-2">
            <span className="w-[3px] h-[6px] rounded-full bg-white/80 animate-[scrollBounce_2s_ease-in-out_infinite]" />
          </span>
          <span
            style={getContentStyle('home.scroll')}
            className="text-[9px] tracking-[0.35em] uppercase font-medium text-white/60"
          >
            {t('home.scroll')}
          </span>
        </motion.div>
      </section>

      {/* ── Featured works — editorial mosaic on paper ──────────────────────── */}
      <section className="bg-canvas-100 py-16 md:py-24 px-6 sm:px-8 lg:px-16">
        <div className="max-w-[1500px] mx-auto">
          {/* Heading beside the first two image rows */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-[6px] md:gap-2">
            <div className="md:col-span-3 flex flex-col justify-center text-center md:text-left mb-8 md:mb-0 md:pr-6 lg:pr-10">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.9, ease: EASE }}
                style={getContentStyle('home.featured.title')}
                className="block text-[10px] lg:text-[11px] tracking-[0.4em] uppercase font-semibold text-ink-500 mb-5 md:mb-6"
              >
                {t('home.featured.title')}
              </motion.span>

              <h2 className="text-[2rem] lg:text-[2.9rem] font-serif font-light text-ink-900 leading-[1.15] tracking-tight">
                {(['part1', 'part2', 'part3'] as const).map((part, i) => (
                  <motion.span
                    key={part}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ duration: 0.95, delay: 0.1 + i * 0.12, ease: EASE }}
                    style={getContentStyle(`home.featured.heading.${part}`)}
                    className="block"
                  >
                    {t(`home.featured.heading.${part}`)}
                  </motion.span>
                ))}
              </h2>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: EASE }}
                className="flex items-center justify-center md:justify-start gap-4 mt-6 md:mt-7"
                aria-hidden="true"
              >
                <span className="hidden md:block w-10 lg:w-14 h-[1px] bg-ink-900/20" />
                <Heart size={15} strokeWidth={1.3} className="text-ink-400" />
              </motion.div>
            </div>

            <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-12 gap-[6px] md:gap-2 auto-rows-[38vw] md:auto-rows-[clamp(150px,17.5vw,266px)]">
              {MOSAIC_TOP.map((tile, i) => (
                <Frame
                  key={tile.key}
                  src={settings[tile.key] || MOSAIC_FALLBACKS[i]}
                  index={i}
                  span={tile.span}
                  eager={i < 3}
                />
              ))}
            </div>
          </div>

          {/* Full-width band underneath */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[6px] md:gap-2 mt-[6px] md:mt-2 auto-rows-[38vw] md:auto-rows-[clamp(120px,14vw,212px)]">
            {MOSAIC_BOTTOM.map((tile, i) => (
              <Frame
                key={tile.key}
                src={settings[tile.key] || MOSAIC_FALLBACKS[i + 6]}
                index={i + 6}
                span={tile.span}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="flex justify-center mt-10 md:mt-14"
          >
            <Link
              to="/portfolio"
              className="group relative block px-10 md:px-12 py-[0.95rem] whitespace-nowrap overflow-hidden border border-ink-900/30 hover:border-ink-900 transition-colors duration-500 text-center"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-ink-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <span
                style={getContentStyle('home.featured.cta')}
                className="relative z-10 text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium text-ink-900 group-hover:text-white transition-colors duration-500 flex items-center justify-center gap-3"
              >
                {t('home.featured.cta')}
                <ArrowRight
                  size={13}
                  className="group-hover:translate-x-1 transition-transform duration-500"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── About — story left, layered prints right ────────────────────────── */}
      <section className="bg-canvas-50 py-16 md:py-24 lg:py-28 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              className="flex items-center gap-4 mb-6"
            >
              <span
                style={getContentStyle('home.about.tag')}
                className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase font-semibold text-ink-500"
              >
                {t('home.about.tag')}
              </span>
              <span className="w-10 md:w-14 h-[1px] bg-ink-900/20" aria-hidden="true" />
            </motion.div>

            <h2 className="text-[1.9rem] sm:text-4xl lg:text-[2.75rem] font-serif font-light text-ink-900 leading-[1.15] tracking-tight mb-7 md:mb-8">
              {(['part1', 'part2'] as const).map((part, i) => (
                <motion.span
                  key={part}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.95, delay: 0.1 + i * 0.12, ease: EASE }}
                  style={getContentStyle(`home.about.heading.${part}`)}
                  className="block"
                >
                  {t(`home.about.heading.${part}`)}
                </motion.span>
              ))}
            </h2>

            {(['1', '2'] as const).map((n, i) => (
              <motion.p
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.95, delay: 0.2 + i * 0.1, ease: EASE }}
                style={getContentStyle(`home.about.desc.${n}`)}
                className="text-ink-500 font-light text-[14px] md:text-[15px] leading-[1.9] mb-5 max-w-md"
              >
                {t(`home.about.desc.${n}`)}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.45, ease: EASE }}
              className="mt-8 md:mt-9"
            >
              <Link
                to="/about"
                className="group relative inline-block px-9 md:px-10 py-[1.05rem] whitespace-nowrap overflow-hidden bg-ink-900 text-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-white/12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <span
                  style={getContentStyle('home.about.cta')}
                  className="relative z-10 text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium text-white flex items-center justify-center gap-3"
                >
                  {t('home.about.cta')}
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform duration-500"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Image column — main frame, offset outline, overlapping small print */}
          <div className="lg:col-span-7 relative mt-4 lg:mt-0 pb-16 sm:pb-12 lg:pb-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE }}
              className="relative w-[86%] ml-auto"
            >
              {/* Hairline frame peeking out from behind, down and to the right */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-x-4 translate-y-5 md:translate-x-6 md:translate-y-7 border border-ink-900/15"
              />
              <div className="relative aspect-[5/4] overflow-hidden bg-canvas-200">
                <img
                  src={aboutMain.src}
                  srcSet={aboutMain.srcSet}
                  sizes="(min-width: 1024px) 48vw, 86vw"
                  alt={t('home.about.tag')}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Small print overlapping the main frame's lower-left corner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.25, ease: EASE }}
              className="absolute left-0 bottom-0 w-[32%] sm:w-[26%] lg:w-[23%]"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-canvas-200 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                <img
                  src={aboutPrint.src}
                  srcSet={aboutPrint.srcSet}
                  sizes="(min-width: 1024px) 14vw, 30vw"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
                {/* Brand mark sits on the print */}
                <span className="absolute inset-0 bg-ink-900/25" aria-hidden="true" />
                <span
                  className="absolute inset-0 flex flex-col items-center justify-center text-white"
                  aria-hidden="true"
                >
                  <span className="font-serif font-light text-2xl md:text-[1.9rem] leading-none">387</span>
                  <span className="text-[6px] md:text-[7px] tracking-[0.4em] uppercase font-semibold mt-1.5 text-white/80">
                    Weddings
                  </span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
