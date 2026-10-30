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
node scripts/test-cms-compat.mjs &&
npx playwright test tests/cms-editor.spec.mjs tests/cms-email.spec.mjs --project=chromium --no-deps --output=output/playwright/artifacts/editor &&
npx playwright test tests/cms-frame-public.spec.mjs tests/cms-frame-recovery.spec.mjs tests/cms-preview.spec.mjs tests/cms-browser.spec.mjs tests/cms-interactions.spec.mjs tests/cms-review-browser.spec.mjs tests/cms-review-final-browser.spec.mjs tests/cms-modules.spec.mjs tests/footer-cms-browser.spec.mjs tests/test_cms_browser_helpers.spec.mjs tests/test_cms_asset_usage.spec.mjs tests/cms-library.spec.mjs tests/managed-svg-fidelity.spec.mjs --project=chromium --no-deps --workers=2 --output=output/playwright/artifacts/functional &&
node --test --test-concurrency=1 games/skift/tests/*.test.mjs &&
npx playwright test --project=firefox --no-deps --output=output/playwright/artifacts/firefox &&
npx playwright test --project=webkit --no-deps --output=output/playwright/artifacts/webkit &&
npx wrangler deploy --dry-run --outdir artifacts/worker-build
```

`quality` builds, lints and runs all Node tests, including `tests/http-checks.test.mjs` against the real Worker. Its browser runner, `scripts/run-quality-browser.mjs`, owns one ephemeral public workerd fixture with local D1/R2 and the stored v185 publication, and runs the public Playwright gate against it. It then runs the public interaction spec (`tests/public-interactions.spec.mjs`, including the privacy dialog checks) and the revision spec (`tests/revision_browser.spec.mjs`). Those two specs start their own Workers, and the interaction spec includes an analytics-enabled one. All these Workers use port 0, and the runner closes its own in `finally`. The shell starts no background servers and probes no ports. The following commands run the CMS browser suites, footer regression and targeted compatibility, then finish with a Wrangler dry-run. CI also runs the editor and mail specs in Chromium, and the existing Firefox/WebKit project selections (editor, mail, public startup, CMS modules, managed SVG fidelity, browser helpers, asset usage, review and footer).

`npm run test:public-pages` runs three separate invocations: ordinary Chromium excluding the exhaustive export group; the same 240 exports alone with one worker; then the independent `chromium-webgl` project with one worker and `--no-deps`. The complementary export-group filters retain all other Chromium cases, including translated workshop controls. `npm run test:skift` runs only the game spec in the WebGL project. The public page matrix includes every page in v185 plus the code-owned SKIFT page, with the existing responsive and no-JavaScript checks.

Each invocation uses its own subdirectory under `output/playwright/artifacts/`, so later phases cannot erase earlier attachments. Retries are zero. The export phase retains fresh test contexts, the 8-second readiness deadline, all text/layout assertions and actual PNG checks. It is a content/export matrix, not a concurrent-load benchmark. Isolation changes workload overlap after distinct export pages became unavailable to DOM/DevTools observation while independent HTTP remained responsive. The underlying cause remains unknown; passing this arrangement does not prove concurrent-load performance or a production fix. Failed exports retain bounded HTTP and DOM/resource receipts plus poll progress. Only after failure, bounded browser CDP connections collect version/CPU samples and an independent geometry-free DOM read; late connections are detached. Poll state is recorded at the direct response and capture end, so later recovery is not misreported as the original cause. Successful tests have no additional diagnostic sessions, native tracing or console markers; ordinary Playwright tracing still records each test and retains failed runs; diagnostics never change a failed result. `tests/card-export.spec.mjs` sets trace `snapshots: false` at spec-file level, because full tracing stalled the matrix. It lowered the stall rate from about once per 350 exports to once in 2,934 across the recorded runs, which were not a controlled comparison. It does not remove the stall, and the root cause is unproven, so a red card job can still be this stall. The symptom is a card text poll that receives `undefined` while independent HTTP still answers. Without `CHROMIUM_PATH` or `PW_CHANNEL`, JavaScript Playwright uses its installed Chromium build. With `CARD_CORPUS=pr`, `tests/card-export.spec.mjs` exports a 24-card representative subset of `public/data/cards.json` (selected by `tests/helpers/card-corpus.mjs`) instead of the full bank. CI sets that variable for the `quality` job.

Public page and card-export specs create a published v185 Worker per Playwright worker and use its `runtime.url`. To use Playwright's managed `webServer` instead, set `PLAYWRIGHT_PORT` to an available port; it launches `scripts/cms-dev.mjs --public-tests` with the same v185 publication and production assets settings. `BASE_URL` selects an already managed local fixture. Specs with their own `cmsRuntime()` keep using port 0. The normal `npm run dev` and `npm run preview` commands publish the build's initial project instead; all storage stays local and ephemeral. `SKIP_CHECK=1 npm run quality` skips the build/lint/general Node gate but still runs `tests/http-checks.test.mjs` and `tests/revision-scroll.test.mjs` before the browser checks.

`test:cms` prepares the editor/public module fixtures and the library/navigation/transport cases, runs them with fresh page contexts in one Chromium worker, includes the main authenticated CMS suite (`tests/cms-browser.spec.mjs`), the interaction suite (`tests/cms-interactions.spec.mjs`) and the review and footer suites (`tests/cms-review-browser.spec.mjs`, `tests/cms-review-final-browser.spec.mjs` and `tests/footer-cms-browser.spec.mjs`). Each of those starts its own ephemeral Worker with real D1/R2 and signed RSA identity fixtures. There is no production authentication bypass. The local JWKS provider is replaced only in the harness. Cloudflare Access itself needs a separately authorized production check.

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

The former Python module, managed-SVG, browser-helper and asset-usage suites are replaced by Playwright specs: `tests/cms-modules.spec.mjs` (25 module cases; the `@modules-smoke` tag selects the smoke profile), `tests/managed-svg-fidelity.spec.mjs`, `tests/test_cms_browser_helpers.spec.mjs` and `tests/test_cms_asset_usage.spec.mjs`. Module PNGs and metrics use Playwright attachments. `scripts/test-cms-compat.mjs` writes a separate JSON result file for each engine under `output/playwright/`. CI does not run that script and has no separate module report: `functional-browser` and `editor-compatibility` run the module spec and retain `output/playwright/**`. `tests/cms-browser.spec.mjs` is the main CMS scenario gate. It has a first-publication variant that starts from an empty database and checks version 0, and an existing-publication variant that saves over a published version. Its fixture cookies are HttpOnly. `tests/cms-browser.py` remains only as a helper for the manual capture tool.

Focused commands after a build remain available directly:

```sh
node scripts/run-node-tests.mjs watch
npx playwright test tests/cms-modules.spec.mjs tests/managed-svg-fidelity.spec.mjs --project=chromium --no-deps --workers=1
npx playwright test tests/cms-review-browser.spec.mjs tests/cms-review-final-browser.spec.mjs tests/footer-cms-browser.spec.mjs --project=chromium --no-deps --workers=1
```

The HTTP-mode interaction and privacy checks are in `tests/public-interactions.spec.mjs`, and the revision checks are in `tests/revision_browser.spec.mjs`. Both start their own Workers through `tests/helpers/cms-runtime.mjs`.

## Python and manual tools

Normal verification does not use Python. The `quality`, `check`, `test:cms`, `test:public-pages`, `test:skift` and compatibility commands run Node and Playwright only.

Python is used only by these manual tools: `scripts/capture-cms.py`, `scripts/artwork.py`, `scripts/mail-art.py` and `tests/machine_depth.py`. `scripts/capture-cms.py` loads the helpers `tests/cms-browser.py` and `tests/contrast.py`. `scripts/artwork.py`, `tests/machine_depth.py` and `tests/contrast.py` import `tests/render_support.py`. Set them up in a virtual environment:

```sh
python3 -m venv .test-venv
. .test-venv/bin/activate
pip install -r requirements-test.txt
python -m playwright install chromium
```

`requirements-test.txt` pins Python Playwright only. `scripts/artwork.py` also needs CairoSVG and `scripts/mail-art.py` needs Pillow; neither is in that file.

The standalone SKIFT package in `games/skift` is separate from these commands. Its local server (`start.py`), audio script and release (`npm run release`) use the system `python3`.

## Build prerequisites

Neither `dist/` nor `.generated/` is tracked. Run commands from the repository root. `npm test` builds through `pretest`; `check` calls `npm test` after lint, while `check:fast` keeps its explicit build. `quality` calls `check` before starting servers. `dev`, `edge:check` and `deploy:cloudflare` also build first.

The following entry points do not run the site build themselves. Run `npm run build` successfully before each independent invocation, and rebuild after source changes:

| Entry point | Build dependency and additional prerequisite |
| --- | --- |
| `npm run preview`, `node scripts/cms-dev.mjs` | Built assets and the Worker's generated CMS seed. |
| `npm run test:slow`, `npm run test:cms`, direct `node --test tests/*.test.mjs`, `scripts/run-node-tests.mjs` modes | Node suites read built pages/assets or import the generated seed directly or through `tests/helpers/cms-runtime.mjs` and `tests/helpers/pre-agent-footer.mjs`. |
| `scripts/test-cms-compat.mjs` | Built assets and generated seed; Firefox and WebKit browsers installed. |
| `scripts/test-cms.mjs` (manual tool wrapper) | Built local Worker and generated seed. Runs the Python file it is given; see [Python and manual tools](#python-and-manual-tools). |
| Direct Playwright specs and `scripts/run-quality-browser.mjs` | Worker specs use built assets/seed and own port-0 fixtures by default. Setting `PLAYWRIGHT_PORT` enables Playwright's managed `webServer`; that configuration starts the built preview but does not build it. The quality runner owns one public fixture. |
| `tests/render_support.py` consumers: `tests/contrast.py`, `tests/machine_depth.py` (manual tools) | Built HTML, CSS and modules. |
| `node scripts/test-cms.mjs scripts/capture-cms.py` | Built local Worker and generated seed; the wrapper supplies the local identity. |
| `scripts/artwork.py`, `scripts/mail-art.py` | Built home HTML (artwork also uses built CSS through `render_support.py`). Optional Python tooling needs Playwright/Chromium plus CairoSVG for artwork or Pillow for mail art. These tools overwrite committed artwork in `public/`; run only for an intended artwork change, then rebuild. |
| `scripts/cms-check-release.mjs`, direct `scripts/cms-pull-release.mjs` | Generated seed matching the source being checked. The former takes a trusted local SQL file; the latter contacts D1 and belongs to the authorized release procedure. |

`SKIP_CHECK=1 npm run quality` skips its build and checks: use it only after a successful `npm run check` on the same source. `scripts/build-cms.mjs` is an internal build stage, called after public output exists by `scripts/build.mjs`; it is not a standalone build command.

One tool reads another project's output: the one-off `scripts/legacy-keys.mjs` needs the supplied `e5592bc` checkout built with that checkout's own source; a current build cannot replace that frozen input. Ordinary builds and verification do not regenerate the committed legacy map.

CI (`.github/workflows/ci.yml`) has these jobs:

- `quality` runs `npm run quality` with `CARD_CORPUS=pr`, the SKIFT Node tests in `games/skift/tests/*.test.mjs` (which the root Node runner does not discover), the Wrangler dry-run and the third-party notice check. `npm run quality` includes `tests/revision_browser.spec.mjs` and `tests/public-interactions.spec.mjs`.
- `functional-browser` runs the frame parity, frame recovery, preview, CMS browser, interaction, review, footer, module, browser helper, asset usage, library, managed SVG, editor and mail specs in Chromium with two workers and port-0 fixtures. `npm run test:cms` is a local command; its suites also run here.
- `editor-compatibility` runs the Firefox and WebKit project selections, one engine per matrix entry.
- `skift-release` runs `npm run release` in `games/skift` and retains the ZIP, its checksum and the browser receipt.
- `card-exports-full` runs all 240 card exports on the nightly schedule at 02:17 UTC, on pushes to `main` and on manual runs. On pull requests the job starts every time, but its export steps run only when card inputs changed. The nightly schedule runs no other job.
- `stored-revisions` runs only on manual `workflow_dispatch` and needs read-only D1 credentials.

No CI step needs a tracked copy of `dist/`.

## Repository maintenance regression checks

[tests/docs.test.mjs](../tests/docs.test.mjs) runs in the fast suite and checks npm build wiring, ignored/untracked `dist/`, the moved privacy document, relative links in the README and docs, including heading fragments, and that every script the docs name exists.

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

`scripts/capture-cms.py`, a manual Python tool (see [Python and manual tools](#python-and-manual-tools)), captures actual browser surfaces and each main section in desktop/mobile canvases. Run it with an isolated local Worker using:

```sh
node scripts/test-cms.mjs scripts/capture-cms.py
```

Screenshots are review inputs, not an automatic assertion of visual correctness. Compare the baseline and changed captures byte for byte, alongside the public identity dump; inspect any difference before accepting a public rendering change.

- `output/visual/studio/`: main studio states and section captures from the capture tool.
- `artifacts/screenshots/`: public responsive captures from `tests/public-pages.spec.mjs`.
- `output/playwright/artifacts/`: Playwright failure artifacts and retained card-export screenshots. PNG dimensions and layout are asserted by `tests/card-export.spec.mjs`; no separate card-export JSON report is written.
- `output/logs/cms-capture.log`: the capture tool's log, kept outside Git.
- `output/perf/`: the capture tool's admin readiness and contrast data.

The computed contrast audit checks text over simple solid backgrounds. It excludes disabled/decorative content and complex compositing; it is not a full WCAG certification. Admin readiness measurements include the harness's explicit stabilization waits, documented in the JSON, and must not be presented as pure network latency.

## Remote validation and release boundary

Local fixtures do not verify the owner's actual Cloudflare Access session, deployed CPU quotas, durable production Save, media visibility or history restore. Verify those outcomes separately under the release procedure; a successful Wrangler upload alone is insufficient.

The release instructions remain in [DEPLOYMENT.md](DEPLOYMENT.md). Neither mock contact responses nor a successful provider call prove email inbox delivery. No production mail, full accessibility certification or field-performance guarantee is claimed.

## Distribution and notice gates

Every root build checks tracked full third-party notices and actual browser bundle inputs. The `quality` job additionally checks the Wrangler Worker bundle. A separate `skift-release` job installs the game lockfile, builds and packages it, rebuilds its extracted source outside the repository, and exercises the actual ZIP in pinned Chromium. Its artifact includes the ZIP, checksum and browser receipt. Missing license text or a missing build input fails the gate.
