import { useEffect, useMemo, useState } from 'react';

export type ImageMeta = { width: number; height: number; orientation: string };

/**
 * Real pixel dimensions for a set of uploads, read off the files when they were
 * uploaded. Frames are reserved at the photograph's own ratio from these, so
 * nothing is cropped into a shape somebody picked by hand and the page does not
 * jump while the images arrive.
 */
export function useImageMeta(urls: (string | null | undefined)[]) {
  const [meta, setMeta] = useState<Record<string, ImageMeta>>({});

  const files = useMemo(
    () => urls
      .filter((u): u is string => Boolean(u) && u.startsWith('/uploads/'))
      .map(u => u.slice('/uploads/'.length))
      .filter((f, i, a) => a.indexOf(f) === i),
    [urls.join(',')]  // eslint-disable-line react-hooks/exhaustive-deps
  );
  const key = files.join(',');

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/gallery/meta?files=${encodeURIComponent(key)}`)
      .then(r => (r.ok ? r.json() : {}))
      .then((d: unknown) => {
        if (alive && d && typeof d === 'object') setMeta(d as Record<string, ImageMeta>);
      })
      .catch(() => { /* fall back to the stored layout */ });
    return () => { alive = false; };
  }, [key]);

  return (url: string | null | undefined): ImageMeta | undefined =>
    url && url.startsWith('/uploads/') ? meta[url.slice('/uploads/'.length)] : undefined;
}

export type Layout = 'TALL' | 'SQUARE' | 'WIDE';

// The three card shapes, as width / height
export const LAYOUT_RATIO: Record<Layout, number> = {
  TALL: 3 / 4,
  SQUARE: 1,
  WIDE: 4 / 3,
};

/**
 * Which of the three card shapes a photograph belongs in, decided by the
 * photograph rather than by the owner. A portrait never lands in a landscape
 * frame, so no heads get cut off.
 */
export function layoutFor(m: ImageMeta | undefined, stored?: string | null): Layout {
  if (m && m.width && m.height) {
    const r = m.width / m.height;
    if (r < 0.92) return 'TALL';
    if (r <= 1.08) return 'SQUARE';
    return 'WIDE';
  }
  const s = (stored || '').toUpperCase();
  return s === 'WIDE' || s === 'SQUARE' ? s : 'TALL';
}

// The exact ratio for a gallery frame: the photograph's own where we know it,
// otherwise the shape the admin recorded.
export function ratioFor(m: ImageMeta | undefined, stored?: string | null): number {
  if (m && m.width && m.height) return m.width / m.height;
  return LAYOUT_RATIO[layoutFor(undefined, stored)];
}
