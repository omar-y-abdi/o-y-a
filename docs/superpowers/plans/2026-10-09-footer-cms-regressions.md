# Footer and CMS regression repair

> Execute inline using systematic debugging and red/green tests. No production writes, deployment or merge.

**Goal:** The added developer link is editable and saveable in the CMS, while every footer control stays inside the footer at mobile widths.

**Scope:** Repair PR #10 against main `3f00d9d`; retain owner content, history, element identities/references, contact/consent security and the current design. Worktree: `/Users/k/dev/o-y-a-footer-cms-20261009`.

## Evidence

The live homepage at CMS version 183 uses `#iyi2x6{height:282px}`. At 393 px the last control extends below the saved 282 px footer. Cross-browser experiments proved that `min-height:fit-content` expands the footer in Chromium/WebKit but Firefox needs a narrow-screen `height:auto` fallback. CSS does not shrink text or conceal links. The developer anchor is injected only by `renderPage`, without a CMS identity. Inserting that anchor in the source template shifted the privacy control from `n340` to `n341` and all later generated keys. Stored pre-PR-10 pages keep the former keys, so the current validator rejects an ordinary edit with the reported functional-binding error. Baseline: 229 fast tests plus the recovery drill pass, demonstrating the missing regression coverage.

## Implementation and acceptance

- [x] Add a pre-PR-10 fixture from the actual source template with its old numbering; verify red tests for read/edit/save/history/recovery and footer containment.
- [x] Build an explicit, trusted mapping between the old and current footer contracts. Migrate only pages that match the old protected control identity, validating the entire legacy HTML before remapping keys and any matching CSS selectors. Mark migrated pages so later owner edits/removals are not overwritten.
- [x] Use that normalization for stored CMS state, incoming projects and public rendering; include the real developer page when upgrading an old project. Remove the public-only regex injection. Keep old immutable CSS URLs unchanged and use a versioned representation for normalized CSS.
- [x] Set the footer's intrinsic minimum height so the saved fixed height remains a minimum rather than clipping wrapped text. No font shrinking or hidden overflow.
- [x] Prove real authenticated browser edit/save/reload, mobile/desktop containment and privacy controls in Chromium and WebKit. Add the regression runner to CI.
- [x] Run full repository checks, public browser regressions, CMS smoke checks, Wrangler dry-run and review the diff.
- [ ] Commit, push, open a new PR and verify hosted CI without merging.

## Verification ledger

- Baseline `npm ci && npm run build && TEST_CONCURRENCY=2 npm test`: 230/230 passed.
- Live read-only probe recorded under ignored `output/footer-regression/`; no live messages, saves, or configuration changes.
- Authenticated legacy-D1 footer E2E: Chromium 8/8, WebKit 8/8, Firefox 8/8. Includes save/reload, preview and a second footer-link edit.
- Real saved fixed footer heights tested at 320, 390, 393, 760, 1440 px, including no-JavaScript.
- New/footer unit tests: 6/6. Real CMS incremental save rejects forged footer schema versions and correctly accepts version 1.
- Final `TEST_CONCURRENCY=2 npm run check`: 237/237 fast tests, plus 1/1 D1/R2 restoration test. `CMS_MODULE_PROFILE=smoke npm run test:cms:modules`: passed in the project's Python Playwright environment.
- Hosted CI initially identified a CSS-cache URL regression affecting existing clone checks in Chromium, Firefox and WebKit. The new contract keeps ordinary "/review-clone.css" URLs unchanged and adds `?footer=1` **only** when the public CSS bytes were migrated. The existing Firefox clone/browser suite passes 8/8 after this correction.
- `SKIP_CHECK=1 npm run quality`: 21/21 HTTP, real browser E2E 317 direct passes plus 3 retried passes (320 total), interaction/privacy/revision suites passed. The first full run overlapped other browser suites, so record retry flakiness rather than claiming a perfectly clean first pass.
- `npm run edge:check:built`: Worker dry-run succeeded.
- Ora 2026-10-09 scan and Cloudflare 403 diagnostics are in `docs/AGENT-READINESS-2026-10-09.md`. No claims of a post-deployment 100/100 score.
