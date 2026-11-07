/*
 * Applications showcase (homepage). See src/styles/apps.css.
 *
 *   - changes by itself every few seconds; the active tab fills like a timer
 *   - a tab, a swipe or drag, the Left/Right arrow keys, or a click on a
 *     neighbouring card picks one directly (and restarts the timer)
 *   - keeps going while the pointer rests on it or a tab has focus (it used to
 *     stop dead after a click, which looked broken); pauses only while a card is
 *     being dragged, off screen, or while the browser tab is hidden
 *   - under prefers-reduced-motion it never changes by itself
 *
 * The cards are laid out in one row; the active one is centred by translating
 * the track, so only transform moves.
 */
const HOLD = 5000; // ms per card
let cleanup = [];

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

function init() {
  teardown();
  document.querySelectorAll('[data-apps]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[data-apps-tab]')];
    const cards = [...root.querySelectorAll('[data-apps-card]')];
    const track = root.querySelector('[data-apps-track]');
    const viewport = root.querySelector('[data-apps-viewport]');
    const dots = [...root.querySelectorAll('.apps-dot')];
    if (!tabs.length || !track || cards.length < 2) return;

    const n = cards.length;
    const reduce = off();
    let i = 0;
    let hold = false;     // pointer or focus inside
    let visible = true;
    let timer = 0;
    let raf = 0;
    let t0 = 0;
    let elapsed = 0;
    let dragging = false;

    // ---- layout: centre the active card -----------------------------------
    let slideW = 0;
    let gap = 22;
    const layout = () => {
      const vw = viewport.clientWidth;
      slideW = Math.min(1080, vw * (vw < 760 ? 0.88 : 0.86));
      gap = parseFloat(getComputedStyle(track).columnGap) || 22;
      root.style.setProperty('--aw', `${slideW}px`);
      place();
    };
    const place = (dx = 0) => {
      const vw = viewport.clientWidth;
      const x = (vw - slideW) / 2 - i * (slideW + gap) + dx;
      track.style.setProperty('--atx', `${x.toFixed(1)}px`);
    };

    // ---- selection -----------------------------------------------------------
    const select = (next, user) => {
      i = (next + n) % n;
      cards.forEach((c, k) => {
        c.classList.toggle('is-active', k === i);
        if (k === i) c.removeAttribute('inert'); else c.setAttribute('inert', '');
      });
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      // Keep the chosen tab in view on a narrow screen without moving the page.
      const strip = tabs[i].parentElement;
      const tr = tabs[i].getBoundingClientRect();
      const sr = strip.getBoundingClientRect();
      if (tr.left < sr.left || tr.right > sr.right) strip.scrollTo({ left: tabs[i].offsetLeft - (strip.clientWidth - tabs[i].offsetWidth) / 2, behavior: 'smooth' });
      place();
      elapsed = 0;
      t0 = performance.now();
      if (user) schedule();
    };

    // ---- timer (also drives the fill on the active tab) ----------------------------
    const bar = () => tabs[i];
    const loop = (now) => {
      raf = 0;
      if (hold || !visible || document.hidden || dragging) { t0 = now - elapsed; schedule(); return; }
      elapsed = now - t0;
      const p = Math.min(1, elapsed / HOLD);
      bar().style.setProperty('--p', p.toFixed(4));
      if (p >= 1) { select(i + 1); tabs.forEach((t) => t.style.setProperty('--p', '0')); }
      raf = requestAnimationFrame(loop);
    };
    function schedule() {
      if (reduce || raf) return;
      t0 = performance.now() - elapsed;
      raf = requestAnimationFrame(loop);
    }
    const reset = () => { elapsed = 0; tabs.forEach((t) => t.style.setProperty('--p', '0')); };

    // ---- input -----------------------------------------------------------------------------
    const tabHandlers = tabs.map((t, k) => {
      const fn = () => { reset(); select(k, true); };
      t.addEventListener('click', fn);
      return [t, fn];
    });
    const onKey = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : n - 1;
      reset(); select(next, true); tabs[i].focus();
    };
    root.querySelector('[data-apps-tabs]').addEventListener('keydown', onKey);

    // Swipe / drag on the cards, and a click on a neighbour to bring it forward.
    let sx = 0, sy = 0, moved = 0, id = null, startI = 0;
    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; moved = 0; id = e.pointerId; startI = i;
    };
    const move = (e) => {
      if (id === null || e.pointerId !== id) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        track.classList.add('is-dragging');
        try { track.setPointerCapture(id); } catch (err) { /* not capturable */ }
      }
      moved = dx;
      place(dx);
    };
    const up = (e) => {
      if (id === null || e.pointerId !== id) return;
      id = null;
      if (dragging) {
        dragging = false;
        track.classList.remove('is-dragging');
        const t = slideW * 0.18;
        reset();
        select(moved < -t ? startI + 1 : moved > t ? startI - 1 : startI, true);
        return;
      }
      // A plain click on a card that is not the active one selects it.
      const x = e.clientX;
      const hit = cards.findIndex((c) => { const r = c.getBoundingClientRect(); return x >= r.left && x <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
      if (hit > -1 && hit !== i) { reset(); select(hit, true); }
    };
    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    // A drag must not also follow the link under the pointer.
    const noClick = (e) => { if (Math.abs(moved) > 8) { e.preventDefault(); e.stopPropagation(); moved = 0; } };
    track.addEventListener('click', noClick, true);

    // ---- pause rules: only a drag, being off screen, or a hidden tab ----------------
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) schedule(); }, { threshold: 0.25 })
      : null;
    if (io) io.observe(root);
    const onVis = () => { if (!document.hidden) schedule(); };
    document.addEventListener('visibilitychange', onVis);

    window.addEventListener('resize', layout);
    cards.forEach((c, k) => { if (k !== 0) c.setAttribute('inert', ''); });
    // Lay out without the slide animation, then switch it on.
    track.classList.add('is-dragging');
    layout();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-dragging')));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    schedule();

    cleanup.push(() => {
      cancelAnimationFrame(raf);
      tabHandlers.forEach(([t, fn]) => t.removeEventListener('click', fn));
      track.removeEventListener('pointerdown', down);
      track.removeEventListener('pointermove', move);
      track.removeEventListener('pointerup', up);
      track.removeEventListener('pointercancel', up);
      track.removeEventListener('click', noClick, true);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', layout);
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
