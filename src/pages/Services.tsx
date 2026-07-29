import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Camera, Sparkles, MessageSquare, Star, ArrowRight, Image as ImageIcon, Globe, Map as MapIcon,
  Heart, Film, Users, Clock, Download, Cloud, BookOpen, Gift, Gem, Scissors, Package as PackageIcon,
  Palette, Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, RevealImage, SectionTag, WordReveal } from '../components/anim';
import Testimonials from '../components/Testimonials';

// ── Icon registry (CMS picks one by name) ────────────────────────────────────
const ICONS: Record<string, LucideIcon> = {
  chat: MessageSquare,
  star: Star,
  camera: Camera,
  image: ImageIcon,
  heart: Heart,
  film: Film,
  users: Users,
  sparkles: Sparkles,
  globe: Globe,
  map: MapIcon,
  scissors: Scissors,
  gift: Gift,
};
const iconFor = (name: string): LucideIcon => ICONS[name] ?? Camera;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const toRoman = (n: number) => ROMAN[n - 1] ?? String(n);

// Heuristic feature icon — matches on keywords in either language
const getFeatureIcon = (text: string): React.ReactElement => {
  const s = text.toLowerCase();
  if (s.includes('hour') || s.includes('coverage') || s.includes('sat'))
    return <Clock size={12} strokeWidth={1.5} />;
  if (s.includes('export') || s.includes('resolution') || s.includes('jpeg') || s.includes('dpi'))
    return <Download size={12} strokeWidth={1.5} />;
  if (s.includes('retouch') || s.includes('color grad') || s.includes('post-prod') || s.includes('processing') || s.includes('production'))
    return <Palette size={12} strokeWidth={1.5} />;
  if (s.includes('gallery') || s.includes('cloud'))
    return <Cloud size={12} strokeWidth={1.5} />;
  if (s.includes('deliver') || s.includes('sneak'))
    return <PackageIcon size={12} strokeWidth={1.5} />;
  if (s.includes('album') || s.includes('book') || s.includes('photobook'))
    return <BookOpen size={12} strokeWidth={1.5} />;
  if (s.includes('usb') || s.includes('wooden') || s.includes('box') || s.includes('engraving'))
    return <Gift size={12} strokeWidth={1.5} />;
  if (s.includes('film') || s.includes('video') || s.includes('cinematic') || s.includes('highlight'))
    return <Film size={12} strokeWidth={1.5} />;
  if (s.includes('black') || s.includes('b&w') || s.includes('timeless') || s.includes('artistic'))
    return <Heart size={12} strokeWidth={1.5} />;
  if (s.includes('pre-wed') || s.includes('engag') || s.includes('complim') || s.includes('session'))
    return <Star size={12} strokeWidth={1.5} />;
  if (s.includes('photo') || s.includes('foto') || s.includes('selected') || s.includes('unlimited'))
    return <Camera size={12} strokeWidth={1.5} />;
  return <Gem size={12} strokeWidth={1.5} />;
};

interface Pkg {
  id: number;
  name: string;
  name_en: string | null;
  name_bs: string | null;
  price: string;
  description: string | null;
  description_en: string | null;
  description_bs: string | null;
  features: string[];
  features_en: string[];
  features_bs: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  name_color: string | null;
  name_font_size: string | null;
  features_font_size: string | null;
}

type T = (key: string) => string;
type CS = (key: string) => React.CSSProperties;

