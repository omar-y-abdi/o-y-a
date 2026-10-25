# PR14 verification, release, and documentation audit

> Frozen Luna Max review of maintenance `71b30dc` against main `80630c7`. Findings describe that source snapshot, not the current repaired tree. Current disposition and verification evidence are maintained in [ROOT-PLAN.md](ROOT-PLAN.md) and [ASTRA-PLAN.md](ASTRA-PLAN.md). Source line numbers refer to the frozen snapshot.

## Scope and evidence boundary

Read-only review of `the historical maintenance checkout` at `71b30dc18b073f310fed386bba7664d7afb77abf`, against `80630c7d280c71314702af791dbc0828d9ff8b0a`. The pinned HEAD matched. The only observed working-tree item was an existing untracked `node_modules/`; it was left untouched. No local test, build, server, install, application execution, deployment, data operation, or source edit was performed. No secret, environment file, cookie, or recovery data was read.

I reviewed the verification/release/documentation surfaces and the source seams those claims depend on. The full 359-entry path inventory is in [changed-files.tsv](changed-files.tsv); domain maps for provenance, server/data, and studio/public/game behavior are [01](01-inventory-provenance.md), [02](02-server-security-data.md), and [03](03-studio-public-game.md). This note supplements those maps; it does not convert static inspection into runtime evidence.

I read the existing GitHub Actions receipt with `gh run view 40230520836`. It is a successful pull-request run for the pinned head. `verify`, `functional-browser`, `editor-compatibility (firefox)`, and `editor-compatibility (webkit)` concluded success. `stored-revisions` was explicitly skipped because that job is manual-only. The run establishes that those registered jobs passed on that SHA. It does not establish product correctness, production-data compatibility, deployed output, live Worker behavior, or the external Workers Builds configuration.

## Verification and release findings

### VR-01 — P2: legacy v185 studio coverage stops short of the browser preview path

**Scenario.** A production database still contains a raw v185 revision. The authenticated owner opens the studio, which fetches and normalizes that stored project, previews it, and makes its first Save. A conversion that works in pure code or on an already converted fixture can still fail at one of those real Worker/client boundaries.

**Evidence.** The default `publicRuntime()` reads `tests/fixtures/cms-v185-project.json`, converts it with `toFrameProject` and `validateProject`, and only then publishes it (`tests/helpers/cms-runtime.mjs:52-55`). `scripts/run-quality-browser.mjs:37-38` uses that converted fixture for its public suite. That is appropriate post-migration public-state coverage, but it does not exercise old-revision ingress.

There is genuine partial raw-v185 Worker coverage: `tests/cms-template-drift.test.mjs:126-159` publishes raw v185 to Miniflare D1, calls authenticated `/admin/api/state`, constructs a Draft from the result, performs the first `/admin/api/save`, then reads and restores revision 1. This is a real Worker/API path, not a converted fixture. The test does not open the studio in a browser or call `/admin/api/preview` on that first legacy state. `tests/cms-legacy.test.mjs:35-60` covers state/revision/recovery on `legacyInitial`, not the v185 fixture. `tests/cms-frame-public.spec.mjs:340-380` puts raw v185 into D1 for public rendering/parity but does not exercise the studio. Other frame conversion and migration tests compare pure conversion/release behavior.

**Fix and pinning regression.** Preserve the existing post-migration public fixture. Add one authenticated browser test using a raw v185 D1 revision that opens `/admin/`, asserts the state delivered to the editor, loads an actual preview, performs the first Save, reloads, and checks the public response. Ensure the test setup preserves the raw stored bytes until the Worker read path sees them; calling the normal writer is suitable only if it is verified not to canonicalize the row first. This closes the remaining old-state UI seam without mislabeling the existing API coverage.

**Confidence.** High that the above browser preview case is absent from the inspected CI specs; high that the raw API read/first-Save path is partially covered.

### VR-02 — P2: the new standalone ZIP release is not a GitHub CI gate

**Scenario.** Root CI passes while the separately documented SKIFT ZIP path is broken: the subpackage's own lockfile/install/build differs, the allowlisted ZIP omits a required file, its launcher fails, or its extracted runtime has an asset error.

