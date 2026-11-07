import { defineConfig } from 'astro/config';
import i18n from './integrations/i18n.mjs';

// compressHTML is off so the rendered markup stays identical to the authored
// markup (whitespace between inline elements is significant in these pages).
export default defineConfig({
  compressHTML: false,
  // The dev toolbar injects a heavy overlay and extra scripts on every page.
  devToolbar: { enabled: false },
  // Start fetching a page as soon as the pointer rests on its link (or it is
  // tapped on touch), so the click that follows swaps in an already-loaded page.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { format: 'file' },
  // Builds a copy of every page per language into dist/<code>/.
  // See integrations/i18n.mjs and src/i18n/locales.mjs.
  integrations: [i18n()],
});
