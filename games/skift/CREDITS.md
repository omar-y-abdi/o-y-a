# SKIFT — provenance and libraries

SKIFT is an original game developed for Omar Yusuf's portfolio. Its levels, character and machinery geometry, combat rules, UI copy, original synthesized effects and composed music are included as editable source. No existing game has been repackaged. Bruno Simon's portfolio was a visual-quality reference, not a source of game code, models, textures or music.

The original standalone design used the portfolio palette and typography from `src/styles/base.css` (historical blob `9a02b9b77640f8e80d21e18a188b58826d760204`). The game is now integrated as source under `games/skift`; the portfolio and standalone builds share those game modules and build options.

## Runtime libraries

- **Three.js 0.180.0**: renderer, cameras, lighting, geometry, materials and static geometry merging. MIT license.
- **cannon-es 0.20.0**: collision queries, contact resolution and fixed-step physics. MIT license.
- **Howler 2.2.4**: sound decoding, browser audio unlocking, playback and audio lifecycle. MIT license.

These libraries are bundled locally; the released game does not load them from a CDN. Full third-party license texts are tracked in [THIRD-PARTY-LICENSES.txt](THIRD-PARTY-LICENSES.txt), included in the source ZIP, and copied to `dist/play/skift/THIRD-PARTY-LICENSES.txt` by each build. esbuild also creates `dist/play/skift/assets/app.js.LEGAL.txt` with linked bundle comments. The `dist` paths exist after a build: relative to this package for standalone builds, or to the repository root for the portfolio build.

## Development tools

The standalone lockfile uses esbuild 0.25.12; the portfolio lockfile uses esbuild 0.28.2. Node's test runner, Playwright 1.63.0 and Python's standard library provide verification, local serving and ZIP packaging. ffmpeg is used only when regenerating the original MP3 from the included authoring script. No font files are distributed by this game package; its UI uses the device's Arial/Helvetica/system sans-serif stack.
