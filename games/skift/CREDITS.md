# SKIFT — provenance and libraries

SKIFT is an original game developed for Omar Yusuf's portfolio. Its levels, character and machinery geometry, combat rules, UI copy, original synthesized effects and composed music are included as editable source. No existing game has been repackaged. Bruno Simon's portfolio was a visual-quality reference, not a source of game code, models, textures or music.

The o-y-a reference was inspected through the GitHub connector. The source palette and typography were read from `src/styles/base.css` (blob `9a02b9b77640f8e80d21e18a188b58826d760204`), alongside the homepage and game styles. No repository changes, commits or deployments were made.

## Runtime libraries

- **Three.js 0.180.0**: renderer, cameras, lighting, geometry, materials and static geometry merging. MIT license.
- **cannon-es 0.20.0**: collision queries, contact resolution and fixed-step physics. MIT license.
- **Howler 2.2.4**: sound decoding, browser audio unlocking, playback and audio lifecycle. MIT license.

These libraries are bundled locally; the released game does not load them from a CDN. Full third-party license texts are in `dist/play/skift/THIRD-PARTY-LICENSES.txt` and linked bundle notices in `dist/play/skift/assets/app.js.LEGAL.txt`.

## Development tools

esbuild 0.25.12 bundles the application. Node's test runner, Playwright 1.63.0 and Python's standard library provide verification, local serving and ZIP packaging. ffmpeg is used only when regenerating the original MP3 from the included authoring script. No font files are distributed; the UI uses the device's Arial/Helvetica/system sans-serif stack.
