# PR15 independent review response

Reviewed candidate: `a574e65a87cd9d9e382a31abec70f49ce741070b`. Baseline: `80630c7d280c71314702af791dbc0828d9ff8b0a`. The earlier acceptance is withdrawn; this ledger records repairs and new evidence, not a claim that the old candidate passed.

Local boundary: source review, lint and syntax only. Runtime regressions run in GitHub. No production data access, deployment or merge. Cloudflare Builds remain enabled.

| ID | Origin | Owner | Repair and required evidence | Status |
| --- | --- | --- | --- | --- |
| F1 | Introduced | Root | Locate actual parsed main slot; authenticated Save plus published DOM with placeholder-like comment | Implemented; root/Astra source review agreed; remote qualification required |
| F2 | Introduced | Root | Preserve legacy frame anchor references through conversion, preview and unrelated Save; actual BASE validator/publisher fixture | Implemented; root/Astra source review agreed; remote qualification required |
| F3 | Introduced | Root | Compare committed request identity before new normalization; actual BASE-produced replay and changed-body rejection | Implemented; root/Astra source review agreed; remote qualification required |
| F4 | Introduced | Root | Reserve IDs from code-owned game main; reject start-button/modal collisions, accept unique frame ID | Implemented; root/Astra source review agreed; remote qualification required |
| F5 | Introduced | Astra | Durable mail receipts separate from visible history, safe old frozen-request transition, pruning plus expired provider cache | Root/Astra source review agreed; GitHub proof pending |
| F6 | Introduced | Astra | Pending removal guard and nonnegative index; overlapping real UI removals retain unrelated attachment | Root/Astra source review agreed; GitHub proof pending |
| F7 | Introduced | Astra | Lock settings controls while saving; pending success/error browser cases | Root/Astra source review agreed; GitHub proof pending |
| F8 | Introduced | Astra | Separate URI substitution from HTML escaping; reserved mailbox delimiters in actual rendered contact notification | Root/Astra source review agreed; GitHub proof pending |
| I1 | Inherited | Root | Persist accepted district/upgrade transition; real keyboard completion then reload and resume | Implemented; root/Astra source review agreed; remote qualification required |
| O1 | Inherited observation | Root | Workshop 320px overflow: establish exact pinned-browser behavior before disposition | Regression/audit gate authored; pinned GitHub evidence required |
| O2 | Inherited observation | Root | Decorative SVG intercepting card Save at 390px: establish exact pinned-browser hit testing | Regression/audit gate authored; pinned GitHub evidence required |
| D1 | Inherited advisories | Root | Assess build-tool exposure; compatible patched sharp/undici dependency closure, retained release/license gates | Regression/audit gate authored; pinned GitHub evidence required |

Each completed row must cite implementation, reciprocal review and exact remote evidence. Source inspection is not runtime proof. Uncertain legacy replay equivalence must remain fail-closed and preserve the draft; it must not be mislabeled as proven changed content.

## Dependency maintenance D1

