/*
 * Homepage scenes: reveal each screen as it arrives, and run the dot rail.
 * See src/styles/scenes.css. Does nothing on a page with no .scene, and nothing
 * at all under prefers-reduced-motion or data-motion="off".
 */
let cleanup = [];

function off() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

// What to reveal inside the scenes that were authored without data-r markers.
const AUTO = 'h2, h2 ~ p, h2 ~ div, span.uppercase, .space-y-4, .divide-y > *, .grid > *, a.inline-flex, a.bg-white, .lg\\:col-span-5';

function tag(scene) {
  if (scene.matches('.scene-home, .scene-products, .scene-tyre, .scene-4t, .scene-apps')) return;
  let i = 0;
  scene.querySelectorAll(AUTO).forEach((el) => {
    if (el.hasAttribute('data-r') || el.closest('[data-r], [data-apps]')) return;
    el.setAttribute('data-r', 'up');
    el.style.setProperty('--d', `${Math.min(i, 8) * 90}ms`);
    i++;
  });
}

function init() {
  teardown();
  const scenes = [...document.querySelectorAll('.scene')];
  if (!scenes.length || off() || !('IntersectionObserver' in window)) return;

  const html = document.documentElement;
  html.classList.add('has-scenes');
  scenes.forEach(tag);

  // Reveal
  const reveal = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); } }),
    { threshold: 0.22 }
  );
  scenes.forEach((s) => {
    if (s.matches('.scene-home')) s.classList.add('is-in'); else reveal.observe(s);
  });

  // Far-away scenes drop their heavy layers (see .is-away in scenes.css).
  const away = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-away', !e.isIntersecting)),
    { rootMargin: '120% 0px 120% 0px' }
  );
  scenes.forEach((s) => away.observe(s));

  // Dot rail
  const rail = document.querySelector('[data-scene-dots]');
  const dots = [];
  if (rail) {
    scenes.forEach((s, i) => {
      const label = s.dataset.scene || `Section ${i + 1}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'scene-dot';
      b.setAttribute('aria-label', label);
      b.innerHTML = `<span class="scene-dot-label">${label}</span>`;
      b.addEventListener('click', () => {
        const hh = document.querySelector('header.fixed');
        const off = Math.max(hh ? hh.getBoundingClientRect().bottom : 0, parseFloat(getComputedStyle(html).getPropertyValue('--hdr')) || 116);
        const y = s.getBoundingClientRect().top + window.scrollY - off - 4;
        window.unicoreScrollTo ? window.unicoreScrollTo(i === 0 ? 0 : y) : window.scrollTo({ top: i === 0 ? 0 : y, behavior: 'smooth' });
      });
      rail.appendChild(b);
      dots.push(b);
    });
  }
  let activeIdx = -1;
  const setActive = (idx) => {
    if (idx === activeIdx) return;
    activeIdx = idx;
    dots.forEach((d, i) => (i === idx ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    if (rail) rail.classList.toggle('on-dark', scenes[idx] && scenes[idx].matches('.scene-dealer'));
  };
  // The active scene is the one crossing the middle of the viewport.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const mid = window.innerHeight * 0.45;
      let best = 0;
      scenes.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= mid) best = i; });
      setActive(best);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    reveal.disconnect();
    away.disconnect();
    scenes.forEach((s) => s.classList.remove('is-away'));
    if (rail) rail.innerHTML = '';
    html.classList.remove('has-scenes');
  });
}

function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
