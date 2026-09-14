# PR #2 unified package — 14 September 2026

Package: **`o-y-a-pr2-unified-20260914.zip`**. Baseline: `f159a2ae496dd48d8a858ef993f6342b0f734837` (the supplied `o-y-a.zip`). This supersedes both alternative fixes archives; it is not their mechanical union. Nothing has been pushed or deployed.

## Selected implementation

| Boundary | Selected solution and verification |
| --- | --- |
| Server, widgets, card slots | A's stricter parser/ID aliases/control cardinality/print-span identity and hidden-slot checks. All inherited tests retained, with closed-dialog and aria-hidden cases in the card contract test. |
| Active/inspector text and editor schema | A's live DOM snapshots, identity-preserving Unicode text edits, canonical HTML/CSS and visible original legacy export. Real typing/composition/model/style tests retained. |
| Preview trust | A's studio-owned srcdoc frame, unique reserved head record and schema checks. No second preview-data channel or incompatible helper remains. |
| Fitting and PNG export | B's isolated outer wrappers, descendant bounds and disposable export, retaining A's accepted text-container contract. New regressions cover overhang pixels, hostile universal wrapper CSS and live-preview non-mutation. Additional fixes preserve inherited custom properties and the current width during export. |
| Media readiness | B's shared `publicationMedia()` boundary, preserving A's readiness checks for every referenced media type. Publication, preview validation and read-only retained-revision compatibility use it. The API retains A's legacy byte revalidation; the SQL-only release checker does not claim to inspect R2. |
| Media decoder | A's supported-container/animation/pixel policy and bounded actual Images decoding, plus B's decoder-output WebP check. New tests cover HTTP-200 error output and signatures split across stream chunks. No arbitrary format-policy downgrade. |
| Release/backup | A's native SQLite multiline SQL import and two-instance D1/R2 drill. Missing/unvalidated media can no longer pass a release that publication would reject. |
| Browser coverage | A's original and review suites plus B's useful clone/all-card-export/preview-readiness cases, consolidated into one module harness. One launcher supports Chromium/Firefox/WebKit; zero selected module cases fails rather than silently passing. |

## One migration, not two

Only **`migrations/0003_media_integrity.sql`** is included, following 0001 and 0002. Do not also install the older `0003_media_validation.sql`: it performs the same `ALTER TABLE`. No second schema or compatibility alias is introduced.

## Installation boundary

Apply this ZIP to your clean WIP baseline. It contains only changed/new repository-relative files; unchanged files, fonts, dependencies and generated `dist/` are excluded. No baseline source file is deleted. The normal build clears obsolete generated hashes and reconstructs `dist/`.

Do **not** overlay it on a mixed directory containing both older ZIPs. Unreferenced alternate helpers/tests and the duplicate migration would remain. Preserve any local work and use a separate clean checkout of the baseline for verification. If an older migration has already been applied remotely, reconcile the actual migration history before changing deployed code; do not guess or run both migrations.

See [local verification](CMS-LOCAL-VERIFICATION.md) for setup and the complete test chain, and [deployment prerequisites](DEPLOYMENT.md) for Images, migrations and staging sign-off.

## What the test results establish

Fresh source runs passed build/lint and 149 Node tests, including all 145 inherited A tests. Twelve isolated Chromium scenarios passed, including actual PNG generation/decoding for all 240 standard cards. Nineteen HTTP checks and both Worker dry runs passed. Red/green tests specifically exercised the new consolidation failures rather than relying only on either package's original suite.

Normal browser navigation is blocked in the assembly environment. Full navigating E2E and Firefox/WebKit therefore still require the provided local/CI commands. No local result certifies OS IME/accessibility on every system, hosted D1/Images entitlements, live owner OTP, real inbox delivery, or production backups. No remote changes were made.
