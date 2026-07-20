import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Camera, Film, ArrowRight, MessageSquare, Star, Image as ImageIcon, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const ICON_MAP: Record<string, React.ReactElement> = {
  chat:   <MessageSquare size={32} strokeWidth={1} />,
  star:   <Star size={32} strokeWidth={1} />,
  camera: <Camera size={32} strokeWidth={1} />,
  image:  <ImageIcon size={32} strokeWidth={1} />,
  heart:  <Heart size={32} strokeWidth={1} />,
  film:   <Film size={32} strokeWidth={1} />,
  users:  <Users size={32} strokeWidth={1} />,
};

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const About = () => {
  const { t, getContentStyle } = useLanguage();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const [imgs, setImgs] = React.useState<Record<string, string>>({});
  React.useEffect(() => { loadSettings().then(setImgs).catch(err => console.warn('About: settings load failed', err)); }, []);

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <motion.img
            style={{ y: y1 }}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 0.6 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            src={imgs['img.about.hero'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'}
            alt="About Hero"
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
            <h1 style={getContentStyle('about.hero.title')} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white leading-none tracking-tighter uppercase">
              {t('about.hero.title')}
            </h1>
            <p style={getContentStyle('about.hero.subtitle')} className="text-white/60 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
              {t('about.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="grain opacity-[0.02]" aria-hidden="true" />
      
      {/* Main Story Section */}
      <section className="py-20 md:py-32 px-6 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
        <div className="editorial-grid items-center">
          {/* Left: Image */}
          <div className="col-span-12 lg:col-span-6 mb-12 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
              className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-sm"
            >
              <img
                src={imgs['img.about.story'] || 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=1200'}
                alt="The Team"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none" aria-hidden="true" />
            </motion.div>
          </div>

          {/* Right: Text */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <span style={getContentStyle('about.artists')} className="luxury-text-sm text-gold-600 block">{t('about.artists')}</span>
                <h2 style={getContentStyle('about.title')} className="text-4xl md:text-6xl font-serif font-light text-moody-900 leading-tight">
                  {t('about.title')}
                </h2>
              </div>
              
              <div className="space-y-8 text-moody-900/70 font-light text-base md:text-lg leading-relaxed">
                <p style={getContentStyle('about.desc.1')} className="first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-gold-600">
                  {t('about.desc.1')}
                </p>
                <p style={getContentStyle('about.desc.2')}>
                  {t('about.desc.2')}
                </p>
                <p style={getContentStyle('about.desc.3')} className="italic border-l-2 border-gold-600/20 pl-6 py-2">
                  {t('about.desc.3')}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 1 }}
                className="pt-8"
              >
                <span className="text-4xl md:text-5xl font-script text-gold-600/60">Melisa & Aldin</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 md:py-32 px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20 md:mb-24">
            <span style={getContentStyle('about.experience.tag')} className="text-[10px] tracking-[0.5em] uppercase text-gold-600 mb-6 block font-bold">{t('about.experience.tag')}</span>
            <h2 style={getContentStyle('about.experience.title')} className="text-5xl md:text-7xl font-serif font-light text-moody-900">{t('about.experience.title')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {([1, 2, 3, 4] as const).map((n, index) => ({
              icon:     ICON_MAP[t(`about.step.${n}.icon`)] ?? ICON_MAP['camera'],
              title:    t(`about.step.${n}.title`),
              desc:     t(`about.step.${n}.desc`),
              num:      t(`about.step.${n}.num`) || `0${n}`,
              titleKey: `about.step.${n}.title` as string,
              descKey:  `about.step.${n}.desc` as string,
            })).map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center group"
              >
                <div className="flex flex-col items-center mb-10">
                  <span className="text-5xl font-serif font-light text-gold-600/10 mb-4">{step.num}</span>
                  <div className="text-gold-600 lg:group-hover:scale-110 transition-transform duration-700">
                    {step.icon}
                  </div>
                </div>
                <h3 style={getContentStyle(step.titleKey)} className="text-xl md:text-2xl font-serif font-light text-moody-900 mb-6">{step.title}</h3>
                <p style={getContentStyle(step.descKey)} className="text-moody-900/40 font-light leading-relaxed text-sm">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-40 px-6 sm:px-8 lg:px-16 bg-gold-100/30 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="space-y-12"
        >
          <h2 className="text-5xl md:text-8xl font-serif font-light text-moody-900 leading-tight">
            <span style={getContentStyle('stories.ready')}>{t('stories.ready')}</span> <br />
            <span style={getContentStyle('stories.yourOwn')} className="italic opacity-30 text-gold-600">{t('stories.yourOwn')}</span>
          </h2>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-4 md:gap-8 group"
          >
            <span className="text-[10px] md:text-[12px] tracking-[0.5em] md:tracking-[0.7em] uppercase text-gold-600 font-medium group-hover:text-moody-900 transition-colors duration-500">
              {t('stories.start')}
            </span>
            <div className="w-12 md:w-20 h-[1px] bg-gold-600/30 group-hover:bg-gold-600/60 lg:group-hover:w-40 transition-all duration-1000" />
            <ArrowRight size={20} strokeWidth={1} className="text-gold-600 group-hover:text-moody-900 lg:group-hover:translate-x-4 transition-all duration-1000" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default About;

