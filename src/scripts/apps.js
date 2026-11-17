/*
 * Applications (homepage): stacked cards driven by scroll. See src/styles/apps.css.
 *
 * The scene is made tall and its content sticks under the header. Progress
 * through that height is spread over the cards: each card rises from below and
 * lands on the previous one, which shrinks a little and dims behind it. The
 * active tab follows; clicking a tab scrolls to that card. The page backdrop
 * cross-fades to the colour of the card on top and two soft orbs drift.
 *
 * Without pinning (reduced motion, no JS) the cards are just listed in the page.
 * Writes only transform and opacity.
 */
let cleanup = [];

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);

function init() {
  teardown();
  const scene = document.querySelector('[data-apps-scene]');
  if (!scene || off()) return;
  const sticky = scene.querySelector('.apps-sticky');
  const tabs = [...scene.querySelectorAll('[data-apps-tab]')];
  const cards = [...scene.querySelectorAll('[data-apps-card]')];
  const dots = [...scene.querySelectorAll('.apps-dot')];
  const layers = [...scene.querySelectorAll('.apps-bg-layer')];
  const orb1 = scene.querySelector('.apps-orb-1');
  const orb2 = scene.querySelector('.apps-orb-2');
  const viewport = scene.querySelector('[data-apps-viewport]');
  const n = cards.length;
  if (!sticky || n < 2 || !viewport) return;

  const html = document.documentElement;
  html.classList.add('apps-pin');
  let top = 0, dist = 0, ticking = false, active = -1;
  const hdr = () => { const h = document.querySelector('header.fixed'); return Math.max(h ? h.getBoundingClientRect().bottom : 0, 116); };
  const step = () => Math.max(window.innerHeight * 0.85, 460);

  const measure = () => {
    scene.style.height = '';
    const stickyH = sticky.offsetHeight;
    dist = Math.round((n - 1) * step());
    scene.style.height = `${stickyH + dist}px`;
    top = scene.getBoundingClientRect().top + window.scrollY - hdr();
    update();
  };

  const setActive = (i) => {
    if (i === active) return;
    active = i;
    cards.forEach((c, k) => { if (k === i) c.removeAttribute('inert'); else c.setAttribute('inert', ''); });
    tabs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        const strip = t.parentElement;
        const tr = t.getBoundingClientRect(); const sr = strip.getBoundingClientRect();
        if (tr.left < sr.left || tr.right > sr.right) strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
      }
    });
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
  };

  const update = () => {
    ticking = false;
    const p = clamp((window.scrollY - top) / dist, 0, 1);
    const t = p * (n - 1);                       // 0 .. n-1
    const h = viewport.clientHeight;
    cards.forEach((c, i) => {
      // entering: card i rises as t goes from i-1 to i
      const e = i === 0 ? 1 : ease(clamp(t - (i - 1), 0, 1));
      const ty = (1 - e) * (h + 70);
      // behind: cards already covered sink back
      const d = clamp(t - i, 0, n);
      const sc = 1 - 0.045 * d;
      const up = -9 * Math.min(d, 4);
      c.style.transform = `translate3d(0, ${(ty + up).toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
      c.style.zIndex = String(i + 1);
      c.style.setProperty('--dim', (0.14 * d).toFixed(3));
      c.style.opacity = i === 0 || e > 0.02 ? '1' : '0';
    });
    // backdrop: weights of the two nearest colours
    layers.forEach((l, i) => { l.style.opacity = String(clamp(1 - Math.abs(t - i), 0, 1).toFixed(3)); });
    if (orb1) orb1.style.transform = `translate3d(${(p * 160).toFixed(1)}px, ${(p * 90).toFixed(1)}px, 0)`;
    if (orb2) orb2.style.transform = `translate3d(${(-p * 200).toFixed(1)}px, ${(-p * 110).toFixed(1)}px, 0)`;
    // tabs follow the card on top; the active tab's line fills between cards
    setActive(Math.round(t));
    tabs.forEach((tb) => tb.style.setProperty('--p', '0'));
    const frac = t - Math.floor(t + 1e-6);
    if (tabs[Math.round(t)]) tabs[Math.round(t)].style.setProperty('--p', (Math.abs(t - Math.round(t)) < 1e-3 ? 1 : 1 - Math.abs(t - Math.round(t)) * 2).toFixed(3));
    void frac;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  const handlers = tabs.map((tb, i) => {
    const fn = () => {
      const y = top + (i / (n - 1)) * dist;
      if (window.unicoreScrollTo) window.unicoreScrollTo(y, { duration: 1.0 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    tb.addEventListener('click', fn);
    return [tb, fn];
  });
  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = clamp(active + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1);
    tabs[next].click(); tabs[next].focus();
  };
  const tabRow = scene.querySelector('[data-apps-tabs]');
  tabRow.addEventListener('keydown', onKey);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (ro) ro.observe(sticky);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
    window.removeEventListener('load', measure);
    if (ro) ro.disconnect();
    handlers.forEach(([tb, fn]) => tb.removeEventListener('click', fn));
    tabRow.removeEventListener('keydown', onKey);
    scene.style.height = '';
    cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; c.removeAttribute('inert'); });
    html.classList.remove('apps-pin');
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