**Confirmed break.** The current archive allowlist omits a required build module. `games/skift/scripts/build.mjs:5` imports `./build-options.mjs`, but `games/skift/scripts/release.py:15-21` lists individual `scripts/` files and collects only `src`, `tests`, `docs`, `public`, and `dist` as recursive roots. It does not include `scripts/build-options.mjs`. The ZIP can therefore contain the documented `npm run build` command and its `build.mjs` entry point without the imported module; after unpacking, the standalone source rebuild fails with a missing module. `games/skift/tests/release_test.py:22-45` does not assert that the build import closure is packaged or attempt a rebuild from the extracted tree.

**CI gap.** Root CI runs `node --test --test-concurrency=1 games/skift/tests/*.test.mjs` (`.github/workflows/ci.yml:33-38`) and the root integrated site build/browser test jobs. It does not run `npm ci` or `npm run build` with `games/skift/` as the package root, nor does it invoke `tests/release_test.py`, `scripts/release.py`, or `tests/released.mjs` in that package. The game package exposes a distinct lock and release chain: `games/skift/package.json:7-18` defines `release` as unit checks, build, archive validation, ZIP creation, and extracted-browser smoke. The root `tests/skift-build.test.mjs:35-72` instead exercises the portfolio build in a scratch copy and checks mirrored dependency pins, game source inputs, audio bytes and source provenance.

**Fix and pinning regression.** Add the omitted build module to the explicit allowlist (or include the intended scripts tree), and strengthen the archive regression so every shipped build-time relative import resolves and `npm run build` succeeds from an extracted ZIP. Add a separate GitHub job that installs the game lock, builds, produces and checks the ZIP, then runs the extracted-package smoke using a pinned browser; alternatively narrow the handoff and remove the standalone source-rebuild promise. Keep the root portfolio build tests as a distinct gate: the root esbuild pin is 0.28.2 while the standalone game pin is 0.25.12 (`package.json:35-42`, `games/skift/package.json:20-27`). They prove different build paths.

**Confidence.** High on the omitted import and expected extracted-package build failure; high that CI omits the package/release chain. No ZIP was created or executed in this review.

### VR-03 — P2: full stored-history compatibility remains an optional, unobserved pre-release check

**Scenario.** The new Worker accepts the current head, but an older retained revision fails the new schema or template contract when an owner later opens/restores it. The standard deployment gate does not detect that because it checks only the head.

**Evidence and legitimate boundary.** `package.json:21` builds, runs `cms-pull-release.mjs` with its default head-only behavior, applies remote migrations, then deploys. The full-history check exists in `.github/workflows/ci.yml:155-180`, but it runs only on `workflow_dispatch`; it needs a D1 read token/account ID, requires exact reviewed error strings for the established historical versions, and never allowlists the head. Those credentials do not belong in ordinary PR CI. That secret boundary and exact-match exception policy are sound. The limitation is that the job is detached from PR/production deployment and may be skipped; run 40230520836 shows it **was skipped**. `docs/DEPLOYMENT.md:16-18` describes the owner workflow and says there is no checked-in verified inventory of exception messages.

**Fix and pinning regression.** Retain the secret-isolated manual workflow. For every contract/schema-changing production candidate, require an owner-run history receipt for the same candidate SHA and intended database before the production release; record the run/SHA and review of every exception with the release evidence. If history is intentionally not a required release gate, document the supported restore boundary and why. Do not claim the green PR run covers old stored revisions.

**Confidence.** High on gate wiring and skipped receipt; medium on production impact for any particular retained revision because no production history was read.

### VR-04 — P2: security and local-verification docs make false editor-JSON and body-limit claims

**Evidence.** `docs/CMS-SECURITY.md:19` says legacy editor JSON is type/security checked on import. `docs/CMS-LOCAL-VERIFICATION.md:61` says legacy editor JSON is checked when submitted. At this head, HTML/CSS are canonical and the legacy `project` JSON fields are discarded: `src/cms/legacy-project.mjs:79-84`, `src/cms/project.mjs:155-163`, and `tests/cms-legacy.test.mjs:9-32` prove that malformed or script-bearing unused JSON is not validated or persisted. This is an intentional boundary, not evidence of an exploitable path; the docs should state discard behavior.

