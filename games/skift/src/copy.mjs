import { COPY_KEYS, STRINGS } from './i18n.js';

// Landing copy uses textContent only. Modal HTML stays code-owned.
export const skiftCopy = Object.fromEntries(['sv', 'en'].flatMap(language =>
  COPY_KEYS.map(key => [`runtime.skift.${language}.${key}`, STRINGS[language][key]])));
