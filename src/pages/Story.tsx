import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg, SIZES } from '../lib/img';
import { useImageMeta, ratioFor } from '../lib/imageMeta';
import { balanceColumns } from '../lib/masonry';
import { OliveBranch, SectionLabel, DiamondRule } from '../components/ornaments';
import Reveal from '../components/Reveal';
import Lightbox, { LightboxImage } from '../components/Lightbox';

const CARD_LABEL_KEYS: Record<string, string> = {
  WEDDINGS:  'portfolio.card.wedding',
  STUDIO:    'portfolio.card.studio',
  PORTRAITS: 'portfolio.card.portrait',
};

interface StoryImage {
  id: number;
  url: string;
  alt: string | null;
  caption: string | null;
  layout: string | null;
  focus: string | null;
}

interface StoryData {
  id: number;
  slug: string;
  couple: string;
  category: string;
  location: string | null;
  date_text: string | null;
  tag: string | null;
  tag_bs: string | null; tag_en: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  quote_bs: string | null; quote_en: string | null;
  text_bs: string | null;  text_en: string | null;
  images: StoryImage[];
  prev_slug: string | null; prev_couple: string | null;
  next_slug: string | null; next_couple: string | null;
}

const CoupleName = ({ name, redAmp = true }: { name: string; redAmp?: boolean }) => {
  const parts = name.split(/\s*&\s*/);
  if (parts.length < 2) return <>{name}</>;
  return (
    <>
      {parts[0]} <span className={redAmp ? 'italic text-love' : 'italic'}>&amp;</span>{' '}
      {parts.slice(1).join(' & ')}
    </>
  );
};

