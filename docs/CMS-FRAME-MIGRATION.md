# Shared-frame migration and rollback

The frame-capable Worker reads legacy schema-1 revisions and presents schema 2 to the studio. Reading does not rewrite D1. The first successful Save publishes schema 2, including the Save made when resolving a legacy frame conflict. Review every offered frame/tagline choice before accepting it. The shared frame is stored once and composed around each page; older Workers that accept only schema 1 cannot validate the resulting project.

Structurally equivalent legacy frames can retain different HTML IDs through each page's `frameIds` mapping. Publication and preview preserve those historical targets, including inbound bookmarks and links between pages. The editor displays each page's IDs and converts unchanged identities and shared CSS back to the canonical frame when capturing a draft. New shared ID styles are projected onto each historical ID; formerly idless nodes receive a generated selector marker only when a new style needs one. The marker is never accepted as editable source.

Mappings remain active only while their node key and canonical ID still match. Deliberately renaming a canonical ID invalidates the old mapping; publication checks actual page targets, duplicates and protected identities before accepting the result. Frame references remain literal links/references and must be valid on every affected page. A non-exact or case-insensitive CSS ID selector whose matching behavior would change is rejected with a reconciliation message; use an exact ID or a shared class before proceeding. Genuinely different frame structures/content retain the explicit frame-choice workflow.

Reverse conversion preserves historical IDs. A styled node that previously had no ID receives a collision-free ordinary ID during the explicit reverse migration, allowing schema 1 to represent the style without internal markers. Regression coverage distinguishes actual BASE-produced forward ingress from current schema-1 reverse/reimport checks; neither proves universal compatibility with every older Worker's template-signature policy. Rehearse the exact rollback Worker as described below.

This is an owner-operated release gate. Rehearse forward conversion, conflict choices, publication, reload and reverse conversion on an isolated copy of the current D1 data and required media before production. Use read-only, page-wise pulls to prepare the copy; never point a rehearsal at the shared production bindings. The commands below document the procedure; they are not evidence that a rehearsal or production migration has run. Complete the normal [release checks](DEPLOYMENT.md) as well.

## Capture and rehearse

Pause studio writes. Retain the matching Worker version, a private D1 backup, R2 inventory and a current D1 Time Travel bookmark. Confirm Time Travel availability and retention for this account at operation time. Build the exact frame-capable source first so the CLI and Worker use matching generated contracts. A conversion with unresolved frame conflicts is blocked; resolve and rehearse those choices in the studio rather than inventing a CLI choice.

The CLI reads through the configured D1 binding and validates the proposed publication against copied media metadata. A forward rehearsal on an already prepared local copy uses:

```sh
node scripts/cms-migrate-frame.mjs --dry-run --local --persist-to="$FRAME_COPY_DIR" > "$FRAME_FORWARD_RECEIPT"
```

Review the JSON receipt: `expectedVersion`, `expectedHash`, `projectHash`, `requestId`, direction and byte counts. These hashes cover the exact stored source and the validated converted project. Set `FRAME_VERSION`, `FRAME_HASH` and `FRAME_REQUEST_ID` from that reviewed receipt. The copy's frame-capable Worker must use the same copied storage; pass its explicit origin on apply:

```sh
node scripts/cms-migrate-frame.mjs --apply --local --persist-to="$FRAME_COPY_DIR" \
  --origin="$FRAME_COPY_ORIGIN" --expect-version="$FRAME_VERSION" \
  --expect-hash="$FRAME_HASH" --request-id="$FRAME_REQUEST_ID"
```

`--apply` requires `CMS_MIGRATION_COOKIE`, containing the authorized owner's full `CF_Authorization=…` cookie. Supply it through a private environment or masked interactive prompt, never a command argument, committed file, screenshot or CI output. Disable shell tracing before handling it. For example, in Bash:

```sh
set +x
read -r -s -p 'Owner Access cookie: ' CMS_MIGRATION_COOKIE
printf '\n'
export CMS_MIGRATION_COOKIE
```

The CLI sends the cookie only to the validated production origin or the explicitly selected local copy. Local cookies must belong to the copy's identity fixture. Unset the variable after the operation. Do not copy production credentials into test fixtures.

## Apply and verify

After successful copy rehearsal and review, the owner can obtain a fresh production receipt and apply it under the frame-capable Worker:

