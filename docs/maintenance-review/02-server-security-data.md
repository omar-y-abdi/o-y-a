# PR14 server, security, and data audit

> Frozen Luna Max review of maintenance `71b30dc` against main `80630c7`. Findings describe that source snapshot, not the current repaired tree. Current disposition and verification evidence are maintained in [ROOT-PLAN.md](ROOT-PLAN.md) and [ASTRA-PLAN.md](ASTRA-PLAN.md). Source line numbers refer to the frozen snapshot.

## Pinned scope and verdict

Reviewed the maintenance worktree at `71b30dc18b073f310fed386bba7664d7afb77abf` against base `80630c7d280c71314702af791dbc0828d9ff8b0a`. The worktree `HEAD` matched the requested head. Its status showed an existing untracked `node_modules`; it was left untouched.

Static review found **four actionable issues** in the newly added mail path and one security-documentation mismatch. I did not find an auth bypass, an HTML/CSS validation bypass, or a broken D1 publication transaction in the reviewed paths. These are code-review conclusions only; no tests, builds, servers, or application runtime were run.

## Request and data flow

- Admin requests enter `src/worker.mjs`, then `src/cms/api.mjs`. `handleAdmin` authenticates the Access JWT before dispatch. Mutations pass `requireWriteRequest` for POST, exact origin, the CMS marker, content type, and same-origin Fetch Metadata when present.
- Save and recovery requests flow through client-format normalization, frame/legacy conversion, `validateProjectWithReferences`, media validation, and `publishSite`. Publication inserts the immutable revision, resource index, rendered rows, media publication state, and head pointer in one D1 `batch`; stale head writes are conditional. Cloudflare documents `D1Database.batch()` as a transaction that rolls back the sequence on a statement failure ([D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/)).
- Public CMS pages and public data read only the current head's rendered rows. Contact submissions use the submitted content version to pin `@resources` and `@email`, render the notification and optional receipt, and call Resend with a deterministic idempotency key.
- Admin mail writes an intent and atomically claims uploaded files before calling Resend. Confirmed and ambiguous sends are tracked in `cms_sent_mail`. Uploaded attachments live in the private R2 prefix `mail-private/`; Resend receives a URL signed by `CONTACT_HASH_SECRET`, and `/mail-file/*` verifies it before streaming from R2.
- `deploy:cloudflare` builds, checks the current stored head, applies D1 migrations, then deploys the Worker. The separate frame migration endpoint uses raw-revision version/hash checks and the normal conditional publication path. Prune and media-strip scripts are explicit operator tools; none were executed.

## Changed-file coverage ledger

**Server and data implementation inspected:**

- Worker and policy: `src/worker.mjs`, `src/csp.mjs`, `wrangler.jsonc`, deleted `wrangler.staging.jsonc`.
- Admin routing, persistence, validation, rendering, and resources: `src/cms/api.mjs`, `assets.mjs`, `compatibility.mjs`, `diagnostics.mjs`, `email-api.mjs`, `email-validate.mjs`, `frame-converter.mjs`, `frame.mjs`, `legacy-keys.json`, `legacy-project.mjs`, `project-changes.mjs`, `project.mjs`, `raster-integrity.mjs`, `render.mjs`, `resources.mjs`, `routes.mjs`, `skift.mjs`, `store.mjs`, `templates.mjs`, `validation.mjs`.
- Contact and email server boundary: `src/server/contact-secrets.mjs`, `contact.mjs`, `email-render.mjs`, `emails.mjs`.
- Schema and migration/release data tools: `migrations/0007_contact_mail.sql`, `scripts/cms-migrate-frame.mjs`, `cms-prune-rendered.mjs`, `cms-pull-release.mjs`, `cms-release-errors.mjs`, `cms-strip-media.mjs`, `legacy-keys.mjs`.

**Adjacent callers and relevant test evidence inspected:** send/retry and upload sections of `src/cms/client/email.mjs`, the request wrapper in `src/cms/client/api.mjs`, email route wiring in `src/cms/client/app.mjs`, and submission ID/content-version handling in `src/client/contact.mjs`. Test code/excerpts reviewed include `tests/cms-legacy.test.mjs`, `cms-prune-rendered.test.mjs`, `cms-rendered-retention.test.mjs`, `stored-revisions.test.mjs`, `cms-frame-gate.test.mjs`, `cms-frame-migration.test.mjs`, `cms-cpu-budget.test.mjs`, `email-api.test.mjs` (request boundary, attachment lifecycle, retry, cleanup and orphan cases), and `cms-email.spec.mjs` (frozen send/retry IDs). Other changed test files were inventoried but are not represented here as fully reviewed. No test was run.

