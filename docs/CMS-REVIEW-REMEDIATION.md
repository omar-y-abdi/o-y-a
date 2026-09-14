# PR #2 review remediation

Original reviewed head: `d0295e5653d6402c54f64f7449053c51663e89df`.
Unified-package baseline: `f159a2ae496dd48d8a858ef993f6342b0f734837`.
Scope: the single-owner portfolio CMS. No repository push, deployment, real owner session, hosted data mutation or real email was performed for this unified package.

## Findings and regression ownership

“Inherited” means the WIP implementation was retained and exercised, not reimplemented. Browser test coverage below identifies runnable acceptance tests, **not a claim that navigational E2E passed in the restricted build environment**.

| Finding | Implementation and evidence |
| --- | --- |
| R1: shared recovery slot | Inherited per-session IndexedDB keys, generations and active-session locks. Same-context save/revert/reload regression in `cms-review-browser.py`. |
| R2: incomplete recovery | Inherited safe recovery distinct from publication validity, visible failure/export, original retained. Node safe-draft tests; incomplete/expired-session browser tests; added quota/export acceptance. |
| R3: noscript parser disagreement | Inherited browser-equivalent parse, trusted fallback isolation and serialization check. Exact payload rejected in real Worker regression. CSP remains unchanged. |
| R4: poisoned 413 retry | Inherited definitive-versus-unknown outcome handling. Added **real** 8 MiB request rejection and compressed-revision rejection, corrected save, no version advance on rejection and identical replay; browser suite retains network fault tests. |
| R5: oversized aggregate card row | Inherited individual card rows, ordered manifest and independent UTF-8 row/bind budgets. Actual 1,200-card local D1 test passes. Hosted-limit-equivalent assertions are not a hosted capacity test. |
| R6: font replacement | Inherited typed references across HTML, CSS and legacy editor data. Resource tests pass. Added UI acceptance using distinct 400/700 WOFF2 fixtures, theme/per-element references, public bytes and restoration. |
| R7: built-in resource slots | Inherited versioned social/icon/email slots and consumers, usage and promotion. Worker/resource tests and the browser slot-replacement scenario retained. Inbox delivery remains separate. |
| R8: extensionless route | Inherited shared canonical routing. Real Worker tests cover nested routes, queries, HEAD, missing targets and static resources. |
| R9: internal links and built assets | Inherited route/fragment resolution; added authoritative built-resource inventory validation rather than trusting a matching URL suffix. Missing built images rejected without advancing a revision. |
| R10: stale media metadata | Inherited version precondition and field-specific mutation, explicit conflict review/retry. Server and browser CAS regressions retained. |
| R11: dangling ID references | Inherited ARIA/label/SVG reference graph validation. Server regression retained; clone acceptance checks ARIA and SVG targets. |
| R12: clone links target original | Inherited subtree ID remapping and CSS references. Browser regression follows both links, checks styling and deletes the original before revalidation. |
| R13: cached policy/release gap | Inherited policy/contract fingerprint and uncached retained-revision checks. Added CLI test exposed a separate bug: D1 `exec` split multiline SQL strings. Release checking now imports trusted SQL with the real local SQLite parser and checks compatible/incompatible exports. Added actual two-instance D1/R2 backup/restore drill. The unified version also shares publication media-readiness checks: missing/unvalidated references fail the read-only release check. |
| R14: active text loss | Reproduced before modification. Live rich-text DOM is snapshotted without resetting the editing DOM; input immediately marks the draft dirty, with normal idle backups. Real keyboard/module regression and synthetic composition pass. Native typing/backup/reload/Save acceptance added. |
| R15: preview-data spoof | Reproduced and rejected in the corrected Worker. Public loaders ignore author markers. Preview JSON requires the studio-owned srcdoc/head channel, one reserved ID and schema checks. Genuine locked preview uses that channel; duplicate/malformed/untrusted-context tests added. |
| R16: undecodable uploads | Reproduced for header-only PNG and truncated PNG/JPEG/WebP/GIF/AVIF. Added bounded container checks and actual Images decoding before registration, plus validation-version migration and legacy revalidation before promotion. Real offline codec tests pass, including corrupt IDAT with a valid CRC and distinct service/configuration failures. The unified version additionally verifies bounded WebP response signature/length, including split-stream headers, so HTTP-200 error text is not accepted as decoder success. Hosted entitlement/fidelity remains a deployment gate. |
| R17: invisible card text slot | Reproduced. Enforce HTML text-bearing containers and reject void/inert/hidden contexts; renderer also checks its precondition. Worker tests plus actual visible multiline rendering and PNG pixel checks. |
| R18: malformed/divergent editor JSON | Reproduced. Validate legacy collection/member shapes; persist and edit only canonical HTML/CSS. Invalid legacy state no longer reaches GrapesJS. Original-version export remains visible; API persistence and actual editor load tests cover malformed and divergent cases. |
| R19: incomplete widget semantics | Reproduced. Contracts now include control cardinality, semantic values, exact hook ownership and absent/present state attributes. Added unnamed/ID-only controls, new disabled/readonly/hidden state, and print-button first-span identity tests. Legal original widgets/wrappers retain their existing tests. |
| R20: inspector destroys rich content | Reproduced. Change only the text range, retain tags/attributes/IDs and use GrapesJS's identity-preserving collection update. The stronger test caught and fixed loss of ID-specific CSS too. Actual model identity, individual 31px style, class color, Unicode, line breaks, links and escaping pass. |
| R21: authored root transform lost | Reproduced. Fitting belongs to outer wrappers; editor export, locked preview and public export share the renderer. The unified pipeline retains A's supported text containers and uses B's descendant bounds, isolated fitting wrappers and disposable export. Pixel regressions keep an overhanging red marker at 600/280px widths; export preserves inherited theme variables and uses the current width even before ResizeObserver runs. Authored transforms and the live preview remain unchanged. All 240 standard exports were generated and decoded. |

## CI regression and test discovery

The supplied `publica scripts saknas i preview: []` failure was a readiness race: the server response already contained the correct public module. The browser assertion now waits for the module element inside the newly attached iframe, then verifies it; it has not been removed or weakened.

`test:cms` now includes the original suites, isolated product-module checks and both review suites. CI adds Firefox/WebKit jobs for the targeted review acceptance and module fixtures. The original default-card exports, security budgets, functional tests and CSP remain in place. An actual alternate-port HTTP run also caught three hardcoded analytics-port calls in the inherited test; they now honor the existing port argument, without changing product behavior.

## Verification boundary

Fresh unified-package verification passed build/lint, 149 Node/workerd/D1/R2 tests, 19 local HTTP checks and 12 actual-product Chromium module scenarios (including 240 PNG exports). All inherited A test names remain covered. See [selection rationale](CMS-UNIFIED-PACKAGE.md) for the combined implementation and added regressions. Normal localhost browser navigation is denied with `ERR_BLOCKED_BY_ADMINISTRATOR`; this is an environment restriction, not a product pass/fail. No policy bypass was used. Full navigational Chromium/Firefox/WebKit acceptance must run locally or in GitHub Actions before approval.

Operational work includes redacted failure IDs, session-aware backup/export/import, WIP pagination/font budgets, actual save limits, real raster decoding, a file-based disaster-recovery rehearsal and an uncached release check. No local test proves real owner OTP/logout, a rejected real identity, a hosted D1 capacity boundary, Images entitlement/animation fidelity, production configuration or external inbox delivery.

See [local verification and deployment prerequisites](CMS-LOCAL-VERIFICATION.md) for commands, artifact paths and remaining account-level sign-off.
