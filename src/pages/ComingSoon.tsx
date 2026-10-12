import React, { useEffect, useState } from 'react';
import { InstagramGlyph } from '../components/Instagram';
import { instagramOf } from '../lib/instagram';
import { loadSettings, peekSettings } from '../lib/settingsCache';

export default function ComingSoon() {
  const [settings, setSettings] = useState<Record<string, string>>(() => peekSettings() ?? {});
  const ig = instagramOf(settings);

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

      {/* The entrance is plain CSS now — the animation library (about 30 KB
          compressed) was loaded only for these six fades */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-16 md:mb-24 flex flex-col items-center gap-1 animate-[csDown_1.5s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none">
          <span className="text-3xl md:text-4xl font-serif font-light tracking-tighter uppercase text-white">
            387 Cinematic
          </span>
          <span className="text-[10px] tracking-[0.55em] uppercase font-bold text-gold-600">
            Weddings
          </span>
        </div>

        {/* Thin line */}
        <div className="w-16 h-px bg-gold-600/40 mb-16 md:mb-20 origin-center animate-[introLine_1.5s_cubic-bezier(.16,1,.3,1)_.4s_both] motion-reduce:animate-none" />

        {/* Main heading */}
        <div className="space-y-2 md:space-y-4 mb-10 md:mb-14 animate-[csUp_1.8s_cubic-bezier(.16,1,.3,1)_.6s_both] motion-reduce:animate-none">
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-serif font-light text-white leading-none tracking-tighter">
            Uskoro
          </h1>
          <p className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-serif font-light text-white/20 italic leading-none tracking-tighter">
            nešto lijepo.
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-white/30 text-[10px] md:text-[11px] tracking-[0.65em] uppercase font-bold mb-16 md:mb-24 animate-[fadeIn_2s_ease_1.2s_both] motion-reduce:animate-none">
          Fine-art vjenčana fotografija &nbsp;·&nbsp; Sarajevo — Worldwide
        </p>

        {/* Thin vertical line */}
        <div className="w-px h-16 bg-gold-600/20 mb-12 origin-top animate-[csGrowY_1.2s_cubic-bezier(.16,1,.3,1)_1.5s_both] motion-reduce:animate-none" />

        {/* Instagram */}
        <div className="flex gap-8 items-center animate-[fadeIn_1.5s_ease_1.8s_both] motion-reduce:animate-none">
          <a
            href={ig.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-white/20 hover:text-gold-500 transition-colors duration-500"
          >
            <InstagramGlyph size={20} />
          </a>
          <span className="text-white/15 text-[10px] tracking-[0.35em] uppercase font-bold">
            @{ig.handle}
          </span>
        </div>
      </div>
    </div>
  );
}
