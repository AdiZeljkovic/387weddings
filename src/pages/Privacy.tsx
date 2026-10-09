import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Reveal from '../components/Reveal';

/**
 * The route existed only as a 404 before, while analytics ran without consent.
 * The body is one CMS field so the client (and their lawyer) own the wording.
 *
 * It is built for a long document: blank lines separate blocks, a line ending
 * in ":" reads as a heading, and a block whose lines all begin with "-", "*",
 * "•" or "1." becomes a list. The owner writes plain text and gets the same
 * typography as the rest of the site.
 */
const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] };

const parse = (body: string): Block[] =>
  body.split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map((block): Block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every(l => BULLET.test(l))) {
      return { kind: 'list', ordered: false, items: lines.map(l => l.replace(BULLET, '')) };
    }
    if (lines.length > 0 && lines.every(l => NUMBER.test(l))) {
      return { kind: 'list', ordered: true, items: lines.map(l => l.replace(NUMBER, '')) };
    }
    if (block.endsWith(':') && lines.length === 1) {
      return { kind: 'heading', text: block.replace(/:$/, '') };
    }
    return { kind: 'para', text: block };
  });

const Privacy = () => {
  const { t, getContentStyle } = useLanguage();
  const body = t('privacy.body');
  const blocks = body.startsWith('privacy.') ? [] : parse(body);

  return (
    <div className="bg-cream">
      <section className="max-w-[720px] mx-auto px-6 lg:px-8 pt-16 lg:pt-24 pb-20 lg:pb-28">
        <Reveal
          as="h1"
          style={getContentStyle('privacy.title')}
          className="font-serif font-light text-[32px] lg:text-[48px] leading-[1.15] tracking-[0.06em] uppercase text-ink-900 m-0 mb-6"
        >
          {t('privacy.title')}
        </Reveal>

        <div aria-hidden="true" className="flex items-center gap-3 mb-10">
          <Reveal as="span" kind="line" className="block w-16 h-px bg-gold-600 opacity-60" />
          <span className="w-1.5 h-1.5 bg-love rotate-45" />
        </div>

        {blocks.length === 0 ? (
          <Reveal as="p" className="text-[15px] font-light leading-[1.9] text-ink-500">
            {t('privacy.empty')}
          </Reveal>
        ) : (
          blocks.map((block, i) => {
            // Only the first few stagger; a long policy should not crawl in
            const delay = Math.min(i, 6) * 0.05;
            if (block.kind === 'heading') {
              return (
                <Reveal
                  as="h2"
                  key={i}
                  delay={delay}
                  className="font-serif font-normal text-[20px] lg:text-[24px] text-ink-900 mt-10 mb-3"
                >
                  {block.text}
                </Reveal>
              );
            }
            if (block.kind === 'list') {
              const Tag = block.ordered ? 'ol' : 'ul';
              return (
                <Reveal
                  as={Tag}
                  key={i}
                  delay={delay}
                  className={`text-[15px] lg:text-[16px] font-light leading-[1.9] text-ink-700 mb-5 pl-5 ${
                    block.ordered ? 'list-decimal' : 'list-disc'
                  }`}
                >
                  {block.items.map((item, j) => (
                    <li key={j} className="mb-1.5 marker:text-gold-600">{item}</li>
                  ))}
                </Reveal>
              );
            }
            return (
              <Reveal
                as="p"
                key={i}
                delay={delay}
                className="text-[15px] lg:text-[16px] font-light leading-[1.9] text-ink-700 mb-5"
              >
                {block.text}
              </Reveal>
            );
          })
        )}
      </section>
    </div>
  );
};

export default Privacy;
