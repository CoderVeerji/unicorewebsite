/*
 * Product carousel behaviour (homepage). The track is a native scroll-snap
 * scroller; this adds prev/next, mouse drag, the progress bar, the staggered
 * entrance and a small parallax on each card's drawing. Everything degrades
 * to a plain swipeable row if it does not run.
 */
let cleanup = [];

function reduced() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

/*
 * Pinned, scroll-driven mode (homepage). The section is made as tall as the
 * sideways distance the cards must travel, its content sticks under the header,
 * and scrolling DOWN slides the cards LEFT. Cards near the middle of the row are
 * full size; those towards the edges tilt and dim slightly, for depth.
 * Returns false (falling back to the plain swipeable row) if it cannot run.
 */
function setupPinned(root, section, track, cards, prev, next) {
  const sticky = section.querySelector('.ps-sticky');
  if (!sticky || cards.length < 2) return false;
  const html = document.documentElement;
  html.classList.add('pin-on');
  let dist = 0, top = 0, vw = 0, ticking = false;
  const n = cards.length;
  const bar = root.querySelector('[data-carousel-bar]');
  const hdr = () => parseFloat(getComputedStyle(sticky).top) || 116;

  const measure = () => {
    section.style.height = '';
    const stickyH = sticky.offsetHeight;
    vw = root.clientWidth;
    dist = Math.max(0, track.scrollWidth - vw);
    section.style.height = `${stickyH + dist}px`;
    top = section.getBoundingClientRect().top + window.scrollY - hdr();
    update();
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY - top;
    const p = dist > 0 ? Math.min(1, Math.max(0, y / dist)) : 0;
    const tx = -p * dist;
    // Inline transforms, not custom properties: a changed custom property
    // re-resolves styles for the whole subtree on every scroll frame.
    track.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
    const mid = vw / 2;
    cards.forEach((c) => {
      const w = c.offsetWidth;
      const centre = c.offsetLeft + tx + w / 2;
      const d = Math.max(-1.2, Math.min(1.2, (centre - mid) / (vw * 0.62)));
      const a = Math.min(1, Math.abs(d));
      c.style.transform = `perspective(1200px) scale(${(1 - 0.07 * a).toFixed(3)}) rotateY(${(-d * 9).toFixed(2)}deg)`;
      c.style.opacity = (1 - 0.5 * a * a).toFixed(3);
    });
    const visible = vw / track.scrollWidth;
    if (bar) bar.style.transform = `scaleX(${(visible + p * (1 - visible)).toFixed(4)})`;
    if (prev) prev.disabled = p <= 0.005;
    if (next) next.disabled = p >= 0.995;
    root.dataset.index = String(Math.round(p * (n - 1)) + 1);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  const goTo = (i) => {
    const target = top + (Math.min(n - 1, Math.max(0, i)) / (n - 1)) * dist;
    if (window.unicoreScrollTo) window.unicoreScrollTo(target, { duration: 0.9 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  };
  const cur = () => (dist > 0 ? Math.round(Math.min(1, Math.max(0, (window.scrollY - top) / dist)) * (n - 1)) : 0);
  const onPrev = () => goTo(cur() - 1);
  const onNext = () => goTo(cur() + 1);
  if (prev) prev.addEventListener('click', onPrev);
  if (next) next.addEventListener('click', onNext);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (ro) ro.observe(sticky);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();

  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
    window.removeEventListener('load', measure);
    if (ro) ro.disconnect();
    if (prev) prev.removeEventListener('click', onPrev);
    if (next) next.removeEventListener('click', onNext);
    section.style.height = '';
    track.style.transform = '';
    cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });
    if (bar) bar.style.transform = '';
    html.classList.remove('pin-on');
  });
  return true;
}

function init() {
  teardown();
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('[data-carousel-track]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (!track) return;
    const cards = [...track.children];
    const section = root.closest('[data-pin]');
    if (section && !reduced() && setupPinned(root, section, track, cards, prev, next)) return;
    const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth * 0.8);

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 1;
      const visible = max > 0 ? track.clientWidth / track.scrollWidth : 1;
      root.style.setProperty('--pc-progress', String(visible + p * (1 - visible)));
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (!reduced()) {
        const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const off = (r.left + r.width / 2 - mid) / track.clientWidth;
          c.style.setProperty('--px', `${Math.max(-1, Math.min(1, off)) * -18}px`);
        });
      }
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });
    const onPrev = () => go(-1);
    const onNext = () => go(1);
    if (prev) prev.addEventListener('click', onPrev);
    if (next) next.addEventListener('click', onNext);

    // Mouse drag (touch and trackpad already scroll natively).
    let down = false, startX = 0, startLeft = 0, moved = false;
    const md = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    };
    const mm = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    };
    const mu = () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('is-dragging');
        const i = Math.round(track.scrollLeft / step());
        track.scrollTo({ left: i * step(), behavior: 'smooth' });
      }
    };
    track.addEventListener('pointerdown', md);
    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', mu);

    // Entrance
    let io = null;
    if (!reduced() && 'IntersectionObserver' in window) {
      root.classList.add('is-armed');
      io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { root.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(root);
    }

    update();
    cleanup.push(() => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', mu);
      if (io) io.disconnect();
    });
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
