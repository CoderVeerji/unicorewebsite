import { defineConfig } from 'astro/config';
import i18n from './integrations/i18n.mjs';

// compressHTML is off so the rendered markup stays identical to the authored
// markup (whitespace between inline elements is significant in these pages).
export default defineConfig({
  compressHTML: false,
  build: { format: 'file' },
  // Builds a copy of every page per language into dist/<code>/.
  // See integrations/i18n.mjs and src/i18n/locales.mjs.
  integrations: [i18n()],
});
