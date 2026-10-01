import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { respImg } from '../lib/img';
import { EASE } from '../components/anim';

const categories = ['ALL', 'WEDDINGS', 'STUDIO', 'PORTRAITS'] as const;
type Category = typeof categories[number];

const CATEGORY_KEYS: Record<Category, string> = {
  ALL:       'portfolio.filter.all',
  WEDDINGS:  'portfolio.filter.weddings',
  STUDIO:    'portfolio.filter.studio',
  PORTRAITS: 'portfolio.filter.portraits',
};

interface GalleryImage {
  id: number;
  url: string;
  category: 'WEDDINGS' | 'STUDIO' | 'PORTRAITS';
  layout: 'TALL' | 'WIDE' | 'SQUARE';
  title: string | null;
  location: string | null;
}

// In a masonry column every tile shares the column width — only height varies.
// The admin's layout choice therefore maps to an aspect ratio, not a span.
const ASPECT: Record<string, string> = {
  TALL:   'aspect-[3/4]',
  SQUARE: 'aspect-square',
  WIDE:   'aspect-[4/3]',
};
// Relative height per aspect, used to balance the columns while packing
const WEIGHT: Record<string, number> = { TALL: 1.333, SQUARE: 1, WIDE: 0.75 };

// Two columns carry the page up to a very wide viewport, so every frame is
// roughly twice the size it used to be — the gallery is the page here, not a
// grid of thumbnails.
const colsFor = (w: number) => (w < 700 ? 1 : w < 1536 ? 2 : 3);

const useColumnCount = () => {
  const [cols, setCols] = useState(() =>
    typeof window === 'undefined' ? 2 : colsFor(window.innerWidth)
  );
  useEffect(() => {
    const onResize = () => setCols(colsFor(window.innerWidth));
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
};

const Portfolio = () => {
  const { t, getContentStyle } = useLanguage();
  // Home collection cards link here as /portfolio?cat=WEDDINGS|STUDIO|PORTRAITS
  const [searchParams] = useSearchParams();
  const initialCat = (searchParams.get('cat') || '').toUpperCase();
  const [activeFilter, setActiveFilter] = useState<Category>(
    (categories as readonly string[]).includes(initialCat) ? initialCat as Category : 'ALL'
  );
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const cols = useColumnCount();

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(data => { setImages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(
    () => (activeFilter === 'ALL' ? images : images.filter(i => i.category === activeFilter)),
    [images, activeFilter]
  );

  // Greedy masonry packing — each tile joins the currently shortest column,
  // so columns end up near-equal height and tiles stagger naturally.
  const columns = useMemo(() => {
    const buckets: GalleryImage[][] = Array.from({ length: cols }, () => []);
    const heights = new Array(cols).fill(0);
    for (const item of filteredItems) {
      let shortest = 0;
      for (let c = 1; c < cols; c++) if (heights[c] < heights[shortest]) shortest = c;
      buckets[shortest].push(item);
      heights[shortest] += WEIGHT[item.layout] ?? WEIGHT.TALL;
    }
    return buckets;
  }, [filteredItems, cols]);

  return (
    <div className="bg-canvas-50">
      {/* ── Page opener — quiet title block; the gallery carries the page ──── */}
      <section className="bg-canvas-50 pt-14 md:pt-20 pb-10 md:pb-14 px-6 sm:px-8 lg:px-14">
        <div className="max-w-3xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            style={getContentStyle('portfolio.approach.title')}
            className="block text-[10px] md:text-[11px] tracking-[0.4em] uppercase font-semibold text-ink-500 mb-6"
          >
            {t('portfolio.approach.title')}
          </motion.span>

          <h1 className="font-serif font-light text-ink-900 text-[2.1rem] sm:text-5xl lg:text-[3.4rem] uppercase tracking-[0.08em] leading-[1.15] mb-7">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: EASE }}
              style={getContentStyle('portfolio.hero.title')}
              className="block"
            >
              {t('portfolio.hero.title')}
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
            className="flex items-center justify-center gap-3 mb-7"
            aria-hidden="true"
          >
            <span className="w-12 sm:w-16 h-[1px] bg-gold-500/55" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/70" />
            <span className="w-12 sm:w-16 h-[1px] bg-gold-500/55" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: EASE }}
            style={getContentStyle('portfolio.approach.desc')}
            className="text-ink-500 font-light text-[14px] md:text-[15px] leading-[1.95] max-w-xl mx-auto"
          >
            {t('portfolio.approach.desc')}
          </motion.p>
        </div>
      </section>

      {/* ── Filter + masonry gallery ──────────────────────────────────────── */}
      <section className="bg-canvas-50 pb-20 md:pb-28">
        <div className="px-4 sm:px-6 lg:px-10 max-w-[1800px] mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-14 border-b border-canvas-200 pb-5 mb-10 md:mb-14">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                aria-pressed={activeFilter === category}
                style={getContentStyle(CATEGORY_KEYS[category])}
                className={`relative py-2 text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-semibold transition-colors duration-500 ${
                  activeFilter === category ? 'text-ink-900' : 'text-ink-400 hover:text-ink-900'
                }`}
              >
                {t(CATEGORY_KEYS[category])}
                {activeFilter === category && (
                  <motion.span
                    layoutId="activeFilter"
                    className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-gold-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Gallery */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`${['aspect-[3/4]', 'aspect-square', 'aspect-[4/3]'][i % 3]} bg-canvas-100 animate-pulse`}
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-28">
              <p style={getContentStyle('portfolio.empty')} className="text-lg font-serif font-light text-ink-400">
                {t('portfolio.empty')}
              </p>
            </div>
          ) : (
            <div className="flex gap-5 md:gap-7 items-start">
              {columns.map((col, ci) => (
                <div
                  key={ci}
                  // Odd columns drop half a tile — the "one up, one down" rhythm
                  className={`flex-1 flex flex-col gap-5 md:gap-7 ${ci % 2 === 1 ? 'sm:mt-14 lg:mt-24' : ''}`}
                >
                  <AnimatePresence mode="popLayout">
                    {col.map((item, ii) => {
                      const r = respImg(item.url, [640, 960, 1280]);
                      return (
                        <motion.figure
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
                          transition={{ duration: 0.8, delay: Math.min(ii * 0.05, 0.3), ease: EASE }}
                          className={`${ASPECT[item.layout] ?? ASPECT.TALL} relative overflow-hidden group m-0 bg-canvas-100`}
                        >
                          <img
                            src={r.src}
                            srcSet={r.srcSet}
                            sizes="(min-width: 1536px) 32vw, (min-width: 700px) 48vw, 100vw"
                            alt={item.title || t(CATEGORY_KEYS[item.category as Category] ?? 'portfolio.filter.all')}
                            className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            referrerPolicy="no-referrer"
                          />

                          {/* Caption only exists when the admin filled one in */}
                          {(item.title || item.location) && (
                            <>
                              <div
                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700"
                                aria-hidden="true"
                              />
                              <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8 opacity-100 translate-y-0 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-700">
                                {item.title && (
                                  <span className="text-white font-serif text-xl md:text-2xl font-light block leading-tight">
                                    {item.title}
                                  </span>
                                )}
                                {item.location && (
                                  <span className="text-white/70 text-[10px] tracking-[0.25em] uppercase block mt-1.5">
                                    {item.location}
                                  </span>
                                )}
                              </figcaption>
                            </>
                          )}
                        </motion.figure>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
