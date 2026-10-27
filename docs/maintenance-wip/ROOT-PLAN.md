# Remaining maintenance work: root plan

## Current contract

The owner resumed the entire original unfinished queue after merging PR15. Integration starts from `550383c449cf4d57eea4762122df8e88be710734`, whose tree matches the qualified cleanup at `74398a9`. Root and the resumed Astra peer implement separate scopes, challenge each other's changes, and record source and runtime evidence independently. The prior cleanup maps remain historical evidence.

Use `git` and `gh`; leave Cloudflare Builds enabled. Local tests are authorized, with serial focused runtime runs and isolated data. Preserve every original dirty worktree and the historical maintenance branch. New work is delivered through reviewed PRs; the owner merges. Never stage private plans, recovery files, credentials, dependency links, or generated distributions. Production actions need their applicable migration, backup, and account gates; local or PR success is not live CPU/delivery evidence.

## Queue and ownership

| Work | Owner | Required outcome and evidence | State |
| --- | --- | --- | --- |
| Reconcile remaining requirements | Both | Compare original plan/handoff with actual merged source; retain completed repairs rather than replaying old commits | In progress |
| CMS CPU and schema-2 preview/storage | Astra; root review | Canonical persisted state and exact target/frame validation; atomic Save/CAS; policy/content/head/origin facts; replayable bounded migration; old/current fixtures and rollback/race tests | Design |
| Remaining Python ports | Root; Astra review | Preserve every interaction/privacy and scroll-helper assertion; real Worker fixtures, source-to-target map, old/new execution and mutation failures before retiring originals | In progress |
| Existing port parity and retirement | Root; Astra review | Audit every old/new case, engines and artifacts; meaningful mutation evidence; remove only superseded test infrastructure, preserving used manual Python tools | Pending |
| Public rendering and payload costs | Both | Reassess held pre-frame patch; current frame/game/legacy identities, immediate publication/restore, cache/privacy headers, seed protection and public-byte checks | Pending CPU integration |
| CI and deterministic card corpus | Root; Astra review | Independent jobs with real build prerequisites; representative 24-card PR corpus and full 240 nightly/relevant changes; all other assertions retained; measured runs, no guessed timings | Pending ports |
| B7/B9/C7 and module boundaries | Both, disjoint assignments after CPU | Domain routes with centralized authoritative guards; bounded body-reader parity; cohesive media/public/API/site/core/studio/test responsibilities; no import/route/contract drift | Pending CPU integration |
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
