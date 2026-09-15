# CMS Usability Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the owner CMS practical for high-volume media, win-card and visual editing while preserving the existing Worker/D1/R2 security and publication architecture.

**Architecture:** Keep project HTML/CSS as the content authority and GrapesJS 0.23.6 as the visual editor. Add explicit resource lifecycle/vector metadata in D1, optional win state/shared-content fields in project JSON, and focused client helpers for selection, view-state restoration, geometry and style mode. Reuse the existing validator, resource-reference scanner, replacement engine and revision system rather than creating a parallel CMS.

**Tech Stack:** Cloudflare Worker, D1, R2, Images binding, vanilla ESM, GrapesJS 0.23.6, parse5, css-tree, Playwright, Node test runner.

**Spec:** `/mnt/data/2026-09-15-cms-editor-usability-design.md`

## Global Constraints

- Baseline is GitHub `main` at `e89397d7afbcfc281151ef8bce80501f374727b9`; stop if remote main changes before packaging.
- Preserve HTML/CSS as canonical document authority; do not introduce a second editor or persistence service.
- Reuse GrapesJS Style Manager, resizer, component selection/device/drag APIs before writing custom interaction systems.
- Never accept arbitrary executable SVG; managed vector source is strict-allowlist sanitized and public consumers use validated raster derivatives.
- Permanent media deletion must fail closed when current or retained history references the resource; R2/D1 failure cannot silently orphan state.
- Win state is backward compatible: missing state means `active`; random deck is active-only, archived exact IDs remain valid, trash is not public.
- Shared content is semantic (`data-cms-shared`), never inferred from text equality.
- Precision movement may change visual translation only; it cannot reparent/reorder components. Structural moves remain in Layers.
- Do not touch unrelated styles/components or generated `dist/` in the delivery ZIP; build regenerates it.
- No hosted/prod state mutation; final hosted verification uses a temporary branch and exact tested Git tree.

---

### Task 1: Media Lifecycle With History-Safe Deletion

**Files:**
- Create: `migrations/0004_resource_lifecycle.sql`
- Create: `src/cms/media-lifecycle.mjs`
- Modify: `src/cms/assets.mjs`
- Modify: `src/cms/resources.mjs`
- Modify: `src/cms/api.mjs`
- Modify: `src/cms/client/library.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-lifecycle.test.mjs`

**Interfaces:**
- Produces `mediaUsage(db, project, src)`, `mutateUploadedLifecycle(env, id, input)`, `builtinStates(db)`, `mutateBuiltinLifecycle(db, asset, input)`.
- Asset JSON exposes `state: active|archived|trash`, `version`, `builtin`, and usage preflight is `/admin/api/resource-usage?src=...`.

- [x] Write failing Worker tests for archive/restore/trash/delete, current/history blocking, stale CAS and built-ins.
- [x] Run focused tests and confirm failure on missing lifecycle support.
- [x] Add migration and lifecycle helpers; merge lifecycle state into asset catalog.
- [x] Add authenticated endpoints and gallery actions/preflight usage display.
- [x] Run focused + existing asset/resource tests until green.
- [x] Commit.

### Task 2: Managed Editable SVG Sources

**Files:**
- Create: `migrations/0005_managed_vectors.sql`
- Create: `src/cms/static-svg.mjs`
- Create: `src/cms/client/vector-editor.mjs`
- Create: `public/vector/<managed>.svg`
- Modify: `src/content/resources.mjs`
- Modify: `scripts/build-cms.mjs`
- Modify: `src/cms/assets.mjs`
- Modify: `src/cms/api.mjs`
- Modify: `src/cms/client/library.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-svg.test.mjs`
- Test: actual module browser fixture + raster comparison.

**Interfaces:**
- `sanitizeStaticSvg(svg) -> canonical string`.
- `POST /admin/api/vector-assets` consumes `{id,name,alt,svg,pngBase64}` and returns the normal immutable asset record with retained `vectorSvg`.
- Built-in catalog may expose `vectorSvg` only for source-approved managed resources.

- [x] Add sanitizer adversarial tests and upload/derivative persistence tests; verify RED.
- [x] Implement strict allowlist sanitizer and migration.
- [x] Add managed vector API and same-canvas editor/rasterizer.
- [x] Add visually matched SVG sources only for true vector-like built-ins and pixel-equivalence tests.
- [x] Verify sanitizer, module edit/rasterize and source-vs-raster thresholds.
- [x] Commit.

### Task 3: Batch Small Wins

**Files:**
- Create: `src/content/win-transfer.mjs`
- Create: `src/cms/client/win-bulk.mjs`
- Modify: `src/cms/project.mjs`
- Modify: `src/cms/store.mjs`
- Modify: `src/client/cards.mjs`
- Modify: `src/cms/client/library.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-wins.test.mjs`

