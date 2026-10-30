# CMS security and operating limits

## Identity and request boundary

Cloudflare Access protects `/admin` and its descendants. The Worker independently verifies an RS256 application JWT with `jose`: signature from the configured HTTPS Access organization, exact issuer and audience, required issued/expiry times, application token type, subject and exact allowed owner email. A session lasts at most one hour. Unsigned identity headers do not grant access. Missing configuration fails closed.

All admin HTML, bundles and APIs require authentication. Writes additionally require POST, exact request origin, the CMS request marker, accepted content type and a same-origin Fetch Metadata value when present. The API does not enable credentialed CORS. Encoded/ambiguous routes cannot bypass admin routing. Successful authenticated GET/HEAD responses for the build's exact content-hashed studio MJS/CSS inventory use `private, max-age=31536000, immutable`, including the nested GrapesJS vendor module. The browser may reuse this code; shared caches may not. Admin HTML, APIs/state, other paths, mutations and errors remain `no-store`, as does mutable public content. Immutable revision styles and published files have stable URLs.

The owner address is a Worker secret, never a bundled constant. Access application audience and organization hostname are identifiers, not credentials. Local test keys and cookies exist only under ignored output directories. Local identity fixtures cannot authenticate against the deployed Access organization. The local runtime replaces outbound JWKS only inside the test harness; production contains no development authentication bypass.

## Content boundary

HTML is parsed with parse5 and CSS with css-tree. Canonical project fields have explicit type, count and size limits. Scripts, event handlers, unsafe URLs, active embeds, foreign SVG content and external CSS imports in canonical content are rejected. Legacy editor JSON is ignored and discarded, including executable fields inside that unused data; it is not traversed as an additional security boundary. Resources must come from approved local asset paths or registered R2 media paths. Page routes cannot shadow administration, APIs, private attachment downloads or infrastructure.

Protected component contracts preserve functional attributes, exact hook ownership, control counts, semantic values and state, required classes and the nearest functional parent. Visual wrappers and reordering within a function remain possible. Moving a control outside its functional group is rejected. Page validation also checks main content, heading structure, image alternatives and local links. Runtime text placeholders must retain their original set.

Public CSP is defined by the committed `CSP` and `SKIFT_CSP` constants in `src/csp.mjs`. Executable scripts may load only from the same origin and Cloudflare Turnstile; inline executable scripts and eval remain blocked. SKIFT additionally permits same-origin and blob media. JSON-LD and runtime JSON are inert data blocks and need no script hashes. The separate admin policy allows inline styles for GrapesJS and validated previews. The visual editor's affordances are not the security boundary: server checks run for direct API requests too.

HTML/CSS are the canonical editor representation. Legacy page and card `project` JSON fields are never used to source rendered content and are normalized to `null`; their bytes still count toward the incoming request limit. Preview-only JSON is restricted to one server-owned head record in a studio-owned srcdoc iframe. CMS-rendered public HTML embeds runtime copy from the page's own revision, read in the same D1 query, in `script#cms-runtime[type="application/json"]`. Serialization replaces every `<` with the literal JSON escape `\u003c`, preventing stored text from closing the script or opening an HTML comment. The client reads this head block before fetching `/data/runtime.json`; the endpoint remains available to API clients and pages without a block. Public card loading continues to use validated endpoints.

## Storage and recovery

D1 stores compressed immutable revisions, rendered public content and an atomic current pointer. A save includes baseVersion and a unique requestId. Stale updates fail with 409. Transaction rollback prevents half-published websites. Retries with the same request are idempotent. Restoring an older revision creates a draft; a subsequent Save appends a new revision.

Validation may reuse unchanged content from the server's trusted published baseline. Client-supplied cached facts do not create trust. Published media references are extracted from rendered HTML/CSS and actual uploaded font usage, excluding GrapesJS's private asset registry.

R2 keys are immutable UUIDs. Upload parsing checks headers, bounded container integrity, size and dimensions; raster files must also decode through the CMS_IMAGES binding before registration. MIME is derived by the server. Existing unverified rows are checked before promotion under the media-integrity migration. WOFF2 has its separate bounded header policy; raster decoding is not a font-integrity certification. A private upload is not served publicly until used by a published revision. Archiving hides a file from selection but preserves bytes and historical URLs. Previously published files remain public after removal from a current page. Do not upload confidential files expecting later archival to revoke their old public URLs.

