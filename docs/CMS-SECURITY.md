# CMS security and operating limits

## Identity and request boundary

Cloudflare Access protects `/admin` and its descendants. The Worker independently verifies an RS256 application JWT with `jose`: signature from the configured HTTPS Access organization, exact issuer and audience, required issued/expiry times, application token type, subject and exact allowed owner email. A session lasts at most one hour. Unsigned identity headers do not grant access. Missing configuration fails closed.

All admin HTML, bundles and APIs require authentication. Writes additionally require POST, exact request origin, the CMS request marker, accepted content type and a same-origin Fetch Metadata value when present. The API does not enable credentialed CORS. Encoded/ambiguous routes cannot bypass admin routing. Admin responses and mutable public content use no-store; immutable revision styles and published files have stable URLs.

The owner address is a Worker secret, never a bundled constant. Access application audience and organization hostname are identifiers, not credentials. Local test keys and cookies exist only under ignored output directories. Local identity fixtures cannot authenticate against the deployed Access organization. The local runtime replaces outbound JWKS only inside the test harness; production contains no development authentication bypass.

## Content boundary

HTML is parsed with parse5, CSS with css-tree and project JSON traversed with depth/size limits. Scripts, event handlers, unsafe URLs, active embeds, foreign SVG content, external CSS imports, executable editor fields and prototype keys are rejected. Resources must come from approved local asset paths or registered R2 media paths. Page routes cannot shadow administration, APIs or infrastructure.

Protected component contracts preserve functional attributes, required classes and the nearest functional parent. Visual wrappers and reordering within a function remain possible. Moving a control outside its functional group is rejected. Page validation also checks main content, heading structure, image alternatives and local links. Runtime text placeholders must retain their original set.

The client receives a restrictive CSP with no eval or remote script origins. Inline styles are necessary for GrapesJS and validated previews; arbitrary JavaScript remains unavailable. The visual editor's affordances are not the security boundary: server checks run for direct API requests too.

## Storage and recovery

D1 stores compressed immutable revisions, rendered public content and an atomic current pointer. A save includes baseVersion and a unique requestId. Stale updates fail with 409. Transaction rollback prevents half-published websites. Retries with the same request are idempotent. Restoring an older revision creates a draft; a subsequent Save appends a new revision.

Validation may reuse unchanged content from the server's trusted published baseline. Client-supplied cached facts do not create trust. Published media references are extracted from rendered HTML/CSS and actual uploaded font usage, excluding GrapesJS's private asset registry.

R2 keys are immutable UUIDs. Upload parsing checks supported file headers, size and raster dimensions; MIME is derived by the server. A private upload is not served publicly until used by a published revision. Archiving hides a file from selection but preserves bytes and historical URLs. Previously published files remain public after removal from a current page. Do not upload confidential files expecting later archival to revoke their old public URLs.

Current content limits: 64 pages, 2,000 wins, 8 MiB request bodies, 1.5 million compressed revision bytes, 500,000 characters of HTML per page, 200,000 CSS characters per stylesheet and 1 million characters of editor JSON per page. A file is limited to 10 MiB, 8192 px per dimension and 32 megapixels. These are validation limits, not a promise of fast editing at every maximum simultaneously.

## Changes to functional code

CMS history versions content, not the Worker binary. Source changes that alter protected structure require an explicit content migration and verification against existing saved projects; do not deploy changed contracts over existing content and assume compatibility. Restore-to-original uses the current build's seed. Back up D1 before a contract/schema change and retain the matching Worker version for rollback.

A complete rollback considers Worker code, D1 content/schema and R2 references together. Normal CMS Restore does not downgrade application code or database schema. Do not run a destructive down migration against retained historical content.

## Verification scope

Node tests cover JWT rejection, XSS and CSS payloads, origins, route bypasses, size bounds, storage rollback, stale writes and retries. Integration tests run actual workerd, D1 and R2 using a locally signed identity fixture. Browser tests cover the real editor and published responses; remote staging additionally verifies Cloudflare Access and deployed persistence. These checks do not certify absence of every vulnerability or replace control of the owner's email account.
