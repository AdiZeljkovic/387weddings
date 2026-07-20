import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, MessageSquare, Star, ArrowRight, Image as ImageIcon, Globe, Map, Heart, Film, Users, Clock, Download, Cloud, BookOpen, Gift, Gem, Scissors, Package, Palette } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactElement> = {
  chat:     <MessageSquare size={24} />,
  star:     <Star size={24} />,
  camera:   <Camera size={24} />,
  image:    <ImageIcon size={24} />,
  heart:    <Heart size={24} />,
  film:     <Film size={24} />,
  users:    <Users size={24} />,
  sparkles: <Sparkles size={24} />,
  globe:    <Globe size={24} />,
  map:      <Map size={24} />,
};

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const toRoman = (n: number) => ROMAN[n - 1] ?? String(n);

const getFeatureIcon = (text: string): React.ReactElement => {
  const s = text.toLowerCase();
  if (s.includes('hour') || s.includes('coverage') || s.includes('sat'))
    return <Clock size={12} strokeWidth={1.5} />;
  if (s.includes('export') || s.includes('resolution') || s.includes('jpeg') || s.includes('dpi'))
    return <Download size={12} strokeWidth={1.5} />;
  if (s.includes('retouch') || s.includes('color grad') || s.includes('post-prod') || s.includes('processing') || s.includes('production'))
    return <Palette size={12} strokeWidth={1.5} />;
  if (s.includes('gallery') || s.includes('cloud'))
    return <Cloud size={12} strokeWidth={1.5} />;
  if (s.includes('deliver') || s.includes('sneak'))
    return <Package size={12} strokeWidth={1.5} />;
  if (s.includes('album') || s.includes('book') || s.includes('photobook'))
    return <BookOpen size={12} strokeWidth={1.5} />;
  if (s.includes('usb') || s.includes('wooden') || s.includes('box') || s.includes('engraving'))
    return <Gift size={12} strokeWidth={1.5} />;
  if (s.includes('film') || s.includes('video') || s.includes('cinematic') || s.includes('highlight'))
    return <Film size={12} strokeWidth={1.5} />;
  if (s.includes('black') || s.includes('b&w') || s.includes('timeless') || s.includes('artistic'))
    return <Heart size={12} strokeWidth={1.5} />;
  if (s.includes('pre-wed') || s.includes('engag') || s.includes('complim') || s.includes('session'))
    return <Star size={12} strokeWidth={1.5} />;
  if (s.includes('photo') || s.includes('foto') || s.includes('selected') || s.includes('unlimited'))
    return <Camera size={12} strokeWidth={1.5} />;
  return <Gem size={12} strokeWidth={1.5} />;
};

interface Package {
  id: number;
  name: string;
  name_en: string | null;
  name_bs: string | null;
  price: string;
  description: string | null;
  description_en: string | null;
  description_bs: string | null;
  features: string[];
  features_en: string[];
  features_bs: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  name_color: string | null;
  name_font_size: string | null;
  features_font_size: string | null;
}

