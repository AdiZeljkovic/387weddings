import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Heart, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

// Lucide carries no Pinterest glyph, so the brand mark is inlined
const PinterestIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

const Footer = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  // Phones collapse the two link columns, exactly as in the mockup
  const [openPanel, setOpenPanel] = useState<'nav' | 'contact' | null>(null);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => { console.warn('Footer: failed to load settings', err); });
  }, []);

  const email = settings.email || '';

  const socials = [
    { icon: <Instagram size={17} strokeWidth={1.5} />, href: settings.instagram, label: 'Instagram' },
    { icon: <Facebook size={17} strokeWidth={1.5} />,  href: settings.facebook,  label: 'Facebook' },
    { icon: <Youtube size={17} strokeWidth={1.5} />,   href: settings.youtube,   label: 'YouTube' },
    { icon: <PinterestIcon />,                          href: settings.pinterest, label: 'Pinterest' },
  ].filter(s => s.href && s.href !== '#');

  const navLinks = [
    { to: '/',         label: t('nav.home'),       styleKey: 'nav.home' },
    { to: '/services', label: t('nav.experience'), styleKey: 'nav.experience' },
    { to: '/about',    label: t('nav.stories'),    styleKey: 'nav.stories' },
    { to: '/contact',  label: t('nav.inquire'),    styleKey: 'nav.inquire' },
  ];

  const navList = (
    <ul className="space-y-3.5">
      {navLinks.map(l => (
        <li key={l.to}>
          <Link
            to={l.to}
            style={getContentStyle(l.styleKey)}
            className="text-white/55 hover:text-white text-[12px] tracking-[0.18em] uppercase transition-colors duration-500"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const contactList = (
    <ul className="space-y-4 text-white/55 text-[13px] font-light">
      {settings.phone && (
        <li>
          <a
            href={`tel:${settings.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-3.5 hover:text-white transition-colors duration-300"
          >
            <Phone size={15} strokeWidth={1.5} className="text-white/45 flex-shrink-0" aria-hidden="true" />
            {settings.phone}
          </a>
        </li>
      )}
      {email && (
        <li>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-3.5 hover:text-white transition-colors duration-300"
          >
            <Mail size={15} strokeWidth={1.5} className="text-white/45 flex-shrink-0" aria-hidden="true" />
            {email}
          </a>
        </li>
      )}
      {settings.location && (
        <li className="inline-flex items-center gap-3.5">
          <MapPin size={15} strokeWidth={1.5} className="text-white/45 flex-shrink-0" aria-hidden="true" />
          {settings.location}
        </li>
      )}
    </ul>
  );

  // Collapsible column — phones only; `md` and up renders the plain list
  const Panel = ({ id, heading, styleKey, children }: {
    id: 'nav' | 'contact';
    heading: string;
    styleKey: string;
    children: React.ReactNode;
  }) => {
    const open = openPanel === id;
    return (
      <div>
        {/* Phone: heading is a toggle with a hairline underneath */}
        <button
          type="button"
          onClick={() => setOpenPanel(open ? null : id)}
          aria-expanded={open}
          className="md:hidden w-full flex items-center justify-between py-4 border-b border-white/10"
        >
          <span
            style={getContentStyle(styleKey)}
            className="text-[11px] tracking-[0.3em] uppercase font-semibold text-white"
          >
            {heading}
          </span>
          <ChevronDown
            size={15}
            className={cn('text-white/40 transition-transform duration-500', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {open && <div className="md:hidden pt-5 pb-6">{children}</div>}

        {/* Desktop column */}
        <div className="hidden md:block">
          <h4
            style={getContentStyle(styleKey)}
            className="text-[11px] tracking-[0.3em] uppercase font-semibold text-white mb-7"
          >
            {heading}
          </h4>
          {children}
        </div>
      </div>
    );
  };

  return (
    <footer className="relative bg-moody-900 text-white">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-14 pt-14 md:pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-0 mb-10 md:mb-16">
          {/* Brand */}
          <div className="md:col-span-5 lg:col-span-6 mb-8 md:mb-0">
            <Link to="/" className="inline-flex flex-col items-start leading-none" aria-label="387 Weddings">
              <span className="font-serif font-light text-[2rem] md:text-[2.25rem] leading-none text-white">387</span>
              <span className="text-[8px] md:text-[9px] tracking-[0.52em] uppercase font-semibold text-white/60 mt-1">
                Weddings
              </span>
            </Link>

            <p
              style={getContentStyle('footer.tagline')}
              className="text-white/50 max-w-xs font-light text-[13px] leading-[1.9] mt-6 whitespace-pre-line"
            >
              {t('footer.tagline')}
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-5 mt-7">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors duration-500"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <Panel id="nav" heading={t('footer.navigation')} styleKey="footer.navigation">
              {navList}
            </Panel>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 lg:col-span-3">
            <Panel id="contact" heading={t('footer.contact')} styleKey="footer.contact">
              {contactList}
            </Panel>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span style={getContentStyle('footer.rights')} className="text-[11px] text-white/40 font-light">
            © {new Date().getFullYear()} 387 Weddings. {t('footer.rights')}
          </span>
          <span className="inline-flex items-center gap-2 text-[11px] text-white/40 font-light">
            <span style={getContentStyle('footer.designed')}>{t('footer.designed')}</span>
            <Heart size={11} strokeWidth={1.5} className="text-white/40" aria-hidden="true" />
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
