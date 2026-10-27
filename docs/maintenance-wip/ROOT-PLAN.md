# Remaining maintenance work: root plan

## Paused at the owner's request, 2026-10-28

The owner has approximately 5% of the weekly allowance left and requested a WIP PR, updated continuation documents and idle. Stop after pushing this checkpoint. Do not continue implementation, start more agents, merge, deploy, or run production migrations while paused. When the owner resumes, continue the **entire original WIP queue**, with root and the same Astra peer (`/root/astra_cleanup_peer`), not only mail setup or PR15 repairs.

### Branch and evidence checkpoint

- Merged baseline: `origin/main` was `550383c449cf4d57eea4762122df8e88be710734`; its tree equals the qualified PR15 cleanup. PR15 is already merged. Recheck remote state before resuming.
- [PR16](https://github.com/omar-y-abdi/o-y-a/pull/16), branch `maintenance-wip`, HEAD `604e73b2e17223ec664bb89736b41e58a78a6d81`: fifteen public interaction/privacy ports, eleven scroll/fika ports, and failure-only Linux browser process evidence. Exact-head [run 40596401633](https://github.com/omar-y-abdi/o-y-a/actions/runs/40596401633) passed verify, functional-browser, Firefox, WebKit and SKIFT release; Cloudflare Builds also succeeded. Manual stored-revisions was skipped. PR16 is not merged.
- The new WIP PR uses `maintenance-wip-cpu` and is based on `maintenance-wip`, so review/merge PR16 first. It includes canonical storage (`66b78e3`), target-preview changes and the independently reviewed B9 bounded-body refactor. The PR is intentionally a draft; existing-head migration and whole-handler CPU qualification are incomplete.
- Active integration checkout: `.claude/worktrees/maintenance-wip-cpu`. Root's B9 source checkpoint also remains on `maintenance-wip-http` at `995bd83`; its commit is integrated into the WIP branch. `maintenance-wip-qa` starts at that B9 checkpoint and contains only ignored parity preparation, no additional tracked implementation. Rebase that branch onto the final CPU branch before further QA/CI commits. Preserve all original dirty Claude worktrees and historical `maintenance`.
- Every WIP worktree has an untracked `node_modules` symlink to `.claude/worktrees/maintenance-runtime/node_modules`. Never stage it or run an installation through it. Root checkout still contains private plans and older local main; do not reset/clean it.

### Verification actually executed

Canonical storage's focused build-key, storage, release, real-Worker API and backup suites passed 26 tests. Target-preview's broader focused run passed **113 of 114** tests in 94.934 seconds. The sole failure was a newly authored fixture using a forbidden `?small` query in `srcset`; validation correctly rejected it before the resource-equivalence assertion. Astra removed that query, preserving the accepted/rejected contract. **That corrected fixture has not yet been rerun at this checkpoint.** Log: `/tmp/o-y-a-wip-preview-focused.log`.

The passing selection includes hostile control/HTML/CSS cases, exact build/origin/content facts, fresh media readiness, rollback/concurrent publication, canonical state, actual historical BASE Save replay and the real backup drill. Editor JavaScript measured **374584 gzip bytes against the unchanged 375000-byte limit**. This small margin is recorded, not permission to raise the limit. The initial build and actual BASE preparation passed; logs are `/tmp/o-y-a-wip-preview-build.log`.

At the pause, root deliberately interrupted the long browser selection with SIGINT (exit 130), after all **seven** `cms-frame-public` cases passed, including the screenshot/identity and geometry matrices. One frame-recovery case was interrupted; six remaining recovery cases and both new `cms-preview.spec.mjs` cases had not started. There is no complete browser-pass claim. JSON report: `/tmp/o-y-a-wip-preview-browser.json`, stderr alongside it. Rerun the unfinished recovery/preview selection first; the seven completed cases need repetition only if later changes affect them. The browser process and its fixtures have stopped.

Publication checkpoint: preview source is committed as `a7e1745`; B9 is integrated as `d2c4333`. The combined source has not received a complete post-integration runtime run. The initial frozen preview lint passed 291 source/test files; final checkpoint lint is recorded with the push. CI will run against the WIP branch; the owner requested idle without waiting for its result.

The B9 refactor passed fourteen before/after parity cases, then 108 related body/contact/Worker/mail API tests. The strengthened fourteen cases also passed against the original source. Five independent mutations (declared limit, actual byte limit, fatal UTF-8, cancellation and lock release) failed their intended assertions; all sources were restored. Logs: `/tmp/o-y-a-wip-http-{before,after,final}.log`; ignored receipts: `maintenance-wip-http/output/parity/body/`.

Public port originals and replacements passed on the explicitly matched pinned Chromium headless shell. Fifteen public production mutations and eleven scroll/fika mutations failed their intended assertions; restored positive runs passed. All Python originals remain. Separately, original CMS modules passed 25 cases plus SVG fidelity; replacements passed 26 cases. Case names and assertions were inspected, but **module mutation qualification and Firefox/WebKit parity remain unfinished**.

Prepared, **not executed**: `maintenance-wip-qa/output/parity/check-module-mutations.py`, twenty-two product mutations mapped to twenty-four module cases; the remaining clipping case contains four existing negative controls. The script runs original/new cases and restores source bytes in `finally`. Inspect its assertion classification and each observed failure before claiming mutation coverage. It is scratch evidence tooling, not a tracked product addition. No mutation is currently applied in that worktree.

The earlier main export stall remains unexplained. PR16's full 240 exports passed, but success is not a root-cause fix. Its failed-only bounded `/proc` metadata captures executable/thread/wait-channel/resource pressure without changing deadlines, retries or assertions. Do not introduce PR sampling to conceal a recurrence.

### Resume in this order

1. Read this document and `ASTRA-PLAN.md`; inspect `git status`, worktrees, remote PR heads and CI. Resume the same Astra peer; use git/gh CLI. Local tests remain authorized, heavy execution coordinated serially. Leave Cloudflare Builds enabled.
2. Resolve the new WIP PR's exact-head CI before the next bulk push. A single `gh pr checks <number> --watch --interval 60` background watcher is sufficient; no repeated active job polling.
3. Rerun the corrected target-preview scope test first. Review any recorded browser failure and root/Astra source observations. Then broaden only where failures or changed code require it. Prepare the actual historical BASE with `node --input-type=module -e 'import { prepareBaseWorker } from "./scripts/prepare-base-worker.mjs"; await prepareBaseWorker();'`; merely executing that module file does not call its exported function.
4. Finish bounded/resumable existing-head canonical migration, exact source/build/head/CAS proof, rollback/replay/races, raw historical/public identity and the release/refresh runbook. Do not silently apply legacy frame appearance decisions. Measure whole handlers with explicit cold/warm/p95 definitions; Node CPU proxies are not production `cpu_time_ms` evidence.
5. Complete Python port assertion/engine/artifact parity and meaningful mutation runs, then retire only superseded originals/runners. Preserve manual Python consumers. Finish CI job separation, explicit test discovery, representative 24-card PR sampling with conservative dependency detection, all 240 for relevant changes/nightly, and five real measured CI runs. Keep responsive/cold/no-JS coverage while grouping navigation.
6. Adapt held public-performance work to current schema/frame/game semantics: public-read normalization prerequisite, version-keyed caching with immediate Save/restore, public-only identity stripping including noscript, static Worker bypass/security headers and Access-protected seed. Compare exact bytes/headers and benchmark; do not cherry-pick the obsolete pre-frame patch wholesale.
7. Finish B7 domain routing/C7 media boundaries and the necessary D module separations, with authoritative auth/write/error handling. B9 is already integrated. Do not perform rename-only churn. Update `ARCHITECTURE.md` against the resulting real module/scenario map.
8. Reconcile owner/account/production gates separately: retained history, first Save/frame/CPU, backup/prune/media/recovery rehearsals, mail domain/routing/delivery/key rotation and privacy/Safari decisions. Mail config was observed enabled; no live test email was sent. Secret values stay outside Git and chat. Do not assume provider delivery or production CPU from configuration/local tests.
9. Final reciprocal approval, exact-head CI and accurate docs before handing over ordered PRs. The owner merges; do not auto-merge.

Use Node 24 from `.node-version`; the local runtime worktree has exact-lock dependencies. The root checkout's `.test-venv/bin/python` retains the original Python comparison environment. Match the explicit Playwright Chromium headless-shell executable (revision 1243), not just its reported browser version; `chromium.executablePath()` points at the different full browser. Colima was started for the earlier Linux comparison; preserve unrelated containers. Machine-specific executable paths remain in the private local handoff.

## Current contract

The owner resumed the entire original unfinished queue after merging PR15. Integration starts from `550383c449cf4d57eea4762122df8e88be710734`, whose tree matches the qualified cleanup at `74398a9`. Root and the resumed Astra peer implement separate scopes, challenge each other's changes, and record source and runtime evidence independently. The prior cleanup maps remain historical evidence.

Use `git` and `gh`; leave Cloudflare Builds enabled. Local tests are authorized, with serial focused runtime runs and isolated data. Preserve every original dirty worktree and the historical maintenance branch. New work is delivered through reviewed PRs; the owner merges. Never stage private plans, recovery files, credentials, dependency links, or generated distributions. Production actions need their applicable migration, backup, and account gates; local or PR success is not live CPU/delivery evidence.

## Queue and ownership

| Work | Owner | Required outcome and evidence | State |
| --- | --- | --- | --- |
| Reconcile remaining requirements | Both | Compare original plan/handoff with actual merged source; retain completed repairs rather than replaying old commits | In progress |
| CMS CPU and schema-2 preview/storage | Astra; root review | Canonical persisted state and exact target/frame validation; atomic Save/CAS; policy/content/head/origin facts; replayable bounded migration; old/current fixtures and rollback/race tests | Storage accepted; preview WIP; migration/CPU qualification pending |
| Remaining Python ports | Root; Astra review | Preserve every interaction/privacy and scroll-helper assertion; real Worker fixtures, source-to-target map, old/new execution and mutation failures before retiring originals | In progress |
| Existing port parity and retirement | Root; Astra review | Audit every old/new case, engines and artifacts; meaningful mutation evidence; remove only superseded test infrastructure, preserving used manual Python tools | Pending |
| Public rendering and payload costs | Both | Reassess held pre-frame patch; current frame/game/legacy identities, immediate publication/restore, cache/privacy headers, seed protection and public-byte checks | Pending CPU integration |
| CI and deterministic card corpus | Root; Astra review | Independent jobs with real build prerequisites; representative 24-card PR corpus and full 240 nightly/relevant changes; all other assertions retained; measured runs, no guessed timings | Pending ports |
| B7/B9/C7 and module boundaries | Both, disjoint assignments after CPU | Domain routes with centralized authoritative guards; bounded body-reader parity; cohesive media/public/API/site/core/studio/test responsibilities; no import/route/contract drift | B9 integrated; remaining boundaries pending |
| Architecture and current docs | Root; Astra review | Accurate module/scenario map, commands, migration/operational instructions and requirement dispositions; no speculative file-count/LOC targets | Pending final structure |
| Account and production prerequisites | Root | Mail configuration observed enabled; provider delivery remains unverified. Reconcile original owner actions with current live state and preserve backup/rollback gates | Partially verified |

## Execution and review gates

1. Write edge cases and acceptance before editing each domain. Do not infer that old patches solve current frame/schema contracts.
2. Run the smallest relevant test, challenge with an old-behavior mutation where applicable, then broaden for affected seams. Keep originals until parity proof exists.
3. Root independently reads Astra's important source and test changes; Astra independently reviews root's. Resolve concrete findings with the author before commit.
4. Integrate only complete reviewed batches. Before each bulk push, inspect the previous exact-head result and repair red checks. One background GitHub watcher per push; continue independent work while CI runs.
5. Synchronize dependent branches to accepted integration work before their gate. Do not discard user work or rewrite merged history.
6. Finish with reciprocal source approval, current documentation, clean intended diffs and exact-head GitHub success. Report any owner-only live verification separately, with its concrete blocker.

## Initial evidence

PR15 is merged; no open repository PR existed at resume. The old `PLAN.md` and handoff still described earlier red CI and superseded run/model rules, so they are not current execution status. New integration and CPU worktrees start from the merged baseline. The original dirty CPU patch and held performance commit remain untouched comparison sources.

The merged source already includes the full frame and mail repair, checkpoint fix, source/license closure and pinned runtime qualification. Remaining work must preserve these contracts. Tests still include Python originals alongside their JavaScript ports; `browser.py` interaction/privacy and `test_revision_scroll.py` still need their final ports and qualification.

## Public port acceptance map

`tests/public-interactions.spec.mjs` retains the HTTP-mode assertions from `tests/browser.py`. Each row is an independent named Playwright case. Both suites use the same current validated v185 public fixture, an additional analytics-enabled Worker, fresh browser contexts, genuine navigation/cookies/CSP and the pinned Chromium executable. The old render-only adapter is not presented as HTTP parity; manual consumers remain separately inventoried.

| Original case | Target case | Planned negative control |
| --- | --- | --- |
| Machine, all flavors | Same title | Deck repeats the same flavor card |
| Shared exact ID and hostile query | Same title | ID lookup returns a different flavor |
| Clipboard denial | Same title | Manual fallback remains hidden |
| Real PNG generation | Same title, plus PNG signature/dimensions | Export raster uses the wrong scale |
| Bubble keyboard/reset/sound | Same title | Reset leaves pressed state set |
| Skip/menu/Escape/resize | Same title | Escape fails to hide menu |
| Short mobile action labels | Same title | Visible action label wraps |
| Furl fold/unfold | Same title | Repeated lines remain visible |
| Reduced motion/manual pause | Same title | System reduced-motion preference ignored |
| Native privacy modal | Same title | Modal closes without restoring trigger focus |
| Consent and revocation | Same title | Event deduplication removed |
| Revocation with failed cookie write | Same title | Session-denied override ignored |
| GPC fails closed | Same title | GPC signal ignored |
| DNT fails closed | Same title | DNT signal ignored |
| Failed cookie storage fails closed | `Privacy fails closed: blockedCookie` | Allow sends an event despite failed persistence |

`tests/revision-scroll.test.mjs` maps all eleven original `test_revision_scroll.py` cases to the existing JavaScript helper. The fake timer uses milliseconds rather than Python seconds without changing the tested sequences. Negative controls must expose approximate offset comparisons, integer truncation, premature top acceptance and incorrect fika category boundaries.

Initial local evidence: the Python scroll suite passed eleven cases; Node passed the corresponding eleven plus six CI-registration guards. A single new shared-card browser case passed. An initial ad-hoc stdin runner stalled before returning its first local Worker fixture and was stopped; it supplied no browser-test evidence. A bounded file-based runner is used for the original comparison. Originals and their CI gates remain intact.

## First port execution and renewed merge-run failure

The original public suite passed all fifteen cases with both the full Chrome for Testing binary and an explicit pinned headless-shell binary. The new suite, using Playwright's default pinned headless shell, passed fifteen cases without skips or retries; its final restored-code run took 28.837 seconds. The initial full-browser run alone was not binary-equivalent evidence, so the explicit shell comparison was required.

Each of the fifteen public cases was then run against its own changed production source, and failed at the intended behavioral assertion. All eleven scroll/fika cases likewise rejected their targeted helper mutation. Every mutated source was restored; the build and positive suites passed again. Local receipts and exact test/source/mutant hashes are retained under ignored `output/parity/public-mutations/` and `output/parity/scroll-mutations/`. Astra independently approved source parity before these runs. No original test or runner has been removed.

Before the first continuation push, root inspected the merge commit's new GitHub run `40584330796`. The four independent runtime jobs passed, but `verify` failed on r01 in the unchanged exhaustive export matrix. This later run supersedes any assumption that the merged main has green checks. HTTP returned the card bank in 16 ms. The failed-only receipt shows browser/page CDP sessions connected promptly; browser commands responded, while both Playwright DOM reads and a fresh direct-CDP DOM command could not answer. Renderer CPU remained 0.13 seconds across the 502 ms sample. These observations do not identify a native deadlock, suspended target or starvation cause.

The continuation adds bounded Linux executable/thread-state/wait-channel and resource-pressure metadata only after the existing assertion fails. It reads no environment, command line, memory or credentials, and attaches no debugger or signals. Successful test startup, all 240 exports, deadlines and zero retries are unchanged. This is diagnostic work needed to resolve the renewed red gate, not a claimed product fix. Smaller PR sampling will not be used to conceal this failure.

Root independently reviewed Astra's first canonical-storage slice and ran its focused build-key, storage, release, real-Worker API and backup/restore suites: 26 passed, zero failed. The slice now folds resource-index completeness and media references into its initial state lookup. Compatible content with an old build key is explicitly reported as requiring refresh; correct fallback reads do not establish CPU qualification. Preview and existing-head migration remain in progress.
