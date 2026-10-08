import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { OliveBranch, SectionLabel } from '../components/ornaments';

const FALLBACK_MELISA = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_ALDIN  = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_CTA = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=900',
];

// A CMS line nobody filled in resolves to its own key — treat that as empty
const filled = (value: string) => Boolean(value) && !value.startsWith('about.');

// One biography: portrait with an offset gold frame beside a lead paragraph in
// Playfair and two body paragraphs. `flip` mirrors it for the second person.
const Bio = ({ n, portrait, ratio, flip }: {
  n: 1 | 2;
  portrait: { src: string; srcSet?: string };
  ratio: string;
  flip?: boolean;
}) => {
  const { t, getContentStyle } = useLanguage();
  const base = `about.bio.${n}`;
  const Heading = n === 1 ? 'h1' : 'h2';

  return (
    <div className={`max-w-[1248px] mx-auto flex flex-wrap items-center gap-10 lg:gap-26 ${flip ? 'flex-wrap-reverse' : ''}`}>
      <div className={`flex-1 min-w-0 basis-full lg:basis-[440px] relative ${flip ? 'order-2 lg:pl-14 lg:pb-14' : 'order-1 lg:pr-14 lg:pb-14'}`}>
        <span
          aria-hidden="true"
          className={`hidden lg:block absolute top-14 bottom-0 border border-gold-600 ${flip ? 'left-0 right-14' : 'left-14 right-0'}`}
        />
        <div className="relative overflow-hidden bg-rule" style={{ aspectRatio: ratio }}>
          <img
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes="(min-width: 1024px) 40vw, 100vw"
            alt={t(`${base}.title.part2`)}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className={`flex-1 min-w-0 basis-full lg:basis-[440px] ${flip ? 'order-1' : 'order-2'}`}>
        <SectionLabel className="mb-6 lg:mb-7" style={getContentStyle(`${base}.tag`)}>
          {t(`${base}.tag`)}
        </SectionLabel>

        <Heading className="font-serif font-normal text-[40px] lg:text-[72px] leading-[1.06] lg:leading-[1.02] m-0 mb-7 lg:mb-10">
          <span className="block" style={getContentStyle(`${base}.title.part1`)}>
            {t(`${base}.title.part1`)}
          </span>
          <span className="block italic text-love" style={getContentStyle(`${base}.title.part2`)}>
            {t(`${base}.title.part2`)}
          </span>
        </Heading>

        {/* Lead paragraph is set in Playfair, the rest in the body face */}
        {filled(t(`${base}.p1`)) && (
          <p
            style={getContentStyle(`${base}.p1`)}
            className="font-serif font-normal text-[20px] lg:text-[26px] leading-[1.5] text-[#2a2622] max-w-[520px] m-0 mb-6 lg:mb-7"
          >
            {t(`${base}.p1`)}
          </p>
        )}
        {(['p2', 'p3'] as const).map((p, i) => (
          filled(t(`${base}.${p}`)) ? (
            <p
              key={p}
              style={getContentStyle(`${base}.${p}`)}
              className={`text-[15px] lg:text-[18px] font-light leading-[1.8] text-ink-700 max-w-[500px] m-0 ${i === 0 ? 'mb-5 lg:mb-[22px]' : ''}`}
            >
              {t(`${base}.${p}`)}
            </p>
          ) : null
        ))}
      </div>
    </div>
  );
};

