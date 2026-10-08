import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const InstagramGlyph = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#151311" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".8" fill="#151311" />
  </svg>
);

const Footer = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  // The three statement links, each with a gold rule and a one-line subtitle
  const features = [
    { to: '/about',     label: t('nav.stories'), labelKey: 'nav.stories', subKey: 'footer.link.about.sub' },
    { to: '/portfolio', label: t('nav.work'),    labelKey: 'nav.work',    subKey: 'footer.link.work.sub' },
    { to: '/contact',   label: t('nav.inquire'), labelKey: 'nav.inquire', subKey: 'footer.link.contact.sub' },
  ];

  const navLinks = [
    { to: '/',          label: t('nav.home'),    styleKey: 'nav.home' },
    { to: '/portfolio', label: t('nav.work'),    styleKey: 'nav.work' },
    { to: '/about',     label: t('nav.stories'), styleKey: 'nav.stories' },
    { to: '/contact',   label: t('nav.inquire'), styleKey: 'nav.inquire' },
  ];

  const handle = settings.instagram_handle || '387.weddings';
  const instagramUrl = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : `https://instagram.com/${handle}`;

  return (
    <footer className="bg-white text-ink-900 border-t border-rule uppercase px-6 sm:px-10 lg:px-16 pb-10">
      <div className="max-w-[1100px] mx-auto">
        {/* Three statement links — stacked and ruled on phones, in a row above */}
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-0 md:gap-8 pt-6 md:pt-[88px] pb-0 md:pb-20">
          {features.map((f, i) => (
            <React.Fragment key={f.to}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden md:block w-px h-[120px] bg-rule flex-none"
                />
              )}
              <Link
                to={f.to}
                className={cn(
                  'flex flex-col items-center text-ink-900 py-[30px] md:py-0 transition-opacity duration-250 hover:opacity-60',
                  i > 0 && 'border-t border-rule-soft md:border-t-0',
                )}
              >
                <span
                  style={getContentStyle(f.labelKey)}
                  className="font-serif font-normal uppercase leading-[1.1] text-[28px] md:text-[38px] tracking-[0.05em]"
                >
                  {f.label}
                </span>
                <span aria-hidden="true" className="w-7 md:w-8 h-px bg-gold-600 my-4 md:mt-[22px] md:mb-[18px]" />
                <span
                  style={getContentStyle(f.subKey)}
                  className="text-[10px] md:text-[11px] font-medium tracking-[0.24em] uppercase text-gold-label text-center"
                >
                  {t(f.subKey)}
                </span>
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Quiet nav row */}
        <div className="flex flex-wrap items-center justify-center gap-x-7 md:gap-x-11 gap-y-1 border-t border-rule-soft md:border-t-0 pt-5 md:pt-0">
          {navLinks.map(l => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? 'page' : undefined}
                style={getContentStyle(l.styleKey)}
                className={cn(
                  'py-3 text-[10px] md:text-[11px] font-medium tracking-[0.26em] uppercase transition-opacity duration-250 hover:opacity-60',
                  active ? 'text-[#8a8279] border-b border-gold-600' : 'text-ink-900',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Instagram, copyright, back to top */}
        <div className="flex flex-col items-center gap-3.5 mt-7 md:mt-10 text-[11px] md:text-[12px] text-ink-500">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 md:gap-3.5 text-ink-900 text-[10px] md:text-[11px] tracking-[0.24em] uppercase transition-opacity duration-250 hover:opacity-60"
          >
            <InstagramGlyph />
            {handle}
          </a>

          <span style={getContentStyle('footer.rights')} className="normal-case text-center">
            © {new Date().getFullYear()} 387 Weddings. {t('footer.rights')}
          </span>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={getContentStyle('footer.top')}
            className="text-ink-900 text-[10px] md:text-[11px] tracking-[0.24em] uppercase py-2 transition-opacity duration-250 hover:opacity-60"
          >
            {t('footer.top')} ↑
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
