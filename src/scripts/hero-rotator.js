/*
 * Homepage hero: the word in the highlighted box and the picture beside it
 * change together, every few seconds, or when a visitor picks one of the pills
 * under the picture.
 *
 *   LUBRICANTS -> AUTOMOTIVE & INDUSTRIAL OIL -> COOLANTS -> SHOCKER & BRAKE
 *   FLUIDS -> HIGH TEMP. GREASE -> TYRE SEALANT LIQUID -> (back to the start)
 *
 * The first word is the one in the HTML, so a crawler (and anyone without
 * JavaScript) reads "High-performance lubricants for a smoother, longer life".
 *
 * The navy box is always the same size and every phrase sits on ONE line: the
 * type is sized once so the longest phrase just fits the box, so nothing
 * wraps, grows or shrinks as the words change. The rest of the headline sits
 * on its own lines, so it never reflows.
 *
 * Choosing a pill (or tapping it) jumps to that range and restarts the clock.
 * Pauses when the hero is off screen or the tab is hidden. Under
 * prefers-reduced-motion the words and picture do not auto-change, but the
 * pills still work.
 */
const HOLD = 3800; // ms each phrase stays
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
  const pills = [...document.querySelectorAll('[data-hero-pill]')];
  const capEl = document.querySelector('[data-hero-cap]');
  const idxEl = document.querySelector('[data-hero-index]');
  if (!h1 || !box || !first) return;

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

  // One size for all phrases: as large as the design wants (0.74 of the
  // headline), shrunk only as far as the longest phrase needs to fit one line.
  const measure = () => {
    const h1Size = parseFloat(getComputedStyle(h1).fontSize);
    const want = h1Size * 0.74;
    probe.style.fontSize = `${want}px`;
    let longest = 0;
    texts.forEach((t) => {
      probe.textContent = t.toUpperCase();
      longest = Math.max(longest, probe.getBoundingClientRect().width);
    });
    const padL = want * 0.4;
    const padR = want * 0.3;
    const avail = Math.max(120, h1.clientWidth - padL - padR);
    const k = Math.min(1, avail / longest);
    const fs = want * k;
    box.style.setProperty('--hl-fs', `${fs.toFixed(2)}px`);
    box.style.setProperty('--hl-w', `${Math.ceil(longest * k + (padL + padR) * k)}px`);
    box.style.setProperty('--hl-h', `${Math.ceil(fs * 1.5)}px`);
    box.classList.add('is-measured');
  };

  const reduce = off();
  let idx = 0;
  const show = (next, user) => {
    if (next === idx) return;
    const prev = idx;
    idx = next;
    els[prev].classList.remove('is-on');
    els[prev].classList.add('is-out');
    els[idx].classList.remove('is-out');
    els[idx].classList.add('is-on');
    const old = els[prev];
    setTimeout(() => old.classList.remove('is-out'), 800);
    pics.forEach((p, i) => p.classList.toggle('is-on', i === idx));
    pills.forEach((b, i) => { b.classList.toggle('is-on', i === idx); b.setAttribute('aria-pressed', String(i === idx)); });
    if (capEl) capEl.textContent = texts[idx];
    if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, '0');
    if (user) restart();
  };

  let running = false;
  let visible = true;
  const tick = () => show((idx + 1) % n);
  const start = () => {
    if (reduce || running || !visible || document.hidden) return;
    running = true;
    timer = window.setInterval(tick, HOLD);
  };
  const stop = () => { running = false; clearInterval(timer); };
  const restart = () => { stop(); start(); };

  const pillHandlers = pills.map((b, i) => {
    const fn = () => show(i, true);
    b.addEventListener('click', fn);
    return [b, fn];
  });

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
    pillHandlers.forEach(([b, fn]) => b.removeEventListener('click', fn));
    probe.remove();
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
