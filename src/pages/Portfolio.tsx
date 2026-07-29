import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, SectionTag, WordReveal } from '../components/anim';

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

const colsFor = (w: number) => (w < 640 ? 1 : w < 1024 ? 2 : w < 1280 ? 3 : 4);

const useColumnCount = () => {
  const [cols, setCols] = useState(() =>
    typeof window === 'undefined' ? 4 : colsFor(window.innerWidth)
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
  const [settings, setSettings] = useState<Record<string, string>>({});
  const cols = useColumnCount();

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(data => { setImages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    loadSettings().then(setSettings).catch(err => console.warn('Portfolio: settings load failed', err));
  }, []);

  // Backdrop for the closing plate — reuses the slot the removed hero freed up
  const ctaBackdrop = respImg(
    settings['img.portfolio.hero'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600',
    [768, 1280, 1920],
  );

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
    <div className="bg-white overflow-hidden">
      {/* ── Page opener (no image hero — gallery leads the page) ───────────── */}
      <section className="bg-white pt-16 md:pt-24 pb-14 md:pb-20 px-6 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTag style={getContentStyle('portfolio.approach.title')} className="mb-7">
            {t('portfolio.approach.title')}
          </SectionTag>

          <h1
            style={getContentStyle('portfolio.hero.title')}
            aria-label={t('portfolio.hero.title')}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 leading-[0.98] tracking-tight uppercase mb-5"
          >
            <WordReveal
              words={t('portfolio.hero.title').split(' ').filter(Boolean).map(w => ({ w }))}
              delay={0.15}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: EASE }}
            style={getContentStyle('portfolio.hero.subtitle')}
            className="font-serif italic text-lg md:text-xl text-gold-600 mb-9"
          >
            {t('portfolio.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
            className="w-16 h-[1px] bg-gold-600/50 mx-auto mb-10"
            aria-hidden="true"
          />

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-moody-900 leading-[1.15] mb-7">
            <WordReveal
              words={[
                ...t('portfolio.approach.heading').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('portfolio.approach.heading') })),
                ...t('portfolio.approach.subheading').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('portfolio.approach.subheading'), italic: true })),
              ]}
              delay={0.5}
            />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8, ease: EASE }}
            style={getContentStyle('portfolio.approach.desc')}
            className="text-moody-900/65 font-light text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            {t('portfolio.approach.desc')}
          </motion.p>
        </div>
      </section>

      {/* ── Filter + masonry gallery ──────────────────────────────────────── */}
      <section className="bg-gold-50/60 pt-4 pb-24 md:pb-32">
        <div className="px-6 sm:px-8 lg:px-16 max-w-[1700px] mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-14 border-b border-gold-600/15 pb-6 mb-12 md:mb-16">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                aria-pressed={activeFilter === category}
                className={`relative py-2 text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold transition-colors duration-500 ${
                  activeFilter === category ? 'text-gold-600' : 'text-moody-900/40 hover:text-moody-900'
                }`}
              >
                {t(CATEGORY_KEYS[category])}
                {activeFilter === category && (
                  <motion.span
                    layoutId="activeFilter"
                    className="absolute -bottom-[25px] left-0 right-0 h-[2px] bg-gold-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Gallery */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`${['aspect-[3/4]', 'aspect-square', 'aspect-[4/3]'][i % 3]} bg-moody-900/[0.06] animate-pulse`}
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-28 text-moody-900/35">
              <p style={getContentStyle('portfolio.empty')} className="text-lg font-serif font-light">
                {t('portfolio.empty')}
              </p>
            </div>
          ) : (
            <div className="flex gap-4 md:gap-6 items-start">
              {columns.map((col, ci) => (
                <div
                  key={ci}
                  // Middle column drops half a tile — the "one up, one down" rhythm
                  className={`flex-1 flex flex-col gap-4 md:gap-6 ${ci % 2 === 1 ? 'sm:mt-12 lg:mt-20' : ''}`}
                >
                  <AnimatePresence mode="popLayout">
                    {col.map((item, ii) => {
                      const r = respImg(item.url, [480, 640, 960]);
                      return (
                        <motion.figure
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 34, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35 } }}
                          transition={{ duration: 0.85, delay: Math.min(ii * 0.06, 0.35), ease: EASE }}
                          className={`${ASPECT[item.layout] ?? ASPECT.TALL} relative overflow-hidden group m-0 bg-moody-900/5`}
                        >
                          <img
                            src={r.src}
                            srcSet={r.srcSet}
                            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                            alt={item.title || t(CATEGORY_KEYS[item.category as Category] ?? 'portfolio.filter.all')}
                            className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            referrerPolicy="no-referrer"
                          />
                          {/* Caption veil — always on for touch, hover-reveal on pointer devices */}
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700"
                            aria-hidden="true"
                          />
                          <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-7 opacity-100 translate-y-0 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-700">
                            <span className="text-gold-300 text-[9px] tracking-[0.4em] uppercase font-bold block mb-1.5">
                              {t(CATEGORY_KEYS[item.category as Category] ?? 'portfolio.filter.all')}
                            </span>
                            {item.title && (
                              <span className="text-white font-serif text-xl md:text-2xl font-light block leading-tight">
                                {item.title}
                              </span>
                            )}
                            {item.location && (
                              <span className="text-white/60 text-[10px] tracking-[0.2em] uppercase block mt-1">
                                {item.location}
                              </span>
                            )}
                          </figcaption>
                          {/* Thin inner frame on hover */}
                          <div
                            className="absolute inset-3 border border-white/0 group-hover:border-white/20 transition-colors duration-700 pointer-events-none"
                            aria-hidden="true"
                          />
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

      {/* ── Inquire CTA — full-bleed cinematic closer into the dark footer ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 sm:px-8 py-28 md:py-40 text-center overflow-hidden bg-moody-950">
        <ParallaxY from={-50} to={50} className="absolute inset-0">
          <img
            src={ctaBackdrop.src}
            srcSet={ctaBackdrop.srcSet}
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
        <div
          className="absolute -right-10 top-1/2 -translate-y-1/2 text-[16rem] lg:text-[22rem] font-script text-white/[0.04] leading-none select-none pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
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

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light text-white leading-[1.05] mb-12 md:mb-14">
            <WordReveal
              words={[
                ...t('portfolio.ready').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('portfolio.ready') })),
                ...t('portfolio.dialogue').split(' ').filter(Boolean).map(w => ({ w, style: getContentStyle('portfolio.dialogue'), italic: true })),
              ]}
            />
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.45, ease: EASE }}
            className="flex justify-center"
          >
            <Link
              to="/contact"
              className="group relative inline-block px-14 md:px-16 py-5 overflow-hidden whitespace-nowrap bg-gold-600 hover:bg-gold-500 rounded-full text-center shadow-xl shadow-gold-600/30 animate-[ctaPulse_3s_ease-in-out_infinite] transition-colors duration-500"
            >
              <span
                style={getContentStyle('portfolio.cta.button')}
                className="relative z-10 text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold text-white flex items-center justify-center gap-3"
              >
                {t('portfolio.cta.button')}
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
