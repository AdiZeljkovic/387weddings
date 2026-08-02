import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const leftLinks = [
    { path: '/portfolio', label: t('nav.work') },
    { path: '/services', label: t('nav.experience') },
  ];
  const rightLinks = [
    { path: '/about', label: t('nav.stories') },
    { path: '/contact', label: t('nav.inquire') },
  ];
  const allLinks = [...leftLinks, ...rightLinks];
  const scrolled = isScrolled;

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === path) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The whole site is a dark editorial canvas now, so the header keeps the
  // light-on-dark treatment everywhere; scrolling only solidifies the backdrop.
  const onHome = location.pathname === '/';
  const overlay = true;

  // Desktop nav item — gold rule grows from the centre on hover, stays for the
  // current page; the label widens a touch so the motion reads as intentional.
  const NavLink = ({ path, label }: { path: string; label: string }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => handleLinkClick(path)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative py-1.5 luxury-text-base transition-colors duration-500',
          active
            ? (overlay ? 'text-gold-300' : 'text-gold-600')
            : overlay
              ? 'text-white/75 hover:text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]'
              : 'text-moody-900/55 hover:text-moody-900',
        )}
      >
        <span className="transition-[letter-spacing] duration-700 group-hover:tracking-[0.34em]">
          {label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 -bottom-0.5 h-[1px] origin-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
            overlay ? 'bg-gold-300' : 'bg-gold-600',
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
          )}
        />
      </Link>
    );
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "top-0 left-0 right-0 z-[1000] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] px-6 md:px-8 lg:px-16",
          // Home floats the bar over its dark hero; every other page keeps it in flow
          onHome ? "fixed" : "sticky",
          scrolled ? "bg-moody-950/85 backdrop-blur-xl" : "bg-transparent",
          scrolled ? "py-3.5 md:py-4 shadow-[0_1px_24px_rgba(0,0,0,0.35)]" : "py-5 md:py-7"
        )}
      >
        {/* Hairline that fades out toward the edges — softer than a full border */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent to-transparent transition-opacity duration-700",
            // The bar floats over dark canvases — no line until it solidifies
            cn("via-white/15", scrolled ? "opacity-100" : "opacity-0")
          )}
        />

        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Left: Desktop links | Mobile: hamburger */}
          <div className="flex-1 flex items-center justify-end pr-4 lg:pr-10 xl:pl-0 xl:pr-16">
            {/* Mobile hamburger — two rules that morph into a cross */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden mr-auto relative w-11 h-11 -ml-2 flex flex-col items-center justify-center gap-[7px] group"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className={cn("block w-6 h-[1.5px] transition-colors duration-500", overlay ? "bg-white group-hover:bg-gold-300" : "bg-moody-900 group-hover:bg-gold-600")} />
              <span className={cn("block w-4 h-[1.5px] group-hover:w-6 transition-all duration-500", overlay ? "bg-white group-hover:bg-gold-300" : "bg-moody-900 group-hover:bg-gold-600")} />
            </button>

            <div className="hidden lg:flex items-center gap-8 xl:gap-14">
              {leftLinks.map(link => (
                <NavLink key={link.path} path={link.path} label={link.label} />
              ))}
            </div>
          </div>

          {/* Logo — centered, flanked by hairlines that reach toward the links */}
          <div className="flex-none flex items-center justify-center gap-6 xl:gap-9">
            <span
              aria-hidden="true"
              className={cn("hidden lg:block w-10 xl:w-16 h-[1px] bg-gradient-to-l to-transparent transition-colors duration-700", overlay ? "from-white/45" : "from-gold-600/40")}
            />

            <Link to="/" className="flex flex-col items-center group relative z-10">
              <span
                className={cn(
                  "font-script tracking-normal leading-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", overlay ? "text-white group-hover:text-gold-200 [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]" : "text-moody-900 group-hover:text-gold-700",
                  scrolled
                    ? "text-[1.85rem] md:text-[2rem] xl:text-[2.2rem]"
                    : "text-[2rem] md:text-[2.25rem] xl:text-[2.5rem]"
                )}
              >
                3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
              </span>
              <span
                className={cn(
                  "uppercase font-bold mt-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", overlay ? "text-gold-200" : "text-gold-600",
                  scrolled
                    ? "text-[8px] md:text-[10px] tracking-[0.7em]"
                    : "text-[9px] md:text-[11px] xl:text-[12px] tracking-[0.75em] group-hover:tracking-[0.85em]"
                )}
              >
                Weddings
              </span>
            </Link>

            <span
              aria-hidden="true"
              className={cn("hidden lg:block w-10 xl:w-16 h-[1px] bg-gradient-to-r to-transparent transition-colors duration-700", overlay ? "from-white/45" : "from-gold-600/40")}
            />
          </div>

          {/* Right: Desktop links | Mobile: hamburger */}
          <div className="flex-1 flex items-center justify-start pl-4 lg:pl-10 xl:pl-16">
            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-14">
              {rightLinks.map(link => (
                <NavLink key={link.path} path={link.path} label={link.label} />
              ))}

              {/* Language — set apart from the nav by a vertical hairline */}
              <div className={cn("flex items-center gap-3.5 pl-8 xl:pl-12 border-l transition-colors duration-700", overlay ? "border-white/20" : "border-moody-900/10")}>
                {(['ENG', 'BOS'] as const).map((lang, i) => (
                  <React.Fragment key={lang}>
                    {i > 0 && <span className={cn("w-[1px] h-3 transition-colors duration-700", overlay ? "bg-white/25" : "bg-moody-900/15")} aria-hidden="true" />}
                    <button
                      type="button"
                      onClick={() => setLanguage(lang)}
                      aria-pressed={language === lang}
                      className={cn(
                        "text-[11px] xl:text-[12px] tracking-[0.28em] font-medium transition-colors duration-500 cursor-pointer",
                        language === lang ? (overlay ? "text-gold-300" : "text-gold-600") : overlay ? "text-white/55 hover:text-white" : "text-moody-900/35 hover:text-moody-900"
                      )}
                    >
                      {lang}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Mobile: invisible spacer that mirrors the hamburger, so the logo stays centred */}
            <div className="flex lg:hidden flex-1 justify-end">
              <span className="w-11 h-11" aria-hidden="true" />
            </div>
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
            {/* Warm glow + oversized script mark */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(166,134,93,0.14) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-12 -right-6 text-[15rem] font-script text-white/[0.035] leading-none select-none pointer-events-none"
              aria-hidden="true"
            >
              387
            </div>

            {/* Top bar — mirrors the header so the logo never appears to move */}
            <div className="relative flex items-center justify-between px-6 py-5 flex-shrink-0">
              <div className="flex-1" />
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center">
                <span className="text-[2rem] font-script text-white leading-none">
                  3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
                </span>
                <span className="text-[9px] tracking-[0.75em] uppercase font-bold text-gold-400 mt-0.5">
                  Weddings
                </span>
              </Link>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative w-11 h-11 -mr-2 flex items-center justify-center group"
                  aria-label="Close menu"
                >
                  <motion.span
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 45, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute block w-6 h-[1.5px] bg-white group-hover:bg-gold-300 transition-colors duration-500"
                  />
                  <motion.span
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: -45, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute block w-6 h-[1.5px] bg-moody-900 group-hover:bg-gold-600 transition-colors duration-500"
                  />
                </button>
              </div>
            </div>

            {/* Nav links — each rises through its own mask */}
            <nav className="relative flex-1 flex flex-col items-center justify-center px-8">
              {allLinks.map((link, i) => {
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
                          'group relative block text-center text-[2.75rem] sm:text-6xl font-serif font-light leading-tight transition-colors duration-500',
                          active ? 'text-gold-300' : 'text-white/80 hover:text-gold-300',
                        )}
                      >
                        {link.label}
                        {/* Gold rule under the current page */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'block h-[1px] bg-gold-400 mx-auto mt-1 transition-all duration-500',
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
              transition={{ delay: 0.75, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex-shrink-0 border-t border-white/10 px-8 pt-7 pb-10"
            >
              {/* Language switcher */}
              <div className="flex items-center justify-center gap-5 mb-6">
                {(['ENG', 'BOS'] as const).map((lang, i) => (
                  <React.Fragment key={lang}>
                    {i > 0 && <span className="w-[1px] h-4 bg-white/15" aria-hidden="true" />}
                    <button
                      type="button"
                      onClick={() => setLanguage(lang)}
                      aria-pressed={language === lang}
                      className={cn(
                        'px-2 py-1 text-[12px] tracking-[0.35em] font-bold transition-colors duration-300',
                        language === lang ? 'text-gold-300' : 'text-white/40 hover:text-white/80',
                      )}
                    >
                      {lang}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Connect */}
              {email && (
                <div className="space-y-2 text-center">
                  <span className="text-[9px] tracking-[0.5em] uppercase font-bold text-gold-400 block">
                    {language === 'ENG' ? 'Connect' : 'Kontakt'}
                  </span>
                  <a
                    href={`mailto:${email}`}
                    className="inline-block text-white/50 text-xs hover:text-gold-300 transition-colors duration-300"
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
