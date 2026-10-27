# PR14 cleanup inventory and provenance audit

> Frozen Luna Max review of maintenance `71b30dc` against main `80630c7`. Findings describe that source snapshot, not the current repaired tree. Current disposition and verification evidence are maintained in [ROOT-PLAN.md](ROOT-PLAN.md) and [ASTRA-PLAN.md](ASTRA-PLAN.md). Source line numbers refer to the frozen snapshot.

## Conclusion

The game license files were removed from tracked `public/` and `dist/` outputs, but the current source build is designed to regenerate them beside the game bundle. I found no evidence that PR14 simply dropped the game's three runtime license texts. The generated site and game outputs are ignored, so this source review could verify the build instructions but not inspect a fresh output.

There is a separate, older coverage gap in the rest of the portfolio distribution: the CMS uses GrapesJS and its compiled vendor CSS, and the card-export bundle uses `html-to-image`, but the build only emits linked code comments. It does not add full package license texts for those other browser bundles. This is an artifact finding, not a legal conclusion. The build also needs a current module graph before anyone can claim an exhaustive license inventory for the Worker bundle.

## Pinned scope and method

- Base: `80630c7d280c71314702af791dbc0828d9ff8b0a`
- Head: `71b30dc18b073f310fed386bba7664d7afb77abf`
- Source worktree: `the historical maintenance checkout`
- The sidecar inventory reports 359 changed entries: 135 additions, 112 deletions, 100 modifications, and 12 exact `R100` moves. The path ledger is [changed-files.tsv](changed-files.tsv); [inventory.json](inventory.json) pins the same endpoints.
- Review was static: Git trees and diffs, tracked source, package manifests and lockfiles, the exact root-installed package license files, plus official upstream sources linked below. No project test, build, server, npm command, install, or application runtime was run. No file in the source worktree was changed. Its existing untracked `node_modules/` remained untouched apart from reading pinned package metadata/license files.

The conclusions below distinguish observed source/build behavior from generated output that was not produced in this review. A clean `dist/` output and a current CMS/Worker metafile were absent; no production data or uploaded assets were inspected.

## Surface ledger

| Change class | Count | Paths and classification |
| --- | ---: | --- |
| Additions | 135 | `.node-version` (1); `docs/CMS-FRAME-MIGRATION.md` (1); `games/skift/**` source, package, artwork/audio authoring, docs and tests (47); `migrations/**` (1); `scripts/**` (7); root `src/**` (12); root `tests/**` (66). The complete names are in the pinned `changed-files.tsv`. |
| Modifications | 100 | `.github/workflows/ci.yml`, `.gitignore`, `README.md`; 10 docs; root `package.json` and lock; `playwright.config.mjs`; 14 scripts; 34 source modules; 35 root tests; `wrangler.jsonc`. These include the CMS, CI, Worker and test changes assigned to other reviewers; this audit classifies their surface, not their behavior. |
| Deletions | 112 | 61 generated `dist/**` outputs; 21 historical docs/evidence files; 16 old `public/play/skift/**` outputs/duplicates; 3 old scripts; 7 CMS/game source modules; 3 Python test modules; and `wrangler.staging.jsonc`. Every path is listed under “Removal register” below. |
| Exact moves | 12 | `docs/revision/PRIVACY-DECISIONS.md` to `docs/PRIVACY-DECISIONS.md`, plus 11 game audio files from `dist/play/skift/audio/` to `games/skift/public/audio/`. All 11 audio blobs are byte-identical to the baseline copies under `public/play/skift/audio/`. |

### Added game package

The 47 new `games/skift/**` paths establish a source-owned game package: `CREDITS.md`, `README.md`, `START.bat`, `START.command`, four docs (`DESIGN.md`, `INTEGRATION.md`, `PLAN.md`, `VERIFICATION.md`), `index.html`, its package and lockfile, `public/icon.svg`, six build/authoring/release scripts, 14 source modules, `start.py`, and 14 game tests. The 11 exact audio moves are additional package inputs. This replaces the old imported release path with editable game code and a build adapter.

