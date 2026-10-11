import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * A new page opens at the top. But a reload, or back / forward, keeps where
 * the visitor was (the browser restores it), and an address with an anchor
 * (/#radovi) goes to that section. This used to scroll to the top on every
 * load, so a reload halfway down a page and every anchor link landed on the
 * hero instead.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const first = useRef(true);

  useEffect(() => {
    const initial = first.current;
    first.current = false;

    if (hash) {
      // The section may still be waiting for its data, so look for it a few
      // times before giving up
      let tries = 0;
      let timer = 0;
      const go = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) el.scrollIntoView();
        else if (tries++ < 40) timer = window.setTimeout(go, 100);
      };
      go();
      return () => clearTimeout(timer);
    }

    if (initial || navType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollToTop;
