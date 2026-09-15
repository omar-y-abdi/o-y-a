# CMS security and operating limits

## Identity and request boundary

Cloudflare Access protects `/admin` and its descendants. The Worker independently verifies an RS256 application JWT with `jose`: signature from the configured HTTPS Access organization, exact issuer and audience, required issued/expiry times, application token type, subject and exact allowed owner email. A session lasts at most one hour. Unsigned identity headers do not grant access. Missing configuration fails closed.

All admin HTML, bundles and APIs require authentication. Writes additionally require POST, exact request origin, the CMS request marker, accepted content type and a same-origin Fetch Metadata value when present. The API does not enable credentialed CORS. Encoded/ambiguous routes cannot bypass admin routing. Admin responses and mutable public content use no-store; immutable revision styles and published files have stable URLs.

The owner address is a Worker secret, never a bundled constant. Access application audience and organization hostname are identifiers, not credentials. Local test keys and cookies exist only under ignored output directories. Local identity fixtures cannot authenticate against the deployed Access organization. The local runtime replaces outbound JWKS only inside the test harness; production contains no development authentication bypass.

## Content boundary

HTML is parsed with parse5, CSS with css-tree and project JSON traversed with depth/size limits. Scripts, event handlers, unsafe URLs, active embeds, foreign SVG content, external CSS imports, executable editor fields and prototype keys are rejected. Resources must come from approved local asset paths or registered R2 media paths. Page routes cannot shadow administration, APIs or infrastructure.

Protected component contracts preserve functional attributes, exact hook ownership, control counts, semantic values and state, required classes and the nearest functional parent. Visual wrappers and reordering within a function remain possible. Moving a control outside its functional group is rejected. Page validation also checks main content, heading structure, image alternatives and local links. Runtime text placeholders must retain their original set.

The client receives a restrictive CSP with no eval or remote script origins. Inline styles are necessary for GrapesJS and validated previews; arbitrary JavaScript remains unavailable. The visual editor's affordances are not the security boundary: server checks run for direct API requests too.

HTML/CSS are the canonical editor representation. Legacy editor JSON is type/security checked on import but never trusted as a competing executable editor document. Preview-only JSON is restricted to one server-owned head record in a studio-owned srcdoc iframe; ordinary public documents always use validated public endpoints.

Validation may reuse unchanged content from the server's trusted published baseline only with a matching current contract/policy fingerprint. Client-supplied cached facts do not create trust. Published media references are extracted from rendered HTML/CSS and actual uploaded font usage, excluding GrapesJS's private asset registry.

R2 keys are immutable UUIDs. Upload parsing checks headers, bounded container integrity, size and dimensions; raster files must also decode through the CMS_IMAGES binding before registration. MIME is derived by the server. Existing unverified rows are checked before promotion under the media-integrity migration. WOFF2 has its separate bounded header policy; raster decoding is not a font-integrity certification. A private upload is not served publicly until used by a published revision. Archive is reversible and preserves bytes. Trash is blocked while the current draft references the resource. Permanent delete requires trash and is blocked by any current or retained-revision reference; uploaded R2 deletion uses version/CAS checks and restores bytes best-effort if metadata deletion fails. Previously published files can therefore remain reachable when history requires them. Do not upload confidential files expecting archival to revoke old public URLs.

Current content limits: 64 pages, 2,000 wins, 8 MiB request bodies, 1.5 million compressed revision bytes, 500,000 characters of HTML per page, 200,000 CSS characters per stylesheet and 1 million characters of editor JSON per page. A file is limited to 10 MiB, 8192 px per dimension and 32 megapixels. These are validation limits, not a promise of fast editing at every maximum simultaneously.

Managed SVG editing is restricted to explicit built-in/vector-enabled resources. The submitted SVG is parsed and reserialized through a strict element/attribute/color/number allowlist; scripts, events, foreignObject, external references and animation are rejected. The public site consumes a bounded raster derivative through the normal image validation path rather than serving arbitrary active SVG uploads.

Shared content is keyed by trusted semantic markers such as `data-cms-shared="footer.tagline"`, not by equal text. Normalization requires all instances of a shared key to agree; unrelated equal strings are never coupled. Win lifecycle is similarly explicit: missing state means active for backward compatibility, random decks include active only, archived IDs remain addressable and trash is omitted from public output.

## Storage and recovery

D1 publishes only after the project has been validated, media registrations are complete and all rendered rows fit their byte budgets. D1 writes for revisions, rendered rows, request IDs and media publication are committed in one batch. An R2 failure or validation error before that point cannot advance the D1 head. Unknown save outcomes replay the original immutable request; definitive request/payload validation failures may start a new corrected request.

Uploaded media is not public merely because it exists in R2. The `/media/` route returns an object only after D1 marks it published. A private object referenced by a historical version remains available when restoring that version. Missing objects fail restore/publish; the CMS does not rewrite content around them.

Revision payloads are compressed, checksummed and verified on read. The Worker keeps immutable version rows and rendered output so browser routes do not render editor content on every request. A restore is a draft until explicitly saved as a new version; history is never rewritten. Retained revisions are checked against the current validator without cached policy facts before an incompatible release is approved.

Draft recovery is separate from published state. IndexedDB backups belong to one signed-in session instance and use monotonic generations; one tab cannot silently acknowledge or delete another live tab's recovery. Unsafe/malformed backups remain exportable but are not applied. IndexedDB failure is visible and does not disable server save.

## Changes to functional code

Direct edits to scripts, handlers or protected form/game semantics are outside visual CMS scope and belong in source control with normal review/test/deploy. The server allows presentation changes around protected functions, not silent mutation of their contracts.

The completion-package verification boundary and hosted Images prerequisites are recorded in [CMS-LOCAL-VERIFICATION.md](CMS-LOCAL-VERIFICATION.md); do not infer remote sign-off from offline codec tests.