Other added root paths by group are the bootstrap and CMS modules under `src/`, the new CMS frame/contact migration and helper scripts, 66 new root tests, and migration `0007_contact_mail.sql`. Static mapping does not prove that every removed CMS behavior is preserved; the separate CMS/client/test reviews own those seams.

### Removal register

Every deletion in the pinned inventory is classified here. `R100` audio source paths are listed separately as moves, not as lost files.

| Removed paths | Classification |
| --- | --- |
| `dist/404.html`, `dist/_headers`, `dist/index.html`, `dist/robots.txt`, `dist/sitemap.xml`, `dist/openapi.json`, `dist/llms.txt`; `dist/{developers,integritet,kakor,kontakt,login,om,tillganglighet,verkstad,villkor}/index.html`; `dist/projekt/{backhaul,blade-blend,furl}/index.html` | Generated public pages and routing/metadata outputs. `scripts/build.mjs:23-72` deletes and rebuilds `dist/` from `public/`, route templates, CMS build output and the game build. |
| `dist/admin/index.html`; `dist/admin/assets/{chunk.35ADBXS6.mjs,chunk.P26OSDAQ.mjs,grapes.fb55e939b334.css,preview.ZP5VQATO.mjs,studio.56c58a7812ec.css,studio.YNRZFIJJ.mjs,studio.YNRZFIJJ.mjs.LEGAL.txt,win.SQJ7PMFR.mjs}` | Generated CMS shell/vendor bundles and a linked legal-comment output. `scripts/build-cms.mjs:23-45` regenerates the editor CSS, GrapesJS CSS and esbuild bundles. |
| `dist/assets/{cards.7445450e93d0.mjs,contact.0754027d6d94.mjs,copy.46755f96c139.mjs,games.9aced906e981.mjs,joy.e58fa0407110.mjs,main.d5cc08fe6873.mjs,memory.2a2519efff0b.mjs,playlogic.92e6e1470703.mjs,previewdata.c0c063c9f4b2.mjs,privacy.969e756f7a55.mjs}`; `dist/assets/{site.69c093c2f69e.css,site.8c9faccc7524.css,site.c284c6ca6254.css,site.d12fc177b64b.css,site.ea65c6ee77d1.css,site.fd595f4e3084.css}` | Generated content-hashed client modules and styles, rebuilt from `src/`. |
| `dist/cms-public/{login.c3bca71510b4.css,win.57b79af9c719.mjs}`; `dist/data/{cards.json,runtime.json}` | Generated CMS/public assets and data. |
| `dist/{apple-touch-icon.png,favicon.svg,mail/omar-smile.gif,mail/omar-smile.png,mail/omar-smile.svg,social/omar-yusuf.png}` | Generated/copy outputs whose source assets remain under `public/`; these are not independent source deletions. |
| `dist/play/skift/{RELEASE.json,THIRD-PARTY-LICENSES.txt,index.html}`; `dist/play/skift/assets/{app.css,app.js,app.js.LEGAL.txt,bootstrap.js}` | Generated game page, bundles, release metadata and notices. Current `scripts/build.mjs:27-28` calls the source build and hashes its generated `app.js`; `games/skift/scripts/build-portfolio.mjs:9-40` writes the game outputs and notices. The removed baseline bundle itself is not the source of truth at head. |
| `public/play/skift/{RELEASE.json,THIRD-PARTY-LICENSES.txt,assets/app.css,assets/app.js,assets/app.js.LEGAL.txt,audio/boss.wav,audio/cell.wav,audio/clear.wav,audio/dash.wav,audio/fail.wav,audio/hit.wav,audio/pulse.wav,audio/scrap.wav,audio/shift.mp3,audio/shot.wav,audio/strike.wav}` | Old checked-in runtime mirror. Bundle/release/license files are rebuilt from `games/skift/**`; the 11 audio files are duplicated copies and the canonical copies moved to `games/skift/public/audio/`. `.gitignore:19` now excludes this obsolete mirror. |
| `scripts/import-skift.mjs` | Removed the release importer that copied and patched a minified bundle. The source build now compiles `games/skift/src/main.js` and builds the portfolio page from game-owned markup. |
| `src/content/skift-copy.mjs`, `src/templates/skift.mjs` | Removed derived CMS copy/page snapshots. `games/skift/src/copy.mjs` and `games/skift/src/page.mjs` are the new source adapters; `scripts/build.mjs` imports the game page directly. |
| `scripts/prepare-footer-migration.mjs`, `scripts/serve.mjs` | Authored helper scripts removed, not generated artifacts. Their exact replacement/retirement behavior is outside this provenance review. |
| `src/cms/client/legacy.mjs`, `src/cms/client/shared-project.mjs`, `src/cms/editor-schema.mjs`, `src/cms/footer.mjs`, `src/cms/shared-content.mjs` | Authored CMS modules removed during the frame/content migration. New frame, legacy-project and client modules are present, but this audit does not assert behavioral parity; the CMS reviewer must map them. |
| `tests/email_render.py`, `tests/http_checks.py`, `tests/test_card_export_helpers.py` | Authored test modules removed amid test-port/organization changes. New JS tests with related subjects exist; parity is for the test/CI reviewer. |
| `wrangler.staging.jsonc` | Deleted deployment config. `docs/DEPLOYMENT.md` now states there is no staging Worker; deployment-safety review owns that policy change. |
| `docs/AGENT-READINESS-2026-10-09.md`, `docs/ASSET-SIZES.json`, `docs/CARD-EXPORT-LAYOUT-FIX.md`, `docs/CMS-BROWSER-HARNESS-FIX.md`, `docs/CMS-REVIEW-REMEDIATION.md`, `docs/CMS-UNIFIED-PACKAGE.md`, `docs/ENVIRONMENT.json`, `docs/PLAN.md`, `docs/SOURCES.md`, `docs/handoff-cms-save-cpu.md`, `docs/revision/CHANGES.md`, `docs/revision/FILE-HASHES.json`, `docs/superpowers/plans/2026-09-13-portfolio-cms.md`, `docs/superpowers/plans/2026-09-15-cms-editor-usability-expansion.md`, `docs/superpowers/plans/2026-10-09-footer-cms-regressions.md` | Historical/working documentation and local evidence, not build inputs. `ASSET-SIZES.json` and `ENVIRONMENT.json` are generated snapshots; the plans, handoff, change/hash records and screenshots are authored historical evidence. `docs/SOURCES.md` was an authored site/source ledger; it is removed rather than updated. `games/skift/CREDITS.md` covers the game only and does not replace that broader site record. |
| `docs/cms/screenshots/{compare.png,editor-desktop.png,editor-mobile.png,login-desktop.png,media-library.png,win-design.png}` | Authored/manual review screenshots removed; not regenerated by the site build. Their evidence remains recoverable from Git history, but no equivalent current screenshot set is tracked in this diff. |
| `docs/revision/PRIVACY-DECISIONS.md` | Exact move to `docs/PRIVACY-DECISIONS.md`; content unchanged. |

