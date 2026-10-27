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
menu links are added, preserving the owner's footer. The preceding developer
footer migration still runs first.

The built game page is always served. A stored CMS page for this route is
never used. The published sitemap includes the new route. Game assets use their
own `/play/skift/assets/` and `/play/skift/audio/` paths, bypassing CMS page
fallbacks. The content-hashed bootstrap entry and shared public modules live
under `/assets/`; main imports the bootstrap without awaiting it. The bootstrap
shares main's copy promise, then loads `/play/skift/assets/app.js`. Because the
game page is code-owned, its runtime copy still uses `/data/runtime.json`.
The app import carries `?v=` with the first 12 hex characters of its SHA-256.
Changing the app also changes the bootstrap and main content-hashed filenames.
The phase 2 bootstrap remains an esbuild entry under `/assets/`; no second
bootstrap or separate copy loader is introduced. Both asset directories use
one-year immutable caching, while `/play/skift/audio/*` uses a one-day lifetime.
The game CSS is merged into the page's content-hashed stylesheet; its redundant
`dist/play/skift/assets/app.css` is removed after reading. `media-src 'self' blob:` is scoped to game HTML; other public pages
use the base public CSP. The admin CSP is unchanged.

## Updating the game

Edit `games/skift/src/` and the single markup source `games/skift/index.html`.
The site build compiles the game and copies its source audio directly into
`dist/play/skift/`. The old vendored `public/play/skift/` tree is removed and
ignored; builds do not recreate tracked files there before a commit stages
their deletion. Neither generated game files nor generated modules under
`src/` belong in git. The source page module adapts the standalone markup for the portfolio
with parse5; the game build removes standalone header/brand selectors with
css-tree. There is no patching of minified JavaScript.

The runtime adapters live in `ui.js` (landing-copy whitelist and isolated menu
selector), `main.js` (dismiss Help/Settings before startup completes), and
`sound.js` (same-origin `/play/skift/audio/` paths). `src/copy.mjs` derives both
languages' CMS defaults from `i18n.js`; only whitelisted landing text can be
overridden, including empty strings. Modal HTML stays code-owned.

The portfolio and standalone builds share `games/skift/scripts/build-options.mjs` inside
the game: bundling, full minification, Chrome 100/Safari 15.4/Firefox 100 targets
and linked legal comments. The portfolio disables source maps, matching the
old importer's exclusion of maps. The root esbuild pin and the standalone
package's esbuild pin differ; byte-identical bundle output is not assumed.
The root's exact development pins for three, cannon-es and howler match
`games/skift/package.json`. No game dependencies enter the shell or CMS bundle.

`RELEASE.json` is generated with the bundle SHA-256, source-file SHA-256 values,
dependency pins, esbuild version, build options and the five integration
adapters. It replaces the old upstream/adapted bundle pair. The build metafile
under `.generated/build.json` records the actual game module graph. Library
licenses and linked legal notices remain beside the game.

From a checkout with private, installed root development dependencies and a
synchronized root lockfile, run each verification command serially:

```sh
node --test --test-concurrency=1 tests/skift-build.test.mjs
npm run build
node --test --test-concurrency=1 tests/assets.test.mjs tests/skift.test.mjs
node --test --test-concurrency=1 games/skift/tests/*.test.mjs
npm run lint
TEST_CONCURRENCY=1 npm test
npx playwright test tests/skift.spec.mjs --project=chromium-webgl --no-deps --workers=1
```

The clean-build test removes imported output from its temporary checkout,
changes a source translation and checks that both the runtime and CMS defaults
contain it. It checks the twelve runtime source modules, three library inputs,
audio bytes, licenses and provenance. Browser coverage includes safe CMS text,
loading-menu dismissal, shell navigation, underlined links and cached return
navigation. Chrome network cache events distinguish cache hits from requests
that reach the server. Public identity dumps and byte-identical screenshots
remain separate release gates; these tests do not establish visual identity.

Use a coherent deployment of the whole build. Verification commands build and
test locally; they do not publish the website.

## Optional statistics

`/api/config` requires both an `ANALYTICS` binding and
`ANALYTICS_ENABLED: "true"`. Enabling it is a separate, final configuration
change after reviewing the currently published `/integritet/` statistics text.
That page can come from D1; the source template and checked-in publication
fixture do not establish its current production contents. The consent labels
are protected by CMS validation, and the game stylesheet hides the consent
banner and portfolio toast outside the title menu. Review the published policy
before changing the flag; this build change leaves it disabled.
