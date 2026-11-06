/*
 * Language picker behaviour (markup in src/components/LanguagePicker.astro).
 *
 * The panel is plain visible markup until this runs — html.js is what hides
 * it — so with JavaScript off the languages are still a reachable list
 * rather than a button that does nothing.
 *
 * Keyboard: Enter/Space opens, Escape closes and returns focus to the
 * button, Up/Down move through the options, Tab out closes. A click
 * anywhere else closes it.
 */
document.documentElement.classList.add('js');

function options(picker) {
  return [...picker.querySelectorAll('.lang-option')];
}

function close(picker, refocus) {
  if (!picker.hasAttribute('data-open')) return;
  picker.removeAttribute('data-open');
  const trigger = picker.querySelector('[data-lang-trigger]');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    if (refocus) trigger.focus();
  }
}

function open(picker, focusFirst) {
  picker.setAttribute('data-open', '');
  const trigger = picker.querySelector('[data-lang-trigger]');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  if (focusFirst) {
    const current = picker.querySelector('.lang-option[aria-current="true"]');
    (current || options(picker)[0])?.focus();
  }
}

function initLang() {
  const pickers = [...document.querySelectorAll('[data-lang-picker]')];
  if (!pickers.length) return;

  pickers.forEach((picker) => {
    if (picker.dataset.langBound) return;
    picker.dataset.langBound = '1';

    const trigger = picker.querySelector('[data-lang-trigger]');
    const opts = options(picker);
    opts.forEach((o) => o.setAttribute('tabindex', '0'));

    trigger.addEventListener('click', () => {
      picker.hasAttribute('data-open') ? close(picker, false) : open(picker, false);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(picker, true); }
    });

    picker.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(picker, true); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      // ArrowDown on the trigger is already handled above, and that handler
      // moves focus into the list. Without this guard the same keypress then
      // bubbles to here and steps one option further, so opening the panel
      // would skip past the current language.
      if (e.target === trigger) return;
      const i = opts.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
      if (next < 0) { trigger.focus(); return; }
      opts[Math.min(next, opts.length - 1)].focus();
    });

    // Tabbing or clicking away shuts it.
    picker.addEventListener('focusout', (e) => {
      if (!picker.contains(e.relatedTarget)) close(picker, false);
    });
  });

  if (!document.documentElement.dataset.langGlobal) {
    document.documentElement.dataset.langGlobal = '1';
    document.addEventListener('click', (e) => {
      document.querySelectorAll('[data-lang-picker][data-open]').forEach((p) => {
        if (!p.contains(e.target)) close(p, false);
      });
    });
  }
}

document.addEventListener('astro:page-load', initLang);
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
});
