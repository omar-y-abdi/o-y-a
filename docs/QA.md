# Portfolio and CMS verification

Acceptance uses real HTTP navigation and the actual Cloudflare Worker runtime for CMS storage tests. Setup and manual checks are described in [CMS-LOCAL-VERIFICATION.md](CMS-LOCAL-VERIFICATION.md); release procedures are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Reproduce

Install dependencies and browsers as described in the README, then:

```sh
npm run check:fast &&
npx playwright test tests/cms-modules.spec.mjs --project=chromium --no-deps --workers=1 --grep @modules-smoke
```

This is the normal edit-feedback loop. It builds the current project once, prepares the pinned historical Worker fixture on its first run, lints, and runs the parallel ESM/Worker suite except the real two-runtime D1/R2 backup drill, then runs a focused GrapesJS smoke profile with fresh page contexts in one Chromium worker. It deliberately excludes the backup drill, exhaustive card exports, cross-browser compatibility and Wrangler dry-run. After a build, `npm run test:slow` runs the backup drill alone with one worker; `npm test` builds through `pretest` and includes that drill.

Full local verification uses explicit commands instead of another runner chain:

```sh
npm run quality &&
npm run test:cms &&
node scripts/test-footer-cms.mjs &&
node scripts/test-cms-compat.mjs &&
npx playwright test tests/cms-editor.spec.mjs tests/cms-email.spec.mjs --project=chromium --no-deps --output=output/playwright/artifacts/editor &&
npx playwright test tests/cms-frame-public.spec.mjs tests/cms-browser.spec.mjs tests/cms-interactions.spec.mjs tests/cms-review-browser.spec.mjs tests/cms-review-final-browser.spec.mjs tests/cms-modules.spec.mjs tests/footer-cms-browser.spec.mjs tests/test_cms_browser_helpers.spec.mjs tests/test_cms_asset_usage.spec.mjs tests/revision_browser.spec.mjs tests/cms-library.spec.mjs tests/managed-svg-fidelity.spec.mjs --project=chromium --no-deps --workers=2 --output=output/playwright/artifacts/functional &&
node --test --test-concurrency=1 games/skift/tests/*.test.mjs &&
npx playwright test --project=firefox --no-deps --output=output/playwright/artifacts/firefox &&
npx playwright test --project=webkit --no-deps --output=output/playwright/artifacts/webkit &&
npx wrangler deploy --dry-run --outdir artifacts/worker-build
```

`quality` builds, lints and runs all Node tests, including `tests/http-checks.test.mjs` against the real Worker. Its browser runner owns ephemeral public and analytics-enabled workerd fixtures with local D1/R2, publishes the stored v185 fixture, runs the public Playwright gate, then the remaining Python interaction, privacy and revision checks in order. Both Workers use port 0 and close in `finally`; the shell starts no background servers and probes no ports. The following commands run the CMS browser suites, footer regression and targeted compatibility, then finish with a Wrangler dry-run. CI also runs the editor and mail specs in Chromium, and the existing Firefox/WebKit project selections (editor, mail, public startup, CMS modules and managed SVG fidelity). Activate `.test-venv` first for the Python command in the quality shell script. Node browser runners honor `PYTHON`, then `.test-venv/bin/python`, then `python3`; lookup errors other than a missing venv stop the runner.

`npm run test:public-pages` runs three separate invocations: ordinary Chromium excluding the exhaustive export group; the same 240 exports alone with one worker; then the independent `chromium-webgl` project with one worker and `--no-deps`. The complementary export-group filters retain all other Chromium cases, including translated workshop controls. `npm run test:skift` runs only the game spec in the WebGL project. The public page matrix includes every page in v185 plus the code-owned SKIFT page, with the existing responsive and no-JavaScript checks. The former `browser.py --section pages` checks were already duplicated there; only that Python section was removed.

