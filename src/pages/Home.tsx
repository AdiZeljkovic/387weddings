import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg, blurSrc } from '../lib/img';
import { OliveBranch, SectionLabel } from '../components/ornaments';
import Reveal from '../components/Reveal';

const FALLBACK = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
];

// The mosaic, as the board lays it out: a tall portrait on the left beside two
// columns of three landscape frames, then a row of two underneath. The three
// columns start at different heights, which is the `shift` below.
const MOSAIC_MAIN = [
  { key: 'img.home.grid.1', col: 1, row: 1, span: 3, shift: -34 },  // 2:3 portrait
  { key: 'img.home.grid.2', col: 2, row: 1, span: 1, shift: 0 },
  { key: 'img.home.grid.3', col: 2, row: 2, span: 1, shift: 0 },
  { key: 'img.home.grid.4', col: 2, row: 3, span: 1, shift: 0 },
  { key: 'img.home.grid.5', col: 3, row: 1, span: 1, shift: 34 },
  { key: 'img.home.grid.6', col: 3, row: 2, span: 1, shift: 34 },
  { key: 'img.home.grid.7', col: 3, row: 3, span: 1, shift: 34 },
];
const MOSAIC_FOOT = [
  { key: 'img.home.grid.8', grow: 2, ratio: '3 / 2' },   // wide
  { key: 'img.home.grid.9', grow: 1, ratio: '2 / 3' },   // narrow portrait
];

// Phones: wide, two, two, wide, two, wide — nine frames, 12px apart
const MOSAIC_PHONE = [
  { key: 'img.home.grid.1', span: true,  ratio: '3 / 2' },
  { key: 'img.home.grid.2', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.3', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.4', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.5', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.6', span: true,  ratio: '3 / 2' },
  { key: 'img.home.grid.7', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.8', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.9', span: true,  ratio: '3 / 2' },
];

const SLIDE_MS = 6000;
const SLIDE_MAX = 5;  // the number of hero slots the admin offers

