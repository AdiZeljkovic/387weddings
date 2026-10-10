import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg, blurSrc } from '../lib/img';
import { OliveBranch, SectionLabel } from '../components/ornaments';
import Reveal from '../components/Reveal';
import Emphasis from '../components/Emphasis';
import { introPlaying, INTRO_LIFT_S } from '../components/Preloader';
import StoryFan, { type FanStory } from '../components/StoryFan';
import { usePaths } from '../lib/routes';

// One stand-in for the hero until the owner uploads a frame of their own. The
// brief is explicit that the empty slots 2-5 must not pull images from another
// host, so a single placeholder is all that is ever borrowed.
const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1800';

// Placeholders for the mosaic and the About block while their slots are empty
const FALLBACK = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
];

// The board's slideshow: each frame 4s, a 0.8s cross-fade, a full turn of
// five in 20s.
const SLIDE_MS = 4000;
const FADE_MS = 800;
const SLIDE_MAX = 5;

// The five photographs in the "O nama" pile, as the board lays them out: where
// it sits as a share of the column, width, frame ratio, resting tilt, and where
// it comes in from as it slides into place. `px` is how far it drifts while
// the section scrolls by: the bigger the picture, the less it moves.
const PILE = [
  { key: 'img.home.stack.1', pos: { left: '4%',  top: '10%' },   w: '40%', ratio: '2 / 3', r: -5, from: [-80, 10, -12], px: 26 },
  { key: 'img.home.stack.2', pos: { left: '42%', top: '0' },     w: '34%', ratio: '2 / 3', r: 3,  from: [10, -70, 10],  px: 34 },
  { key: 'img.home.stack.3', pos: { right: '0',  top: '34%' },   w: '40%', ratio: '3 / 2', r: 6,  from: [80, 0, 12],    px: 26 },
  { key: 'img.home.stack.4', pos: { left: '20%', bottom: '0' },  w: '42%', ratio: '3 / 2', r: -3, from: [-40, 70, -10], px: 20 },
  { key: 'img.home.stack.5', pos: { left: '56%', bottom: '2%' }, w: '30%', ratio: '3 / 4', r: -5, from: [60, 60, 12],   px: 40 },
];

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const paths = usePaths();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  // Until the first hero frame has decoded the section was a flat dark panel
  const [heroReady, setHeroReady] = useState(false);
  // Whether this page opened under the curtain; if so its first frame settles
  // from 1.12 as the curtain lifts, instead of starting its slideshow drift.
  const underCurtain = useRef(introPlaying());
  const [turned, setTurned] = useState(false);
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  // The first frame's 4s only start once the curtain is out of the way
  const CURTAIN_MS = underCurtain.current ? INTRO_LIFT_S * 1000 + 900 : 0;
  const remaining = useRef(SLIDE_MS + CURTAIN_MS);
  const startedAt = useRef(0);

  // The fan is filled from the stories chosen for it in the panel
  const [fan, setFan] = useState<FanStory[] | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => console.warn('Home: settings load failed', err));
    fetch('/api/stories/fan')
      .then(r => (r.ok ? r.json() : []))
      .then(d => setFan(Array.isArray(d) ? d : []))
      .catch(() => setFan([]));
  }, []);

  // A blurred full-screen layer costs the compositor something, so it goes away
  // even if the load event never reaches us (cached image, failed request)
  useEffect(() => {
    const id = window.setTimeout(() => setHeroReady(true), 2500);
    return () => clearTimeout(id);
  }, []);

  // Only the hero slots the client has actually filled are shown. Each slot may
  // also carry an upright crop for phones: a landscape frame under
  // object-fit:cover on a tall screen is scaled until it covers, so most of its
  // width is thrown away and what is left looks soft.
  const uploaded = Array.from({ length: SLIDE_MAX }, (_, i) => ({
    n: i + 1,
    src: settings[`img.home.hero.${i + 1}`] || '',
    mobile: settings[`img.home.hero.mobile.${i + 1}`] || '',
  })).filter(s => s.src || s.mobile);
  const heroSlides = uploaded.length
    ? uploaded.map(s => ({ ...s, src: s.src || s.mobile }))
    : [{ n: 1, src: HERO_FALLBACK, mobile: '' }];
  // Settings arrive after the first paint, so the count can shrink under us
  const active = slide % heroSlides.length;
  const heroBlur = blurSrc(heroSlides[0].mobile || heroSlides[0].src);
  const many = heroSlides.length > 1;

  // The frames cross-fade on their own; hovering the hero holds the current one
  // and resumes with whatever time it had left, so the slide and its filling
  // tick stay in step. Under reduced motion only the first frame is shown.
  useEffect(() => {
    if (reduceMotion.current || !many) return;
    if (paused) {
      remaining.current -= performance.now() - startedAt.current;
      return;
    }
    startedAt.current = performance.now();
    const id = window.setTimeout(() => {
      remaining.current = SLIDE_MS;
      setSlide(p => (p + 1) % heroSlides.length);
      setTurned(true);
    }, Math.max(0, remaining.current));
    return () => clearTimeout(id);
  }, [paused, many, slide, heroSlides.length]);

  const pick = (i: number) => {
    remaining.current = SLIDE_MS;
    setSlide(i);
    setTurned(true);
  };

  // Alt text and focal point live beside each image slot as "<key>.alt" / ".focus"
  const altFor = (key: string) => settings[`${key}.alt`] || '';
  const focusFor = (key: string) => settings[`${key}.focus`] || '';
  const pileSrc = (key: string, i: number) => settings[key] || FALLBACK[(i + 1) % FALLBACK.length];

  const heroWords = [
    ...t('hero.title.part1').split(' ').filter(Boolean).map(w => ({ w, italic: false })),
    ...t('hero.title.part2').split(' ').filter(Boolean).map(w => ({ w, italic: true })),
  ];
  const breakAt = t('hero.title.part1').split(' ').filter(Boolean).length;
  // The board staggers the words 0.25s apart, with a breath at the line break
  const wordDelay = (i: number) => 0.25 + i * 0.25 + (i >= breakAt ? 0.2 : 0);

  const slideAnimation = (i: number) => {
    if (i !== active || reduceMotion.current) return undefined;
    if (i === 0 && underCurtain.current && !turned) {
      return `heroIntro 1.6s cubic-bezier(.2,.6,.2,1) ${INTRO_LIFT_S}s both`;
    }
    return `heroZoom ${SLIDE_MS + FADE_MS}ms linear both`;
  };

  return (
    <div className="bg-cream">
      {/* ── Hero — up to five frames cross-fading behind the statement ─────── */}
      <section
        // Exactly the visible screen, so the hero is never half-cut and the
        // next section always starts below the fold.
        className="hero-screen min-h-[500px] lg:min-h-[560px] relative flex flex-col overflow-hidden w-full max-w-full bg-[#26221e] text-white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* A 24px-wide copy of the first frame, blurred up to fill the section,
            so the hero has its colours almost at once instead of a black panel */}
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

        {heroSlides.map(({ n, src, mobile }, i) => {
          const r = respImg(src);
          const m = mobile ? respImg(mobile) : null;
          // A phone covers a 390x844 screen from a frame about 1.5 screens wide,
          // so a flat 100vw would ask for a third of the pixels it shows
          const narrow = mobile ? '150vw' : '200vw';
          return (
            <picture
              key={src + i}
              className="absolute inset-0 block ease-in-out motion-reduce:transition-none"
              style={{
                opacity: i === active ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease-in-out`,
                animation: slideAnimation(i),
              }}
            >
              {m && <source media="(max-width: 1023px)" srcSet={m.srcSet || m.src} sizes={narrow} />}
              <img
                src={r.src}
                srcSet={r.srcSet}
                sizes={`(max-width: 1023px) ${narrow}, 100vw`}
                // Only the frame on screen is announced; the others are decoration
                alt={i === active ? (settings[`img.home.hero.${n}.alt`] || '') : ''}
                aria-hidden={i === active ? undefined : 'true'}
                className="w-full h-full object-cover"
                style={{ objectPosition: settings[`img.home.hero.${n}.focus`] || undefined }}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                onLoad={i === 0 ? () => setHeroReady(true) : undefined}
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </picture>
          );
        })}

        {/* Scrim. On a phone, upward, darker at the foot behind the words. On a
            desktop the board's variant 3: a soft band under the header so the
            menu reads on a bright sky, a light wash behind the text on the left,
            and a little weight at the foot behind "Skroluj" — the photograph
            itself is never darkened, filtered or faded. */}
        <div aria-hidden="true" className="hero-scrim absolute inset-0" />

        {/* The statement. On a phone the words sit centred in the space under
            the header with the buttons below them; on a desktop the whole block
            rests at the lower left, clear above "Skroluj". */}
        <div className="relative z-[2] flex-1 flex flex-col items-center lg:items-start justify-start lg:justify-end text-center lg:text-left px-7 lg:px-24 pt-24 lg:pt-0 pb-9 lg:pb-[184px] max-w-[1100px] box-border">
          <div className="my-auto lg:my-0 py-6 lg:py-0 flex flex-col items-center lg:items-start">
            <h1 className="font-serif font-normal text-[clamp(28px,9.2vw,36px)] lg:text-[clamp(40px,4.17vw,64px)] leading-[1.1] lg:leading-[1.08] tracking-[-0.01em] m-0 mb-5 lg:mb-6">
              {heroWords.map((hw, i) => (
                <React.Fragment key={`${hw.w}-${i}`}>
                  {i === breakAt && <br />}
                  <span
                    className="inline-block opacity-0 animate-[wordUp_1.1s_cubic-bezier(.2,.6,.2,1)_both] motion-reduce:opacity-100 motion-reduce:animate-none"
                    style={{
                      animationDelay: `calc(var(--intro-delay, 0s) + ${wordDelay(i)}s)`,
                      fontStyle: hw.italic ? 'italic' : undefined,
                      ...getContentStyle(hw.italic ? 'hero.title.part2' : 'hero.title.part1'),
                    }}
                  >
                    {hw.w}
                  </span>{' '}
                </React.Fragment>
              ))}
            </h1>

            <span aria-hidden="true" className="lg:hidden w-10 h-px bg-gold-600 mb-[22px]" />

            <p
              style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 1.7s)', ...getContentStyle('hero.desc') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none text-[14px] lg:text-[16px] font-light leading-[1.75] m-0 lg:mb-10 text-[#ece5d9] max-w-[260px] lg:max-w-none text-balance lg:whitespace-nowrap"
            >
              {t('hero.desc')}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-9 w-full max-w-[300px] lg:max-w-none mt-2 lg:mt-0">
            <Link
              to={paths('portfolio')}
              style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 2s)', ...getContentStyle('hero.portfolio') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none btn btn-on-dark bg-cream text-ink-900 text-center text-[11px] lg:text-[12px] font-semibold tracking-[0.2em] uppercase py-[19px] lg:py-[18px] lg:px-[30px] border border-cream"
            >
              {t('hero.portfolio')}<span className="hidden lg:inline"> →</span>
            </Link>
            {/* A framed button on a phone, where a bare link is easy to miss; on
                a desktop the board has it as a quiet underlined link */}
            <Link
              to={paths('contact')}
              style={{ animationDelay: 'calc(var(--intro-delay, 0s) + 2.2s)', ...getContentStyle('hero.inquire') }}
              className="opacity-0 animate-[fadeUp_1s_ease_both] motion-reduce:opacity-100 motion-reduce:animate-none btn [--btn-fill:rgba(255,255,255,.2)] lg:[--btn-fill:transparent] text-white text-center text-[11px] lg:text-[12px] font-medium tracking-[0.2em] lg:tracking-[0.22em] uppercase py-[19px] border border-white/55 lg:py-3.5 lg:border-0 lg:border-b lg:border-b-white/50 lg:hover:text-cream"
            >
              {t('hero.inquire')}<span className="hidden lg:inline"> →</span>
            </Link>
          </div>
        </div>

        {/* One tick per frame, each filling over the 4s its frame is on screen.
            Centred under the buttons on a phone, at the lower right on a desktop. */}
        {many && (
          <div
            className="relative z-[3] flex justify-center gap-2.5 -mt-5 mb-4 lg:m-0 lg:absolute lg:right-24 lg:bottom-[47px]"
          >
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                aria-label={`Slika ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                className="flex items-center h-11 w-7 lg:w-11 p-0 border-0 cursor-pointer"
              >
                <span className="block w-full h-0.5 bg-white/30 overflow-hidden">
                  <span
                    // Re-keyed per turn so the fill restarts with each frame
                    key={i === active ? `on-${slide}` : 'off'}
                    className="block h-full bg-white origin-left motion-reduce:animate-none"
                    style={i === active
                      ? {
                          animation: reduceMotion.current
                            ? undefined
                            : `tickFill ${SLIDE_MS}ms linear ${!turned ? CURTAIN_MS : 0}ms both`,
                          animationPlayState: paused ? 'paused' : 'running',
                          transform: reduceMotion.current ? 'scaleX(1)' : undefined,
                        }
                      : { transform: 'scaleX(0)' }}
                  />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="hidden lg:flex absolute bottom-14 left-1/2 -translate-x-1/2 z-[2] flex-col items-center gap-3">
          <span style={getContentStyle('home.scroll')} className="text-[12px] tracking-[0.3em] uppercase text-rule">
            {t('home.scroll')}
          </span>
          <span aria-hidden="true" className="w-px h-12 bg-[linear-gradient(#ffffff,rgba(255,255,255,0))]" />
        </div>
      </section>

      {/* ── Featured stories: the fan ─────────────────────────────────────
          Fewer than three stories chosen and the section is left out
          altogether rather than looking half empty. */}
      {fan && fan.length >= 3 && (
        <section id="radovi" className="relative overflow-x-clip bg-cream pt-[72px] pb-20 lg:pt-32 lg:pb-32">
          <OliveBranch className="hidden lg:block absolute bottom-5 w-[260px] left-[calc(50%-600px)]" />
          <OliveBranch className="hidden lg:block absolute bottom-5 w-[260px] right-[calc(50%-600px)]" flip />

          <StoryFan
            stories={fan}
            heading={
              <>
                <SectionLabel centered="mobile" className="mb-6 lg:mb-7" style={getContentStyle('home.featured.title')}>
                  {t('home.featured.title')}
                </SectionLabel>
                <h2 className="font-serif font-normal text-[clamp(28px,8.7vw,34px)] lg:text-[clamp(38px,3.4vw,48px)] leading-[1.12] lg:leading-[1.1] m-0">
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
                        viewBox="0 0 24 22" fill="#a8323e" aria-hidden="true"
                        className="inline-block w-[22px] h-5 lg:w-[30px] lg:h-[27px] origin-center animate-[heartbeat_4s_ease-in-out_infinite] motion-reduce:animate-none"
                      >
                        <path d="M12 21.2C5.2 15.4 1.5 11.9 1.5 7.4 1.5 4.2 4 1.8 7 1.8c1.9 0 3.7 1 5 2.8 1.3-1.8 3.1-2.8 5-2.8 3 0 5.5 2.4 5.5 5.6 0 4.5-3.7 8-10.5 13.8z" />
                      </svg>
                    </span>
                  </span>
                </h2>
              </>
            }
            cta={
              <div className="relative flex justify-center mt-11 lg:mt-16 px-5">
                <Link
                  to={paths('portfolio')}
                  style={getContentStyle('home.featured.cta')}
                  className="btn relative inline-block border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] uppercase px-7 py-[18px] lg:py-4 hover:text-white"
                >
                  {t('home.featured.cta')} →
                </Link>
              </div>
            }
          />
        </section>
      )}

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section id="onama" className="relative overflow-x-clip bg-cream-light pt-[72px] pb-20 lg:py-32 px-6 lg:px-24">
        <OliveBranch className="hidden lg:block absolute left-24 top-9 w-[170px] opacity-[0.22]" />

        <div className="home-about relative max-w-[1248px] mx-auto text-center lg:text-left">
          <div className="ha-text">
            <SectionLabel
              centered="mobile"
              className="mb-6 lg:mb-7"
              style={getContentStyle('home.about.tag')}
            >
              {t('home.about.tag')}
            </SectionLabel>

            <Reveal as="h2" className="font-serif font-normal text-[clamp(26px,7.7vw,30px)] lg:text-[clamp(38px,3.2vw,46px)] leading-[1.16] lg:leading-[1.12] m-0 mb-6 lg:mb-8">
              <span style={getContentStyle('home.about.heading.part1')}>{t('home.about.heading.part1')}</span>
              <br />
              <span className="italic" style={getContentStyle('home.about.heading.part2')}>
                <Emphasis text={t('home.about.heading.part2')} className="text-love" />
              </span>
            </Reveal>

            {(['1', '2'] as const).map((n, i) => (
              <Reveal
                as="p"
                key={n}
                delay={0.08 + i * 0.08}
                style={getContentStyle(`home.about.desc.${n}`)}
                className={`text-[15px] lg:text-[16px] font-light leading-[1.8] lg:leading-[1.75] text-ink-700 max-w-[320px] lg:max-w-[480px] mx-auto lg:mx-0 m-0 ${
                  i === 0 ? 'mb-4 lg:mb-6' : 'mb-10 lg:mb-12'
                }`}
              >
                {t(`home.about.desc.${n}`)}
              </Reveal>
            ))}
          </div>

          {/* The pile: five prints thrown on a table, overlapping at their own
              angles. Each slides in from its side as the section arrives and
              settles into its tilt; on a desktop they drift at different speeds
              while the section scrolls by, and the one under the mouse lifts
              and straightens. */}
          <div className="ha-image relative mb-11 lg:mb-0 lg:py-2">
            <div className="relative h-[400px] lg:h-[620px]">
              {PILE.map((ph, i) => {
                const r = respImg(pileSrc(ph.key, i));
                return (
                  <div
                    key={ph.key}
                    className="pile-item absolute"
                    style={{ ...ph.pos, width: ph.w, zIndex: i + 1, '--pp': `${ph.px}px` } as unknown as React.CSSProperties}
                  >
                    <Reveal
                      kind="pile"
                      delay={i * 0.12}
                      style={{
                        '--r': `${ph.r}deg`,
                        '--ex': `${ph.from[0]}px`,
                        '--ey': `${ph.from[1]}px`,
                        '--er': `${ph.from[2]}deg`,
                      } as React.CSSProperties}
                    >
                      <div className="pile-photo relative overflow-hidden rounded-[3px] border-[3px] border-cream-light bg-rule" style={{ aspectRatio: ph.ratio }}>
                        <img
                          src={r.src}
                          srcSet={r.srcSet}
                          sizes="(min-width: 1024px) 22vw, 45vw"
                          alt={altFor(ph.key)}
                          style={{ objectPosition: focusFor(ph.key) || undefined }}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Like "Pošaljite upit" in the hero: a quiet underlined link on a
              desktop, a thin framed button on a phone, under the photographs */}
          <div className="ha-btn">
            <Link
              to={paths('about')}
              style={getContentStyle('home.about.cta')}
              className="btn [--btn-fill:#151311] lg:[--btn-fill:transparent] inline-block text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] lg:tracking-[0.22em] uppercase px-[30px] py-[19px] border border-ink-900/55 hover:text-white lg:px-0 lg:py-3.5 lg:border-0 lg:border-b lg:border-b-ink-900/50 lg:hover:text-ink-900"
            >
              {t('home.about.cta')} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
