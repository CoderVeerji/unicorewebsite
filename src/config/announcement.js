/* ════════════════════════════════════════════════════════════════════════
 *  ANNOUNCEMENT STRIP — EDIT HERE
 *
 *  These three constants are the only things you need to change to move,
 *  extend, retire or reuse the strip that sits above the navy utility bar.
 *
 *  Diwali (Lakshmi Puja) 2026 falls on 8 November 2026 — confirm the date
 *  before reusing this for another year. The window runs from three days
 *  before Diwali to a week after it, so the greeting survives the launch
 *  week instead of vanishing on the next rebuild. Times are IST
 *  (+05:30), written explicitly so the result does not depend on the clock
 *  of whichever machine builds the site.
 *
 *  Change STORAGE_KEY whenever you change the copy or the occasion, so that
 *  someone who dismissed the previous strip still sees the new one.
 *
 *  The copy itself lives in src/components/AnnouncementStrip.astro.
 * ──────────────────────────────────────────────────────────────────────── */
export const WINDOW_START = '2026-11-05T00:00:00+05:30';
export const WINDOW_END   = '2026-11-16T23:59:59+05:30';
export const STORAGE_KEY  = 'unicore:strip:diwali-2026';
/* Lakshmi Puja itself — the strip counts down to this moment. Midnight IST at
   the start of 8 November 2026. */
export const OCCASION_AT  = '2026-11-08T00:00:00+05:30';
export const OCCASION     = 'Diwali';
/* ════════════════════════════════════════════════════════════════════════ */

/**
 * Whether the strip should be rendered at all.
 *
 * NOTE: this is a static site, so it is evaluated at BUILD time, not per
 * request. The strip appears and disappears only when the site is rebuilt —
 * schedule a rebuild (or a deploy) inside the window, and one after it.
 * Outside the window nothing is emitted into the HTML; it is not hidden
 * with CSS.
 */
export function isAnnouncementActive(now = Date.now()) {
  return now >= Date.parse(WINDOW_START) && now <= Date.parse(WINDOW_END);
}

/**
 * The countdown line in the strip: "Diwali in 3 days" before the day,
 * "Happy Diwali" on the day and after.
 *
 * Used twice — once at build time so the strip reads correctly with no
 * JavaScript, and again on load so an open tab or a cached page is not stale.
 * Keep it dependency-free: the browser copy in AnnouncementStrip.astro is the
 * same logic, written out inline.
 */
export function countdownLabel(now = Date.now()) {
  const days = Math.ceil((Date.parse(OCCASION_AT) - now) / 86400000);
  if (days <= 0) return `Happy ${OCCASION}`;
  if (days === 1) return `${OCCASION} tomorrow`;
  return `${OCCASION} in ${days} days`;
}
