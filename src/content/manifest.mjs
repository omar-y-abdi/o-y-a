import { site } from './site.mjs';

export const MANIFEST_PATH = '/site.webmanifest';

// Web app manifest. The Worker serves it at MANIFEST_PATH instead of the build
// writing it to dist: the path of every dist file is listed in the CMS seed, so
// a new static file would change the studio build key. The icons and colours
// are the built-in ones, so a custom CMS icon or theme is not reflected here.
export function webManifest() {
  return JSON.stringify({
    name: site.name,
    short_name: site.name,
    lang: 'sv',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#fffdf6',
    theme_color: '#fff0b3',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }, null, 2) + '\n';
}
