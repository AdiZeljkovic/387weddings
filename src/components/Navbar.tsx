import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

// Brand lockup — serif numeral over a letterspaced wordmark
const Wordmark = ({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) => (
  <span className="flex flex-col items-start leading-none">
    <span
      className={cn(
        'font-serif font-light leading-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
        dark ? 'text-ink-900' : 'text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]',
        compact ? 'text-[1.7rem] md:text-[1.85rem]' : 'text-[1.9rem] md:text-[2.15rem]',
      )}
    >
      387
    </span>
    <span
      className={cn(
        'uppercase font-semibold mt-1 transition-all duration-700',
        dark ? 'text-ink-500' : 'text-white/70',
        compact ? 'text-[7px] tracking-[0.5em]' : 'text-[8px] md:text-[9px] tracking-[0.52em]',
      )}
    >
      Weddings
    </span>
  </span>
);

const Navbar = () => {
  const { t, language, setLanguage, getContentStyle } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Coalesce scroll events into one rAF — the header only cares about a
    // single threshold, so reacting per event is wasted main-thread work.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setIsScrolled(window.scrollY > 50);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    loadSettings().then(s => setEmail(s['email'] || '')).catch(() => {});
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const links = [
    { path: '/',         label: t('nav.home'),       styleKey: 'nav.home' },
    { path: '/services', label: t('nav.experience'), styleKey: 'nav.experience' },
    { path: '/about',    label: t('nav.stories'),    styleKey: 'nav.stories' },
    { path: '/contact',  label: t('nav.inquire'),    styleKey: 'nav.inquire' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === path) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Home opens on a dark hero and then scrolls onto paper, so its solid state is
  // light; every other page is a dark canvas and keeps the dark bar.
  const onHome = location.pathname === '/';
  const lightBar = onHome && isScrolled;

  // Desktop nav item — hairline rule under the current page, drawn on hover
  const NavLink = ({ path, label, styleKey }: { path: string; label: string; styleKey: string }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => handleLinkClick(path)}
        aria-current={active ? 'page' : undefined}
        style={getContentStyle(styleKey)}
        className={cn(
          'group relative py-1 text-[11px] xl:text-[12px] tracking-[0.22em] uppercase font-medium transition-colors duration-500',
          lightBar
            ? active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
            : active ? 'text-white' : 'text-white/70 hover:text-white',
        )}
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 -bottom-1 h-[1px] origin-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
            lightBar ? 'bg-ink-900' : 'bg-white',
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
          )}
        />
      </Link>
    );
  };

  const LangSwitch = ({ dark }: { dark: boolean }) => (
    <div className="flex items-center gap-3">
      {(['ENG', 'BOS'] as const).map((lang, i) => (
        <React.Fragment key={lang}>
          {i > 0 && (
            <span
              className={cn('w-[1px] h-3', dark ? 'bg-ink-900/20' : 'bg-white/30')}
              aria-hidden="true"
            />
          )}
          <button
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={language === lang}
            className={cn(
              'text-[11px] tracking-[0.2em] font-medium transition-colors duration-500 cursor-pointer',
              language === lang
                ? dark ? 'text-ink-900' : 'text-white'
                : dark ? 'text-ink-400 hover:text-ink-900' : 'text-white/50 hover:text-white',
            )}
          >
            {lang}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          // Only padding/colour/shadow transition — `transition-all` on a fixed
          // bar animates layout properties the browser must re-solve each frame.
          'top-0 left-0 right-0 z-[1000] px-6 md:px-8 lg:px-14',
          'transition-[padding,background-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
          // Home floats the bar over its hero; every other page keeps it in flow
          onHome ? 'fixed' : 'sticky',
          // A near-opaque bar reads the same as a frosted one but skips the
          // full-width backdrop-filter, which re-blurs on every scrolled frame.
          !isScrolled
            ? 'bg-transparent py-5 md:py-7'
            : lightBar
              ? 'bg-canvas-50/97 py-3.5 md:py-4 shadow-[0_1px_20px_rgba(0,0,0,0.07)]'
              : 'bg-moody-950/97 py-3.5 md:py-4 shadow-[0_1px_24px_rgba(0,0,0,0.35)]',
        )}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          {/* Logo — left */}
          <Link to="/" onClick={() => handleLinkClick('/')} className="flex-none group" aria-label="387 Weddings">
            <Wordmark dark={lightBar} compact={isScrolled} />
          </Link>

          {/* Desktop — links, hairline, language */}
          <div className="hidden lg:flex items-center gap-9 xl:gap-12">
            {links.map(link => (
              <NavLink key={link.path} path={link.path} label={link.label} styleKey={link.styleKey} />
            ))}

            <span
              className={cn('w-[1px] h-4 transition-colors duration-700', lightBar ? 'bg-ink-900/20' : 'bg-white/25')}
              aria-hidden="true"
            />

            <LangSwitch dark={lightBar} />
          </div>

          {/* Mobile — language + hamburger */}
          <div className="flex lg:hidden items-center gap-5">
            <LangSwitch dark={lightBar} />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="relative w-9 h-9 -mr-1 flex flex-col items-center justify-center gap-[6px] group"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className={cn('block w-6 h-[1.5px] transition-colors duration-500', lightBar ? 'bg-ink-900' : 'bg-white')} />
              <span className={cn('block w-6 h-[1.5px] transition-colors duration-500', lightBar ? 'bg-ink-900' : 'bg-white')} />
              <span className={cn('block w-6 h-[1.5px] transition-colors duration-500', lightBar ? 'bg-ink-900' : 'bg-white')} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Full-screen mobile menu ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[1010] bg-moody-950 flex flex-col lg:hidden overflow-hidden"
          >
            <div
              className="absolute -bottom-12 -right-6 text-[15rem] font-serif text-white/[0.035] leading-none select-none pointer-events-none"
              aria-hidden="true"
            >
              387
            </div>

            {/* Top bar — mirrors the header so the logo never appears to move */}
            <div className="relative flex items-center justify-between px-6 py-5 flex-shrink-0">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} aria-label="387 Weddings">
                <Wordmark />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative w-11 h-11 -mr-2 flex items-center justify-center group"
                aria-label="Close menu"
              >
                <motion.span
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: 45, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute block w-6 h-[1.5px] bg-white"
                />
                <motion.span
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: -45, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute block w-6 h-[1.5px] bg-white"
                />
              </button>
            </div>

            {/* Nav links — each rises through its own mask */}
            <nav className="relative flex-1 flex flex-col items-center justify-center px-8">
              {links.map((link, i) => {
                const active = location.pathname === link.path;
                return (
                  <div key={link.path} className="overflow-hidden py-1.5">
                    <motion.div
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      transition={{ delay: 0.25 + i * 0.11, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => handleLinkClick(link.path)}
                        className={cn(
                          'group relative block text-center text-[2.5rem] sm:text-5xl font-serif font-light leading-tight transition-colors duration-500',
                          active ? 'text-white' : 'text-white/70 hover:text-white',
                        )}
                      >
                        {link.label}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'block h-[1px] bg-white mx-auto mt-1 transition-all duration-500',
                            active ? 'w-10' : 'w-0 group-hover:w-10',
                          )}
                        />
                      </Link>
                    </motion.div>
                  </div>
                );
              })}
            </nav>

            {/* Bottom bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex-shrink-0 border-t border-white/10 px-8 pt-7 pb-10"
            >
              <div className="flex items-center justify-center mb-6">
                <LangSwitch dark={false} />
              </div>

              {email && (
                <div className="text-center">
                  <a
                    href={`mailto:${email}`}
                    className="inline-block text-white/50 text-xs hover:text-white transition-colors duration-300"
                  >
                    {email}
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