`docs/CMS-SECURITY.md:29` says all request bodies have an 8 MiB cap and editor JSON is limited to 1 million characters. The code has a 4 MiB `readJson` default (`src/cms/http.mjs:60`), route-specific 8 MiB and 16 MiB calls (`src/cms/api.mjs:97,127,138,149,187,205`), and separate smaller email limits (`src/cms/email-api.mjs:229,244,269,344,391`). No editor-JSON character limit exists for data the application discards. Other limits in the paragraph are outside this finding.

**Fix and pinning regression.** Replace the editor-JSON claims with the actual discard/export/recovery contract and list limits by route or link to the source-owned route table. Add/retain a doc assertion over the security/limit wording so future edits do not reintroduce universal caps.

**Confidence.** High.

### VR-05 — P3: the resource guide exposes lifecycle controls that the built-in asset UI does not have

**Scenario.** An editor follows the guide expecting an in-built image/font to be available under Active, Archived, and Trash and tries to archive or permanently delete it. The current library has no such visible lifecycle interface for built-ins.

**Evidence.** `docs/CMS-GUIDE.md:30` applies the full lifecycle to “uploaded and built-in resources.” `src/cms/client/library.mjs:22-29` renders the lifecycle tabs only alongside uploads; `:63-64` suppresses lifecycle buttons for `asset.builtin`. `tests/cms-library.spec.mjs:45-59` checks that built-in resources have no media-state controls or archive/trash/delete actions. Built-in status APIs elsewhere do not make those controls available in this editor.

**Fix and pinning regression.** Say the lifecycle is for uploads and describe built-ins separately (code-owned sources with separately persisted metadata/status). Keep the existing UI test that pins the boundary.

**Confidence.** High.

### VR-06 — P3: the frame guide describes the retired multi-copy editing model

**Scenario.** An owner expects a footer edit on a page to fan out to linked page copies or Save to reject divergent copies. The current studio edits one shared frame, so those described operations do not match the current UI.

**Evidence.** `docs/CMS-GUIDE.md:40` describes one shared-content key, linked per-page tagline copies, fan-out edits and divergence rejection. Current schema-2 composition injects each page's main into one shared `project.frame` (`src/cms/client/frame-project.mjs:8-19`); `tests/cms-frame.test.mjs:134-149` asserts one footer in the frame and none in page bodies. Legacy shared-content normalization remains relevant to old schema conversion, so do not erase that migration history; label it as legacy behavior.

**Fix and pinning regression.** Explain that current edits change one shared frame; separately describe how old shared-content revisions are normalized and what owner migration/release gate applies. Keep the one-frame browser/API contract.

**Confidence.** High.

### VR-07 — P2: QA instructions name a deleted runner

`docs/QA.md:77` lists `node scripts/serve.mjs`, but `scripts/serve.mjs` is deleted and no replacement file exists. The same row has `npm run preview` and `node scripts/cms-dev.mjs`, either of which is current. The docs test only resolves relative Markdown links and headings in root README/docs (`tests/docs.test.mjs:35-49`); it does not validate inline command paths, so this broken instruction can pass CI.

**Fix and pinning regression.** Remove the deleted command and add a small docs check for referenced local script commands or keep the command list generated from `package.json`.

**Confidence.** High.

### VR-08 — P3: standalone game documents still claim the portfolio repository was untouched

The new game package's own docs and README contain pre-integration claims that are false in this repository: `games/skift/README.md:19` embeds the machine-specific path `the former machine-specific standalone directory`; `:46` says no repo files changed/no publication; `games/skift/CREDITS.md:5` says no repo changes, commits or deployments; `games/skift/docs/DESIGN.md:4` and `docs/PLAN.md:3,25-28` retain “do not touch/integrate the portfolio” and “no live portfolio integration” status. `games/skift/docs/INTEGRATION.md:15` partially updates the story by saying root builds this source directly, but the distributed docs as a whole still mix an old standalone snapshot with the current integrated package. `tests/docs.test.mjs` does not scan game package docs.

These statements need context, not wholesale deletion: historical standalone design/provenance and local ZIP instructions are useful. Remove the local absolute path; label the dated pre-integration claims as historical or rewrite them to distinguish standalone ZIP from the current portfolio integration. Explain that the CREDITS source path refers to the portfolio repository root and is not included as a game source file.

