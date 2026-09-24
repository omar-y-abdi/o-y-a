# CMS rapid-save CPU failure handoff

## Confirmed production cause

Cloudflare Worker tail captured `/admin/api/state`, `/save`, and `/recover` returning 503 with outcome `exceededCpu`, CPU time 10–12 ms, and `Worker exceeded CPU time limit.` These events explain the CMS's non-JSON response toast. Successful saves on the same production-shaped project had previously measured 410–503 ms CPU; the project snapshot was about 375 KB, with 14 pages and 240 cards. The observed 2–5 minute recovery interval is not established as a Cloudflare guarantee.

The account plan and effective Worker CPU allowance remain unverified. No billing, Worker-setting, or production deployment change was made. Local timings are not Cloudflare CPU measurements; the fix must not be called production-complete until the runtime-budget question is resolved and production is deployed and observed.

## Changes on `codex/cms-save-cpu-fix`

Parent committed and pushed the code checkpoint as `53edc21`. This handoff document is subsequent documentation work and was not part of that commit.

- Save sends compact changes for persisted revisions, with full-project bootstrap at version 0. Server validation stays authoritative; legacy full saves and exact pending-save retries remain supported.
- API Save rejects extra top-level fields, including client-provided resource indexes. D1 publication retains CAS and idempotent replay checks; a deterministic concurrent-replay failure in resource-index writes was fixed with matching head/request guards.
- Draft save captures its exact submitted snapshot and owning Draft. A late response acknowledges only that intent, preserving subsequent edits and restored/recovered work. Recovery retains the unchanged pending intent for unknown-outcome replay; definitive 4xx other than 408 allows a corrected request.
- Active and inactive editor snapshots now use a scripting-disabled document parser with a template wrapper. Checks cover noscript, boolean/void markup, SVG and fragment roots. A synthetic active-container/nested-noscript failure was removed after checking actual eligibility: the real editor's protected noscript component and its ancestors have no editable/RTE target; updated R23 regression checks that real model chain.
- After validated Save, one server-derived resource map is reused by media checks, revision indexing and page-level publication font CSS. Card design fonts remain card-local. No persisted cache or schema change was added.

## Evidence and current gates

- Baseline `npm run test:fast`: parent reported 205/205 green. Later `node --test tests/cms-draft.test.mjs tests/cms-api.test.mjs` returned 7 pass / 2 expected RED failures before delta implementation; that was not the baseline.
- Targeted first-slice gate: parent reported 21/21 green before the version-0 bootstrap regressions were added. The later version-0 behavioral tests passed; the associated full suite then had only the admin bundle-size failure. No full suite was rerun after the latest resource-map changes.
- Worker-backed Firefox review suites: parent reported 14/14 green across two suites; this is not the CMS module count. The module log `output/cms-local/modules-serializer-firefox.log` recorded 23 module passes plus one managed-SVG fidelity pass. The updated R23 actual-editor eligibility/serialization regression passed 1/1. Edge dry-run passed. The aligned rapid inline edit/save diagnostic returned one HTTP 200 and a clean saved state.
- Local Chrome with the fresh local build: two rapid inline edits each saved once and showed clean versions v1/v2; Revert returned to clean v2; History Restore loaded v1 as a draft and Save published v3; an unsaved “Recovery after reload” edit survived reload/resume and Save published v4. This was an isolated local fixture only; production was untouched.
- Resource-map helper no-rescan test: parent reported 1/1 green. API font/media integration was reported green for delta and legacy Save, with page-global and card-specific font CSS and server-only reference indexing.
- Same-fixture local profiler, before/after scan reuse: `publishSite` median 270.09 ms → 205.38 ms (~24% lower elapsed time); validation 65.92 → 63.39 ms, render 41.07 → 40.35 ms, gzip 7.62 ms unchanged. Payload sizes remained 375,134 bytes full versus 42,370 bytes for one-page delta. These are local elapsed times, not Worker CPU.
- Latest full-check report: all behavior tests passed; only admin JavaScript gzip failed at 350,016 bytes against the fixed 350,000-byte cap. I then shortened two internal/client error messages without changing guards; parent must rerun build/assets budget. Do not raise the size cap or weaken validation.

