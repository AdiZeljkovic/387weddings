import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

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

const layoutClass: Record<string, string> = {
  WIDE:   'col-span-12 md:col-span-8 aspect-[3/2]',
  TALL:   'col-span-12 md:col-span-4 aspect-[3/4]',
  SQUARE: 'col-span-12 md:col-span-6 aspect-square',
};

const Portfolio = () => {
  const { t, getContentStyle } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<Category>('ALL');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(data => { setImages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    loadSettings().then(setSettings).catch(err => console.warn('Portfolio: settings load failed', err));
  }, []);

  const filteredItems = activeFilter === 'ALL'
    ? images
    : images.filter(item => item.category === activeFilter);

  return (
    <div className="bg-gold-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-moody-950">
        <div className="grain opacity-[0.05]" />
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            src={settings['img.portfolio.hero'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'}
            alt="Portfolio Hero"
            className="w-full h-full object-cover grayscale brightness-75"
            loading="eager"
            fetchPriority="high"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="space-y-6"
          >
            <h1 style={getContentStyle('portfolio.hero.title')} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white leading-none tracking-tighter uppercase">
              {t('portfolio.hero.title')}
            </h1>
            <p style={getContentStyle('portfolio.hero.subtitle')} className="text-white/60 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
              {t('portfolio.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="grain opacity-[0.02]" />

      {/* Approach Section */}
      <section className="py-20 md:py-32 px-6 sm:px-8 lg:px-16 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="space-y-10"
        >
          <span style={getContentStyle('portfolio.approach.title')} className="luxury-text-sm block">{t('portfolio.approach.title')}</span>
          <h2 className="text-4xl md:text-7xl font-serif font-light text-moody-900 leading-tight">
            <span style={getContentStyle('portfolio.approach.heading')}>{t('portfolio.approach.heading')}</span> <br />
            <span style={getContentStyle('portfolio.approach.subheading')} className="italic opacity-40">{t('portfolio.approach.subheading')}</span>
          </h2>
          <p style={getContentStyle('portfolio.approach.desc')} className="text-moody-900/60 font-light text-base md:text-xl leading-relaxed max-w-3xl mx-auto italic">
            {t('portfolio.approach.desc')}
          </p>
        </motion.div>
      </section>

      {/* Filter Section */}
      <section className="px-6 sm:px-8 lg:px-16 max-w-[1600px] mx-auto mb-12 md:mb-16">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-b border-gold-600/10 pb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold transition-all duration-500 relative py-2 ${
                activeFilter === category ? 'text-gold-600' : 'text-moody-900/40 hover:text-moody-900'
              }`}
            >
              {t(CATEGORY_KEYS[category]) || category}
              {activeFilter === category && (
                <motion.div 
                  layoutId="activeFilter"
                  className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="px-6 sm:px-8 lg:px-16 max-w-[1600px] mx-auto mb-24 md:mb-32">
        {loading ? (
          <div className="grid grid-cols-12 gap-2 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${['col-span-12 md:col-span-4 aspect-[3/4]','col-span-12 md:col-span-8 aspect-[3/2]','col-span-12 md:col-span-6 aspect-square'][i % 3]} bg-moody-200/40 rounded-sm animate-pulse`} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 text-moody-900/30">
            <p className="text-lg font-serif font-light">{t('portfolio.empty')}</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-12 gap-2 md:gap-4 grid-flow-dense">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`${layoutClass[item.layout] ?? layoutClass['TALL']} overflow-hidden rounded-sm group relative`}
                >
                  <img
                    src={item.url}
                    alt={item.title || item.category}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 md:p-10">
                    <div>
                      <span className="text-white text-[10px] tracking-[0.3em] uppercase font-bold block">
                        {item.category}
                      </span>
                      {item.title && <span className="text-white/70 text-xs mt-1 block">{item.title}</span>}
                      {item.location && <span className="text-white/40 text-[10px] block">{item.location}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Inquire Section */}
      <section className="py-24 md:py-40 px-6 sm:px-8 lg:px-16 bg-gold-100/30 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="space-y-12"
        >
          <h2 className="text-5xl md:text-8xl font-serif font-light text-moody-900 leading-tight">
            <span style={getContentStyle('portfolio.ready')}>{t('portfolio.ready')}</span> <br />
            <span style={getContentStyle('portfolio.dialogue')} className="italic opacity-30">{t('portfolio.dialogue')}</span>
          </h2>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-4 md:gap-8 group"
          >
            <span className="text-[10px] md:text-[12px] tracking-[0.5em] md:tracking-[0.7em] uppercase text-gold-600 font-medium group-hover:text-moody-900 transition-colors duration-500">
              {t('portfolio.cta.button') || t('hero.inquire')}
            </span>
            <div className="w-12 md:w-20 h-[1px] bg-gold-600/30 group-hover:bg-gold-600/60 lg:group-hover:w-40 transition-all duration-1000" />
            <ArrowRight size={20} strokeWidth={1} className="text-gold-600 group-hover:text-moody-900 lg:group-hover:translate-x-4 transition-all duration-1000" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Portfolio;
