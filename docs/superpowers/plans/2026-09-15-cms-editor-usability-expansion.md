# CMS Editor Usability Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing owner-only GrapesJS CMS practical for daily editing while preserving the current D1/R2/Worker architecture and validation boundary.

**Architecture:** Extend the existing versioned project/resource model. D1 stores media lifecycle and built-in resource state, project JSON stores win state/shared content, and GrapesJS supplies resize/style/canvas behavior. New focused client helpers own batch selection, view-state restoration, shared propagation, and precision positioning.

**Tech Stack:** Node.js 24, native ES modules, GrapesJS 0.23.6, Cloudflare Worker/D1/R2/Images, Miniflare, parse5, css-tree, Playwright.

**Spec:** User-approved “CMS editor usability expansion — design spec”, 2026-09-15.

## Global Constraints

- Start from `e89397d7afbcfc281151ef8bce80501f374727b9` on a dedicated branch.
- Reuse GrapesJS 0.23.6 and the current D1/R2/Worker pipeline; no second editor/backend.
- No general unsafe SVG upload path; managed SVG must be sanitized.
- Old revisions remain readable and optional fields receive trusted defaults.
- Destructive operations are authenticated, origin checked and CAS-aware.
- No unrelated cleanup/refactor.

---

### Task 1: Media lifecycle and built-in resource state
**Files:** `migrations/0004_media_lifecycle.sql`, `src/cms/assets.mjs`, `src/cms/api.mjs`, `tests/cms-usability.test.mjs`
- [ ] Add RED Worker tests for active/archive/restore/trash/delete, current/history blockers and stale CAS.
- [ ] Add lifecycle columns/table and run migrations in real Miniflare D1.
- [ ] Implement lifecycle/usage APIs and built-in state merge.
- [ ] Re-run focused tests and existing media/storage tests.

### Task 2: Win lifecycle, publication and batch model
**Files:** `src/cms/project.mjs`, `src/cms/store.mjs`, `src/cms/render.mjs`, `src/client/cards.mjs`, `src/client/joy.mjs`, `src/cms/client/win-bulk.mjs`, tests.
- [ ] Add RED tests for state defaults/invariants, archived direct lookup, trash exclusion, atomic batch actions and import/export validation.
- [ ] Add card state normalization and active-flavor publication invariant.
- [ ] Publish active deck IDs, retain archived exact-ID rows, omit trash rows.
- [ ] Implement pure batch/import/export helper and integrate gallery actions.

### Task 3: Shared content
**Files:** `src/cms/shared-content.mjs`, `src/cms/shared-project.mjs`, `src/cms/project.mjs`, `src/cms/validation.mjs`, `src/templates/layout.mjs`, `scripts/build-cms.mjs`, tests.
- [ ] Add RED tests for semantic inner HTML, propagation, defaults and publication divergence/missing marker rejection.
- [ ] Permit only safe `data-cms-shared` markers and normalize shared values.
- [ ] Mark footer tagline and propagate edits across linked pages in one draft change.

### Task 4: Managed SVG sources
**Files:** resource/content modules, managed SVG sanitizer module, API/client resource editor integration, tests.
- [ ] Inventory vector-like built-ins and pair them with trusted vector sources; do not auto-vectorize raster-only content.
- [ ] Add RED sanitizer/adversarial tests.
- [ ] Implement strict static-SVG allowlist and immutable managed SVG revisions/derivatives.
- [ ] Validate visual dimensions/bounds for converted assets.

### Task 5: Editor resize, style mode and precision movement
**Files:** `src/cms/client/editor.mjs`, `src/cms/client/inspector.mjs`, focused helper modules, tests.
- [ ] Add RED tests for resize allowlist and position helper.
- [ ] Replace structural move controls with 1px/10px CSS `translate` nudges + reset.
- [ ] Preserve existing transforms/classes/hrefs/ARIA.
- [ ] Reuse GrapesJS Style Manager with color/effects-only sectors in Website Style mode.

### Task 6: View-state and centering
**Files:** `src/cms/client/view-state.mjs`, `src/cms/client/app.mjs`, `src/styles/studio.css`, browser/module tests.
- [ ] Add RED tests for selection identity, inspector scroll capture/restore and center math.
- [ ] Capture device/zoom/coords/frame scroll/selection/tab/inspector scroll before undo/redo and restore after editor ready.
- [ ] Preserve inspector scroll across selection rerenders.
- [ ] Use one centering path for edit/lock/device/panel/resize/undo transitions.

### Task 7: Resource and win UX integration
**Files:** `src/cms/client/library.mjs`, `src/cms/client/app.mjs`, styles, tests.
- [ ] Add lifecycle tabs/actions/reference counts for media and built-ins.
- [ ] Add win checkboxes, persistent selection, batch bar, state/category/search filters, import/export.
- [ ] Validate entire batches/packages before mutation.

### Task 8: Full verification and delivery
- [ ] Run focused RED/GREEN suites and regression Node tests.
- [ ] Run `npm run quality`.
- [ ] Run `npm run test:cms`.
- [ ] Run `npm run test:cms:compat`.
- [ ] Run `npm run edge:check`.
- [ ] Inspect browser evidence for key editor interactions/mobile centering.
- [ ] Rebuild tracked `dist/`, verify clean intended diff, package only touched/new files plus Windows command script.