const Story = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language, getContentStyle } = useLanguage();
  const [story, setStory] = useState<StoryData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetch(`/api/stories/${encodeURIComponent(slug || '')}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('missing'))))
      .then(d => { if (alive) { setStory(d); setStatus('ok'); } })
      .catch(() => { if (alive) setStatus('missing'); });
    loadSettings().then(setSettings).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  // Five columns on a desktop, three on a tablet, two on a phone
  const colsFor = (w: number) => (w < 768 ? 2 : w < 1180 ? 3 : 5);
  const [cols, setCols] = useState(() =>
    typeof window === 'undefined' ? 5 : colsFor(window.innerWidth)
  );
  useEffect(() => {
    const onResize = () => setCols(colsFor(window.innerWidth));
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const metaFor = useImageMeta(
    useMemo(() => (story?.images ?? []).map(i => i.url), [story])
  );

  // The tab and the link preview carry the couple's name. The server already
  // renders them that way; this keeps them right when the visitor moves from
  // one story to the next without a page load.
  useEffect(() => {
    if (!story) return;
    const siteName = settings['seo.site_name']?.trim() || '387 Weddings';
    const title = `${story.couple} | ${siteName}`;
    document.title = title;

    const set = (sel: string, value: string) => {
      const el = document.querySelector(sel);
      if (el && value) el.setAttribute('content', value);
    };
    const desc = [story.location, story.date_text].filter(Boolean).join(' · ');
    set('meta[property="og:title"]', title);
    set('meta[name="twitter:title"]', title);
    if (desc) {
      set('meta[name="description"]', desc);
      set('meta[property="og:description"]', desc);
      set('meta[name="twitter:description"]', desc);
    }
    // The cover no longer appears on the page, but it is still the story's
    // picture wherever the link is shared
    if (story.cover_url) {
      const base = (settings['sitemap.base_url']?.trim() || '').replace(/\/$/, '');
      const abs = story.cover_url.startsWith('http') ? story.cover_url : base + story.cover_url;
      set('meta[property="og:image"]', abs);
      set('meta[name="twitter:image"]', abs);
    }
  }, [story, settings]);

  // The columns end at about the same height whether a story has six
  // photographs or thirty, and each one keeps its own shape rather than being
  // cropped into a common frame.
  const columns = useMemo(() => {
    const laid = (story?.images ?? []).map(img => ({
      img,
      ratio: ratioFor(metaFor(img.url), img.layout),
    }));
    return balanceColumns(laid, cols, g => 1 / g.ratio);
  }, [story, cols, metaFor]);

  const lightboxImages: LightboxImage[] = (story?.images ?? []).map(i => ({
    id: i.id, url: i.url, alt: i.alt, caption: i.caption,
  }));

  if (status === 'loading') {
    return (
      <div className="bg-cream min-h-[70vh] flex items-center justify-center">
        <span className="w-12 h-px bg-gold-600 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  if (status === 'missing' || !story) {
    return (
      <div className="bg-cream min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="font-serif text-4xl text-ink-900 mb-6">404</h1>
        <Link
          to="/portfolio"
          style={getContentStyle('story.back')}
          className="text-[11px] font-medium tracking-[0.24em] uppercase text-ink-900 border-b border-[#bfb3a0] pb-1.5"
        >
          ← {t('story.back')}
        </Link>
      </div>
    );
  }

  const quote = (language === 'ENG' ? story.quote_en : story.quote_bs) || '';
  const body = (language === 'ENG' ? story.text_en : story.text_bs) || '';
  const paragraphs = body.split(/\n{2,}|\r\n\r\n/).map(s => s.trim()).filter(Boolean);
  const categoryKey = CARD_LABEL_KEYS[story.category];
  const meta = [story.location, story.date_text].filter(Boolean).join(' · ');
  // The type used to be one untranslated column, so the English site read "PHOTO"
  const typeLabel = (language === 'ENG' ? story.tag_en : story.tag_bs) || story.tag || '';

  const handle = settings.instagram_handle || '387.weddings';
  const instagramUrl = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : `https://instagram.com/${handle}`;

  return (
    <div className="bg-cream">
      {/* Back */}
      <div className="px-6 lg:px-24 pt-8 lg:pt-11">
        <Link
          to="/portfolio"
          style={getContentStyle('story.back')}
          className="inline-flex items-center gap-3 text-ink-900 text-[11px] font-medium tracking-[0.24em] uppercase border-b border-[#bfb3a0] pb-1.5 transition-opacity duration-250 hover:opacity-60"
        >
          ← {t('story.back')}
        </Link>
      </div>

      {/* Title */}
      <section className="relative overflow-hidden text-center px-6 lg:px-24 pt-10 lg:pt-14 pb-10 lg:pb-[72px]">
        <OliveBranch className="hidden lg:block absolute left-24 top-[70px] w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <OliveBranch className="hidden lg:block absolute right-24 top-[70px] w-[300px] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />

        <div className="relative">
          {categoryKey && (
            <SectionLabel centered className="mb-6 lg:mb-7" style={getContentStyle(categoryKey)}>
              {t(categoryKey)}
            </SectionLabel>
          )}

          <Reveal as="h1" className="font-serif font-normal text-[clamp(30px,9.8vw,38px)] lg:text-[clamp(44px,4.6vw,64px)] leading-[1.05] m-0 mb-7 lg:mb-10">
            <CoupleName name={story.couple} />
          </Reveal>

          <div className="flex flex-wrap items-center justify-center gap-x-6 lg:gap-x-9 gap-y-3 text-[11px] font-medium tracking-[0.26em] uppercase text-ink-500">
            {[story.location, story.date_text, typeLabel].filter(Boolean).map((v, i, arr) => (
              <React.Fragment key={`${v}-${i}`}>
                <span>{v}</span>
                {i < arr.length - 1 && <span aria-hidden="true" className="w-px h-3.5 bg-[#c8bba8]" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Story copy — the board centres it in a narrow column under a ruled
          "Priča" label. The cover photograph is gone from here: it belongs on
          the card in Radovi and as the link preview image, and repeating it
          full width above the text was pushing the story itself off screen. */}
      {(quote || paragraphs.length > 0) && (
        <section className="px-6 py-[56px] lg:py-24">
          <div className="max-w-[760px] mx-auto text-center">
            <SectionLabel centered className="mb-7 lg:mb-9" style={getContentStyle('story.tag')}>
              {t('story.tag')}
            </SectionLabel>

            {quote && (
              <Reveal as="p" className="font-serif font-normal text-[21px] lg:text-[30px] leading-[1.45] text-[#2a2622] max-w-[620px] mx-auto m-0 mb-7 lg:mb-9">
                {quote}
              </Reveal>
            )}
            {paragraphs.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={0.08 + i * 0.07}
                className={`text-[16px] lg:text-[18px] font-light leading-[1.85] text-ink-700 max-w-[620px] mx-auto m-0 ${
                  i < paragraphs.length - 1 ? 'mb-5 lg:mb-[22px]' : ''
                }`}
              >
                {para}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Gallery — edge to edge, as on the reference story page. Click opens
          the lightbox. */}
      {story.images.length > 0 && (
        <div className="flex gap-1 lg:gap-1.5 items-start px-1 lg:px-1.5 pb-[56px] lg:pb-24">
          {columns.map((col, ci) => (
            <div key={ci} className="flex-1 min-w-0 flex flex-col gap-1 lg:gap-1.5">
              {col.map(({ item: { img, ratio }, index: i }) => {
                const r = respImg(img.url);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox(i)}
                    aria-label={img.alt || `Fotografija ${i + 1}`}
                    className="block w-full overflow-hidden bg-rule cursor-zoom-in group"
                    // Reserved at the photograph's own ratio, so nothing is
                    // cropped and the page does not jump as images arrive
                    style={{ aspectRatio: String(ratio) }}
                  >
                    <img
                      src={r.src}
                      srcSet={r.srcSet}
                      sizes={SIZES.gallery}
                      alt={img.alt || ''}
                      className="w-full h-full object-cover transition-[filter] duration-400 group-hover:brightness-[1.07] group-hover:saturate-[1.05]"
                      style={{ objectPosition: img.focus || undefined }}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Everything below used to sit inside the gallery block, so a story with
          no photographs yet lost its navigation and its Instagram block too —
          clicking "next story" led to a page with nothing but a name on it. */}
      <section className="px-5 lg:px-24 pb-[72px] lg:pb-32">
          {/* Previous / next — always both, wrapping around the list */}
          {(story.prev_slug || story.next_slug) && (
            <nav
              aria-label="Ostale priče"
              className="max-w-[1248px] mx-auto border-t border-rule pt-8 lg:pt-9 flex flex-wrap justify-between gap-6"
            >
              {story.prev_slug ? (
                <Link to={`/portfolio/${story.prev_slug}`} className="group flex flex-col gap-2.5 text-ink-900">
                  <span
                    style={getContentStyle('story.prev')}
                    className="text-[11px] font-medium tracking-[0.24em] uppercase text-gold-label"
                  >
                    ← {t('story.prev')}
                  </span>
                  <span className="font-serif text-[24px] lg:text-[28px] leading-[1.2] transition-colors duration-250 group-hover:text-love">
                    <CoupleName name={story.prev_couple || ''} redAmp={false} />
                  </span>
                </Link>
              ) : <span />}

              {story.next_slug && (
                <Link to={`/portfolio/${story.next_slug}`} className="group flex flex-col gap-2.5 text-ink-900 text-right items-end ml-auto">
                  <span
                    style={getContentStyle('story.next')}
                    className="text-[11px] font-medium tracking-[0.24em] uppercase text-gold-label"
                  >
                    {t('story.next')} →
                  </span>
                  <span className="font-serif text-[24px] lg:text-[28px] leading-[1.2] transition-colors duration-250 group-hover:text-love">
                    <CoupleName name={story.next_couple || ''} redAmp={false} />
                  </span>
                </Link>
              )}
            </nav>
          )}

          {/* Instagram */}
          <div className="max-w-[720px] mx-auto mt-16 lg:mt-24 text-center">
            <DiamondRule className="mb-7 lg:mb-8" />
            <div
              style={getContentStyle('instagram.tag')}
              className="text-[11px] lg:text-[12px] tracking-[0.32em] uppercase text-gold-label mb-4"
            >
              {t('instagram.tag')}
            </div>
            <Reveal as="h2" className="font-serif font-normal text-[30px] lg:text-[44px] leading-[1.2] m-0 mb-7">
              <span style={getContentStyle('instagram.title.part1')}>{t('instagram.title.part1')}</span>{' '}
              <span className="italic" style={getContentStyle('instagram.title.part2')}>
                {t('instagram.title.part2')}
              </span>
            </Reveal>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex items-center gap-3 border border-ink-900 text-ink-900 text-[12px] font-medium tracking-[0.2em] uppercase px-7 lg:px-[30px] py-4 lg:py-[18px] hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r=".8" fill="currentColor" />
              </svg>
              @{handle} →
            </a>
          </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightbox}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          title={story.couple}
          meta={meta}
          closeLabel={t('story.close')}
        />
      )}
    </div>
  );
};

export default Story;
