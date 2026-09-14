import { HttpError } from './http.mjs';
import { resourceReferences } from './resources.mjs';
function fail(message) { throw new HttpError(422, message); }
export const fontFamilies = Object.freeze({ Arial: 'Arial, "Helvetica Neue", sans-serif', System: 'system-ui, sans-serif', Georgia: 'Georgia, serif', Monospace: '"Courier New", monospace', Verdana: 'Verdana, sans-serif', Trebuchet: '"Trebuchet MS", sans-serif' });
export const defaultTheme = Object.freeze({ paper: '#fffdf6', butter: '#fff0b3', yellow: '#ffda44', ink: '#20261e', blue: '#234ce7', blueDark: '#1939b3', coral: '#ff815f', green: '#dfeacb', muted: '#5a604f', fontFamily: 'Arial', fontSize: 16, radius: 22 });
const COLORS = Object.keys(defaultTheme).filter(key => defaultTheme[key].toString().startsWith('#'));

export function validateTheme(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Temat saknas.');
  for (const key of Object.keys(input)) if (!Object.hasOwn(defaultTheme, key)) fail('Okänd temainställning.');
  const theme = { ...defaultTheme, ...input };
  for (const key of COLORS) if (!/^#[a-f0-9]{6}$/i.test(theme[key])) fail(`Färgen ${key} måste vara en giltig hex-färg.`);
  if (!Object.hasOwn(fontFamilies, theme.fontFamily) && !/^cms-font-[a-f0-9-]{36}$/.test(theme.fontFamily)) fail('Välj ett tillgängligt typsnitt.');
  if (!Number.isFinite(theme.fontSize) || theme.fontSize < 10 || theme.fontSize > 32 || !Number.isFinite(theme.radius) || theme.radius < 0 || theme.radius > 80) fail('Temats storlek ligger utanför tillåtet intervall.');
  return theme;
}

export function themeCss(input) {
  const theme = validateTheme(input);
  const uploaded = theme.fontFamily.startsWith('cms-font-');
  const face = uploaded ? `@font-face{font-family:"${theme.fontFamily}";src:url(/media/${theme.fontFamily.slice(9)}.woff2) format("woff2");font-display:swap}` : '';
  return `${face}:root{${COLORS.map(key => `--${key === 'blueDark' ? 'blue-dark' : key}:${theme[key]}`).join(';')};--radius:${theme.radius}px;font-family:${uploaded ? `"${theme.fontFamily}",sans-serif` : fontFamilies[theme.fontFamily]};font-size:${theme.fontSize}px}`;
}

export function referencedFonts(project) {
  return [...resourceReferences(project).keys()].filter(src => /^\/media\/[0-9a-f-]{36}\.woff2$/.test(src)).map(src => src.slice(7, -6));
}
export function fontCss(project) {
  return referencedFonts(project).map(id => `@font-face{font-family:"cms-font-${id}";src:url(/media/${id}.woff2) format("woff2");font-display:swap}`).join('');
}
