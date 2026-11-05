import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      // The ten brand colours. Nothing else is allowed (see docs/DESIGN.md).
      colors: {
        white: '#FFFFFF',
        'page-bg': '#FAFAF8',
        'product-frame': '#F3F3F0',
        hairline: '#E6E6E2',
        'structural-line': '#D8D8D3',
        'heading-black': '#0B0B0C',
        'body-text': '#434751',
        'light-text': '#737783',
        'logo-blue': '#1B4FA0',
        'deep-navy': '#143A78',
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
