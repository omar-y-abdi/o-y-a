# Test the PR #2 unified package locally

The package `o-y-a-pr2-unified-20260914.zip` is based on the clean WIP commit `f159a2ae496dd48d8a858ef993f6342b0f734837`, not on a directory assembled from either older fixes ZIP. See [package selection and installation](CMS-UNIFIED-PACKAGE.md). It contains only changed/new source, configuration, migration, documentation and test files. No source file needs to be deleted. Generated `dist/` files are intentionally excluded: the normal build deletes obsolete hashed assets and recreates the complete directory. Do not deploy the copied source with stale `dist/` output.

## Install and run

Use Node **22.13 or newer** (CI uses Node 24). The local release checker uses Node's built-in SQLite parser; no extra npm dependency was added. In the repository root, after overlaying the ZIP:

```sh
node --version
npm ci
python3.13 -m venv .test-venv
source .test-venv/bin/activate
python -m pip install -r requirements-test.txt
python -m playwright install chromium firefox webkit

npm run quality &&
npm run test:cms &&
npm run test:cms:compat &&
npm run edge:check
```

Run these sequentially and stop if a command fails. `quality` already includes build, lint, Node tests, the public HTTP suite, public browser regressions and all 240 standard card exports. `test:cms` first runs the isolated real-module fixtures, then the original CMS browser/interactions suites **and both review suites** against an ephemeral, authenticated local Worker. `test:cms:compat` runs the module fixtures and targeted review suites in Firefox and WebKit. CI runs the same engine-specific module and review gates. These commands do not publish content or email to the real site. `edge:check` is a Wrangler **dry run**, not a deploy.

For a quicker focused rerun:

```sh
npm run check
npm run test:cms:modules
node scripts/test-cms.mjs tests/cms-review-browser.py tests/cms-review-final-browser.py
```

Do not set `BASE_URL` to a deployed site for the CMS review scripts. They require the isolated loopback Worker. Port overrides for the public suite remain `PUBLIC_TEST_PORT` and `ANALYTICS_TEST_PORT`. The scripts use the activated Python or `.test-venv/bin/python`.

## Evidence and failure interpretation

Node tests exercise actual local workerd/D1/R2 and offline image decoding. The module suite uses actual GrapesJS, public modules and PNG export in isolated DOM fixtures; it is not a substitute for HTTP navigation. It includes real keyboard input while the caret remains active, synthetic composition events, rich-text component identity and ID-specific CSS, surrogate pairs, links, line breaks, preview-source rejection and transformed PNG pixels.

The navigational suites cover same-profile draft isolation, incomplete recovery, expired sessions, 413/network retry behavior, metadata CAS, clone references, global resource slots, active input/reload/publication, rich-text reload, preview script readiness, two genuinely different WOFF2 files, historical font restoration, rotated-card preview/export and IndexedDB write failure with usable export.

Evidence is written beneath `output/logs/`, `output/visual/review/`, `output/visual/review-final/`, `output/cms-modules/`, `output/card-export/` and `artifacts/`. CI retains these. Do not treat a missing browser executable, blocked navigation or a failed setup as a passed test. Full browser acceptance must pass on your machine or GitHub before merge.

## Verified for the unified package (14 September 2026)

The clean baseline plus the unified source passed build, lint and **149/149 Node tests**, with no failures or skipped tests. All 145 test names from package A remain present; four new consolidation tests were added. The actual-product Chromium module suite passed **12/12 scenarios**, including PNG generation and decoding for **all 240 standard cards**. The local Node-adapter HTTP suite passed **19/19**. Wrangler dry runs passed with both production and staging configurations; they did not contact or deploy the live site.

Regression evidence was obtained before making the integrations: A clipped the marker outside a transformed root and allowed author CSS to affect fitting wrappers; its release checker accepted missing/unvalidated media references; its decoder accepted an HTTP-200 response containing HTML instead of image output. The consolidated tests reject those behaviors. A subsequent test found that B's disposable export lost inherited CSS variables and could retain the old viewport width; both cases were corrected. The export tests now verify actual colored pixels, intact overflowing content and an unchanged live preview, at desktop/mobile widths.

