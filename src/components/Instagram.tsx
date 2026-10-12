import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { DiamondRule } from './ornaments';
import Reveal from './Reveal';

export const InstagramGlyph = ({ size = 16, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".8" fill={stroke} />
  </svg>
);

/**
 * The closing block of Radovi and of every story, as the boards draw it:
 * ornament, "Još trenutaka", "Pogledajte još na Instagramu", the handle button.
 */
export function InstagramBlock({ handle, url, className = '' }: { handle: string; url: string; className?: string }) {
  const { t, getContentStyle } = useLanguage();
  return (
    <div className={`max-w-[720px] mx-auto text-center ${className}`}>
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
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn inline-flex items-center gap-3.5 border border-ink-900 text-ink-900 text-[11px] lg:text-[12px] font-medium tracking-[0.22em] uppercase px-7 py-4 hover:text-white"
      >
        <InstagramGlyph />
        <span>@{handle} <span className="btn-arrow">→</span></span>
      </a>
    </div>
  );
}
