/*
 * Light / dark theme.
 *
 * The <html class="dark"> flag itself is set by the inline script in
 * src/layouts/Base.astro, before the first paint. This module only wires up
 * the toggle buttons, keeps them labelled correctly, and re-applies the class
 * after a view transition (which swaps the whole <html> element).
 *
 * Storage: 'unicore:theme' holds 'light' or 'dark' once the visitor has made
 * an explicit choice. Until then the key is absent and the site follows the
 * operating system, live.
 */
const KEY = 'unicore:theme';
const root = document.documentElement;

function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch (e) {
    return null; // blocked storage: the OS preference is the only input
  }
}

function systemDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function isDark() {
  const choice = stored();
  return choice ? choice === 'dark' : systemDark();
}

/* Keep every toggle on the page describing what it will do next.
   The two labels come from the markup (data-label-dark / data-label-light)
   rather than from here, so the build-time translator can reach them — see
   integrations/i18n.mjs. */
function syncButtons(dark) {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    const label = dark ? btn.dataset.labelLight : btn.dataset.labelDark;
    if (label) btn.setAttribute('aria-label', label);
  });
}

function apply(dark, announce) {
  root.classList.toggle('dark', dark);
  syncButtons(dark);
  if (announce) {
    // The particle field bakes its palette into a GPU texture at build time,
    // so it has to be rebuilt rather than restyled. Anything else that needs
    // to know can listen for the same event.
    document.dispatchEvent(new CustomEvent('unicore:themechange', { detail: { dark } }));
  }
}

function toggle() {
  const next = !root.classList.contains('dark');
  try {
    localStorage.setItem(KEY, next ? 'dark' : 'light');
  } catch (e) {
    /* private browsing: the choice holds for this page view only */
  }
  apply(next, true);
}

let mq = null;
function onSystemChange() {
  // An explicit choice outranks the operating system.
  if (!stored()) apply(systemDark(), true);
}

function initTheme() {
  apply(isDark(), false);

  // Arm the canvas transition only after the first paint, so restoring a
  // stored theme on load is instant and only a click eases.
  requestAnimationFrame(() => root.classList.add('theme-ready'));

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = '1';
    btn.addEventListener('click', toggle);
  });

  if (!mq && window.matchMedia) {
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onSystemChange);
  }
}

// A view transition swaps in the next document's <html>, dropping the class.
// Put it back before paint, exactly like the announcement strip does.
document.addEventListener('astro:after-swap', () => {
  root.classList.toggle('dark', isDark());
  root.classList.add('theme-ready');
});

document.addEventListener('astro:page-load', initTheme);
