# Portfolio studio

## Agreed outcome

Omar alone edits his portfolio through a real visual CMS. The existing yellow/cobalt site, all twelve routes, interactive workshop, contact form, navigation, policies and artwork remain the starting content. Use a maintained editor library rather than building a drag-and-drop engine. The owner approved visual editing with protected application code, an isolated test environment and a pull request. Production deployment happens after merge.

The confirmed storage choice is Cloudflare R2 Standard, activated by the owner. Its free allowance is not an unlimited spending cap. The exact owner email is supplied as private deployment configuration; an unset identity denies access.

## Architecture

- Keep the existing static build and Cloudflare Worker. Public pages require no editor framework. Load the editor and its dependencies only under the admin route.
- Use open-source GrapesJS for components, drag-and-drop, resizing, layer navigation, typography, CSS controls, responsive devices and undo/redo. Store its project JSON so editing information survives reloads. Publish independently validated HTML and CSS, never executable editor code.
- Use Cloudflare Access for authentication. Independently verify JWT signature, issuer, audience, lifetime and the exact owner email in the Worker with `jose`. Protect all admin API operations. No password database, browser-stored service credentials, shared magic admin URL or production development bypass.
- Use D1 for immutable revisions and an atomic current-revision pointer. Use R2 for immutable uploaded media. A successful save exposes the new revision to public requests. Never rely on browser state or a successful upload alone to claim publication.
- Separate production and staging resources, hosts, identities and deployment commands. Preserve the existing production contact and analytics configuration.

## Editing workspace

The application opens on the actual home page. The collapsible left rail lists pages and assets. Layers and reusable blocks live in right-hand inspector tabs. The center shows the complete page at a real desktop or mobile viewport, with zoom and a paired comparison view. The right inspector edits the selected component, including text, links, accessible labels, typography, size, spacing, layout, position, borders, shadows and colors. A site-level panel exposes shared theme values. Page metadata remains editable and feeds the published head and sitemap.

The workspace itself adapts to narrow devices with drawers and touch-sized controls. The editor does not pretend a scaled desktop canvas is a mobile layout: mobile CSS changes are breakpoint-specific.

The bottom command bar contains Edit, Save, Revert, Restore, History and Lock view, plus undo/redo. Commands have explicit behavior:

| Command | Contract |
| --- | --- |
| Edit | Select and change components in the current draft. |
| Save | Validate and publish the draft as one revision; acknowledge only after durable storage succeeds. |
| Revert | Discard unsaved changes after confirmation and reload the published revision. |
| History | Show revisions and inspect an earlier version without modifying the current version. |
| Restore | Load the chosen historical revision into the draft; Save publishes it as a new revision. Existing history is retained. |
| Lock view | Prevent accidental edits and expose a real interactive preview. |
| Undo/redo | Reverse draft changes without silently publishing. |

New sections, text, images, links and layout containers can be added, duplicated, moved and resized. Pages can be created and managed. Reserved system routes and required accessibility/navigation anchors remain protected. Unsaved state survives page switches and has a recoverable local draft. Failed saves, expired login and conflicts keep the draft and explain the next action. Two open tabs cannot silently overwrite each other.

## Interactive content and assets

The media library includes existing public artwork and uploads with meaningful names, dimensions, type, alt text and usage. Replace a used asset through a new immutable object; keep older objects needed by history. Validate file type and bounds on the server. Arbitrary active documents, remote scripts and executable SVG uploads are not accepted as image assets.

The 240 existing win cards remain addressable by their stable IDs and existing categories. Provide search, category filters, creation, editing and a true visual card preview. Text and design edits must reach both the workshop and image export. Content rendered by application JavaScript must have an explicit editing surface; changing a static label that the next button click overwrites is not sufficient.

Functional widgets retain their server-owned structure and data hooks. The visual editor can change their display content and styles. The server rejects malformed functional structures rather than accepting a save that breaks contact validation, consent controls, the machine or games. No user-authored JavaScript executes in the editor, previews or public rendering.

## Security and publication boundaries

Treat every saved project, HTML fragment, CSS rule, path and upload as untrusted input. Parse with maintained libraries; reject scripts, event handlers, embedded active content, unsafe URLs, CSS imports and executable project fields. Bound body size, recursion, component count and asset size. Use exact-origin checks and a custom request header for writes; expose no credentialed cross-origin API. Set route-specific CSP, no-store for admin data, framing restrictions, nosniff and no-referrer. Public HTML is server-rendered and retains semantic metadata.

A save includes its base revision and a unique request ID. D1 commits a new immutable revision and advances the pointer atomically; stale writes return a conflict. Retrying a request must not create duplicate revisions. Historical restore never deletes the intervening history. Public caches key immutable resources by revision or content hash; stale mutable pointers must not hide a confirmed save.

## Observable acceptance

- A real authenticated owner session can edit, save, reload and see the same values on the public staging site. Unauthenticated, expired, malformed and wrong-owner requests cannot read private content or mutate state.
- Every existing page is visually reviewed at desktop and mobile widths. Review every admin view and important loading, error, unsaved, conflict, history, restore and asset state. Save screenshots from actual browser rendering.
- Exercise adding, moving, duplicating, resizing and deleting ordinary components; editing content and styling; independent mobile styles; creating pages; changing metadata; uploading/replacing media; editing wins; exporting images; undo/redo; reverting; restoring; locked interactive preview; login expiry and simultaneous edits.
- Prove stored-XSS rejection, request-boundary rejection, invalid uploads, state conflicts and storage failure behavior with adversarial tests. Run integration checks against the actual Cloudflare runtime and D1/R2 semantics, not only in-memory mocks.
- Run the existing regression suite. Preserve public transfer budgets and lazy loading. Measure cold public/admin loads and interaction behavior, disclose lab conditions and retain machine-readable results.
- The primary agent independently inspects final visuals. The sole Luna Max agent handles repetitive tests and inventories. No other agents are used.
- Finish with a reviewable PR, verified checks, deployment/rollback documentation and all captured CMS screenshots. Do not merge or deploy production in this task.

## Primary references

- [GrapesJS project persistence](https://grapesjs.com/docs/modules/Storage.html)
- [GrapesJS pages](https://grapesjs.com/docs/modules/Pages.html)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [D1 transactions through batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [R2 activation](https://developers.cloudflare.com/r2/get-started/) and [pricing](https://developers.cloudflare.com/r2/pricing/)