The older `cms_media_delete_queue` remains recoverable. An explicit delete moves its matching snapshot back into canonical `cms_media` storage and consumes the queue in one D1 transaction, guarded by the exact snapshot, resource identity/version and current site version. The ordinary current-draft, retained-history and publication-CAS deletion checks then apply before R2 deletion. A newly referenced legacy file regains its metadata but its bytes are retained and deletion is rejected. Invalid snapshots, stale versions and conflicting current identities leave the records for owner review. If R2 deletion fails after handoff, the canonical `deleting_at` claim is retryable. Archive, restore and trash do not execute a queued deletion.

An old queued record without a `cms_media` row is absent from the library. To recover it, first take the D1/R2 backup and rehearse on a copy described in [DEPLOYMENT.md](DEPLOYMENT.md). The owner can inspect only queue identifiers and recorded versions with this read-only command from the intended checkout:

```sh
npx wrangler d1 execute CMS_DB --remote --command "SELECT id, object_key, CASE WHEN json_valid(snapshot) THEN json_extract(snapshot, '$.version') END AS base_version FROM cms_media_delete_queue ORDER BY created_at, id"
```

Review one intended deletion at a time. A missing/non-integer version or unexpected object key needs backup inspection, not an invented value. If the resource already exists in the library, use its normal delete action with its current version. For a queue-only record, open the intended site's `/admin/` while authenticated and run the following in that tab's developer console, replacing only the reviewed identifier and integer version. This uses the existing Access session and write-guarded endpoint; it does not export a cookie or bypass validation.

```js
const id = 'REVIEWED_QUEUE_UUID';
const baseVersion = 3; // Replace with the reviewed base_version from the queue.
const stateResponse = await fetch('/admin/api/state');
if (!stateResponse.ok) throw new Error(`State unavailable: ${stateResponse.status}`);
const state = await stateResponse.json();
const deletion = await fetch('/admin/api/asset-lifecycle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
  body: JSON.stringify({ id, action: 'delete', baseVersion, baseSiteVersion: state.version, project: state.project }),
});
console.info(deletion.status, await deletion.json());
```

A 409 requires review of current references/versions; do not automatically retry or suppress it. A storage failure can leave a canonical deletion claim, which is then visible in the library and can be retried normally. Re-read the queue and verify the resulting library state after the operation. Do not directly delete queued SQL rows or R2 keys.

Current content limits: 64 pages, 2,000 wins, 8 MiB of serialized canonical project data, 1.5 million compressed revision bytes, 500,000 characters of HTML per page and 200,000 CSS characters per stylesheet. There is no separate character limit for discarded editor JSON. A public media upload is limited to 10 MiB, 8192 px per dimension and 32 megapixels. These are validation limits, not a promise of fast editing at every maximum simultaneously.

Incoming JSON and public-media bodies have route-specific limits enforced while reading the stream. Private mail uploads currently check the declared size before streaming to R2 and compare R2's returned size afterward:

| Endpoint under `/admin/api/` | Body limit |
| --- | --- |
| `save`, `validate`, `preview` | 8 MiB |
| `recover`, `managed-svg`, `asset-metadata`, `asset-lifecycle`, `replace-resource` | 16 MiB |
| `migrate-frame`, `cpu-migration` | 4 KiB |
| `asset-usage`, `mail/cancel`, `mail/attachment-remove` | 1 KiB |
| `contact` settings | 8 KiB |
| `mail/test`, `mail/send` | 1 MiB |
| `upload` public media | 10 MiB |
| `mail/attachment` private attachment | 30 MiB declared upload limit; returned R2 size must match |

The JSON reader's default is 4 MiB; the registered routes above provide their own limits. The public contact endpoint accepts at most 16 KiB and the analytics event endpoint at most 256 bytes. Authoritative limits live in `src/cms/admin-site.mjs`, `src/cms/admin-media.mjs`, `src/cms/email-api.mjs`, `src/cms/http.mjs`, `src/server/contact.mjs` and `src/worker.mjs`.

`api.mjs` authenticates admin requests and owns generic route dispatch, storage availability, the shared write-policy call and final error mapping. Site and media handlers parse their own bounded bodies. The mail adapter uses the same write policy once after selecting a known write route, retaining contact-settings reads without D1, mail-specific unknown-route precedence and uncertain-delivery errors. Public media serving keeps its separate unpublished-file Access check in `media-files.mjs`; private signed attachments remain in the mail subsystem.

