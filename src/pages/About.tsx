import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE } from '../components/anim';

const FALLBACK_MELISA = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_ALDIN  = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_CTA    = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=900',
];

// A CMS line that was never filled in resolves to its own key — treat that as empty
const filled = (value: string, key: string) => Boolean(value) && !value.startsWith(key.split('.')[0] + '.');

// ── One biography — tag, two-line display heading, justified columns of copy ──
const Bio = ({ n, portrait, flip }: { n: 1 | 2; portrait: { src: string; srcSet?: string }; flip?: boolean }) => {
  const { t, getContentStyle } = useLanguage();
  const base = `about.bio.${n}`;

  return (
    <div className="max-w-[1150px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
      {/* Portrait — black and white, as in the reference */}
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 1, ease: EASE }}
        className={`order-1 ${flip ? 'lg:order-1' : 'lg:order-2'}`}
      >
        <div className="aspect-[4/5] overflow-hidden bg-canvas-200">
          <img
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes="(min-width: 1024px) 42vw, 100vw"
            alt={t(`${base}.title.part2`)}
            className="w-full h-full object-cover grayscale"
            loading="lazy"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>

      {/* Copy */}
      <div className={`order-2 ${flip ? 'lg:order-2' : 'lg:order-1'}`}>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.85, ease: EASE }}
          style={getContentStyle(`${base}.tag`)}
          className="block text-[10px] tracking-[0.3em] uppercase font-semibold text-ink-500 mb-5"
        >
          {t(`${base}.tag`)}
        </motion.span>

        <h2 className="font-serif font-light text-ink-900 uppercase text-[2.1rem] sm:text-[2.6rem] lg:text-[3.3rem] leading-[1.08] tracking-[0.04em] mb-8">
          {(['part1', 'part2'] as const).map((part, i) => (
            <motion.span
              key={part}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.95, delay: 0.08 + i * 0.1, ease: EASE }}
              style={getContentStyle(`${base}.title.${part}`)}
              className="block"
            >
              {t(`${base}.title.${part}`)}
            </motion.span>
          ))}
        </h2>

        <div className="max-w-[30rem]">
          {(['p1', 'p2', 'p3'] as const).map((p, i) => {
            const key = `${base}.${p}`;
            const value = t(key);
            if (!filled(value, key)) return null;
            return (
              <motion.p
                key={p}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: EASE }}
                style={getContentStyle(key)}
                className="text-ink-500 font-light text-[13px] md:text-[13.5px] leading-[2.05] text-justify mb-5 last:mb-0"
              >
                {value}
              </motion.p>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const { t, getContentStyle } = useLanguage();
  const [imgs, setImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings()
      .then(setImgs)
      .catch(err => console.warn('About: settings load failed', err));
  }, []);

  const melisa = respImg(imgs['img.about.melisa'] || FALLBACK_MELISA, [480, 768, 1100]);
  const aldin  = respImg(imgs['img.about.aldin']  || FALLBACK_ALDIN,  [480, 768, 1100]);
  const cta = [1, 2, 3].map((n, i) =>
    respImg(imgs[`img.about.cta.${n}`] || FALLBACK_CTA[i], [320, 640, 900])
  );

  // Publications are optional — a blank slot simply disappears
  const press = [1, 2, 3, 4, 5]
    .map(n => t(`about.press.${n}`))
    .filter(v => filled(v, 'about.press.1'));

  return (
    <div className="bg-canvas-50">
      {/* ── Biography one — on a soft band ─────────────────────────────────── */}
      <section className="bg-canvas-100 py-16 md:py-24 lg:py-28 px-6 sm:px-8 lg:px-16">
        <Bio n={1} portrait={melisa} />
      </section>

      {/* ── Biography two — mirrored, on paper ─────────────────────────────── */}
      <section className="bg-canvas-50 py-16 md:py-24 lg:py-28 px-6 sm:px-8 lg:px-16">
        <Bio n={2} portrait={aldin} flip />
      </section>

      {/* ── As seen in ─────────────────────────────────────────────────────── */}
      {press.length > 0 && (
        <section className="bg-canvas-50 pb-16 md:pb-24 px-6 sm:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              style={getContentStyle('about.press.tag')}
              className="block text-[10px] tracking-[0.3em] uppercase font-semibold text-ink-500 mb-9"
            >
              {t('about.press.tag')}
            </motion.span>

            <div className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-6">
              {press.map((name, i) => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.8, delay: Math.min(i * 0.07, 0.35), ease: EASE }}
                  className="font-serif font-light uppercase text-ink-400 text-base md:text-xl tracking-[0.12em]"
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Closing invitation, framed by photographs ──────────────────────── */}
      <section className="bg-canvas-50 pb-20 md:pb-28 px-6 sm:px-8 lg:px-16 overflow-hidden">
        <div className="max-w-[1250px] mx-auto grid lg:grid-cols-[1fr_1.5fr_1fr] gap-10 lg:gap-8 items-center">
          {/* Left cluster — a tall frame with a smaller print overlapping it */}
          <div className="hidden lg:block relative pb-14">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 1, ease: EASE }}
              className="w-[82%] aspect-[3/4] overflow-hidden bg-canvas-200"
            >
              <img
                src={cta[0].src}
                srcSet={cta[0].srcSet}
                sizes="20vw"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 1, delay: 0.18, ease: EASE }}
              className="absolute right-0 bottom-0 w-[54%] aspect-[3/4] overflow-hidden bg-canvas-200 border-[6px] border-white shadow-xl shadow-black/10"
            >
              <img
                src={cta[1].src}
                srcSet={cta[1].srcSet}
                sizes="12vw"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Centre — the invitation */}
          <div className="text-center">
            <h2 className="font-serif font-light text-ink-900 uppercase text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] leading-[1.15] tracking-[0.05em] mb-8">
              {(['part1', 'part2'] as const).map((part, i) => (
                <motion.span
                  key={part}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 + i * 0.1, ease: EASE }}
                  style={getContentStyle(`about.invite.title.${part}`)}
                  className="block"
                >
                  {t(`about.invite.title.${part}`)}
                </motion.span>
              ))}
            </h2>

            {(['p1', 'p2'] as const).map((p, i) => {
              const key = `about.invite.${p}`;
              const value = t(key);
              if (!filled(value, key)) return null;
              return (
                <motion.p
                  key={p}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: EASE }}
                  style={getContentStyle(key)}
                  className="text-ink-500 font-light text-[13px] md:text-[13.5px] leading-[2.05] max-w-sm mx-auto mb-5 last:mb-0"
                >
                  {value}
                </motion.p>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="flex justify-center mt-9"
            >
              <Link
                to="/contact"
                className="group relative inline-block px-11 py-3.5 overflow-hidden whitespace-nowrap border border-ink-900/30 hover:border-ink-900 transition-colors duration-500 text-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-ink-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <span
                  style={getContentStyle('about.invite.button')}
                  className="relative z-10 text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium text-ink-900 group-hover:text-white transition-colors duration-500"
                >
                  {t('about.invite.button')}
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Right — a single tall frame */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: EASE }}
            className="hidden lg:block aspect-[3/4] overflow-hidden bg-canvas-200"
          >
            <img
              src={cta[2].src}
              srcSet={cta[2].srcSet}
              sizes="20vw"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
