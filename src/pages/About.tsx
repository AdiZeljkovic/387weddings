import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Camera, Film, MessageSquare, Star, Image as ImageIcon, Heart, Users, Sparkles, ArrowRight } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, RevealImage, SectionTag, WordReveal } from '../components/anim';

const ICON_MAP: Record<string, React.ReactElement> = {
  chat:   <MessageSquare size={26} strokeWidth={1} />,
  star:   <Star          size={26} strokeWidth={1} />,
  camera: <Camera        size={26} strokeWidth={1} />,
  image:  <ImageIcon     size={26} strokeWidth={1} />,
  heart:  <Heart         size={26} strokeWidth={1} />,
  film:   <Film          size={26} strokeWidth={1} />,
  users:  <Users         size={26} strokeWidth={1} />,
};

const FALLBACK_HERO  = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600';
const FALLBACK_STORY = 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=1200';

// ── Scroll-scrubbed experience step ──────────────────────────────────────────
// Each step is driven by scroll position (scrub, not trigger): the block slides
// in from its own side of the gold spine, the node dot pops on the line, and the
// ghost number drifts in behind. Scrolling back rewinds the choreography.
const ExperienceStep = ({ n, index, t, getContentStyle }: {
  n: 1 | 2 | 3 | 4;
  index: number;
  t: (key: string) => string;
  getContentStyle: (key: string) => React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.4'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.6 });

  const left = index % 2 === 0;   // even steps sit left of the spine
  const dir  = left ? -1 : 1;

  const x     = useTransform(p, [0, 1], [dir * 100, 0]);
  const o     = useTransform(p, [0, 0.65], [0, 1]);
  const numX  = useTransform(p, [0, 1], [dir * 70, 0]);
  const numO  = useTransform(p, [0, 1], [0, 1]);
  const dot   = useTransform(p, [0.25, 1], [0, 1]);
  const ruleX = useTransform(p, [0.2, 1], [0, 1]);

  // Respect prefers-reduced-motion — render the scene static
  const st = (styles: Record<string, unknown>) => (reduced ? undefined : styles);

  const icon = ICON_MAP[t(`about.step.${n}.icon`)] ?? ICON_MAP['camera'];

  return (
    <div ref={ref} className="relative md:grid md:grid-cols-[1fr_3rem_1fr] md:items-center md:gap-4 lg:gap-10">
      {/* Node on the spine */}
      <div className="hidden md:flex md:col-start-2 md:row-start-1 justify-center" aria-hidden="true">
        <motion.span
          style={st({ scale: dot })}
          className="w-3 h-3 rounded-full bg-gold-400 ring-8 ring-gold-400/10 shadow-lg shadow-gold-600/30"
        />
      </div>

      {/* Content block — slides in from its own side */}
      <motion.div
        style={st({ x, opacity: o })}
        className={`relative border-l border-gold-400/25 pl-6 md:border-l-0 md:pl-0 md:row-start-1 ${
          left ? 'md:col-start-1 md:text-right md:pr-6 lg:pr-10' : 'md:col-start-3 md:text-left md:pl-6 lg:pl-10'
        }`}
      >
        {/* Ghost number drifting in behind */}
        <motion.span
          style={st({ x: numX, opacity: numO })}
          aria-hidden="true"
          className={`absolute -top-10 md:-top-16 ${left ? 'right-0' : 'right-0 md:left-0'} text-[5.5rem] md:text-[9rem] lg:text-[11rem] font-serif leading-none text-white/[0.05] select-none pointer-events-none`}
        >
          {t(`about.step.${n}.num`)}
        </motion.span>

        <div className={`relative flex items-center gap-4 mb-6 ${left ? 'md:justify-end' : ''}`}>
          <span
            style={getContentStyle(`about.step.${n}.num`)}
            className="text-3xl md:text-4xl font-serif font-light text-gold-400/60 leading-none"
          >
            {t(`about.step.${n}.num`)}
          </span>
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-400/40 bg-moody-950/92 text-gold-400 shadow-lg shadow-black/40">
            {icon}
          </span>
        </div>

        <h3
          style={getContentStyle(`about.step.${n}.title`)}
          className="relative text-2xl md:text-3xl lg:text-4xl font-serif font-light text-white leading-tight mb-5"
        >
          {t(`about.step.${n}.title`)}
        </h3>

        <motion.div
          style={st({ scaleX: ruleX })}
          aria-hidden="true"
          className={`w-12 h-[1px] bg-gold-400/50 mb-6 ${left ? 'md:ml-auto md:origin-right' : 'origin-left'}`}
        />

        <p
          style={getContentStyle(`about.step.${n}.desc`)}
          className={`relative text-white/65 font-light leading-relaxed text-[15px] md:text-base max-w-md ${left ? 'md:ml-auto' : ''}`}
        >
          {t(`about.step.${n}.desc`)}
        </p>
      </motion.div>
    </div>
  );
};

const About = () => {
  const { t, getContentStyle } = useLanguage();
  const reduced = useReducedMotion();
  const [imgs, setImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings().then(setImgs).catch(err => console.warn('About: settings load failed', err));
  }, []);

  // ── Experience spine — the gold line draws itself down the section ─────────
  const spineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: spineProgress } = useScroll({ target: spineRef, offset: ['start 0.8', 'end 0.55'] });
  const spineScale = useSpring(spineProgress, { stiffness: 80, damping: 24, mass: 0.6 });

  const st = (styles: Record<string, unknown>) => (reduced ? undefined : styles);

  const heroSrc  = imgs['img.about.hero']  || FALLBACK_HERO;
  const storySrc = imgs['img.about.story'] || FALLBACK_STORY;
  const hero  = respImg(heroSrc,  [768, 1280, 1920]);
  const story = respImg(storySrc, [640, 1024, 1440]);
  const inset = respImg(heroSrc,  [320, 640]);

  const heroWords    = t('about.hero.title').split(' ').filter(Boolean)
    .map(w => ({ w, style: getContentStyle('about.hero.title') }));
  const storyWords   = t('about.title').split(' ').filter(Boolean)
    .map(w => ({ w, style: getContentStyle('about.title') }));
  const expWords     = t('about.experience.title').split(' ').filter(Boolean)
    .map(w => ({ w, style: getContentStyle('about.experience.title') }));
  const ctaWords     = [
    ...t('stories.ready').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('stories.ready') })),
    ...t('stories.yourOwn').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('stories.yourOwn'), italic: true })),
  ];

  return (
    <div className="bg-moody-950 overflow-hidden">
      {/* ── Page opener — editorial title block, no image hero ──────────────── */}
      <section className="relative bg-moody-950 pt-16 md:pt-24 pb-4 md:pb-8 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 30%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <SectionTag style={getContentStyle('about.artists')} className="mb-7">
            {t('about.artists')}
          </SectionTag>

          <h1
            style={getContentStyle('about.hero.title')}
            aria-label={t('about.hero.title')}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white leading-[0.98] tracking-tight uppercase mb-5"
          >
            <WordReveal words={heroWords} delay={0.15} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: EASE }}
            style={getContentStyle('about.hero.subtitle')}
            className="font-serif italic text-lg md:text-xl text-gold-400"
          >
            {t('about.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
            className="w-16 h-[1px] bg-gold-400/50 mx-auto mt-9"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ── Story — layered editorial composition ───────────────────────────── */}
      <section className="relative bg-moody-950 pt-16 md:pt-24 pb-32 md:pb-48 px-6 sm:px-8 lg:px-16 overflow-hidden">
        {/* Script watermark */}
        <div
          className="absolute -left-10 top-24 text-[15rem] lg:text-[22rem] font-script text-white/[0.035] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center relative">
          {/* Layered images */}
          <div className="lg:col-span-6 relative mb-20 lg:mb-0">
            {/* Offset gold frame for depth */}
            <div className="absolute -top-5 -left-5 w-2/3 aspect-[4/5] border border-gold-400/30 pointer-events-none" aria-hidden="true" />

            <ParallaxY from={26} to={-26} className="w-[84%]">
              <RevealImage
                src={story.src}
                srcSet={story.srcSet}
                sizes="(min-width: 1024px) 42vw, 84vw"
                alt={t('about.title')}
                className="w-full aspect-[4/5] shadow-2xl shadow-black/50"
              />
            </ParallaxY>

            {/* Overlapping inset portrait — faster drift for depth */}
            <div className="absolute -bottom-14 right-0 w-[46%]">
              <ParallaxY from={64} to={-32}>
                <motion.div
                  initial={{ opacity: 0, y: 46 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, delay: 0.3, ease: EASE }}
                  className="w-full aspect-[3/4] overflow-hidden border-[6px] md:border-8 border-moody-950 shadow-xl shadow-black/60"
                >
                  <img
                    src={inset.src}
                    srcSet={inset.srcSet}
                    sizes="(min-width: 1024px) 23vw, 46vw"
                    alt={t('about.artists')}
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
            {/* The tag lives in the page opener now — a rule alone leads the heading */}
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EASE }}
              className="block w-12 md:w-20 h-[1px] bg-gold-400/40 mb-7 mx-auto lg:mx-0 origin-left"
              aria-hidden="true"
            />

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white leading-[1.05] tracking-tight mb-8">
              <WordReveal words={storyWords} className="lg:justify-start" delay={0.15} />
            </h2>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.25, ease: EASE }}
              className="w-16 h-[1px] bg-gold-400/50 mb-9 mx-auto lg:mx-0 origin-left"
              aria-hidden="true"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: EASE }}
              style={getContentStyle('about.desc.1')}
              className="text-left font-serif text-lg md:text-xl text-white/85 leading-relaxed mb-7 first-letter:text-6xl first-letter:leading-[0.85] first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-gold-400"
            >
              {t('about.desc.1')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: EASE }}
              style={getContentStyle('about.desc.2')}
              className="text-left text-base md:text-lg text-white/60 font-light leading-relaxed mb-8"
            >
              {t('about.desc.2')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: EASE }}
              style={getContentStyle('about.desc.3')}
              className="text-left text-base md:text-lg text-white/60 font-light italic leading-relaxed border-l-2 border-gold-400/30 pl-6 py-1 mb-10"
            >
              {t('about.desc.3')}
            </motion.p>

            {/* Signature */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.7, ease: EASE }}
              className="flex items-center justify-center lg:justify-start gap-6"
            >
              <span className="text-4xl md:text-5xl font-script text-gold-300/80 leading-none">Melisa &amp; Aldin</span>
              <span className="hidden sm:block w-16 h-[1px] bg-gold-400/25" aria-hidden="true" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Experience — timeline on a warm plate, before the dark closer ───── */}
      <section className="relative bg-moody-950 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="text-center mb-20 md:mb-28">
            <SectionTag style={getContentStyle('about.experience.tag')} className="mb-7">
              {t('about.experience.tag')}
            </SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white leading-[1.05] tracking-tight">
              <WordReveal words={expWords} delay={0.2} />
            </h2>
          </div>

          {/* Spine + steps */}
          <div ref={spineRef} className="relative">
            <motion.div
              style={reduced ? undefined : { scaleY: spineScale }}
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-[1px] bg-gradient-to-b from-transparent via-gold-400/45 to-transparent origin-top"
              aria-hidden="true"
            />

            <div className="space-y-24 md:space-y-32 lg:space-y-40 relative">
              {([1, 2, 3, 4] as const).map((n, index) => (
                <ExperienceStep key={n} n={n} index={index} t={t} getContentStyle={getContentStyle} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA — full-bleed cinematic closer into the dark footer ────── */}
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

          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-light text-white leading-[1.08] tracking-tight mb-12 md:mb-16">
            <WordReveal words={ctaWords} delay={0.2} />
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
                style={getContentStyle('stories.start')}
                className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold text-white flex items-center justify-center gap-3"
              >
                {t('stories.start')}
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
