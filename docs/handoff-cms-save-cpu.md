# CMS rapid-save CPU failure handoff

## Confirmed production cause

Cloudflare Worker tail captured `/admin/api/state`, `/save`, and `/recover` returning 503 with outcome `exceededCpu`, CPU time 10–12 ms, and `Worker exceeded CPU time limit.` These events explain the CMS's non-JSON response toast. Successful saves on the same production-shaped project had previously measured 410–503 ms CPU; the project snapshot was about 375 KB, with 14 pages and 240 cards. The observed 2–5 minute recovery interval is not established as a Cloudflare guarantee.

Read-only Cloudflare API evidence now confirms the account and omar-portfolio script use the Standard usage model. The active production deployment is still 100% Worker version 6e552399-5723-4741-b3f6-02a3d0d2f196 (version 200) from 2026-09-17; the branch upload is preview-only. Neither the active version nor the latest preview exposes an explicit cpu_ms override. The available token is not authorized for account subscription/billing endpoints, so Free-vs-Paid plan status and therefore the effective CPU allowance remain unverified. No billing, Worker-setting, or production deployment change was made. Local timings are not Cloudflare CPU measurements; the fix must not be called production-complete until the runtime-budget question is resolved and production is deployed and observed.

## Changes on `codex/cms-save-cpu-fix`

The branch contains the original 53edc21 checkpoint plus subsequent closeout fixes and verification. The final closeout commit is recorded by Git history; this document describes the verified tree rather than an earlier checkpoint.

- Save sends compact changes for persisted revisions, with full-project bootstrap at version 0. Server validation stays authoritative; legacy full saves and exact pending-save retries remain supported.
- API Save rejects extra top-level fields, including client-provided resource indexes. D1 publication retains CAS and idempotent replay checks; a deterministic concurrent-replay failure in resource-index writes was fixed with matching head/request guards.
- Draft save captures its exact submitted snapshot and owning Draft. A late response acknowledges only that intent, preserving subsequent edits and restored/recovered work. Recovery retains the unchanged pending intent for unknown-outcome replay; definitive 4xx other than 408 allows a corrected request.
- Active and inactive editor snapshots now use a scripting-disabled document parser with a template wrapper. Checks cover noscript, boolean/void markup, SVG and fragment roots. A synthetic active-container/nested-noscript failure was removed after checking actual eligibility: the real editor's protected noscript component and its ancestors have no editable/RTE target; updated R23 regression checks that real model chain.
- After validated Save, one server-derived resource map is reused by media checks, revision indexing and page-level publication font CSS. Card design fonts remain card-local. No persisted cache or schema change was added.

## Evidence and current gates

- Final npm run check: build/lint green; 217/217 fast tests and 1/1 slow test passed.
- Final focused resource gates passed 1/1 each: trusted reference-index reuse and API server-derived font-reference reuse.
- Final full Firefox CMS gate passed: browser helpers 20/20, main browser suite 39/39, interactions 4/4, review 8/8, final-review 7/7. Rapid inline Save returned HTTP 200 with one request and clean saved state.
- Final compatibility gate passed in both Firefox and WebKit. The compat runner now gives each engine separate module-result paths so concurrent evidence cannot overwrite the other engine's files; GrapesJS startup alone gets a 20 s compatibility timeout.
- The earlier synthetic nested-noscript active-container failure was replaced with the actual editor eligibility regression: the protected noscript component and its ancestor chain contain no editable/RTE target. The final serializer/module suites pass.
- The admin JavaScript budget is green at 349,996 gzip bytes against the unchanged < 350,000 cap. No limit was raised and no correctness guard was removed.
- Two final Firefox regressions were found and fixed during closeout. Reconcile rebuilt the project without sharedContent, causing the next delta Save to send sharedContent: null and receive 422; mergeProjects now three-way merges sharedContent, with a regression asserting the resulting delta passes server validation. A long edited hero text could also force the home grid wider than 1440 px; .hero-copy now has min-width:0, and the isolated/public-reload overflow regression plus the full Firefox suite pass.
- Final edge dry-run passed with Wrangler 4.131.1.
- Same production-shaped fixture remained 14 pages / 240 cards and 375,134-byte full Save versus 42,370-byte one-page delta. Three isolated final profiler runs produced a median-of-run-medians publishSite elapsed time of 211.98 ms versus the pre-scan-reuse 270.09 ms (~21.5% lower). Other final medians were validation 68.68 ms, one-page publication rendering 41.77 ms, gzip 7.76 ms and compressed read 60.27 ms. These are local elapsed measurements, not Worker CPU, and should not be used as a production CPU-limit claim.

Browser ownership during closeout remained Firefox/WebKit for parent CLI verification. Production was not touched.

## Remote handoff status

- Draft PR: [#7](https://github.com/omar-y-abdi/o-y-a/pull/7), branch codex/cms-save-cpu-fix.
- The previous GitHub Actions run 35931978202 was blocked before jobs started by the account billing/spending-limit state. No billing change was made.
- Cloudflare Git integration has uploaded branch previews, but the production deployment remains 100% version 6e552399-5723-4741-b3f6-02a3d0d2f196 (version 200) from 2026-09-17. No branch version was promoted.

## Remaining work

1. Verify the account's actual Workers Free/Paid entitlement or effective production CPU allowance with billing/plan access. The current token can read Worker settings/deployments but receives an authentication error for subscription/billing endpoints. Cloudflare documents 10 ms/request for Workers Free and 30 s default for Workers Paid; the observed 10–12 ms exceededCpu failures are consistent with a 10 ms ceiling but do not independently prove plan status.
2. Before any release claim, deploy only through the separately approved release flow and capture production Worker outcomes/CPU plus owner-CMS rapid Save, Restore, Revert and recovery evidence. No production deployment is authorized by this handoff.
3. GitHub-hosted CI remains an external gate if the account billing/spending-limit block still prevents Actions jobs from starting. Local/Worker-backed gates above are green, but a blocked hosted run is not a PASS.

## Relevant changed paths

`src/cms/api.mjs`, `src/cms/assets.mjs`, `src/cms/client/app.mjs`, `src/cms/client/backups.mjs`, `src/cms/client/draft.mjs`, `src/cms/client/live-text.mjs`, `src/cms/client/merge.mjs`, `src/cms/project-changes.mjs`, `src/cms/store.mjs`, `src/cms/theme.mjs`, `src/styles/home.css`, `scripts/test-cms-compat.mjs`, `scripts/test-cms-modules-parallel.mjs`, `tests/cms-api.test.mjs`, `tests/cms-draft.test.mjs`, `tests/cms-merge.test.mjs`, `tests/cms-modules.py`, `tests/cms-resources.test.mjs`, `tests/cms-save-boundaries.test.mjs`, `tests/cms-shared-conflict.test.mjs`, `tests/cms-store.test.mjs`, and the CMS module runner/helper changes.

No tests, commits, pushes, billing changes, or production deployments were performed by the subagent.
