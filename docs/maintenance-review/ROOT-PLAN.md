# Root plan: adversarial maintenance cleanup

## Contract

The current task supersedes the earlier unfinished-feature queue. Review and repair every change in PR14 before returning to that queue. Preserve intended features and public/security contracts; do not accept green CI as evidence that the design, documentation, provenance or coverage is correct.

Frozen source: main80630c7d280c71314702af791dbc0828d9ff8b0a; maintenance71b30dc18b073f310fed386bba7664d7afb77abf. The original maintenance branch and all original dirty worktrees remain historical evidence. Current PR14 CI is green (run40230520836), but the code has not passed this new review.

User requests four to six Luna Max mappers, four mapping documents, then root plus one Astra xhigh peer to repair/review each other's work. Four Luna agents are planned in two waves because the harness permits three active children. Each mapper owns one document. The root and Astra each maintain a plan, with explicit handoffs and reciprocal review. The user's instruction authorizes both of us to implement, superseding the orchestration skill's ordinary author-only delegation rule.

## Hard boundaries

- gh CLI. Cloudflare Builds stay on. No merge, production data operations, secret changes or external messages.
- No local tests, builds, servers or application execution. Root may run lint, syntax checks and required formatting. Runtime proof comes from GitHub.
- No suppression/skips/deletions/looser acceptance to manufacture green CI. A disproven test premise requires documented evidence and preservation of the actual contract.
- No unrelated new features or blind import of held CPU/perf work. Performance defects in the current PR remain in scope and require independent diagnosis and necessary repairs; historical WIP is evidence, not an approved solution. Fix current PR defects, including structural work when correctness/reviewability requires it.
- Never read or publish .env, cookies, recovery data or the private IMPROVEMENT-PLAN. Review documents must contain source evidence, not credentials or private account data.

## Sequence and observable gates

1. Map all359 changed entries, deleted/moved artifacts and affected callers. Four documents: inventory/provenance; server/security/data; studio/public/game; verification/release/docs. Verify claims independently; mark inferred and disproven findings explicitly. Ensure no file/domain silently omitted.
2. Reconcile maps with Astra xhigh. Establish finding IDs, severity, concrete failure, owner, repair and regression proof. Both authors challenge each other's premises. No blanket endorsement of allegations.
3. Create maintenance-clean from main, reproduce maintenance's tracked tree without inheriting maintenance commits, and verify tree equivalence before edits. The original history remains on maintenance. Commit coherent reviewed domains and repairs; preserve source provenance. Avoid a new chain of unreviewable historical commits.
4. Repair in risk order: notices/provenance and distribution integrity; authentication/private data/validation/migrations; product/data correctness; test/CI integrity; structure and docs. Each bulk push must first inspect current PR CI; repair any red result before adding the next bulk. Continue independent review/work while CI runs.
5. Keep the four maps and both plans updated with repaired/disputed findings, coverage and exact commit/run evidence. No push of partially edited work. Root reviews Astra changes and Astra reviews root changes; meaningful changes require agreement and remote tests.
6. Final whole-diff adversarial pass against main, documentation/link/license checks, clean-history check, all findings resolved or explicitly justified with evidence, mutual approval, latest-head CI green. Leave new PR for owner review and go idle.

## Current checkpoint

All four Luna Max mapping documents are complete. Root independently checked their major claims and retracted a false SKIFT-guide allegation. The Astra xhigh peer has a separate ASTRA-PLAN.md and an agreed disjoint source assignment.

Created maintenance-clean from main80630c7. Snapshot commit e1ab14a has exact maintenance71b30dc tree d9ff75429dfcc9fab9926b5b82632a254f2fab1b and only main as parent; old post-base history is absent. The import is explicitly unapproved comparison evidence. Root and peer agreed to this transparent reconstruction rather than inventing a domain history for intertwined changes.

