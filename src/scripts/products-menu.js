/*
 * Desktop "Products" dropdown — the keyboard half.
 *
 * CSS already opens the panel on hover and on :focus-within, which is enough
 * to tab through it. This adds what a pointer user expects and what a
 * keyboard user needs to get out again:
 *
 *   - click / Enter / Space on the button toggles it
 *   - ArrowDown opens it and moves into the list
 *   - Escape closes it and returns focus to the button
 *   - moving focus or the pointer out of the menu closes it
 *
 * aria-expanded is kept in step throughout, so a screen reader announces the
 * state instead of silently listing seven links.
 */
// Marks that scripting is live, so the CSS can drop its no-JS :focus-within
// fallback. Set here as well as in lang.js so neither script depends on the
// other's load order.
document.documentElement.classList.add('js');

function close(menu, refocus) {
  if (!menu.hasAttribute('data-open')) return;
  menu.removeAttribute('data-open');
  const btn = menu.querySelector('[data-products-trigger]');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  }
}

function open(menu, focusFirst) {
  menu.setAttribute('data-open', '');
  const btn = menu.querySelector('[data-products-trigger]');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  if (focusFirst) menu.querySelector('.products-panel a')?.focus();
}

function initProductsMenu() {
  document.querySelectorAll('[data-products-menu]').forEach((menu) => {
    if (menu.dataset.pmBound) return;
    menu.dataset.pmBound = '1';
    const btn = menu.querySelector('[data-products-trigger]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      menu.hasAttribute('data-open') ? close(menu, false) : open(menu, false);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(menu, true); }
    });

    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(menu, true); }
    });

    // Tabbing past the last link, or clicking elsewhere, shuts it.
    menu.addEventListener('focusout', (e) => {
      if (!menu.contains(e.relatedTarget)) close(menu, false);
    });
    menu.addEventListener('mouseleave', () => close(menu, false));
  });
}

document.addEventListener('astro:page-load', initProductsMenu);