**Confidence.** High that the text is present and conflicts with the integrated repository history; the recorded old run itself is historical, not asserted false.

### VR-09 — P3 verification gap: generated game notices are only checked for non-emptiness

The current root generator explicitly includes Three.js, cannon-es, Howler and esbuild license text (`games/skift/scripts/build-portfolio.mjs:25-31`), and the standalone builder includes the same set (`games/skift/scripts/build.mjs:15-19`). However, root `tests/skift-build.test.mjs:61` checks generated notice files only with `trim()`; the ZIP test checks that one full-text notice path is present (`games/skift/tests/release_test.py:22-40`) but is not run in root CI. Removing all but one license section would still satisfy the root nonempty assertion. This is a release-integrity test gap, not evidence that a notice is currently missing.

Pin the expected package headings and their full source license text, or compare generated output to the locked package license files. Keep deleted tracked `public/play/skift/**`/ `dist/**` outputs deleted: they are stale generated mirrors, and the source build owns fresh output.

**Confidence.** High on assertion scope; no omission observed in the generator source.

## Test-port and assertion audit

The relevant case mapping is contract-by-contract, not an assertion-count claim:

| Former suite / helper | Current destination and CI registration | Static parity notes |
| --- | --- | --- |
| `tests/http_checks.py` | `tests/http-checks.test.mjs`; root `npm run quality` via `scripts/run-quality-browser.mjs` and Node suite | Route status, HEAD/body length, CSP/security headers, linked resources, contact fail-closed behavior, assets, custom 404, canonical redirects, sitemap/text discovery, Markdown negotiation, HTML fallback, JSON errors/OpenAPI, gzip, private paths, analytics/consent are represented. The local adapter is now a real Miniflare Worker with D1 rather than the previous Node adapter path. Canonical CMS redirects are intentionally 307 while language aliases remain 308. The old adapter's `Vary: Accept-Encoding` expectation was intentionally dropped; docs explain this at `docs/QA.md:48-50`. The replacement asserts `Vary: Accept` and decodes raw gzip when present. The post-deploy smoke checks edge Markdown gzip but only asserts `Vary: Accept`; no current receipt proves that smoke ran. This is a declared local/edge distinction, not a proven cache defect. |
| `tests/browser.py --section pages` | `tests/public-pages.spec.mjs` and the public cases in `tests/public-startup.spec.mjs`; `npm run test:public-pages` is invoked by root quality | The pages/size checks moved to Playwright; interactions/privacy remain in Python. Root browser runner `scripts/run-quality-browser.mjs:41-46` runs public E2E, original interactions/privacy Python sections, and original `revision_browser.py`. |
| `tests/cms-browser.py`, `cms-interactions.py`, `cms-modules.py`, `cms-review-browser.py`, `cms-review-final-browser.py`, `footer-cms-browser.py` | Original Python runners remain registered; new specs are separately registered under `.github/workflows/ci.yml:117-146` and `:91-100` | The ports use isolated Worker/port-0 fixtures; old Python gates remain in the verify/compatibility workflows. CI has not yet demonstrated runtime parity plus mutation proof, so retaining both is correct. The pure-module port does not replace the original source-to-worker suites. No case deletion is inferred from matching names or counts. |
| `tests/revision_browser.py` | Still invoked by root `run-quality-browser.mjs:45`; `tests/revision_browser.spec.mjs` is an additional browser spec | Original is retained while new schema/frame browser coverage is added. |
| `tests/test_cms_browser_helpers.py` | Original Python helper tests remain used by CMS runner; `tests/test_cms_browser_helpers.spec.mjs` is additional | No retirement or count-only parity claim. |
| `tests/card_export.py`, deleted `tests/test_card_export_helpers.py` | `tests/card-export.spec.mjs` runs all 240 actual card downloads inside `test:public-pages`; Python helper remains shared by CMS module coverage | The new real HTTP/browser/download path is stronger for the visible export flow. The old helper's `should_check_layout` used the same zero-size skip as the port. The new `assertLayout()` also returns when host/content dimensions are zero (`tests/card-export.spec.mjs:51-63`), so the layout assertions can silently be skipped while the PNG download and size checks pass. This is inherited behavior, not a newly removed assertion; pin expected non-zero boxes if layout proof is required. |
| `tests/email_render.py` | Deleted; `tests/email-render.test.mjs` adds renderer/template assertions and `tests/cms-email.spec.mjs` exercises the studio preview | The old Python visual renderer was not registered in the old `quality.sh` sequence. No CI loss is established. There is no registered browser check loading the actual outbound `renderEmail` HTML at responsive 360/680 px widths; only preview image load is run cross-engine, while compose cases intentionally run in Chromium. Add this only if outbound responsive rendering remains a release requirement. |

