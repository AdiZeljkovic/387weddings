// Responsive image helper — local uploads go through the on-demand resize
// endpoint (/img/:file?w=), external URLs (Unsplash fallbacks) pass through.
// Usage: const r = respImg(src, [480, 960]); <img src={r.src} srcSet={r.srcSet} sizes="..." />
export function respImg(src: string, widths: number[]): { src: string; srcSet?: string } {
  if (src && src.startsWith('/uploads/')) {
    const file = src.slice('/uploads/'.length);
    return {
      src: `/img/${file}?w=${widths[widths.length - 1]}`,
      srcSet: widths.map(w => `/img/${file}?w=${w} ${w}w`).join(', '),
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