Browser ownership: only the Luna High subagent runs Chrome; the parent owns CLI tests/builds, review and commit/push. Parent browser CLI suites use Firefox. The parent pushed the code checkpoint; user authorized a draft PR, not deployment or production release.

Diagnostic artifacts cited above live under ignored `output/cms-local/` and are local to the working copy, including `profile-before-scan-reuse.log`, `rapid-inline-diagnostic.log`, and `modules-serializer-firefox.log`. They are not committed. Raw production tail/auth material and production project exports were not committed; avoid copying secrets or private content into the PR.

## Remote handoff status

- Draft PR: [#7](https://github.com/omar-y-abdi/o-y-a/pull/7), head `ea2596c`. The PR description carries this handoff.
- GitHub Actions run [35931978202](https://github.com/omar-y-abdi/o-y-a/actions/runs/35931978202) did not start any of its three jobs. GitHub reported an account billing/spending-limit block. No billing change is authorized.
- Cloudflare’s PR check uploaded preview Worker version `24f47735-94bc-4a2e-bde6-b464ad21ddbe`; Wrangler still reports production at 100% version `6e552399-5723-4741-b3f6-02a3d0d2f196` from 2026-09-17. The push did not promote this change to production.

## Remaining work

1. Recheck the active/inactive noscript serialization test and real RTE eligibility after final build. RTE enable is guarded by `model.get('editable')`; base components default to false (`node_modules/grapesjs/dist/index.d.ts:6999`, `dist/grapes.mjs:36708`).
2. Recheck admin bundle gzip after the concise message changes; the previous failure was 16 bytes over the fixed 350,000-byte limit. Do not raise the limit or remove correctness guards.
3. Run focused resource tests, then the full quality gates against the final tree:
   - `node --test --test-name-pattern='trusted reference index' tests/cms-store.test.mjs`
   - `node --test --test-name-pattern='save reuses server-derived font references' tests/cms-api.test.mjs`
   - `CMS_BROWSER=firefox CMS_MODULE_PROFILE=smoke npm run test:cms:modules`
   - `npm run check`, `CMS_BROWSER=firefox npm run test:cms`, `npm run test:cms:compat`, `npm run edge:check:built`
   - Repeat the same production-shaped profiler after the final source changes; compare like-for-like elapsed stages only.
4. Obtain the user's runtime-budget decision or verify the effective deployed limit through authorized read-only account evidence. Do not purchase/upgrade, edit Cloudflare settings, or deploy without separate authorization.
5. Before release claims, deploy only through the approved release flow and capture production Worker outcomes/CPU plus owner-CMS rapid Save, Restore, Revert and recovery evidence. The initial production failure was caused by CPU exhaustion, but delta transport and local scan reductions alone do not prove the Worker stays within its actual limit.

## Relevant changed paths

`src/cms/api.mjs`, `src/cms/assets.mjs`, `src/cms/client/app.mjs`, `src/cms/client/backups.mjs`, `src/cms/client/draft.mjs`, `src/cms/client/live-text.mjs`, `src/cms/project-changes.mjs`, `src/cms/store.mjs`, `src/cms/theme.mjs`, `tests/cms-api.test.mjs`, `tests/cms-draft.test.mjs`, `tests/cms-modules.py`, `tests/cms-resources.test.mjs`, `tests/cms-save-boundaries.test.mjs`, `tests/cms-shared-conflict.test.mjs`, `tests/cms-store.test.mjs`, and the CMS module test runner/helper changes.

No tests, commits, pushes, billing changes, or production deployments were performed by the subagent.
