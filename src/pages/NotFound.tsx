import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-8 text-center relative overflow-hidden">
      <div className="grain opacity-[0.03]" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="relative z-10"
      >
        <span className="text-[10px] tracking-[0.8em] uppercase text-gold-600 font-bold block mb-8">
          {t('notfound.tag')}
        </span>
        <h1 className="text-7xl md:text-9xl font-serif font-light text-moody-900 mb-8 leading-none tracking-tighter uppercase">
          {t('notfound.title.part1')} <br />
          <span className="italic opacity-30">{t('notfound.title.part2')}</span>
        </h1>
        <p className="text-moody-900/50 mb-16 max-w-md mx-auto font-light leading-relaxed">
          {t('notfound.desc')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          <Link
            to="/"
            className="text-[11px] tracking-[0.5em] uppercase text-gold-600 font-black border-b border-gold-600/30 pb-2 hover:border-gold-600 transition-all duration-500"
          >
            {t('notfound.home')}
          </Link>
          <Link
            to="/portfolio"
            className="text-[11px] tracking-[0.5em] uppercase text-moody-900/40 font-black hover:text-moody-900 transition-all duration-500"
          >
            {t('notfound.portfolio')}
          </Link>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-moody-100/20 rounded-full -z-0" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-moody-100/10 rounded-full -z-0" aria-hidden="true" />
    </div>
  );
};

export default NotFound;
