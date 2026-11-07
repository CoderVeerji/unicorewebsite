/*
 * Smooth scrolling (Lenis). Wheel and trackpad scrolling glides to a stop
 * instead of jumping in 100px steps; touch keeps the phone's own native
 * momentum. Anchor links on the same page glide too.
 *
 * It is the only thing that moves the page, so the pinned product row, the
 * scene dots and the scroll-linked effects all just read window.scrollY and
 * stay in step. Off under prefers-reduced-motion and data-motion="off".
 *
 * Other scripts scroll through window.unicoreScrollTo(y), which uses Lenis when
 * it is running and the browser's own smooth scroll when it is not.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis = null;
let raf = 0;
let clickHandler = null;

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

function headerOffset() {
  const h = document.querySelector('header.fixed');
  const real = h ? h.getBoundingClientRect().bottom : 0;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr'));
  return Math.max(real, Number.isFinite(v) ? v : 116);
}

window.unicoreScrollTo = (y, opts = {}) => {
  if (lenis) lenis.scrollTo(y, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  else window.scrollTo({ top: y, behavior: opts.immediate ? 'instant' : 'smooth' });
};
window.unicoreScrollLock = (locked) => {
  if (!lenis) return;
  locked ? lenis.stop() : lenis.start();
};

function init() {
  teardown();
  if (off()) return;
  lenis = new Lenis({
    lerp: 0.09,            // how quickly it catches up with the wheel; lower = silkier
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1,
    syncTouch: false,      // leave touch scrolling to the OS
  });
  window.__lenis = lenis;
  const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);

  clickHandler = (e) => {
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    const extra = el.closest('.products-sec') && window.innerWidth < 1024 ? 64 : 0;
    lenis.scrollTo(el, { offset: -headerOffset() - 8 - extra, duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    history.pushState(null, '', url.hash);
  };
  document.addEventListener('click', clickHandler);
}

function teardown() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (clickHandler) document.removeEventListener('click', clickHandler);
  clickHandler = null;
  if (lenis) { lenis.destroy(); lenis = null; }
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
