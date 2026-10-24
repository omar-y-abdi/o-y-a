# SKIFT on the portfolio

SKIFT lives at `/play/skift/`. Every portfolio page, including custom CMS pages,
has an ordinary “Starta ditt arbetsskift” menu link immediately after “Lek en
stund”, in both the desktop navigation and mobile menu. The game uses the portfolio's
actual brand mark, header, navigation, footer, favicon, palette and typography.
The game world and mechanics come from the existing SKIFT 1.0.0 release.

SKIFT is not an editable page in the owner studio. The page is always served
from the build. Under **Lekarnas texter**, the **SKIFT · svenska och engelska**
group edits landing text in both languages.
These values use `textContent`; gameplay dialogs and functional hooks remain
code-owned. In-game sound, music, motion, language, quality and difficulty
preferences remain the player's own local settings.

The title screen keeps the portfolio shell. Starting a run gives the game the
full viewport; returning to its title screen restores the shell. The game
runtime loads only when a SKIFT root is present. Other portfolio pages do not
download the 3D bundle. Keyboard, pointer, touch, district checkpoints and the
existing WebGL 2 fallback remain part of the released game.

## Existing CMS data

Old revisions get a bounded, read-time navigation upgrade. Reading does not publish or rewrite stored revisions. Saving
publishes the normalized project through the usual version checks. The link
uses stable `skift-nav` and `skift-nav-mobile` identities, so existing numbered editor identities and
CSS selectors do not move. Old shared-footer backups are resolved before the
new page is added, preserving the owner's footer. The preceding developer
footer migration still runs first.

The built game page is always served. A stored CMS page for this route is
never used. The published sitemap includes the new route. Game assets use their
own `/play/skift/assets/` and `/play/skift/audio/` paths, bypassing CMS page
fallbacks. Unversioned game files must be revalidated rather than cached as
immutable. `media-src 'self' blob:` is scoped to game HTML; other public pages
and owner authentication retain their existing policies.

## Updating the game

Import the complete standalone release from its source project, then rebuild:

```sh
node scripts/import-skift.mjs '/path/to/SKIFT project'
npm run build
npm run check
npx playwright test tests/skift.spec.mjs --project=chromium-webgl --no-deps
```

The importer needs source `src/i18n.js` and built `dist/play/skift/`. It copies
audio, bundled JavaScript, CSS and licenses; writes the page template to
`src/templates/skift.mjs` and the landing copy defaults to
`src/content/skift-copy.mjs`; and adapts same-origin audio URLs for CMS previews, an isolated game
menu selector, safe landing-copy overrides, dismissible Help/Settings during
loading and ownership of header/brand styles by the portfolio shell. It fails if the released runtime no longer
matches its checked adapters.
No new runtime dependencies enter the portfolio or CMS bundles. Source maps
are excluded. `public/play/skift/RELEASE.json` records upstream and adapted
bundle SHA-256 hashes. Full bundled library licenses remain alongside the game.

Use a coherent deployment of the whole build. Verification commands build and
test locally; they do not publish the website.