Media responsibilities are divided by ownership: `assets.mjs` holds inventory and metadata projections, `media-files.mjs` admits and serves stored files, `asset-lifecycle.mjs` guards usage and recoverable deletion, and `managed-svg.mjs` owns staged source/derivative operations. Uploaded files, built-in resources and private attachments retain their distinct authoritative storage and lifecycle rules.

Private mail attachments use a separate `mail-private/` prefix and HMAC-authorized `/mail-file/{id}/{expiry}?token=…` downloads. Their bearer token is kept out of the URL path, and Wrangler query redaction covers Worker logs and traces. A release must verify that effective platform setting; it does not erase previously stored URLs. `CONTACT_HASH_SECRET` also encrypts saved contact settings and signs public contact idempotency/rate keys. Changing it requires the controlled transition in [CONTACT-SETUP.md](CONTACT-SETUP.md), including outstanding attachment sends and saved-settings recovery.

Mail uploads have three D1 states: `uploading` is registered before R2 writes; `ready` is set only after successful size verification and a conditional update of the still-unexpired upload; `deleting` is terminal. Send reservations, private downloads and manual removal require a ready row. Deletion claims the row before touching R2 and removes D1 metadata only after R2 deletion succeeds. A failed delete therefore retains its object key for retry. The hourly scheduled handler processes at most 20 D1 rows and one 20-object R2 listing page per invocation. The second pass deletes only private objects at least 24 hours old with no D1 record, covering historical orphans and a late R2 PUT after its staging row was removed. Cursor updates use a monotonic version check, including across wraps. Storage failure is reported as a failed scheduled invocation; it does not turn inaccessible files back into ready files.

Confirmed mail identities remain in `cms_mail_receipts` permanently, independently of the bounded `cms_sent_mail` display history. The small receipt stores the request/provider IDs, sender and creation/schedule times, without recipients, subject or body. Finalization writes it in the same transaction as confirmation and history pruning. Both replay lookup and atomic attempt registration consult receipts, so a confirmation pruned between those operations cannot start a new delivery. Unconfirmed intents remain durable and cannot call the provider after the 23-hour retry window; Resend's own key retention is only [24 hours](https://resend.com/changelog/idempotency-keys).

Migration `0010` backfills retained confirmations. An unknown old request without `intentVersion: 2` fails closed because its previously pruned identity is unknowable. Only newly created client intents receive that marker; restored frozen payloads remain unchanged. Known old confirmations replay, and known young unconfirmed intents retain their original provider key. See [CONTACT-SETUP.md](CONTACT-SETUP.md) for upgrade and rollback restrictions. A confirmed identity is never reused for a changed body; the API returns its original receipt without delivering the changed content.

Mail inline-link rendering separates visible text from destination substitution. Dynamic URI values are percent-encoded before HTML attribute escaping; a `mailto:` mailbox keeps its `@` separator but encodes reserved characters such as `?`, `&`, `#`, `%`, `=` and `+`. This preserves the submitted address instead of letting it inject URI headers. Normal literal template query parameters remain intact. The same renderer serves studio preview and public contact notifications.

## Changes to functional code

CMS history versions content, not the Worker binary. Source changes that alter protected structure require an explicit content migration and verification against existing saved projects; do not deploy changed contracts over existing content and assume compatibility. Restore-to-original uses the current build's seed. Back up D1 before a contract/schema change and retain the matching Worker version for rollback.

A complete rollback considers Worker code, D1 content/schema and R2 references together. Normal CMS Restore does not downgrade application code or database schema. Do not run a destructive down migration against retained historical content.

## Verification scope

Node tests cover JWT rejection, XSS and CSS payloads, origins, route bypasses, size bounds, storage rollback, stale writes and retries. Integration tests run actual workerd, D1 and R2 using a locally signed identity fixture. Browser tests cover the real editor and locally published responses. Cloudflare Access and deployed persistence require a separately authorized production check; branch previews share production storage. These checks do not certify absence of every vulnerability or replace control of the owner's email account.

Local verification limits and hosted Images prerequisites are recorded in [CMS-LOCAL-VERIFICATION.md](CMS-LOCAL-VERIFICATION.md); do not infer remote sign-off from offline codec tests.