**Interfaces:**
- `cardState(card) -> active|archived|trash`.
- `exportWins(cards) -> {format:'omar-wins/v1',cards,resources}`.
- `importWins({cards,pack,mode,availableResources,idFactory}) -> cards`.
- `createWinSelection()` is persistent client-only selection state.

- [x] Add RED tests for active deck, archived direct ID, trash hidden, flavor invariants, selection persistence and import collisions/missing media.
- [x] Normalize card state and update public card selection.
- [x] Implement generic selection model + bulk UI/actions/category/export/import.
- [x] Verify atomic validation and old-project compatibility.
- [x] Commit.

### Task 4: Semantic Shared Footer Content

**Files:**
- Create: `src/cms/shared.mjs`
- Create: `src/cms/client/shared.mjs`
- Modify: `src/templates/layout.mjs`
- Modify: `src/cms/validation.mjs`
- Modify: `src/cms/project.mjs`
- Modify: `src/cms/api.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-shared.test.mjs`
- Test: `tests/cms-modules.py`

**Interfaces:**
- Trusted slot: `data-cms-shared="footer.tagline"`.
- `normalizeSharedProject(project, seed)` returns canonical pages + `sharedContent`.
- `propagateSharedEdit(project,pageId,html)` returns one project snapshot for one undo group.

- [x] Add RED tests for trusted legacy defaulting, propagation, divergent-save rejection and unrelated equal text isolation.
- [x] Mark footer structurally and normalize shared map.
- [x] Propagate client edits and validate all instances on save.
- [x] Verify Save/reload/public output and undo grouping.
- [x] Commit.

### Task 5: Undo/Redo View-State Restoration

**Files:**
- Create: `src/cms/client/view-state.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-modules.py`

**Interfaces:**
- `captureEditorView(active, context) -> snapshot`.
- `restoreEditorView(active, snapshot, context) -> Promise<void>`.

- [x] Add RED real-GrapesJS test for selected element, canvas coords, iframe scroll and inspector scroll across teardown/recreate.
- [x] Implement capture/restore helper without altering Draft semantics.
- [x] Wire undo/redo and selection rerender restoration.
- [x] Verify no top jump or inspector jump.
- [x] Commit.

### Task 6: Safe Resize and Precision Nudge

**Files:**
- Create: `src/cms/client/geometry.mjs`
- Modify: `src/cms/client/editor.mjs`
- Modify: `src/cms/client/inspector.mjs`
- Test: `tests/cms-modules.py`

**Interfaces:**
- `configureComponentGeometry(component)` sets resize/translate capability without reparenting.
- `nudgeComponent(component, dx, dy)` uses CSS `translate` and preserves parent/index.

- [x] Add RED test for link/text resizable, protected input not resizable, 1/10px nudge and parent/index invariance.
- [x] Enable GrapesJS resize/translate only for allowlisted visual components.
- [x] Replace inspector structural move controls with nudge/reset controls.
- [x] Verify href/classes/ARIA/existing transform survive.
- [x] Commit.

### Task 7: Selected-Element Color/Effects Style Mode

**Files:**
- Create: `src/cms/client/style-mode.mjs`
- Modify: `src/cms/client/editor.mjs`
- Modify: `src/cms/client/inspector.mjs`
- Modify: `src/cms/client/app.mjs`
- Test: `tests/cms-style-mode.test.mjs`
- Test: `tests/cms-modules.py`

**Interfaces:**
- `setStyleMode(editor, enabled)` swaps only the Style Manager sectors.
- `applyStylePreset(component, preset)` writes validated normal CSS properties.

- [x] Add RED contract tests proving only color/effects properties are exposed and presets pass CSS validation.
- [x] Configure GrapesJS Style Manager sectors for foreground/surface/borders/SVG/depth effects.
- [x] Add selected-element scope UI and safe presets.
- [x] Verify sibling unaffected and normal design sectors restore when leaving style mode.
- [x] Commit.

### Task 8: Centered Mobile Canvas and Integration Gates

**Files:**
- Create: `src/cms/client/canvas-layout.mjs`
- Modify: `src/cms/client/app.mjs`
- Modify: `src/cms/styles.css`
- Modify: docs and tests as needed.

**Interfaces:**
- `centerEditorCanvas(editor,{device,stageWidth})` owns device-width/zoom/coord calculation.

- [x] Add RED geometry tests for 390px edit/lock and panel resize; verify current double-offset/device-name failure.
- [x] Centralize centering; remove duplicate X offset and compensate zoom transform-origin.
- [x] Reapply on ready/device/panel/window/unlock/undo-redo.
- [x] Update docs and migration guidance.
- [x] Run all Node/Worker files, Chromium modules, HTTP, edge dry-run and diff-check.
- [ ] Run exact-tree hosted verify + Firefox + WebKit before packaging.
- [ ] Create touched-files-only ZIP against clean `e89397d`, verify overlay byte-for-byte, produce manifest and local commands.