The Node run includes actual local workerd/D1/R2, two-instance backup/restore, real request/compressed-revision limits, offline image decoding, retained-revision compatibility and multiline-SQL release checking. Dependencies were reused from the supplied workspace and every direct installed version matched the locked project version; no dependency upgrade was made. Tested tools: Node 22.16.0, Python 3.13, Playwright 1.57 and system Chromium 144. This is not a claim of a new hosted CI run.

**Not verified here:** full navigating Chromium/Firefox/WebKit E2E, real OS IME behavior, or account-level deployment/sign-in/delivery. The normal loopback browser navigation attempt failed with `ERR_BLOCKED_BY_ADMINISTRATOR`; setup-dependent scenarios were blocked, not passed. All 240 exports did run in isolated module fixtures, but their public-page interaction flow still needs `quality` on a machine with normal browser navigation. Run the commands above before approving the PR.

## Three manual checks after the automated suites

In the local studio, type and paste formatted text without clicking outside it; confirm Save becomes available and backup status settles. Try a real OS IME, undo/redo, reload, page change, locked preview and export. Synthetic composition checks do not prove behavior of every OS input method.

At 200% browser zoom and in mobile width, use only Tab/Shift+Tab/Enter/Escape to reach page controls, backup export/import, media dialogs and Save; check visible focus and that dialogs return focus. Existing keyboard-block tests and browser-engine checks do not constitute a full accessibility audit.

Inspect actual PNG files, not only successful downloads: the 240 default cards and the custom rotated card must retain visible text, line breaks, root transforms and uncropped bounds. Compare desktop and mobile public views.

## Before deploying: new image-validation prerequisite

`migrations/0003_media_integrity.sql` and the **`CMS_IMAGES` binding** are required with this Worker. Local tests supply the binding through Miniflare and apply migrations automatically. For a deployed database, take a backup, apply migrations with its correct configuration, and verify Images availability before deploying. See [DEPLOYMENT.md](DEPLOYMENT.md).

Raster uploads now need container checks **and actual decoding** before registration. Original bytes are retained; a small transformed image is used only for validation. Older registered files are rechecked before they can be newly published. An existing broken historical URL is not silently deleted. Missing Images configuration, quota or service failure fails closed rather than approving unchecked bytes.

Cloudflare bills the binding as image transformations in deployment; local offline use does not incur usage charges. Its currently documented AVIF input support requires Enterprise, so passing the offline AVIF fixture is **not** evidence that your account accepts AVIF. Confirm entitlement on staging; unsupported input gets an explicit error instead of being published. Local offline Images does not implement all animation features: test real multi-frame GIF/WebP and the formats you intend to support in staging.

## Existing content and disaster recovery

HTML/CSS are now the single editor content source. Legacy editor JSON is checked when submitted but no longer persisted as a competing document. Opening an old revision with editor JSON offers a visible original-version export and an unsaved canonical draft; it never silently overwrites the stored revision. Keep that export before saving. Unsafe imported backups remain rejected with visible recovery/export controls.

The automated backup drill serializes D1 and retained R2 objects to a file, restores them into a second isolated instance of the same Worker, and checks current/historical content, object hashes, public bytes and re-publication. This is not proof that your real account's backups are complete.

Before a deployed release, retain D1 SQL export, **all** R2 objects required by retained revisions, object hashes, Worker commit/version and configuration identifiers (keep secrets in secure storage, not Git). Restore those to separate staging resources, run the read-only compatibility check below, then perform owner login, fresh anonymous reads, history restore and the real contact-delivery procedure. Use only a trusted SQL export: importing SQL is not a sandbox for arbitrary SQL programs.

```sh
node scripts/cms-check-release.mjs /path/to/trusted-d1-export.sql
```

This checks all retained revisions without the cached-validation shortcut, supports multiline SQL values, and requires each referenced media row to be registered and marked validation-ready using the same query as publication. The SQL check is read-only and cannot validate absent R2 object bytes. It does not claim that missing R2 bytes, image-service entitlements, OTP delivery or email inbox delivery can be established from SQL alone. A new template contract that rejects an old revision needs an explicit content migration; never bypass the check or delete history to turn the result green.

Sources: [Images binding and local fidelity](https://developers.cloudflare.com/images/optimization/binding/), [format limits](https://developers.cloudflare.com/images/get-started/limits/), [Images error codes](https://developers.cloudflare.com/images/reference/troubleshooting/).
