import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { OliveBranch, SectionLabel, DiamondRule } from '../components/ornaments';

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
  legacy?: boolean;
}

const ASPECT: Record<string, string> = {
  TALL:   'aspect-[3/4]',
  WIDE:   'aspect-[4/3]',
  SQUARE: 'aspect-square',
};

const colsFor = (w: number) => (w < 700 ? 1 : w < 1100 ? 2 : 3);

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

  // Columns are filled round-robin, so the numbering reads 01/04/07 down the
  // first column — exactly how the board lays it out.
  const columns = useMemo(() => {
    const buckets: { item: StoryCard; n: number }[][] = Array.from({ length: cols }, () => []);
    filtered.forEach((item, i) => buckets[i % cols].push({ item, n: i + 1 }));
    return buckets;
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
          <SectionLabel centered className="mb-6 lg:mb-7" style={getContentStyle('portfolio.approach.title')}>
            {t('portfolio.approach.title')}
          </SectionLabel>

          <h1
            style={getContentStyle('portfolio.hero.title')}
            className="font-serif font-normal text-[48px] lg:text-[96px] leading-[1.05] lg:tracking-[0.005em] m-0 mb-6 lg:mb-9"
          >
            {t('portfolio.hero.title')}{' '}
            <span className="italic text-love" style={getContentStyle('portfolio.hero.subtitle')}>
              {t('portfolio.hero.subtitle')}
            </span>
          </h1>

          <p
            style={getContentStyle('portfolio.approach.desc')}
            className="text-[15px] lg:text-[18px] font-light leading-[1.8] lg:leading-[1.85] text-ink-700 max-w-[320px] lg:max-w-[560px] mx-auto text-balance"
          >
            {t('portfolio.approach.desc')}
          </p>
        </div>
      </section>

      {/* ── Filters + cards ────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-24 pb-[72px] lg:pb-32 pt-2 lg:pt-6">
        <div className="max-w-[1248px] mx-auto">
          <nav
            aria-label="Filter radova"
            className="flex flex-wrap justify-center gap-x-2 gap-y-1 border-b border-rule max-w-[640px] mx-auto mb-10 lg:mb-16"
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
                  className={`text-[11px] lg:text-[12px] tracking-[0.2em] lg:tracking-[0.24em] uppercase px-3 lg:px-7 py-4 lg:py-[18px] transition-colors duration-250 ${
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
            <div className="flex gap-5 lg:gap-8 items-start">
              {columns.map((col, ci) => (
                <div key={ci} className="flex-1 min-w-0 flex flex-col gap-11 lg:gap-12">
                  {col.map(({ item, n }) => {
                    const src = item.cover_url || '';
                    const r = respImg(src, [480, 768, 1100]);
                    const label = CARD_LABEL_KEYS[item.category];
                    const Card = item.slug ? Link : 'div';
                    const cardProps = item.slug ? { to: `/prica/${item.slug}` } : {};

                    return (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      <Card key={item.id} {...(cardProps as any)} className="group block text-ink-900">
                        <div className="overflow-hidden">
                          <div className={`${ASPECT[item.cover_layout || 'TALL'] ?? ASPECT.TALL} overflow-hidden bg-rule`}>
                            <img
                              src={r.src}
                              srcSet={r.srcSet}
                              sizes="(min-width: 1100px) 32vw, (min-width: 700px) 48vw, 100vw"
                              alt={item.cover_alt || item.couple || ''}
                              className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(.2,.6,.2,1)] group-hover:scale-[1.045] motion-reduce:transition-none"
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        <div className="flex items-baseline gap-3.5 mt-[18px] lg:mt-5">
                          <span className="text-[11px] font-medium tracking-[0.2em] text-gold-600">
                            {String(n).padStart(2, '0')}
                          </span>
                          <span
                            style={label ? getContentStyle(label) : undefined}
                            className="text-[10px] font-medium tracking-[0.26em] uppercase text-ink-400"
                          >
                            {label ? t(label) : ''}
                          </span>
                          {item.slug && (
                            <span
                              aria-hidden="true"
                              className="ml-auto text-ink-900 text-sm opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                            >
                              →
                            </span>
                          )}
                        </div>

                        {item.couple && (
                          <CoupleName
                            name={item.couple}
                            className="block font-serif text-[28px] lg:text-[32px] leading-[1.2] mt-1.5 lg:mt-2"
                          />
                        )}
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Closing Instagram block ──────────────────────────────────── */}
          <div className="text-center mt-[72px] lg:mt-32">
            <DiamondRule className="mb-6 lg:mb-7" />
            <div
              style={getContentStyle('instagram.tag')}
              className="text-[11px] lg:text-[12px] tracking-[0.32em] uppercase text-gold-label mb-4"
            >
              {t('instagram.tag')}
            </div>
            <h2 className="font-serif font-normal text-[32px] lg:text-[44px] leading-[1.2] m-0 mb-7">
              <span style={getContentStyle('instagram.title.part1')}>{t('instagram.title.part1')}</span>{' '}
              <span className="italic" style={getContentStyle('instagram.title.part2')}>
                {t('instagram.title.part2')}
              </span>
            </h2>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] uppercase px-7 lg:px-9 py-[17px] lg:py-5 transition-colors duration-250 hover:bg-ink-900 hover:text-white group"
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
