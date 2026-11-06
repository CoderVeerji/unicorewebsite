/*
 * A small HTML walker, shared by the build integration and the extraction
 * script, so both see exactly the same set of translatable strings.
 *
 * Why not a real parser: the input is Astro's own output — well-formed,
 * machine-generated HTML — and this avoids adding a dependency for a job
 * that is a scan for text between tags plus five attribute names. It never
 * reorders or re-serialises anything: callers splice replacements back into
 * the original string by offset, so whatever is not translated comes out
 * byte-for-byte unchanged.
 */
import { createHash } from 'node:crypto';

/** Element contents that are code, not prose. */
const OPAQUE = /^(script|style|template|svg|noscript)$/i;

/* Attributes whose values a reader can see.
   The data-* ones are strings that JavaScript writes into the page at
   runtime; they are kept in the markup, where they can be translated with
   everything else, rather than hard-coded in the script. */
const ATTRS = new Set([
  'alt', 'placeholder', 'aria-label', 'title',
  'data-label-dark', 'data-label-light',          // ThemeToggle.astro
  'data-cd-today', 'data-cd-tomorrow', 'data-cd-days', // AnnouncementStrip.astro
  'data-phrases',                                 // the rotating hero accent
]);

/* Left in English on purpose. */
const SKIP_EXACT = new Set(['UNICORE', 'Unicore', 'Unicore Lubricants']);
/* Viscosity and product grades: EP-90, EP-2, 15W-40, SAE 40. */
const CODE = /^[A-Z]{1,4}[- ]?\d{1,3}[A-Z]?(-\d{1,3})?$/;
/* An email or a domain placeholder. */
const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Strings with no letters (digits, punctuation, arrows, viscosity grades like
   "15W-40"), and the placeholders the client still has to fill in, are left
   alone. Keeping the bracketed placeholders in English is deliberate: they
   are a to-do list for Unicore, not copy for a visitor. */
const HAS_LETTERS = /\p{L}{2,}/u;
const PLACEHOLDER = /^\[(to be confirmed by Unicore|Photograph:|Map:|Product name)/i;

export function isTranslatable(s) {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!HAS_LETTERS.test(t)) return false;
  if (PLACEHOLDER.test(t)) return false;
  if (/^&[a-z]+;$/i.test(t)) return false;
  if (SKIP_EXACT.has(t)) return false;
  if (CODE.test(t)) return false;
  if (ADDRESS.test(t)) return false;
  return true;
}

/** Collapse runs of whitespace, so markup indentation never forks a key. */
export function key(s) {
  return s.trim().replace(/\s+/g, ' ');
}

/**
 * The stable id a string is known by in src/i18n/strings.json and in every
 * locale file: the first 8 hex of the SHA-1 of the normalised English.
 * Editing the English changes the id, so the translation goes stale loudly
 * (reported as untranslated) rather than silently staying wrong.
 */
export function idFor(value) {
  return createHash('sha1').update(key(value), 'utf8').digest('hex').slice(0, 8);
}

/**
 * Yield every translatable chunk as { start, end, value, kind }, where
 * start/end are offsets into `html` covering exactly the text to replace.
 *   kind: 'text' | 'attr' | 'meta'
 */
export function translatableChunks(html) {
  const out = [];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf('<', i);

    // ---- text run up to the next tag -------------------------------------
    const textEnd = lt === -1 ? html.length : lt;
    if (textEnd > i) {
      const raw = html.slice(i, textEnd);
      if (isTranslatable(raw)) {
        // keep the surrounding whitespace out of the replacement
        const lead = raw.length - raw.trimStart().length;
        const trail = raw.length - raw.trimEnd().length;
        out.push({ start: i + lead, end: textEnd - trail, value: key(raw), kind: 'text' });
      }
    }
    if (lt === -1) break;

    // ---- comment ---------------------------------------------------------
    if (html.startsWith('<!--', lt)) {
      const close = html.indexOf('-->', lt);
      i = close === -1 ? html.length : close + 3;
      continue;
    }

    // ---- tag -------------------------------------------------------------
    const gt = findTagEnd(html, lt);
    if (gt === -1) break;
    const tag = html.slice(lt, gt + 1);
    const nameMatch = /^<\/?\s*([a-zA-Z][\w:-]*)/.exec(tag);
    const name = nameMatch ? nameMatch[1].toLowerCase() : '';

    if (!tag.startsWith('</')) {
      collectAttrs(tag, lt, name, out);
    }

    // Skip the body of elements whose contents are not prose, and of
    // anything the author marked translate="no" / data-i18n-skip (the
    // language picker's own list of language names, for one — those are
    // always written in their own language).
    const opaque = !tag.startsWith('</') && !tag.endsWith('/>') && OPAQUE.test(name);
    const marked = !tag.startsWith('</') && !tag.endsWith('/>') &&
      /\s(?:data-i18n-skip|translate\s*=\s*["']no["'])(?=[\s>])/i.test(tag);
    if (opaque || marked) {
      const close = skipElement(html, gt + 1, name);
      i = close;
      continue;
    }
    i = gt + 1;
  }
  return out;
}

/** Find the '>' that closes a tag, ignoring any inside quoted values. */
function findTagEnd(html, from) {
  let q = null;
  for (let j = from + 1; j < html.length; j++) {
    const c = html[j];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === '>') {
      return j;
    }
  }
  return -1;
}

const ATTR_RE = /([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;

function collectAttrs(tag, tagStart, name, out) {
  const isMetaDesc = name === 'meta' && /name\s*=\s*["']description["']/i.test(tag);
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(tag))) {
    const attr = m[1].toLowerCase();
    const wanted = ATTRS.has(attr) || (isMetaDesc && attr === 'content');
    if (!wanted) continue;
    const value = m[3] !== undefined ? m[3] : m[4];
    if (!isTranslatable(value)) continue;
    // offset of the value inside the quotes
    const quoteOffset = m[0].indexOf(m[2]) + 1;
    const start = tagStart + m.index + quoteOffset;
    out.push({
      start,
      end: start + value.length,
      value: key(value),
      kind: isMetaDesc ? 'meta' : 'attr',
    });
  }
}

/**
 * Offset of the matching close tag for `name`, counting nested copies of the
 * same element so an inner <div class="x"> cannot end the skip early.
 *
 * Deliberately written with indexOf and an explicit boundary check rather
 * than a RegExp: building the pattern from a string needs a backslash escape
 * that is easy to get wrong, and getting it wrong fails silently by
 * under-skipping. There is nothing to escape here.
 */
function skipElement(html, from, name) {
  const lower = html.toLowerCase();
  const open = '<' + name;
  const close = '</' + name;
  // What may legally follow a tag name.
  const boundary = (ch) =>
    ch === undefined || ch === '>' || ch === '/' || ch === ' ' ||
    ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';

  let depth = 1;
  let i = from;
  while (i < html.length) {
    const nOpen = lower.indexOf(open, i);
    const nClose = lower.indexOf(close, i);
    if (nClose === -1) return html.length;        // unbalanced: skip the rest

    if (nOpen !== -1 && nOpen < nClose) {
      // <divider> is not a nested <div>
      if (boundary(html[nOpen + open.length])) depth++;
      i = nOpen + open.length;
      continue;
    }
    if (!boundary(html[nClose + close.length])) { i = nClose + close.length; continue; }
    depth--;
    i = nClose + close.length;
    if (depth === 0) return nClose;
  }
  return html.length;
}
