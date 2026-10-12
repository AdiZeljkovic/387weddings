/**
 * Stops the page behind an overlay from scrolling. Counted, so two overlays
 * (the mobile menu, the lightbox) can lock and unlock in any order without
 * one of them freeing the page while the other is still open.
 */
let locks = 0;
let saved = '';

export function lockScroll(): () => void {
  if (locks++ === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) document.body.style.overflow = saved;
  };
}
