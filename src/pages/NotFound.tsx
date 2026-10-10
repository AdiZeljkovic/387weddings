import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { SectionLabel, OliveBranch } from '../components/ornaments';
import Reveal from '../components/Reveal';
import { usePaths } from '../lib/routes';

/**
 * Not on the boards, so it borrows their vocabulary: cream ground, a ruled
 * gold label, a Playfair title with its second line in italic, the outline and
 * solid buttons. The old page pulled in an animation library for a single fade
 * and set its title at 128px, which ran off a 360px phone.
 */
const NotFound = () => {
  const { t, getContentStyle } = useLanguage();
  const paths = usePaths();

  return (
    <div className="relative overflow-hidden bg-cream min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-24 lg:py-32">
      <OliveBranch className="hidden lg:block absolute left-24 top-20 w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
      <OliveBranch className="hidden lg:block absolute right-24 top-20 w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />

      <div className="relative">
        <SectionLabel centered className="mb-6 lg:mb-7" style={getContentStyle('notfound.tag')}>
          {t('notfound.tag')}
        </SectionLabel>

        <Reveal as="h1" className="font-serif font-normal text-[clamp(30px,9.8vw,38px)] lg:text-[clamp(44px,4.45vw,64px)] leading-[1.1] m-0 mb-6 lg:mb-8">
          <span className="block" style={getContentStyle('notfound.title.part1')}>{t('notfound.title.part1')}</span>
          <span className="block italic text-love" style={getContentStyle('notfound.title.part2')}>{t('notfound.title.part2')}</span>
        </Reveal>

        <Reveal
          as="p"
          delay={0.08}
          style={getContentStyle('notfound.desc')}
          className="text-[15px] lg:text-[16px] font-light leading-[1.8] text-ink-700 max-w-[440px] mx-auto m-0 mb-10 lg:mb-12"
        >
          {t('notfound.desc')}
        </Reveal>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <Link
            to={paths('home')}
            style={getContentStyle('notfound.home')}
            className="btn btn-solid inline-block bg-ink-900 text-white text-[11px] lg:text-[12px] font-semibold tracking-[0.2em] uppercase px-7 py-4"
          >
            {t('notfound.home')}
          </Link>
          <Link
            to={paths('portfolio')}
            style={getContentStyle('notfound.portfolio')}
            className="btn inline-block border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.2em] uppercase px-7 py-4 hover:text-white"
          >
            {t('notfound.portfolio')} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
