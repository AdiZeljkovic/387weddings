import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
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

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-[1000] transition-all duration-500 px-6 md:px-8 lg:px-16 bg-white/95 backdrop-blur-md",
          scrolled
            ? "py-4 md:py-5 border-b border-gold-600/10 shadow-sm"
            : "py-5 md:py-7 border-b border-gold-600/5"
        )}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Left: Desktop links | Mobile: empty spacer */}
          <div className="flex-1 flex items-center justify-end pr-4 lg:pr-12 xl:pr-20">
            <div className="hidden lg:flex items-center gap-8 xl:gap-16">
              {leftLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => handleLinkClick(link.path)}
                  className={cn("luxury-text-base transition-all duration-500 relative pb-1",
                    location.pathname === link.path ? "text-gold-600"
                      : "text-moody-900/60 hover:text-moody-900"
                  )}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Logo — centered */}
          <div className="flex-none flex justify-center">
            <Link to="/" className="flex flex-col items-center group relative z-10">
              <span className={cn(
                "text-[2rem] md:text-[2.25rem] xl:text-[2.5rem] font-script tracking-normal transition-colors duration-500 leading-none",
                "text-moody-900"
              )}>
                3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
              </span>
              <span className={cn(
                "text-[9px] md:text-[11px] xl:text-[12px] tracking-[0.75em] uppercase font-bold mt-0.5 transition-colors duration-500",
                "text-gold-600"
              )}>
                Weddings
              </span>
            </Link>
          </div>

          {/* Right: Desktop links | Mobile: hamburger */}
          <div className="flex-1 flex items-center justify-start pl-4 lg:pl-12 xl:pl-20">
            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-16">
              {rightLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => handleLinkClick(link.path)}
                  className={cn("luxury-text-base transition-all duration-500 relative pb-1",
                    location.pathname === link.path ? "text-gold-600"
                      : "text-moody-900/60 hover:text-moody-900"
                  )}>
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3">
                {(['ENG', 'BOS'] as const).map((lang, i) => (
                  <React.Fragment key={lang}>
                    {i > 0 && <span className="w-[1px] h-3 bg-moody-900/10" />}
                    <button type="button" onClick={() => setLanguage(lang)}
                      className={cn("luxury-text-base transition-all duration-500 cursor-pointer",
                        language === lang ? "text-gold-600" : "text-moody-900/60 hover:text-moody-900"
                      )}>
                      {lang}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="flex lg:hidden flex-1 justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn("p-2 -mr-2 transition-colors duration-500",
                  "text-moody-900"
                )}
                aria-label="Toggle menu"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Full-screen mobile menu ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[999] bg-gold-50 flex flex-col lg:hidden overflow-hidden"
          >
            {/* Top bar — logo + close */}
            <div className="flex items-center justify-between px-6 py-6 flex-shrink-0">
              <div className="flex-1" />
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center">
                <span className="text-[2rem] font-script text-moody-900 leading-none">
                  3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
                </span>
                <span className="text-[9px] tracking-[0.75em] uppercase font-bold text-gold-600 mt-0.5">
                  Weddings
                </span>
              </Link>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-moody-900/50 hover:text-moody-900 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Nav links — large serif */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-8">
              {allLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className={cn(
                      "text-5xl sm:text-6xl font-serif font-light block text-center py-3 transition-colors duration-300",
                      location.pathname === link.path ? "text-gold-600" : "text-moody-900/35 hover:text-moody-900/70"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Bottom bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex-shrink-0 border-t border-gold-600/10 px-8 pt-6 pb-10 relative overflow-hidden"
            >
              {/* Decorative 387 watermark */}
              <div className="absolute -bottom-4 right-4 text-[9rem] font-script text-moody-900/[0.04] leading-none select-none pointer-events-none">
                387
              </div>

              {/* Language switcher */}
              <div className="flex items-center justify-center gap-5 mb-5">
                {(['ENG', 'BOS'] as const).map((lang, i) => (
                  <React.Fragment key={lang}>
                    {i > 0 && <span className="w-[1px] h-4 bg-moody-900/10" />}
                    <button
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "text-[12px] tracking-[0.35em] font-bold transition-colors duration-300",
                        language === lang ? "text-gold-600" : "text-moody-900/30"
                      )}
                    >
                      {lang}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Connect */}
              {email && (
                <div className="space-y-1 relative z-10 text-center">
                  <span className="text-[9px] tracking-[0.5em] uppercase font-bold text-gold-600 block">
                    {t('footer.navigation') === 'Navigation' ? 'Connect' : t('footer.navigation')}
                  </span>
                  <a
                    href={`mailto:${email}`}
                    className="text-moody-900/35 text-xs hover:text-gold-600 transition-colors duration-300"
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
