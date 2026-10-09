import React, { useCallback, useEffect, useRef } from 'react';
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
  /** Couple name shown under the frame; "&" is set in italic */
  title?: string;
  /** Location · date line */
  meta?: string;
  closeLabel?: string;
}

const SWIPE_PX = 50;

const Lightbox = ({ images, index, onIndex, onClose, title, meta, closeLabel = 'Zatvori' }: Props) => {
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

  if (count === 0) return null;
  const current = images[Math.min(index, count - 1)];
  const r = fullImg(current.url);

  const nameParts = (title || '').split(/\s*&\s*/);

  return (
    <div
      className="lightbox-in fixed inset-0 z-[2000] bg-[#0e0c0a] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Galerija'}
      onTouchStart={e => { touchX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* Counter and close */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 lg:px-14 py-6 lg:py-9 z-10">
        <span className="text-[11px] lg:text-[12px] tracking-[0.3em] text-rule">
          {String(index + 1).padStart(2, '0')}
          <span className="text-ink-400">&nbsp;/&nbsp;</span>
          {String(count).padStart(2, '0')}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="text-white text-[11px] lg:text-[12px] font-medium tracking-[0.24em] uppercase border-b border-white/50 pb-1 min-h-11 px-2 transition-opacity duration-250 hover:opacity-70"
        >
          {closeLabel} ✕
        </button>
      </div>

      {/* Frame */}
      <div className="absolute inset-x-5 lg:inset-x-[180px] top-[88px] lg:top-[110px] bottom-[120px] lg:bottom-[130px] flex items-center justify-center">
        <img
          key={current.url}
          src={r.src}
          srcSet={r.srcSet}
          sizes="100vw"
          alt={current.alt || ''}
          className="max-w-full max-h-full object-contain"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Prethodna"
            className="absolute top-1/2 -translate-y-1/2 left-3 lg:left-14 w-11 h-11 lg:w-14 lg:h-14 rounded-full border border-white/40 flex items-center justify-center text-xl transition-colors duration-250 hover:bg-white hover:text-ink-900"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Sljedeća"
            className="absolute top-1/2 -translate-y-1/2 right-3 lg:right-14 w-11 h-11 lg:w-14 lg:h-14 rounded-full border border-white/40 flex items-center justify-center text-xl transition-colors duration-250 hover:bg-white hover:text-ink-900"
          >
            →
          </button>
        </>
      )}

      {/* Caption */}
      <div className="absolute left-0 right-0 bottom-9 lg:bottom-12 text-center px-6">
        {title && (
          <div className="font-serif text-[19px] lg:text-[22px]">
            {nameParts.length > 1 ? (
              <>
                {nameParts[0]} <span className="italic text-[#d6a2a8]">&amp;</span>{' '}
                {nameParts.slice(1).join(' & ')}
              </>
            ) : (
              title
            )}
          </div>
        )}
        {(current.caption || meta) && (
          <div className="text-[10px] tracking-[0.28em] uppercase text-[#9a9086] mt-2">
            {current.caption || meta}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
