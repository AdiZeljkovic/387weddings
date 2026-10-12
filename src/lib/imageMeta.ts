export type ImageMeta = { width: number; height: number; orientation: string };

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

/**
 * The frame ratio (width / height) of a Radovi card.
 *
 * The owner's explicit choice in the panel — TALL 3:4, WIDE 4:3, SQUARE 1:1 —
 * always wins; that is what "the size I set does not change" was about. AUTO,
 * the default, follows the photograph exactly so a landscape cover is never
 * squeezed into a near-square box. Extreme panoramas are held to a sane range.
 */
export function cardRatio(layout: string | null | undefined, w?: number | null, h?: number | null): number {
  const l = (layout || 'AUTO').toUpperCase();
  if (l === 'TALL') return 3 / 4;
  if (l === 'WIDE') return 4 / 3;
  if (l === 'SQUARE') return 1;
  if (w && h) return Math.min(1.6, Math.max(0.66, w / h));
  return 3 / 4;
}
