import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Instagram, Facebook } from 'lucide-react';
import { loadSettings } from '../lib/settingsCache';

export default function ComingSoon() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});

    // Tell crawlers not to index the Coming Soon page
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = 'noindex, nofollow';

    return () => { if (meta) meta.content = prev; };
  }, []);

  return (
    <div className="min-h-screen bg-moody-950 flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="grain opacity-[0.06]" />

      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 flex flex-col items-center gap-1"
        >
          <span className="text-3xl md:text-4xl font-serif font-light tracking-tighter uppercase text-white">
            387 Cinematic
          </span>
          <span className="text-[10px] tracking-[0.55em] uppercase font-bold text-gold-600">
            Weddings
          </span>
        </motion.div>

        {/* Thin line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-px bg-gold-600/40 mb-16 md:mb-20 origin-center"
        />

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2 md:space-y-4 mb-10 md:mb-14"
        >
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-serif font-light text-white leading-none tracking-tighter">
            Uskoro
          </h1>
          <p className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-serif font-light text-white/20 italic leading-none tracking-tighter">
            nešto lijepo.
          </p>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.2 }}
          className="text-white/30 text-[10px] md:text-[11px] tracking-[0.65em] uppercase font-bold mb-16 md:mb-24"
        >
          Fine-art vjenčana fotografija &nbsp;·&nbsp; Sarajevo — Worldwide
        </motion.p>

        {/* Thin vertical line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-px h-16 bg-gold-600/20 mb-12 origin-top"
        />

        {/* Social icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="flex gap-8 items-center"
        >
          {settings.instagram && settings.instagram !== '#' && (
            <a
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/20 hover:text-gold-500 transition-colors duration-500"
            >
              <Instagram size={20} strokeWidth={1} />
            </a>
          )}
          {settings.facebook && settings.facebook !== '#' && (
            <a
              href={settings.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/20 hover:text-gold-500 transition-colors duration-500"
            >
              <Facebook size={20} strokeWidth={1} />
            </a>
          )}
          {settings.instagram_handle && (
            <span className="text-white/15 text-[10px] tracking-[0.35em] uppercase font-bold">
              @{settings.instagram_handle}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}
