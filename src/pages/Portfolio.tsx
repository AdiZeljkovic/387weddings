import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg, SIZES } from '../lib/img';
import { cardRatio } from '../lib/imageMeta';
import { OliveBranch, SectionLabel, DiamondRule } from '../components/ornaments';
import Reveal from '../components/Reveal';
import Emphasis from '../components/Emphasis';
import { usePaths } from '../lib/routes';

const categories = ['ALL', 'WEDDINGS', 'STUDIO', 'PORTRAITS'] as const;
type Category = typeof categories[number];

const CATEGORY_KEYS: Record<Category, string> = {
  ALL:       'portfolio.filter.all',
  WEDDINGS:  'portfolio.filter.weddings',
  STUDIO:    'portfolio.filter.studio',
  PORTRAITS: 'portfolio.filter.portraits',
};

// The card label uses the singular form the mockup shows ("Vjenčanje")
const CARD_LABEL_KEYS: Record<string, string> = {
  WEDDINGS:  'portfolio.card.wedding',
  STUDIO:    'portfolio.card.studio',
  PORTRAITS: 'portfolio.card.portrait',
};

interface StoryCard {
  id: number;
  slug: string | null;
  couple: string | null;
  category: string;
  cover_url: string | null;
  cover_alt: string | null;
  cover_layout: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_focus: string | null;
}

// One column on a phone, three above it — the brief is explicit
const colsFor = (w: number) => (w < 820 ? 1 : w < 1100 ? 2 : 3);

// How far each column starts below the first: three columns 0 / 96 / 48px,
// two columns 0 / 64px, one column none
const COL_OFFSET: Record<number, number[]> = { 1: [0], 2: [0, 64], 3: [0, 96, 48] };

// "Amra & Tarik" — the ampersand is set in italic red, as in the mockup
const CoupleName = ({ name, className = '' }: { name: string; className?: string }) => {
  const parts = name.split(/\s*&\s*/);
  if (parts.length < 2) return <span className={className}>{name}</span>;
  return (
    <span className={className}>
      {parts[0]} <span className="italic text-love">&amp;</span> {parts.slice(1).join(' & ')}
    </span>
  );
};