const Frame = ({ src, alt, className = '', style, sizes = '50vw', eager = false, delay = 0, focus }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties;
  sizes?: string; eager?: boolean; delay?: number; focus?: string;
}) => {
  const r = respImg(src, [480, 768, 1200]);
  return (
    <Reveal kind="mask" delay={delay} className={`relative overflow-hidden bg-rule ${className}`} style={style}>
      <img
        src={r.src}
        srcSet={r.srcSet}
        sizes={sizes}
        alt={alt}
        style={focus ? { objectPosition: focus } : undefined}
        className="w-full h-full object-cover"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
      />
      {/* Warm wash the board puts over every mosaic frame */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ background: 'linear-gradient(160deg, rgba(166,134,93,.12), rgba(140,70,60,.08))' }}
      />
    </Reveal>
  );
};

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  // Until the first hero frame has decoded the section was a flat dark panel
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => console.warn('Home: settings load failed', err));
  }, []);

  // A blurred full-screen layer costs the compositor something, so it goes away
  // even if the load event never reaches us (cached image, failed request)
  useEffect(() => {
    const id = window.setTimeout(() => setHeroReady(true), 2500);
    return () => clearTimeout(id);
  }, []);

  // Only the hero slots the client has actually filled are shown. Until there
  // is at least one, the placeholder set stands in so the hero is never empty —
  // and the moment one real photograph is uploaded, no slide comes from
  // somebody else's server any more.
  const uploaded = Array.from({ length: SLIDE_MAX }, (_, i) => ({
    n: i + 1,
    src: settings[`img.home.hero.${i + 1}`] || '',
  })).filter(s => s.src);
  const heroSlides = uploaded.length
    ? uploaded
    : FALLBACK.slice(0, SLIDE_MAX).map((src, i) => ({ n: i + 1, src }));
  // Settings arrive after the first paint, so the count can shrink under us
  const active = slide % heroSlides.length;
  const heroBlur = blurSrc(heroSlides[0].src);

  // The frames cross-fade on their own; hovering the hero holds the current one
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused || heroSlides.length < 2) return;  // one frame has nowhere to turn
    const id = setInterval(() => setSlide(p => (p + 1) % heroSlides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, heroSlides.length]);
  const mosaicSrc = (key: string, i: number) => settings[key] || FALLBACK[i % FALLBACK.length];
  // Alt text lives beside each image slot as "<key>.alt"
  const altFor = (key: string) => settings[`${key}.alt`] || '';
  const focusFor = (key: string) => settings[`${key}.focus`] || '';

  const aboutMain = respImg(settings['img.home.team.aldin'] || FALLBACK[1], [480, 768, 1100]);
  const aboutDetail = respImg(settings['img.home.team.melisa'] || FALLBACK[6], [320, 640]);

  const heroWords = [
    ...t('hero.title.part1').split(' ').filter(Boolean).map(w => ({ w, italic: false })),
    ...t('hero.title.part2').split(' ').filter(Boolean).map(w => ({ w, italic: true })),
  ];
  const breakAt = t('hero.title.part1').split(' ').filter(Boolean).length;

  return (
    <div className="bg-cream">
      {/* ── Hero — five frames cross-fading behind the statement ───────────── */}
      <section
        className="relative flex flex-col overflow-hidden w-full max-w-full bg-[#26221e] text-white min-h-[740px] lg:min-h-[900px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* A 24px-wide copy of the first frame, blurred up to fill the section.
            It weighs a few hundred bytes, so the hero has its colours and shapes
            almost immediately instead of showing a black screen for a second. */}
        {heroBlur && (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out motion-reduce:transition-none"
            style={{
              backgroundImage: `url(${heroBlur})`,
              filter: 'blur(26px)',
              transform: 'scale(1.08)',
              opacity: heroReady ? 0 : 1,
            }}
          />
        )}

        {heroSlides.map(({ n, src }, i) => {
          const r = respImg(src, [768, 1280, 1920, 2400]);
          return (
            <img
              key={src + i}
              src={r.src}
              srcSet={r.srcSet}
              sizes="(max-width: 1023px) 200vw, 100vw"
              // Only the frame on screen is announced; the others are decoration
              alt={i === active ? (settings[`img.home.hero.${n}.alt`] || '') : ''}
              aria-hidden={i === active ? undefined : 'true'}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none motion-reduce:animate-none"
              style={{
                opacity: i === active ? 1 : 0,
                // Only the visible frame animates, and it restarts on each turn
                animation: i === active ? `heroZoom ${SLIDE_MS + 1200}ms ease-out both` : undefined,
                objectPosition: settings[`img.home.hero.${n}.focus`] || undefined,
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              onLoad={i === 0 ? () => setHeroReady(true) : undefined}
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          );
        })}

        {/* Scrim — sideways on desktop, upward on phones */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,12,10,.5)_0%,rgba(14,12,10,.15)_38%,rgba(14,12,10,.82)_100%)] lg:bg-[linear-gradient(90deg,rgba(14,12,10,.82)_0%,rgba(14,12,10,.38)_55%,rgba(14,12,10,.12)_100%)]"
        />

        <div className="relative z-[2] flex-1 flex flex-col justify-end items-center lg:items-start text-center lg:text-left px-7 lg:px-24 pt-28 pb-24 lg:pb-30 max-w-[1100px] box-border">
          <h1 className="font-serif font-normal text-[42px] leading-[1.08] lg:text-[clamp(56px,6.2vw,88px)] lg:leading-[1.02] lg:tracking-[-0.01em] m-0 mb-6 lg:mb-8">
            {heroWords.map((hw, i) => (
              <React.Fragment key={`${hw.w}-${i}`}>
                {i === breakAt && <br />}
                <span
                  className="inline-block opacity-0 animate-[wordUp_1.1s_cubic-bezier(.2,.6,.2,1)_both] motion-reduce:opacity-100 motion-reduce:animate-none"
                  style={{
                    animationDelay: `calc(var(--intro-delay, 0s) + ${0.25 + i * 0.25}s)`,
                    fontStyle: hw.italic ? 'italic' : undefined,
                    ...getContentStyle(hw.italic ? 'hero.title.part2' : 'hero.title.part1'),
                  }}
                >
                  {hw.w}
                </span>{' '}
              </React.Fragment>
            ))}
          </h1>

          <span aria-hidden="true" className="lg:hidden w-10 h-px bg-gold-600 mb-6" />

          <p
            style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 1.7s)', ...getContentStyle('hero.desc') }}
            className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none text-[14px] lg:text-[19px] font-light leading-[1.75] m-0 mb-auto lg:mb-13 pb-10 text-[#ece5d9] max-w-[260px] lg:max-w-none lg:whitespace-nowrap"
          >
            {t('hero.desc')}
          </p>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-10 w-full max-w-[300px] lg:max-w-none mt-auto lg:mt-0">
            <Link
              to="/portfolio"
              style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 2s)', ...getContentStyle('hero.portfolio') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none btn btn-on-dark bg-cream text-ink-900 text-center text-[11px] lg:text-[12px] font-semibold tracking-[0.22em] uppercase px-0 lg:px-10 py-[19px] lg:py-[22px] border border-cream"
            >
              {t('hero.portfolio')} →
            </Link>
            <Link
              to="/contact"
              style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 2.2s)', ...getContentStyle('hero.inquire') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none btn btn-on-dark text-white text-center text-[11px] lg:text-[12px] font-medium tracking-[0.22em] uppercase px-6 py-[19px] lg:py-3.5 border border-white/55 hover:text-ink-900"
            >
              {t('hero.inquire')} →
            </Link>
          </div>
        </div>

        {/* One tick per frame — bottom right on desktop, centred on phones */}
        <div
          aria-hidden="true"
          className="absolute z-[3] bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-24 lg:bottom-[52px] flex gap-2.5"
        >
          {heroSlides.length > 1 && heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Slika ${i + 1}`}
              className="flex items-center h-11 w-7 lg:w-11 p-0 border-0 cursor-pointer group"
            >
              <span className="block w-full h-0.5 bg-white/30 overflow-hidden">
                <span
                  className="block h-full bg-white origin-left transition-transform duration-[600ms] ease-linear"
                  style={{ transform: `scaleX(${i === active ? 1 : 0})` }}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="hidden lg:flex absolute bottom-14 left-1/2 -translate-x-1/2 z-[2] flex-col items-center gap-3">
          <span style={getContentStyle('home.scroll')} className="text-[12px] tracking-[0.3em] uppercase text-rule">
            {t('home.scroll')}
          </span>
          <span aria-hidden="true" className="w-px h-12 bg-[linear-gradient(#ffffff,rgba(255,255,255,0))]" />
        </div>
      </section>

      {/* ── Mosaic ─────────────────────────────────────────────────────────── */}
      <section id="radovi" className="relative overflow-hidden bg-cream py-[72px] lg:py-32 px-5 lg:px-16">
        <OliveBranch className="hidden lg:block absolute bottom-5 w-[260px] left-[calc(50%-600px)]" />
        <OliveBranch className="hidden lg:block absolute bottom-5 w-[260px] right-[calc(50%-600px)]" flip />

        <div className="relative max-w-[1248px] mx-auto">
          <div className="flex flex-wrap items-center gap-10 lg:gap-16 mb-9 lg:mb-10">
            <div className="w-full lg:w-auto lg:flex-none text-center lg:text-left">
              <SectionLabel
                centered
                className="lg:hidden mb-6 justify-center"
                style={getContentStyle('home.featured.title')}
              >
                {t('home.featured.title')}
              </SectionLabel>

              <Reveal as="h2" className="font-serif font-normal text-[40px] lg:text-[64px] leading-[1.08] m-0">
                {(['part1', 'part2'] as const).map(part => (
                  <React.Fragment key={part}>
                    <span style={getContentStyle(`home.featured.heading.${part}`)}>
                      {t(`home.featured.heading.${part}`)}
                    </span>
                    <br />
                  </React.Fragment>
                ))}
                <span className="inline-flex flex-col items-center">
                  <span className="italic text-love" style={getContentStyle('home.featured.heading.part3')}>
                    {t('home.featured.heading.part3')}
                  </span>
                  <span className="block mt-3.5 lg:mt-9 leading-[0]">
                    <svg
                      width="22" height="20" viewBox="0 0 24 22" fill="#a8323e" aria-hidden="true"
                      className="inline-block origin-center animate-[heartbeat_4s_ease-in-out_infinite] motion-reduce:animate-none"
                    >
                      <path d="M12 21.2C5.2 15.4 1.5 11.9 1.5 7.4 1.5 4.2 4 1.8 7 1.8c1.9 0 3.7 1 5 2.8 1.3-1.8 3.1-2.8 5-2.8 3 0 5.5 2.4 5.5 5.6 0 4.5-3.7 8-10.5 13.8z" />
                    </svg>
                  </span>
                </span>
              </Reveal>
            </div>

            {/* Desktop: tall portrait beside two columns of three */}
            <div
              className="hidden lg:grid flex-1 min-w-0"
              style={{
                gridTemplateColumns: '396fr 414fr 414fr',
                gridTemplateRows: 'repeat(3, 190px)',
                gap: '12px',
                flexBasis: '852px',
                paddingTop: '34px',
                paddingBottom: '34px',
              }}
            >
              {MOSAIC_MAIN.map((tile, i) => (
                <Frame
                  key={tile.key}
                  src={mosaicSrc(tile.key, i)}
                  alt={altFor(tile.key)}
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  delay={i * 0.06}
                  focus={focusFor(tile.key)}
                  className={`min-w-0 ${tile.col === 1 ? 'px-big' : tile.col === 2 ? 'px-colA' : 'px-colB'}`}
                  style={{
                    gridColumn: tile.col,
                    gridRow: `${tile.row} / span ${tile.span}`,
                    transform: `translateY(${tile.shift}px)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Desktop closing row: one wide, one narrow portrait */}
          <div className="hidden lg:flex gap-3 h-[300px]">
            {MOSAIC_FOOT.map((tile, i) => (
              <Frame
                key={tile.key}
                src={mosaicSrc(tile.key, i + 7)}
                alt={altFor(tile.key)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                delay={i * 0.06}
                focus={focusFor(tile.key)}
                className="min-w-0"
                style={{ flex: `${tile.grow} 1 0` }}
              />
            ))}
          </div>

          {/* Phones — two columns, wide frames spanning both */}
          <div className="grid lg:hidden grid-cols-2 gap-3">
            {MOSAIC_PHONE.map((tile, i) => (
              <Frame
                key={`${tile.key}-${i}`}
                src={mosaicSrc(tile.key, i)}
                alt={altFor(tile.key)}
                sizes="50vw"
                delay={i * 0.07}
                focus={focusFor(tile.key)}
                className={tile.span ? 'col-span-2' : ''}
                style={{ aspectRatio: tile.ratio }}
              />
            ))}
          </div>

          <div className="relative flex justify-center mt-11 lg:mt-14">
            <Link
              to="/portfolio"
              style={getContentStyle('home.featured.cta')}
              className="btn relative inline-block border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] uppercase px-7 lg:px-10 py-[18px] lg:py-[22px] hover:text-white"
            >
              {t('home.featured.cta')} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section id="onama" className="relative overflow-hidden bg-cream-light py-[72px] lg:py-32 px-6 lg:px-24">
        <OliveBranch className="hidden lg:block absolute left-24 top-9 w-[170px] opacity-[0.22]" />

        <div className="relative max-w-[1248px] mx-auto flex flex-wrap items-center gap-12 lg:gap-26">
          <div className="flex-1 min-w-0 basis-full lg:basis-[440px] text-center lg:text-left">
            <SectionLabel
              className="mb-6 lg:mb-7 justify-center lg:justify-start"
              style={getContentStyle('home.about.tag')}
            >
              {t('home.about.tag')}
            </SectionLabel>

            <Reveal as="h2" className="font-serif font-normal text-[34px] lg:text-[56px] leading-[1.12] m-0 mb-6 lg:mb-9">
              <span style={getContentStyle('home.about.heading.part1')}>{t('home.about.heading.part1')}</span>
              <br />
              <span className="italic" style={getContentStyle('home.about.heading.part2')}>
                {t('home.about.heading.part2')}
              </span>
            </Reveal>

            {(['1', '2'] as const).map((n, i) => (
              <Reveal
                as="p"
                key={n}
                delay={0.08 + i * 0.08}
                style={getContentStyle(`home.about.desc.${n}`)}
                className={`text-[15px] lg:text-[18px] font-light leading-[1.8] lg:leading-[1.75] text-ink-700 max-w-[480px] mx-auto lg:mx-0 m-0 ${i === 0 ? 'mb-5 lg:mb-6' : 'mb-9 lg:mb-12'}`}
              >
                {t(`home.about.desc.${n}`)}
              </Reveal>
            ))}

            <Link
              to="/about"
              style={getContentStyle('home.about.cta')}
              className="btn btn-solid inline-block bg-ink-900 text-white text-[11px] lg:text-[12px] font-semibold tracking-[0.22em] uppercase px-8 lg:px-10 py-[19px] lg:py-[22px]"
            >
              {t('home.about.cta')} →
            </Link>
          </div>

          {/* Big portrait with an offset gold frame and a small detail print */}
          <div className="flex-1 min-w-0 basis-full lg:basis-[440px] relative pb-14 lg:pb-14 lg:pl-14">
            <span
              aria-hidden="true"
              className="hidden lg:block absolute top-10 -right-6 bottom-24 left-24 border border-gold-600"
            />
            <div className="relative aspect-[4/5] overflow-hidden bg-rule">
              <img
                src={aboutMain.src}
                srcSet={aboutMain.srcSet}
                sizes="(min-width: 1024px) 40vw, 90vw"
                alt={settings['img.home.team.aldin.alt'] || t('home.about.heading.part1')}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute left-0 bottom-0 w-[36%] aspect-[2/3] overflow-hidden bg-rule border-8 border-cream-light">
              <img
                src={aboutDetail.src}
                srcSet={aboutDetail.srcSet}
                sizes="(min-width: 1024px) 15vw, 32vw"
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
        </div>
      </section>
    </div>
  );
};

export default Home;