Each invocation uses its own subdirectory under `output/playwright/artifacts/`, so later phases cannot erase earlier attachments. Retries are zero. The export phase retains fresh test contexts, the 8-second readiness deadline, all text/layout assertions and actual PNG checks. It is a content/export matrix, not a concurrent-load benchmark. Isolation changes workload overlap after distinct export pages became unavailable to DOM/DevTools observation while independent HTTP remained responsive. The underlying cause remains unknown; passing this arrangement does not prove concurrent-load performance or a production fix. Failed exports retain bounded HTTP and DOM/resource receipts plus poll progress. Only after failure, bounded browser CDP connections collect version/CPU samples and an independent geometry-free DOM read; late connections are detached. Poll state is recorded at the direct response and capture end, so later recovery is not misreported as the original cause. Successful tests have no diagnostic sessions, tracing or console markers; diagnostics never change a failed result. Without `CHROMIUM_PATH` or `PW_CHANNEL`, JavaScript Playwright uses its installed Chromium build.

Public page and card-export specs create a published v185 Worker per Playwright worker and use its `runtime.url`. To use Playwright's managed `webServer` instead, set `PLAYWRIGHT_PORT` to an available port; it launches `scripts/cms-dev.mjs --public-tests` with the same v185 publication and production assets settings. `BASE_URL` selects an already managed local fixture. Specs with their own `cmsRuntime()` keep using port 0. The normal `npm run dev` and `npm run preview` commands publish the build's initial project instead; all storage stays local and ephemeral. `SKIP_CHECK=1 npm run quality` skips the build/lint/general Node gate but still runs the migrated HTTP suite before the browser checks.

`test:cms` prepares the editor/public module fixtures and the library/navigation/transport cases, runs them with fresh page contexts in one Chromium worker, then runs the authenticated CMS navigation suites in independent ephemeral Workers with real D1/R2 and signed RSA identity fixtures. There is no production authentication bypass. The local JWKS provider is replaced only in the harness. Cloudflare Access itself needs a separately authorized production check.

Additional public regressions after a build:

```sh
node --test tests/http-checks.test.mjs
npm run test:public-pages
npm run test:skift
node scripts/run-quality-browser.mjs
```

The HTTP suite uses `node:http` with a fresh connection per call, matching the former Python harness, so redirects and compressed wire bytes remain observable without keep-alive reuse. It checks published D1 HTML, resources, HEAD, security headers, real gzip, contact failure, aliases, Markdown, JSON errors, discovery and analytics availability/consent boundaries. Miniflare supplies the Analytics Engine binding interface with a no-op local writer; these checks verify HTTP responses, not event storage or remote delivery. Sitemap XML parsing uses the browser's native `DOMParser` in the public spec. Canonical CMS redirects are 307; the explicit language aliases remain 308. The old adapter alone appended `Vary: Accept-Encoding`; native local compression does not, so that mock-only header expectation was not carried over. `Vary: Accept` and raw gzip decoding remain checked. The existing routes retain their 100-byte Markdown minimum; the short owner pages `/ake/` and `/ekfr/`, absent from the old suite, have exact text expectations instead.

Markdown gzip is Cloudflare edge behaviour and is checked by the post-deploy live smoke in `scripts/smoke-live.mjs`.

The Worker-rendered v185 home has a 12,000-byte gzip cap: the recorded 9,428-byte published document plus at most 2,443 bytes for the phase-2 embedded runtime copy totals 11,871 bytes, rounded up. The separate 9,000-byte static-home cap remains in `tests/assets.test.mjs`. The HTTP check also requires the embedded runtime JSON to match the published project. Later removal of editing attributes has a separate size target; this cap describes the current phase.

Product browser checks navigate over real HTTP and load built modules. Declared renderer and helper unit fixtures use isolated documents and controlled transport objects; they do not substitute for the real Worker scenarios. Contact cases intercept only contact configuration, Turnstile and contact API requests with explicit test responses; no real message is sent. The exhaustive 240-card gate validates text/layout plus actual PNG output from the shared production renderer.

