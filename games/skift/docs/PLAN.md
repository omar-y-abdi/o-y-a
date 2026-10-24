# SKIFT implementation plan

**Goal:** ship the complete original game described in DESIGN.md, a runnable distribution, source, tests and local installation, without touching the portfolio repository.
**Architecture:** a testable rules module and authored level data feed a cannon-es simulation; Three.js renders a batched diorama; DOM menus and Howler are thin integrations.
**Stack:** Three.js 0.180.0, cannon-es 0.20.0, Howler 2.2.4, esbuild 0.25.12, Node test runner, Playwright.
**Spec:** DESIGN.md.

## Independent checks and dependency order
- [x] Rules + records (`src/rules.js`, `tests/rules.test.mjs`). Input: actions and elapsed seconds. Output: bounded cooldowns, health, score and checkpoint. Verify normal and adversarial sequences with Node assertions. No renderer assumptions.
- [x] Authored levels + collision (`src/levels.js`, `src/physics.js`, `tests/levels.test.mjs`). Input: explicit positions and obstacle data. Output: traversable layouts and collision-limited movement. Verify all objectives reachable by flood fill and a sphere cannot cross wall bodies at dash speed.
- [x] Diorama renderer (`src/art.js`, `src/view.js`). Input: level definitions and current poses. Output: original 3D scenery, actor models and bounded effects. Verify captures at desktop/portrait/landscape, draw calls, triangles and repeated district disposal.
- [x] Combat + progression (`src/game.js`). Input: controls and simulated elapsed time. Output: readable attacks, pulses, kills, cells, upgrades, boss and ending. Verify kill/death/retry and a complete run, not a force-win path.
- [x] UI + audio + packaging (`src/ui.js`, `src/input.js`, `src/sound.js`, `src/main.js`, styles, scripts). Input: actual browser interaction. Output: all menus, safe audio lifecycle and production page at `/play/skift/`. Verify focus, touch cancellation, lost visibility, storage failure and nested-route assets.
- [x] Release (`tests/browser.mjs`, `evidence/`, README). Run Node suite and browser matrix; inspect captured images, test on the authorized Mac, record performance limits. Build ZIP, verify archive, preserve dependency licenses, provide local launch and integration instructions.

## Review focus
1. Pausing during a dash cannot leave input or invulnerability stuck; resume never advances hidden time.
2. Retry and replay cannot accumulate physics bodies, DOM listeners, WebGL resources or audio loops.
3. A corrupted or old localStorage value cannot crash title loading or unlock invalid array indices.
4. Touch controls must survive orientation changes and pointercancel without a stuck direction.
5. A tiny or slow viewport must keep controls usable and the gameplay clock honest; frame-rate choice is not a difficulty setting.

## Verification commands
`npm test`; `npm run build`; `npm run test:all`; `npm run test:package`.
The portable player is `python3 start.py`; the server binds only to loopback and opens the nested game route. No publication or repository write is part of this plan.

## Release handoff
The final directory includes the complete build, original assets, README, credits, integration and verification notes, and an archive-integrity test. The full local browser suite passed after the 4K pixel-budget correction. See VERIFICATION.md and evidence/ for measured scope and limitations. No live portfolio integration or deployment was attempted.
