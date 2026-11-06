import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      // The ten brand colours. Nothing else is allowed (see docs/DESIGN.md).
      //
      // Each one resolves to a CSS variable rather than a literal hex, so the
      // whole site flips between light and dark by swapping ten variables in
      // src/styles/global.css — no `dark:` class anywhere in the markup. The
      // light values are exactly the ten brand hexes; the dark values are
      // tints and shades of those same ten, no new hues.
      //
      // The `<alpha-value>` placeholder keeps the opacity modifiers working
      // (text-white/80, border-hairline/20, placeholder-light-text/60 ...).
      colors: {
        white: 'rgb(var(--c-white) / <alpha-value>)',
        'page-bg': 'rgb(var(--c-page-bg) / <alpha-value>)',
        'product-frame': 'rgb(var(--c-product-frame) / <alpha-value>)',
        hairline: 'rgb(var(--c-hairline) / <alpha-value>)',
        'structural-line': 'rgb(var(--c-structural-line) / <alpha-value>)',
        'heading-black': 'rgb(var(--c-heading-black) / <alpha-value>)',
        'body-text': 'rgb(var(--c-body-text) / <alpha-value>)',
        'light-text': 'rgb(var(--c-light-text) / <alpha-value>)',
        'logo-blue': 'rgb(var(--c-logo-blue) / <alpha-value>)',
        'deep-navy': 'rgb(var(--c-deep-navy) / <alpha-value>)',
      },
      // Two families: Instrument Serif (display) and Inter (body/UI).
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [forms, containerQueries],
};
