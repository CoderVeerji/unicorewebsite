/*
 * Small touches that make the site feel finished:
 *   - a thin reading-progress line at the very top
 *   - the header turns frosted once the page has scrolled
 *   - buttons get a light sweep on hover
 *   - [data-parallax] elements drift a little against the scroll
 *
 * One passive scroll listener, work done in requestAnimationFrame, and only
 * transform / opacity / the `translate` property are written. Off under
 * prefers-reduced-motion and data-motion="off" (except the frosted header,
 * which is a plain colour change).
 */
let cleanup = [];

function reduced() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

const BTN = 'a[class*="uppercase"], button[class*="uppercase"], a.tyre-cta, a.menu-cta';

function tagButtons() {
  document.querySelectorAll(BTN).forEach((el) => {
    if (el.classList.contains('btn-fx') || el.closest('.menu-drawer, nav, .pc-card, .scene-dots, .lang-panel')) return;
    if (!/\bbg-(heading-black|logo-blue|deep-navy|white|product-frame)\b/.test(el.className) && !el.matches('a.tyre-cta')) return;
    el.classList.add('btn-fx');
  });
}

function init() {
  teardown();
  const html = document.documentElement;
  tagButtons();

  let bar = null;
  let fill = null;
  const motion = !reduced();
  if (motion) {
    bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    fill = document.createElement('span');
    bar.appendChild(fill);
    document.body.appendChild(bar);
  }

  const para = motion ? [...document.querySelectorAll('[data-parallax]')] : [];
  const visible = new Set();
  let io = null;
  if (para.length && 'IntersectionObserver' in window) {
    io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '20% 0px' });
    para.forEach((el) => io.observe(el));
  }

  let scrolled = false;
  let ticking = false;
  let max = 0;
  const measure = () => { max = document.documentElement.scrollHeight - window.innerHeight; };
  measure();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (ro) ro.observe(document.body);
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    if (fill) fill.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    const now = y > 8;
    if (now !== scrolled) { scrolled = now; html.classList.toggle('scrolled', now); }
    const mid = window.innerHeight / 2;
    visible.forEach((el) => {
      const r = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax) || 0.08;
      el.style.translate = `0 ${(((r.top + r.height / 2) - mid) * speed).toFixed(1)}px`;
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  frame();

  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
    if (ro) ro.disconnect();
    if (io) io.disconnect();
    if (bar) bar.remove();
    html.classList.remove('scrolled');
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
