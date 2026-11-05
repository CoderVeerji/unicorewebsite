/*
 * Motion system (JS half). Vanilla JS + IntersectionObserver + Web Animations.
 * No animation library. Animates opacity and transform only.
 *
 * What it does
 *   - Scroll reveal: blocks and cards fade in and rise (16px, 8px under 768px)
 *     over 500ms, once, when ~15% visible. Cards revealed together stagger by
 *     60ms each, capped at 300ms in total.
 *   - Marks card-grid children with .m-card so CSS can do the 150ms hover.
 *   (The hero sequence and page crossfade are pure CSS, see motion.css.)
 *
 * Never animated: header, footer, drawer, sticky rails/asides, anything inside
 * a <form>, anything marked [data-no-motion] (the tyre sealant dosage table),
 * the hero (handled in CSS) and anything above the hero (breadcrumb).
 *
 * Off switches: prefers-reduced-motion: reduce, or <html data-motion="off">.
 */

const DURATION = 500;       // ms
const STAGGER = 60;         // ms between siblings revealed in the same pass
const STAGGER_CAP = 300;    // ms: max total stagger offset
const THRESHOLD = 0.15;     // fraction visible before a block reveals

const EXCLUDE = 'header, footer, aside, form, .sticky, #mobile-menu-drawer, [data-no-motion]';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT']);

let observer = null;

function motionDisabled() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'off'
  );
}

/** A grid of 2-4 equal columns whose children are block cards. */
function isCardGrid(el) {
  if (!el.classList.contains('grid')) return false;
  const cols = [...el.classList]
    .map((c) => c.match(/grid-cols-(\d+)$/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  if (!cols.some((n) => n >= 2 && n <= 4)) return false;
  const kids = [...el.children].filter((k) => !k.matches(EXCLUDE));
  return kids.length >= 2 && kids.every((k) => ['DIV', 'ARTICLE', 'LI', 'A'].includes(k.tagName));
}

function hasCardGrid(el) {
  if (isCardGrid(el)) return true;
  return [...el.querySelectorAll('.grid')].some((g) => !g.closest(EXCLUDE) && isCardGrid(g));
}

function isCardLike(el) {
  return ['bg-white', 'bg-page-bg', 'bg-product-frame', 'border'].some((c) => el.classList.contains(c));
}

function findHero(main) {
  const h1 = main.querySelector('h1');
  return h1 ? h1.closest('section') || h1.parentElement : null;
}

/** Split <main> into reveal units: cards of each card grid, and leaf blocks. */
function collectUnits(el, hero, units, cards) {
  for (const child of el.children) {
    if (SKIP_TAGS.has(child.tagName) || child.matches(EXCLUDE)) continue;
    if (child === hero) continue;
    if (child.contains(hero)) { collectUnits(child, hero, units, cards); continue; }
    // Everything above the hero (breadcrumb bar) stays still.
    if (hero && hero.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_PRECEDING) continue;

    if (isCardGrid(child)) {
      for (const card of child.children) {
        if (card.matches(EXCLUDE)) continue;
        units.push(card);
        if (isCardLike(card)) cards.push(card);
      }
      continue;
    }
    if (hasCardGrid(child) || child.querySelector(EXCLUDE)) {
      collectUnits(child, hero, units, cards);
      continue;
    }
    units.push(child);
  }
}

function revealDistance() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--m-y'));
  return Number.isFinite(v) ? v : 16;
}

// Section-heading details, animated with the block they sit in.
//   marker  the small brand-blue square before an eyebrow label, scaled up
//   numeral the large Instrument Serif index number ("01".."06") at the start
//           of a section on Applications, About, Dealership and Products
// Both are matched on the authored Tailwind classes, so no page markup changed.
const MARKER_SEL =
  'span[class~="bg-logo-blue"][class~="w-2"], span[class~="bg-logo-blue"][class~="w-1.5"]';
const NUMERAL_SEL = '[class~="font-serif"][class~="text-logo-blue"]';

function revealDetails(el, delay) {
  el.querySelectorAll(MARKER_SEL).forEach((marker, i) => {
    marker.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: 300,
      delay: delay + 60 + i * 40,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'backwards',
    });
  });
  el.querySelectorAll(NUMERAL_SEL).forEach((numeral) => {
    // Only a bare index numeral, never a numeral that carries a label
    // (the homepage's "01 / Mobility" cards are left alone).
    if (!/^\d{1,2}$/.test(numeral.textContent.trim())) return;
    numeral.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 500,
      delay: delay + 120,
      easing: 'ease-out',
      fill: 'backwards',
    });
  });
}

function reveal(el, delay) {
  el.classList.remove('m-pending');
  el.animate(
    [
      { opacity: 0, transform: `translate3d(0, ${revealDistance()}px, 0)` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: DURATION, delay, easing: 'ease-out', fill: 'backwards' }
  );
  revealDetails(el, delay);
}

function onIntersect(entries) {
  const vh = window.innerHeight;
  const ready = entries
    .filter(
      (e) =>
        e.isIntersecting &&
        // very tall blocks can never reach 15% of their own area: accept 15% of the viewport instead
        (e.intersectionRatio >= THRESHOLD || e.intersectionRect.height >= vh * THRESHOLD)
    )
    .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  ready.forEach((entry, i) => {
    reveal(entry.target, Math.min(i * STAGGER, STAGGER_CAP));
    observer.unobserve(entry.target);
  });
}

function init() {
  const main = document.querySelector('main');
  if (!main) return;

  const hero = findHero(main);
  const units = [];
  const cards = [];
  collectUnits(main, hero, units, cards);

  // Hover treatment is pure CSS (.m-card); it needs the class even when motion is off.
  cards.forEach((c) => c.classList.add('m-card'));

  if (motionDisabled() || !('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;

  observer = new IntersectionObserver(onIntersect, { threshold: [0, THRESHOLD] });
  units.forEach((u) => {
    u.classList.add('m-pending');
    observer.observe(u);
  });
}

function teardown() {
  if (observer) observer.disconnect();
  observer = null;
}

// astro:page-load fires on first load and after every view-transition navigation.
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
