/*
 * Custom cursor — desktop only, decorative.
 *
 *   ring  24px circle, 1px logo-blue border at low opacity, follows with a lag
 *   dot   4px solid logo-blue, tracks the pointer exactly
 *
 * Over links, buttons, product cards and the mobile-menu toggle the ring grows
 * to 40px and its border goes solid. Over text inputs and textareas both hide
 * so the native caret is visible.
 *
 * It initialises ONLY on a device with a fine pointer and real hover, and never
 * under prefers-reduced-motion or <html data-motion="off">. The native cursor is
 * hidden only once this script is actually running (the `cursor-active` class),
 * so a touch device, a failed script or a torn-down page always keeps the real
 * cursor — nothing is ever left uncursored.
 *
 * Driven by requestAnimationFrame, transforms only. See src/styles/cursor.css.
 */

const RING = 24;          // px, resting diameter
const RING_HOT = 40;      // px, diameter over an interactive target
const EASE = 0.18;        // ring follow (0 = frozen, 1 = no lag)
const SCALE_EASE = 0.2;   // how fast the ring resizes

const HOT = 'a, button, [role="button"], .m-card, #mobile-nav-toggle, summary';
const TEXT = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

let ring = null;
let dot = null;
let raf = 0;
let bound = false;
let mx = 0, my = 0;       // pointer
let rx = 0, ry = 0;       // ring, lagging
let scale = 1, targetScale = 1;
let seen = false;         // has the pointer moved yet

function supported() {
  const root = document.documentElement;
  if (root.dataset.motion === 'off') return false;
  if (!window.matchMedia) return false;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function onMove(e) {
  mx = e.clientX;
  my = e.clientY;
  if (!seen) {
    // Land the ring on the pointer instead of flying in from 0,0.
    seen = true;
    rx = mx;
    ry = my;
    document.documentElement.classList.add('cursor-visible');
  }
  const t = e.target;
  const overText = t instanceof Element && t.closest(TEXT);
  const overHot = !overText && t instanceof Element && t.closest(HOT);
  ring.classList.toggle('is-hot', !!overHot);
  ring.classList.toggle('is-hidden', !!overText);
  dot.classList.toggle('is-hidden', !!overText);
  targetScale = overHot ? RING_HOT / RING : 1;
}

function onLeave() {
  document.documentElement.classList.remove('cursor-visible');
  seen = false;
}

function onEnter() {
  if (seen) document.documentElement.classList.add('cursor-visible');
}

function frame() {
  rx += (mx - rx) * EASE;
  ry += (my - ry) * EASE;
  scale += (targetScale - scale) * SCALE_EASE;
  ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale.toFixed(3)})`;
  dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  raf = requestAnimationFrame(frame);
}

export function initCursor() {
  teardownCursor();
  if (!supported()) return;

  ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);

  document.documentElement.classList.add('cursor-active');
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  document.addEventListener('pointerenter', onEnter);
  window.addEventListener('blur', onLeave);
  bound = true;
  raf = requestAnimationFrame(frame);
}

export function teardownCursor() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (bound) {
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('pointerenter', onEnter);
    window.removeEventListener('blur', onLeave);
    bound = false;
  }
  ring?.remove();
  dot?.remove();
  ring = dot = null;
  seen = false;
  scale = targetScale = 1;
  // Give the native cursor back before anything else happens.
  document.documentElement.classList.remove('cursor-active', 'cursor-visible');
}

// The body is replaced on every view transition, so rebuild each time.
document.addEventListener('astro:page-load', initCursor);
document.addEventListener('astro:before-swap', teardownCursor);
window.addEventListener('pagehide', teardownCursor);