Other new and modified tests reviewed in the assigned surface include root suites for auth age, assets/build budgets, CMS API/content/assets/legacy/frame/migration/CPU/review/save/retention/media/prune, contact/email, documentation/lint/quality, public rendering/startup, Python registration and Wrangler configuration; the checked-in v185/email fixtures; plus `games/skift/tests/{art,game,levels,physics,rules}.test.mjs` and the standalone browser/release cases `browser.mjs`, `campaign.mjs`, `compatibility.mjs`, `input.mjs`, `lifecycle.mjs`, `performance.mjs`, `release_test.py`, `released.mjs`, and `smoke.mjs`. Their full paths are in the sidecar manifest. None were executed in this review.

### Skips, timeout changes, and fixture independence

Static inspection found no new test skip or retry used to hide an assertion failure. Playwright retries remain zero (`playwright.config.mjs:11-15`). The email non-Chromium skips are scoped to compose/storage interactions; the preview-image case runs in each configured browser (`playwright.config.mjs:41-43`, `tests/cms-email.spec.mjs:65-80,95-96`). CI constrains WebKit to one worker while retaining its default deadlines (`.github/workflows/ci.yml:91-97`); the comments explain resource isolation after concurrent stalls. The longer SKIFT scenario has a larger timeout but retains the game-flow assertions. I found no failure-path assertion removed based on the changed scripts/tests read.

The frozen `tests/fixtures/cms-v185-project.json` is a checked-in historical snapshot used for conversion and comparison; the current build does not regenerate it. `tests/skift-build.test.mjs` edits a scratch source copy before building. No circular current-output-as-only-baseline pattern was found. Static source review does not replace mutation testing or a same-SHA run.

## Build, deploy, migration, rollback, and CLI boundaries

- Root `npm test` builds through `pretest`; `npm run check` is lint then `npm test` (`package.json:10-25`). The root Node runner selects only root `tests/*.test.mjs` (`scripts/run-node-tests.mjs:7-18`), and CI adds a separate five-file game unit glob (`.github/workflows/ci.yml:33-38`). Root CI builds before the Wrangler dry run and each browser consumer. The Workers asset directory `./dist` is ignored/generated; `scripts/build.mjs` owns it and the CMS seed; the production package command builds before checking head compatibility, applying migrations and deploying (`package.json:21-23`, `wrangler.jsonc`). Keep the removal of tracked `dist/**` and the old `public/play/skift/**` mirror.
- `games/skift/package.json` has Node >=20 and esbuild 0.25.12; the root package has Node >=24 and esbuild 0.28.2. This is an intentional dual toolchain documented in `docs/SKIFT.md`; byte-identical bundles are not claimed. The current root workflow proves the integrated root build only. Whether Cloudflare Workers Builds installs devDependencies and uses the documented Node/deploy commands is external dashboard state not verifiable in this repo review. `docs/DEPLOYMENT.md:7-14` explicitly tells the owner to check the dashboard. Treat that as an open release check, not a discovered failure.
- The repo's `smoke-live.mjs` is a post-deploy check against the public origin; it is not a CI job. The inspected green run did not invoke it. A Wrangler dry run validates build/deploy packaging, not live routes, Cloudflare edge compression, deployed D1 schema, Images entitlement, email delivery, or post-deploy rollback.
- Frame migration/release tooling is source-guarded: `cms-migrate-frame.mjs` checks version/hash, validates a candidate against the current seed, requires CAS values for apply, restricts production origin and rejects redirects; `cms-prune-rendered.mjs` defaults to dry-run and requires explicit account-write budget for apply; `cms-strip-media.mjs` preflights all media, uses deterministic IDs, verifies R2 readback and preserves original bytes/references; `cms-pull-release.mjs` uses the Worker read path and exact exceptions. In the inspected CLI call sites, commands are passed as argument arrays rather than through a shell string, and the media tool constrains the origin/path scope. This is static review only; none of these owner/data tools were invoked.
- `docs/DEPLOYMENT.md:3,9-18,30-55` correctly distinguishes the external Workers Build, head-only automated gate, schema migrations, manual historical gate, D1 backup/rehearsal, and R2/rollback coordination. A push-to-main deployment statement depends on external Cloudflare configuration; the repo cannot prove that configuration or whether Cloudflare waits for GitHub status checks.
- `wrangler.staging.jsonc` deletion is coherent with the docs' explicit single-production Worker model and the warning that branches share production D1/R2. Do not reintroduce a fake staging config without isolated backing resources.

