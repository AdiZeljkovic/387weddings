import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, MapPin, Heart, Sparkles, Star, Film, Users, MessageSquare } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { ParallaxY } from '../components/anim';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';

// ── Scroll-scrubbed process step ─────────────────────────────────────────────
// The entire scene is DRIVEN by scroll position (scrub, not trigger): the image
// sweeps in from its side through a 3D turn + curtain wipe, the gold frame
// arrives at its own speed, text cascades from the opposite side, and the ghost
// number floats in behind. Scrolling back rewinds the choreography.
const ProcessStep = ({ num, img, fallbackIcon, reversed, hasCta, t, getContentStyle }: {
  num: string;
  img: string;
  fallbackIcon: string;
  reversed: boolean;
  hasCta: boolean;
  t: (key: string) => string;
  getContentStyle: (key: string) => React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.35'] });
  // Spring smoothing → buttery scrub instead of raw scroll jitter
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.6 });

  const imgDir = reversed ? 1 : -1;  // image enters from its own side
  const textDir = -imgDir;           // text enters from the opposite side

  const imgX     = useTransform(p, [0, 1], [imgDir * 140, 0]);
  const imgRot   = useTransform(p, [0, 1], [imgDir * 10, 0]);
  const imgClip  = useTransform(p, [0, 0.85], reversed
    ? ['inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)']
    : ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']);
  const imgScale = useTransform(p, [0, 1], [1.25, 1]);
  const frameX   = useTransform(p, [0, 1], [imgDir * 90, 0]);
  const numX     = useTransform(p, [0, 1], [imgDir * 80, 0]);
  const numO     = useTransform(p, [0, 1], [0, 1]);

  const tX1 = useTransform(p, [0.10, 1], [textDir * 80, 0]);
  const tX2 = useTransform(p, [0.20, 1], [textDir * 110, 0]);
  const tX3 = useTransform(p, [0.30, 1], [textDir * 140, 0]);
  const tO1 = useTransform(p, [0.10, 0.70], [0, 1]);
  const tO2 = useTransform(p, [0.20, 0.80], [0, 1]);
  const tO3 = useTransform(p, [0.30, 0.90], [0, 1]);

  // Respect prefers-reduced-motion — render the scene static
  const st = (styles: Record<string, unknown>) => (reduced ? undefined : styles);

  return (
    <div
      ref={ref}
      className={`relative flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-24`}
    >
      {/* Ghost number floating in behind the step */}
      <motion.span
        style={st({ x: numX, opacity: numO })}
        aria-hidden="true"
        className={`absolute -top-16 md:-top-28 ${reversed ? 'right-0 md:-right-4' : 'left-0 md:-left-4'} text-[9rem] md:text-[16rem] font-serif leading-none text-gold-600/[0.08] select-none pointer-events-none`}
      >
        {num}
      </motion.span>

      {/* Image column — 3D sweep + curtain wipe, gold frame trails behind */}
      <div className="w-full md:w-1/2 relative z-10" style={{ perspective: '1200px' }}>
        <motion.div
          style={st({ x: frameX })}
          aria-hidden="true"
          className={`absolute -top-4 md:-top-6 ${reversed ? '-right-4 md:-right-6' : '-left-4 md:-left-6'} w-full aspect-[4/5] border border-gold-600/40 pointer-events-none`}
        />
        <ParallaxY from={28} to={-28}>
          <motion.div
            style={st({ x: imgX, rotateY: imgRot, clipPath: imgClip })}
            className="aspect-[4/5] overflow-hidden shadow-2xl shadow-moody-900/20"
          >
            <motion.img
              src={respImg(img, [640, 960, 1280]).src}
              srcSet={respImg(img, [640, 960, 1280]).srcSet}
              sizes="(min-width: 768px) 50vw, 100vw"
              alt={t(`home.process.${num}.title`)}
              style={st({ scale: imgScale })}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </ParallaxY>
      </div>

      {/* Text column — cascading scrub from the opposite side */}
      <div className="w-full md:w-1/2 space-y-6 md:space-y-7 relative z-10">
        <motion.div style={st({ x: tX1, opacity: tO1 })} className="flex items-center gap-5">
          <span style={getContentStyle(`home.process.${num}.num`)} className="text-5xl md:text-7xl font-serif font-light text-gold-600/35 block">
            {t(`home.process.${num}.num`)}
          </span>
          {ICON_MAP[t(`home.process.${num}.icon`)] ?? ICON_MAP[fallbackIcon]}
        </motion.div>

        <motion.h3
          style={{ ...st({ x: tX2, opacity: tO2 }), ...getContentStyle(`home.process.${num}.title`) }}
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-moody-900 leading-tight"
        >
          {t(`home.process.${num}.title`)}
        </motion.h3>

        <motion.div style={st({ x: tX2, opacity: tO2 })} className="w-12 h-[1px] bg-gold-600/50" aria-hidden="true" />

        <motion.span
          style={{ ...st({ x: tX3, opacity: tO3 }), ...getContentStyle(`home.process.${num}.tag`) }}
          className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-gold-600 font-bold block"
        >
          {t(`home.process.${num}.tag`)}
        </motion.span>

        <motion.p
          style={{ ...st({ x: tX3, opacity: tO3 }), ...getContentStyle(`home.process.${num}.desc`) }}
          className="text-moody-900/70 font-light text-base md:text-lg leading-relaxed max-w-md"
        >
          {t(`home.process.${num}.desc`)}
        </motion.p>

        {hasCta && (
          <motion.div style={st({ x: tX3, opacity: tO3 })} className="pt-8">
            <Link to="/contact" className="group flex items-center gap-3 md:gap-6 py-4">
              <span className="text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em] lg:group-hover:tracking-[0.7em] uppercase text-moody-900 font-black whitespace-nowrap group-hover:text-gold-600 transition-all duration-700">
                {t('home.process.03.cta')}
              </span>
              <div className="relative flex items-center justify-center">
                <div className="w-8 md:w-12 h-[1px] bg-moody-900/20 group-hover:bg-gold-600/40 lg:group-hover:w-20 transition-all duration-700" />
                <ArrowRight size={16} className="text-moody-900 group-hover:text-gold-600 lg:group-hover:translate-x-4 transition-all duration-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ICON_MAP: Record<string, React.ReactElement> = {
  sparkles:    <Sparkles    size={32} strokeWidth={1} className="text-gold-600/40" />,
  mappin:      <MapPin      size={32} strokeWidth={1} className="text-gold-600/40" />,
  heart:       <Heart       size={32} strokeWidth={1} className="text-gold-600/40" />,
  camera:      <Camera      size={32} strokeWidth={1} className="text-gold-600/40" />,
  star:        <Star        size={32} strokeWidth={1} className="text-gold-600/40" />,
  film:        <Film        size={32} strokeWidth={1} className="text-gold-600/40" />,
  users:       <Users       size={32} strokeWidth={1} className="text-gold-600/40" />,
  chat:        <MessageSquare size={32} strokeWidth={1} className="text-gold-600/40" />,
};

// Collection cards — cover image comes from the first gallery image of each category
const COLLECTIONS = [
  { cat: 'WEDDINGS',  labelKey: 'portfolio.filter.weddings',  fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900' },
  { cat: 'STUDIO',    labelKey: 'portfolio.filter.studio',    fallback: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=900' },
  { cat: 'PORTRAITS', labelKey: 'portfolio.filter.portraits', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=900' },
] as const;

const FALLBACK_SLIDES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
];

const Home = () => {
  const { t, getContentStyle, language } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [stripImages, setStripImages] = useState<string[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [heroSlides, setHeroSlides] = useState<{ desktop: string[]; mobile: string[] } | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    loadSettings()
      .then(data => {
        setSettings(data);
        const desktop = ([1,2,3,4,5] as const)
          .map(n => data[`img.home.hero.${n}`])
          .filter((s): s is string => Boolean(s && s.trim()));
        const mobile = ([1,2,3,4,5] as const)
          .map(n => data[`img.home.hero.mobile.${n}`])
          .filter((s): s is string => Boolean(s && s.trim()));
        const desktopSlides = desktop.length > 0 ? desktop : FALLBACK_SLIDES;
        setHeroSlides({ desktop: desktopSlides, mobile: mobile.length > 0 ? mobile : desktopSlides });
      })
      .catch(err => {
        console.warn('Home: settings load failed', err);
        setHeroSlides({ desktop: FALLBACK_SLIDES, mobile: FALLBACK_SLIDES });
      });
  }, []);

  // Hero marquee sources portfolio gallery images; falls back to hero slots
  useEffect(() => {
    fetch('/api/gallery')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { url?: string; category?: string }[]) => {
        if (!Array.isArray(rows)) return;
        // Dedupe — the same photo uploaded twice must not repeat in the strip
        const urls = Array.from(new Set(
          rows.map(r => r.url).filter((u): u is string => Boolean(u && u.trim()))
        )).slice(0, 20);
        setStripImages(urls);
        // First image per category = collection card cover; also count per category
        const c: Record<string, string> = {};
        const n: Record<string, number> = {};
        for (const row of rows) {
          if (row.url && row.category) {
            if (!c[row.category]) c[row.category] = row.url;
            n[row.category] = (n[row.category] || 0) + 1;
          }
        }
        setCovers(c);
        setCounts(n);
      })
      .catch(() => {});
  }, []);

  // null = still loading; pick set based on screen width
  const slides = heroSlides ? (isMobile ? heroSlides.mobile : heroSlides.desktop) : [];

  // Marquee needs two identical halves (translateX -50% loops seamlessly);
  // with few images duplicate 4× so the track is wider than the viewport.
  // Backdrop for the closing plate — the hero slot, so the page bookends itself
  const aboutBackdrop = respImg(
    settings['img.home.hero.1'] || FALLBACK_SLIDES[0],
    [768, 1280, 1920],
  );

  const stripBase = stripImages.length > 0 ? stripImages : slides;
  const stripCopies = stripBase.length >= 8 ? 2 : 4;
  const loopImages = stripBase.length > 0
    ? Array.from({ length: stripCopies }).flatMap(() => stripBase)
    : [];

  // Hero title split into words for the per-word mask reveal
  const titleWords = [
    ...t('hero.title.part1').split(' ').filter(Boolean).map(w => ({ w, styleKey: 'hero.title.part1', italic: false })),
    ...t('hero.title.part2').split(' ').filter(Boolean).map(w => ({ w, styleKey: 'hero.title.part2', italic: true })),
  ];

  // Collections — scroll-scrubbed "deck spread": side cards sweep in rotated,
  // the middle one rises from below; scrolling back rewinds the spread.
  const reducedMotion = useReducedMotion();
  const collRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: collProgress } = useScroll({ target: collRef, offset: ['start 0.95', 'start 0.4'] });
  const collP = useSpring(collProgress, { stiffness: 90, damping: 22, mass: 0.6 });
  const collOpacity = useTransform(collP, [0, 0.65], [0, 1]);
  const collFx = [
    { x: useTransform(collP, [0, 1], [-110, 0]), y: useTransform(collP, [0, 1], [36, 0]),  rotate: useTransform(collP, [0, 1], [-7, 0]), scale: useTransform(collP, [0, 1], [1, 1]) },
    { x: useTransform(collP, [0, 1], [0, 0]),    y: useTransform(collP, [0, 1], [130, 0]), rotate: useTransform(collP, [0, 1], [0, 0]),  scale: useTransform(collP, [0, 1], [0.9, 1]) },
    { x: useTransform(collP, [0, 1], [110, 0]),  y: useTransform(collP, [0, 1], [36, 0]),  rotate: useTransform(collP, [0, 1], [7, 0]),  scale: useTransform(collP, [0, 1], [1, 1]) },
  ];
  const collTitle = t('home.collections.title');

  return (
    <div className="bg-gold-50 overflow-hidden">
      {/* Hero — filmstrip of images below the light header (editorial style) */}
      <section className="bg-white pt-6 md:pt-10">
        {/* Filmstrip marquee: continuously drifting strip of gallery images */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden marquee-pause h-[34vh] sm:h-[37vh] md:h-[42vh] bg-gold-50/40"
        >
          {/* Edge fades — cinematic depth on both ends of the strip */}
          <div className="absolute inset-y-0 left-0 w-12 md:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-12 md:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div
            className="flex h-full w-max animate-marquee"
            style={{ '--marquee-duration': `${Math.max(loopImages.length * 3, 40)}s` } as React.CSSProperties}
          >
            {loopImages.map((src, i) => {
              const r = respImg(src, [320, 480, 640]);
              return (
                <div
                  key={`${src}-${i}`}
                  className="relative flex-none w-[56vw] sm:w-[30vw] md:w-[15vw] h-full mr-1 overflow-hidden group"
                >
                  <img
                    src={r.src}
                    srcSet={r.srcSet}
                    sizes="(min-width: 768px) 15vw, 56vw"
                    alt={`Wedding ${(i % stripBase.length) + 1}`}
                    className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    loading={i < 8 ? 'eager' : 'lazy'}
                    fetchPriority={i < 4 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Centered statement below the strip */}
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center pt-16 md:pt-24 pb-14 md:pb-20">
          {/* Soft gold glow behind the title */}
          <div
            className="absolute inset-x-0 top-4 h-80 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 40%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          {/* Sparkle ornament */}
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center mb-5"
            aria-hidden="true"
          >
            <Sparkles size={20} strokeWidth={1.2} className="text-gold-600/70" />
          </motion.div>

          {/* Tag flanked by growing gold lines */}
          <div className="relative flex items-center justify-center gap-4 md:gap-6 mb-7 md:mb-9">
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-right"
              aria-hidden="true"
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={getContentStyle('hero.location')}
              className="text-[10px] md:text-xs tracking-[0.45em] md:tracking-[0.6em] uppercase font-bold text-moody-900/60"
            >
              {t('hero.location')}
            </motion.p>
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-left"
              aria-hidden="true"
            />
          </div>

          {/* Title — per-word mask reveal */}
          <h1 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 leading-[1.02] tracking-tight mb-3 flex flex-wrap justify-center gap-x-[0.26em]">
            {titleWords.map((tw, i) => (
              <span key={`${tw.w}-${i}`} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={{ y: '112%' }}
                  whileInView={{ y: '0%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.15, delay: 0.4 + i * 0.13, ease: [0.16, 1, 0.3, 1] }}
                  style={getContentStyle(tw.styleKey)}
                  className={`inline-block ${tw.italic ? 'italic text-gold-600' : ''}`}
                >
                  {tw.w}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Hand-drawn flourish that draws itself in */}
          <motion.svg
            viewBox="0 0 300 22"
            fill="none"
            className="relative w-44 md:w-64 h-auto mx-auto mb-10 md:mb-14 text-gold-600/80"
            aria-hidden="true"
          >
            <motion.path
              d="M6 16 Q 80 2 150 9 T 294 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, delay: 1.15, ease: 'easeInOut' }}
            />
          </motion.svg>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10"
          >
            {/* Primary — filled gold with pulsing ring */}
            <Link
              to="/contact"
              className="group relative w-full sm:w-auto px-12 md:px-16 py-5 overflow-hidden whitespace-nowrap block bg-gold-600 hover:bg-gold-700 transition-colors duration-500 rounded-full text-center shadow-lg shadow-gold-600/25 animate-[ctaPulse_3s_ease-in-out_infinite]"
            >
              <span style={getContentStyle('hero.inquire')} className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold text-white flex items-center justify-center gap-3">
                {t('hero.inquire')}
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
              </span>
            </Link>

            {/* Secondary — understated text link */}
            <Link
              to="/portfolio"
              className="group relative w-full sm:w-auto px-10 py-5 whitespace-nowrap block text-center"
            >
              <span style={getContentStyle('hero.portfolio')} className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase font-medium text-moody-900/70 group-hover:text-moody-900 transition-colors duration-500">
                {t('hero.portfolio')}
              </span>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gold-600/60 group-hover:w-1/2 transition-all duration-700" />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.9 }}
            className="hidden md:flex flex-col items-center gap-4 mt-16"
            aria-hidden="true"
          >
            <span className="text-[9px] tracking-[0.5em] uppercase text-moody-900/35 font-bold">{t('home.scroll')}</span>
            <div className="h-14 w-[1px] bg-gradient-to-b from-gold-600/70 to-transparent animate-[scrollBounce_2s_ease-in-out_infinite]" />
          </motion.div>
        </div>

      </section>

      {/* Process Section — editorial steps with parallax + ghost numbers */}
      <section className="relative bg-gold-100/50 pt-24 md:pt-36 pb-24 md:pb-32 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto space-y-28 md:space-y-44">
          {([
            { num: '01', fallbackIcon: 'sparkles', reversed: false, hasCta: false,
              img: settings['img.home.process.1'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200' },
            { num: '02', fallbackIcon: 'mappin', reversed: true, hasCta: false,
              img: settings['img.home.process.2'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200' },
            { num: '03', fallbackIcon: 'heart', reversed: false, hasCta: true,
              img: settings['img.home.process.3'] || 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200' },
          ] as const).map(step => (
            <ProcessStep
              key={step.num}
              num={step.num}
              img={step.img}
              fallbackIcon={step.fallbackIcon}
              reversed={step.reversed}
              hasCta={step.hasCta}
              t={t}
              getContentStyle={getContentStyle}
            />
          ))}
        </div>
      </section>

      {/* Collections Section — browse by category */}
      <section className="bg-white pt-24 md:pt-32 pb-16 md:pb-24 px-6 sm:px-8 lg:px-16">
        <div className="max-w-[1800px] mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <div className="max-w-5xl mx-auto">
            {/* Tag flanked by growing gold lines */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-6">
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-right"
                aria-hidden="true"
              />
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={getContentStyle('home.collections.tag')}
                className="luxury-text-sm block"
              >
                {t('home.collections.tag')}
              </motion.span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="w-10 md:w-16 h-[1px] bg-gold-600/40 origin-left"
                aria-hidden="true"
              />
            </div>

            {/* Title — letter-by-letter mask reveal */}
            <div className="overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <h2
                style={getContentStyle('home.collections.title')}
                aria-label={collTitle}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 tracking-[0.08em] uppercase leading-[1.1] flex flex-wrap justify-center"
              >
                {collTitle.split('').map((ch, i) => (
                  <motion.span
                    key={`${ch}-${i}`}
                    initial={{ y: '112%' }}
                    whileInView={{ y: '0%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                    aria-hidden="true"
                  >
                    {ch === ' ' ? ' ' : ch}
                  </motion.span>
                ))}
              </h2>
            </div>
          </div>
        </div>

        {/* Category cards — scroll-scrubbed deck spread */}
        <div ref={collRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-16 md:mb-24 max-w-[1500px] mx-auto">
          {COLLECTIONS.map((c, i) => (
            <motion.div
              key={c.cat}
              style={reducedMotion ? undefined : { opacity: collOpacity, ...collFx[i] }}
            >
              <Link
                to={`/portfolio?cat=${c.cat}`}
                className="group relative block aspect-[4/5] md:aspect-[3/4] overflow-hidden shadow-lg shadow-moody-900/5 hover:shadow-2xl hover:shadow-moody-900/20 hover:-translate-y-2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <img
                  src={respImg(covers[c.cat] || c.fallback, [480, 960, 1280]).src}
                  srcSet={respImg(covers[c.cat] || c.fallback, [480, 960, 1280]).srcSet}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  alt={t(c.labelKey)}
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent group-hover:from-black/70 transition-colors duration-700" />
                <div className="absolute inset-x-0 bottom-6 md:bottom-8 flex flex-col items-center gap-1.5">
                  <span
                    style={getContentStyle(c.labelKey)}
                    className="text-white font-serif text-3xl lg:text-4xl uppercase tracking-[0.12em] group-hover:tracking-[0.2em] transition-all duration-700 whitespace-nowrap [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]"
                  >
                    {t(c.labelKey)}
                  </span>
                  {counts[c.cat] > 0 && (
                    <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-white/70 md:text-white/0 md:group-hover:text-white/70 transition-colors duration-700">
                      {counts[c.cat]} {language === 'ENG' ? 'photos' : 'fotografija'}
                    </span>
                  )}
                </div>
                {/* Thin inner frame on hover */}
                <div className="absolute inset-3 border border-white/0 group-hover:border-white/25 transition-colors duration-700 pointer-events-none" aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Explore Portfolio Button */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            <Link 
              to="/portfolio"
              className="group flex items-center gap-3 md:gap-6 py-4"
            >
              <span className="text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em] lg:group-hover:tracking-[0.7em] uppercase font-black text-moody-900 group-hover:text-gold-600 transition-all duration-700 whitespace-nowrap">
                {t('home.explore')}
              </span>
              <div className="relative flex items-center justify-center">
                <div className="w-8 md:w-12 h-[1px] bg-moody-900/20 group-hover:bg-gold-600/40 lg:group-hover:w-20 transition-all duration-700" />
                <ArrowRight size={16} className="text-moody-900 group-hover:text-gold-600 lg:group-hover:translate-x-4 transition-all duration-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        </div>
        </div>
      </section>

      {/* About Us — full-bleed cinematic plate that flows into the dark footer */}
      <section className="relative py-24 md:py-36 px-6 sm:px-8 lg:px-16 bg-moody-950 overflow-hidden">
        <ParallaxY from={-50} to={50} className="absolute inset-0">
          <img
            src={aboutBackdrop.src}
            srcSet={aboutBackdrop.srcSet}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            className="w-full h-[125%] object-cover opacity-[0.28]"
            loading="lazy"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </ParallaxY>
        <div className="absolute inset-0 bg-gradient-to-b from-moody-950/90 via-moody-950/70 to-moody-950" aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 65% at 50% 40%, rgba(166,134,93,0.18) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Decorative script watermark */}
        <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-[16rem] lg:text-[24rem] font-script text-white/[0.04] leading-none select-none pointer-events-none hidden md:block" aria-hidden="true">
          387
        </div>

        <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center relative z-10">
          {/* Layered portrait duo */}
          <div className="lg:col-span-6 relative mb-20 lg:mb-0">
            {/* Thin gold frame behind, offset for depth */}
            <div className="absolute -top-5 -left-5 w-2/3 aspect-[3/4] border border-gold-400/35 pointer-events-none" aria-hidden="true" />

            <ParallaxY from={25} to={-25} className="w-[78%]">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full aspect-[3/4] overflow-hidden shadow-2xl shadow-black/50"
              >
                <img
                  src={respImg(settings['img.home.team.aldin'] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=900', [480, 960]).src}
                  srcSet={respImg(settings['img.home.team.aldin'] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=900', [480, 960]).srcSet}
                  sizes="(min-width: 1024px) 39vw, 78vw"
                  alt="Aldin"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </ParallaxY>

            {/* Overlapping second portrait — faster parallax for depth */}
            <div className="absolute -bottom-12 right-0 w-[46%]">
              <ParallaxY from={60} to={-30}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full aspect-[3/4] overflow-hidden border-[6px] md:border-8 border-moody-950 shadow-xl shadow-black/60"
                >
                  <img
                    src={respImg(settings['img.home.team.melisa'] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=900', [320, 640]).src}
                    srcSet={respImg(settings['img.home.team.melisa'] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=900', [320, 640]).srcSet}
                    sizes="(min-width: 1024px) 23vw, 46vw"
                    alt="Melisa"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </ParallaxY>
            </div>
          </div>

          {/* Text column */}
          <div className="lg:col-span-6 lg:pl-6 text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              style={getContentStyle('about.artists')}
              className="block text-[10px] md:text-[11px] tracking-[0.6em] uppercase font-bold text-gold-400 mb-5"
            >
              {t('about.artists')}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white leading-[1.05] mb-7"
            >
              <span style={getContentStyle('home.about.title')}>{t('home.about.title')}</span>{' '}
              <span style={getContentStyle('home.about.and')} className="italic text-gold-400">{t('home.about.and')}</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-16 h-[1px] bg-gold-400/60 mb-8 mx-auto lg:mx-0 origin-left"
              aria-hidden="true"
            />

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.25 }}
              style={getContentStyle('home.about.desc.1')}
              className="font-serif text-xl md:text-2xl text-white/90 leading-relaxed mb-6"
            >
              {t('home.about.desc.1')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.35 }}
              style={getContentStyle('home.about.desc.2')}
              className="text-base md:text-lg text-white/65 font-light leading-relaxed mb-5"
            >
              {t('home.about.desc.2')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.45 }}
              style={getContentStyle('home.about.desc.3')}
              className="text-base md:text-lg text-white/60 font-light italic leading-relaxed mb-10"
            >
              {t('home.about.desc.3')}
            </motion.p>

            {/* Contact row */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.55 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-[11px] tracking-[0.25em] uppercase font-bold text-white/50 mb-10"
            >
              <a href={`mailto:${settings.email || 'hello@387cinematicweddings.com'}`} className="hover:text-gold-400 transition-colors duration-300">
                {settings.email || 'hello@387cinematicweddings.com'}
              </a>
              {settings.phone && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gold-400/60" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-gold-400 transition-colors duration-300">
                    {settings.phone}
                  </a>
                </>
              )}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.65 }}
              className="flex justify-center lg:justify-start"
            >
              <Link
                to="/about"
                className="group relative px-12 md:px-14 py-5 overflow-hidden whitespace-nowrap inline-block bg-gold-600 hover:bg-gold-500 transition-colors duration-500 rounded-full text-center shadow-xl shadow-gold-600/25"
              >
                <span style={getContentStyle('home.about.cta')} className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold text-white flex items-center gap-3">
                  {t('home.about.cta')}
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