Setup, the engine matrix and verification limits are documented in [CMS-LOCAL-VERIFICATION.md](CMS-LOCAL-VERIFICATION.md). After a build, run `node scripts/test-cms-compat.mjs` for targeted Firefox/WebKit acceptance.

The former Python module and managed-SVG suites are retired after assertion review, paired execution in Chromium/Firefox/WebKit and targeted mutation checks. Their Playwright replacements retain all 25 module cases and the separate SVG comparison; the seven-case `@modules-smoke` selection matches the old smoke profile. Module cases run serially within their file. Other compatibility specs can still run concurrently, which remains subject to the normal CI gate. Module PNGs and metrics use Playwright attachments; the explicit compatibility runner gives each engine separate artifacts and JSON results. The CI module report is retained separately from later editor results. Other Python suites remain until their own qualification. The former 19 browser-helper tests and one delayed asset-usage test are also retired after paired three-engine runs and 15 mutations covering all 20 original cases. Their replacements add a clean-fixture regression and retain the separate real-studio delayed-response check. Library renderer unit fixtures start in a blank document to avoid callbacks from a discarded editor. The old Python card-export helper had no remaining consumers after module retirement and is removed; its qualified layout/export checks remain in the JavaScript module suite. Remaining full CMS Python suites still share `tests/cms-browser.py`.

Focused commands after a build remain available directly:

```sh
node scripts/run-node-tests.mjs watch
npx playwright test tests/cms-modules.spec.mjs tests/managed-svg-fidelity.spec.mjs --project=chromium --no-deps --workers=1
node scripts/test-cms-parallel.mjs
```

`tests/browser.py` retains interaction and privacy sections. For standalone HTTP use, pass both `--base-url` and `--analytics-url` (or `BASE_URL` and `ANALYTICS_URL`); the Node runner supplies its own ephemeral URLs automatically. `python tests/browser.py --render-only --screenshots` remains a document-rendering diagnostic for those sections. Other Python suites and their runners remain until their separate migrations.

## Build prerequisites

Neither `dist/` nor `.generated/` is tracked. Run commands from the repository root. `npm test` builds through `pretest`; `check` calls `npm test` after lint, while `check:fast` keeps its explicit build. `quality` calls `check` before starting servers. `dev`, `edge:check` and `deploy:cloudflare` also build first.

The following entry points do not run the site build themselves. Run `npm run build` successfully before each independent invocation, and rebuild after source changes:

| Entry point | Build dependency and additional prerequisite |
| --- | --- |
| `npm run preview`, `node scripts/cms-dev.mjs` | Built assets and the Worker's generated CMS seed. |
| `npm run test:slow`, `npm run test:cms`, direct `node --test tests/*.test.mjs`, `scripts/run-node-tests.mjs` modes | Node suites read built pages/assets or import the generated seed directly or through `tests/helpers/cms-runtime.mjs` and `tests/helpers/pre-agent-footer.mjs`. |
| `scripts/test-cms.mjs`, `test-cms-parallel.mjs`, `test-footer-cms.mjs`, `test-cms-compat.mjs` | Local Worker assets and generated seed; Python/browser setup from the README. |
| Direct Playwright specs and `scripts/run-quality-browser.mjs` | Worker specs use built assets/seed and own port-0 fixtures by default. Setting `PLAYWRIGHT_PORT` enables Playwright's managed `webServer`; that configuration starts the built preview but does not build it. The quality runner owns its public/analytics fixtures. |
| `tests/render_support.py` consumers: `tests/browser.py --render-only`, `tests/contrast.py`, `tests/machine_depth.py` | Built HTML, CSS and modules. HTTP modes of `tests/browser.py` and `tests/revision_browser.py` instead need preview servers started after the build. The former Python HTTP suite was replaced by `tests/http-checks.test.mjs`. |
| `node scripts/test-cms.mjs scripts/capture-cms.py` | Built local Worker and generated seed; the wrapper supplies the local identity. |
| `scripts/artwork.py`, `scripts/mail-art.py` | Built home HTML (artwork also uses built CSS through `render_support.py`). Optional Python tooling needs Playwright/Chromium plus CairoSVG for artwork or Pillow for mail art. These tools overwrite committed artwork in `public/`; run only for an intended artwork change, then rebuild. |
| `scripts/cms-check-release.mjs`, direct `scripts/cms-pull-release.mjs` | Generated seed matching the source being checked. The former takes a trusted local SQL file; the latter contacts D1 and belongs to the authorized release procedure. |

