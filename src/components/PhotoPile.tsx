import React, { useEffect, useRef, useState } from 'react';

export interface PilePhoto {
  key: string;
  src: string;
  srcSet?: string;
  alt: string;
  focus?: string;
  /** Where it rests, as the board lays the pile out */
  pos: React.CSSProperties;
  w: string;
  ratio: string;
  /** Resting tilt, degrees */
  r: number;
  /** Where it flies in from: share of the screen width, px down, extra tilt */
  from: [number, number, number];
  /** How far it drifts with the scroll (depth): bigger prints move less */
  px: number;
  /** How far it moves against the mouse (depth), px */
  depth: number;
}

/**
 * "Više od fotografija" — five prints thrown on a table.
 *
 *   Scroll    each print flies in from its own side (a quarter to two fifths
 *             of the screen width out, about 120px up or down, 15-20° more
 *             tilted, transparent) and settles into its resting place, each
 *             about 6% of the scroll after the one before, all in place by the
 *             time the pile's middle is at 60% of the screen height. It is
 *             tied to the scroll position, so it plays back when scrolling up,
 *             and a page opened halfway down finds the prints already in place.
 *             Desktop prints also drift at their own speed (depth).
 *   Idle      every print breathes: ±6px and ±1°, over 7-11s, each out of
 *             phase with the others.
 *   Mouse     (desktop) the prints lean toward the cursor in 3D, up to ±6°,
 *             and shift 6-10px away from it, each by its own depth.
 *   Hover     (desktop) the print comes to the front, straightens to 40% of
 *             its tilt, grows to 106% with a deeper shadow and a light sheen
 *             crosses it once; its neighbours step 14px aside and dim to 85%.
 *
 * Phones keep the fly-in (half the distance) and the breathing. Under reduced
 * motion the pile simply rests. Clicking a print does nothing; it is decor.
 *
 * Layers, outermost first, so no two effects write the same property:
 * .pile-item (place, fly-in, depth) > .pile-float (breathing) > .pile-tilt
 * (mouse, step aside) > .pile-photo (resting tilt, hover).
 */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// Even in and out, so the flight is seen while the pile is on screen rather
// than spent in the first few pixels
const smooth = (t: number) => t * t * (3 - 2 * t);

export default function PhotoPile({ photos, className = '' }: { photos: PilePhoto[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const tilts = useRef<(HTMLDivElement | null)[]>([]);
  const [hot, setHot] = useState<number | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const push = useRef<{ x: number; y: number }[]>([]);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = () => window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;

  // ── Scroll: fly-in and depth ───────────────────────────────────────────────
  useEffect(() => {
    const el = box.current;
    if (!el || reduce) return;
    let raf = 0;
    let visible = false;
    let last = '';
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const desktop = vw >= 1024;
      const centre = rect.top + rect.height / 2;
      // 0 as the pile's top enters at the bottom, 1 with its middle at 60%
      const start = vh + rect.height / 2;
      const settle = clamp((start - centre) / Math.max(1, start - vh * 0.6));
      // 0 -> 1 while the pile crosses the whole screen, for the depth drift
      const cover = clamp((vh - rect.top) / Math.max(1, vh + rect.height));
      const key = `${settle.toFixed(4)}|${cover.toFixed(4)}|${vw}`;
      if (key === last) return;
      last = key;
      const reach = desktop ? 1 : 0.5;
      photos.forEach((ph, i) => {
        const node = items.current[i];
        if (!node) return;
        const t = smooth(clamp((settle - 0.06 * i) / 0.76));
        const away = 1 - t;
        const drift = desktop ? ph.px * (1 - 2 * cover) : 0;
        node.style.translate = `${ph.from[0] * vw * reach * away}px ${ph.from[1] * reach * away + drift}px`;
        node.style.rotate = `${ph.from[2] * away}deg`;
        node.style.opacity = String(clamp(t * 1.6));
      });
    };
    const loop = () => {
      compute();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick(); else compute();
    }, { rootMargin: '30% 0px' });
    io.observe(el);
    const now = () => { compute(); if (visible) kick(); };
    window.addEventListener('scroll', now, { passive: true });
    window.addEventListener('resize', now, { passive: true });
    window.addEventListener('pageshow', now);
    compute();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', now);
      window.removeEventListener('resize', now);
      window.removeEventListener('pageshow', now);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [photos, reduce]);

  // ── Mouse: lean toward the cursor, step aside for the print under it ──────
  const writeTilts = () => {
    const { x, y } = mouse.current;
    photos.forEach((ph, i) => {
      const t = tilts.current[i];
      if (!t) return;
      const pu = push.current[i] || { x: 0, y: 0 };
      t.style.transform =
        `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) ` +
        `translate(${-x * ph.depth + pu.x}px, ${-y * ph.depth + pu.y}px)`;
    });
  };

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !pointer() || !box.current) return;
    const r = box.current.getBoundingClientRect();
    mouse.current = {
      x: clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      y: clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1),
    };
    writeTilts();
  };

  const onLeave = () => {
    mouse.current = { x: 0, y: 0 };
    push.current = [];
    setHot(null);
    writeTilts();
  };

  const onItemLeave = () => {
    push.current = [];
    setHot(null);
    writeTilts();
  };

  const onEnter = (i: number) => (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !pointer()) return;
    // Each neighbour steps 14px straight away from the print under the mouse
    const centre = (n: number) => {
      const b = items.current[n]?.getBoundingClientRect();
      return b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : { x: 0, y: 0 };
    };
    const c = centre(i);
    push.current = photos.map((_, j) => {
      if (j === i) return { x: 0, y: 0 };
      const o = centre(j);
      const dx = o.x - c.x, dy = o.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: (dx / len) * 14, y: (dy / len) * 14 };
    });
    setHot(i);
    writeTilts();
  };

  return (
    <div
      ref={box}
      className={`pile relative ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {photos.map((ph, i) => (
        <div
          key={ph.key}
          ref={el => { items.current[i] = el; }}
          className={`pile-item absolute ${hot === i ? 'is-hot' : hot !== null ? 'is-dim' : ''}`}
          onPointerEnter={onEnter(i)}
          onPointerLeave={onItemLeave}
          style={{ ...ph.pos, width: ph.w, zIndex: hot === i ? 10 : i + 1 }}
        >
          <div
            className="pile-float"
            // Each print breathes at its own pace and out of step with the rest
            style={{ '--fd': `${7 + ((i * 1.7) % 4)}s`, '--fo': `${-i * 2.3}s` } as unknown as React.CSSProperties}
          >
            <div ref={el => { tilts.current[i] = el; }} className="pile-tilt">
              <div
                className="pile-photo relative overflow-hidden rounded-[3px] border-[3px] border-cream-light bg-rule"
                style={{ aspectRatio: ph.ratio, '--r': `${ph.r}deg` } as unknown as React.CSSProperties}
              >
                <img
                  src={ph.src}
                  srcSet={ph.srcSet}
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  alt={ph.alt}
                  style={{ objectPosition: ph.focus || undefined }}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
