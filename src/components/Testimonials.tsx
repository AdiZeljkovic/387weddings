import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { EASE, SectionTag, WordReveal } from './anim';

interface Testimonial {
  id: number;
  client_name: string;
  text: string;
  location: string | null;
  wedding_date: string | null;
}

const ROTATE_MS = 8000;

// Social proof block. Renders nothing until the client adds reviews in
// Admin → Recenzije, so an empty gallery never shows an empty section.
const Testimonials = ({ className = '' }: { className?: string }) => {
  const { t, getContentStyle } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const go = useCallback((i: number) => setIndex(i), []);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(() => setIndex(prev => (prev + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const meta = [current.location, current.wedding_date].filter(Boolean).join(' · ');

  return (
    <section className={`relative overflow-hidden py-24 md:py-36 px-6 sm:px-8 lg:px-16 ${className}`}>
      {/* Soft gold glow */}
      <div
        className="absolute inset-x-0 top-0 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <SectionTag style={getContentStyle('home.testimonials.tag')} className="mb-7">
          {t('home.testimonials.tag')}
        </SectionTag>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white leading-[1.1] mb-12 md:mb-16">
          <WordReveal
            words={t('home.testimonials.title').split(' ').filter(Boolean)
              .map(w => ({ w, style: getContentStyle('home.testimonials.title') }))}
          />
        </h2>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Decorative quote mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE }}
            className="flex justify-center mb-8"
            aria-hidden="true"
          >
            <Quote size={30} strokeWidth={1} className="text-gold-400/50" />
          </motion.div>

          {/* Quote — crossfades between entries */}
          <div className="min-h-[190px] sm:min-h-[170px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={current.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.75, ease: EASE }}
                className="m-0"
              >
                <p className="font-serif font-light italic text-xl sm:text-2xl md:text-3xl text-white/85 leading-[1.5] max-w-3xl mx-auto">
                  {current.text}
                </p>

                <footer className="mt-9">
                  <div className="w-10 h-[1px] bg-gold-400/50 mx-auto mb-5" aria-hidden="true" />
                  <cite className="not-italic block text-gold-300 text-[11px] tracking-[0.4em] uppercase font-bold">
                    {current.client_name}
                  </cite>
                  {meta && (
                    <span className="block text-white/40 text-[10px] tracking-[0.25em] uppercase mt-2">
                      {meta}
                    </span>
                  )}
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${item.client_name}`}
                  aria-current={i === index}
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    i === index ? 'w-8 bg-gold-400' : 'w-3 bg-white/15 hover:bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
