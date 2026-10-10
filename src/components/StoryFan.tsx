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
 * When the section reaches the top of the screen it stays pinned (sticky)
 * while the visitor scrolls on through roughly three screens; nothing hijacks
 * the scroll, the page simply holds this section while it plays:
 *
 *   0-25%    the cards rise out of the centre and open into the fan
 *   25-85%   focus travels left to right, each story in turn grows to 112%,
 *            straightens and comes forward while the others step back
 *   85-100%  the fan settles back and the page moves on
 *
 * Progress is read from one getBoundingClientRect per animation frame and
 * written as transform/opacity only, so nothing is laid out again while it
 * runs. Every card is a real link to its story at all times, reachable by Tab.
 * Under reduced motion, or where sticky is not supported, the fan is simply
 * shown open and still.
 */

// The board's geometry, per card k = -2..2 (fewer stories stay symmetric)
const GEO = {
  desk: { w: 190, dx: 183, dy: 22, rot: 4, h: 470, active: 1.12 },
  phone: { w: 92, dx: 64, dy: 8, rot: 3, h: 215, active: 1.15 },
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
// 0 -> 1 between a and b
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const canPin = () =>
  typeof window !== 'undefined'
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  && typeof CSS !== 'undefined' && CSS.supports('position', 'sticky');

export default function StoryFan({ stories, heading, cta }: {
  stories: FanStory[];
  heading: React.ReactNode;
  cta: React.ReactNode;
}) {
  const p = usePaths();
  const en = useLanguage().language === 'ENG';
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const caps = useRef<(HTMLSpanElement | null)[]>([]);
  const dashes = useRef<(HTMLSpanElement | null)[]>([]);
  const head = useRef<HTMLDivElement>(null);

  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [pinned] = useState(canPin);

  useEffect(() => {
    const on = () => setPhone(window.innerWidth < 1024);
    window.addEventListener('resize', on, { passive: true });
    return () => window.removeEventListener('resize', on);
  }, []);

  const n = stories.length;
  const g = phone ? GEO.phone : GEO.desk;
  const place = useMemo(() => stories.map((_, i) => {
    const k = i - (n - 1) / 2;
    return { x: k * g.dx, y: k * k * g.dy, r: k * g.rot, z: 10 - Math.round(Math.abs(k)) };
  }), [stories, n, g]);

  // Paint one frame of the sequence for progress p (0..1)
  const paint = (prog: number) => {
    const focusOn = pinned ? ramp(prog, 0.25, 0.30) * (1 - ramp(prog, 0.80, 0.85)) : 0;
    const f = (prog - 0.25) / (0.6 / Math.max(n, 1)) - 0.5;  // which story has the focus
    if (head.current) {
      const h = pinned ? ease(ramp(prog, 0, 0.2)) : 1;
      head.current.style.opacity = String(h);
      head.current.style.translate = `0 ${(1 - h) * 28}px`;
    }
    place.forEach((pl, i) => {
      const el = cards.current[i];
      if (!el) return;
      const open = pinned ? ease(ramp(prog, 0.02 * i, 0.02 * i + 0.17)) : 1;
      const w = clamp(1 - Math.abs(f - i)) * focusOn;   // this story's share of the focus
      const scale = 1 - 0.06 * focusOn + w * (g.active - 0.94);
      el.style.translate = `${pl.x * open}px ${60 * (1 - open) + pl.y * open}px`;
      el.style.rotate = `${pl.r * open * (1 - w)}deg`;
      el.style.scale = String(scale);
      el.style.opacity = String(clamp(open * 3.3) * (1 - 0.4 * (focusOn - w)));
      el.style.zIndex = String(pl.z + Math.round(w * 20));
      const sh = shades.current[i];
      if (sh) sh.style.opacity = String(w);
      // Phones carry no captions (the board), so only the desktop one grows
      const cap = caps.current[i];
      if (cap && !phone) cap.style.scale = String(1 + 0.15 * w);
      const d = dashes.current[i];
      if (d) d.style.transform = `scaleX(${w})`;
    });
  };

  // Static first paint, then follow the scroll while the section is near
  useLayoutEffect(() => { paint(pinned ? 0 : 1); });  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pinned || !wrap.current) return;
    const el = wrap.current;
    let raf = 0;
    let near = false;
    const frame = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const stage = window.innerHeight - top;
      const travel = Math.max(1, rect.height - stage);
      paint(clamp((top - rect.top) / travel));
    };
    const onScroll = () => { if (near && !raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) onScroll(); },
      { rootMargin: '200px 0px' });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pinned, place, phone]);  // eslint-disable-line react-hooks/exhaustive-deps

  const stage = (
    <div
      className="relative flex flex-col lg:flex-row items-center lg:gap-12 w-full max-w-[1312px] mx-auto px-5 lg:px-16"
    >
      <div ref={head} className="w-full lg:w-auto lg:flex-[0_1_280px] lg:min-w-[240px] text-center lg:text-left mb-6 lg:mb-0">
        {heading}
      </div>

      <div className="relative w-full lg:flex-[1_1_560px] lg:min-w-0">
        <div className="relative" style={{ height: g.h }}>
          {stories.map((s, i) => {
            const r = respImg(s.image || '');
            return (
              <Link
                key={s.id}
                ref={el => { cards.current[i] = el; }}
                to={p('portfolio', s.slug)}
                aria-label={`${en ? 'Story' : 'Priča'}: ${s.couple}`}
                className="fan-card absolute top-6 block text-ink-900 will-change-transform"
                style={{ left: `calc(50% - ${g.w / 2}px)`, width: g.w }}
              >
                <span className="fan-photo relative block aspect-[2/3] overflow-hidden rounded-[3px] border-[3px] border-cream-light bg-rule">
                  {s.image && (
                    <img
                      src={r.src}
                      srcSet={r.srcSet}
                      sizes="(min-width: 1024px) 240px, 120px"
                      alt={s.alt || s.couple}
                      style={{ objectPosition: s.focus || undefined }}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                  className="pointer-events-none absolute left-0 right-0 top-0 aspect-[2/3] rounded-[3px] shadow-[0_30px_60px_rgba(60,40,20,.42)] opacity-0"
                />
                <span
                  ref={el => { caps.current[i] = el; }}
                  className="fan-cap hidden lg:block text-center mt-3.5 origin-top"
                >
                  <b className="block font-serif font-normal text-[19px] leading-[1.2] text-ink-900 [overflow-wrap:anywhere]">
                    {s.couple}
                  </b>
                  <i className="block not-italic text-[10px] tracking-[0.22em] uppercase text-gold-label mt-1.5">
                    {en ? 'View the story' : 'Pogledaj priču'} →
                  </i>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  const dashRow = n > 1 && pinned ? (
    <div aria-hidden="true" className="flex justify-center gap-2.5 mt-14 lg:mt-16">
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
      {/* Three screens of travel on a desktop, two and a half on a phone */}
      <div ref={wrap} className="relative h-[250vh] lg:h-[300vh]">
        <div className="fan-stage sticky flex flex-col justify-center overflow-hidden">
          {stage}
          {dashRow}
        </div>
      </div>
      {cta}
    </>
  );
}