const About = () => {
  const { t, getContentStyle } = useLanguage();
  const [imgs, setImgs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings().then(setImgs).catch(err => console.warn('About: settings load failed', err));
  }, []);

  const melisa = respImg(imgs['img.about.melisa'] || FALLBACK_MELISA, [480, 768, 1100]);
  const aldin  = respImg(imgs['img.about.aldin']  || FALLBACK_ALDIN,  [480, 768, 1100]);
  const cta = [1, 2, 3].map((n, i) =>
    respImg(imgs[`img.about.cta.${n}`] || FALLBACK_CTA[i], [320, 640, 900])
  );

  return (
    <div className="bg-cream">
      {/* ── Melisa — portrait left ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 lg:px-24 pt-[72px] lg:pt-30 pb-[72px] lg:pb-32">
        <OliveBranch className="hidden lg:block absolute right-24 bottom-2.5 w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <Bio n={1} portrait={melisa} ratio="4 / 5" />
      </section>

      {/* ── Aldin — mirrored, on the lighter band ──────────────────────────── */}
      <section className="relative overflow-hidden bg-cream-light px-6 lg:px-24 py-[72px] lg:py-32">
        <OliveBranch className="hidden lg:block absolute left-24 bottom-6 w-[170px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />
        <Bio n={2} portrait={aldin} ratio="3 / 4" flip />
      </section>

      {/* ── Closing invitation, framed by three photographs ────────────────── */}
      <section className="bg-white text-ink-900 text-center px-6 lg:px-6 py-[72px] lg:py-28">
        {/* Desktop: the exact free composition from the board */}
        <div className="hidden lg:block relative max-w-[1250px] h-[424px] mx-auto">
          <div className="absolute left-0 top-0 w-[260px] h-[348px] overflow-hidden bg-rule">
            <img src={cta[0].src} srcSet={cta[0].srcSet} sizes="260px" alt="" aria-hidden="true"
              className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
          </div>
          <div className="absolute left-[154px] top-[198px] w-[157px] h-[215px] overflow-hidden bg-rule border-4 border-white">
            <img src={cta[1].src} srcSet={cta[1].srcSet} sizes="157px" alt="" aria-hidden="true"
              className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
          </div>
          <div className="absolute right-0 top-0 w-[318px] h-[424px] overflow-hidden bg-rule">
            <img src={cta[2].src} srcSet={cta[2].srcSet} sizes="318px" alt="" aria-hidden="true"
              className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
          </div>

          <div className="absolute left-[380px] right-[380px] top-0 flex flex-col items-center">
            <h2 className="font-serif font-light text-[41.6px] leading-[1.15] tracking-[0.05em] uppercase m-0 mb-8">
              <span className="block" style={getContentStyle('about.invite.title.part1')}>{t('about.invite.title.part1')}</span>
              <span className="block" style={getContentStyle('about.invite.title.part2')}>{t('about.invite.title.part2')}</span>
            </h2>
            {(['p1', 'p2'] as const).map(p => (
              <p key={p} style={getContentStyle(`about.invite.${p}`)}
                className="text-[13.5px] font-light leading-[2.05] text-[#6b6b6b] max-w-[384px] mx-auto m-0 mb-5">
                {t(`about.invite.${p}`)}
              </p>
            ))}
            <Link to="/contact" style={getContentStyle('about.invite.button')}
              className="inline-block border border-ink-900/30 text-ink-900 text-[11px] font-medium tracking-[0.25em] uppercase px-11 py-3.5 mt-3 transition-colors duration-250 hover:bg-ink-900 hover:text-white">
              {t('about.invite.button')}
            </Link>
          </div>
        </div>

        {/* Phones: the text leads, two frames below it */}
        <div className="lg:hidden">
          <h2 className="font-serif font-light text-[30px] leading-[1.2] tracking-[0.05em] uppercase m-0 mb-7">
            <span className="block" style={getContentStyle('about.invite.title.part1')}>{t('about.invite.title.part1')}</span>
            <span className="block" style={getContentStyle('about.invite.title.part2')}>{t('about.invite.title.part2')}</span>
          </h2>
          {(['p1', 'p2'] as const).map(p => (
            <p key={p} style={getContentStyle(`about.invite.${p}`)}
              className="text-[14px] font-light leading-[1.95] text-[#6b6b6b] max-w-[340px] mx-auto m-0 mb-5">
              {t(`about.invite.${p}`)}
            </p>
          ))}
          <Link to="/contact" style={getContentStyle('about.invite.button')}
            className="inline-block border border-ink-900/30 text-ink-900 text-[11px] font-medium tracking-[0.25em] uppercase px-10 py-4 mt-3 mb-10 transition-colors duration-250 hover:bg-ink-900 hover:text-white">
            {t('about.invite.button')}
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-[3/4] overflow-hidden bg-rule">
              <img src={cta[0].src} srcSet={cta[0].srcSet} sizes="46vw" alt="" aria-hidden="true"
                className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
            </div>
            <div className="aspect-[3/4] overflow-hidden bg-rule">
              <img src={cta[2].src} srcSet={cta[2].srcSet} sizes="46vw" alt="" aria-hidden="true"
                className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
