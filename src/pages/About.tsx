import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg, SIZES } from '../lib/img';
import { OliveBranch, SectionLabel } from '../components/ornaments';
import Reveal from '../components/Reveal';

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
//
// Phones follow the board rather than the desktop order: the words come first
// and the portrait after them, Melisa's text ranged right and Aldin's left.
// One set of elements carries both layouts — nothing is rendered twice.
const Bio = ({ n, portrait, ratio, flip, altText }: {
  n: 1 | 2;
  portrait: { src: string; srcSet?: string };
  ratio: string;
  flip?: boolean;
  altText?: string;
}) => {
  const { t, getContentStyle } = useLanguage();
  const base = `about.bio.${n}`;
  const Heading = n === 1 ? 'h1' : 'h2';
  const right = !flip;  // Melisa reads from the right edge on a phone

  return (
    <div className="max-w-[1248px] mx-auto flex flex-wrap items-center gap-9 lg:gap-26">
      {/* Portrait — second on a phone, and on desktop whichever side `flip` says */}
      <div
        className={`flex-1 min-w-0 basis-full lg:basis-[440px] relative order-2 pb-6 lg:pb-14 ${
          flip ? 'lg:order-2 pl-6 lg:pl-14' : 'lg:order-1 pr-6 lg:pr-14'
        }`}
      >
        {/* Offset gold frame — on phones too, at a smaller offset */}
        <span
          aria-hidden="true"
          className={`absolute top-6 lg:top-14 bottom-0 border border-gold-600 ${
            flip ? 'left-0 right-6 lg:right-14' : 'left-6 lg:left-14 right-0'
          }`}
        />
        <Reveal kind="mask" className="relative overflow-hidden bg-rule" style={{ aspectRatio: ratio }}>
          <img
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes={SIZES.half}
            alt={altText || t(`${base}.title.part2`)}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </Reveal>
      </div>

      <div
        className={`flex-1 min-w-0 basis-full lg:basis-[440px] order-1 ${flip ? 'lg:order-1' : 'lg:order-2'} ${
          right ? 'text-right lg:text-left' : 'text-left'
        }`}
      >
        {/* Ranged right, the rule belongs on the label's left — hence the reversed row */}
        <SectionLabel
          className={`mb-6 lg:mb-7 ${right ? 'flex-row-reverse lg:flex-row' : ''}`}
          style={getContentStyle(`${base}.tag`)}
        >
          {t(`${base}.tag`)}
        </SectionLabel>

        <Reveal as={Heading} className="font-serif font-normal text-[46px] lg:text-[72px] leading-[1.06] lg:leading-[1.02] m-0 mb-7 lg:mb-10">
          <span className="block" style={getContentStyle(`${base}.title.part1`)}>
            {t(`${base}.title.part1`)}
          </span>
          <span className="block italic text-love" style={getContentStyle(`${base}.title.part2`)}>
            {t(`${base}.title.part2`)}
          </span>
        </Reveal>

        {/* Lead paragraph is set in Playfair, the rest in the body face */}
        {filled(t(`${base}.p1`)) && (
          <Reveal
            as="p"
            delay={0.08}
            style={getContentStyle(`${base}.p1`)}
            className={`font-serif font-normal text-[20px] lg:text-[26px] leading-[1.5] text-[#2a2622] max-w-[520px] m-0 mb-6 lg:mb-7 ${
              right ? 'ml-auto lg:ml-0' : ''
            }`}
          >
            {t(`${base}.p1`)}
          </Reveal>
        )}
        {(['p2', 'p3'] as const).map((p, i) => (
          filled(t(`${base}.${p}`)) ? (
            <Reveal
              as="p"
              key={p}
              delay={0.14 + i * 0.07}
              style={getContentStyle(`${base}.${p}`)}
              className={`text-[15px] lg:text-[18px] font-light leading-[1.8] text-ink-700 max-w-[500px] m-0 ${
                i === 0 ? 'mb-5 lg:mb-[22px]' : ''
              } ${right ? 'ml-auto lg:ml-0' : ''}`}
            >
              {t(`${base}.${p}`)}
            </Reveal>
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

  const melisa = respImg(imgs['img.about.melisa'] || FALLBACK_MELISA);
  const aldin  = respImg(imgs['img.about.aldin']  || FALLBACK_ALDIN);
  const cta = [1, 2, 3].map((n, i) =>
    respImg(imgs[`img.about.cta.${n}`] || FALLBACK_CTA[i])
  );

  return (
    <div className="bg-cream">
      {/* ── Melisa — portrait left ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 lg:px-24 pt-[72px] lg:pt-30 pb-[72px] lg:pb-32">
        <OliveBranch className="hidden lg:block absolute right-24 bottom-2.5 w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <Bio n={1} portrait={melisa} ratio="4 / 5" altText={imgs['img.about.melisa.alt']} />
      </section>

      {/* ── Aldin — mirrored, on the lighter band ──────────────────────────── */}
      <section className="relative overflow-hidden bg-cream-light px-6 lg:px-24 py-[72px] lg:py-32">
        <OliveBranch className="hidden lg:block absolute left-24 bottom-6 w-[170px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />
        <Bio n={2} portrait={aldin} ratio="3 / 4" flip altText={imgs['img.about.aldin.alt']} />
      </section>

      {/* ── Closing invitation, framed by three photographs ──────────────────
          Desktop keeps the board's free composition: the three frames are
          positioned around a centred column of text. On a phone the same three
          frames sit in a row between the title and the copy. `lg:contents`
          dissolves the phone row on desktop so the frames can be absolutely
          placed against this section — one set of elements, two layouts.     */}
      <section className="bg-white text-ink-900 text-center px-6 py-[72px] lg:py-28">
        <div className="relative max-w-[1250px] mx-auto lg:h-[424px]">
          <h2 className="font-serif font-light text-[30px] lg:text-[41.6px] leading-[1.2] lg:leading-[1.15] tracking-[0.05em] uppercase max-w-[490px] mx-auto m-0 mb-7 lg:mb-8">
            <span className="block" style={getContentStyle('about.invite.title.part1')}>{t('about.invite.title.part1')}</span>
            <span className="block" style={getContentStyle('about.invite.title.part2')}>{t('about.invite.title.part2')}</span>
          </h2>

          <div className="flex gap-2 mb-8 lg:contents">
            {[
              { i: 0, place: 'lg:left-0 lg:top-0 lg:w-[260px] lg:h-[348px]' },
              { i: 1, place: 'lg:left-[154px] lg:top-[198px] lg:w-[157px] lg:h-[215px] lg:border-4 lg:border-white' },
              { i: 2, place: 'lg:right-0 lg:top-0 lg:w-[318px] lg:h-[424px]' },
            ].map(({ i, place }) => (
              <div
                key={i}
                className={`flex-1 min-w-0 aspect-[3/4] overflow-hidden bg-rule lg:flex-none lg:absolute lg:aspect-auto ${place}`}
              >
                <img src={cta[i].src} srcSet={cta[i].srcSet} sizes="(min-width: 1024px) 320px, 30vw"
                  alt="" aria-hidden="true"
                  className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

          <div className="max-w-[384px] mx-auto">
            {(['p1', 'p2'] as const).map(p => (
              <p key={p} style={getContentStyle(`about.invite.${p}`)}
                className="text-[14px] lg:text-[13.5px] font-light leading-[1.95] lg:leading-[2.05] text-[#6b6b6b] m-0 mb-5">
                {t(`about.invite.${p}`)}
              </p>
            ))}
            <Link to="/contact" style={getContentStyle('about.invite.button')}
              className="btn inline-block border border-ink-900/30 text-ink-900 text-[11px] font-medium tracking-[0.25em] uppercase px-10 lg:px-11 py-4 lg:py-3.5 mt-3 hover:text-white">
              {t('about.invite.button')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