// ── Journey step — scroll-scrubbed, cascading left→right ─────────────────────
// Every column shares the same scroll window, so the stagger comes from
// shifting each column's transform range by its index.
const JourneyStep = ({ n, index, t, getContentStyle }: {
  n: 1 | 2 | 3 | 4; index: number; t: T; getContentStyle: CS;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.4'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.6 });

  const s = index * 0.11; // cascade offset
  const y = useTransform(p, [s, s + 0.65], [72, 0]);
  const o = useTransform(p, [s, s + 0.55], [0, 1]);
  const dot = useTransform(p, [s, s + 0.5], [0, 1]);

  const st = (styles: Record<string, unknown>) => (reduced ? undefined : styles);
  const Icon = iconFor(t(`experience.journey.step.${n}.icon`));

  return (
    <div ref={ref} className="relative">
      {/* Node on the rail — a single clean disc, no badge */}
      <motion.div
        style={st({ scale: dot, opacity: o })}
        className="relative z-10 mx-auto md:mx-0 mb-8 w-[72px] h-[72px] rounded-full bg-moody-950/70 backdrop-blur-sm border border-gold-400/40 shadow-lg shadow-black/40 flex items-center justify-center text-gold-400"
      >
        <Icon size={26} strokeWidth={1.1} aria-hidden="true" />
      </motion.div>

      <motion.div style={st({ y, opacity: o })} className="relative z-10 text-center md:text-left">
        <h3
          style={getContentStyle(`experience.journey.step.${n}.title`)}
          className="text-2xl md:text-[1.65rem] font-serif font-light text-white leading-snug mb-5"
        >
          {t(`experience.journey.step.${n}.title`)}
        </h3>
        <div className="w-12 h-[1px] bg-gold-400/60 mb-5 mx-auto md:mx-0" aria-hidden="true" />
        <p
          style={getContentStyle(`experience.journey.step.${n}.desc`)}
          className="text-white/65 text-[15px] font-light leading-relaxed"
        >
          {t(`experience.journey.step.${n}.desc`)}
        </p>
      </motion.div>
    </div>
  );
};

// ── Package card — scroll-scrubbed rise, featured gets the dark treatment ─────
const PackageCard = ({ pkg, index, language, t, getContentStyle, tOr }: {
  pkg: Pkg; index: number; language: string; t: T; getContentStyle: CS;
  tOr: (key: string, fallback: string) => string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 1', 'start 0.55'] });
  const p = useSpring(scrollYProgress, { stiffness: 95, damping: 24, mass: 0.6 });

  const s = Math.min(index, 4) * 0.07;
  const y = useTransform(p, [s, s + 0.8], [96, 0]);
  const o = useTransform(p, [s, s + 0.55], [0, 1]);
  const rot = useTransform(p, [s, s + 0.8], [index % 2 === 0 ? -3.5 : 3.5, 0]);

  const dark = pkg.is_featured;

  // Spotlight — a soft gold light follows the pointer across the card
  const onSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const name = language === 'ENG'
    ? (pkg.name_en || pkg.name_bs || pkg.name)
    : (pkg.name_bs || pkg.name);
  const description = language === 'ENG'
    ? (pkg.description_en || pkg.description_bs || pkg.description)
    : (pkg.description_bs || pkg.description);
  const featureList = language === 'ENG'
    ? (pkg.features_en?.length ? pkg.features_en : (pkg.features_bs?.length ? pkg.features_bs : pkg.features))
    : (pkg.features_bs?.length ? pkg.features_bs : pkg.features);

  return (
    <motion.div
      ref={ref}
      style={reduced ? undefined : { y, opacity: o, rotate: rot }}
      className={`w-full sm:w-[340px] lg:w-[360px] xl:w-[390px] flex-shrink-0 ${dark ? 'lg:-mt-10 lg:mb-10' : ''}`}
    >
      {/* Hover lift lives on a plain wrapper so it never fights the scrub transform */}
      <div
        onMouseMove={onSpotlightMove}
        className="group relative h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3"
      >
        {/* Most popular badge, straddling the top border */}
        {dark && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
            <span
              style={getContentStyle('experience.package.popular')}
              className="whitespace-nowrap text-[8px] tracking-[0.45em] uppercase font-bold bg-gold-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-gold-600/40"
            >
              {t('experience.package.popular')}
            </span>
          </div>
        )}

        <div
          className={`relative h-full min-h-[560px] flex flex-col overflow-hidden border transition-shadow duration-700
            ${dark
              ? 'bg-moody-950 border-gold-600/30 shadow-[0_24px_70px_rgba(0,0,0,0.35)] hover:shadow-[0_34px_90px_rgba(0,0,0,0.5)]'
              : 'bg-white border-moody-900/12 shadow-[0_10px_40px_rgba(26,26,26,0.04)] hover:shadow-[0_24px_70px_rgba(26,26,26,0.10)]'
            }`}
        >
          {/* Gold accent bar crowning the card */}
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-[3px] ${
              dark
                ? 'bg-gradient-to-r from-transparent via-gold-500 to-transparent'
                : 'bg-gradient-to-r from-transparent via-gold-600/35 to-transparent'
            }`}
          />

          {/* Ghost roman numeral watermark — kept inside the card bounds */}
          <span
            aria-hidden="true"
            className={`absolute top-4 right-5 text-[7rem] font-serif leading-none select-none pointer-events-none
              ${dark ? 'text-white/[0.05]' : 'text-moody-900/[0.045]'}`}
          >
            {toRoman(index + 1)}
          </span>

          {/* Soft gold sheen on the featured card */}
          {dark && (
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{ background: 'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(166,134,93,0.16) 0%, transparent 70%)' }}
            />
          )}

          {/* Pointer-tracking spotlight */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(340px circle at var(--mx, 50%) var(--my, 0%), ${
                dark ? 'rgba(166,134,93,0.20)' : 'rgba(166,134,93,0.13)'
              } 0%, transparent 70%)`,
            }}
          />

          <div className={`relative z-10 flex flex-col flex-1 px-9 md:px-10 pb-11 ${dark ? 'pt-14' : 'pt-12'}`}>
            {/* Collection tag */}
            <p
              style={getContentStyle('experience.package.collection')}
              className={`text-[9px] tracking-[0.5em] uppercase font-bold mb-5 ${dark ? 'text-gold-400/70' : 'text-gold-600/65'}`}
            >
              {t('experience.package.collection')} {toRoman(index + 1)}
            </p>

            {/* Name — per-package colour / size from the DB */}
            <h3
              className={`text-3xl md:text-[2.1rem] font-serif font-light leading-tight mb-4 ${dark ? 'text-white' : 'text-moody-900'}`}
              style={{
                ...(pkg.name_color     ? { color: pkg.name_color }         : {}),
                ...(pkg.name_font_size ? { fontSize: pkg.name_font_size }  : {}),
              }}
            >
              {name}
            </h3>

            <div className={`w-12 h-[1px] mb-6 ${dark ? 'bg-gold-400/50' : 'bg-gold-600/50'}`} aria-hidden="true" />

            {/* Description */}
            <p className={`text-[13px] font-light italic leading-relaxed mb-10 ${dark ? 'text-white/50' : 'text-moody-900/55'}`}>
              {description}
            </p>

            {/* Price block — the reason people are on this page */}
            <div
              className={`-mx-9 md:-mx-10 px-9 md:px-10 py-8 mb-9 border-y ${
                dark ? 'bg-white/[0.03] border-white/10' : 'bg-gold-50/80 border-gold-600/15'
              }`}
            >
              <p
                style={getContentStyle('experience.package.starting_at')}
                className={`text-[9px] tracking-[0.4em] uppercase font-bold mb-3 ${dark ? 'text-gold-400/70' : 'text-gold-600/70'}`}
              >
                {tOr('experience.package.starting_at', 'Starting at')}
              </p>
              <div className="flex items-baseline gap-2.5">
                <span
                  className={`font-serif font-light leading-none tracking-tight
                    ${pkg.price.length > 6 ? 'text-4xl md:text-5xl' : 'text-6xl md:text-7xl'}
                    ${dark ? 'text-gold-400' : 'text-moody-900'}`}
                >
                  {pkg.price}
                </span>
                <span className={`text-sm tracking-[0.25em] uppercase font-bold ${dark ? 'text-gold-400/60' : 'text-gold-600/70'}`}>
                  KM
                </span>
              </div>
            </div>

            {/* Features — only rendered when the package actually has any */}
            {featureList.length > 0 && (
              <ul className="flex-1 space-y-4 mb-11">
                {featureList.map((feature, fi) => (
                  <li
                    key={fi}
                    className={`flex items-start gap-3 font-light leading-relaxed ${dark ? 'text-white/70' : 'text-moody-900/70'}`}
                    style={{ fontSize: pkg.features_font_size || '0.8125rem' }}
                  >
                    <span className={`mt-[3px] flex-none ${dark ? 'text-gold-400/80' : 'text-gold-600/70'}`}>
                      {getFeatureIcon(feature)}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* Push the CTA to the bottom when there is no feature list */}
            {featureList.length === 0 && <div className="flex-1" aria-hidden="true" />}

            {/* CTA */}
            <Link
              to="/contact"
              className={`group/cta relative block w-full py-5 overflow-hidden text-center rounded-full transition-colors duration-500
                ${dark
                  ? 'bg-gold-600 hover:bg-gold-500 shadow-lg shadow-gold-600/25'
                  : 'border border-moody-900/20 hover:border-gold-600'
                }`}
            >
              {!dark && (
                <span className="absolute inset-0 bg-gold-600 translate-y-full group-hover/cta:translate-y-0 transition-transform duration-700" aria-hidden="true" />
              )}
              <span
                style={getContentStyle('experience.package.inquire')}
                className={`relative z-10 text-[10px] tracking-[0.5em] uppercase font-bold transition-colors duration-500 flex items-center justify-center gap-2.5
                  ${dark ? 'text-white' : 'text-moody-900/60 group-hover/cta:text-white'}`}
              >
                {t('experience.package.inquire')}
                <ArrowRight size={13} className="group-hover/cta:translate-x-1 transition-transform duration-500" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── FAQ accordion row ────────────────────────────────────────────────────────
const FaqRow = ({ n, open, onToggle, t, getContentStyle }: {
  n: 1 | 2 | 3 | 4; open: boolean; onToggle: () => void; t: T; getContentStyle: CS;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.9, delay: (n - 1) * 0.08, ease: EASE }}
    className="border-b border-moody-900/10"
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group w-full flex items-start justify-between gap-6 py-8 md:py-10 text-left"
    >
      <div className="flex items-start gap-5 md:gap-8">
        <span
          aria-hidden="true"
          className={`font-serif text-2xl md:text-4xl leading-none flex-none transition-colors duration-500 ${open ? 'text-gold-600' : 'text-gold-600/30 group-hover:text-gold-600/60'}`}
        >
          {String(n).padStart(2, '0')}
        </span>
        <h4
          style={getContentStyle(`experience.faq.${n}.q`)}
          className={`text-xl md:text-2xl lg:text-[1.7rem] font-serif font-light leading-snug transition-colors duration-500 ${open ? 'text-gold-600' : 'text-moody-900 group-hover:text-gold-600'}`}
        >
          {t(`experience.faq.${n}.q`)}
        </h4>
      </div>
      <span
        className={`flex-none mt-1 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500
          ${open ? 'border-gold-600 bg-gold-600 text-white rotate-45' : 'border-moody-900/20 text-moody-900/50 group-hover:border-gold-600/50 group-hover:text-gold-600'}`}
        aria-hidden="true"
      >
        <Plus size={14} strokeWidth={1.5} />
      </span>
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="overflow-hidden"
        >
          <p
            style={getContentStyle(`experience.faq.${n}.a`)}
            className="pb-9 pr-12 md:pl-[4.5rem] text-moody-900/60 font-light leading-relaxed text-base md:text-lg"
          >
            {t(`experience.faq.${n}.a`)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const Experience = () => {
  const { t, getContentStyle, language } = useLanguage();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  const reduced = useReducedMotion();

  // Page-level reading progress for the hairline at the top
  const { scrollYProgress: pageProgress } = useScroll();
  const readProgress = useSpring(pageProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const packagesRef = useRef<HTMLElement>(null);
  const scrollToPackages = () =>
    packagesRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });

  // t() echoes the key back when a CMS entry is missing, so `t(k) || fallback`
  // can never fire. Compare against the key name instead.
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  useEffect(() => {
    loadSettings().then(setImgs).catch(err => console.warn('Services: settings load failed', err));
    fetch('/api/packages')
      .then(r => r.json())
      .then(data => {
        const parseF = (raw: any): string[] => Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
        if (Array.isArray(data)) {
          setPackages(data.map((p: any) => ({
            ...p,
            features:    parseF(p.features),
            features_bs: parseF(p.features_bs),
            features_en: parseF(p.features_en),
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Hero scrub — image drifts + zooms as the hero leaves the viewport ──────
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY     = useTransform(heroProgress, [0, 1], ['0%', '16%']);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.14]);
  const heroFade  = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // ── Journey rail — gold line draws itself as the section is scrolled ───────
  const railRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: railProgress } = useScroll({ target: railRef, offset: ['start 0.9', 'start 0.3'] });
  const railP = useSpring(railProgress, { stiffness: 80, damping: 24, mass: 0.6 });

  const st = (styles: Record<string, unknown>) => (reduced ? undefined : styles);

  const heroSrc = imgs['img.services.hero'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1600';
  const benefitSrc = imgs['img.services.pkg.1'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200';
  const resultSrc = imgs['img.services.pkg.2'] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200';
  // Backdrop for the Journey plate — reuses the slot the removed section freed up
  const journeySrc = imgs['img.services.cta'] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600';

  const hero = respImg(heroSrc, [768, 1280, 1920]);
  const benefit = respImg(benefitSrc, [480, 960, 1280]);
  const result = respImg(resultSrc, [480, 960, 1280]);
  const journey = respImg(journeySrc, [768, 1280, 1920]);

  // Big headings split into words for the shared mask reveal
  const heroWords = t('experience.hero.title').split(' ').filter(Boolean)
    .map(w => ({ w, style: getContentStyle('experience.hero.title') }));

  const introWords = [
    ...t('experience.intro.title.part1').split(' ').filter(Boolean)
      .map(w => ({ w, style: getContentStyle('experience.intro.title.part1') })),
    ...t('experience.intro.title.part2').split(' ').filter(Boolean)
      .map(w => ({ w, style: getContentStyle('experience.intro.title.part2'), italic: true })),
  ];

  const investmentWords = t('experience.investment.title').split(' ').filter(Boolean)
    .map(w => ({ w, style: getContentStyle('experience.investment.title') }));

  const ctaWords = [
    ...t('experience.cta.title.part1').split(' ').filter(Boolean)
      .map(w => ({ w, style: getContentStyle('experience.cta.title.part1') })),
    ...t('experience.cta.title.part2').split(' ').filter(Boolean)
      .map(w => ({ w, style: getContentStyle('experience.cta.title.part2'), italic: true })),
  ];


  return (
    <div className="bg-gold-50 overflow-hidden">
      <div className="grain" aria-hidden="true" />

      {/* Reading progress — this page is long; the hairline tracks how far in you are */}
      <motion.div
        style={reduced ? undefined : { scaleX: readProgress }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gold-600 origin-left z-[1001] pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Hero — cinematic dark plate, scrubbed drift ──────────────────── */}
      <section ref={heroRef} className="relative h-[82vh] min-h-[520px] flex items-center justify-center overflow-hidden bg-moody-950">
        <motion.div style={st({ y: heroY, scale: heroScale })} className="absolute inset-0 z-0 will-change-transform">
          <motion.img
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
            src={hero.src}
            srcSet={hero.srcSet}
            sizes="100vw"
            alt={t('experience.hero.title')}
            className="w-full h-full object-cover grayscale brightness-75"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-moody-950" aria-hidden="true" />
        </motion.div>

        <motion.div style={st({ opacity: heroFade })} className="relative z-10 text-center px-6 w-full max-w-5xl">
          {/* Ornament */}
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
            className="flex justify-center mb-7"
            aria-hidden="true"
          >
            <Sparkles size={20} strokeWidth={1.2} className="text-gold-400/80" />
          </motion.div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white leading-[0.95] tracking-tight uppercase mb-8">
            <WordReveal words={heroWords} delay={0.45} />
          </h1>

          {/* Subtitle flanked by growing hairlines */}
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.9, ease: EASE }}
              className="w-10 md:w-20 h-[1px] bg-gold-400/50 origin-right"
              aria-hidden="true"
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.85, ease: EASE }}
              style={getContentStyle('experience.hero.subtitle')}
              className="text-white/60 text-[9px] md:text-[11px] tracking-[0.45em] md:tracking-[0.55em] uppercase font-bold"
            >
              {t('experience.hero.subtitle')}
            </motion.p>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.9, ease: EASE }}
              className="w-10 md:w-20 h-[1px] bg-gold-400/50 origin-left"
              aria-hidden="true"
            />
          </div>

          {/* Jump straight to pricing — most visitors land here for exactly that */}
          <motion.button
            type="button"
            onClick={scrollToPackages}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.15, ease: EASE }}
            className="group mt-12 inline-flex items-center gap-4 px-10 py-4 border border-gold-400/40 hover:border-gold-400 rounded-full transition-colors duration-500"
          >
            <span
              style={getContentStyle('experience.investment.tag')}
              className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-medium text-gold-300 group-hover:text-white transition-colors duration-500"
            >
              {t('experience.investment.tag')}
            </span>
            <ArrowRight
              size={14}
              className="text-gold-400 rotate-90 group-hover:translate-y-1 transition-transform duration-500"
              aria-hidden="true"
            />
          </motion.button>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          style={st({ opacity: heroFade })}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
          aria-hidden="true"
        >
          <div className="h-14 w-[1px] bg-gradient-to-b from-gold-400/70 to-transparent animate-[scrollBounce_2s_ease-in-out_infinite]" />
        </motion.div>
      </section>

      {/* ── Intro statement — white ──────────────────────────────────────── */}
      <section className="relative bg-white pt-20 md:pt-32 pb-20 md:pb-28 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute inset-x-0 top-10 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <SectionTag style={getContentStyle('experience.intro.tag')} className="mb-8 md:mb-10">
            {t('experience.intro.tag')}
          </SectionTag>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light text-moody-900 leading-[1.05] tracking-tight mb-8">
            <WordReveal words={introWords} delay={0.25} />
          </h2>

          {/* Hand-drawn flourish */}
          <motion.svg
            viewBox="0 0 300 22"
            fill="none"
            className="w-40 md:w-56 h-auto mx-auto mb-10 md:mb-12 text-gold-600/70"
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
              transition={{ duration: 1.3, delay: 0.6, ease: 'easeInOut' }}
            />
          </motion.svg>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
            style={getContentStyle('experience.intro.desc')}
            className="font-serif italic text-lg md:text-2xl text-moody-900/75 leading-relaxed max-w-3xl mx-auto"
          >
            {t('experience.intro.desc')}
          </motion.p>
        </div>
      </section>

      {/* ── Benefit & Result — layered editorial diptych ─────────────────── */}
      <section className="relative bg-gold-100/40 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute -left-12 top-1/3 text-[15rem] lg:text-[22rem] font-script text-gold-600/[0.05] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="relative max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-16 lg:gap-24">
          {/* The Benefit — text above, image below */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -top-14 md:-top-20 -left-2 text-[8rem] md:text-[12rem] font-serif leading-none text-gold-600/[0.09] select-none pointer-events-none"
            >
              01
            </span>

            <motion.div
              initial={{ opacity: 0, x: -34 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE }}
              className="relative z-10 mb-10 text-center md:text-left"
            >
              <h4
                style={getContentStyle('experience.benefit.tag')}
                className="text-[10px] tracking-[0.45em] uppercase text-gold-600 font-bold mb-5"
              >
                {t('experience.benefit.tag')}
              </h4>
              <div className="w-12 h-[1px] bg-gold-600/50 mb-6 mx-auto md:mx-0" aria-hidden="true" />
              <p
                style={getContentStyle('experience.benefit.desc')}
                className="text-moody-900/80 font-serif font-light leading-relaxed text-xl md:text-2xl"
              >
                {t('experience.benefit.desc')}
              </p>
            </motion.div>

            <div className="relative">
              <div className="absolute -top-5 -left-5 w-2/3 aspect-[4/5] border border-gold-600/30 pointer-events-none" aria-hidden="true" />
              <ParallaxY from={26} to={-26}>
                <RevealImage
                  src={benefit.src}
                  srcSet={benefit.srcSet}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  alt={t('experience.benefit.tag')}
                  className="aspect-[4/5] shadow-2xl shadow-moody-900/15"
                />
              </ParallaxY>
            </div>
          </div>

          {/* The Result — image above, text below, dropped for rhythm */}
          <div className="relative md:mt-36">
            <span
              aria-hidden="true"
              className="absolute -top-14 md:-top-20 -right-2 text-[8rem] md:text-[12rem] font-serif leading-none text-gold-600/[0.09] select-none pointer-events-none"
            >
              02
            </span>

            <div className="relative mb-10">
              <div className="absolute -bottom-5 -right-5 w-2/3 aspect-[4/5] border border-gold-600/30 pointer-events-none" aria-hidden="true" />
              <ParallaxY from={52} to={-24}>
                <RevealImage
                  src={result.src}
                  srcSet={result.srcSet}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  alt={t('experience.result.tag')}
                  className="aspect-[4/5] shadow-2xl shadow-moody-900/15"
                />
              </ParallaxY>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 34 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
              className="relative z-10 text-center md:text-left"
            >
              <h4
                style={getContentStyle('experience.result.tag')}
                className="text-[10px] tracking-[0.45em] uppercase text-gold-600 font-bold mb-5"
              >
                {t('experience.result.tag')}
              </h4>
              <div className="w-12 h-[1px] bg-gold-600/50 mb-6 mx-auto md:mx-0" aria-hidden="true" />
              <p
                style={getContentStyle('experience.result.desc')}
                className="text-moody-900/80 font-serif font-light leading-relaxed text-xl md:text-2xl"
              >
                {t('experience.result.desc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Journey — full-bleed cinematic plate with the four steps ──────── */}
      <section className="relative py-28 md:py-40 px-6 sm:px-8 lg:px-16 overflow-hidden bg-moody-950">
        <ParallaxY from={-50} to={50} className="absolute inset-0">
          <img
            src={journey.src}
            srcSet={journey.srcSet}
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
        <div className="absolute inset-0 bg-gradient-to-b from-moody-950/90 via-moody-950/65 to-moody-950" aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 65% at 50% 40%, rgba(166,134,93,0.20) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1500px] mx-auto">
          <div className="text-center mb-24 md:mb-32">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              style={getContentStyle('experience.journey.tag')}
              className="block text-[10px] md:text-[11px] tracking-[0.6em] uppercase font-bold text-gold-400 mb-7 md:mb-9"
            >
              {t('experience.journey.tag')}
            </motion.span>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white leading-[1.05] tracking-tight">
              <WordReveal
                words={t('experience.journey.title').split(' ').filter(Boolean)
                  .map(w => ({ w, style: getContentStyle('experience.journey.title') }))}
                delay={0.25}
              />
            </h2>
          </div>

          <div ref={railRef} className="relative">
            {/* Gold rail that draws itself across the four steps */}
            <motion.div
              style={st({ scaleX: railP })}
              className="hidden md:block absolute top-9 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent origin-left"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 sm:gap-14 lg:gap-12">
              {([1, 2, 3, 4] as const).map((n, i) => (
                <JourneyStep key={n} n={n} index={i} t={t} getContentStyle={getContentStyle} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages — the investment ────────────────────────────────────── */}
      <section ref={packagesRef} className="relative bg-gold-50 py-24 md:py-36 overflow-hidden scroll-mt-24">
        <div
          className="absolute -right-16 top-24 text-[14rem] lg:text-[20rem] font-script text-gold-600/[0.05] leading-none select-none pointer-events-none hidden lg:block"
          aria-hidden="true"
        >
          387
        </div>

        {/* Section header */}
        <div className="relative px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto mb-20 md:mb-28 text-center">
          <SectionTag style={getContentStyle('experience.investment.tag')} className="mb-7 md:mb-9">
            {t('experience.investment.tag')}
          </SectionTag>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light text-moody-900 leading-[1.05] tracking-tight mb-9">
            <WordReveal words={investmentWords} delay={0.25} />
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
            className="flex justify-center"
          >
            <span
              style={getContentStyle('experience.investment.availability')}
              className="inline-flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.35em] text-gold-700 uppercase font-bold bg-white/70 px-6 py-2.5 border border-gold-600/20 rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" aria-hidden="true" />
              {t('experience.investment.availability')}
            </span>
          </motion.div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-wrap justify-center gap-5 px-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full sm:w-[340px] lg:w-[360px] border border-moody-900/8 bg-white p-9 animate-pulse space-y-6">
                <div className="h-2 w-16 bg-moody-200 rounded" />
                <div className="h-5 w-2/3 bg-moody-200 rounded" />
                <div className="h-3 w-full bg-moody-100 rounded" />
                <div className="h-10 w-24 bg-moody-200 rounded mt-4" />
                <div className="pt-6 space-y-3">
                  {[1, 2, 3, 4, 5].map(j => <div key={j} className="h-2 bg-moody-100 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards — centered flex, any count */}
        {!loading && packages.length > 0 && (
          <div className="relative flex flex-wrap justify-center items-stretch gap-6 lg:gap-6 px-4 sm:px-8 lg:px-12">
            {packages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                language={language}
                t={t}
                getContentStyle={getContentStyle}
                tOr={tOr}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Social proof — right where the pricing decision is made.
             Renders only once the client adds reviews in Admin → Recenzije. ── */}
      <Testimonials className="bg-white" />

      {/* ── FAQ — accordion ──────────────────────────────────────────────── */}
      <section className="relative bg-gold-100/40 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-moody-900 leading-tight tracking-tight">
              <WordReveal
                words={t('experience.faq.title').split(' ').filter(Boolean)
                  .map(w => ({ w, style: getContentStyle('experience.faq.title') }))}
                delay={0.2}
              />
            </h3>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: EASE }}
              className="w-16 h-[1px] bg-gold-600/50 mx-auto mt-8"
              aria-hidden="true"
            />
          </div>

          <div className="border-t border-moody-900/10">
            {([1, 2, 3, 4] as const).map(n => (
              <FaqRow
                key={n}
                n={n}
                open={openFaq === n}
                onToggle={() => setOpenFaq(prev => (prev === n ? null : n))}
                t={t}
                getContentStyle={getContentStyle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — full-bleed cinematic closer ──────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 sm:px-8 py-28 md:py-40 text-center overflow-hidden bg-moody-950">
        <ParallaxY from={-50} to={50} className="absolute inset-0">
          {/* Bookends the page with the hero frame — already cached, costs nothing */}
          <img
            src={hero.src}
            srcSet={hero.srcSet}
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
            <WordReveal words={ctaWords} delay={0.25} />
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

export default Experience;