## Findings

### SD-01 — Medium: signed attachment bearer tokens are captured in persistent trace URLs

**Scenario.** An authorized owner sends an attachment. The Resend request includes `/mail-file/{id}/{exp}/{HMAC}` in the remote attachment URL. The Worker accepts the HMAC URL as the sole download credential. A Cloudflare account user with trace access can copy that path and download the private attachment while its signature remains valid.

**Evidence.** `signFileLink` embeds the HMAC in the path ([`src/server/contact-secrets.mjs:92-103`]); `sendMail` passes that full URL as Resend's attachment path ([`src/cms/email-api.mjs:298-310`]); `serveMailFile` treats it as bearer authorization and streams the private R2 object ([`src/cms/email-api.mjs:433-452`]). `wrangler.jsonc:58-62` enables persisted Worker traces with `head_sampling_rate: 1`, so every incoming request is selected for tracing under the configured rate. Cloudflare says a selected request's full path is captured and traces are retained for seven days ([trace configuration](https://developers.cloudflare.com/observability/traces/configuration/), [Workers tracing](https://developers.cloudflare.com/workers/observability/traces/)). The config's `redact_query_string` is explicitly `false` at `wrangler.jsonc:51`; Cloudflare defines this setting as removing **query strings** from request URLs in logs and traces ([Workers configuration API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/)). It cannot redact the HMAC currently embedded in the path. `logs.invocation_logs` is false, but that does not disable the separately enabled traces. Cloudflare's tracing FAQ also says URLs and query strings are captured and header values are not ([Workers tracing FAQ](https://developers.cloudflare.com/observability/traces/workers-tracing/)).

**Minimal durable fix.** Keep the signature out of the path. Put it in a query parameter and enable `redact_query_string: true`, or use a download mechanism that does not expose a bearer secret in the URL. Query redaction is scoped to logs and traces; it does not redact path segments. Add a test that the generated request URL has no signature-bearing path segment and that the logging configuration redacts query credentials. Preserve the signed-link expiry and tamper checks.

**Required tests.** Verify valid, expired, tampered, and wrong-object link cases after moving the token; assert the HMAC is absent from the path; assert trace query redaction is enabled. A post-deploy trace check is needed to confirm the platform's effective setting.

**Confidence.** High on the code/config path and Cloudflare trace behavior; no deployed trace was inspected.

### SD-02 — Medium: `/mail-file/` is missing from reserved CMS routes

**Scenario.** An owner creates and publishes a CMS page at `/mail-file/` (or a child path). `validatePagePath` accepts it because `RESERVED` omits `mail-file`; every request is intercepted earlier by the Worker download route and returns 403 for a page URL without a valid signed file token. The published page is unreachable.

**Evidence.** `src/cms/routes.mjs:2,21-24` is the source of the reserved segments and page-path validation. `src/worker.mjs:114-116` claims every path starting `/mail-file/` before public CMS routing. `serveMailFile` rejects a page-shaped path at `src/cms/email-api.mjs:435-441`.

**Minimal durable fix.** Add `mail-file` to `RESERVED`, with a regression case for `/mail-file/` and `/mail-file/notes/` through path validation and Save. Keep the public signed-download namespace unavailable to CMS pages.

**Confidence.** High; the branch and route order are explicit.

### SD-03 — Medium: private attachment expiry is opportunistic, and cleanup failures lose the R2 key

**Scenario.** An owner uploads an attachment and then does not upload or send another email. The row and private R2 object remain after `expires_at`; no scheduled trigger exists in `wrangler.jsonc`, and `cleanup()` is only called by upload and send. If a later cleanup's R2 deletion fails, the D1 row has already been deleted, and the catch logs only a generic storage failure, so the private object cannot be retried or identified from the database or logs.

**Evidence.** Opportunistic cleanup deletes up to 20 D1 rows before calling R2 and catches without `reportMailOrphan` ([`src/cms/email-api.mjs:127-132`]); its only callers are upload and send ([`src/cms/email-api.mjs:293,375`]). The config has no scheduled trigger ([`wrangler.jsonc:1-82`]). The separate manual-remove path explicitly logs the server-made orphan key when the R2 delete fails ([`src/cms/email-api.mjs:389-400`]), showing that the cleanup path has weaker recovery evidence. Existing tests assert cleanup only “at the next upload or send” and cover cleanup's delete-before-R2 order, but do not inject cleanup R2 failure ([`tests/email-api.test.mjs:294-325,828-837`).

**Minimal durable fix.** Run bounded cleanup on a schedule or provide a recurring owner-run task. Preserve retry state when R2 deletion fails: for example, delete R2 first and then remove the D1 row, or record failed R2 keys in a durable cleanup queue. If the key is removed from D1 before R2 succeeds, log the exact server-generated private key as the manual-remove path does.

**Required tests.** An expired row is cleaned without any subsequent user upload/send; R2 failure leaves a retryable/traceable key; a rerun removes the orphan without touching unexpired or claimed files.

**Confidence.** High on missing automatic caller and D1-before-R2 ordering; deployment scheduling configuration was inspected statically only.

### SD-04 — Medium: rotating `CONTACT_HASH_SECRET` makes saved settings unreadable and invalidates outstanding attachment URLs

**Scenario.** An operator rotates the Worker secret after contact settings have been saved in D1 or while a scheduled email has a signed attachment URL. Existing ciphertext is decrypted only with the current master, and the same current master verifies mail-file HMACs. The saved settings become `unreadable` and do not fall back to environment values; any old scheduled link fails verification. The setup doc says to keep the value stable for idempotency but does not explain that it is also the encryption/signing root or provide a rotation sequence.

**Evidence.** The module describes settings as encrypted from `CONTACT_HASH_SECRET`, derives the AES and HMAC keys from it, and returns failure when decryption fails ([`src/server/contact-secrets.mjs:5-25,40-45,61-69`]). Attachment signatures use the same current master ([`src/server/contact-secrets.mjs:92-103`]). Scheduled mail links can remain valid through the scheduled time plus one hour ([`src/cms/email-api.mjs:294-310`]). Setup only says to preserve the value between normal publishes ([`docs/CONTACT-SETUP.md:33-41`).

**Minimal durable fix.** No requirement for seamless key rotation is established. Document a controlled owner procedure: retain the old key until recovery is verified, record/re-enter all four setting values through the admin UI after rotation, and drain or cancel scheduled sends that depend on old attachment signatures before changing the key. Only add versioned keys with a decrypt/verify overlap and re-encryption migration if uninterrupted rotation is a product requirement. Do not represent this secret as idempotency-only configuration.

**Required tests.** Rotate with saved rows and an outstanding scheduled link; confirm the documented path preserves settings and serves/cancels pending mail correctly, and that an intentionally unavailable old key fails closed without silently using stale environment settings.

**Confidence.** High on the single-key code path; whether any saved values or scheduled mails exist in the live database is unknown.

### SD-05 — Low: the security guide claims validation that the code intentionally no longer performs

**Scenario.** A reviewer or operator relies on the security guide's claim that imported legacy editor JSON is traversed, type/security checked, and limited to one million characters per page. The current implementation ignores editor JSON and discards it, so that asserted validation boundary and per-editor-project limit do not exist. Discarding the data is safe for rendered output, but the guide is inaccurate about what the server checks.

**Evidence.** The guide makes the claims at [`docs/CMS-SECURITY.md:13,19,29`]. Current project validation outputs `project: null` without inspecting `page.project` or `card.design.project` ([`src/cms/project.mjs:86-90,129-140`]). The changed regression test explicitly says unused editor JSON is never validated or persisted and confirms it cannot source content ([`tests/cms-legacy.test.mjs:24-33`).

**Minimal durable fix.** Update the guide to say HTML/CSS are the validated canonical representation, legacy editor JSON fields are ignored and discarded, and the request-size cap is the applicable bound. Remove the obsolete editor-JSON validation limit.

**Required tests.** Keep the existing discard behavior pinned; add a docs assertion only if the repository's docs tests are intended to freeze this wording.

**Confidence.** High; source and changed test agree.

## Release, rollback, and coverage gaps

- The deploy command's compatibility check selects only the current head by default: `scripts/cms-pull-release.mjs:78-80`; `package.json:21` invokes it without `--all`. The manual-only `stored-revisions` job runs `--all` with exact-error allowlisting. A future deployment can therefore pass the automatic preflight while an older retained revision is no longer restorable under current contracts. This is a release-coverage gap, not a current-head corruption finding. Keep an automated all-history check with reviewed exact exceptions, or explicitly make it a required predeployment operator gate when contracts change.
- The release check and subsequent migration/deploy are separate remote operations (`package.json:21`). No write lock or post-check head comparison spans that interval. An old Worker Save between the read-only head check and new Worker deployment is a possible TOCTOU ordering. The current frame converter accepts legacy schema-1 projects, which reduces this risk for this migration, but the gate is not a snapshot lock. A source-contract change should either freeze writes through the deploy window or prove concurrent old-Worker Save behavior with a release-level test.
- **Current-branch CPU risk is unmeasured, not an accepted green claim.** `normalizeStoredProject` delegates to `toFrameProject`; only schema 2 returns early, while schema 1 reparses/splits each page and partitions CSS (`src/cms/frame-converter.mjs:37-59,84`). `/admin/api/state` and preview/baseline paths call this conversion from `src/cms/api.mjs:27-34,41-48,186-202`. The frame-migration guide says reading schema 1 does not rewrite D1 and makes migration owner-operated (`docs/CMS-FRAME-MIGRATION.md:3-5,38-48`), so a legacy head can pay this conversion on every admin read until Save or the explicit migration appends schema 2. The changed CPU helper explicitly converts the v185 fixture and saves schema 2 before it times helpers; its 5 ms/80 ms checks do not time the cold schema-1 path or a complete Worker handler (`tests/cms-cpu-budget.test.mjs:36-62`). The live head's schema, full-handler CPU and current `cpu_time_ms` are unknown here. Require a cold legacy full-handler measurement and post-migration warm measurement before making a Worker-budget claim; do not use helper timings as that proof.
- `cms-migrate-frame` is a head-only, expected-version/hash migration and `publishSite` performs the D1 CAS; the concurrent migration test exists in `tests/cms-frame-migration.test.mjs`. This is a sound data migration shape. It was not executed here.
- Resend idempotency is keyed by a frozen request ID; local uncertain retries stop at 23 hours. Resend's official documentation describes a 24-hour idempotency window and rejects the same key with a different payload ([Resend idempotency keys](https://resend.com/changelog/idempotency-keys)). I found no static mismatch in the admin send retry window. No live provider behavior was exercised.

## Strong controls confirmed by static inspection

- Admin endpoints authenticate before dispatch; writes require same-origin/write-marker/content-type checks. Public contact separately verifies origin, Turnstile host/action, honeypot, and rate limit.
- CMS HTML/CSS validation rejects executable markup, event handlers, unsafe resource URLs, and active CSS; protected fallbacks are restored from trusted source bytes. The public contact/template path uses escaped renderers and does not log visitor bodies or secrets.
- Mail recipients, scheduled times, image references, attachment count, upload name/type/declared size, encoded aggregate attachment size, and signed-link expiry are checked before provider send. Unconfirmed send intents are preserved and shown as uncertain rather than silently retried with a fresh request ID.
- CMS Save and frame migration use idempotency/request identity plus head-version CAS. D1 `batch` semantics are documented as transactional; the changed tests pin rollback and stale-write behavior, but these tests were not run.

## Doubtful premises and verification boundary

- `wrangler.jsonc` points to resources whose names include `staging`; the PR's updated deployment docs assert those bindings are the production D1/R2. I did not query Cloudflare or inspect credentials, so actual account/resource ownership is **unknown**. Do not treat the documentation statement as live verification.
- No CI result, remote migration, deploy, Cloudflare trace, contact submission, Resend send, or R2 cleanup was verified. The hard no-run/no-secret boundary was followed.
- External findings above use official Cloudflare and Resend documentation; no legal conclusion is made.

## Primary references

- [Cloudflare Workers tracing](https://developers.cloudflare.com/workers/observability/traces/) — automatic request instrumentation and seven-day trace retention.
- [Cloudflare trace configuration](https://developers.cloudflare.com/observability/traces/configuration/) — sampled requests capture the full request path.
- [Cloudflare tracing FAQ](https://developers.cloudflare.com/observability/traces/workers-tracing/) — URLs and query strings are captured; request header values are not.
- [Cloudflare Workers configuration API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/) — `redact_query_string` controls query-string redaction in logs and traces.
- [Cloudflare D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) — transactional batch and rollback behavior.
- [Resend idempotency keys](https://resend.com/changelog/idempotency-keys) — provider idempotency window and conflicting-payload response.
