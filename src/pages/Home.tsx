import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { OliveBranch, SectionLabel } from '../components/ornaments';

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

// The mosaic from the mockup: six frames on a four-column grid, then a band of
// three underneath. Column and flex ratios are taken straight from the board.
const MOSAIC_TOP = [
  { key: 'img.home.grid.1', area: 'col-start-1 col-end-3 row-start-1' },
  { key: 'img.home.grid.2', area: 'col-start-3 row-start-1 row-end-3' },
  { key: 'img.home.grid.3', area: 'col-start-4 row-start-1' },
  { key: 'img.home.grid.4', area: 'col-start-1 row-start-2' },
  { key: 'img.home.grid.5', area: 'col-start-2 row-start-2' },
  { key: 'img.home.grid.6', area: 'col-start-4 row-start-2' },
];
const MOSAIC_BOTTOM = [
  { key: 'img.home.grid.7', grow: 1.5 },
  { key: 'img.home.grid.8', grow: 0.667 },
  { key: 'img.home.grid.9', grow: 1.5 },
];

// Phones get the same nine frames in two columns, wide ones spanning both
const MOSAIC_PHONE = [
  { key: 'img.home.grid.1', span: true,  ratio: '3 / 2' },
  { key: 'img.home.grid.2', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.3', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.4', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.5', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.7', span: true,  ratio: '3 / 2' },
  { key: 'img.home.grid.6', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.8', span: false, ratio: '3 / 4' },
  { key: 'img.home.grid.9', span: true,  ratio: '3 / 2' },
];

const SLIDE_MS = 6000;
const SLIDES = 5;

const Frame = ({ src, alt, className = '', style, sizes = '50vw', eager = false }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties; sizes?: string; eager?: boolean;
}) => {
  const r = respImg(src, [480, 768, 1280]);
  return (
    <div className={`overflow-hidden bg-rule ${className}`} style={style}>
      <img
        src={r.src}
        srcSet={r.srcSet}
        sizes={sizes}
        alt={alt}
        className="w-full h-full object-cover"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => console.warn('Home: settings load failed', err));
  }, []);

  // Five frames cross-fade on their own; hovering the hero holds the current one
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused) return;
    const id = setInterval(() => setSlide(p => (p + 1) % SLIDES), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const heroSlides = Array.from({ length: SLIDES }, (_, i) =>
    settings[`img.home.hero.${i + 1}`] || FALLBACK[i]
  );
  const mosaicSrc = (key: string, i: number) => settings[key] || FALLBACK[i % FALLBACK.length];

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
        className="relative flex flex-col overflow-hidden bg-[#26221e] text-white min-h-[740px] lg:min-h-[900px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {heroSlides.map((src, i) => {
          const r = respImg(src, [768, 1280, 1920]);
          return (
            <img
              key={src + i}
              src={r.src}
              srcSet={r.srcSet}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none"
              style={{ opacity: i === slide ? 1 : 0 }}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
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
        <div aria-hidden="true" className="absolute inset-2.5 lg:inset-4 border border-white/[0.16] pointer-events-none" />

        <div className="relative z-[2] flex-1 flex flex-col justify-center lg:justify-end items-center lg:items-start text-center lg:text-left px-7 lg:px-24 pt-28 pb-24 lg:pb-30 max-w-[1100px] box-border">
          <h1 className="font-serif font-normal text-[42px] lg:text-[104px] leading-[1.08] lg:leading-[1.02] lg:tracking-[-0.01em] m-0 mb-6 lg:mb-8">
            {heroWords.map((hw, i) => (
              <React.Fragment key={`${hw.w}-${i}`}>
                {i === breakAt && <br />}
                <span
                  className="inline-block opacity-0 animate-[wordUp_1.1s_cubic-bezier(.2,.6,.2,1)_both] motion-reduce:opacity-100 motion-reduce:animate-none"
                  style={{
                    animationDelay: `${0.25 + i * 0.25}s`,
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
            style={{ animationDelay: '1.7s', ...getContentStyle('hero.desc') }}
            className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none text-[14px] lg:text-[19px] font-light leading-[1.75] m-0 mb-10 lg:mb-13 text-[#ece5d9] max-w-[260px] lg:max-w-none lg:whitespace-nowrap"
          >
            {t('hero.desc')}
          </p>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-10 w-full max-w-[300px] lg:max-w-none">
            <Link
              to="/portfolio"
              style={{ animationDelay: '2s', ...getContentStyle('hero.portfolio') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none bg-cream text-ink-900 text-center text-[11px] lg:text-[12px] font-semibold tracking-[0.22em] uppercase px-0 lg:px-10 py-[19px] lg:py-[22px] border border-cream transition-colors duration-250 hover:bg-white"
            >
              {t('hero.portfolio')} →
            </Link>
            <Link
              to="/contact"
              style={{ animationDelay: '2.2s', ...getContentStyle('hero.inquire') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none text-white text-center text-[11px] lg:text-[12px] font-medium tracking-[0.22em] uppercase py-[19px] lg:py-3.5 border lg:border-0 lg:border-b border-white/55 lg:border-b-white/50 transition-colors duration-250 hover:text-cream"
            >
              {t('hero.inquire')} →
            </Link>
          </div>
        </div>

        {/* Five ticks — bottom right on desktop, centred on phones */}
        <div
          aria-hidden="true"
          className="absolute z-[3] bottom-9 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-24 lg:bottom-[68px] flex gap-2.5"
        >
          {Array.from({ length: SLIDES }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Slika ${i + 1}`}
              className="block w-7 lg:w-11 h-0.5 bg-white/30 overflow-hidden p-0 border-0 cursor-pointer"
            >
              <span
                className="block h-full bg-white origin-left transition-transform duration-[600ms] ease-linear"
                style={{ transform: `scaleX(${i === slide ? 1 : 0})` }}
              />
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

              <h2 className="font-serif font-normal text-[40px] lg:text-[64px] leading-[1.08] m-0">
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
              </h2>
            </div>

            {/* Desktop grid — ratios straight from the board */}
            <div
              className="hidden lg:grid flex-1 min-w-0 gap-2"
              style={{
                gridTemplateColumns: '190fr 195fr 355fr 220fr',
                gridTemplateRows: '262px 262px',
                flexBasis: '560px',
              }}
            >
              {MOSAIC_TOP.map((tile, i) => (
                <Frame
                  key={tile.key}
                  src={mosaicSrc(tile.key, i)}
                  alt=""
                  sizes="28vw"
                  eager={i < 3}
                  className={`${tile.area} min-w-0`}
                />
              ))}
            </div>
          </div>

          {/* Desktop closing band of three */}
          <div className="hidden lg:flex gap-2 h-[352px]">
            {MOSAIC_BOTTOM.map((tile, i) => (
              <Frame
                key={tile.key}
                src={mosaicSrc(tile.key, i + 6)}
                alt=""
                sizes="33vw"
                className="min-w-0"
                style={{ flex: `${tile.grow} 1 0` }}
              />
            ))}
          </div>

          {/* Phones — two columns, wide frames spanning both */}
          <div className="grid lg:hidden grid-cols-2 gap-2">
            {MOSAIC_PHONE.map((tile, i) => (
              <Frame
                key={`${tile.key}-${i}`}
                src={mosaicSrc(tile.key, i)}
                alt=""
                sizes="50vw"
                eager={i < 2}
                className={tile.span ? 'col-span-2' : ''}
                style={{ aspectRatio: tile.ratio }}
              />
            ))}
          </div>

          <div className="flex justify-center mt-11 lg:mt-14">
            <Link
              to="/portfolio"
              style={getContentStyle('home.featured.cta')}
              className="inline-block border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] uppercase px-7 lg:px-10 py-[18px] lg:py-[22px] transition-colors duration-250 hover:bg-ink-900 hover:text-white"
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

            <h2 className="font-serif font-normal text-[34px] lg:text-[56px] leading-[1.12] m-0 mb-6 lg:mb-9">
              <span style={getContentStyle('home.about.heading.part1')}>{t('home.about.heading.part1')}</span>
              <br />
              <span className="italic" style={getContentStyle('home.about.heading.part2')}>
                {t('home.about.heading.part2')}
              </span>
            </h2>

            {(['1', '2'] as const).map((n, i) => (
              <p
                key={n}
                style={getContentStyle(`home.about.desc.${n}`)}
                className={`text-[15px] lg:text-[18px] font-light leading-[1.8] lg:leading-[1.75] text-ink-700 max-w-[480px] mx-auto lg:mx-0 m-0 ${i === 0 ? 'mb-5 lg:mb-6' : 'mb-9 lg:mb-12'}`}
              >
                {t(`home.about.desc.${n}`)}
              </p>
            ))}

            <Link
              to="/about"
              style={getContentStyle('home.about.cta')}
              className="inline-block bg-ink-900 text-white text-[11px] lg:text-[12px] font-semibold tracking-[0.22em] uppercase px-8 lg:px-10 py-[19px] lg:py-[22px] transition-colors duration-250 hover:bg-ink-700"
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
                alt={t('home.about.heading.part1')}
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
