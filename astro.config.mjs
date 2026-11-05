import { defineConfig } from 'astro/config';

// compressHTML is off so the rendered markup stays identical to the authored
// markup (whitespace between inline elements is significant in these pages).
export default defineConfig({
  compressHTML: false,
  build: { format: 'file' },
});