`SKIP_CHECK=1 npm run quality` skips its build and checks: use it only after a successful `npm run check` on the same source. `scripts/build-cms.mjs` is an internal build stage, called after public output exists by `scripts/build.mjs`; it is not a standalone build command.

One tool reads another project's output: the one-off `scripts/legacy-keys.mjs` needs the supplied `e5592bc` checkout built with that checkout's own source; a current build cannot replace that frozen input. Ordinary builds and verification do not regenerate the committed legacy map.

CI's `verify` job builds through `quality` before the dry-run and browser steps, and explicitly runs the nested `games/skift/tests/*.test.mjs` suite that the root Node runner does not discover. The `editor-compatibility`, `functional-browser` and manual `stored-revisions` jobs each have an explicit build before their consumers. The independent `functional-browser` job runs frame public parity, the functional browser ports, library and managed SVG regressions in Chromium with two workers and port-0 fixtures. Existing Python runners remain gates pending verified parity and retirement. No CI step needs a tracked copy of `dist/`.

## Repository maintenance regression checks

[tests/docs.test.mjs](../tests/docs.test.mjs) runs in the fast suite and checks npm build wiring, ignored/untracked `dist/`, the moved privacy document and relative links in the README and docs, including heading fragments.

## What is checked

| Layer | Evidence |
| --- | --- |
| Public build | Internal links, fragments, metadata, fixed CSP constants, absence of inline executable scripts, content-hashed entries/chunks and fixed transfer budgets |
| Owner boundary | Valid owner, wrong owner, missing/expired/invalid JWT, wrong issuer/audience, unsigned identity headers and missing configuration |
| Write boundary | Origin, content type, request marker, Fetch Metadata, route encoding and bounded bodies |
| Content | Active HTML, CSS escapes/imports/URLs, editor JSON execution fields, structural hooks, functional parents, image alternatives and links |
| Storage | Actual D1/R2, CAS conflicts, atomic rollback, idempotent retry, historical restore and private/public media transitions |
| CMS browser | Full original pages, independent mobile styles, text/Shift+Enter, repeated Save/Reload, pages, typography, fonts, media, wins and image export |
| Difficult editor cases | Keyboard block insertion, inline-style preservation, memory style after hydration/reset, real R2 image selection, archival recovery, locked win preview, two-tab conflicts and local draft recovery |
| Public browser | All routes and responsive widths, navigation, no-JS content, privacy choices, motion, four workshop stations and contact fixtures |

Public JavaScript has a combined 14,500-byte gzip cap. Home/workshop CSS has an 18,400-byte cap. Actual current headroom requires a build. Other page CSS remains capped at 14,000 bytes. The separate lazy win renderer/export cap stays 8,000 bytes and the current isolated admin cap stays 375,000 bytes. Static HTML budgets remain enforced in `tests/assets.test.mjs`; the published Worker home budget is checked by `tests/http-checks.test.mjs`. These are transfer-size contracts, not latency or field Core Web Vitals.

The public esbuild graph has separate hashed main and SKIFT bootstrap entries with shared copy state; the existing win renderer remains external and lazy. `tests/public-runtime.test.mjs` covers inert JSON escaping, preview precedence, missing/malformed-block fallback and failed copy loads. `tests/cms-store.test.mjs` checks one-query HTML/runtime reads, raw JSON preservation, data-read isolation and revision consistency; `tests/cms-api.test.mjs` checks the embedded data and retained API endpoint through the real Worker. `tests/public-render.test.mjs` checks the Worker-rendered v185 home against the 12,000-byte gzip HTML budget, including embedded copy, and isolates corrupt runtime rows from unrelated endpoints.

