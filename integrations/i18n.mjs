/*
 * Build-time translation.
 *
 * The eight .astro pages stay monolingual English — nothing in src/pages or
 * src/components knows that other languages exist. After Astro has written
 * dist/, this integration makes one copy of every page per locale, replacing
 * the text it has a translation for and leaving everything else byte for
 * byte as Astro emitted it.
 *
 *   dist/products.html      ->  dist/hi/products.html, dist/mr/products.html, ...
 *
 * Why this way round
 *   - No string extraction inside the markup, so none of the existing pages
 *     had to be rewritten and none can be broken by a bad key.
 *   - Fallback is per string, not per page: a locale with twelve translated
 *     strings renders those twelve and the rest in English. Nothing is ever
 *     blank or missing.
 *   - Links in the pages are relative ("products.html"), so inside
 *     dist/hi/ they resolve to /hi/products.html with no rewriting. Assets
 *     are absolute (/_astro/...) and are shared, not duplicated.
 *
 * It also stamps each copy: <html lang>, the language picker's label and
 * current item, and a full set of hreflang alternates on every locale
 * including English.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { translatableChunks, idFor } from '../src/i18n/tokenise.mjs';
import { LOCALES, TRANSLATED, DEFAULT_LOCALE } from '../src/i18n/locales.mjs';

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => escapeText(s).replace(/"/g, '&quot;');

function loadDictionary(i18nDir, code) {
  const file = join(i18nDir, `${code}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`src/i18n/${code}.json is not valid JSON: ${e.message}`);
  }
}

/** Replace every chunk we have a translation for, right to left by offset. */
function translate(html, dict, counters) {
  const chunks = translatableChunks(html);
  let out = html;
  for (let i = chunks.length - 1; i >= 0; i--) {
    const c = chunks[i];
    counters.seen++;
    const hit = dict[idFor(c.value)];
    if (!hit) { counters.missing.add(c.value); continue; }
    counters.hit++;
    const replacement = c.kind === 'attr' || c.kind === 'meta' ? escapeAttr(hit) : escapeText(hit);
    out = out.slice(0, c.start) + replacement + out.slice(c.end);
  }
  return out;
}

/** <html lang="en"> -> the locale, plus dir for a future RTL language. */
function stampLang(html, locale) {
  return html.replace(/<html([^>]*?)\slang="[^"]*"/i, (m, pre) =>
    `<html${pre} lang="${locale.code}"${locale.dir === 'rtl' ? ' dir="rtl"' : ''}`);
}

/** Point the picker's button at this locale and mark its row as current. */
function stampPicker(html, locale) {
  /* The `g` flag matters: the header renders the picker twice, once for
     desktop and once for the mobile bar. Without it only the first one is
     relabelled and the phone header still reads "English" on a translated
     page. The match is non-greedy so it stops at that span's own </span>. */
  let out = html.replace(
    /(<span[^>]*\sdata-locale-label[^>]*>)[\s\S]*?(<\/span>)/gi,
    (m, open, close) => open + escapeText(locale.native) + close
  );
  /* Exactly one row carries aria-current. Strip any that is already there
     before adding ours — the English pages are stamped first, and a locale
     copy is made from that stamped English, so without this clear step a
     translated page would claim two current languages. The attribute is
     written immediately after data-locale, so that is where it is removed
     from. */
  out = out.replace(/(\sdata-locale="[a-z-]+")\s+aria-current="true"/g, '$1');
  out = out.replace(/\sdata-locale="([a-z-]+)"/g, (m, code) =>
    code === locale.code ? ` data-locale="${code}" aria-current="true"` : m);
  return out;
}

/** A full alternates block on every locale, including the English original. */
function stampAlternates(html, page, base) {
  const links = LOCALES.map((l) => {
    const href = l.code === DEFAULT_LOCALE ? `${base}/${page}` : `${base}/${l.code}/${page}`;
    return `    <link rel="alternate" hreflang="${l.code}" href="${href}" />`;
  });
  links.push(`    <link rel="alternate" hreflang="x-default" href="${base}/${page}" />`);
  const block = `\n${links.join('\n')}\n  `;
  return html.replace(/<\/head>/i, `${block}</head>`);
}

/*
 * hreflang needs ABSOLUTE URLs, so the alternates are only written when the
 * site's address is known. Netlify provides it as $URL and Vercel as $VERCEL_PROJECT_PRODUCTION_URL at build time; set
 * SITE_URL to override (e.g. SITE_URL=https://www.unicore.in npm run build).
 * Without either, the block is left out rather than emitted as relative
 * paths, which search engines reject.
 */
