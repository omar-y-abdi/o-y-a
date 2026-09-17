export const fontFamilies = Object.freeze({ Arial: 'Arial, "Helvetica Neue", sans-serif', System: 'system-ui, sans-serif', Georgia: 'Georgia, serif', Monospace: '"Courier New", monospace', Verdana: 'Verdana, sans-serif', Trebuchet: '"Trebuchet MS", sans-serif' });
export const defaultTheme = Object.freeze({ paper: '#fffdf6', butter: '#fff0b3', yellow: '#ffda44', ink: '#20261e', blue: '#234ce7', blueDark: '#1939b3', coral: '#ff815f', green: '#dfeacb', muted: '#5a604f', fontFamily: 'Arial', fontSize: 16, radius: 22 });
export const themeColors = Object.freeze(Object.keys(defaultTheme).filter(key => defaultTheme[key].toString().startsWith('#')));

export function renderThemeCss(theme) {
  const uploaded = theme.fontFamily.startsWith('cms-font-');
  const face = uploaded ? `@font-face{font-family:"${theme.fontFamily}";src:url(/media/${theme.fontFamily.slice(9)}.woff2) format("woff2");font-display:swap}` : '';
  return `${face}:root{${themeColors.map(key => `--${key === 'blueDark' ? 'blue-dark' : key}:${theme[key]}`).join(';')};--radius:${theme.radius}px;font-family:${uploaded ? `"${theme.fontFamily}",sans-serif` : fontFamilies[theme.fontFamily]};font-size:${theme.fontSize}px}`;
}

export function assetFontCss(assets) {
  return assets.filter(asset => asset.mime === 'font/woff2').map(asset => `@font-face{font-family:"cms-font-${asset.id}";src:url(${asset.src}) format("woff2");font-display:swap}`).join('');
}
