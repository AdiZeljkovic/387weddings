import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * The route existed only as a 404 before, while analytics ran without consent.
 * The body is one CMS field so the client (and their lawyer) own the wording;
 * blank lines separate paragraphs, and a line ending in ":" reads as a heading.
 */
const Privacy = () => {
  const { t, getContentStyle } = useLanguage();
  const body = t('privacy.body');
  const blocks = body.startsWith('privacy.')
    ? []
    : body.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  return (
    <div className="bg-cream">
      <section className="max-w-[720px] mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-28">
        <h1
          style={getContentStyle('privacy.title')}
          className="font-serif font-light text-[32px] lg:text-[48px] leading-[1.15] tracking-[0.06em] uppercase text-ink-900 m-0 mb-6"
        >
          {t('privacy.title')}
        </h1>

        <div aria-hidden="true" className="flex items-center gap-3 mb-10">
          <span className="w-16 h-px bg-gold-600 opacity-60" />
          <span className="w-1.5 h-1.5 bg-love rotate-45" />
        </div>

        {blocks.length === 0 ? (
          <p className="text-[15px] font-light leading-[1.9] text-ink-500">
            {t('privacy.empty')}
          </p>
        ) : (
          blocks.map((block, i) =>
            block.endsWith(':') ? (
              <h2
                key={i}
                className="font-serif font-normal text-[20px] lg:text-[24px] text-ink-900 mt-10 mb-3"
              >
                {block.replace(/:$/, '')}
              </h2>
            ) : (
              <p
                key={i}
                className="text-[15px] lg:text-[16px] font-light leading-[1.9] text-ink-700 mb-5"
              >
                {block}
              </p>
            )
          )
        )}
      </section>
    </div>
  );
};

export default Privacy;