## Moves and deletions: retain or restore

| Change | Recommendation | Reason |
| --- | --- | --- |
| 61 generated `dist/**` files and 16 old `public/play/skift/**` files | Retain deletion | Root build owns fresh, hashed output and legal notices. Keeping stale generated copies tracked would reintroduce deployment ambiguity. |
| 11 exact SKIFT audio moves from old generated `dist/play/skift/audio/` into `games/skift/public/audio/` | Retain moves | They are byte-identical source assets moved beside authored game code; root build copies them into output. |
| `docs/revision/PRIVACY-DECISIONS.md` → `docs/PRIVACY-DECISIONS.md` | Retain exact move | Content is unchanged; current docs/tests use the new maintained path. |
| Deleted `scripts/import-skift.mjs` | Retain deletion | Replaced by source compilation and a portfolio adapter; do not restore imported minified release logic. |
| Deleted `scripts/serve.mjs` | Retain deletion; fix `docs/QA.md:77` | Current `preview`/Worker runner is the source-of-truth; only stale operator text depends on the removed script. |
| Deleted `wrangler.staging.jsonc` | Retain deletion | There is no isolated staging database/bucket. A config pointing at production bindings would create false isolation. |
| Deleted historical plans, generated JSON snapshots, screenshots and handoffs | Do not restore wholesale | They are not build inputs; most are dated or locally generated. Keep the current removal. The deleted `docs/SOURCES.md` was a broader site provenance ledger; game-only `CREDITS.md` does not replace it. If current provenance must remain maintained, add a concise, current site-source ledger rather than restoring stale plans/screenshots. See the provenance map. |

No cosmetic file move or deleted generated artifact should be reverted as a cleanup tactic. Split the eventual clean history by coherent reviewer surface: (1) source-build/provenance plus generated-output retirement, (2) CMS frame/data migrations and release tooling, (3) test ports with old runners retained and registrations explicit, (4) standalone game package/release surface, (5) current docs and runbooks. Keep the history free of temporary generated bundles and one-off polishing.

## Gaps and counterevidence

- No local execution or side-by-side mutation proof was authorized for this mapper; all local behavior remains unverified here.
- No production D1 history, R2 object, Cloudflare Workers Builds dashboard, branch protection, live Worker or contact inbox was inspected. The existing manual gate's secret boundary is legitimate; the evidence gap is optional execution/tie-in, not a recommendation to put credentials in PR CI.
- Most ported Python CMS suites and their new Playwright counterparts are both registered. That is meaningful parity scaffolding and a reason not to call this a broad test deletion.
- The old adapter-specific `Vary: Accept-Encoding` assertion is documented as omitted from the local Worker test; no missing edge gzip assertion is inferred from that alone.
- License files are explicitly generated in current build source. Only test coverage is weak; no present missing-notice finding is established.
- `CMS-GUIDE.md:36` correctly says the SKIFT page is code-owned. The runtime copy and language landing strings remain editable as described elsewhere; do not “fix” line 36 back to the old CMS page model.

## Required GitHub verification after repairs

