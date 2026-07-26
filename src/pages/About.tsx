import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Camera, Film, MessageSquare, Star, Image as ImageIcon, Heart, Users } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, RevealImage, SectionTag, WordReveal, GoldPill } from '../components/anim';

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
          className="w-3 h-3 rounded-full bg-gold-600 ring-8 ring-gold-100/60 shadow-sm shadow-gold-900/20"
        />
      </div>

      {/* Content block — slides in from its own side */}
      <motion.div
        style={st({ x, opacity: o })}
        className={`relative border-l border-gold-600/20 pl-6 md:border-l-0 md:pl-0 md:row-start-1 ${
          left ? 'md:col-start-1 md:text-right md:pr-6 lg:pr-10' : 'md:col-start-3 md:text-left md:pl-6 lg:pl-10'
        }`}
      >
        {/* Ghost number drifting in behind */}
        <motion.span
          style={st({ x: numX, opacity: numO })}
          aria-hidden="true"
          className={`absolute -top-10 md:-top-16 ${left ? 'right-0' : 'right-0 md:left-0'} text-[5.5rem] md:text-[9rem] lg:text-[11rem] font-serif leading-none text-gold-600/[0.09] select-none pointer-events-none`}
        >
          {t(`about.step.${n}.num`)}
        </motion.span>

        <div className={`relative flex items-center gap-4 mb-6 ${left ? 'md:justify-end' : ''}`}>
          <span
            style={getContentStyle(`about.step.${n}.num`)}
            className="text-3xl md:text-4xl font-serif font-light text-gold-600/45 leading-none"
          >
            {t(`about.step.${n}.num`)}
          </span>
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-600/25 bg-white/70 text-gold-600 shadow-sm shadow-moody-900/5">
            {icon}
          </span>
        </div>

        <h3
          style={getContentStyle(`about.step.${n}.title`)}
          className="relative text-2xl md:text-3xl lg:text-4xl font-serif font-light text-moody-900 leading-tight mb-5"
        >
          {t(`about.step.${n}.title`)}
        </h3>

        <motion.div
          style={st({ scaleX: ruleX })}
          aria-hidden="true"
          className={`w-12 h-[1px] bg-gold-600/50 mb-6 ${left ? 'md:ml-auto md:origin-right' : 'origin-left'}`}
        />

        <p
          style={getContentStyle(`about.step.${n}.desc`)}
          className={`relative text-moody-900/60 font-light leading-relaxed text-sm md:text-base max-w-md ${left ? 'md:ml-auto' : ''}`}
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

  // ── Hero — scroll-scrubbed parallax + slow push-in ─────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY     = useTransform(heroProgress, [0, 1], ['-8%', '8%']);
  const heroScale = useTransform(heroProgress, [0, 1], [1.06, 1.2]);
  const heroFade  = useTransform(heroProgress, [0, 0.85], [1, 0]);

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
    <div className="bg-white overflow-hidden">
      {/* ── Hero — inset cinematic panel under the light header ─────────────── */}
      <section className="relative bg-white pt-0 md:pt-8 px-0 md:px-8 lg:px-12">
        <div ref={heroRef} className="relative h-[76vh] md:h-[84vh] overflow-hidden bg-[#0a0908]">
          {/* Parallax plate */}
          <motion.div style={st({ y: heroY })} className="absolute inset-0 -top-[12%] -bottom-[12%] z-0">
            <motion.img
              src={hero.src}
              srcSet={hero.srcSet}
              sizes="100vw"
              alt={t('about.hero.title')}
              style={st({ scale: heroScale })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.72 }}
              transition={{ duration: 2.2, ease: EASE }}
              className="w-full h-full object-cover grayscale-[0.45]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Cinematic vignette + top/bottom falloff */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/20 to-black/75" aria-hidden="true" />
          <div
            className="absolute inset-0 z-[1]"
            style={{ background: 'radial-gradient(ellipse 70% 65% at 50% 45%, transparent 0%, rgba(0,0,0,0.55) 100%)' }}
            aria-hidden="true"
          />

          {/* Thin editorial frame */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, delay: 0.5, ease: EASE }}
            className="absolute inset-4 md:inset-8 z-[2] border border-white/15 pointer-events-none"
            aria-hidden="true"
          />

          {/* Statement */}
          <motion.div
            style={st({ opacity: heroFade })}
            className="relative z-[3] h-full flex flex-col items-center justify-center text-center px-6"
          >
            <h1 className="text-[3.25rem] leading-[0.95] sm:text-7xl md:text-8xl lg:text-[8.5rem] font-serif font-light text-white tracking-tight uppercase mb-6 md:mb-9">
              <WordReveal words={heroWords} delay={0.55} />
            </h1>

            {/* Hand-drawn flourish that draws itself in */}
            <motion.svg
              viewBox="0 0 300 22"
              fill="none"
              className="w-40 md:w-60 h-auto text-gold-400/80 mb-7 md:mb-9"
              aria-hidden="true"
            >
              <motion.path
                d="M6 16 Q 80 2 150 9 T 294 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 1.15, ease: 'easeInOut' }}
              />
            </motion.svg>

            {/* Gold hairlines + subtitle — lifted to gold-400 for dark ground,
                CMS colour (when set) still wins */}
            <SectionTag style={{ color: '#c9b49a', ...getContentStyle('about.hero.subtitle') }}>
              {t('about.hero.subtitle')}
            </SectionTag>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            style={st({ opacity: heroFade })}
            className="absolute inset-x-0 bottom-10 z-[3] hidden md:flex justify-center"
            aria-hidden="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 1.6 }}
              className="h-16 w-[1px] bg-gradient-to-b from-gold-400/80 to-transparent animate-[scrollBounce_2s_ease-in-out_infinite]"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Story — layered editorial composition ───────────────────────────── */}
      <section className="relative bg-white pt-28 md:pt-40 pb-32 md:pb-48 px-6 sm:px-8 lg:px-16 overflow-hidden">
        {/* Script watermark */}
        <div
          className="absolute -left-10 top-24 text-[15rem] lg:text-[22rem] font-script text-gold-600/[0.05] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center relative">
          {/* Layered images */}
          <div className="lg:col-span-6 relative mb-20 lg:mb-0">
            {/* Offset gold frame for depth */}
            <div className="absolute -top-5 -left-5 w-2/3 aspect-[4/5] border border-gold-600/30 pointer-events-none" aria-hidden="true" />

            <ParallaxY from={26} to={-26} className="w-[84%]">
              <RevealImage
                src={story.src}
                srcSet={story.srcSet}
                sizes="(min-width: 1024px) 42vw, 84vw"
                alt={t('about.title')}
                className="w-full aspect-[4/5] shadow-2xl shadow-moody-900/15"
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
                  className="w-full aspect-[3/4] overflow-hidden border-[6px] md:border-8 border-white shadow-xl shadow-moody-900/20"
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
            {/* Tag with a line growing out of it */}
            <div className="flex items-center justify-center lg:justify-start gap-5 mb-6">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE }}
                style={getContentStyle('about.artists')}
                className="luxury-text-sm block"
              >
                {t('about.artists')}
              </motion.span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.15, ease: EASE }}
                className="w-12 md:w-20 h-[1px] bg-gold-600/40 origin-left"
                aria-hidden="true"
              />
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-moody-900 leading-[1.05] tracking-tight mb-8">
              <WordReveal words={storyWords} className="lg:justify-start" delay={0.15} />
            </h2>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.25, ease: EASE }}
              className="w-16 h-[1px] bg-gold-600/50 mb-9 mx-auto lg:mx-0 origin-left"
              aria-hidden="true"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: EASE }}
              style={getContentStyle('about.desc.1')}
              className="text-left font-serif text-lg md:text-xl text-moody-900/85 leading-relaxed mb-7 first-letter:text-6xl first-letter:leading-[0.85] first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-gold-600"
            >
              {t('about.desc.1')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: EASE }}
              style={getContentStyle('about.desc.2')}
              className="text-left text-base md:text-lg text-moody-900/60 font-light leading-relaxed mb-8"
            >
              {t('about.desc.2')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: EASE }}
              style={getContentStyle('about.desc.3')}
              className="text-left text-base md:text-lg text-moody-900/60 font-light italic leading-relaxed border-l-2 border-gold-600/25 pl-6 py-1 mb-10"
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
              <span className="text-4xl md:text-5xl font-script text-gold-600/70 leading-none">Melisa &amp; Aldin</span>
              <span className="hidden sm:block w-16 h-[1px] bg-gold-600/25" aria-hidden="true" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Experience — scroll-scrubbed timeline along a gold spine ────────── */}
      <section className="relative bg-gold-100/50 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20 md:mb-28">
            <SectionTag style={getContentStyle('about.experience.tag')} className="mb-7">
              {t('about.experience.tag')}
            </SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light text-moody-900 leading-[1.05] tracking-tight">
              <WordReveal words={expWords} delay={0.2} />
            </h2>
          </div>

          {/* Spine + steps */}
          <div ref={spineRef} className="relative">
            <motion.div
              style={reduced ? undefined : { scaleY: spineScale }}
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-[1px] bg-gradient-to-b from-transparent via-gold-600/40 to-transparent origin-top"
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

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="relative bg-gold-50 py-28 md:py-44 px-6 sm:px-8 lg:px-16 text-center overflow-hidden">
        {/* Soft gold glow behind the statement */}
        <div
          className="absolute inset-x-0 top-1/4 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(166,134,93,0.12) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE }}
            className="flex justify-center mb-8"
            aria-hidden="true"
          >
            <span className="w-2 h-2 rotate-45 bg-gold-600/60" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 leading-[1.08] tracking-tight mb-14 md:mb-16">
            <WordReveal words={ctaWords} delay={0.2} />
          </h2>

          <div className="flex justify-center">
            <GoldPill to="/contact" style={getContentStyle('stories.start')}>
              {t('stories.start')}
            </GoldPill>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
