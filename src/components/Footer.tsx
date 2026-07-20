import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, Music2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const Footer = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => { console.warn('Footer: failed to load settings', err); });
  }, []);

  const socials = [
    { icon: <Instagram size={20} strokeWidth={1} />, href: settings.instagram, label: 'Instagram' },
    { icon: <Facebook size={20} strokeWidth={1} />, href: settings.facebook, label: 'Facebook' },
    { icon: <Twitter size={20} strokeWidth={1} />, href: settings.twitter, label: 'Twitter / X' },
    { icon: <Youtube size={20} strokeWidth={1} />, href: settings.youtube, label: 'YouTube' },
    { icon: <Music2 size={20} strokeWidth={1} />, href: settings.tiktok, label: 'TikTok' },
  ].filter(s => s.href && s.href !== '#');

  return (
    <footer className="bg-gold-100/30 py-20 px-8 lg:px-16 border-t border-gold-600/10">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col items-center text-center gap-12">
          <div className="flex flex-col items-center">
            <Link to="/" className="flex flex-col mb-10 group items-center">
              <span className="text-[2.5rem] md:text-[3rem] font-script tracking-normal text-moody-900 group-hover:text-gold-600 transition-colors duration-500 leading-none">
                3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
              </span>
              <span className="text-[9px] md:text-[11px] tracking-[0.75em] uppercase font-bold mt-0.5 text-gold-600">
                Weddings
              </span>
            </Link>
            <p className="text-moody-900/40 max-w-sm mb-10 font-light text-sm leading-relaxed italic">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-10 justify-center">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moody-900/30 hover:text-gold-600 transition-colors duration-500"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="luxury-text-sm mb-8">{t('footer.navigation')}</h4>
            <ul className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-moody-900/50 text-[10px] tracking-[0.2em] uppercase font-bold">
              <li><Link to="/portfolio" className="hover:text-gold-600 transition-colors duration-500">{t('nav.work')}</Link></li>
              <li><Link to="/services" className="hover:text-gold-600 transition-colors duration-500">{t('nav.experience')}</Link></li>
              <li><Link to="/about" className="hover:text-gold-600 transition-colors duration-500">{t('nav.stories')}</Link></li>
              <li><Link to="/contact" className="hover:text-gold-600 transition-colors duration-500">{t('nav.inquire')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-16 mt-16 border-t border-gold-600/10 flex flex-col items-center gap-4 text-center text-[9px] tracking-[0.4em] uppercase text-moody-900/20 font-bold">
          <span>© {new Date().getFullYear()} 387 Cinematic Weddings. {t('footer.rights')}</span>
          <span>{t('footer.designed')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
