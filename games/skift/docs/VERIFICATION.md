# SKIFT verification

## Recorded environment and scope

The complete suite was executed on the authorized Mac on **24 September 2026**. Browser versions recorded by the tools: Google Chrome **153.0.8010.54**, Playwright WebKit **26.6**, Playwright Firefox **155.0**. These are actual local browser runs, not claims about every release of Safari, Firefox, Chrome or every physical mobile device.

The source used for the final run contains the 4K resolution-budget correction: a minimum pixel-ratio floor previously overrode the one-million-pixel budget on large displays. The browser regression was observed failing, corrected in `src/view.js`, and then passed as part of the full suite.

## Verified checks

- **26 Node tests**: rule transitions, scoring, cooldowns, invulnerability, save corruption and blocked storage, district reachability, geometry batching, maximum-speed wall collision and deck containment.
- **16 browser checks**: startup, short key taps, movement, frozen pause, preferences, language, blur, repeated reload resource counts, no third-party requests, 4K pixel budget, portrait, simultaneous multi-touch movement/dash, landscape resize, compact controls, blocked storage and actionable missing-WebGL UI.
- Mouse-button chording and independent release were exercised separately.
- Four lifecycle cases: the title sleeps; real contact damage causes death and retry restores the checkpoint; changing the next-run difficulty does not rewrite a resumed run; lost WebGL context offers reload and retains the checkpoint.
- **Two complete campaigns**, normal and assist: browser keyboard events navigate all three districts, collect real cells, select upgrades, attack the boss and reach the actual victory screen. The bot reads diagnostic state and uses authored level data for navigation, but it does not write gameplay state, teleport, force a win or grant invulnerability. This proves a playable path, not the subjective quality of human play.
- **Six browser/viewport combinations**: Chrome, Firefox and WebKit at 1280×720 and 320×640. The Chrome touch suite additionally uses a mobile context and simultaneous touch events. Emulated touch is not physical-phone verification.

Desktop title, action, pause, district-three and compact mobile screenshots were visually inspected. The suite also produces the remaining images for independent review. Reports and selected screenshots are in `evidence/`.

## Measured performance, not a blanket hardware promise

The performance script runs at 1366×768 in Eco mode, with audio, held dash/pulse and ten seconds of measurement after warm-up. The recorded scenario is the first district; it is not a worst-case campaign soak.

| Measurement | Native CPU rate | Chrome 6× CPU slowdown |
| --- | ---: | ---: |
| Rendered frames / second | 29.99 | 30.09 |
| Ready after local navigation | 551 ms | 2,357 ms |
| Main-thread task time during roughly 10 s | 0.637 s | 3.340 s |
| Measured JavaScript heap | 8.23 MiB | 9.01 MiB |
| 95th percentile measured application-frame work | 2.2 ms | 14.2 ms |

Source: `evidence/performance.json`. The application-frame measurement surrounds simulation, UI work and renderer submission; it is **not complete GPU frame time**. The heap number is **not total browser, GPU or operating-system memory**. The slightly over-30 sample results from a finite interval and frame scheduling, not a higher configured cap.

CPU slowdown does not emulate a weaker GPU, limited physical RAM, battery drain or temperature. The test does not establish that every 8 GB computer stays cool. No temperature or long-duration battery measurement was made. Very slow frames have bounded simulation catch-up rather than an unlimited work backlog; under sustained overload the simulation may run slower than wall time.

The paused/hidden lifecycle tests verify that gameplay steps stop. Static shadows are updated when a district loads, geometry is batched by material, and projectile/particle counts are bounded. Source-level budgets are complementary to measurements, not substitutes for them.

## Reproduction

`npm ci`, install Google Chrome and the Playwright Firefox/WebKit binaries, then run `npm run test:all`. The verifier builds the page, starts a loopback server on a free port, runs the tests and shuts that server down. `npm run test:package` checks ZIP integrity, required source/runtime files, safe paths, executable Mac launcher and every manifest checksum. `npm run release` produces the ZIP and a checksum sidecar.

The built player, all audio and source are included. Development browser installations and `node_modules` are intentionally excluded. Publication into the live portfolio and testing against its eventual routing/security policy were not performed and are not represented as complete.

## Exact released-archive smoke

`tests/released.mjs` extracts the generated ZIP into a new temporary directory, starts its bundled Python launcher without installing anything into that directory, and drives Chrome against that extracted build. Startup, actual keyboard movement, dash, pulse, frozen pause, the 4K pixel budget and error-free asset requests passed. The archive SHA-256 is recorded in the external `evidence/released-archive.json` sidecar so that it can identify the ZIP without a circular embedded hash. The smoke now also runs at the end of `npm run release`.