const VERCEL = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
const SITE_BASE = (process.env.SITE_URL || process.env.URL || VERCEL || '').replace(/\/+$/, '');

export default function i18n({ base = SITE_BASE } = {}) {
  return {
    name: 'unicore-i18n',
    hooks: {
      /*
       * Dev only. The copies above are made after a build, so without this
       * every language link 404s under `npm run dev`. This middleware does the
       * same job on the fly: ask the dev server for the English page, run the
       * same translate/stamp steps over it, send that back.
       */
      'astro:server:setup': ({ server, logger }) => {
        const i18nDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
        const codes = new Set(TRANSLATED.map((l) => l.code));
        // Netlify Forms answers a form POST with a redirect to the form's
        // `action` page. The dev server has no such handler and would 404 or
        // 405, so a form looks dead locally. Do the same redirect here.
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && /thank-you(\.html)?$/.test((req.url || '').split('?')[0])) {
            req.resume();
            req.on('end', () => {
              res.statusCode = 303;
              res.setHeader('location', (req.url || '').split('?')[0].replace(/\.html$/, '') + '.html');
              res.end();
            });
            return;
          }
          next();
        });
        server.middlewares.use(async (req, res, next) => {
          const m = /^\/([a-z]{2})(\/[^?#]*)?(\?.*)?$/.exec(req.url || '');
          if (!m || !codes.has(m[1])) return next();
          try {
            const locale = TRANSLATED.find((l) => l.code === m[1]);
            const dict = loadDictionary(i18nDir, locale.code) || {};
            let page = (m[2] || '/').replace(/^\/+/, '');
            if (page === '' || page === 'index') page = 'index.html';
            const addr = server.httpServer && server.httpServer.address();
            const port = addr && typeof addr === 'object' ? addr.port : 4321;
            const r = await fetch(`http://localhost:${port}/${page}`);
            if (!r.ok) return next();
            let html = await r.text();
            html = translate(html, dict, { seen: 0, hit: 0, missing: new Set() });
            html = stampLang(html, locale);
            html = stampPicker(html, locale);
            res.statusCode = 200;
            res.setHeader('content-type', 'text/html; charset=utf-8');
            res.end(html);
          } catch (e) {
            logger.warn(`dev i18n: ${e.message}`);
            next();
          }
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const i18nDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
        const pages = readdirSync(outDir).filter((f) => f.endsWith('.html'));
        if (!pages.length) return;

        // English keeps its place at the root. It still needs the alternates
        // and its own turn in the picker — without this the English pages are
        // the only ones where no language is marked as the current one.
        const english = LOCALES.find((l) => l.code === DEFAULT_LOCALE);
        for (const page of pages) {
          const file = join(outDir, page);
          let html = readFileSync(file, 'utf8');
          if (base) html = stampAlternates(html, page, base);
          html = stampPicker(html, english);
          writeFileSync(file, html, 'utf8');
        }

        const report = [];
        for (const locale of TRANSLATED) {
          const dict = loadDictionary(i18nDir, locale.code);
          if (!dict) {
            logger.warn(`${locale.code}: no src/i18n/${locale.code}.json — skipped, not built`);
            continue;
          }
          const localeDir = join(outDir, locale.code);
          mkdirSync(localeDir, { recursive: true });
          const counters = { seen: 0, hit: 0, missing: new Set() };

          for (const page of pages) {
            // Read the English original, not the stamped one, so the
            // alternates block is added once rather than translated.
            let html = readFileSync(join(outDir, page), 'utf8');
            html = translate(html, dict, counters);
            html = stampLang(html, locale);
            html = stampPicker(html, locale);
            writeFileSync(join(localeDir, page), html, 'utf8');
          }

          const pct = counters.seen ? Math.round((counters.hit / counters.seen) * 100) : 0;
          report.push({ code: locale.code, english: locale.english, pct, missing: counters.missing.size });
        }

        if (report.length) {
          const full = report.filter((r) => r.pct === 100).length;
          logger.info(
            `translated ${report.length} locale(s), ${pages.length} pages each` +
            ` — ${full} at 100%`
          );
          for (const r of report) {
            const line = `  ${r.code}  ${String(r.pct).padStart(3)}%  ${r.english}` +
              (r.missing ? `  (${r.missing} string(s) fall back to English)` : '');
            if (r.pct < 100) logger.warn(line); else logger.info(line);
          }
        }
      },
    },
  };
}