const Portfolio = () => {
  const { t, getContentStyle } = useLanguage();
  const paths = usePaths();
  const [searchParams] = useSearchParams();
  const initialCat = (searchParams.get('cat') || '').toUpperCase();
  const [activeFilter, setActiveFilter] = useState<Category>(
    (categories as readonly string[]).includes(initialCat) ? initialCat as Category : 'ALL'
  );
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cols, setCols] = useState(() => (typeof window === 'undefined' ? 3 : colsFor(window.innerWidth)));

  useEffect(() => {
    fetch('/api/stories')
      .then(r => (r.ok ? r.json() : []))
      .then(d => { setStories(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const onResize = () => setCols(colsFor(window.innerWidth));
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered = useMemo(
    () => (activeFilter === 'ALL' ? stories : stories.filter(s => s.category === activeFilter)),
    [stories, activeFilter]
  );

  // The board's layout: cards dealt into the columns in turn — 1st to the
  // first, 2nd to the second, 3rd to the third, 4th back to the first — and
  // each column stacked on its own, so cards never sit in level rows. The
  // columns also start at different heights (see COL_OFFSET), so even a page of
  // identical upright cards reads as scattered.
  const columns = useMemo(() => {
    const out: { item: StoryCard; index: number; ratio: number }[][] =
      Array.from({ length: cols }, () => []);
    filtered.forEach((item, index) => out[index % cols].push({
      item, index, ratio: cardRatio(item.cover_layout, item.cover_width, item.cover_height),
    }));
    return out;
  }, [filtered, cols]);

  const handle = settings.instagram_handle || '387.weddings';
  const instagramUrl = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : `https://instagram.com/${handle}`;

  return (
    <div className="bg-cream">
      {/* ── Opener ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-center px-6 lg:px-24 pt-12 lg:pt-20 pb-9 lg:pb-16">
        <OliveBranch className="hidden lg:block absolute left-[140px] top-[84px] w-[340px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <OliveBranch className="hidden lg:block absolute right-[140px] top-[84px] w-[340px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />

        <div className="relative">
          {/* The board has a small ruled label above the title */}
          <SectionLabel centered line="lg:w-10" className="mb-[22px] lg:mb-7" style={getContentStyle('portfolio.hero.tag')}>
            {t('portfolio.hero.tag')}
          </SectionLabel>

          <Reveal
            as="h1"
            style={getContentStyle('portfolio.hero.title')}
            className="font-serif font-normal text-[clamp(30px,9.8vw,38px)] lg:text-[clamp(44px,4.45vw,64px)] leading-[1.1] lg:leading-[1.08] lg:tracking-[0.005em] m-0 mb-5 lg:mb-9"
          >
            {t('portfolio.hero.title')}{' '}
            <span className="italic text-love" style={getContentStyle('portfolio.hero.subtitle')}>
              {t('portfolio.hero.subtitle')}
            </span>
          </Reveal>

          <Reveal
            as="p"
            delay={0.1}
            style={getContentStyle('portfolio.approach.desc')}
            className="text-[15px] lg:text-[16px] font-light leading-[1.8] lg:leading-[1.85] text-ink-700 max-w-[320px] lg:max-w-[560px] mx-auto text-balance"
          >
            <Emphasis
              text={t('portfolio.approach.desc')}
              className="font-serif italic font-normal text-love text-[17px] lg:text-[21px]"
            />
          </Reveal>
        </div>
      </section>

      {/* ── Filters + cards ────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-24 pb-[72px] lg:pb-32 pt-2 lg:pt-6">
        <div className="max-w-[1248px] mx-auto">
          <nav
            aria-label="Filter radova"
            className="flex flex-nowrap lg:flex-wrap justify-center gap-x-1 lg:gap-x-2 border-b border-rule max-w-[640px] mx-auto mb-10 lg:mb-16"
          >
            {categories.map(c => {
              const active = activeFilter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveFilter(c)}
                  aria-pressed={active}
                  style={getContentStyle(CATEGORY_KEYS[c])}
                  className={`flex-none whitespace-nowrap text-[11px] lg:text-[12px] tracking-[0.16em] lg:tracking-[0.24em] uppercase px-3 lg:px-7 py-4 lg:py-[18px] min-h-11 transition-colors duration-250 ${
                    active
                      ? 'text-ink-900 font-semibold border-b-2 border-love -mb-px'
                      : 'text-ink-500 font-medium hover:text-ink-900'
                  }`}
                >
                  {t(CATEGORY_KEYS[c])}
                </button>
              );
            })}
          </nav>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-x-8 lg:gap-y-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${['aspect-[3/4]', 'aspect-[4/3]'][i % 2]} bg-rule/40 animate-pulse`} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p
              style={getContentStyle('portfolio.empty')}
              className="text-center py-24 font-serif text-lg text-ink-400"
            >
              {t('portfolio.empty')}
            </p>
          ) : (
            <div className="flex gap-8 items-start">
              {columns.map((col, ci) => (
                <div
                  key={ci}
                  className="flex-1 min-w-0 flex flex-col gap-11 lg:gap-12"
                  style={{ paddingTop: (COL_OFFSET[cols] ?? [])[ci] || 0 }}
                >
                  {col.map(({ item, index, ratio }, ri) => {
                    const n = index + 1;
                    const src = item.cover_url || '';
                    const r = respImg(src);
                    const label = CARD_LABEL_KEYS[item.category];
                    return (
                      <Link
                        key={item.id}
                        to={paths('portfolio', item.slug)}
                        className="work-card group block text-ink-900 cursor-pointer"
                      >
                        <div className="overflow-hidden">
                          {/* The frame follows the photograph's own shape */}
                          <Reveal
                            kind="mask"
                            delay={ci * 0.12 + ri * 0.06}
                            className="zoom bg-rule"
                            style={{ aspectRatio: String(ratio) }}
                          >
                            <img
                              src={r.src}
                              srcSet={r.srcSet}
                              sizes={SIZES.card}
                              alt={item.cover_alt || item.couple || ''}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: item.cover_focus || undefined }}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              referrerPolicy="no-referrer"
                            />
                          </Reveal>
                        </div>

                        {/* Centred under the card on a phone, ranged left above it */}
                        <Reveal
                          className="flex items-baseline justify-center lg:justify-start gap-3.5 mt-[18px] lg:mt-5"
                          delay={ci * 0.12 + ri * 0.06 + 0.1}
                        >
                          <span className="text-[11px] font-medium tracking-[0.2em] text-gold-600">
                            {String(n).padStart(2, '0')}
                          </span>
                          <span
                            style={label ? getContentStyle(label) : undefined}
                            className="text-[10px] font-medium tracking-[0.26em] uppercase text-ink-400"
                          >
                            {label ? t(label) : ''}
                          </span>
                          <span
                            aria-hidden="true"
                            className="hidden lg:block ml-auto text-ink-900 text-sm opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                          >
                            →
                          </span>
                        </Reveal>

                        {item.couple && (
                          <Reveal delay={ci * 0.12 + ri * 0.06 + 0.14}>
                            <CoupleName
                              name={item.couple}
                              className="block font-serif text-[28px] lg:text-[32px] leading-[1.2] mt-1.5 lg:mt-2 text-center lg:text-left"
                            />
                          </Reveal>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Closing Instagram block ──────────────────────────────────── */}
          <div className="max-w-[720px] mx-auto text-center mt-[72px] lg:mt-32">
            <DiamondRule className="mb-7 lg:mb-8" />
            <div
              style={getContentStyle('instagram.tag')}
              className="text-[11px] lg:text-[12px] tracking-[0.32em] uppercase text-gold-label mb-5"
            >
              {t('instagram.tag')}
            </div>
            <Reveal as="h2" className="font-serif font-normal text-[clamp(26px,7.7vw,30px)] lg:text-[38px] leading-[1.18] m-0 mb-[30px]">
              <span style={getContentStyle('instagram.title.part1')}>{t('instagram.title.part1')}</span>{' '}
              <span className="italic" style={getContentStyle('instagram.title.part2')}>
                {t('instagram.title.part2')}
              </span>
            </Reveal>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex items-center gap-3.5 border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.22em] uppercase px-7 py-4 hover:text-white group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r=".8" fill="currentColor" />
              </svg>
              @{handle} →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