The `dist/` deletions are justified by the source build and deploy contract: `.gitignore:8` ignores `dist/`, `scripts/build.mjs` starts with `rm('dist')`, and `docs/DEPLOYMENT.md:9-14` says the deploy command must build it before Wrangler deploys. Keep these deletions and rebuild release output; do not restore generated bundles as tracked source. Actual fresh output equivalence still needs a permitted build/release verification before claiming it.

## Distribution, licenses, vendor CSS, audio and fonts

### Game output: removed tracked notices are regenerated

Baseline `public/play/skift/THIRD-PARTY-LICENSES.txt` and `dist/play/skift/THIRD-PARTY-LICENSES.txt` each contain four full-text sections: Three.js, cannon-es, Howler and esbuild (section starts at lines 1, 26, 52 and 75). The baseline `dist/play/skift/assets/app.js.LEGAL.txt:1-31` contains the Howler 2.2.4 and Three.js license-comment snippets. The baseline `dist/admin/assets/studio.YNRZFIJJ.mjs.LEGAL.txt:1-12` separately contains a Backbone.Undo.js v0.2 MIT-comment snippet.

The current source builder retains that game notice path:

- Root site build calls `buildSkift()` at `scripts/build.mjs:18,27`.
- `games/skift/scripts/build-portfolio.mjs:25-31` reads `three/LICENSE`, `cannon-es/LICENSE`, `howler/LICENSE.md` and `esbuild/LICENSE.md` from the root install and writes `dist/play/skift/THIRD-PARTY-LICENSES.txt`. `games/skift/scripts/build-options.mjs:1-6` sets `legalComments: 'linked'`; the portfolio builder reads and normalizes the emitted `assets/app.js.LEGAL.txt` at line 30-31.
- The current root lock pins Three.js 0.180.0, cannon-es 0.20.0, Howler 2.2.4 and esbuild 0.28.2 as development/build inputs (`package.json:35-42`). The standalone game lock pins the same three runtime libraries and esbuild 0.25.12 (`games/skift/package.json:20-27`). `docs/SKIFT.md:64-70` explicitly records that root and standalone esbuild versions differ and that byte-identical bundles are not assumed.
- The four baseline notice sections match the corresponding currently installed root package license files after trailing-whitespace normalization. Package names/versions and license identifiers were checked against the exact lock and installed `package.json` files. Official pinned sources: [Three.js r180 LICENSE](https://github.com/mrdoob/three.js/blob/r180/LICENSE), [cannon-es v0.20.0 LICENSE](https://github.com/pmndrs/cannon-es/blob/v0.20.0/LICENSE), [Howler v2.2.4 LICENSE](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md), [esbuild v0.25.12 LICENSE](https://github.com/evanw/esbuild/blob/v0.25.12/LICENSE.md), [esbuild v0.28.2 LICENSE](https://github.com/evanw/esbuild/blob/v0.28.2/LICENSE.md), and the [esbuild legal-comments documentation](https://esbuild.github.io/api/#legal-comments).
- `tests/skift-build.test.mjs:58-64` checks the exact runtime audio filenames and source-byte equality and checks both generated notice files are nonempty. `games/skift/tests/release_test.py:22-40` checks the ZIP contains the full notice file and that the archive manifest matches every included file. These tests were inspected, not run; they do not assert the expected license section names/text in generated output.
- The standalone `games/skift/scripts/build.mjs:14-23` also uses linked legal comments and writes a full-text notice file. Its notice-read loop catches missing paths, but the pinned runtime license files exist in the root install and no missing file is proven here. The standalone esbuild 0.25.12 package is in the game lock but is not separately installed in this checkout, so its local tarball file was not compared.

Thus `games/skift/CREDITS.md:13` refers to post-build paths that are absent from Git but generated at the referenced `dist/play/skift/...` paths by the current builders. `games/skift/scripts/release.py:28-32` refuses to package the standalone ZIP unless its generated license text exists. The deletion of `public/`/`dist/` copies is not itself evidence of missing game notices.

### Other vendor output: notice coverage gap

**Finding 1 — P2, distribution artifact completeness; no legal verdict.** The site’s CMS browser output includes third-party vendor code and styles beyond the game, while its current source build does not create full-text notices for that package graph. Whether this is legally insufficient is not determined by this audit.

- `src/cms/client/editor.mjs:1` imports `grapesjs`; `scripts/build-cms.mjs:33-42` copies its compiled CSS and bundles the studio/preview JavaScript. The exact locked GrapesJS package is 0.23.6 and its package manifest/license identify BSD-3-Clause (`package-lock.json:1412-1425`; upstream [v0.23.6 LICENSE](https://github.com/GrapesJS/grapesjs/blob/v0.23.6/LICENSE) and [package.json](https://github.com/GrapesJS/grapesjs/blob/v0.23.6/package.json)).
- The exact baseline vendor CSS `dist/admin/assets/grapes.fb55e939b334.css` is byte-identical to the installed GrapesJS 0.23.6 `dist/css/grapes.min.css`. It contains CodeMirror styles and Spectrum Colorpicker styles. GrapesJS’s package source declares CodeMirror 5.63.0 and codemirror-formatting 1.0.0 and imports CodeMirror CSS (`node_modules/grapesjs/src/styles/scss/main.scss:3-4`); its pinned source CSS labels Spectrum Colorpicker v1.8.1 as MIT (`node_modules/grapesjs/src/styles/scss/spectrum.scss:1-6`). The lock identifies Backbone 1.4.1, backbone-undo 0.2.6, CodeMirror 5.63.0, codemirror-formatting 1.0.0, html-entities 1.4.0, promise-polyfill 8.3.0 and underscore 1.13.8 as GrapesJS dependencies, plus type package `@types/backbone` 1.4.15 (`package-lock.json:1250-1295,1412-1425,1435-1440,1560-1565,1666-1671`; the exact CodeMirror upstream [5.63.0 LICENSE](https://github.com/codemirror/codemirror5/blob/5.63.0/LICENSE)). The installed GrapesJS stylesheet contains inline data-URI PNG/GIF helper images but has no `@font-face`, Font Awesome reference, external URL, or font file. No Font Awesome package entry appears in the root lock.
- The baseline studio `dist/admin/assets/studio.YNRZFIJJ.mjs.LEGAL.txt:1-12` contains only the Backbone.Undo v0.2 comment/link, not the full GrapesJS BSD text, CodeMirror license text, or the Spectrum MIT source header. `scripts/build-cms.mjs:38-42` sets esbuild to `legalComments: 'linked'` and rewrites emitted comment files; it does not copy package license files or include the copied CSS’s source license header. The baseline compiled CSS `dist/admin/assets/grapes.fb55e939b334.css` has no comments.
- `src/client/win.mjs:1` imports `html-to-image` 1.11.13. `scripts/build.mjs:29-33` bundles that browser entry but does not copy its `LICENSE` into the output. A static scan of the baseline minified `dist/cms-public/win.57b79af9c719.mjs` found no license/copyright banner text, while the exact pinned package has an MIT license (`package-lock.json:1441-1446`; upstream [v1.11.13 LICENSE](https://github.com/bubkoo/html-to-image/blob/v1.11.13/LICENSE)).
- The root source also declares `css-tree` 3.2.1, `image-dimensions` 2.5.1, `jose` 6.2.12 and `parse5` 8.0.1 as production dependencies (`package.json:27-34`). Static imports place them in CMS/server code (`src/cms/auth.mjs:1`, `src/cms/assets.mjs:1`, `src/cms/resources.mjs:1-2`, `src/cms/validation.mjs:1-2`, `src/cms/html-tree.mjs:1`, `src/server/markdown.mjs:1`); their exact inclusion in the deployed Worker bundle is not proven without Wrangler output. The lock maps `css-tree` MIT to `mdn-data` CC0-1.0 and `source-map-js` BSD-3-Clause, and `parse5` MIT to `entities` BSD-2-Clause (`package-lock.json:1310-1322,1333-1343,1447-1451,1462-1470,1481-1486,1505-1513,1629-1637`). These are potential Worker-package notices, not confirmed output modules in this review.
- `scripts/build-cms.mjs` requests an esbuild metafile but does not persist its input graph. The ignored `.generated/build.json` is absent in this worktree; even when written, `scripts/build.mjs:70-71` records only the returned CMS asset paths, not CMS module inputs. So the full current JS package graph is **unknown** from the allowed static evidence; the list above distinguishes package dependencies from a proven present-day bundled-module inventory.

**Minimal durable fix:** make the generated release output include a third-party notice file for the actual browser bundle graph, including vendored CSS components. Use the build metafile or another exact input inventory as the source of package versions, and copy the exact package/source license texts used. Keep the existing game notice generation. Decide separately whether to include notice texts for Worker-only packages and development/test dependencies in source ZIPs; neither should be inferred from the browser bundles.

**Required regression:** after a clean build, assert that the notice output contains the exact expected package/version/license entries for the actual studio, vendor CSS and card-export graphs, including Spectrum and CodeMirror CSS. Assert that the notices are reachable from the published distribution. No current build result was produced in this review.

**Confidence:** high that current build source does not copy full license texts for the visible GrapesJS CSS and `html-to-image` output; high that the baseline studio legal-comment file only contains Backbone.Undo; medium about the complete current CMS JavaScript package list because no CMS metafile/output was inspected. Legal sufficiency remains for the owner’s qualified license review.

This is a **baseline coverage gap preserved by PR14**, not a new consequence of deleting tracked `dist/`: the baseline already had the GrapesJS and html-to-image bundles without those full texts. PR14 makes the game’s source build explicit, but does not appear to address site-wide dependency notices.

### Audio, game art and fonts

- Every moved game audio file (`boss.wav`, `cell.wav`, `clear.wav`, `dash.wav`, `fail.wav`, `hit.wav`, `pulse.wav`, `scrap.wav`, `shift.mp3`, `shot.wav`, `strike.wav`) matches the baseline `public/play/skift/audio/` blob exactly. The old duplicate public copies are removed; `games/skift/public/audio/` is the canonical source location. The root build copies these bytes to `dist/play/skift/audio/` (`games/skift/scripts/build-portfolio.mjs:24`).
- `games/skift/scripts/audio.py:1-20,21-57` describes and implements the sound-effect and music synthesis; it uses Python standard-library signal generation and calls ffmpeg only to encode the delivered MP3. The audio source and assets remain in the game package; no third-party sample, model or music file was found in the game source surface. I did not execute the authoring script or claim byte-for-byte regeneration.
- The game source describes original procedural geometry in `games/skift/src/art.js` and has no tracked font files. The GrapesJS package has no font file, and the vendor CSS has no Font Awesome/font-face reference, as above. The CMS can publish user-uploaded WOFF2 assets (`src/cms/theme-core.mjs:5-12`, `src/cms/theme.mjs:18-22`); actual uploaded fonts are not in this checkout, so their origins/terms cannot be inventoried here. That is a content-owner provenance question, not an assertion of a code defect.

## Findings and documentation questions

**Finding 2 — P3, stale standalone ownership text in the packaged game docs.** `games/skift/docs/DESIGN.md:4` tells readers not to modify, commit to or deploy `omar-y-abdi/o-y-a`, while this PR integrates `games/skift/` into that repository and `docs/SKIFT.md:47-76` now documents it as the editable source. `games/skift/CREDITS.md:5` says no repository changes/commits/deployments were made without identifying the time or scope. The referenced CSS blob is not fabricated: it resolves to the historical `src/styles/base.css` blob `9a02b9b77640f8e80d21e18a188b58826d760204` at commit `bf455abad7b6b25ea456cef199cef3aafe2c013a` (2026-09-11), rather than the later audit base/head CSS blobs. `games/skift/scripts/release.py:15-21` packages both `CREDITS.md` and the entire `docs/` tree into the ZIP, so the old instruction ships with the standalone game package.

**Scenario:** a reader of the current source tree or game ZIP can interpret the old standalone constraint as current repository ownership guidance and the unscoped “no changes” sentence as describing this integration. The earlier authoring context explains the text, so this is an ambiguity rather than a proven false provenance claim.

**Minimal fix:** date and label the statement as historical standalone-game authoring context, pin the source revision there, and rewrite or remove the “do not modify the repository” direction now that this package is integrated. Preserve the historical CSS blob reference with its commit context.

**Required regression:** review the packaged docs contract against current integration ownership; a docs check can require any source-provenance hash to resolve to its named historical commit and require historical “no repo change” claims to state their scope/date. **Confidence:** high on the text and package inclusion; medium on reader confusion; no integrity issue found in the cited hash itself.

### Questions and review limits

- `docs/SOURCES.md` was deleted. It is dated 2026-09-11 and includes historical site-content/asset provenance; it is not current enough to restore verbatim. The new `games/skift/CREDITS.md` is game-specific. If the site still needs a maintained source/evidence ledger, create an updated one rather than treating game credits as a replacement.
- The game source ZIP includes source, tests, package locks and `@playwright/test` 1.63.0, while its generated full-text notices list runtime game packages plus esbuild. Playwright is a development/test dependency (Apache-2.0 in `games/skift/package-lock.json:465-473,535-556` and upstream [v1.63.0 LICENSE](https://github.com/microsoft/playwright/blob/v1.63.0/LICENSE)); it is not bundled into the gameplay runtime or copied as a package. Whether a source ZIP also needs its full text is not answered here.
- The root Worker uses `src/worker.mjs` (`wrangler.jsonc:3-10`) and the source imports packages including `css-tree`, `image-dimensions`, `jose` and `parse5`. Their lock entries identify versions/licenses, but the current Wrangler output graph and notice bytes were not generated or inspected. Do not claim the full Worker notice inventory from direct imports alone.
- The complete CMS browser graph is not proven from current output without a clean build/metafile. The exact baseline CSS and baseline notice file were read; no current `dist/` artifacts are present to validate generated files after the last source edit.
- No license/attribution conclusion is made from package metadata alone. This report records source, package and output-file evidence; it does not declare legal compliance or noncompliance.

## Retain / rebuild / repair recommendation

1. **Retain** the `dist/**` deletions and the move to canonical game source/audio. The build code regenerates the website pages, CMS bundles and game outputs, including game full-text licenses and linked comments. Require fresh build/release evidence before claiming the deployed artifact is complete.
2. **Retain** the game’s full-text notice generation and `RELEASE.json`; improve the regression to check expected notice entries, not just nonempty files.
3. **Repair** the broader CMS/browser vendor notice output if the owner’s release policy requires full package texts, using the actual bundle graph and the source/vendor CSS components.
4. **Clarify** standalone-game provenance and ownership language so the shipped package does not present a pre-integration instruction as a current rule.
5. **Do not restore** the stale planning/docs/screenshots wholesale. Recreate only maintained site provenance evidence that still has an owner and a current source.

## Official primary references

- [esbuild API: legal comment output](https://esbuild.github.io/api/#legal-comments)
- [GrapesJS v0.23.6 LICENSE](https://github.com/GrapesJS/grapesjs/blob/v0.23.6/LICENSE) and [package manifest](https://github.com/GrapesJS/grapesjs/blob/v0.23.6/package.json)
- [CodeMirror 5.63.0 LICENSE](https://github.com/codemirror/codemirror5/blob/5.63.0/LICENSE)
- [Spectrum LICENSE](https://github.com/bgrins/spectrum/blob/master/LICENSE) (the pinned GrapesJS package CSS source labels the embedded Spectrum Colorpicker 1.8.1 MIT)
- [Backbone.Undo.js project](https://github.com/osartun/Backbone.Undo.js)
- [html-to-image v1.11.13 LICENSE](https://github.com/bubkoo/html-to-image/blob/v1.11.13/LICENSE)
- [Playwright v1.63.0 LICENSE](https://github.com/microsoft/playwright/blob/v1.63.0/LICENSE)
- Game package sources: [Three.js r180 LICENSE](https://github.com/mrdoob/three.js/blob/r180/LICENSE), [cannon-es v0.20.0 LICENSE](https://github.com/pmndrs/cannon-es/blob/v0.20.0/LICENSE), [Howler v2.2.4 LICENSE](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md), [esbuild v0.25.12 LICENSE](https://github.com/evanw/esbuild/blob/v0.25.12/LICENSE.md)
