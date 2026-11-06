/*
 * Merge a partial translation file into a locale dictionary.
 *
 *   node scripts/i18n-merge.mjs hi part1.json [part2.json ...]
 *
 * Each input is { "<id>": "<translation>" } using the ids in
 * src/i18n/strings.json. Existing entries are kept unless an input overrides
 * them, so a language can be filled in several passes. Any id that is not in
 * strings.json is reported and dropped — that is the guard against a typo
 * silently becoming a translation that never appears.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [code, ...parts] = process.argv.slice(2);
if (!code || !parts.length) {
  console.error('usage: node scripts/i18n-merge.mjs <code> <part.json> [...]');
  process.exit(1);
}

const i18n = join(process.cwd(), 'src', 'i18n');
const strings = JSON.parse(readFileSync(join(i18n, 'strings.json'), 'utf8'));
const target = join(i18n, `${code}.json`);
const dict = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {};

let added = 0, updated = 0;
const unknown = [];
for (const part of parts) {
  const incoming = JSON.parse(readFileSync(part, 'utf8'));
  for (const [id, value] of Object.entries(incoming)) {
    if (!(id in strings)) { unknown.push(id); continue; }
    if (typeof value !== 'string' || !value.trim()) continue;
    if (id in dict) updated++; else added++;
    dict[id] = value;
  }
}

// Keep the file in the same order as strings.json so diffs stay readable.
const ordered = {};
for (const id of Object.keys(strings)) if (id in dict) ordered[id] = dict[id];
writeFileSync(target, JSON.stringify(ordered, null, 2) + '\n', 'utf8');

const total = Object.keys(strings).length;
const have = Object.keys(ordered).length;
console.log(`${code}: ${have}/${total} (${Math.round((have / total) * 100)}%)  +${added} new, ${updated} replaced`);
if (unknown.length) console.warn(`  dropped ${unknown.length} unknown id(s): ${unknown.slice(0, 8).join(', ')}`);
