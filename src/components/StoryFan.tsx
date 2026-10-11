import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { respImg } from '../lib/img';
import { usePaths } from '../lib/routes';
import { useLanguage } from '../contexts/LanguageContext';

export interface FanStory {
  id: number;
  slug: string;
  couple: string;
  image: string | null;
  focus: string | null;
  alt: string | null;
}

/**
 * "Trenuci. Emocija. Zauvijek." — a fan of up to five stories, the board's
 * variant B, and the site's main moving moment.
 *
 * The cards open out of the centre while the section comes up the screen, so
 * the fan is already whole when the section reaches the top. There it stays
 * pinned (sticky) for two screens on a desktop and 1.8 on a phone; nothing
 * hijacks the scroll, the page simply holds this section while it plays:
 *
 *   arriving   the cards rise out of the centre and open into the fan,
 *              finished by 12% of the pinned travel at the latest
 *   12-90%     focus travels left to right, about 15% per story: the story in
 *              focus grows, straightens and comes forward, the others step back
 *   90-100%    the fan settles and the page moves on
 *
 * The markup itself is the open fan, so before any script runs, without
 * script, or if a measurement never comes, the stories are there and
 * visible. The state is always worked out from where the section is on the
 * screen right now (every frame while it is in view, and on load, pageshow,
 * resize and hashchange), never from a count of scroll events, so a reload
 * halfway down, an anchor link or the back button all land in the right
 * phase. Only translate / rotate / scale / opacity are written.
 */

// The board's geometry per card k = -2..2 (fewer stories stay symmetric).
// Desktop: 240px cards 190px apart, down k² × 24px, tilted k × 4°, scaled down
// as a unit when the column is narrower than the fan needs. Phone (to 767px):
// everything is a share of the content width C = screen - 32px, so the end
// cards always keep at least 16px from the edge — 0.30·C wide (at most 108px),
// 0.16·C apart (at most 53px), down k² × 8px, tilted k × 3°.
type Geo = { w: number; dx: number; dy: number; rot: number; h: number; active: number; phone: boolean };

const DESK = { w: 240, dx: 190, dy: 24, rot: 4 };
const DESK_SPAN = 4 * DESK.dx + DESK.w + 60;   // both end cards, their tilt and a margin

