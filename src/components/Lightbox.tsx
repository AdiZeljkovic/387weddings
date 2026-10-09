import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fullImg } from '../lib/img';

export interface LightboxImage {
  id: number | string;
  url: string;
  alt?: string | null;
  caption?: string | null;
}

interface Props {
  images: LightboxImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Used for the dialog's accessible name */
  title?: string;
  /** Kept for callers; the board shows no meta line in the viewer */
  meta?: string;
  closeLabel?: string;
}

const SWIPE_PX = 50;

/**
 * Full-screen viewer, as the "Priča – lightbox" board draws it and as the
 * reference site does it: the photograph takes the whole height of the screen
 * at its own shape, the arrows are bare characters against the edges, "Zatvori
 * ✕" sits in the top corner and a small counter at the bottom. It covers the
 * header completely, and a click on the dark surround closes it.
 *
 * The earlier version framed the photograph in a box well inside the screen,
 * put the arrows in circles and the counter at the top — all three were on
 * the client's list.
 */
const Lightbox = ({ images, index, onIndex, onClose, title, closeLabel = 'Zatvori' }: Props) => {
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => onIndex((index + delta + count) % count),
    [index, count, onIndex]
  );

  // Arrow keys and Escape, plus a scroll lock while the viewer is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  // The next and previous photographs start loading now, so stepping through
  // a story does not wait on each one
  useEffect(() => {
    if (count < 2) return;
    for (const d of [1, -1]) {
      const n = images[(index + d + count) % count];
      if (!n) continue;
      const pre = new Image();
      const r = fullImg(n.url);
      if (r.srcSet) { pre.srcset = r.srcSet; pre.sizes = '100vw'; }
      pre.src = r.src;
    }
  }, [index, count, images]);

  if (count === 0) return null;
  const current = images[Math.min(index, count - 1)];
  const r = fullImg(current.url);
  const caption = current.caption?.trim();

  // Rendered straight into <body>. Inside the page it sat in the page-fade
  // wrapper, whose entrance animation forms its own stacking context — so no
  // z-index could lift the viewer above the sticky header, and the header (with
  // "Zatvori ✕" under it) stayed on top of the photograph.
  return createPortal(
    <div
      className="lightbox-in fixed inset-0 z-[2000] bg-[#0e0c0a] text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Galerija'}
      // A click on the dark surround closes; clicks on the photograph and the
      // controls stop before they get here
      onClick={onClose}
      onTouchStart={e => { touchX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* The photograph: full height, its own shape, never cropped */}
      <div className={`absolute left-0 right-0 top-3 flex items-center justify-center pointer-events-none ${
        caption ? 'bottom-16' : 'bottom-11'
      }`}>
        <img
          key={current.url}
          src={r.src}
          srcSet={r.srcSet}
          sizes="100vw"
          alt={current.alt || ''}
          onClick={e => e.stopPropagation()}
          className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-auto"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={e => { e.stopPropagation(); onClose(); }}
        className="absolute top-3.5 right-[18px] z-10 min-h-11 px-1 text-white text-[11px] font-medium tracking-[0.2em] uppercase transition-opacity duration-250 hover:opacity-70"
      >
        {closeLabel} ✕
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); go(-1); }}
            aria-label="Prethodna"
            className="absolute top-1/2 -translate-y-1/2 left-3.5 z-10 p-3 text-[30px] leading-none text-white transition-opacity duration-250 hover:opacity-70"
          >
            ←
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); go(1); }}
            aria-label="Sljedeća"
            className="absolute top-1/2 -translate-y-1/2 right-3.5 z-10 p-3 text-[30px] leading-none text-white transition-opacity duration-250 hover:opacity-70"
          >
            →
          </button>
        </>
      )}

      {/* The optional caption the owner can give each photograph, then the
          small counter at the very bottom */}
      <div className="absolute left-0 right-0 bottom-3.5 text-center px-16 pointer-events-none">
        {caption && (
          <div className="text-[11px] tracking-[0.16em] text-[#d8cfc2] mb-1.5 truncate">{caption}</div>
        )}
        <div className="text-[11px] tracking-[0.24em] text-[#d8cfc2]" aria-live="polite">
          {String(index + 1).padStart(2, '0')}
          <span className="text-ink-400">&nbsp;/&nbsp;</span>
          {String(count).padStart(2, '0')}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
