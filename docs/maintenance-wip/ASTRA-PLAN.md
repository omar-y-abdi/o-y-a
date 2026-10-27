# CPU continuation: Astra implementation and peer review

## Scope and baseline

This continuation starts at merged main `550383c449cf4d57eea4762122df8e88be710734`. Its tracked tree equals the reviewed PR15 tip `74398a9218eec582ac75cc25f023142500028271`. PR15 repair is complete; its exact-head acceptance remains in that PR. The original CPU and public-performance work were not imported by that repair.

The owner has authorized the complete remaining work queue and local verification. Root and this peer remain equal authors and independent reviewers. Root coordinates runtime execution and Git publication. This peer owns canonical studio storage, target previews, the bounded CPU migration and their tests/runbooks in `maintenance-wip-cpu`. Root owns browser parity, CI/corpus work and subsequent structural integration. No private plan, credentials, dependencies or old dirty worktree content may be staged wholesale.

The older uncommitted CPU work at `9b959d8` supplies design evidence, not an accepted patch. Its schema-1 assumptions omit the editable frame and per-page identity projections, and its historical gate was red. New schema changes append after the eleven shipped migrations.

## Observable completion criteria

- Canonical current-state responses avoid gzip revision transfer/decompression and full-project parsing/stringifying. Mutable media metadata remains fresh. Explicit historical reads retain the original revision path.
- Every successful publication updates canonical text and immutable validation facts atomically with revision, rendered content, resource index and head. Stale writers and failed statements preserve the prior complete state. Full/delta/legacy replay identities remain unchanged.
- Stored text is reused only for the matching head and canonicalization/validation build identity. Release checks independently detect representation drift; a fallback read does not certify canonical storage.
- Preview transports and validates only content its target can emit: selected main or card, its actual shared frame/projection, emitted cards and applicable global settings. Server HTML/CSS/contracts/local references/media checks remain authoritative. Publication-wide relationships remain Save's responsibility.
- Only exact server-held facts may skip immutable structural validation. Their identity covers content, source/contracts, schema, frame/projection, origin and policy; mutable media readiness is checked afresh.
- Client preview reuse follows immutable draft identity/generation/target, evicts failures and invalidates for asset changes. Device-only resizing shares pending/completed content without suppressing real edits.
- An existing-head migration is bounded, resumable and independently validated. It pins source revision bytes, deployment policy and prior canonical representation; partial work is invisible and commit uses one guarded transaction. History, version and public output remain intact. CPU canonicalization must not silently choose a conflicting frame or apply owner appearance decisions.
- Regression evidence covers real schema-2 behavior and the actual historical BASE transition, including Save replay, frame IDs/CSS, mail/resources, hostile client facts, media invalidation, concurrent migrations, rollback and backup restore. Root runs the focused suites before broadening.
- Whole-handler CPU measurements explicitly distinguish cold/warm and Node proxy measurements from Cloudflare edge `cpu_time_ms`. Historical estimates and reviewer-set thresholds are not permission to relax existing gates or proof that every request fits the production plan.

## Bounded implementation sequence

1. Canonical head storage: append-only schema, build identity, trusted JSON chunks, guarded publication integration, state/current reads, release and backup checks. Freeze this source/tests for root review before expanding preview behavior.
2. Target preview: extract reusable validation seams without weakening publication, persist exact immutable facts, share resource work, integrate client request coalescing and actual browser coverage.
3. Existing-head migration: export/prepare/validate/commit protocol, safe retries and source/policy races, representation/public-identity rehearsal, runbook and release gate.
4. Coordinate measured runtime evidence, repair failures, reciprocal whole-diff review and exact-head CI. No automatic merge or production data operation.

## Initial source findings

At the merged baseline, `api.mjs` state still reads/decompresses the whole project, normalizes legacy input and walks references. Preview shares the full publication validator and receives the whole project from `client/app.mjs`. `publishSite` is the central writer for full Save, delta Save and explicit frame migration; restore/import ultimately enter Save. Direct fixture publishers also use it and must invalidate any optional cache when they cannot supply trusted validation context.

The schema-2 converter intentionally applies owner decisions to old page/frame CSS and can retain frame choices. The existing published row and the normalized studio project therefore need separate identity checks. The CPU operation must preserve that distinction rather than treating a successful converter call as permission to change the public site.

## Storage slice authored for reciprocal review

Migration `0012` adds two current-head tables: a small identity/resource header and bounded JSON text parts. No preview or migration staging table is added before its consumer exists. The build fingerprints the actual bundled canonicalization/validation dependency closure and exact seed; static paths are sorted for reproducibility. Reads require both matching current head and that build key. Missing schema or an old key uses the existing revision reader; incomplete text or resource indexing is surfaced. Text/hash equality is independently checked by release validation, not recomputed on every serving request. The canonical query also returns the indexed media references and index-completeness marker, avoiding extra state round trips.

All three application publication sites (full Save, delta Save, explicit frame migration) supply the build identity after validation. `publishSite` writes a canonical copy only for schema 2; reverse/schema-1 and direct publishers without context invalidate it inside the same guarded transaction. Existing request hashes/formats and raw historical reads are unchanged. This first slice accelerates `/state`; current-project callers used by Save still use their original reader until the subsequent measured preview/storage integration.

The read-only release loader retrieves canonical text by fixed version and bounded part. Its independent check compares text, hash and resource metadata with the raw revision's current normalized representation. The backup drill includes canonical tables and the resource index. Authored tests cover no full-project parse/stringify or revision BLOB during canonical state, mutable builtin metadata, full/delta replay after a later Save, stale/concurrent writers, foreign keys, rollback after text deletion, policy fallback, missing schema, corrupt text/index, Unicode chunking and release mismatches. Runtime execution is pending root coordination.

An equal representation with an older build key remains content-compatible but produces an explicit `studioRefreshRequired` release receipt. It does not qualify the fast CPU path: after the matching build is deployed, a validated Save or the forthcoming bounded migration must refresh that copy before performance acceptance. This also applies when the key changes only because the static asset inventory changed. The release checker never writes production data. A source-closure regression checks repeatability, checkout-path independence, changed contracts/assets and a real validator semantic mutation without a manual policy bump. The full matching-code migration/rollout procedure remains required work; this checkpoint does not claim that deployment alone eliminates legacy CPU cost.

The first root browser-port batch also received independent source approval: all fifteen original HTTP interaction/privacy cases and eleven scroll/fika cases retain their assertions; PNG signature/dimension checks strengthen generation evidence. Originals remain until paired execution and per-case mutation evidence qualify retirement. This approval does not cover the separate render-only adapter or hosted analytics delivery.

No implementation tests or runtime measurements have run in this continuation yet. The old worktrees and their dependency directories remain untouched.
