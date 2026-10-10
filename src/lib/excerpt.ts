/**
 * The short description of a story used for search results and link previews:
 * its intro quote, else the start of its text, cut at a word near 150
 * characters. A story's meta description used to be only its date.
 */
export function storyExcerpt(
  s: { quote_bs?: string | null; quote_en?: string | null; text_bs?: string | null; text_en?: string | null;
       location?: string | null; date_text?: string | null },
  lang: 'bs' | 'en',
  max = 150,
): string {
  const pick = (a?: string | null, b?: string | null) => (a && a.trim()) || (b && b.trim()) || '';
  const quote = lang === 'en' ? pick(s.quote_en, s.quote_bs) : pick(s.quote_bs, s.quote_en);
  const text = lang === 'en' ? pick(s.text_en, s.text_bs) : pick(s.text_bs, s.text_en);
  const raw = (quote || text).replace(/\s+/g, ' ').trim();
  if (!raw) return [s.location, s.date_text].filter(Boolean).join(' · ');
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}
