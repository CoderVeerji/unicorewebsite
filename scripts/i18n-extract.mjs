/*
 * Refresh src/i18n/strings.json from the built English site.
 *
 *   npm run build && npm run i18n:extract
 *
 * The file it writes maps a short stable id to the English string:
 *
 *   { "a3f91c2e": "Become a distributor", ... }
 *
 * The id is the first 8 hex of the SHA-1 of the whitespace-normalised
 * English, so it does not move when strings are reordered, only when the
 * English itself is edited. A locale file keys its translations by the same
 * ids, which keeps the long English sentences out of eight separate files
 * and makes a stale translation detectable instead of silent.
 *
 * Editing English copy therefore changes that string's id; the next build
 * reports it as untranslated and falls back to English, which is the safe
 * direction.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { translatableChunks, idFor } from '../src/i18n/tokenise.mjs';

const dist = join(process.cwd(), 'dist');
let files;
try {
  files = readdirSync(dist).filter((f) => f.endsWith('.html'));
} catch (e) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

const strings = new Map();
const pages = new Map();
for (const f of files) {
  const html = readFileSync(join(dist, f), 'utf8');
  for (const { value } of translatableChunks(html)) {
    const id = idFor(value);
    if (!strings.has(id)) { strings.set(id, value); pages.set(id, new Set()); }
    pages.get(id).add(f.replace(/\.html$/, ''));
  }
}

// Group by the page a string first appears on, so the file reads in site
// order rather than hash order and a human can review it page by page.
const order = ['index', 'products', 'product-detail', 'tyre-sealant', 'applications', 'about', 'dealership', 'contact'];
const sorted = [...strings.entries()].sort((a, b) => {
  const pa = [...pages.get(a[0])].sort((x, y) => order.indexOf(x) - order.indexOf(y))[0];
  const pb = [...pages.get(b[0])].sort((x, y) => order.indexOf(x) - order.indexOf(y))[0];
  const d = order.indexOf(pa) - order.indexOf(pb);
  return d !== 0 ? d : a[1].localeCompare(b[1]);
});

const out = {};
for (const [id, value] of sorted) out[id] = value;
const target = join(process.cwd(), 'src', 'i18n', 'strings.json');
writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf8');

const words = sorted.reduce((n, [, v]) => n + v.split(/\s+/).length, 0);
console.log(`wrote src/i18n/strings.json — ${sorted.length} strings, ${words} words, from ${files.length} pages`);