The inherited Miniflare dependency closure pins sharp 0.35.4 and undici 7.29.1. The [sharp maintainer advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) identifies 0.35.5 as patched. Undici 7.30.1 fixes the reported [EventSource memory exhaustion](https://github.com/nodejs/undici/security/advisories/GHSA-4qv8-2p9j-2685), [SRI algorithm-token bypass](https://github.com/nodejs/undici/security/advisories/GHSA-f72v-6w45-q472) and [content-encoding error](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c).

Scoped npm overrides update only those Miniflare children and sharp's matching native packages. Wrangler, Miniflare, workerd and application packages retain their existing versions. Registry metadata was checked before editing; the newest Wrangler's Miniflare still pinned undici 7.29.1, so upgrading the entire runtime toolchain would not itself resolve all findings. This is a development/CI tooling dependency repair, not evidence of an exploited production path. Current lockfile audit, actual Worker graph/notices verification and all runtime compatibility checks must pass in GitHub. The separate immutable BASE fixture intentionally retains its historical lockfile for compatibility evidence.

## Full Save identity F3

Migration `0011_save_identity.sql` distinguishes historical canonical-project hashes from raw full-request, delta and migration identities. New full Saves hash the original `{baseVersion, project}` envelope before normalization. An exact historical canonical project hash can replay against its recorded actor/base/version without running current normalization, even after later versions exist. A narrowly pinned adapter also handles the metadata trimming performed by the actual BASE validator; the entire adapted project must still match the historical hash. Changed new bodies are definitively rejected.

Old Workers did not retain their original raw request hash. If a legacy retry differs from its stored canonical hash (for example because the prior validator discarded unknown client fields), current code cannot prove equality by applying new rules. It returns an explicit unresolved-identity response naming the recorded version, preserves the frozen attempt and offers backup/history/reconciliation. It does not falsely assert that another payload used the ID, write a new revision, or discard the draft. Old already-loaded JavaScript cannot gain the new recovery message handling without reload; preserve/export recovery data before replacing old clients. Backward deployment to code unaware of raw request identities requires the same controlled writer/recovery review as other schema transitions.

## Source gate before the next candidate

Root and Astra independently approved the CMS/frame, Save identity, game checkpoint, tooling and regression sources after correcting the historical-delta/full-envelope ambiguity and migration formatting. Root approved the F2 CSS predicate/identity/editor/rollback boundaries; Astra approved the root store/render callers. The mail round at `9cf7184` reached the final browser step: only the three new offscreen pointer probes failed, while the Node, contact-rendering/settings and other jobs passed. Its trace showed y1324.8 outside a1000px viewport. The corrected probes assert scroll/viewport/hit target before the same native double-click. No acceptance threshold or deadline was relaxed.

Implementation approval is separate from runtime acceptance. The PR body and exact-head checks record the current candidate decision; this tracked checkpoint records what was known before that candidate ran. No previous green run qualifies a newer candidate.

## Follow-up qualification at6e579a5

The actual BASE F2/F3 regressions and F1/F4 API cases passed in run40276049354, as did the Firefox, WebKit, functional-browser and standalone-release jobs. Current-lock audit reported zero vulnerabilities. Verify stopped at the editor transfer budget and two representation-sensitive Node assertions; supported css-tree subpath imports and explicitly strengthened canonical/rollback assertions address those failures without changing the budget. See ROOT-PLAN for exact causes.

The follow-up additionally keeps valid page-only historical IDs out of the canonical game's namespace and reserves generated frame markers from editable CSS, with a validation-policy change covering trusted cached facts. These interactions were found during continued reciprocal review; they remain part of F2/F4, not newly invented review counts. Exact follow-up HEAD still needs full GitHub qualification, including the public/game cases after the Node gate.

## Follow-up qualification at8c4d353

Run40277471512 passed functional-browser and both editor compatibility jobs. Verify stopped at the unchanged 375,000-byte editor gzip gate; all other691 Node cases passed. The next candidate replaces the browser's full CSS parser import with a lossless token adapter and adds differential/corpus regressions against the authoritative server AST. The standalone movement probe now uses explicit animation time with the original movement threshold and a new game-time bound, because the failure trace established slow software-rendered frame delivery. These repairs still need GitHub execution.

A newly identified GrapesJS nesting import/render/export boundary remains open. Its handling of accepted nested selectors and declaration order must be repaired and tested in real editor canvases before final acceptance. Public O1/O2 and the integrated district checkpoint regression remain pending after the earlier budget gate. PR15 stays draft.

## Follow-up qualification at3816005

Run40546477180 passed functional-browser, both editor compatibility jobs and standalone release. The ZIP timing correction is remotely exercised. Verify had744 passing cases and3 failures:379036-byte editor gzip plus two inverse ID-spelling assertions. Strict forward CSS projection checks passed. The next change preserves the375000-byte budget, chooses GrapesJS's reviewed same-version optimized artifact, and compares inverse ID semantics while retaining unrelated-byte checks. The editor nesting/clone follow-up is still in progress. Public O1/O2 and integrated I1 remain behind verify's Node gate.

## Follow-up qualification at 5cc563e

Run 40550422163 passed functional-browser, Firefox, WebKit and standalone release; 747 Node tests passed, with only the 379020-byte editor transfer failure remaining. The next candidate retains the 375000-byte cap and ships the reviewed upstream editor bytes without rebundling, with recursive accounting, exact-copy/source-map checks and actual studio startup coverage.

Root and Astra have agreed on the new nesting/clone source boundary after reciprocal review. Canvas and capture retain native nested order, selector specificity and anonymous group identity. Clone regressions cover local references, duplicate/sibling rules, ownership and atomic refusal of unsupported imported CSS dependencies; the precise limits are documented in CMS-FRAME-MIGRATION. These are authored and statically reviewed changes, not yet remote runtime proof. Public O1/O2 and integrated I1 remain pending behind the transfer gate.

## Follow-up qualification at a86dd1c

Run 40557762688 passed functional-browser, Firefox, WebKit and standalone release. Verify passed 749 Node cases, backup recovery and the 374,164-byte editor transfer total under the unchanged 375,000-byte cap. O1/O2's four static/default probes and all five translated-v185 pointer cases passed in pinned Chromium 153.0.8010.12, so those external-environment observations are not reproduced by this supported-browser receipt.

The remaining verify failure was k16 in the 240-export group: 362 public cases passed. Its card JSON, module and independent HTTP probe completed promptly, but the initial locator's implicit readiness wait never returned a DOM sample before the outer 8-second deadline. The next candidate removes nested auto-waiting and records bounded DOM/resource evidence if it recurs, preserving every product assertion, deadline, retry policy and workload order. The underlying observation stall remains unexplained. WebGL/I1 and the final Chromium mail/editor step remain pending because of the existing sequential gate.

## Follow-up qualification at 98039d2

Run 40560885098 passed the four independent runtime jobs, while verify again stopped at one of 363 public cases. This time p19's first direct DOM sample completed and its second remained pending; a separate no-layout read also could not respond within 3001ms, despite responsive HTTP. The observation therefore extends beyond nested locator waiting. The cause remains unknown.

The next candidate isolates the unchanged 240-export matrix in its own one-worker invocation, retains the complementary 123 ordinary Chromium cases and the WebGL phase, and prevents phase artifact directories from overwriting each other. A parsed configuration guard checks those selections. The same functional assertions, fresh contexts, 8-second deadline and zero retries remain. This is a controlled workload boundary, not a claimed product fix or concurrency benchmark. I1 and the final verify stages still require execution.
