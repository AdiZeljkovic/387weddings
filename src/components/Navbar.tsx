import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import Logo from './Logo';

const InstagramGlyph = ({ size = 16, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".8" fill={stroke} />
  </svg>
);

const Navbar = () => {
  const { t, language, setLanguage, getContentStyle } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location]);

  // Close on Escape and keep the page behind the open menu from scrolling
  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return;
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const links = [
    { path: '/',          label: t('nav.home'),    styleKey: 'nav.home' },
    { path: '/portfolio', label: t('nav.work'),    styleKey: 'nav.work' },
    { path: '/about',     label: t('nav.stories'), styleKey: 'nav.stories' },
    { path: '/contact',   label: t('nav.inquire'), styleKey: 'nav.inquire' },
  ];

  // The header follows the user down every page. On the home hero it lies over
  // the photograph, transparent; once that hero is behind us it takes the cream
  // bar. It used to be absolutely positioned on the home page, so it scrolled
  // away and never came back.
  const [scrolled, setScrolled] = useState(false);
  const onHome = location.pathname === '/';

  useEffect(() => {
    if (!onHome) { setScrolled(true); return; }
    // Hand over roughly a screen in, where the hero ends
    const read = () => setScrolled(window.scrollY > window.innerHeight * 0.72);
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [onHome]);

  // Over the open menu the bar is cream, so its contents must read dark
  const overHero = onHome && !scrolled && !isMobileMenuOpen;

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === path) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const instagramHandle = settings.instagram_handle || '387.weddings';
  const instagramUrl = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : `https://instagram.com/${instagramHandle}`;

  const LangSwitch = ({ light, size = 12 }: { light?: boolean; size?: number }) => (
    <span
      className="flex items-center gap-[7px] leading-none"
      style={{ fontSize: size, letterSpacing: '0.16em' }}
    >
      {(['ENG', 'BOS'] as const).map((lang, i) => (
        <React.Fragment key={lang}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className={cn('w-px h-[10px]', light ? 'bg-white/50' : 'bg-ink-900/[0.28]')}
            />
          )}
          <button
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={language === lang}
            className={cn(
              'cursor-pointer transition-colors duration-250 min-h-11 px-1 flex items-center',
              language === lang
                ? light ? 'text-white font-semibold' : 'text-ink-900 font-semibold'
                : light ? 'text-white/65 hover:text-white' : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {lang}
          </button>
        </React.Fragment>
      ))}
    </span>
  );

  return (
    <>
      <header
        className={cn(
          'top-0 left-0 right-0 flex items-center justify-between gap-6',
          'px-5 sm:px-8 lg:px-24 transition-colors duration-300',
          // Home lays it over the hero, so it has to leave the flow; elsewhere
          // sticky keeps its own space above the page's first section.
          onHome ? 'fixed' : 'sticky',
          // Above the open menu, which is the same header the menu uses
          isMobileMenuOpen ? 'z-[1020]' : 'z-30',
          isMobileMenuOpen
            // Solid while the menu is open, or the page reads through the bar
            ? 'pt-3 lg:pt-[22px] pb-[10px] text-ink-900 bg-cream border-b border-ink-900/[0.07]'
            : overHero
              ? 'pt-4 lg:pt-9 pb-0 text-white'
              : 'pt-3 lg:pt-[22px] pb-[10px] text-ink-900 bg-[rgba(249,245,238,0.94)] backdrop-blur-[10px] border-b border-ink-900/[0.07] shadow-[0_1px_12px_rgba(21,19,17,0.05)]',
        )}
      >
        <Link
          to="/"
          onClick={() => handleLinkClick('/')}
          aria-label="387 Weddings"
          className="flex-none"
        >
          {/* One mark scaled by CSS. Two Logo elements put the brand — and its
              aria-label — in the DOM twice for every page. */}
          <Logo size={38} className="w-[53px] lg:w-[92px] h-auto" color="currentColor" />
        </Link>

        {/* Right-hand side: the page links on a desktop, then one language
            switch shared by every screen, then the hamburger on a phone. There
            used to be a second switch, hidden, for the other screen size. */}
        <div className="flex items-center gap-[14px] lg:gap-11">
        <nav className="hidden lg:flex items-center gap-y-2 gap-x-11">
          {links.map(link => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => handleLinkClick(link.path)}
                aria-current={active ? 'page' : undefined}
                style={getContentStyle(link.styleKey)}
                className={cn(
                  'py-[14px] min-h-11 flex items-center uppercase tracking-[0.14em] transition-colors duration-250',
                  'hover:shadow-[inset_0_-1px_0_var(--color-gold-600)]',
                  active ? 'text-[15px]' : 'text-[13px]',
                  active
                    ? overHero
                      ? 'text-white font-semibold border-b border-gold-600'
                      : 'text-ink-900 font-semibold border-b border-gold-600'
                    : overHero
                      ? 'text-[#e8e1d6] font-medium hover:text-white'
                      : 'text-ink-700 font-medium hover:text-ink-900',
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <span
            aria-hidden="true"
            className={cn('w-px h-5 flex-none', overHero ? 'bg-white/40' : 'bg-[#c8bba8]')}
          />
        </nav>

        <LangSwitch light={overHero} size={10} />

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(o => !o)}
            aria-label={isMobileMenuOpen ? 'Zatvori' : 'Meni'}
            aria-expanded={isMobileMenuOpen}
            className={cn(
              'lg:hidden px-1 py-3 min-w-11 min-h-11 justify-center',
              isMobileMenuOpen ? 'relative flex items-center' : 'flex flex-col items-end gap-[7px]',
            )}
          >
            {isMobileMenuOpen ? (
              <>
                <span className="absolute w-[26px] h-px bg-ink-900 rotate-45" />
                <span className="absolute w-[26px] h-px bg-ink-900 -rotate-45" />
              </>
            ) : (
              <>
                <span className={cn('block w-[26px] h-px', overHero ? 'bg-white' : 'bg-ink-900')} />
                <span className={cn('block w-[26px] h-px', overHero ? 'bg-white' : 'bg-ink-900')} />
                <span className={cn('block w-[18px] h-px', overHero ? 'bg-white' : 'bg-ink-900')} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Full-screen mobile menu ─────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1010] bg-cream flex flex-col lg:hidden overflow-hidden animate-[fadeIn_0.3s_cubic-bezier(.2,.6,.2,1)_both] motion-reduce:animate-none"
          role="dialog"
          aria-modal="true"
          aria-label="Meni"
        >
            {/* The header above stays put and carries the logo, the language
                switch and the close button — the menu no longer draws its own. */}
            <div aria-hidden="true" className="flex-none h-[58px]" />

            <nav aria-label="Glavni meni" className="flex-1 flex flex-col items-center justify-center gap-1 pb-5">
              {links.map(link => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    aria-current={active ? 'page' : undefined}
                    style={getContentStyle(link.styleKey)}
                    className={cn(
                      'flex flex-col items-center py-4 font-serif text-[40px] leading-[1.1] text-ink-900 transition-opacity duration-250 hover:opacity-60',
                      active && 'italic',
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn('w-7 h-px bg-gold-600 mt-3', active ? 'opacity-100' : 'opacity-0')}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="px-6 pb-10 text-center">
              {/* Ornament: rule, red diamond, rule */}
              <div className="flex items-center justify-center gap-3 mb-7" aria-hidden="true">
                <span className="w-11 h-px bg-gold-600" />
                <span className="w-1.5 h-1.5 bg-love rotate-45" />
                <span className="w-11 h-px bg-gold-600" />
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-ink-900 text-[10px] tracking-[0.24em] uppercase transition-opacity duration-250 hover:opacity-60"
              >
                <InstagramGlyph stroke="#151311" />
                @{instagramHandle}
              </a>
            </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
