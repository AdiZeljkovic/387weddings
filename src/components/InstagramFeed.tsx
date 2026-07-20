import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Instagram } from 'lucide-react';
import { loadSettings } from '../lib/settingsCache';

const InstagramFeed = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => { console.warn('InstagramFeed: failed to load settings', err); });
  }, []);

  const instagramUrl = settings.instagram || 'https://instagram.com/art387weddings';
  const instagramHandle = settings.instagram_handle ? `@${settings.instagram_handle}` : '@art387weddings';

  const FALLBACKS = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400",
  ];

  const images = [1, 2, 3, 4, 5, 6, 7, 8].map(
    (n, i) => settings[`img.instagram.${n}`] || FALLBACKS[i]
  );

  return (
    <section className="py-24 bg-white border-t border-moody-100">
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 md:mb-24 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] md:text-[12px] tracking-[0.6em] uppercase text-gold-600 font-black block mb-6">{settings.instagram_section_tag || 'Social'}</span>
            <h2 className="text-4xl md:text-6xl font-serif font-light text-moody-900">{settings.instagram_section_heading || 'Follow Our Journey'}</h2>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on Instagram as ${instagramHandle}`}
            className="flex items-center gap-6 text-moody-900/40 hover:text-gold-600 transition-colors duration-500 group"
          >
            <Instagram size={28} className="group-hover:scale-110 transition-transform duration-500" aria-hidden="true" />
            <span className="text-[14px] md:text-[16px] tracking-[0.4em] uppercase font-black">{instagramHandle}</span>
          </a>
        </div>

        <div className="grid grid-cols-8 gap-1 md:gap-2">
          {images.map((src, i) => (
            <motion.a
              key={i}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram photo ${i + 1}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="aspect-square overflow-hidden relative group"
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gold-600/0 group-hover:bg-gold-600/10 transition-colors duration-700" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
                <Instagram className="text-white" size={24} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
