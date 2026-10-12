/**
 * Runs a scroll-linked animation smoothly and cheaply.
 *
 * Why not just follow the scroll: a mouse wheel moves the page in steps of
 * about 100px, so anything tied straight to the scroll position jumps in
 * steps too. Here every value eases toward where the scroll says it should
 * be (an exponential follow, about `tau` ms), so the motion stays fluid
 * whatever the input — wheel, trackpad, touch or a dragged scrollbar. The
 * follow speeds up with the distance still to go, so it keeps pace with a
 * fast scroll instead of trailing behind it.
 *
 * Why it does not stall the page:
 *  - the layout is read only when it can have changed (resize, the page
 *    growing or shrinking, the header changing height) — never per frame;
 *    per frame there is one read of scrollY and plain arithmetic;
 *  - the frame loop runs only while something is still moving and stops as
 *    soon as everything has settled, so an idle page costs nothing;
 *  - far from the screen the element is not animated at all.
 *
 * Loading the page halfway down, an anchor link, back/forward, a resize: the
 * values jump straight to where they belong instead of gliding in from zero.
 */
export interface ScrollDriver {
  /** Something other than the scroll changed the target (the mouse, a hover) */
  kick: () => void;
  /** Re-read the layout and jump to the current state */
  snap: () => void;
  destroy: () => void;
}

export function scrollDriver<M>(opts: {
  el: HTMLElement;
  /** Layout reads: only called when the layout may have changed */
  measure: () => M;
  /** Where every value should be for this scroll position — arithmetic only */
  target: (m: M, scrollY: number, viewportH: number) => number[];
  /** Write the values (styles only) */
  paint: (v: number[]) => void;
  tau?: number;
  /** How close counts as arrived */
  epsilon?: number;
}): ScrollDriver {
  const { el, measure, target, paint, tau = 70, epsilon = 0.0006 } = opts;
  let m = measure();
  let cur: number[] = target(m, window.scrollY, window.innerHeight);
  let raf = 0;
  let last = 0;
  let near = true;

  const frame = (t: number) => {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    const goal = target(m, window.scrollY, window.innerHeight);
    let moving = false;
    for (let i = 0; i < goal.length; i++) {
      const c = cur[i] ?? goal[i];
      const d = goal[i] - c;
      if (Math.abs(d) > epsilon) {
        // The further behind, the faster it catches up: a quick scroll is
        // followed almost at once, a slow one stays soft. A fixed delay made
        // the motion trail behind a fast scroll and keep moving after it.
        const k = 1 - Math.exp(-dt / (tau / (1 + Math.abs(d) * 25)));
        cur[i] = c + d * k;
        moving = true;
      } else {
        cur[i] = goal[i];
      }
    }
    paint(cur);
    if (moving) raf = requestAnimationFrame(frame);
    else { raf = 0; last = 0; }
  };

  const kick = () => {
    if (near && !raf) raf = requestAnimationFrame(frame);
  };

  const snap = () => {
    m = measure();
    cur = target(m, window.scrollY, window.innerHeight);
    paint(cur);
  };

  // Only near the screen does the scroll matter to this element
  const io = new IntersectionObserver(([e]) => {
    const was = near;
    near = e.isIntersecting;
    // Arriving from far away (a flick, a jump): start from the right state
    if (near && !was) snap();
  }, { rootMargin: '50% 0px' });
  io.observe(el);

  // The page changed size (images, fonts, content arriving): measure again
  let pending = 0;
  const remeasure = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; m = measure(); kick(); });
  };
  const ro = new ResizeObserver(remeasure);
  ro.observe(document.body);
  // The header changes height as it leaves the hero (--header-h)
  const mo = new MutationObserver(remeasure);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  // A phone's address bar resizes the viewport during a scroll: measure again
  // but keep gliding rather than jump
  const onResize = () => { m = measure(); kick(); };
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pageshow', snap);
  window.addEventListener('hashchange', snap);
  window.addEventListener('load', snap);
  paint(cur);

  return {
    kick,
    snap,
    destroy: () => {
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', snap);
      window.removeEventListener('hashchange', snap);
      window.removeEventListener('load', snap);
      if (raf) cancelAnimationFrame(raf);
      if (pending) cancelAnimationFrame(pending);
    },
  };
}

/** Where an element's top is in the document, and its height */
export const docBox = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height };
};

/** The sticky header's height, as the Navbar publishes it */
export const headerHeight = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
