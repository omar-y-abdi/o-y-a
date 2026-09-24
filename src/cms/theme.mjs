import { HttpError } from './http.mjs';
import { fontFamilies, defaultTheme, themeColors, renderThemeCss, assetFontCss } from './theme-core.mjs';
export { fontFamilies, defaultTheme, assetFontCss } from './theme-core.mjs';
import { resourceReferences } from './resources.mjs';
function fail(message) { throw new HttpError(422, message); }
export function validateTheme(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Temat saknas.');
  for (const key of Object.keys(input)) if (!Object.hasOwn(defaultTheme, key)) fail('Okänd temainställning.');
  const theme = { ...defaultTheme, ...input };
  for (const key of themeColors) if (!/^#[a-f0-9]{6}$/i.test(theme[key])) fail(`Färgen ${key} måste vara en giltig hex-färg.`);
  if (!Object.hasOwn(fontFamilies, theme.fontFamily) && !/^cms-font-[a-f0-9-]{36}$/.test(theme.fontFamily)) fail('Välj ett tillgängligt typsnitt.');
  if (!Number.isFinite(theme.fontSize) || theme.fontSize < 10 || theme.fontSize > 32 || !Number.isFinite(theme.radius) || theme.radius < 0 || theme.radius > 80) fail('Temats storlek ligger utanför tillåtet intervall.');
  return theme;
}

export function themeCss(input) { return renderThemeCss(validateTheme(input)); }

export function referencedFonts(project, references = resourceReferences(project)) {
  return [...references.keys()].filter(src => /^\/media\/[0-9a-f-]{36}\.woff2$/.test(src)).map(src => src.slice(7, -6));
}
export function fontCss(project, references = resourceReferences(project)) {
  return referencedFonts(project, references).map(id => `@font-face{font-family:"cms-font-${id}";src:url(/media/${id}.woff2) format("woff2");font-display:swap}`).join('');
}
