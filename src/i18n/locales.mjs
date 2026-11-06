/*
 * The languages the site is published in.
 *
 * Chosen for where Unicore's buyers actually are — regional stockists,
 * workshops, transport fleets and farm equipment owners — not for a global
 * audience. English is the source language and the site root; every other
 * locale is a built copy under its own directory (/hi/, /mr/, ...).
 *
 * TO ADD A LANGUAGE
 *   1. add a row here
 *   2. run `npm run i18n:extract` to refresh src/i18n/strings.json
 *   3. create src/i18n/<code>.json mapping those ids to translations
 *   4. build — anything untranslated falls back to English, per string
 *
 * TO REMOVE ONE: delete its row. Its directory stops being built.
 *
 * `dir` is here for the day an RTL language is added; all of these are LTR.
 */
export const DEFAULT_LOCALE = 'en';

export const LOCALES = [
  { code: 'en', native: 'English',  english: 'English',   dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी',     english: 'Hindi',     dir: 'ltr' },
  { code: 'mr', native: 'मराठी',     english: 'Marathi',   dir: 'ltr' },
  { code: 'gu', native: 'ગુજરાતી',    english: 'Gujarati',  dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்',      english: 'Tamil',     dir: 'ltr' },
  { code: 'te', native: 'తెలుగు',     english: 'Telugu',    dir: 'ltr' },
  { code: 'kn', native: 'ಕನ್ನಡ',      english: 'Kannada',   dir: 'ltr' },
  { code: 'bn', native: 'বাংলা',      english: 'Bengali',   dir: 'ltr' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ',     english: 'Punjabi',   dir: 'ltr' },
];

export const TRANSLATED = LOCALES.filter((l) => l.code !== DEFAULT_LOCALE);

export function localeByCode(code) {
  return LOCALES.find((l) => l.code === code) || null;
}
