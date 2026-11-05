/*
 * Rotating hero accent phrase (homepage).
 *
 * The HTML ships exactly one phrase — "built tough" — inside the <h1>, so the
 * first paint, no-JS readers and crawlers all see the canonical sentence:
 *   "Oils and lubricants built tough for Indian roads, farms, and factories."
 * The alternates live in a data-phrases attribute and are injected here.
 *
 * No reflow during rotation: the phrases are stacked in a single inline-grid
 * cell, so the box is always as wide as the LONGEST phrase and the words after
 * it never move. The width is CSS max-content, not a measured pixel value, so
 * it stays correct through a webfont swap and at any viewport.
 *
 * Each phrase holds, then wipes out left-to-right and the next wipes in, with
 * clip-path — a replacement, not a typewriter.
 *
 * Pauses when the tab is hidden and when the hero leaves the viewport.
 * Under prefers-reduced-motion nothing is injected at all: "built tough" stays.
 *
 * To change the phrases, edit data-phrases on the <span> in src/pages/index.astro.
 */

const HOLD = 2500;    // ms a phrase stays put
const WIPE = 400;     // ms for each half of the swap

// The hero load sequence: H1 delay (80ms) + fade (500ms) + accent wipe
// (200ms offset + 600ms). Rotation starts once that has finished.
const START_DELAY = 1380;

// Matches the keyframes in motion.css. The negative insets give italic glyphs
// room to overhang so the wipe never shaves an ascender or a tail.
const SHOWN = 'inset(-0.35em -0.1em -0.35em -0.1em)';
const GONE_LEFT = 'inset(-0.35em -0.1em -0.35em 100%)';   // erased left to right
const GONE_RIGHT = 'inset(-0.35em 100% -0.35em -0.1em)';  // waiting, off to the left

let root = null;        // the .hero-accent span
let phrases = [];       // the phrase elements
let index = 0;
let timer = 0;
let token = 0;          // invalidates callbacks from a previous run
let io = null;
let inView = true;
let started = false;

function reduced() {
  return (
    document.documentElement.dataset.motion === 'off' ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );
}

function clear() {
  if (timer) clearTimeout(timer);
  timer = 0;
}

function running() {
  return inView && !document.hidden;
}

/** Hold the current phrase, then swap to the next one. */
function schedule(delay) {
  clear();
  const mine = token;
  timer = setTimeout(() => {
    if (mine !== token) return;
    if (!running()) return; // resume() will pick it up again
    swap(mine);
  }, delay);
}

function swap(mine) {
  const current = phrases[index];
  const next = phrases[(index + 1) % phrases.length];

  current.animate([{ clipPath: SHOWN }, { clipPath: GONE_LEFT }], {
    duration: WIPE,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    fill: 'forwards',
  }).finished.then(() => {
    if (mine !== token) return;
    index = (index + 1) % phrases.length;
    next.animate([{ clipPath: GONE_RIGHT }, { clipPath: SHOWN }], {
      duration: WIPE,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'forwards',
    }).finished.then(() => {
      if (mine !== token) return;
      schedule(HOLD);
    }).catch(() => {});
  }).catch(() => {});
}

function resume() {
  if (!started || !running()) return;
  schedule(HOLD);
}

function onVisibility() {
  if (document.hidden) clear();
  else resume();
}

export function initAccentRotator() {
  teardownAccentRotator();

  root = document.querySelector('.hero-accent[data-phrases]');
  if (!root) return;
  if (reduced()) return;         // leave "built tough" exactly as authored
  if (!('animate' in Element.prototype)) return;

  const extra = root.dataset.phrases.split('|').map((s) => s.trim()).filter(Boolean);
  if (!extra.length) return;

  // Wrap the authored text, then add the alternates into the same grid cell.
  // The authored node keeps its place in the accessibility tree, so a screen
  // reader always reads the canonical sentence rather than a changing one.
  const first = document.createElement('span');
  first.className = 'hero-phrase';
  first.textContent = root.textContent.trim();
  root.textContent = '';
  root.appendChild(first);

  phrases = [first];
  for (const text of extra) {
    const el = document.createElement('span');
    el.className = 'hero-phrase';
    el.textContent = text;
    el.setAttribute('aria-hidden', 'true');
    el.style.clipPath = GONE_RIGHT; // parked off to the left
    root.appendChild(el);
    phrases.push(el);
  }

  // is-rotating turns the span into the inline-grid that reserves the width.
  root.classList.add('is-rotating');
  index = 0;
  started = true;
  token++;

  const hero = root.closest('section') || root.closest('main');
  if (hero && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) resume();
        else clear();
      },
      { threshold: 0 }
    );
    io.observe(hero);
  }
  document.addEventListener('visibilitychange', onVisibility);

  schedule(START_DELAY);
}

export function teardownAccentRotator() {
  token++;
  clear();
  started = false;
  inView = true;
  if (io) io.disconnect();
  io = null;
  document.removeEventListener('visibilitychange', onVisibility);
  phrases = [];
  root = null;
}

document.addEventListener('astro:page-load', initAccentRotator);
document.addEventListener('astro:before-swap', teardownAccentRotator);