1. On the final clean candidate SHA, inspect the PR workflow receipt and require successful `verify`, `functional-browser`, `editor-compatibility (firefox)`, and `editor-compatibility (webkit)`. Confirm the action head SHA matches the candidate and retain evidence artifacts. A skipped job is not a pass.
2. Run the manual `stored-revisions` workflow at that same reviewed candidate SHA with the owner-created exact exception input; verify the gate never tolerates the current head and record the reviewed revision/error mapping and run ID in release evidence.
3. Add/register the raw-v185 authenticated studio browser case and verify it passes through real Miniflare Worker/D1/browser navigation, including state, preview, first Save, reload and public response. Keep the separate post-migration public fixture case.
4. Add/register a standalone SKIFT package verification job if the ZIP remains a supported artifact. Require package-lock install, package build/archive checks, and extracted-ZIP browser smoke. Pin the installed browser and preserve the ZIP checksum/report as CI evidence.
5. Before production publication, separately confirm Cloudflare Workers Builds uses the documented root Node/install/deploy settings and establish the intended relationship to required GitHub status checks. Keep D1 bookmark/copy rehearsal, migrations, CMS compatibility gate and rollback Worker/schema plan as documented. After an authorized deploy, run the post-deploy live smoke against the deployed SHA; do not substitute a dry-run or prior run for this evidence.


## Assigned-surface path ledger

This ledger names the changed files in the verification/release/docs surface. The full tracked diff inventory, including all game/client/server sources and generated-output retirements, remains in `changed-files.tsv`.

**Workflow, package, build and deployment configuration**

- `.github/workflows/ci.yml`, `.gitignore`, `.node-version`, `README.md`, `package.json`, `package-lock.json`, `playwright.config.mjs`, `wrangler.jsonc`.
- Root runners/build/release tools: `scripts/build-cms.mjs`, `scripts/build.mjs`, `scripts/cms-check-release.mjs`, `scripts/cms-dev.mjs`, `scripts/cms-migrate-frame.mjs`, `scripts/cms-prune-rendered.mjs`, `scripts/cms-pull-release.mjs`, `scripts/cms-release-errors.mjs`, `scripts/cms-strip-media.mjs`, `scripts/legacy-keys.mjs`, `scripts/lint.mjs`, `scripts/quality.sh`, `scripts/run-quality-browser.mjs`, `scripts/smoke-live.mjs`, `scripts/test-cms-compat.mjs`, `scripts/test-cms-modules-parallel.mjs`, `scripts/test-cms-modules.mjs`, `scripts/test-cms-parallel.mjs`, `scripts/test-cms.mjs`, `scripts/test-footer-cms.mjs`, `scripts/test-python.mjs`. Deleted: `scripts/import-skift.mjs`, `scripts/prepare-footer-migration.mjs`, `scripts/serve.mjs`.
- SKIFT build/release/launcher: `games/skift/package.json`, `games/skift/package-lock.json`, `games/skift/scripts/audio.py`, `games/skift/scripts/build-options.mjs`, `games/skift/scripts/build-portfolio.mjs`, `games/skift/scripts/build.mjs`, `games/skift/scripts/release.py`, `games/skift/scripts/verify.mjs`, `games/skift/start.py`.

**Changed root tests and helpers**

