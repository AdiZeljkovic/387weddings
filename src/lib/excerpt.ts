/**
 * The short description of a story used for search results and link previews
 * (description, og:description, twitter:description):
 *
 *   1. the story's own "Opis za Google", when the owner wrote one;
 *   2. else the start of its intro and text, cut at a word near 150 characters;
 *   3. if that is shorter than 50 characters it says too little, so the page's
 *      general description is used instead (`general`);
 *   4. and only if there is none of these, location and date.
 *
 * A story's meta description used to be only its date.
 */
export type ExcerptSource = {
  seo_desc_bs?: string | null; seo_desc_en?: string | null;
  quote_bs?: string | null; quote_en?: string | null;
  text_bs?: string | null; text_en?: string | null;
  location?: string | null; date_text?: string | null;
};

const cutAt = (raw: string, max: number) => {
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
};

export function storyExcerpt(s: ExcerptSource, lang: 'bs' | 'en', general = '', max = 150): string {
  const pick = (a?: string | null, b?: string | null) => (a && a.trim()) || (b && b.trim()) || '';
  const flat = (v: string) => v.replace(/\s+/g, ' ').trim();

  const own = flat(lang === 'en' ? pick(s.seo_desc_en, s.seo_desc_bs) : pick(s.seo_desc_bs, s.seo_desc_en));
  if (own) return cutAt(own, 160);

  const quote = lang === 'en' ? pick(s.quote_en, s.quote_bs) : pick(s.quote_bs, s.quote_en);
  const text = lang === 'en' ? pick(s.text_en, s.text_bs) : pick(s.text_bs, s.text_en);
  const raw = flat([quote, text].filter(Boolean).join(' '));
  if (raw.length >= 50) return cutAt(raw, max);

  return flat(general) || raw || [s.location, s.date_text].filter(Boolean).join(' · ');
}
