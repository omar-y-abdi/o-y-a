> Planning record. Current usage, architecture, security boundaries and verification commands are maintained in README.md and docs/CMS-*.md, docs/QA.md and docs/DEPLOYMENT.md. Planned checks below are not evidence of execution.

# Portfolio CMS implementation plan

**Goal:** Give the owner secure, complete visual control of the portfolio and publish saved edits with recoverable history.

**Architecture:** Keep the current Worker and static frontend. Isolate GrapesJS in the admin bundle; validate projects on the server and publish immutable content through D1 and R2.

**Tech stack:** Native ES modules, GrapesJS, jose, parse5, CSS Tree, Cloudflare Workers/D1/R2 and the existing Node/Playwright test tools.

**Spec:** [CMS-DESIGN.md](../../CMS-DESIGN.md).

## Global constraints

- Work on the existing `auth-email-and-cms` branch. Preserve private local files.
- Only the owner can authenticate. No deployed test bypass.
- Keep application code authoritative and protect functional DOM contracts.
- Stage and verify in isolation; production follows merge, outside this task.
- One reusable Luna Max agent only, for routine checks; primary owns architecture and final visual review.
- Keep public editor dependencies off visitor routes. Use Furl for repetitive logs.

## 1. Authentication and request boundaries

Files: `src/cms/auth.mjs`, `src/cms/http.mjs`, `src/worker.mjs`, `tests/cms-auth.test.mjs`.

- [ ] Add failing tests for missing identity/configuration, wrong issuer/audience/owner, expired/forged JWTs and cross-origin writes.
- [ ] Implement `authenticateAdmin(request, env)` with `jose`; return an owner identity only after cryptographic and exact-claim validation.
- [ ] Implement bounded JSON/body reading and same-origin write checks. Exercise invalid UTF-8, malformed lengths and streamed oversize input.
- [ ] Keep local auth fixtures entirely in test tooling. Run `node --test tests/cms-auth.test.mjs` and inspect failures before implementing each boundary.

## 2. Canonical editable content and safe compilation

Files: `src/cms/content.mjs`, `src/cms/validation.mjs`, `scripts/build.mjs`, `src/templates/layout.mjs`, `tests/cms-content.test.mjs`.

- [ ] Generate an editable baseline from actual source templates, not stale `dist` files.
- [ ] Add negative cases for scripts, event handlers, active embeds, unsafe URL/CSS syntax, malicious project properties, depth/size limits and broken application hooks.
- [ ] Compile accepted page/project values using parse5 and CSS Tree. Keep editor JSON and published output separately; preserve metadata and responsive styles.
- [ ] Prove unchanged source pages survive import/compile without lost content and that each attack fixture is rejected.

## 3. Durable revisions and media

Files: `migrations/0001_cms.sql`, `src/cms/store.mjs`, `src/cms/assets.mjs`, `src/cms/api.mjs`, `tests/cms-store.test.mjs`, `tests/cms-api.test.mjs`.

- [ ] Define immutable revision/content rows and a current pointer with optimistic concurrency.
- [ ] Verify first publication, concurrent saves, repeated request IDs, failed writes, history and restore against SQLite/D1 semantics.
- [ ] Add server-validated immutable media uploads and metadata; prove bad formats, large bodies and unauthorized writes fail.
- [ ] Route current public pages, styles and cards through published content while retaining static fallback for an untouched site.

## 4. Visual editing workspace

Files: `src/cms/client/`, `src/cms/styles.css`, admin templates/build entry, `tests/cms-browser.py`.

- [ ] Build the responsive studio shell with collapsible left navigation, actual canvas, right inspector and command bar.
- [ ] Integrate GrapesJS blocks/layers/styles/devices/undo/redo. Persist full project JSON and recoverable drafts.
- [ ] Add page and metadata management, global theme controls, desktop/mobile and paired previews.
- [ ] Implement Save/Revert/History/Restore/Lock view with retained input on failures and explicit conflict recovery.
- [ ] Exercise the UI through genuine browser actions, including touch-sized layouts and keyboard navigation.

## 5. Assets and dynamic workshop content

Files: media/card editor modules, shared card rendering, `src/client/joy.mjs`, `src/client/games.mjs`, runtime content and export helpers, relevant browser tests.

- [ ] Make win text, categories, appearance and runtime copy editable with stable links.
- [ ] Use the same visual content for preview, public receipt and image export; test long and multibyte text.
- [ ] Complete upload, replacement, alt text and usage workflows. Verify saved edits survive reload and reach public staging.
- [ ] Keep functional selectors and source-controlled code intact. Re-run workshop, privacy, navigation and contact regressions.

## 6. Deployment, evidence and PR

Files: staging configuration, reproducible setup/test commands, `docs/CMS-SETUP.md`, `docs/CMS-QA.md`, README updates and CI where needed.

- [ ] Provision isolated resources and Access policy for the exact supplied owner identity. Do not modify production routing or content.
- [ ] Verify real owner login, denied access, save/public-read and restore on staging.
- [ ] Run existing checks plus adversarial CMS/runtime/browser tests. Record metrics and verify public dependency isolation.
- [ ] Capture every admin surface and all existing pages at desktop/mobile sizes; primary independently reviews screenshots.
- [ ] Correct documentation to match actual implementation/results, review the full diff, commit coherent slices, push and create the requested PR.
- [ ] Verify the PR head and check state. Final response includes the PR and actual CMS screenshots, with any remaining limits explicit.
