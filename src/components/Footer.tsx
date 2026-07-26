import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Instagram, Facebook, Twitter, Youtube, Music2, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';

const IG_FALLBACKS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
];

// Instagram feed + footer merged into one dark, editorial closing block
const Footer = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => { console.warn('Footer: failed to load settings', err); });
  }, []);

  const instagramUrl = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : 'https://instagram.com/art387weddings';
  const instagramHandle = settings.instagram_handle ? `@${settings.instagram_handle}` : '@art387weddings';
  const email = settings.email || 'hello@387cinematicweddings.com';

  const igImages = [1, 2, 3, 4, 5, 6, 7, 8].map(
    (n, i) => settings[`img.instagram.${n}`] || IG_FALLBACKS[i]
  );

  const socials = [
    { icon: <Instagram size={17} strokeWidth={1.5} />, href: settings.instagram, label: 'Instagram' },
    { icon: <Facebook size={17} strokeWidth={1.5} />, href: settings.facebook, label: 'Facebook' },
    { icon: <Twitter size={17} strokeWidth={1.5} />, href: settings.twitter, label: 'Twitter / X' },
    { icon: <Youtube size={17} strokeWidth={1.5} />, href: settings.youtube, label: 'YouTube' },
    { icon: <Music2 size={17} strokeWidth={1.5} />, href: settings.tiktok, label: 'TikTok' },
  ].filter(s => s.href && s.href !== '#');

  const navLinks = [
    { to: '/portfolio', label: t('nav.work'),       styleKey: 'nav.work' },
    { to: '/services',  label: t('nav.experience'), styleKey: 'nav.experience' },
    { to: '/about',     label: t('nav.stories'),    styleKey: 'nav.stories' },
    { to: '/contact',   label: t('nav.inquire'),    styleKey: 'nav.inquire' },
  ];

  return (
    <footer className="relative bg-moody-950 overflow-hidden">
      {/* Hairline gold divider at the very top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-600/50 to-transparent" aria-hidden="true" />
      {/* Soft gold glow behind the heading */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 65% at 50% 0%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* ── Instagram ─────────────────────────────────────────────────────── */}
      <div className="relative pt-20 md:pt-28">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16 text-center md:text-left">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="text-[10px] md:text-[11px] tracking-[0.6em] uppercase text-gold-500 font-bold block mb-5"
            >
              {settings.instagram_section_tag || 'Social'}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white leading-tight"
            >
              {settings.instagram_section_heading || 'Follow Our Journey'}
            </motion.h2>
          </div>

          <motion.a
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${instagramHandle}`}
            className="inline-flex items-center gap-3.5 self-center md:self-end group"
          >
            <span className="w-11 h-11 rounded-full border border-gold-600/40 flex items-center justify-center text-gold-500 group-hover:bg-gold-600 group-hover:border-gold-600 group-hover:text-white transition-all duration-500">
              <Instagram size={17} aria-hidden="true" />
            </span>
            <span className="text-[11px] md:text-[12px] tracking-[0.35em] uppercase font-bold text-white/50 group-hover:text-white transition-colors duration-500">
              {instagramHandle}
            </span>
            <ArrowUpRight size={14} className="text-gold-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" aria-hidden="true" />
          </motion.a>
        </div>

        {/* Full-bleed image grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-[2px]">
          {igImages.map((src, i) => (
            <motion.a
              key={i}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram photo ${i + 1}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-square overflow-hidden group"
            >
              <img
                src={respImg(src, [320, 480]).src}
                srcSet={respImg(src, [320, 480]).srcSet}
                sizes="(min-width: 768px) 12.5vw, 25vw"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-moody-950/0 group-hover:bg-moody-950/45 transition-colors duration-700" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
                <Instagram className="text-white" size={22} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* ── Footer core ───────────────────────────────────────────────────── */}
      <div className="relative max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 pt-16 md:pt-24 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-14 md:mb-20 text-center lg:text-left">
          {/* Brand */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start">
            <Link to="/" className="group inline-flex flex-col items-center lg:items-start mb-6">
              <span className="text-[2.25rem] md:text-[2.5rem] font-script text-white group-hover:text-gold-400 transition-colors duration-500 leading-none">
                3<span className="inline-block relative -top-[4px]">8</span>7 Cinematic
              </span>
              <span className="text-[9px] md:text-[10px] tracking-[0.75em] uppercase font-bold mt-1 text-gold-500">
                Weddings
              </span>
            </Link>
            <p style={getContentStyle('footer.tagline')} className="text-white/35 max-w-sm font-light text-sm leading-relaxed italic">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start">
            <h4 style={getContentStyle('footer.navigation')} className="text-[10px] tracking-[0.5em] uppercase font-bold text-gold-500 mb-7">
              {t('footer.navigation')}
            </h4>
            <ul className="space-y-4">
              {navLinks.map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    style={getContentStyle(l.styleKey)}
                    className="text-white/40 hover:text-white text-[11px] tracking-[0.3em] uppercase font-bold transition-colors duration-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + socials */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <h4 style={getContentStyle('contact.connect.tag')} className="text-[10px] tracking-[0.5em] uppercase font-bold text-gold-500 mb-7">
              {t('contact.connect.tag')}
            </h4>
            <ul className="space-y-4 text-white/40 text-sm font-light">
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-3 hover:text-gold-400 transition-colors duration-300">
                  <Mail size={14} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                  {email}
                </a>
              </li>
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-3 hover:text-gold-400 transition-colors duration-300">
                    <Phone size={14} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.location && (
                <li className="inline-flex items-center gap-3">
                  <MapPin size={14} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                  {settings.location}
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <div className="flex gap-4 mt-8">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-gold-600/60 hover:bg-gold-600/15 transition-all duration-500"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 text-[9px] tracking-[0.35em] uppercase text-white/20 font-bold text-center">
          <span style={getContentStyle('footer.rights')}>
            © {new Date().getFullYear()} 387 Cinematic Weddings. {t('footer.rights')}
          </span>
          <span style={getContentStyle('footer.designed')}>{t('footer.designed')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
