import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, MapPin, Heart, Sparkles, Star, Film, Users, MessageSquare } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, WordReveal } from '../components/anim';

// Icons for the three feature columns — picked by the CMS icon keys
const ICON_MAP: Record<string, React.ReactElement> = {
  sparkles: <Sparkles      size={22} strokeWidth={1.2} />,
  mappin:   <MapPin        size={22} strokeWidth={1.2} />,
  heart:    <Heart         size={22} strokeWidth={1.2} />,
  camera:   <Camera        size={22} strokeWidth={1.2} />,
  star:     <Star          size={22} strokeWidth={1.2} />,
  film:     <Film          size={22} strokeWidth={1.2} />,
  users:    <Users         size={22} strokeWidth={1.2} />,
  chat:     <MessageSquare size={22} strokeWidth={1.2} />,
};

const FALLBACK_SLIDES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
];

// Aspect rhythm for the featured masonry — mixes portrait and square frames
const FEATURED_ASPECTS = [
  'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]',
  'aspect-square', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-square',
];
const ASPECT_WEIGHT = [1.33, 1, 1.25, 1.33, 1, 1.33, 1.25, 1];

const featuredColsFor = (w: number) => (w < 640 ? 1 : w < 1024 ? 2 : 4);

// ── Centered rule heading — "— ISTAKNUTI RADOVI —" ───────────────────────────
const RuleHeading = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="flex items-center justify-center gap-5 md:gap-8">
    <motion.span
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.15, ease: EASE }}
      className="w-12 md:w-24 h-[1px] bg-gold-500/40 origin-right"
      aria-hidden="true"
    />
    <motion.h2
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE }}
      style={style}
      className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-bold text-gold-300 text-center whitespace-nowrap"
    >
      {children}
    </motion.h2>
    <motion.span
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.15, ease: EASE }}
      className="w-12 md:w-24 h-[1px] bg-gold-500/40 origin-left"
      aria-hidden="true"
    />
  </div>
);

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [featuredCols, setFeaturedCols] = useState(() =>
    typeof window === 'undefined' ? 4 : featuredColsFor(window.innerWidth)
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 1024);
      setFeaturedCols(featuredColsFor(window.innerWidth));
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => console.warn('Home: settings load failed', err));
  }, []);

  // Featured works are fed by the portfolio gallery, deduped
  useEffect(() => {
    fetch('/api/gallery')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { url?: string }[]) => {
        if (!Array.isArray(rows)) return;
        const urls = Array.from(new Set(
          rows.map(r => r.url).filter((u): u is string => Boolean(u && u.trim()))
        )).slice(0, 8);
        setGalleryImages(urls);
      })
      .catch(() => {});
  }, []);

  // Hero frame — the mobile slot wins on phones when the client has set one
  const heroSrc =
    (isMobile ? settings['img.home.hero.mobile.1'] : '') ||
    settings['img.home.hero.1'] ||
    FALLBACK_SLIDES[0];
  const heroImg = respImg(heroSrc, [768, 1280, 1920]);

  // Hero title split into words for the per-word mask reveal
  const titleWords = [
    ...t('hero.title.part1').split(' ').filter(Boolean).map(w => ({ w, styleKey: 'hero.title.part1', italic: false })),
    ...t('hero.title.part2').split(' ').filter(Boolean).map(w => ({ w, styleKey: 'hero.title.part2', italic: true })),
  ];

  // Featured masonry — greedy packing into the current column count
  const featuredBase = galleryImages.length > 0 ? galleryImages : FALLBACK_SLIDES;
  const featured = featuredCols === 1 ? featuredBase.slice(0, 3) : featuredBase;
  const featuredColumns = useMemo(() => {
    const buckets: { src: string; idx: number }[][] = Array.from({ length: featuredCols }, () => []);
    const heights = new Array(featuredCols).fill(0);
    featured.forEach((src, idx) => {
      let shortest = 0;
      for (let c = 1; c < featuredCols; c++) if (heights[c] < heights[shortest]) shortest = c;
      buckets[shortest].push({ src, idx });
      heights[shortest] += ASPECT_WEIGHT[idx % ASPECT_WEIGHT.length];
    });
    return buckets;
  }, [featured, featuredCols]);

  // About images — story slots with graceful fallbacks
  const aboutMain = respImg(
    settings['img.home.team.aldin'] || FALLBACK_SLIDES[1],
    [480, 960, 1280],
  );
  const aboutSmall = respImg(
    settings['img.home.team.melisa'] || FALLBACK_SLIDES[2],
    [320, 640],
  );

  return (
    <div className="bg-moody-950 overflow-hidden">
      {/* ── Hero — full-bleed cinematic frame, statement anchored left ─────── */}
      <section className="relative h-[88vh] min-h-[560px] overflow-hidden bg-moody-950">
        <motion.img
          key={heroImg.src}
          src={heroImg.src}
          srcSet={heroImg.srcSet}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.6, ease: EASE }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />

        {/* Left-weighted scrim keeps the statement legible on any photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-moody-950 via-moody-950/70 to-moody-950/10" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-moody-950 via-transparent to-moody-950/60" aria-hidden="true" />

        {/* Vertical brand mark on the far left edge */}
        <div
          className="hidden lg:flex absolute left-7 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-5"
          aria-hidden="true"
        >
          <span className="w-[1px] h-16 bg-gradient-to-b from-transparent to-white/30" />
          <span className="text-[11px] tracking-[0.5em] font-bold text-white/40 [writing-mode:vertical-rl] rotate-180">
            387
          </span>
          <span className="w-[1px] h-16 bg-gradient-to-t from-transparent to-white/30" />
        </div>

        <div className="relative z-10 h-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 flex items-center">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Tag */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: EASE }}
              style={getContentStyle('hero.location')}
              className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-bold text-gold-300 mb-6 md:mb-8"
            >
              {t('hero.location')}
            </motion.p>

            {/* Title — each word rises through its own mask; a gold dash closes it */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white leading-[1.0] tracking-tight mb-7 md:mb-9">
              <span className="flex flex-wrap items-center gap-x-[0.26em]">
                {titleWords.map((tw, i) => (
                  <span key={`${tw.w}-${i}`} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                    <motion.span
                      initial={{ y: '112%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 1.2, delay: 0.65 + i * 0.12, ease: EASE }}
                      style={getContentStyle(tw.styleKey)}
                      className={`inline-block ${tw.italic ? 'italic text-gold-400' : ''}`}
                    >
                      {tw.w}
                    </motion.span>
                  </span>
                ))}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 1.15, ease: EASE }}
                  className="inline-block w-10 md:w-16 h-[1.5px] bg-gold-400/80 origin-left ml-2"
                  aria-hidden="true"
                />
              </span>
            </h1>

            {/* Short statement */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.05, ease: EASE }}
              style={getContentStyle('hero.desc')}
              className="text-white/70 font-light text-base md:text-lg leading-relaxed max-w-md mb-10 md:mb-12"
            >
              {t('hero.desc')}
            </motion.p>

            {/* CTAs — outlined rectangle + quiet text link */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.25, ease: EASE }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-9"
            >
              {/* Primary — hairline frame, gold fill sweeps in from the left */}
              <Link
                to="/portfolio"
                className="group relative px-10 md:px-12 py-[1.1rem] whitespace-nowrap block overflow-hidden border border-white/25 hover:border-gold-500/60 transition-colors duration-700 text-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gold-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <span
                  style={getContentStyle('hero.portfolio')}
                  className="relative z-10 text-[10px] md:text-[11px] tracking-[0.45em] uppercase font-medium text-white flex items-center justify-center gap-4"
                >
                  {t('hero.portfolio')}
                  <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
                </span>
              </Link>

              {/* Secondary — quiet text with a gold rule that draws across */}
              <Link to="/contact" className="group relative px-1 py-3 whitespace-nowrap text-center sm:text-left">
                <span
                  style={getContentStyle('hero.inquire')}
                  className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase font-medium text-white/70 group-hover:text-gold-300 transition-colors duration-500"
                >
                  {t('hero.inquire')}
                </span>
                <span className="relative block h-[1px] bg-white/20 mt-2.5 overflow-hidden" aria-hidden="true">
                  <span className="absolute inset-0 bg-gold-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured works — framed masonry fed by the gallery ─────────────── */}
      <section className="relative bg-moody-950 pt-16 md:pt-24 pb-20 md:pb-28 px-6 sm:px-8 lg:px-16">
        <RuleHeading style={getContentStyle('home.featured.title')}>
          {t('home.featured.title')}
        </RuleHeading>

        <div className="flex gap-4 md:gap-5 items-start max-w-[1500px] mx-auto mt-12 md:mt-16">
          {featuredColumns.map((col, ci) => (
            <div key={ci} className="flex-1 flex flex-col gap-4 md:gap-5">
              {col.map(({ src, idx }) => {
                const r = respImg(src, [480, 640, 960]);
                return (
                  <motion.div
                    key={`${src}-${idx}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.9, delay: Math.min(idx * 0.07, 0.4), ease: EASE }}
                  >
                    {/* Gallery frame: warm mat panel + inner hairline + gold corner ticks */}
                    <Link
                      to="/portfolio"
                      className="group relative block p-2.5 md:p-3 bg-gradient-to-b from-white/[0.05] to-white/[0.015] border border-white/10 hover:border-gold-500/45 shadow-[0_16px_45px_rgba(0,0,0,0.4)] hover:shadow-[0_28px_70px_rgba(0,0,0,0.55)] hover:-translate-y-1.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                      {/* Corner ticks — quietly gold, brighten on hover */}
                      <span aria-hidden="true" className="pointer-events-none absolute -top-px -left-px w-3.5 h-3.5 border-t border-l border-gold-500/40 group-hover:border-gold-400 transition-colors duration-700" />
                      <span aria-hidden="true" className="pointer-events-none absolute -top-px -right-px w-3.5 h-3.5 border-t border-r border-gold-500/40 group-hover:border-gold-400 transition-colors duration-700" />
                      <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -left-px w-3.5 h-3.5 border-b border-l border-gold-500/40 group-hover:border-gold-400 transition-colors duration-700" />
                      <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r border-gold-500/40 group-hover:border-gold-400 transition-colors duration-700" />

                      <span className={`relative block ${FEATURED_ASPECTS[idx % FEATURED_ASPECTS.length]} overflow-hidden border border-white/10 group-hover:border-gold-500/25 transition-colors duration-700`}>
                        <img
                          src={r.src}
                          srcSet={r.srcSet}
                          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 48vw, 100vw"
                          alt={`Wedding ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          decoding="async"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                        {/* Soft vignette evens out bright exposures; lifts away on hover */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-moody-950/35 via-transparent to-transparent opacity-70 group-hover:opacity-0 transition-opacity duration-700"
                        />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.25, ease: EASE }}
          className="flex justify-center mt-12 md:mt-16"
        >
          <Link
            to="/portfolio"
            className="group relative px-8 md:px-10 py-3.5 whitespace-nowrap block border border-gold-500/40 hover:border-gold-400 hover:bg-gold-600/10 transition-colors duration-500 text-center"
          >
            <span
              style={getContentStyle('home.featured.cta')}
              className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase font-semibold text-white/85 group-hover:text-white flex items-center justify-center gap-3 transition-colors duration-500"
            >
              {t('home.featured.cta')}
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* ── About — story left, layered photos right ───────────────────────── */}
      <section className="relative bg-moody-950 py-20 md:py-32 px-6 sm:px-8 lg:px-16 overflow-hidden">
        {/* Soft gold glow + oversized script mark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 60% at 30% 40%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -right-10 top-1/2 -translate-y-1/2 text-[16rem] lg:text-[24rem] font-script text-white/[0.03] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="relative max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center">
          {/* Text column */}
          <div className="lg:col-span-5 text-center lg:text-left">
            {/* Tag with a trailing hairline, mockup-style "O NAMA —" */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              className="flex items-center justify-center lg:justify-start gap-5 mb-7"
            >
              <span
                style={getContentStyle('about.artists')}
                className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-bold text-gold-400"
              >
                {t('about.artists')}
              </span>
              <span className="w-10 md:w-16 h-[1px] bg-gold-400/40" aria-hidden="true" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1, ease: EASE }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white leading-[1.05] tracking-tight mb-8"
            >
              <span style={getContentStyle('home.about.title')}>{t('home.about.title')}</span>{' '}
              <span style={getContentStyle('home.about.and')} className="italic text-gold-400">{t('home.about.and')}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
              style={getContentStyle('home.about.desc.1')}
              className="font-serif text-lg md:text-xl text-white/85 leading-relaxed mb-6"
            >
              {t('home.about.desc.1')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: EASE }}
              style={getContentStyle('home.about.desc.2')}
              className="text-base md:text-lg text-white/60 font-light leading-relaxed mb-5"
            >
              {t('home.about.desc.2')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: EASE }}
              style={getContentStyle('home.about.desc.3')}
              className="text-base md:text-lg text-white/60 font-light italic leading-relaxed mb-9"
            >
              {t('home.about.desc.3')}
            </motion.p>

            {/* Underlined text link, per the mockup */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: EASE }}
              className="flex justify-center lg:justify-start"
            >
              <Link to="/about" className="group inline-block">
                <span
                  style={getContentStyle('home.about.cta')}
                  className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase font-semibold text-gold-300 group-hover:text-white transition-colors duration-500 flex items-center gap-3"
                >
                  {t('home.about.cta')}
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
                </span>
                <span className="block h-[1px] bg-gold-400/50 group-hover:bg-gold-400 mt-2 transition-colors duration-500" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>

          {/* Image column — big frame with a small overlapping print + caption */}
          <div className="lg:col-span-7 relative mb-10 lg:mb-0">
            <ParallaxY from={22} to={-22} className="w-[82%] md:w-[72%] ml-auto">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.3, ease: EASE }}
                className="relative p-2.5 md:p-3 bg-gradient-to-b from-white/[0.05] to-white/[0.015] border border-white/10 shadow-[0_20px_55px_rgba(0,0,0,0.45)]"
              >
                <span aria-hidden="true" className="pointer-events-none absolute -top-px -left-px w-3.5 h-3.5 border-t border-l border-gold-500/40" />
                <span aria-hidden="true" className="pointer-events-none absolute -top-px -right-px w-3.5 h-3.5 border-t border-r border-gold-500/40" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -left-px w-3.5 h-3.5 border-b border-l border-gold-500/40" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r border-gold-500/40" />
                <div className="aspect-[4/5] overflow-hidden border border-white/10">
                  <img
                    src={aboutMain.src}
                    srcSet={aboutMain.srcSet}
                    sizes="(min-width: 1024px) 42vw, 82vw"
                    alt={t('about.artists')}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </ParallaxY>

            {/* Small print overlapping the big frame's lower-left corner, caption above */}
            <div className="absolute -bottom-10 left-[6%] md:left-[16%] w-[46%] sm:w-[36%] md:w-[27%]">
              <ParallaxY from={50} to={-25}>
                <motion.div
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, delay: 0.25, ease: EASE }}
                >
                  <span
                    style={getContentStyle('home.about.caption')}
                    className="block font-script text-2xl md:text-[1.75rem] text-gold-200 leading-snug -rotate-2 mb-4 [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]"
                  >
                    {t('home.about.caption')}
                  </span>

                  <div className="border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1.5 md:p-2 shadow-2xl shadow-black/70">
                    <div className="aspect-[3/4] overflow-hidden border border-white/10">
                      <img
                        src={aboutSmall.src}
                        srcSet={aboutSmall.srcSet}
                        sizes="(min-width: 1024px) 15vw, 36vw"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </motion.div>
              </ParallaxY>
            </div>
          </div>
        </div>
      </section>

      {/* ── The experience we provide — three quiet feature columns ────────── */}
      <section className="relative bg-moody-950 pt-12 md:pt-16 pb-24 md:pb-32 px-6 sm:px-8 lg:px-16">
        <RuleHeading style={getContentStyle('home.features.title')}>
          {t('home.features.title')}
        </RuleHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 max-w-5xl mx-auto mt-14 md:mt-20">
          {(['01', '02', '03'] as const).map((num, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.12, ease: EASE }}
              className="flex flex-col items-center text-center"
            >
              <span className="w-12 h-12 border border-gold-500/40 rounded-sm flex items-center justify-center text-gold-400 mb-6" aria-hidden="true">
                {ICON_MAP[t(`home.process.${num}.icon`)] ?? ICON_MAP['sparkles']}
              </span>

              <h3
                style={getContentStyle(`home.process.${num}.title`)}
                className="text-[11px] md:text-xs tracking-[0.35em] uppercase font-bold text-white mb-4"
              >
                {t(`home.process.${num}.title`)}
              </h3>

              <p
                style={getContentStyle(`home.process.${num}.desc`)}
                className="text-white/55 font-light text-sm leading-relaxed max-w-[17rem]"
              >
                {t(`home.process.${num}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>

      </section>

      {/* ── Final CTA — full-bleed cinematic closer, shared with the site ──── */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 sm:px-8 py-28 md:py-40 text-center overflow-hidden bg-moody-950">
        <ParallaxY from={-50} to={50} className="absolute inset-0">
          {/* Bookends the page with the hero frame — already cached, costs nothing */}
          <img
            src={heroImg.src}
            srcSet={heroImg.srcSet}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            className="w-full h-[125%] object-cover opacity-40"
            loading="lazy"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </ParallaxY>
        <div className="absolute inset-0 bg-gradient-to-b from-moody-950/85 via-moody-950/60 to-moody-950" aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 45%, rgba(166,134,93,0.22) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE }}
            className="flex justify-center mb-8"
            aria-hidden="true"
          >
            <Sparkles size={22} strokeWidth={1.2} className="text-gold-400/80" />
          </motion.div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white leading-[1.02] tracking-tight mb-12 md:mb-16">
            <WordReveal
              words={[
                ...t('experience.cta.title.part1').split(' ').filter(Boolean)
                  .map(w => ({ w, style: getContentStyle('experience.cta.title.part1') })),
                ...t('experience.cta.title.part2').split(' ').filter(Boolean)
                  .map(w => ({ w, style: getContentStyle('experience.cta.title.part2'), italic: true })),
              ]}
              delay={0.25}
            />
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
            className="flex justify-center"
          >
            <Link
              to="/contact"
              className="group relative inline-block px-14 md:px-16 py-5 overflow-hidden whitespace-nowrap bg-gold-600 hover:bg-gold-500 rounded-full text-center shadow-xl shadow-gold-600/30 animate-[ctaPulse_3s_ease-in-out_infinite] transition-colors duration-500"
            >
              <span
                style={getContentStyle('experience.cta.button')}
                className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold text-white flex items-center justify-center gap-3"
              >
                {t('experience.cta.button')}
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
