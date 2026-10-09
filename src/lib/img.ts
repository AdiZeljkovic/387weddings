// Responsive image helper — local uploads go through the on-demand resize
// endpoint (/img/:file?w=), external URLs (Unsplash fallbacks) pass through.
// Usage: const r = respImg(src); <img src={r.src} srcSet={r.srcSet} sizes={SIZES.card} />

// The delivery ladder. A retina screen showing a 600px frame asks for 1200,
// so every step has a partner at twice its width; 2400 is the ceiling and the
// server never serves more pixels than the original holds.
export const WIDTHS = [600, 900, 1200, 1600, 2000, 2400];

// `sizes` tells the browser how wide the frame will be before any CSS has run.
// Getting it wrong is what made photographs soft: a 824px frame that claimed
// 50vw was handed a 599px file.
export const SIZES = {
  hero: '100vw',
  card: '(max-width: 820px) 85vw, 42vw',
  gallery: '(max-width: 820px) 50vw, 20vw',
  half: '(max-width: 820px) 92vw, 46vw',
  full: '100vw',
} as const;

export function respImg(src: string, widths: number[] = WIDTHS): { src: string; srcSet?: string } {
  if (src && src.startsWith('/uploads/')) {
    const file = src.slice('/uploads/'.length);
    // The plain src is a middle step, for the rare browser that ignores srcSet
    const fallback = widths[Math.min(2, widths.length - 1)];
    return {
      src: `/img/${file}?w=${fallback}`,
      srcSet: widths.map(w => `/img/${file}?w=${w} ${w}w`).join(', '),
    };
  }
  return { src, srcSet: undefined };
}

// The lightbox shows one photograph at screen size, so it asks for the top of
// the ladder rather than reusing the gallery thumbnail.
export function fullImg(src: string): { src: string; srcSet?: string } {
  if (src && src.startsWith('/uploads/')) {
    const file = src.slice('/uploads/'.length);
    return {
      src: `/img/${file}?w=2400`,
      srcSet: [1200, 1600, 2000, 2400].map(w => `/img/${file}?w=${w} ${w}w`).join(', '),
    };
  }
  return { src, srcSet: undefined };
}

// A thumbnail small enough to arrive with the HTML, used blurred behind an image
// that has not decoded yet. Returns undefined when the host offers no way to ask
// for a small version, in which case the caller keeps its flat background.
export function blurSrc(src: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('/uploads/')) return `/img/${src.slice('/uploads/'.length)}?w=24`;
  // Unsplash serves through imgix, so a width is just a query parameter
  if (src.includes('images.unsplash.com')) return src.replace(/([?&])w=\d+/, '$1w=32');
  return undefined;
}
