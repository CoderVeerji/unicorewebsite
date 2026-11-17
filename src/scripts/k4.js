/*
 * KICK-4T bike engine oil scene (homepage). See src/styles/k4.css.
 *
 * Pinned scroll: the section is made tall and its content sticks under the
 * header. Progress p (0..1) through that height drives
 *   - the intro title ("Our bike engine oil segment") fading away, p < 0.14
 *   - the bike riding left to right along the road, and the road marks moving
 *   - which pack is shown: 20W40, 20W50, 10W30, 15W50 (a quarter each)
 * A grade button scrolls to that grade's part of the ride. Moving the pointer
 * over the pack tilts it a little.
 *
 * Without pinning (reduced motion, or JS off) the banner just shows and the
 * grade buttons switch the pack directly. Writes only transform and opacity.
 */
const INTRO = 0.14;      // share of the scroll used by the intro title
let cleanup = [];

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);

function init() {
  teardown();
  const root = document.querySelector('[data-k4]');
  if (!root) return;
  const sticky = root.querySelector('.k4-sticky');
  const bottles = [...root.querySelectorAll('.k4-bottle')];
  const grades = [...root.querySelectorAll('[data-k4-grade]')];
  const capEl = root.querySelector('[data-k4-cap]');
  const idxEl = root.querySelector('[data-k4-index]');
  const intro = root.querySelector('.k4-intro');
  const rider = root.querySelector('[data-k4-rider]');
  const dash = root.querySelector('[data-k4-dash]');
  const visual = root.querySelector('[data-k4-visual]');
  const stack = root.querySelector('.k4-bottles');
  const road = root.querySelector('.k4-road');
  const flip = root.querySelector('[data-k4-flip]');
  const burst = root.querySelector('[data-k4-burst]');
  const wheels = [...root.querySelectorAll('[data-k4-wheel]')];
  if (!sticky || !bottles.length) return;
  const n = bottles.length;
  const names = grades.map((g) => g.textContent.trim());

  let cur = 0;
  const setGrade = (i) => {
    if (i === cur) return;
    const prev = bottles[cur];
    prev.classList.remove('is-on');
    prev.classList.add('is-out');
    setTimeout(() => prev.classList.remove('is-out'), 700);
    cur = i;
    bottles[cur].classList.remove('is-out');
    bottles[cur].classList.add('is-on');
    grades.forEach((g, k) => { g.classList.toggle('is-on', k === cur); g.setAttribute('aria-pressed', String(k === cur)); });
    if (burst && !off()) { burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go'); }
    if (capEl) capEl.textContent = `KICK-4T ${names[cur]}`;
    if (idxEl) idxEl.textContent = String(cur + 1).padStart(2, '0');
  };

  // Pointer tilt on the pack (a light touch of depth).
  const onMove = (e) => {
    if (!stack || e.pointerType === 'touch') return;
    const r = visual.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    stack.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
    stack.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
  };
  const onLeave = () => { if (stack) { stack.style.setProperty('--ry', '0deg'); stack.style.setProperty('--rx', '0deg'); } };
  if (visual) { visual.addEventListener('pointermove', onMove); visual.addEventListener('pointerleave', onLeave); }

  const pinned = !off();
  const handlers = [];

  if (!pinned) {
    // Static banner: buttons switch the pack directly; the bike sits mid-road.
    grades.forEach((g, i) => { const fn = () => setGrade(i); g.addEventListener('click', fn); handlers.push([g, fn]); });
    if (rider) rider.style.transform = `translate3d(${Math.round((road.clientWidth || 800) * 0.55)}px, 0, 0)`;
    cleanup.push(() => {
      handlers.forEach(([g, fn]) => g.removeEventListener('click', fn));
      if (visual) { visual.removeEventListener('pointermove', onMove); visual.removeEventListener('pointerleave', onLeave); }
    });
    return;
  }

  const html = document.documentElement;
  html.classList.add('k4-pin');
  let top = 0, dist = 0, ticking = false, lastY = window.scrollY, dir = 1;
  const hdr = () => { const h = document.querySelector('header.fixed'); return Math.max(h ? h.getBoundingClientRect().bottom : 0, 116); };

  const measure = () => {
    root.style.height = '';
    const stickyH = sticky.offsetHeight;
    dist = Math.round(window.innerHeight * 3.4);
    root.style.height = `${stickyH + dist}px`;
    top = root.getBoundingClientRect().top + window.scrollY - hdr();
    update();
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 1) { dir = y > lastY ? 1 : -1; lastY = y; if (flip) flip.style.setProperty('--dir', String(dir)); }
    const p = clamp((y - top) / dist, 0, 1);
    // intro title
    if (intro) {
      const t = ease(clamp((p - 0.05) / (INTRO - 0.05 + 0.04), 0, 1));
      intro.style.opacity = String(1 - t);
      intro.style.transform = `translate3d(0, ${(-t * 40).toFixed(1)}px, 0)`;
      intro.style.visibility = t >= 1 ? 'hidden' : 'visible';
    }
    // the ride
    const rp = clamp((p - 0.06) / 0.94, 0, 1);
    const roadW = road.clientWidth;
    const bw = rider.offsetWidth;
    const x = -bw * 0.3 + rp * (roadW + bw * 0.3 - bw * 0.15);
    const bob = Math.sin(rp * 70) * 1.6;
    rider.style.transform = `translate3d(${x.toFixed(1)}px, ${bob.toFixed(1)}px, 0)`;
    const spin = (rp * 2600 / 2) % 360;
    wheels.forEach((w) => w.setAttribute('transform', `rotate(${spin.toFixed(1)})`));
    if (dash) dash.style.transform = `translate3d(${(-(rp * 2600) % 140).toFixed(1)}px, 0, 0)`;
    // the pack
    const gp = clamp((p - INTRO) / (1 - INTRO), 0, 0.9999);
    setGrade(Math.floor(gp * n));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  grades.forEach((g, i) => {
    const fn = () => {
      const p = INTRO + ((i + 0.5) / n) * (1 - INTRO);
      const y = top + p * dist;
      if (window.unicoreScrollTo) window.unicoreScrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    g.addEventListener('click', fn);
    handlers.push([g, fn]);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (ro) ro.observe(sticky);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
    window.removeEventListener('load', measure);
    if (ro) ro.disconnect();
    handlers.forEach(([g, fn]) => g.removeEventListener('click', fn));
    if (visual) { visual.removeEventListener('pointermove', onMove); visual.removeEventListener('pointerleave', onLeave); }
    root.style.height = '';
    html.classList.remove('k4-pin');
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
