/*
 * Coverage per language, and what is still missing.
 *
 *   npm run i18n:report            # a table
 *   npm run i18n:report -- hi      # the untranslated ids for one language,
 *                                  # as a skeleton you can fill in
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSLATED } from '../src/i18n/locales.mjs';

const i18n = join(process.cwd(), 'src', 'i18n');
const strings = JSON.parse(readFileSync(join(i18n, 'strings.json'), 'utf8'));
const ids = Object.keys(strings);
const only = process.argv[2];

if (only) {
  const file = join(i18n, `${only}.json`);
  const dict = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = ids.filter((id) => !dict[id]);
  console.error(`${only}: ${ids.length - missing.length}/${ids.length} translated, ${missing.length} missing`);
  const out = {};
  for (const id of missing) out[id] = strings[id];
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log('code  translated  missing  words left');
  for (const l of TRANSLATED) {
    const file = join(i18n, `${l.code}.json`);
    const dict = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    const missing = ids.filter((id) => !dict[id]);
    const words = missing.reduce((n, id) => n + strings[id].split(/\s+/).length, 0);
    console.log(
      `${l.code.padEnd(5)} ${String(ids.length - missing.length).padStart(6)}` +
      `/${ids.length}  ${String(missing.length).padStart(6)}  ${String(words).padStart(9)}   ${l.english}`
    );
  }
}