The public gate includes startup checks. To run them alone after building:

```sh
npx playwright test tests/public-startup.spec.mjs --project=chromium --project=firefox --project=webkit --workers=1
```

The Firefox and WebKit projects also select this file; run `npx playwright test --project=firefox --no-deps`, then the equivalent WebKit command, for the complete configured selections. Startup checks cover embedded-copy requests and CSP violations, real HTTP fallback, initialization while copy is delayed, and the SKIFT shell before its game import. Delayed-copy cases control only the fetch promise; they do not measure wall-clock latency or AbortSignal deadlines.

`tests/public-evidence.spec.mjs` remains a manual comparative evidence tool. It asserts readiness and image/game-control availability while capturing every stored v185 page at 390/1440 px, but it has no built-in baseline comparison. Functional startup coverage runs separately in CI; the frame parity spec performs its own comparisons there. The manual tool records SKIFT startup timing separately; game animation is not part of its screenshots. `identity.json` records status, headers and body SHA-256 for every stored page, code-owned SKIFT, sitemap and linked stylesheets, fetched at the canonical production URL inside the isolated local Worker. Run the same evidence file in baseline and changed checkouts with distinct `P2B_EVIDENCE_DIR` values; compare every PNG, properties JSON and `identity.json` byte for byte. `boot.json` includes its lab profile and resource timings; these local samples do not establish throttled-mobile targets. None of these requests reach production.

```sh
P2B_EVIDENCE_DIR=/tmp/p2b-after npx playwright test tests/public-evidence.spec.mjs --project=chromium --workers=1
```

## Visual evidence

`scripts/capture-cms.py` captures actual browser surfaces and each main section in desktop/mobile canvases. Run it with an isolated local Worker using:

```sh
node scripts/test-cms.mjs scripts/capture-cms.py
```

Screenshots are review inputs, not an automatic assertion of visual correctness. Compare the baseline and changed captures byte for byte, alongside the public identity dump; inspect any difference before accepting a public rendering change.

- `output/visual/studio/`: main studio states and section captures.
- `output/visual/cms/`: timestamped scenario evidence, including Shift+Enter.
- `artifacts/screenshots/`: public responsive captures.
- `output/playwright/artifacts/`: Playwright failure artifacts and retained card-export screenshots. PNG dimensions and layout are asserted by `tests/card-export.spec.mjs`; no separate card-export JSON report is written.
- `output/logs/`: complete test logs, kept outside Git.
- `output/perf/`: Lighthouse JSON and measured admin readiness/contrast data.

The computed contrast audit checks text over simple solid backgrounds. It excludes disabled/decorative content and complex compositing; it is not a full WCAG certification. Admin readiness measurements include the harness's explicit stabilization waits, documented in the JSON, and must not be presented as pure network latency.

## Remote validation and release boundary

Local fixtures do not verify the owner's actual Cloudflare Access session, deployed CPU quotas, durable production Save, media visibility or history restore. Verify those outcomes separately under the release procedure; a successful Wrangler upload alone is insufficient.

The release instructions remain in [DEPLOYMENT.md](DEPLOYMENT.md). Neither mock contact responses nor a successful provider call prove email inbox delivery. No production mail, full accessibility certification or field-performance guarantee is claimed.

## Distribution and notice gates

Every root build checks tracked full third-party notices and actual browser bundle inputs. The verify job additionally checks the Wrangler Worker bundle. A separate `skift-release` job installs the game lockfile, builds and packages it, rebuilds its extracted source outside the repository, and exercises the actual ZIP in pinned Chromium. Its artifact includes the ZIP, checksum and browser receipt. Missing license text or a missing build input fails the gate.
