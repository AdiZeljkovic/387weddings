import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, MapPin, Heart, Sparkles, Star, Film, Users, MessageSquare } from 'lucide-react';

const InteractiveImage = ({ src, alt, delay = 0, aspect = "aspect-[3/4]", grayscale = false, title, location }: { src: string, alt: string, delay?: number, aspect?: string, grayscale?: boolean, title?: string, location?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.7, delay: delay * 0.3, ease: "easeOut" }}
      whileHover="hover"
      whileTap="tap"
      className={`${aspect} rounded-sm group cursor-pointer relative z-0 mb-4`}
    >
      <motion.div
        variants={{
          hover: { scale: 1.02, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
          tap:   { scale: 0.98, transition: { duration: 0.3 } }
        }}
        className="w-full h-full relative overflow-hidden rounded-sm"
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${grayscale ? 'grayscale' : ''}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700 pointer-events-none" />

        {(title || location) && (
          <motion.div
            variants={{ hover: { opacity: 1, y: 0 } }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/40 to-transparent text-white pointer-events-none"
          >
            {title && <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-1">{title}</p>}
            {location && <p className="text-[8px] tracking-[0.3em] uppercase opacity-70 italic">{location}</p>}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const ICON_MAP: Record<string, React.ReactElement> = {
  sparkles:    <Sparkles    size={32} strokeWidth={1} className="text-gold-600/40" />,
  mappin:      <MapPin      size={32} strokeWidth={1} className="text-gold-600/40" />,
  heart:       <Heart       size={32} strokeWidth={1} className="text-gold-600/40" />,
  camera:      <Camera      size={32} strokeWidth={1} className="text-gold-600/40" />,
  star:        <Star        size={32} strokeWidth={1} className="text-gold-600/40" />,
  film:        <Film        size={32} strokeWidth={1} className="text-gold-600/40" />,
  users:       <Users       size={32} strokeWidth={1} className="text-gold-600/40" />,
  chat:        <MessageSquare size={32} strokeWidth={1} className="text-gold-600/40" />,
};

const FALLBACK_SLIDES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200',
];

const Home = () => {
  const { t, getContentStyle } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [heroSlides, setHeroSlides] = useState<{ desktop: string[]; mobile: string[] } | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    loadSettings()
      .then(data => {
        setSettings(data);
        const desktop = ([1,2,3,4,5] as const)
          .map(n => data[`img.home.hero.${n}`])
          .filter((s): s is string => Boolean(s && s.trim()));
        const mobile = ([1,2,3,4,5] as const)
          .map(n => data[`img.home.hero.mobile.${n}`])
          .filter((s): s is string => Boolean(s && s.trim()));
        const desktopSlides = desktop.length > 0 ? desktop : FALLBACK_SLIDES;
        setHeroSlides({ desktop: desktopSlides, mobile: mobile.length > 0 ? mobile : desktopSlides });
      })
      .catch(err => {
        console.warn('Home: settings load failed', err);
        setHeroSlides({ desktop: FALLBACK_SLIDES, mobile: FALLBACK_SLIDES });
      });
  }, []);

  // null = still loading (show dark bg); pick set based on screen width
  const slides = heroSlides ? (isMobile ? heroSlides.mobile : heroSlides.desktop) : [];

  useEffect(() => {
    setCurrentSlide(0);
  }, [isMobile]);

  useEffect(() => {
    if (slides.length === 0) return;
    setCurrentSlide(prev => Math.min(prev, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="bg-gold-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-4 sm:px-8 lg:px-16 overflow-hidden bg-moody-950">
        <div className="grain opacity-[0.05]" />
        
        {/* Cinematic Background Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.8 } }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={slides[currentSlide]}
                alt={`Wedding Hero ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center brightness-90"
                loading="eager"
                fetchPriority="high"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
          {/* Preload only the next slide to avoid saturating bandwidth on first load */}
          {slides[(currentSlide + 1) % slides.length] && (
            <img
              key={slides[(currentSlide + 1) % slides.length]}
              src={slides[(currentSlide + 1) % slides.length]}
              alt=""
              aria-hidden="true"
              className="hidden"
              fetchPriority="low"
            />
          )}
          {/* Left gradient — makes text readable on any background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
          {/* Top/bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          
          {/* Subtle Light Leak Effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(166,134,93,0.07) 0%, transparent 65%)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1800px] mx-auto h-full flex flex-col justify-center pt-28 sm:pt-32 lg:pt-0">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.4,
                  delayChildren: 1
                }
              }
            }}
            className="grid grid-cols-12 gap-4 md:gap-8 items-center"
          >
            {/* Left Content - Asymmetric Layout */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-7">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <motion.h1
                  variants={{
                    hidden: { opacity: 0, y: 60 },
                    visible: { opacity: 1, y: 0, transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-serif font-light text-white leading-[0.9] lg:leading-[0.85] tracking-tighter mb-10 md:mb-14 lg:mb-16 [text-shadow:0_2px_40px_rgba(0,0,0,0.9),0_0_80px_rgba(0,0,0,0.7)]"
                >
                  <span style={getContentStyle('hero.title.part1')}>{t('hero.title.part1')}</span> <br />
                  <span style={getContentStyle('hero.title.part2')} className="italic font-light text-gold-600 [text-shadow:0_2px_30px_rgba(0,0,0,0.8)] contrast-125">{t('hero.title.part2')}</span>
                </motion.h1>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="w-full flex flex-col items-center lg:items-start"
                >
                  <p style={getContentStyle('hero.location')} className="text-white/80 text-[9px] md:text-xs font-sans leading-relaxed tracking-[0.35em] md:tracking-[0.45em] uppercase font-bold mb-10 md:mb-14 lg:mb-16 whitespace-normal lg:whitespace-nowrap [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] max-w-xs md:max-w-md lg:max-w-none">
                    {t('hero.location')}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center lg:items-center gap-5 sm:gap-8 md:gap-12">
                    <motion.div className="w-full sm:w-auto">
                      <Link
                        to="/contact"
                        className="group relative px-12 md:px-16 py-5 md:py-6 overflow-hidden whitespace-nowrap block border border-white/60 md:border-gold-500/60 hover:border-gold-400 transition-all duration-700 rounded-full text-center backdrop-blur-[2px]"
                      >
                        <div className="absolute inset-0 bg-white/10 md:bg-gold-600/15 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                        <span className="relative z-10 text-[10px] md:text-[12px] tracking-[0.5em] md:tracking-[0.6em] uppercase font-medium text-white md:text-gold-300 group-hover:text-white transition-colors duration-700 block">
                          {t('hero.inquire')}
                        </span>
                      </Link>
                    </motion.div>

                    <div className="w-full sm:w-auto">
                      <Link
                        to="/portfolio"
                        className="group relative px-10 md:px-14 py-5 md:py-6 overflow-hidden whitespace-nowrap block text-center"
                      >
                        <span className="relative z-10 text-[10px] md:text-[12px] tracking-[0.4em] md:tracking-[0.5em] uppercase font-light text-white/70 group-hover:text-white transition-all duration-700 block [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                          {t('hero.portfolio')}
                        </span>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-white/50 group-hover:w-1/2 transition-all duration-700" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Side - Decorative Signature/Detail */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-5 relative h-full">
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 2, delay: 1.5 } }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                <div className="relative">
                  <div className="text-[20rem] xl:text-[25rem] font-script text-white/[0.02] leading-none select-none">
                    387
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 border border-white/5 rotate-12" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 border border-gold-600/10 -rotate-6" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 md:gap-10">
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            className="group flex items-center text-white/40 hover:text-white transition-all duration-500 p-5 -m-5 cursor-pointer"
            aria-label="Previous slide"
          >
            <div className="relative flex items-center">
              <div className="w-10 md:w-16 h-[1px] bg-current opacity-50 group-hover:opacity-100 group-hover:w-14 md:group-hover:w-20 transition-all duration-500" />
              <div className="absolute left-0 w-2.5 h-2.5 border-l-2 border-t-2 border-current -rotate-45 origin-left opacity-50 group-hover:opacity-100 transition-all duration-500" />
            </div>
          </button>

          <div className="flex items-center gap-4 font-serif text-sm md:text-base tracking-[0.2em] text-white/40 select-none min-w-[80px] justify-center">
            <span className="text-white font-light tabular-nums">{String(currentSlide + 1).padStart(2, '0')}</span>
            <span className="text-[10px] opacity-20 font-sans">—</span>
            <span className="font-light tabular-nums">{String(slides.length).padStart(2, '0')}</span>
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
            className="group flex items-center text-white/40 hover:text-white transition-all duration-500 p-5 -m-5 cursor-pointer"
            aria-label="Next slide"
          >
            <div className="relative flex items-center">
              <div className="w-10 md:w-16 h-[1px] bg-current opacity-50 group-hover:opacity-100 group-hover:w-14 md:group-hover:w-20 transition-all duration-500" />
              <div className="absolute right-0 w-2.5 h-2.5 border-r-2 border-t-2 border-current rotate-45 origin-right opacity-50 group-hover:opacity-100 transition-all duration-500" />
            </div>
          </button>
        </div>

        {/* Floating Structural Elements */}
        <div className="absolute left-8 md:left-12 bottom-12 hidden xl:block">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 2 }}
            className="flex items-center gap-12"
          >
            <span style={getContentStyle('hero.location')} className="text-[9px] tracking-[1em] uppercase text-white/20 font-bold whitespace-nowrap">
              {t('hero.location')}
            </span>
            <div className="w-24 h-[1px] bg-white/10" />
            <span className="text-[9px] tracking-[1em] uppercase text-white/20 font-bold whitespace-nowrap">
              Est. 2016
            </span>
          </motion.div>
        </div>

        {/* Scroll Indicator - Minimalist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2.5 }}
          className="absolute bottom-12 right-12 hidden xl:flex flex-col items-center gap-6"
        >
          <div className="flex flex-col items-center gap-4 animate-[scrollBounce_2s_ease-in-out_infinite]">
            <span className="text-[9px] tracking-[0.8em] uppercase text-white/40 font-black rotate-90 origin-right translate-x-full mb-4">
              {t('home.scroll')}
            </span>
            <div className="h-24 w-[1px] bg-gradient-to-b from-gold-600 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Intro Section */}
      <section className="pt-20 md:pt-32 pb-8 px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="max-w-4xl mx-auto"
          >
            <span style={getContentStyle('home.intro.tag')} className="luxury-text-sm block mb-8">{t('home.intro.tag')}</span>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 mb-10 tracking-tight uppercase leading-[1.1]">
              <span style={getContentStyle('home.intro.title.part1')}>{t('home.intro.title.part1')}</span>{' '}
              <span style={getContentStyle('home.intro.title.part2')} className="italic opacity-40">{t('home.intro.title.part2')}</span> <br />
              <span style={getContentStyle('home.intro.title.part3')}>{t('home.intro.title.part3')}</span>
            </h2>
            <p style={getContentStyle('home.intro.desc')} className="max-w-2xl mx-auto text-moody-900/60 font-light text-base md:text-xl leading-relaxed italic px-4">
              {t('home.intro.desc')}
            </p>
          </motion.div>
        </div>

        {/* Image Grid - 9 Images */}
        <div className="grid grid-cols-12 gap-4 lg:gap-12 mb-24">
          {/* Column 1 */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4 lg:gap-12">
            <InteractiveImage
              src={settings['img.home.grid.1'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Portrait" grayscale={true} delay={0} title="The Highlands" location="Scotland, 2024" />
            <InteractiveImage
              src={settings['img.home.grid.2'] || 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Rings" aspect="aspect-square" delay={0.2} title="Minimalist Vows" location="London, 2023" />
            <InteractiveImage
              src={settings['img.home.grid.3'] || 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Table" delay={0.4} title="Al Fresco Dinner" location="Tuscany, 2024" />
          </div>

          {/* Column 2 */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4 lg:gap-12 md:mt-24">
            <InteractiveImage
              src={settings['img.home.grid.4'] || 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Staircase" aspect="aspect-square" delay={0.1} title="The Grand Entrance" location="Paris, 2024" />
            <InteractiveImage
              src={settings['img.home.grid.5'] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Tent" delay={0.3} title="Midnight Celebration" location="Sarajevo, 2023" />
            <InteractiveImage
              src={settings['img.home.grid.6'] || 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Detail" aspect="aspect-square" delay={0.5} title="Heirloom Details" location="Vienna, 2024" />
          </div>

          {/* Column 3 */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4 lg:gap-12">
            <InteractiveImage
              src={settings['img.home.grid.7'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'}
              alt="Bride Portrait" delay={0.2} title="Quiet Anticipation" location="Prague, 2024" />
            <InteractiveImage
              src={settings['img.home.grid.8'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Reception" aspect="aspect-square" delay={0.4} title="The First Dance" location="Rome, 2023" />
            <InteractiveImage
              src={settings['img.home.grid.9'] || 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800'}
              alt="Wedding Toast" delay={0.6} title="Shared Laughter" location="Berlin, 2024" />
          </div>
        </div>

        {/* Explore Portfolio Button */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            <Link 
              to="/portfolio"
              className="group flex items-center gap-3 md:gap-6 py-4"
            >
              <span className="text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em] lg:group-hover:tracking-[0.7em] uppercase font-black text-moody-900 group-hover:text-gold-600 transition-all duration-700 whitespace-nowrap">
                {t('home.explore')}
              </span>
              <div className="relative flex items-center justify-center">
                <div className="w-8 md:w-12 h-[1px] bg-moody-900/20 group-hover:bg-gold-600/40 lg:group-hover:w-20 transition-all duration-700" />
                <ArrowRight size={16} className="text-moody-900 group-hover:text-gold-600 lg:group-hover:translate-x-4 transition-all duration-700 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gold-100/50 pt-20 md:pt-32 pb-20 md:pb-24 px-6 sm:px-8 lg:px-16">
        <div className="max-w-[1400px] mx-auto space-y-20 md:space-y-32">
          
          {/* Step 01 */}
          <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 aspect-[4/5] overflow-hidden rounded-sm premium-border"
            >
              <img
                src={settings['img.home.process.1'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'}
                alt="Vision"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-[filter] duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 space-y-6 md:space-y-8"
            >
              <div className="flex items-center gap-6">
                <span className="text-5xl sm:text-6xl md:text-8xl font-serif font-light text-gold-600/20 block">{t('home.process.01.num') || '01.'}</span>
                {ICON_MAP[t('home.process.01.icon')] ?? ICON_MAP['sparkles']}
              </div>
              <h3 style={getContentStyle('home.process.01.title')} className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-moody-900 leading-tight">
                {t('home.process.01.title')}
              </h3>
              <div className="space-y-4 md:space-y-6">
                <span style={getContentStyle('home.process.01.tag')} className="luxury-text-sm block">{t('home.process.01.tag')}</span>
                <p style={getContentStyle('home.process.01.desc')} className="text-moody-900/70 font-light text-sm md:text-lg leading-relaxed max-w-md">
                  {t('home.process.01.desc')}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Step 02 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 aspect-[4/5] overflow-hidden rounded-sm"
            >
              <img
                src={settings['img.home.process.2'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'}
                alt="Location"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 space-y-8"
            >
              <div className="flex items-center gap-6">
                <span className="text-6xl md:text-8xl font-serif font-light text-moody-900 opacity-20 block">{t('home.process.02.num') || '02.'}</span>
                {ICON_MAP[t('home.process.02.icon')] ?? ICON_MAP['mappin']}
              </div>
              <h3 style={getContentStyle('home.process.02.title')} className="text-4xl md:text-5xl font-serif font-light text-moody-900 leading-tight">
                {t('home.process.02.title')}
              </h3>
              <div className="space-y-6">
                <span style={getContentStyle('home.process.02.tag')} className="text-[10px] tracking-[0.4em] uppercase text-gold-600 font-bold block">{t('home.process.02.tag')}</span>
                <p style={getContentStyle('home.process.02.desc')} className="text-moody-900/60 font-light text-base leading-relaxed max-w-md">
                  {t('home.process.02.desc')}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Step 03 */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 aspect-[4/5] overflow-hidden rounded-sm"
            >
              <img
                src={settings['img.home.process.3'] || 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200'}
                alt="Art"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full md:w-1/2 space-y-8"
            >
              <div className="flex items-center gap-6">
                <span className="text-6xl md:text-8xl font-serif font-light text-moody-900 opacity-20 block">{t('home.process.03.num') || '03.'}</span>
                {ICON_MAP[t('home.process.03.icon')] ?? ICON_MAP['heart']}
              </div>
              <h3 style={getContentStyle('home.process.03.title')} className="text-4xl md:text-5xl font-serif font-light text-moody-900 leading-tight">
                {t('home.process.03.title')}
              </h3>
              <div className="space-y-6">
                <span style={getContentStyle('home.process.03.tag')} className="text-[10px] tracking-[0.4em] uppercase text-gold-600 font-bold block">{t('home.process.03.tag')}</span>
                <p style={getContentStyle('home.process.03.desc')} className="text-moody-900/60 font-light text-base leading-relaxed max-w-md">
                  {t('home.process.03.desc')}
                </p>
                <div className="pt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                  >
                    <Link
                      to="/contact"
                      className="group flex items-center gap-3 md:gap-6 py-4"
                    >
                      <span className="text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em] lg:group-hover:tracking-[0.7em] uppercase text-moody-900 font-black whitespace-nowrap group-hover:text-gold-600 transition-all duration-700">
                        {t('home.process.03.cta')}
                      </span>
                      <div className="relative flex items-center justify-center">
                        <div className="w-8 md:w-12 h-[1px] bg-moody-900/20 group-hover:bg-gold-600/40 lg:group-hover:w-20 transition-all duration-700" />
                        <ArrowRight size={16} className="text-moody-900 group-hover:text-gold-600 lg:group-hover:translate-x-4 transition-all duration-700 flex-shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
      {/* About Us Section */}
      <section className="pb-24 md:pb-32 px-6 sm:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-light text-moody-900 tracking-tight">
              <span style={getContentStyle('home.about.title')} className="italic text-gold-600">{t('home.about.title')}</span> <span style={getContentStyle('home.about.and')} className="italic text-gold-600">{t('home.about.and')}</span>
            </h2>
            <div className="w-16 md:w-24 h-[1px] bg-gold-600/30 mx-auto mt-6 md:mt-8" aria-hidden="true" />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            {/* Left Portrait */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full sm:w-2/3 lg:w-1/3 aspect-[3/4] overflow-hidden rounded-sm grayscale"
            >
              <img
                src={settings['img.home.team.aldin'] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'}
                alt="Aldin"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Center Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="w-full lg:w-1/3 text-center space-y-8 md:space-y-12 px-4"
            >
              <div className="space-y-6 md:space-y-8 text-moody-900/70 font-light text-base md:text-lg leading-relaxed">
                <p style={getContentStyle('home.about.desc.1')} className="text-moody-900 font-medium text-xl md:text-2xl font-serif">{t('home.about.desc.1').split('.')[0]}.</p>
                <p style={getContentStyle('home.about.desc.2')}>{t('home.about.desc.2')}</p>
                <p style={getContentStyle('home.about.desc.3')}>{t('home.about.desc.3')}</p>
              </div>

              <div className="space-y-4 text-moody-900/40 text-[11px] tracking-[0.3em] uppercase font-bold">
                <p>{settings.email || 'hello@387cinematicweddings.com'}</p>
                {settings.phone && <p>{settings.phone}</p>}
                <p className="text-gold-600">{t('contact.response.note').split('.')[0]}.</p>
              </div>

              <div className="pt-6 md:pt-12 flex justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-4 md:gap-8 group"
                >
                  <span className="luxury-text-sm text-gold-600 group-hover:text-moody-900 transition-colors duration-500">
                    {t('home.about.cta')}
                  </span>
                  <div className="w-12 md:w-20 h-[1px] bg-gold-600/30 group-hover:bg-gold-600/60 lg:group-hover:w-40 transition-all duration-1000" aria-hidden="true" />
                  <ArrowRight size={20} className="text-gold-600 group-hover:text-moody-900 lg:group-hover:translate-x-4 transition-all duration-1000" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>

            {/* Right Portrait */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="w-full sm:w-2/3 lg:w-1/3 aspect-[3/4] overflow-hidden rounded-sm grayscale"
            >
              <img
                src={settings['img.home.team.melisa'] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800'}
                alt="Melisa"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