function geometry(column: number, viewport: number): Geo {
  if (viewport < 768) {
    const c = viewport - 32;
    const w = Math.min(108, 0.30 * c);
    return { w, dx: Math.min(53, 0.16 * c), dy: 8, rot: 3, h: 1.5 * w + 32 + 24 + 34, active: 1.15, phone: true };
  }
  const s = Math.min(1, Math.max(0.5, column / DESK_SPAN));
  const w = DESK.w * s;
  const desktop = viewport >= 1024;
  // Card, the drop of the end cards, the top gap, the caption under it
  return {
    w, dx: DESK.dx * s, dy: DESK.dy * s, rot: DESK.rot,
    h: 1.5 * w + 4 * DESK.dy * s + 24 + (desktop ? 84 : 40),
    active: 1.12, phone: false,
  };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
// 0 -> 1 between a and b
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const canPin = () =>
  typeof window !== 'undefined'
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  && typeof CSS !== 'undefined' && CSS.supports('position', 'sticky');

const FOCUS_FROM = 0.12;
const FOCUS_TO = 0.90;

export default function StoryFan({ stories, heading, cta }: {
  stories: FanStory[];
  heading: React.ReactNode;
  cta: React.ReactNode;
}) {
  const p = usePaths();
  const en = useLanguage().language === 'ENG';
  const wrap = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const caps = useRef<(HTMLSpanElement | null)[]>([]);
  const dashes = useRef<(HTMLSpanElement | null)[]>([]);
  const head = useRef<HTMLDivElement>(null);

  const [pinned] = useState(canPin);
  const [geo, setGeo] = useState<Geo>(() => {
    const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
    // A first guess at the column until it can be measured
    const col = vw >= 1024 ? Math.min(vw, 1440) - 128 - 288 : vw - 40;
    return geometry(col, vw);
  });

  // The geometry follows the column the fan actually has
  useLayoutEffect(() => {
    const el = column.current;
    if (!el) return;
    const measure = () => {
      const next = geometry(el.clientWidth, window.innerWidth);
      setGeo(g => (Math.abs(g.w - next.w) < 0.5 && Math.abs(g.dx - next.dx) < 0.5 && g.phone === next.phone ? g : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = stories.length;
  const place = useMemo(() => stories.map((_, i) => {
    const k = i - (n - 1) / 2;
    return { x: k * geo.dx, y: k * k * geo.dy, r: k * geo.rot, z: 10 - Math.round(Math.abs(k)) };
  }), [stories, n, geo]);

  // One frame of the sequence. `arrive` runs 0 -> 1 while the section comes
  // up the screen, `prog` 0 -> 1 over the pinned travel.
  const paint = (arrive: number, prog: number) => {
    const focusOn = ramp(prog, FOCUS_FROM - 0.02, FOCUS_FROM + 0.02) * (1 - ramp(prog, FOCUS_TO - 0.02, FOCUS_TO + 0.02));
    const per = (FOCUS_TO - FOCUS_FROM) / Math.max(n, 1);
    const f = (prog - FOCUS_FROM) / per - 0.5;   // which story has the focus
    if (head.current) {
      const h = Math.max(ease(ramp(arrive, 0.15, 0.6)), ramp(prog, 0, 0.12));
      head.current.style.opacity = String(h);
      head.current.style.translate = `0 ${(1 - h) * 28}px`;
    }
    place.forEach((pl, i) => {
      const el = cards.current[i];
      if (!el) return;
      // Each card a little after the one before; whole by 12% of the travel
      const open = Math.max(ease(ramp(arrive, 0.2 + 0.06 * i, 0.7 + 0.06 * i)), ramp(prog, 0, FOCUS_FROM));
      const w = clamp(1 - Math.abs(f - i)) * focusOn;   // this story's share of the focus
      const scale = 1 - 0.06 * focusOn + w * (geo.active - 0.94);
      el.style.translate = `${pl.x * open}px ${60 * (1 - open) + pl.y * open}px`;
      el.style.rotate = `${pl.r * open * (1 - w)}deg`;
      el.style.scale = String(scale);
      el.style.opacity = String(clamp(open * 3) * (1 - 0.4 * (focusOn - w)));
      el.style.zIndex = String(pl.z + Math.round(w * 20));
      const sh = shades.current[i];
      if (sh) sh.style.opacity = String(w);
      const cap = caps.current[i];
      if (cap) {
        if (geo.phone) {
          // On a phone only the story in focus is named; while the focus
          // passes from one card to the next the two names never overlap
          cap.style.opacity = String(clamp((w - 0.5) * 2.5));
        } else {
          cap.style.opacity = '';
          cap.style.scale = String(1 + 0.15 * w);
        }
      }
      const d = dashes.current[i];
      if (d) d.style.transform = `scaleX(${w})`;
    });
  };

  // The resting, open fan — what the markup shows before and without script
  const rest = (i: number): React.CSSProperties => ({
    translate: `${place[i].x}px ${place[i].y}px`,
    rotate: `${place[i].r}deg`,
    zIndex: place[i].z,
  });

  useEffect(() => {
    if (!pinned || !wrap.current) return;
    const el = wrap.current;
    let raf = 0;
    let visible = false;
    let last = '';
    const headerH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const top = headerH();
      const vh = window.innerHeight;
      const stage = vh - top;
      // Arriving: the wrapper's top travelling from the bottom of the screen
      // up to the header
      const arrive = clamp((vh - rect.top) / Math.max(1, vh - top));
      const prog = clamp((top - rect.top) / Math.max(1, rect.height - stage));
      const key = `${arrive.toFixed(4)}|${prog.toFixed(4)}`;
      if (key !== last) {
        last = key;
        paint(arrive, prog);
      }
    };
    // While the section is on screen it is recomputed every frame, so it can
    // never be left behind by a missed scroll event (momentum scrolling,
    // address bars, restored scroll positions)
    const loop = () => {
      compute();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
      else compute();
    }, { rootMargin: '25% 0px' });
    io.observe(el);
    const now = () => { compute(); if (visible) kick(); };
    window.addEventListener('scroll', now, { passive: true });
    window.addEventListener('resize', now, { passive: true });
    window.addEventListener('pageshow', now);
    window.addEventListener('hashchange', now);
    window.addEventListener('load', now);
    compute();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', now);
      window.removeEventListener('resize', now);
      window.removeEventListener('pageshow', now);
      window.removeEventListener('hashchange', now);
      window.removeEventListener('load', now);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pinned, place, geo]);  // eslint-disable-line react-hooks/exhaustive-deps

  const stage = (
    <div className="relative flex flex-col lg:flex-row items-center lg:gap-12 w-full max-w-[1440px] mx-auto px-5 lg:px-16">
      <div ref={head} className="w-full lg:w-auto lg:flex-[0_0_240px] lg:max-w-[240px] text-center lg:text-left mb-4 lg:mb-0">
        {heading}
      </div>

      <div ref={column} className="relative w-full lg:flex-1 lg:min-w-0">
        <div className="relative" style={{ height: Math.round(geo.h) }}>
          {stories.map((s, i) => {
            const r = respImg(s.image || '');
            return (
              <Link
                key={s.id}
                ref={el => { cards.current[i] = el; }}
                to={p('portfolio', s.slug)}
                aria-label={`${en ? 'Story' : 'Priča'}: ${s.couple}`}
                className="fan-card absolute top-6 block text-ink-900 will-change-transform"
                style={{ left: `calc(50% - ${geo.w / 2}px)`, width: geo.w, ...rest(i) }}
              >
                <span className="fan-photo relative block aspect-[2/3] overflow-hidden rounded-[3px] border-[3px] border-cream-light bg-rule">
                  {s.image && (
                    <img
                      src={r.src}
                      srcSet={r.srcSet}
                      sizes="(min-width: 1024px) 270px, (min-width: 768px) 220px, 125px"
                      alt={s.alt || s.couple}
                      style={{ objectPosition: s.focus || undefined }}
                      className="w-full h-full object-cover"
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </span>
                {/* The stronger shadow of the story in focus, faded in rather
                    than animated, so only opacity changes while scrolling */}
                <span
                  ref={el => { shades.current[i] = el; }}
                  aria-hidden="true"
                  className="fan-shade pointer-events-none absolute left-0 right-0 top-0 aspect-[2/3] rounded-[3px] opacity-0"
                />
                {/* Desktop: always under the card. Phone: the board shows the
                    fan without names; while the focus travels, the name of the
                    story in focus appears under it. */}
                <span
                  ref={el => { caps.current[i] = el; }}
                  aria-hidden="true"
                  className={`fan-cap block text-center origin-top ${
                    geo.phone
                      ? 'absolute left-1/2 top-full w-[180%] -translate-x-1/2 mt-2.5 opacity-0'
                      : 'mt-3.5'
                  }`}
                >
                  <b className={`block font-serif font-normal leading-[1.2] text-ink-900 [overflow-wrap:anywhere] ${geo.phone ? 'text-[14px]' : 'text-[19px]'}`}>
                    {s.couple}
                  </b>
                  {!geo.phone && (
                    <i className="hidden lg:block not-italic text-[10px] tracking-[0.22em] uppercase text-gold-label mt-1.5">
                      {en ? 'View the story' : 'Pogledaj priču'} →
                    </i>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  const dashRow = n > 1 && pinned ? (
    <div aria-hidden="true" className="flex justify-center gap-2.5 mt-8 lg:mt-10">
      {stories.map((s, i) => (
        <span key={s.id} className="block w-7 h-0.5 bg-ink-900/15 overflow-hidden">
          <span
            ref={el => { dashes.current[i] = el; }}
            className="block h-full bg-gold-600 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </span>
      ))}
    </div>
  ) : null;

  if (!pinned) {
    return (
      <>
        <div className="py-2">{stage}</div>
        {cta}
      </>
    );
  }

  return (
    <>
      {/* Two screens of travel on a desktop, 1.8 on a phone or tablet */}
      <div ref={wrap} className="relative h-[180vh] lg:h-[200vh]">
        <div className="fan-stage sticky flex flex-col justify-center overflow-hidden">
          {stage}
          {dashRow}
        </div>
      </div>
      {cta}
    </>
  );
}