First reviewed repair commit cdafaaf: query-only signed attachment links and redaction; reserved mail-file namespace; persistent send-attempt guard against concurrent provider refusal deleting a possibly accepted intent; authoritative 409 uncertainty; master-key/JSON/limits/rotation docs. Root cross-reviewed SQL transitions and client response semantics, independently checked Resend's official 409 contract, and ran allowed lint/diff checks. No local tests/builds/runtime. First push to maintenance-clean completed; draft PR15 created: https://github.com/omar-y-abdi/o-y-a/pull/15. Runtime proof pending.

Peer owns server/mail/security/data paths, corresponding focused tests and CONTACT-SETUP/CMS-SECURITY/CMS-LOCAL-VERIFICATION. Root owns other client/public/build/license/CI/general docs and raw-v185 browser. Shared helper opt-in for scheduled tests was explicitly handed to peer and is now finished, but remains part of the uncommitted lifecycle batch. Root commits only frozen reviewed paths.

Next peer batch: lifecycle migration0009, pre-put uploading state and promotion CAS, permanent deletion claim, bounded scheduled cleanup, aged R2 orphan sweep with persisted version-CAS cursor, and adversarial API/scheduler tests. Lifecycle batch was independently reviewed and committed/pushed as c7d4a0a. Durable state transitions, scheduled recovery, orphan cursor CAS and tests passed source review and allowed lint. GitHub then passed Firefox/WebKit; verify found one missing explanatory warning in the 409 message. Peer corrected that without loosening the assertion; runtime rerun remains pending. Root requested combined pre-registration plus sweep to avoid late INSERT resurrection and to cover arbitrarily late object completion.

Next root batch: tracked full third-party notices and source provenance, validating generated distributions against locked package license bytes and bundle graphs, fail-closed standalone notice handling, ZIP build closure/extracted rebuild CI, public startup/navigation fixes, cold raw-v185 browser ingress, and documentation repairs. A missing build-options.mjs in the standalone ZIP was independently found by root and confirmed in map04. No broad cosmetic moves or blind old WIP imports.

## Authored root batches and reciprocal review

Tracked full notices now cover package licenses and embedded GrapesJS Cash/Spectrum/TinyColor/CodeMirror sources; installed versions/license bytes, vendored bundle/map/CSS and retained upstream notice texts are pinned. Browser/Worker graph checks fail on unknown dependencies. The peer identified a gap in the first draft (upstream notice copies could be jointly truncated with the canonical output); digest checks and paired-tampering regressions now close it. Standalone ZIP now includes build-options/notices, and a new GitHub job rebuilds extracted source outside the checkout and exercises the actual ZIP in pinned Chromium. No local runtime was run.

Root also authored failed SKIFT import recovery, navigation fallback when main fails, contextual Compose/account history guards, raw-v185 authenticated browser first-save coverage, tracked site provenance and corrected stale game/CMS/QA docs. These remain uncommitted pending peer review and lint; GitHub proof pending. Legacy media queue recovery is an additional confirmed upgrade defect found by the peer after the four maps; root reviewed its exact snapshot/head handoff to existing canonical deletion checks and requested a usable owner recovery procedure.

Release boundaries are explicit: stored-history/manual exact-SHA evidence, D1 bookmark, writer quiescence, effective Cloudflare configuration and current edge CPU are owner release prerequisites, not inferred from PR green. No production data or deployment operation is part of this cleanup.

## Cross-review checkpoint before next bulk push

Astra independently approved the root license/package/CI batch after verifying the upstream license blob IDs/digests and the corrected tampering gate. Astra also approved the startup/navigation, contextual history, raw-v185 browser and general-documentation sources. Root independently approved legacy queue recovery and the 409 explanatory-warning correction. New source checks cover both named 409 variants without relaxing the old existing-intent warning assertion. Allowed root lint and Python syntax checks passed; no local test/build/server was run. Runtime and final whole-diff acceptance remain pending.

The four original maps are now tracked as frozen evidence, with their 359-path ledger and pinned inventory. Both active plans live beside them; the private locations point here. Original machine-specific paths were removed. The current-command documentation check excludes these frozen reports because references to deleted scripts are evidence, not runnable instructions; relative-link checks still include them.

