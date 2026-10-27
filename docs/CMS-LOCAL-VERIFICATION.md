# Verify the portfolio and CMS locally

Start from the repository and the setup in [README.md](../README.md). Generated `dist/` and `.generated/` files are not tracked: the normal build deletes obsolete hashed assets and recreates the output. [QA.md](QA.md#build-prerequisites) lists build prerequisites for direct runners and manual tools. Do not deploy source with stale build output.

## Install and run

Use Node **24 or newer** (`.node-version` selects Node 24 locally and in CI). The local release checker uses Node's built-in SQLite parser. In the repository root:

```sh
node --version
npm ci
python3.13 -m venv .test-venv
source .test-venv/bin/activate
python -m pip install -r requirements-test.txt
python -m playwright install chromium firefox webkit

npm run quality &&
npm run test:cms &&
node scripts/test-cms-compat.mjs &&
npm run edge:check
```

Run these sequentially and stop if a command fails. `quality` already includes build, lint, Node tests, the public HTTP suite, public browser regressions and all 240 standard card exports. `test:cms` first runs the isolated real-module fixtures, then the original CMS browser/interactions suites **and both review suites** against an ephemeral, authenticated local Worker. `node scripts/test-cms-compat.mjs` runs the module fixtures and targeted review suites in Firefox and WebKit. CI runs the same engine-specific module and review gates. These commands do not publish content or email to the real site. `edge:check` is a Wrangler **dry run**, not a deploy.

The fast Node gate also prepares an immutable historical Worker fixture from commit `80630c7d280c71314702af791dbc0828d9ff8b0a`, using that revision's source, lockfile and build. It lives under `.generated/base-worker/` and supplies the actual old validator and publisher for deployment-compatibility regressions. A shallow checkout must first fetch that commit (`git fetch origin 80630c7d280c71314702af791dbc0828d9ff8b0a`). Its historical dependencies are isolated test evidence, never current release inputs. The root dependency audit applies to the current lockfile. A legacy-shaped project produced by current code is not a substitute for this fixture.

For a quicker focused rerun:

```sh
npm run check
node scripts/test-cms-modules-parallel.mjs
node scripts/test-cms.mjs tests/cms-review-browser.py tests/cms-review-final-browser.py
```

Do not set `BASE_URL` to a deployed site for the CMS review scripts. They require the isolated loopback Worker. Port overrides for the public suite remain `PUBLIC_TEST_PORT` and `ANALYTICS_TEST_PORT`. The scripts use the activated Python or `.test-venv/bin/python`.

## Evidence and failure interpretation

Node tests exercise actual local workerd/D1/R2 and offline image decoding. The module suite uses actual GrapesJS, public modules and PNG export in isolated DOM fixtures; it is not a substitute for HTTP navigation. It includes real keyboard input while the caret remains active, synthetic composition events, rich-text component identity and ID-specific CSS, surrogate pairs, links, line breaks, preview-source rejection and transformed PNG pixels.

The navigational suites cover same-profile draft isolation, incomplete recovery, expired sessions, 413/network retry behavior, metadata CAS, clone references, global resource slots, active input/reload/publication, rich-text reload, preview script readiness, two genuinely different WOFF2 files, historical font restoration, rotated-card preview/export and IndexedDB write failure with usable export.

Evidence is written beneath `output/logs/`, `output/visual/review/`, `output/visual/review-final/`, `output/cms-modules/`, `output/card-export/` and `artifacts/`. CI retains these. Do not treat a missing browser executable, blocked navigation or a failed setup as a passed test. Full browser acceptance must pass on your machine or GitHub before merge.

## Three manual checks after the automated suites

In the local studio, type and paste formatted text without clicking outside it; confirm Save becomes available and backup status settles. Try a real OS IME, undo/redo, reload, page change, locked preview and export. Synthetic composition checks do not prove behavior of every OS input method.

At 200% browser zoom and in mobile width, use only Tab/Shift+Tab/Enter/Escape to reach page controls, backup export/import, media dialogs and Save; check visible focus and that dialogs return focus. Existing keyboard-block tests and browser-engine checks do not constitute a full accessibility audit.

Inspect actual PNG files, not only successful downloads: the 240 default cards and the custom rotated card must retain visible text, line breaks, root transforms and uncropped bounds. Compare desktop and mobile public views.

## Before deploying: new image-validation prerequisite

`migrations/0003_media_integrity.sql` and the **`CMS_IMAGES` binding** are required with this Worker. Local tests supply the binding through Miniflare and apply migrations automatically. For a deployed database, take a backup, apply migrations with its correct configuration, and verify Images availability before deploying. See [DEPLOYMENT.md](DEPLOYMENT.md).

Raster uploads need container checks **and actual decoding** before registration. A small transformed image is used only for validation. Older registered files are rechecked before they can be newly published. An existing broken historical URL is not silently deleted. Missing Images configuration, quota or service failure fails closed rather than approving unchecked bytes.

Local offline Images checks do not establish the deployed account's entitlements or billing limits. Confirm supported formats and animation behavior through an authorized account/release check; unsupported input gets an explicit error instead of being published. Branch previews use production storage and are not an isolated staging environment.

## Existing content and disaster recovery

HTML/CSS are now the single editor content source. Legacy page and card editor JSON is ignored and discarded, not validated as a second content representation. Incoming JSON still counts toward the route's request-size limit. Restoring an old revision loads a normalized, unsaved draft; it never silently overwrites the stored revision. The draft can be exported through **Utkast & backup**, but that export is the project returned by the Worker, not a byte-for-byte backup of its original compressed D1 record. Keep a D1 backup for exact historical recovery. Unsafe canonical HTML/CSS in imported backups remains rejected with visible recovery/export controls.

The automated backup drill serializes D1 and retained R2 objects to a file, restores them into a second isolated instance of the same Worker, and checks current/historical content, object hashes, public bytes and re-publication. This is not proof that your real account's backups are complete.

Before a deployed release, retain a D1 backup, **all** R2 objects required by retained revisions, object hashes, Worker commit/version and configuration identifiers (keep secrets in secure storage, not Git). Follow the bookmark and local-copy rehearsal procedure in [DEPLOYMENT.md](DEPLOYMENT.md). Run the compatibility check below on a trusted local SQL copy. Owner login, deployed persistence and contact delivery are separate authorized release checks. Importing SQL is not a sandbox for arbitrary SQL programs.

```sh
npm run build &&
node scripts/cms-check-release.mjs /path/to/trusted-d1-export.sql
```

This checks all retained revisions without the cached-validation shortcut, supports multiline SQL values, and requires each referenced media row to be registered and marked validation-ready using the same query as publication. The SQL check is read-only and cannot validate absent R2 object bytes. It does not claim that missing R2 bytes, image-service entitlements, OTP delivery or email inbox delivery can be established from SQL alone. A new template contract that rejects an old revision needs an explicit content migration; never bypass the check or delete history to turn the result green.

Sources: [Images binding and local fidelity](https://developers.cloudflare.com/images/optimization/binding/), [format limits](https://developers.cloudflare.com/images/get-started/limits/), [Images error codes](https://developers.cloudflare.com/images/reference/troubleshooting/).