const Experience = () => {
  const { t, getContentStyle, language } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgs, setImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings().then(setImgs).catch(err => console.warn('Services: settings load failed', err));
    fetch('/api/packages')
      .then(r => r.json())
      .then(data => {
        const parseF = (raw: any): string[] => Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
        if (Array.isArray(data)) {
          setPackages(data.map((p: any) => ({
            ...p,
            features:    parseF(p.features),
            features_bs: parseF(p.features_bs),
            features_en: parseF(p.features_en),
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const steps = ([1, 2, 3, 4] as const).map(n => ({
    icon:     ICON_MAP[t(`experience.journey.step.${n}.icon`)] ?? ICON_MAP['camera'],
    title:    t(`experience.journey.step.${n}.title`),
    desc:     t(`experience.journey.step.${n}.desc`),
    num:      t(`experience.journey.step.${n}.num`) || `0${n}`,
    titleKey: `experience.journey.step.${n}.title` as string,
    descKey:  `experience.journey.step.${n}.desc` as string,
  }));

  // packages loaded from API via useEffect above

  return (
    <div className="bg-gold-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-moody-950">
        <div className="grain opacity-[0.05]" />
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            src={imgs['img.services.hero'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'}
            alt="Experience Hero"
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
            <h1 style={getContentStyle('experience.hero.title')} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white leading-none tracking-tighter uppercase">
              {t('experience.hero.title')}
            </h1>
            <p style={getContentStyle('experience.hero.subtitle')} className="text-white/60 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
              {t('experience.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="grain opacity-[0.02]" />

      <header className="px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto pt-24 md:pt-40 pb-16 md:pb-24">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            >
              <span style={getContentStyle('experience.intro.tag')} className="luxury-text-sm mb-6 md:mb-8 block">{t('experience.intro.tag')}</span>
              <h2 className="text-4xl md:text-7xl font-serif font-light text-moody-900 mb-8 md:mb-12 leading-tight">
                <span style={getContentStyle('experience.intro.title.part1')}>{t('experience.intro.title.part1')}</span> <br />
                <span style={getContentStyle('experience.intro.title.part2')} className="italic opacity-40 text-gold-600">{t('experience.intro.title.part2')}</span>
              </h2>
              <p style={getContentStyle('experience.intro.desc')} className="text-moody-900/70 text-lg md:text-2xl font-light leading-relaxed max-w-3xl mx-auto italic">
                {t('experience.intro.desc')}
              </p>
            </motion.div>
          </div>
        </div>
      </header>

      {/* The Benefit & Result Section */}
      <section className="px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto mb-24 md:mb-40">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 lg:gap-32">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
                className="space-y-8 text-center md:text-left"
              >
                <div className="space-y-4">
                  <h4 style={getContentStyle('experience.benefit.tag')} className="text-[10px] tracking-[0.4em] uppercase text-gold-600 font-bold">{t('experience.benefit.tag')}</h4>
                  <p style={getContentStyle('experience.benefit.desc')} className="text-moody-900/80 font-light leading-relaxed text-xl md:text-2xl font-serif">
                    {t('experience.benefit.desc')}
                  </p>
                </div>
                <div className="aspect-[4/5] overflow-hidden rounded-sm">
                  <img
                    src={imgs['img.services.pkg.1'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'}
                    alt="The Detail"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-[filter] duration-700"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="space-y-8 md:mt-32 text-center md:text-left"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-sm">
                  <img
                    src={imgs['img.services.pkg.2'] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200'}
                    alt="The Result"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-[filter] duration-700"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-4">
                  <h4 style={getContentStyle('experience.result.tag')} className="text-[10px] tracking-[0.4em] uppercase text-gold-600 font-bold">{t('experience.result.tag')}</h4>
                  <p style={getContentStyle('experience.result.desc')} className="text-moody-900/80 font-light leading-relaxed text-xl md:text-2xl font-serif">
                    {t('experience.result.desc')}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto mb-16 md:mb-24">
        <div className="text-center mb-16 md:mb-24">
          <span style={getContentStyle('experience.journey.tag')} className="luxury-text-sm mb-6 md:mb-8 block">{t('experience.journey.tag')}</span>
          <h2 style={getContentStyle('experience.journey.title')} className="text-4xl md:text-6xl font-serif font-light text-moody-900">{t('experience.journey.title')}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="space-y-6 md:space-y-8 group text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-4xl font-serif font-light text-gold-600/20">{step.num}</span>
                <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 lg:group-hover:bg-gold-600 lg:group-hover:text-white transition-all duration-700 premium-border">
                  {step.icon}
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <h3 style={getContentStyle(step.titleKey)} className="text-xl md:text-2xl font-serif text-moody-900">{step.title}</h3>
                <p style={getContentStyle(step.descKey)} className="text-moody-900/70 text-sm font-light leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy Callout */}
      <section className="bg-moody-900 py-24 md:py-32 px-6 sm:px-8 mb-24 md:mb-40 overflow-hidden relative">
        <div className="grain opacity-[0.05]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            className="text-3xl sm:text-4xl md:text-6xl font-serif font-light text-white leading-tight italic px-4"
            style={getContentStyle('experience.philosophy')}
          >
            {t('experience.philosophy')}
          </motion.h2>
        </div>
      </section>

      {/* Packages */}
      <section className="mb-16 md:mb-24">
        {/* Section header */}
        <div className="px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto mb-16 md:mb-20 text-center">
          <span style={getContentStyle('experience.investment.tag')} className="luxury-text-sm mb-6 md:mb-8 block">{t('experience.investment.tag')}</span>
          <h2 style={getContentStyle('experience.investment.title')} className="text-4xl sm:text-5xl md:text-7xl font-serif font-light text-moody-900 mb-6">
            {t('experience.investment.title')}
          </h2>
          <span style={getContentStyle('experience.investment.availability')} className="text-[10px] tracking-[0.35em] text-gold-600 uppercase font-bold bg-gold-100/50 px-5 py-1.5 border border-gold-600/10 inline-block">
            {t('experience.investment.availability')}
          </span>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-wrap justify-center gap-4 px-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-[270px] border border-moody-900/8 bg-white p-8 animate-pulse space-y-6">
                <div className="h-2 w-16 bg-moody-200 rounded" />
                <div className="h-5 w-2/3 bg-moody-200 rounded" />
                <div className="h-3 w-full bg-moody-100 rounded" />
                <div className="h-10 w-24 bg-moody-200 rounded mt-4" />
                <div className="pt-6 space-y-3">
                  {[1,2,3,4,5].map(j => <div key={j} className="h-2 bg-moody-100 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Packages — centered flex, any count */}
        {!loading && packages.length > 0 && (
          <div className="flex flex-wrap justify-center items-stretch gap-4 lg:gap-5 px-4 sm:px-8 lg:px-12">
            {packages.map((pkg, index) => {
              const dark = pkg.is_featured;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`relative flex flex-col w-full sm:w-[270px] lg:w-[280px] xl:w-[295px] flex-shrink-0
                    border transition-all duration-500 hover:-translate-y-3
                    ${dark
                      ? 'bg-moody-950 border-gold-600/25 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
                      : 'bg-white border-moody-900/12 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]'
                    }`}
                >
                  {/* Most popular badge */}
                  {dark && (
                    <div className="flex justify-center pt-5 pb-0 px-8">
                      <span className="text-[7px] tracking-[0.5em] uppercase font-bold bg-gold-600 text-white px-5 py-1.5">
                        {t('experience.package.popular')}
                      </span>
                    </div>
                  )}

                  <div className={`flex flex-col flex-1 px-8 pb-10 ${dark ? 'pt-6' : 'pt-10'}`}>
                    {/* Collection tag */}
                    <p className={`text-[8px] tracking-[0.5em] uppercase font-bold mb-4
                      ${dark ? 'text-gold-400/50' : 'text-gold-600/50'}`}>
                      {t('experience.package.collection')} {toRoman(index + 1)}
                    </p>

                    {/* Name */}
                    <h3
                      className={`text-2xl md:text-[1.65rem] font-serif font-light leading-snug mb-3
                        ${dark ? 'text-white' : 'text-moody-900'}`}
                      style={{
                        ...(pkg.name_color     ? { color: pkg.name_color }       : {}),
                        ...(pkg.name_font_size ? { fontSize: pkg.name_font_size } : {}),
                      }}
                    >
                      {language === 'ENG'
                        ? (pkg.name_en || pkg.name_bs || pkg.name)
                        : (pkg.name_bs || pkg.name)}
                    </h3>

                    {/* Description */}
                    <p className={`text-[11px] font-light italic leading-relaxed mb-8
                      ${dark ? 'text-white/35' : 'text-moody-900/40'}`}>
                      {language === 'ENG'
                        ? (pkg.description_en || pkg.description_bs || pkg.description)
                        : (pkg.description_bs || pkg.description)}
                    </p>

                    {/* Starting at */}
                    <p className={`text-[8px] tracking-[0.4em] uppercase font-bold mb-1
                      ${dark ? 'text-gold-400/40' : 'text-gold-600/40'}`}>
                      {t('experience.package.starting_at') || 'Starting at'}
                    </p>

                    {/* Price */}
                    <div className="mb-8">
                      <span className={`font-serif font-light leading-none
                        ${pkg.price.length > 5 ? 'text-4xl md:text-5xl' : 'text-5xl md:text-[3.5rem]'}
                        ${dark ? 'text-white' : 'text-moody-900'}`}>
                        {pkg.price}
                      </span>
                      <span className={`text-[10px] tracking-[0.25em] uppercase font-bold ml-2
                        ${dark ? 'text-gold-400/60' : 'text-gold-600/60'}`}>
                        KM
                      </span>
                    </div>

                    {/* Separator */}
                    <div className={`w-full h-px mb-7 ${dark ? 'bg-white/8' : 'bg-moody-900/8'}`} />

                    {/* Features */}
                    {(() => {
                      const featureList = language === 'ENG'
                        ? (pkg.features_en?.length ? pkg.features_en : (pkg.features_bs?.length ? pkg.features_bs : pkg.features))
                        : (pkg.features_bs?.length ? pkg.features_bs : pkg.features);
                      return (
                        <ul className="flex-1 space-y-3 mb-10">
                          {featureList.map((feature, fi) => (
                            <li
                              key={fi}
                              className={`flex items-start gap-2.5 font-light leading-relaxed
                                ${dark ? 'text-white/55' : 'text-moody-900/60'}`}
                              style={{ fontSize: pkg.features_font_size || '0.6875rem' }}
                            >
                              <span className={`mt-[3px] flex-none ${dark ? 'text-gold-400/60' : 'text-gold-600/55'}`}>
                                {getFeatureIcon(feature)}
                              </span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      );
                    })()}

                    {/* CTA */}
                    {dark ? (
                      <Link
                        to="/contact"
                        className="block w-full py-4 text-center text-[9px] tracking-[0.5em] uppercase font-bold bg-gold-600 text-white hover:bg-gold-500 transition-colors duration-300"
                      >
                        {t('experience.package.inquire')}
                      </Link>
                    ) : (
                      <Link
                        to="/contact"
                        className="block w-full py-4 text-center text-[9px] tracking-[0.5em] uppercase font-bold border border-moody-900/15 text-moody-900/40 hover:border-gold-600/40 hover:text-gold-600 transition-all duration-300"
                      >
                        {t('experience.package.inquire')}
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Custom Package / Promo Section */}
      {(t('experience.promo.tag') || t('experience.promo.desc')) && (
        <section className="bg-moody-950 py-20 md:py-28 px-6 sm:px-8 lg:px-16 mb-24 md:mb-32 relative overflow-hidden">
          <div className="grain opacity-[0.04]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-3xl mx-auto text-center relative z-10 space-y-8 md:space-y-10"
          >
            <h2
              style={getContentStyle('experience.promo.tag')}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white italic leading-tight"
            >
              {t('experience.promo.tag')}
            </h2>
            <p
              style={getContentStyle('experience.promo.desc')}
              className="text-white/40 font-light text-sm md:text-base leading-relaxed"
            >
              {t('experience.promo.desc')}
            </p>
            <div className="pt-2">
              <Link
                to="/contact"
                className="inline-block border border-white/25 hover:border-white/50 text-white/60 hover:text-white text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-bold px-10 md:px-14 py-4 md:py-5 transition-all duration-500"
              >
                {t('experience.promo.cta') || t('hero.inquire') || 'Pošaljite Upit'}
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      {/* Add-ons Section */}
      <section className="px-8 lg:px-16 max-w-[1800px] mx-auto mb-24 md:mb-40">
        <div className="editorial-grid items-center">
          <div className="col-span-12 lg:col-span-5 mb-20 lg:mb-0 text-center lg:text-left">
            <span style={getContentStyle('experience.addons.tag')} className="text-[10px] tracking-[0.5em] uppercase text-gold-600 mb-8 block font-bold">{t('experience.addons.tag')}</span>
            <h2 className="text-5xl md:text-7xl font-serif font-light text-moody-900 mb-12 leading-tight">
              <span style={getContentStyle('experience.addons.title.part1')}>{t('experience.addons.title.part1')}</span> <br />
              <span style={getContentStyle('experience.addons.title.part2')} className="italic opacity-50">{t('experience.addons.title.part2')}</span>
            </h2>
            <div className="space-y-12">
              {([1, 2, 3, 4] as const).map(n => ({
                title:    t(`experience.addons.${n}.title`),
                icon:     ICON_MAP[t(`experience.addons.${n}.icon`)] ?? ICON_MAP['camera'],
                desc:     t(`experience.addons.${n}.desc`),
                titleKey: `experience.addons.${n}.title` as string,
                descKey:  `experience.addons.${n}.desc` as string,
              })).map((item, index) => (
                <div key={index} className="flex justify-center lg:justify-start gap-8 group">
                  <div className="text-gold-600/50 group-hover:text-gold-600 transition-colors duration-500 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <h4 style={getContentStyle(item.titleKey)} className="text-xl font-serif text-moody-900 mb-2">{item.title}</h4>
                    <p style={getContentStyle(item.descKey)} className="text-moody-900/40 text-sm font-light leading-relaxed max-w-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-span-12 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
              className="aspect-[16/9] overflow-hidden rounded-sm relative"
            >
              <img
                src={imgs['img.services.cta'] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600'}
                alt="Film"
                className="w-full h-full object-cover grayscale"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-moody-900/10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 md:py-20 bg-sage-50 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 style={getContentStyle('experience.faq.title')} className="text-3xl md:text-5xl font-serif font-light text-moody-900 mb-12 md:mb-16">{t('experience.faq.title')}</h3>
          <div className="space-y-12 text-left">
            {[
              { q: t('experience.faq.1.q'), a: t('experience.faq.1.a'), qKey: 'experience.faq.1.q', aKey: 'experience.faq.1.a' },
              { q: t('experience.faq.2.q'), a: t('experience.faq.2.a'), qKey: 'experience.faq.2.q', aKey: 'experience.faq.2.a' },
              { q: t('experience.faq.3.q'), a: t('experience.faq.3.a'), qKey: 'experience.faq.3.q', aKey: 'experience.faq.3.a' },
              { q: t('experience.faq.4.q'), a: t('experience.faq.4.a'), qKey: 'experience.faq.4.q', aKey: 'experience.faq.4.a' },
            ].map((item, index) => (
              <div key={index} className="border-b border-moody-100 pb-12">
                <h4 style={getContentStyle(item.qKey)} className="text-xl font-serif text-gold-600 mb-4">{item.q}</h4>
                <p style={getContentStyle(item.aKey)} className="text-moody-900/40 font-light leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="space-y-12"
        >
          <h2 className="text-5xl md:text-8xl font-serif font-light text-moody-900 leading-tight">
            <span style={getContentStyle('experience.cta.title.part1')}>{t('experience.cta.title.part1')}</span> <br />
            <span style={getContentStyle('experience.cta.title.part2')} className="italic opacity-30">{t('experience.cta.title.part2')}</span>
          </h2>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-4 md:gap-8 group"
          >
            <span className="text-[10px] md:text-[12px] tracking-[0.5em] md:tracking-[0.7em] uppercase text-gold-600 font-medium group-hover:text-moody-900 transition-colors duration-500">
              {t('experience.cta.button')}
            </span>
            <div className="w-12 md:w-20 h-[1px] bg-gold-600/30 group-hover:bg-gold-600/60 lg:group-hover:w-40 transition-all duration-1000" />
            <ArrowRight size={20} strokeWidth={1} className="text-gold-600 group-hover:text-moody-900 lg:group-hover:translate-x-4 transition-all duration-1000" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Experience;