```sh
node scripts/cms-migrate-frame.mjs --dry-run > "$FRAME_FORWARD_RECEIPT"
# Review this fresh receipt and set FRAME_VERSION, FRAME_HASH and FRAME_REQUEST_ID.
node scripts/cms-migrate-frame.mjs --apply --origin=https://omaryusuf.se \
  --expect-version="$FRAME_VERSION" --expect-hash="$FRAME_HASH" \
  --request-id="$FRAME_REQUEST_ID"
```

The authenticated endpoint checks the source version/hash and the converted project hash before appending a revision with CAS. A concurrent Save invalidates the plan and returns a conflict; obtain and review a new receipt. The request ID is the publication replay key. Retain the original receipt and response. Verify the new head, schema, public `X-CMS-Version`, frame/content, studio reload and History before resuming writes.

If the response is lost, inspect the current head and retained history before retrying. The CLI re-reads and plans from the current head, so rerunning `--apply` after a committed migration can fail its source precondition rather than replay it. For an exact endpoint replay, use the original dry-run receipt unchanged under the same frame-capable build. The following Node command keeps the cookie out of process arguments and sends the original intent; set `FRAME_RECEIPT` to that receipt and `FRAME_ORIGIN` to the validated production origin (or the isolated copy):

```sh
export FRAME_RECEIPT FRAME_ORIGIN
node --input-type=module <<'JS'
import { readFile } from 'node:fs/promises';
const receipt = JSON.parse(await readFile(process.env.FRAME_RECEIPT, 'utf8'));
const origin = new URL(process.env.FRAME_ORIGIN);
const local = origin.protocol === 'http:' && origin.hostname === '127.0.0.1' && origin.port !== '';
if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash
  || origin.origin !== 'https://omaryusuf.se' && !local) throw new Error('Review the exact migration origin.');
if (!process.env.CMS_MIGRATION_COOKIE) throw new Error('Owner cookie missing.');
const { expectedVersion, expectedHash, projectHash, reverse, requestId } = receipt;
const response = await fetch(new URL('/admin/api/migrate-frame', origin), {
  method: 'POST', redirect: 'error',
  headers: { Cookie: process.env.CMS_MIGRATION_COOKIE, Origin: origin.origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
  body: JSON.stringify({ expectedVersion, expectedHash, projectHash, reverse, requestId }),
});
console.log(response.status, await response.text());
if (!response.ok) process.exitCode = 1;
JS
```

The endpoint checks an existing request ID and exact intent before checking the current source. A changed intent under the same request ID is rejected. Do not generate a replacement request ID to hide an uncertain result.

## Reverse the head before code rollback

Keep the frame-capable Worker running, pause writes and rehearse `--reverse` on the copied schema-2 head first. Obtain a fresh reverse receipt, then apply with that receipt's version, hash and request ID:

```sh
node scripts/cms-migrate-frame.mjs --dry-run --reverse > "$FRAME_REVERSE_RECEIPT"
# Review the reverse receipt and update FRAME_VERSION, FRAME_HASH and FRAME_REQUEST_ID.
node scripts/cms-migrate-frame.mjs --apply --reverse --origin=https://omaryusuf.se \
  --expect-version="$FRAME_VERSION" --expect-hash="$FRAME_HASH" \
  --request-id="$FRAME_REQUEST_ID"
```

For copy rehearsal add `--local --persist-to="$FRAME_COPY_DIR"` to both commands and use `--origin="$FRAME_COPY_ORIGIN"` on apply. Verify the new head is schema 1 and rehearse the intended older Worker against that head before rolling back code. Do not deploy the schema-1-only Worker first: it cannot perform the reverse conversion. The reverse appends a revision; it does not rewrite or delete the retained schema-2 history. An older Worker's History/Restore and full retained-revision compatibility may therefore remain unsupported. Retain frame-capable recovery tooling and do not claim an older Worker can restore those revisions.

D1 Time Travel is a separate whole-database recovery option, not a frame-only undo. Returning to a bookmark can discard later unrelated CMS/media/mail metadata, does not roll back R2 objects or Worker code, and requires deliberate reconciliation with the matching deployment and object inventory. Confirm the available bookmark and recovery procedure before using it. Never prune schema-2 history or R2 objects merely to make an old-code compatibility gate pass.
