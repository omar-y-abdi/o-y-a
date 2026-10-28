# Remaining maintenance work: root plan

## Resumed by the owner, 2026-10-28

The owner explicitly resumed the entire queue after the usage reset, then requested Colima startup. Root and the same Astra peer are active again. The pause below is historical. PR16 and PR17 remain open and unmerged; remote heads and main still match the recorded checkpoint.

Remote PR17 remains at `1547de97f480c72e0602c6dcf0a59887358d33ae`; subsequent accepted slices are local until the red browser gate is repaired. The three reproduced unit failures from run `40600825039` are repaired: frame migration now validates with the explicitly selected origin, and the reference fixture supplies valid mail-image alt text. The wrong-origin hash guard still rejects with 409 and no revision. Root reviewed the repair and ran 32 focused migration/preview/conversion/documentation tests plus nine preview/recovery browser cases; all passed. Logs: `/tmp/o-y-a-pr17-resume-fixed.log` and `/tmp/o-y-a-pr17-resume-browser.json`.

Exact-head run [40740065301](https://github.com/omar-y-abdi/o-y-a/actions/runs/40740065301) passed the unit portion, functional-browser, Firefox, WebKit and SKIFT release. `verify` remains red because the unchanged card matrix stalled on r52 (239/240 passed). HTTP was responsive; independent no-layout DOM and fresh page-CDP evaluation stalled while browser-CDP responded and sampled renderer CPU stayed flat. This does not establish a native deadlock or application loop. Root is investigating in isolated `maintenance-wip-export` at the same head. A controlled Linux comparison ran three 240-card matrices per mode: headless shell passed all three; full Chromium passed one and stalled twice at different cards. Therefore switching channels is not a fix. Exact reports live under `/tmp/o-y-a-export-ab/`; failed-only native stacks showed an untimed renderer condition wait, but stripped Chromium frames did not identify its owner. No readiness deadline, assertion, retry or sampled gate has been weakened.

The bounded existing-head CPU migration passed root source review and focused runtime qualification. Root review required shared ordinary-view projection (obsolete page editor JSON must stay absent from `/state` but exact in raw history), fresh D1 count/index preflight, and removal of an unnecessary permanent journal-to-revision foreign key. The repository currently prunes rendered rows only; raw-source retirement is a separate simulated lifecycle check, not an existing prune regression. Migration preserves raw/public bytes, unresolved owner choices, replay identities and authoritative build/head/origin/CAS guards in the tested fixtures. The first ten-case run passed nine; the actual-BASE test correctly received HTTP 413 for an oversized injected project before its expected unknown-field 422. The corrected test separately checks tiny unknown-field 422 and oversized-body 413 and passed. All ten distinct migration cases are now exercised successfully; the broader nine-file storage/build/preview/release/API/docs/backup selection passed 51/51 in 29.498 seconds. The two-runtime backup includes committed/ready operations, exact BLOB/stage restoration and receipt-only replay. Build passed; lint passed 298 files. Receipts: `/tmp/o-y-a-cpu-migration-{focused,base-fixed,integration,build,lint}.log`. The subsequent current-project reader and comparative handler qualification are recorded below.

QA qualification is complete for the 25 module cases plus managed SVG fidelity. Twenty-two product mutations covered twenty-four named cases in both original and replacement; the twenty-fifth retains four clipping negative controls. Restored paired suites passed Chromium and Firefox using the same current engine binaries. Python Playwright 1.57 hung during WebKit page teardown; its driver used the obsolete protocol close command. An isolated Python 1.63 environment ran the unchanged originals against the same WebKit 2359 as Node 1.63: 25 plus SVG passed; the Node replacement passed 26. This is matched-driver evidence, not a pass for the interrupted old-driver run. Astra independently inspected receipts and approved retirement. Evidence remains under ignored `maintenance-wip-qa/output/parity/module-{mutations,engines}/`.

The QA branch replaces only those qualified Python suites/runners, preserves their seven-case smoke selection and registers replacements for Firefox/WebKit. Module cases serialize within their file; other files may still overlap under ordinary CI. Per-phase report/artifact paths prevent later runs erasing earlier evidence. Lint passed 290 files; 29 focused quality/docs/lint checks passed; the seven selected smoke cases passed without skips/retries in 19.832 seconds. Remaining Python consumers stay until their own qualification. QA will rebase onto the accepted CPU branch before its PR; no bulk push while the current red check remains unresolved.

The migration slice was accepted reciprocally and committed locally as `9d19b9d`. QA subsequently rebased onto current-reader commit `51306cc`; qualified module retirement is now `cea25a6`. Root subsequently reproduced an actual harness error: `libraryPage` booted the full studio and replaced its document, leaving the editor ResizeObserver to read a removed canvas. The clean-fixture regression failed on the original helper with `null.clientWidth`. The fix uses a fresh blank document and the actual library bundle, matching the original renderer-unit fixture; the separate real-studio delayed-usage scenario remains. The 21 replacement cases passed Chromium, Firefox and WebKit alongside the unchanged 19+1 Python originals on matched binaries/Playwright 1.63. Astra reviewed source, red/green reports and all three receipts. The focused fix is committed locally as `f9f2504`. Fifteen qualified mutations then covered all 20 original cases in both languages. Root rejected one incidental interface-failure control and replaced it with an exact evicted-response-body failure; the rejected receipt is retained separately. All source hashes were restored. Astra independently accepted the valid controls and registrations. Commit `6850b7a` removes the two qualified Python test files and the unused card-export helper, retains shared/full Python CMS suites, and registers replacements in Chromium/Firefox/WebKit. The final guards passed 29 tests and lint passed 293 files. Receipts: `/tmp/o-y-a-qa-library-{probe,red,green}.json` and ignored `maintenance-wip-qa/output/parity/library/`.

Browser diagnosis has rejected two proposed shortcuts: full Chromium also stalls, and disabling trace screenshots alone also stalled in a second 240-card arm (`p02`, 13 passed before failure). A minimal real-HTTP page without application code passed 1000 fresh contexts with normal trace; this only bounds that synthetic workload. A full 240-card arm with all tracing disabled passed once. An isolated real-renderer HTTP experiment also passed 240/240 in 81.626 seconds, preserving the default hidden host and actual win bundle; it omits the surrounding application/Worker graph. These results do not yet identify the causal component or qualify a fix. Product code and committed test tracing/assertions/deadlines/retries remain unchanged.

Current-project readers are accepted by root and Astra: canonical payloads stay separate from version/build/origin/content-bound validation facts; legacy/historical reconstruction and replay identities retain their existing paths. Mail loads the small resource header and still checks current media state. Eight focused cases passed in 12.723 seconds. The complete fast suite passed **816/816** in 172.395 seconds, with zero skips/failures; the separate real backup drill passed in 12.548 seconds and lint passed 301 files. Logs: `/tmp/o-y-a-cpu-reader-{fixed,fast,backup,lint}.log`.

Comparative Node measurements used identical script/helper/fixture/lock/runtime identities, baseline `9d19b9d`, and the candidate source hash `603fa87d2ea1cd53b8aff0aa679a72f88ad48e1aa9fc1eb042e69ada876d5b66`. Each of ten workloads ran in its own process, with 20 fresh-module first dispatches, 50 warm dispatches and three retained excluded warm-ups per version. Root and Astra independently recomputed every CPU/wall median and nearest-rank p95 from all 20 raw receipts; no dispatch or semantic-check failure occurred. Node process CPU includes SQLite/native work and test instrumentation, and the auth module is a fixture. These are comparative proxies, not workerd/edge CPU or fresh-OS-isolate measurements.

| Changed path | Warm median CPU, before → after (ms) | Warm p95 CPU, before → after (ms) |
| --- | ---: | ---: |
| First full Save | 374.427 → 81.0055 | 425.675 → 90.534 |
| First delta Save | 372.910 → 79.1705 | 434.068 → 97.290 |
| Current recovery | 395.7345 → 85.767 | 469.515 → 99.319 |
| Current pending recovery | 672.865 → 97.9305 | 762.744 → 116.122 |

These paths remove revision-BLOB reads. The six controls preserve their query/BLOB/validation counts; their timing variation is not a separate performance claim. Recovery may return stronger server-generated facts; its frozen pending payload stays exact. Raw receipts, the comparison and independent receipt hashes are in `/tmp/o-y-a-cpu-handler-matrix/`; [Astra's plan](ASTRA-PLAN.md) records all ten workloads and full identities. The production 10ms requirement remains an owner release gate. Browser-version A/B now compares the unchanged full corpus with Chromium 153/156 under the same 1.63 driver and executable-path launch mode; any supported toolchain change requires its own qualification.

The main CMS browser port had omitted the original first-publication precondition: Python begins with an empty database, while the JavaScript beforeAll fixture had already published version one. Root's added envelope assertion reproduced that mismatch. The port now retains the original first-publication case in a separate empty real Worker and adds an explicit existing-publication/delta case. Both passed after restoring the original timestamp-shaped authored labels (2/2, 32.721 seconds; `/tmp/o-y-a-qa-first-save-matched.json`). Original Python labels and new-page URL formatting remain matched; every original overflow assertion remains. Full 41-to-42 case parity and mutation qualification remain pending.

A separate public-layout observation remains open: the prior port's 40-hex-plus-hyphen marker made the editable home heading overflow at 1440 CSS pixels (document 1485px; text span right edge 1485.266px). The receipt `/tmp/o-y-a-qa-save-overflow.json` identifies the exact text and geometry. Restoring original test input does not repair or dismiss that long-unbroken-heading behavior; assess it with the public-layout work.

The fixed Playwright 1.63 driver with Chromium 156 also stalled on its second arm, rejecting a browser-binary-only remedy. The first supported Playwright 1.64.1/Chromium 156 arm passed all 240 exports in 205.339 seconds. The second unchanged matched arm stalled on r09 (120 passed, one failed, 119 not run), rejecting the matched upgrade as a remedy too. Source identity was verified across all 413 tracked files against `1547de9`; the source and package/browser hash manifests are retained in `/tmp/o-y-a-export-ab/`. Repository and host locks remain unchanged, and the disposable container has been restored byte-for-byte to its original three Playwright 1.63 packages. The failed trace places the stall during the card-bank fetch, before the win renderer module was fetched; the next isolated probe retains the full page but omits exports.

Root built the server-boundary branch at `6850b7a` and ran the new characterization against unchanged product code: 12/12 groups passed in 3.100 seconds. Real signed Worker ingress, route/HEAD behavior, generic/mail guard ordering, limits, body consumption, sanitized errors and native-pattern parity are pinned before Astra's approved B7/C7 extraction. Logs: `/tmp/o-y-a-routing-baseline{,-build}.log`.

Colima and Docker are running. Existing containers are preserved. Root and Astra continue the whole queue, with serial heavy runtime work and no production writes or merge.

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
| CMS CPU and schema-2 preview/storage | Astra; root review | Canonical persisted state and exact target/frame validation; atomic Save/CAS; policy/content/head/origin facts; replayable bounded migration; old/current fixtures and rollback/race tests | Storage, preview, migration and current readers locally qualified; exact-head CI and edge gate pending |
| Remaining Python ports | Root; Astra review | Preserve every interaction/privacy and scroll-helper assertion; real Worker fixtures, source-to-target map, old/new execution and mutation failures before retiring originals | In progress |
| Existing port parity and retirement | Root; Astra review | Audit every old/new case, engines and artifacts; meaningful mutation evidence; remove only superseded test infrastructure, preserving used manual Python tools | Modules/SVG and helper/asset-usage groups qualified and retired locally; remaining groups open |
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

The full B7/C7 post-extraction fast run passed 827/828 tests in 178.368 seconds; the only failure was the QA engine-registration guard still expecting the original three Firefox/WebKit specs instead of the seven registered after qualified ports. Root updated that exact expected list, preserving the original three and unchanged trace/retry checks; all 29 HTTP/CI guards then passed in 7.775 seconds. This correction belongs to the QA slice, not a product behavior change. The extracted routing's 12 groups passed in 3.749 seconds and its actual generated studio key matched the baseline; full final integration and mutation runs remain pending.

The original admin desktop/mobile checks also precede the first publication. An added precondition reproduced the port's seeded version-one mismatch (expected zero, received one). These two checks now use separate empty real Worker fixtures, with the original responsive and error assertions preserved. Both first-boot admin variants passed after the fix (2/2, 12.159 seconds); red/green receipts are `/tmp/o-y-a-qa-admin-first-boot-{red,green}.json`.

The isolated engine-registration correction is committed as `b384381` on QA and fast-forwarded into the server branch; all pending product/test changes remain separate and unpushed.

## Main CMS browser port acceptance map

The original `tests/cms-browser.py` runs 41 cases: fifteen named flows and thirteen discovered pages at desktop/mobile widths. `tests/cms-browser.spec.mjs` maps every original name and adds a separate existing-publication Save case (42 total). Original shared helpers remain consumed by interactions, both review suites and footer QA, even after this standalone suite qualifies. No helper file may be deleted while those consumers exist.

| Original and replacement case(s) | Preserved observation and setup | Planned negative control |
| --- | --- | --- |
| `login-desktop`, `login-mobile` | Unauthenticated actual login route, HTTP, visible login/trust UI, geometry, screenshot and console | Hide trust notice |
| `admin-desktop`, `admin-mobile` | Empty D1/version zero, signed HttpOnly owner cookie, actual editor, responsive drawer/sidebar, nonempty page library and clean geometry | Empty page-library rendering; independently assert cookie remains HttpOnly |
| `edit-save-public-reload` | Empty D1/version zero; UI edit and full Save; public text before/after reload, comparison preview and original-text restore | Alter saved QA text only in public HTML |
| Additional existing-publication Save | Existing canonical revision; delta envelope; same public/preview checks | Same public-text mutation |
| Both `newline-*-shift-enter-save-reload` | Real Shift+Enter in RTE/textarea, exact newline, Save and public desktop/mobile | Drop published line break |
| `new-pages-duplicate` | Original timestamp labels/URL shape; create, duplicate, row count/path/name, publish, unauthenticated public route, cleanup | Discard authored new-page name |
| `style-device-changes` | Theme change enables Save, device dimensions, revert and geometry | Wrong mobile dimension label |
| `undo-redo-revert` | Real edited text removed/restored by undo/redo, then original content after revert | Ignore undo action |
| `history-review-restore` | Actual dynamic version rows and review/restore hooks, preview, confirm/revert | Remove review version hook |
| `lock-compare-public-scripts` | Real public scripts in preview and two comparison iframes | Omit preview public script |
| `assets-upload-metadata` | File chooser, actual PNG upload, edited name/alt persisted and refreshed | Discard name change while saving alt |
| `font-upload-theme-individual` | Actual WOFF2 upload, exactly one asset/MIME, global and per-element selection, computed fonts, real font response and reload, cleanup | Omit uploaded fonts from theme selector |
| `win-edit-export` | Original asset-library then wins navigation, edited card, actual download, PNG bytes, screenshot/revert | Return non-PNG download bytes |
| `canvas-01..13-{desktop,mobile}` | Same dynamic page identities, viewport bounds, genuine wheel to exact top/end, both screenshots and clean shell | Oversize actual canvas iframe; shared geometry assertion exercised on both device paths |

Both original and replacement keep their assertions and use the exact same Chromium headless-shell executable with Playwright 1.63. The original full run passed 41/41 in 179.290 seconds. The replacement full run passed 42/42 in 308.129 seconds, with zero skips/retries/failures. This is functional case evidence, not a performance win: it includes an extra first/full versus existing/delta Save case and repeated state restoration. Mutation qualification is still pending. Root also found missing HttpOnly on the JavaScript fixture cookie and a shortcut in the card-library navigation; the original two-click navigation and an explicit cookie assertion are now restored. The real cookie assertion failed on the original helper with `httpOnly:false` (9.010 seconds). After restoring the original cookie attributes, desktop admin and the original wins navigation/export both passed (2/2, 15.613 seconds). Receipts: `/tmp/o-y-a-qa-cookie-red.json` and `/tmp/o-y-a-qa-cookie-win-green.json`.

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
