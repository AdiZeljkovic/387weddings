import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Camera, Sparkles, MessageSquare, Star, ArrowRight, Image as ImageIcon, Globe, Map as MapIcon,
  Heart, Film, Users, Gift, Scissors, Plus,
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
        // No backdrop-blur here: this disc is scroll-scrubbed, and a blurred
        // backdrop has to be re-sampled every frame it moves. A near-opaque
        // fill reads the same over the plate and costs nothing.
        className="relative z-10 mx-auto md:mx-0 mb-8 w-[72px] h-[72px] rounded-full bg-moody-950/92 border border-gold-400/40 shadow-lg shadow-black/40 flex items-center justify-center text-gold-400"
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

// ── FAQ accordion row ────────────────────────────────────────────────────────
const FaqRow = ({ n, open, onToggle, t, getContentStyle }: {
  n: 1 | 2 | 3 | 4; open: boolean; onToggle: () => void; t: T; getContentStyle: CS;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.9, delay: (n - 1) * 0.08, ease: EASE }}
    className="border-b border-white/10"
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
          className={`font-serif text-2xl md:text-4xl leading-none flex-none transition-colors duration-500 ${open ? 'text-gold-400' : 'text-gold-400/30 group-hover:text-gold-400/60'}`}
        >
          {String(n).padStart(2, '0')}
        </span>
        <h4
          style={getContentStyle(`experience.faq.${n}.q`)}
          className={`text-xl md:text-2xl lg:text-[1.7rem] font-serif font-light leading-snug transition-colors duration-500 ${open ? 'text-gold-300' : 'text-white group-hover:text-gold-300'}`}
        >
          {t(`experience.faq.${n}.q`)}
        </h4>
      </div>
      <span
        className={`flex-none mt-1 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500
          ${open ? 'border-gold-500 bg-gold-500 text-white rotate-45' : 'border-white/20 text-white/50 group-hover:border-gold-400/60 group-hover:text-gold-300'}`}
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
            className="pb-9 pr-12 md:pl-[4.5rem] text-white/60 font-light leading-relaxed text-base md:text-lg"
          >
            {t(`experience.faq.${n}.a`)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const Experience = () => {
  const { t, getContentStyle } = useLanguage();
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  const reduced = useReducedMotion();

  // Page-level reading progress for the hairline at the top
  const { scrollYProgress: pageProgress } = useScroll();
  const readProgress = useSpring(pageProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  useEffect(() => {
    loadSettings().then(setImgs).catch(err => console.warn('Services: settings load failed', err));
  }, []);

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
    <div className="bg-moody-950 overflow-hidden">
      {/* The public layout in App.tsx already lays the grain over every page —
          a second full-viewport overlay only doubled the compositing cost. */}

      {/* Reading progress — this page is long; the hairline tracks how far in you are */}
      <motion.div
        style={reduced ? undefined : { scaleX: readProgress }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gold-600 origin-left z-[1001] pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Page opener — editorial title block, no image hero ───────────── */}
      <section className="relative bg-moody-950 pt-16 md:pt-24 pb-16 md:pb-24 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 30%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <SectionTag style={getContentStyle('experience.intro.tag')} className="mb-7">
            {t('experience.intro.tag')}
          </SectionTag>

          <h1
            style={getContentStyle('experience.hero.title')}
            aria-label={t('experience.hero.title')}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white leading-[0.98] tracking-tight uppercase mb-5"
          >
            <WordReveal
              words={t('experience.hero.title').split(' ').filter(Boolean).map(w => ({ w }))}
              delay={0.15}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: EASE }}
            style={getContentStyle('experience.hero.subtitle')}
            className="font-serif italic text-lg md:text-xl text-gold-400 mb-9"
          >
            {t('experience.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
            className="w-16 h-[1px] bg-gold-400/50 mx-auto mb-10"
            aria-hidden="true"
          />

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-white leading-[1.15] mb-7">
            <WordReveal words={introWords} delay={0.5} />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8, ease: EASE }}
            style={getContentStyle('experience.intro.desc')}
            className="text-white/60 font-light text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            {t('experience.intro.desc')}
          </motion.p>
        </div>
      </section>

      {/* ── Benefit & Result — layered editorial diptych ─────────────────── */}
      <section className="relative bg-moody-950 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute -left-12 top-1/3 text-[15rem] lg:text-[22rem] font-script text-white/[0.035] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="relative max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-16 lg:gap-24">
          {/* The Benefit — text above, image below */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -top-14 md:-top-20 -left-2 text-[8rem] md:text-[12rem] font-serif leading-none text-white/[0.05] select-none pointer-events-none"
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
                className="text-[10px] tracking-[0.45em] uppercase text-gold-300 font-bold mb-5"
              >
                {t('experience.benefit.tag')}
              </h4>
              <div className="w-12 h-[1px] bg-gold-400/50 mb-6 mx-auto md:mx-0" aria-hidden="true" />
              <p
                style={getContentStyle('experience.benefit.desc')}
                className="text-white/80 font-serif font-light leading-relaxed text-xl md:text-2xl"
              >
                {t('experience.benefit.desc')}
              </p>
            </motion.div>

            <div className="relative">
              <div className="absolute -top-5 -left-5 w-2/3 aspect-[4/5] border border-gold-400/30 pointer-events-none" aria-hidden="true" />
              <ParallaxY from={26} to={-26}>
                <RevealImage
                  src={benefit.src}
                  srcSet={benefit.srcSet}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  alt={t('experience.benefit.tag')}
                  className="aspect-[4/5] shadow-2xl shadow-black/50"
                />
              </ParallaxY>
            </div>
          </div>

          {/* The Result — image above, text below, dropped for rhythm */}
          <div className="relative md:mt-36">
            <span
              aria-hidden="true"
              className="absolute -top-14 md:-top-20 -right-2 text-[8rem] md:text-[12rem] font-serif leading-none text-white/[0.05] select-none pointer-events-none"
            >
              02
            </span>

            <div className="relative mb-10">
              <div className="absolute -bottom-5 -right-5 w-2/3 aspect-[4/5] border border-gold-400/30 pointer-events-none" aria-hidden="true" />
              <ParallaxY from={52} to={-24}>
                <RevealImage
                  src={result.src}
                  srcSet={result.srcSet}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  alt={t('experience.result.tag')}
                  className="aspect-[4/5] shadow-2xl shadow-black/50"
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
                className="text-[10px] tracking-[0.45em] uppercase text-gold-300 font-bold mb-5"
              >
                {t('experience.result.tag')}
              </h4>
              <div className="w-12 h-[1px] bg-gold-600/50 mb-6 mx-auto md:mx-0" aria-hidden="true" />
              <p
                style={getContentStyle('experience.result.desc')}
                className="text-white/80 font-serif font-light leading-relaxed text-xl md:text-2xl"
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

      {/* ── Social proof — right where the pricing decision is made.
             Renders only once the client adds reviews in Admin → Recenzije. ── */}
      <Testimonials className="bg-moody-950" />

      {/* ── FAQ — accordion ──────────────────────────────────────────────── */}
      <section className="relative bg-moody-950 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white leading-tight tracking-tight">
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
