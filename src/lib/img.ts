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
