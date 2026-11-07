/*
 * Homepage hero: the word in the highlighted box and the picture beside it
 * change together, every few seconds.
 *
 *   LUBRICANTS -> AUTOMOTIVE & INDUSTRIAL OIL -> COOLANTS -> SHOCKER & BRAKE
 *   FLUIDS -> HIGH TEMP. GREASE -> TYRE SEALANT LIQUID -> (back to the start)
 *
 * The first word is the one in the HTML, so a crawler (and anyone without
 * JavaScript) reads "High-performance lubricants for a smoother, longer life".
 * The box is measured for every phrase up front, so it slides to the width
 * of the next word and its height never changes (no page jump). The rest of
 * the headline sits on its own lines, so it never reflows.
 *
 * Pauses when the hero is off screen or the tab is hidden. Under
 * prefers-reduced-motion it does nothing: the first word and picture stay.
 */
const HOLD = 3600; // ms each phrase stays
let timer = 0;
let cleanup = [];

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

function init() {
  teardown();
  const h1 = document.querySelector('[data-hero-rotator]');
  const box = h1 && h1.querySelector('[data-hl-box]');
  const first = box && box.querySelector('.hl-first');
  const pics = [...document.querySelectorAll('[data-hero-visual] .hero-slide')];
  if (!h1 || !box || !first || off()) return;

  let extra = [];
  try { extra = JSON.parse(h1.dataset.phrases || '[]'); } catch (e) { extra = []; }
  if (!extra.length) return;

  first.classList.add('hl-phrase', 'is-on');
  const els = [first];
  extra.forEach((text) => {
    const s = document.createElement('span');
    s.className = 'hl-phrase';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = text;
    box.appendChild(s);
    els.push(s);
  });
  const n = els.length;
  const texts = [first.textContent.trim(), ...extra];

  const probe = document.createElement('span');
  probe.className = 'hl-probe';
  probe.setAttribute('aria-hidden', 'true');
  h1.appendChild(probe);

  let sizes = [];
  const measure = () => {
    const cs = getComputedStyle(box);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const maxInner = Math.max(120, h1.clientWidth - padX);
    probe.style.maxWidth = `${maxInner}px`;
    sizes = texts.map((t) => {
      probe.textContent = t;
      const r = probe.getBoundingClientRect();
      return { w: Math.ceil(r.width) + padX + 1, h: Math.ceil(r.height) + padY };
    });
    const hMax = Math.max(...sizes.map((s) => s.h));
    box.style.setProperty('--hl-h', `${hMax}px`);
    box.style.setProperty('--hl-w', `${sizes[idx].w}px`);
    box.classList.add('is-measured');
  };

  let idx = 0;
  const show = (next) => {
    const prev = idx;
    idx = next;
    box.style.setProperty('--hl-w', `${sizes[idx].w}px`);
    els[prev].classList.remove('is-on');
    els[prev].classList.add('is-out');
    els[idx].classList.remove('is-out');
    els[idx].classList.add('is-on');
    const old = els[prev];
    setTimeout(() => old.classList.remove('is-out'), 800);
    pics.forEach((p, i) => p.classList.toggle('is-on', i === idx));
  };

  let running = false;
  let visible = true;
  const tick = () => { show((idx + 1) % n); };
  const start = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    timer = window.setInterval(tick, HOLD);
  };
  const stop = () => { running = false; clearInterval(timer); };

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.15 })
    : null;
  if (io) io.observe(h1);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  let rz = 0;
  const onResize = () => { clearTimeout(rz); rz = setTimeout(measure, 150); };
  window.addEventListener('resize', onResize);

  const go = () => { measure(); start(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();

  cleanup.push(() => {
    stop();
    if (io) io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onResize);
    probe.remove();
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