`tests/agent-readiness.test.mjs`, `assets.test.mjs`, `auth-token-age.test.mjs`, `browser.py`, `card-export.spec.mjs`, `card_export.py`, `cms-api.test.mjs`, `cms-assets.test.mjs`, `cms-browser.py`, `cms-browser.spec.mjs`, `cms-consent-css.test.mjs`, `cms-content.test.mjs`, `cms-cpu-budget.test.mjs`, `cms-draft.test.mjs`, `cms-editor-usability.test.mjs`, `cms-editor.spec.mjs`, `cms-email.spec.mjs`, `cms-frame-gate.test.mjs`, `cms-frame-initial.test.mjs`, `cms-frame-migration.test.mjs`, `cms-frame-public.spec.mjs`, `cms-frame.test.mjs`, `cms-home-responsive.test.mjs`, `cms-hotfix.test.mjs`, `cms-interactions.py`, `cms-interactions.spec.mjs`, `cms-legacy.test.mjs`, `cms-library-api.test.mjs`, `cms-library.spec.mjs`, `cms-library.test.mjs`, `cms-manipulation.test.mjs`, `cms-modules.py`, `cms-modules.spec.mjs`, `cms-position.test.mjs`, `cms-project.test.mjs`, `cms-prune-rendered.test.mjs`, `cms-release-errors.test.mjs`, `cms-rendered-retention.test.mjs`, `cms-review-browser.py`, `cms-review-browser.spec.mjs`, `cms-review-final-browser.spec.mjs`, `cms-review-final.test.mjs`, `cms-review.test.mjs`, `cms-save-boundaries.test.mjs`, `cms-shared-conflict.test.mjs`, `cms-store.test.mjs`, `cms-strip-media.test.mjs`, `cms-template-drift.test.mjs`, `cms-usability.test.mjs`, `contact-secrets.test.mjs`, `contact.test.mjs`, `docs.test.mjs`, `email-api.test.mjs`, `email-model.test.mjs`, `email-render.test.mjs`, `email-validate.test.mjs`, `footer-cms-browser.py`, `footer-cms-browser.spec.mjs`, `footer-cms.test.mjs`, `foundation.test.mjs`, `http-checks.test.mjs`, `lint.test.mjs`, `managed-svg-fidelity.spec.mjs`, `public-evidence.spec.mjs`, `public-pages.spec.mjs`, `public-render.test.mjs`, `public-runtime.test.mjs`, `public-startup.spec.mjs`, `quality-gates.test.mjs`, `raster-metadata.test.mjs`, `revision_browser.spec.mjs`, `shared-content-lifecycle.test.mjs`, `skift-build.test.mjs`, `skift.spec.mjs`, `skift.test.mjs`, `stored-revisions.test.mjs`, `test-python.test.mjs`, `test_cms_asset_usage.spec.mjs`, `test_cms_browser_helpers.py`, `test_cms_browser_helpers.spec.mjs`, and `wrangler-config.test.mjs`. Deleted: `tests/email_render.py`, `tests/http_checks.py`, and `tests/test_card_export_helpers.py`.

Changed test fixtures: `tests/fixtures/cms-v185-project.json`; email fixtures `tests/fixtures/email/{notification-empty.html,notification-empty.subject,notification-empty.txt,notification.html,notification.subject,notification.txt,receipt.html,receipt.subject,receipt.txt}`.

Changed browser/module helpers: `tests/helpers/cms-browser-library.mjs`, `cms-browser-qa.mjs`, `cms-module-entry.mjs`, `cms-runtime.mjs`, `modules-card-export.mjs`, `modules-runtime.mjs`, `pre-agent-footer.mjs`, `public-test.mjs`, `review-browser.mjs`, and `revision-scroll.mjs`.

Changed SKIFT tests: `games/skift/tests/{art.test.mjs,browser.mjs,campaign.mjs,compatibility.mjs,game.test.mjs,input.mjs,levels.test.mjs,lifecycle.mjs,performance.mjs,physics.test.mjs,release_test.py,released.mjs,rules.test.mjs,smoke.mjs}`.

**Changed user and release documentation**

Updated/moved: `docs/CMS-DESIGN.md`, `docs/CMS-FRAME-MIGRATION.md`, `docs/CMS-GUIDE.md`, `docs/CMS-LOCAL-VERIFICATION.md`, `docs/CMS-SECURITY.md`, `docs/CONTACT-SETUP.md`, `docs/DEPLOYMENT.md`, `docs/DESIGN.md`, `docs/MACHINE-DEPTH.md`, `docs/PRIVACY-DECISIONS.md` (exact move from `docs/revision/`), `docs/QA.md`, `docs/SKIFT.md`, `games/skift/README.md`, `games/skift/CREDITS.md`, `games/skift/docs/{DESIGN.md,INTEGRATION.md,PLAN.md,VERIFICATION.md}`. Deleted documentation/evidence paths are fully itemized in the inventory map; notable removal/replacement interactions here are `docs/SOURCES.md`, `docs/PLAN.md`, `docs/ENVIRONMENT.json`, `docs/ASSET-SIZES.json`, `docs/revision/CHANGES.md`, `docs/revision/FILE-HASHES.json`, old CMS screenshots and dated CMS plans/handoffs.