## Current finding disposition

| Finding | Disposition and implementation evidence |
| --- | --- |
| Provenance map: missing full CMS/vendor notices; weak generated checks | Repaired in d87af54: tracked full texts, installed-source/version checks, pinned embedded vendors, graph checks and notice-tampering regressions. Root and Astra independently approved. |
| Provenance map: site ledger and stale standalone scope | Repaired in ae38095 and game credits: source ledger restored, historical records labeled, current build/license paths corrected. |
| SD-01 / SD-02 | Repaired in cdafaaf: query-only attachment capability, query redaction, reserved route and tampering/route tests. |
| SD-03 | Repaired in c7d4a0a: durable upload/deleting state, scheduled cleanup, bounded aged orphan sweep and race/failure tests. |
| SD-04 / SD-05, VR-04 | Repaired: accurate key-rotation, signed-link transition, discarded editor-JSON and actual body-limit contracts. |
| SD-06, found after mapping | Repaired: all 409 responses preserve uncertainty; every send attempt is recorded before provider access, and shared intent cannot be discarded by a concurrent refusal. Warning regression from c7d4a0a corrected in03258f4 without weakening its assertion. |
| Legacy media queue, found after mapping | Repaired in03258f4: exact snapshot/head transaction hands recovery to current reference/CAS deletion checks; owner discovery/retry runbook and ten regression sources. |
| SP-01 / SP-02 | Repaired in3e5864e: visible SKIFT import failure/reload and native navigation before successful main initialization. CI exposed a wrong test selector (/kontakt/ is not in primary-nav); corrected to real /om/ navigation. |
| SP-03 | Contextual history guard implemented. New CI case additionally found stale unselected inspector presentation after successful Undo; trace shows clean Draft and stale textarea. Explicit no-selection inspector refresh fixes that separate defect; assertions distinguish history from presentation. |
| VR-01 | Raw-v185 authenticated browser state/preview/first-Save/reload case passed in functional run40246352536. The stored fixture is asserted raw before and after the initial read. |
| VR-02 / VR-09 | ZIP closure, extracted build and exact notice tests implemented. Actual extracted npm-ci/build passed in run40246352536; standalone browser movement's fixed400ms hardware assumption failed. Observed input polling now preserves the same movement/cooldown thresholds and retains failure JSON/trace. |
| VR-03 / server release gaps | Required owner release record in DEPLOYMENT: same-candidate full-history run, exact reviewed errors, D1 bookmark, quiescent writers, account settings and current edge CPU evidence. No production evidence fabricated; these are distinct from PR acceptance. |
| VR-05 through VR-08 | Current resource/frame model, removed runner, standalone ownership and guide export claims corrected; live docs/script paths linted. |
| Frame-conflict recovery, found during final review | Peer authored frozen Save identity/choice, confirmed-Save state-read retry and explicit stale-head reconciliation. Root approved source and six real-Worker browser regression cases; registered in functional CI. Runtime pending. |

## Remote round at ae38095

Run40246352536 passed the functional-browser job, including the new raw-v185 case. Node source/storage/notice tests passed before public-browser execution. Firefox/WebKit exposed the stale-inspector defect and the new nav test's wrong premise. The standalone job passed build/ZIP/extracted rebuild before failing its fixed-wall-clock movement assertion. The public matrix also had two unfinished card-bank fetches during concurrent exports (r03 and r18, at different times); traces do not identify a production or server cause. Only the all240 export group is now scheduled sequentially, with the same8s checks and zero retries. A bounded independent HTTP receipt is attached on a future failure; it never changes a failed browser result. This is harness resource isolation, not a claimed product fix.

The next coherent batch repairs those diagnosed failures and adds the independently reviewed frame-conflict recovery. Root and Astra agreed to each other's changes. No local runtime was used; lint and syntax checks are the local evidence. Whole original-diff review continued across frame conversion/rendering/editor state, migration/retention/release tools, client startup, game lifecycle and test registrations; no additional concrete blocker was established.
