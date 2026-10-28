# Prepare canonical studio storage for an existing head

This operation prepares the current studio representation without creating a Save. It preserves the head version, compressed revisions, Save replay identities and every rendered public row. It can also refresh a canonical copy whose build key became stale. Apply migrations through `0014_cpu_migration.sql` before using the endpoint.

The canonical JSON is exactly the running build's ordinary stored-project view: it discards the same unused page editor JSON as ordinary reads, then runs the stored-project converter. The raw compressed revision retains that editor JSON unchanged. The view retains unresolved frame choices, metadata and other private fields; validation facts live separately. Slot metadata uses the same resource defaults as ordinary studio reads, without adding those defaults to the stored JSON. The operation validates all restorable frame alternatives locally and never publishes a selected alternative. Use the separate [frame migration](CMS-FRAME-MIGRATION.md) for an owner-approved format publication or appearance decision.

Preparation and staging require D1-owner authority through Wrangler's supported [`getPlatformProxy`](https://developers.cloudflare.com/workers/wrangler/api/) API. The tool creates a temporary configuration containing only `CMS_DB`, uses the existing Wrangler login and excludes local environment files, assets, R2 and other bindings. It neither extracts login credentials nor requests another API token. `--remote` connects that binding to the configured database; its historical name ending in `staging` does not make it a disposable database. Local mode requires an explicit copied persistence directory.

The ordinary authenticated CMS endpoint accepts only an operation ID, artifact hash and action. It cannot upload canonical content or SQL. The privileged preparation tool derives the artifact from the pinned compressed source, verifies it again on apply, copies that source inside D1 and reads back every staged byte before sealing. A database owner can already modify authoritative tables; the procedure does not claim to defend against an owner deliberately changing D1 outside this tool.

## Rehearse before production

Use an isolated local database copy with the same migrated schema and candidate Worker build. Keep the private receipt outside tracked source: it contains the raw revision and canonical project, not just a public summary. The CLI creates it with mode `0600` and refuses to overwrite an existing file. Set `CMS_MIGRATION_COOKIE` in the process environment for the same Access identity used by the copied studio; never put cookies in command arguments or evidence files.

```sh
node scripts/cms-migrate-cpu.mjs --prepare \
  --origin="$CPU_COPY_ORIGIN" --persist-to="$CPU_COPY_DIR" \
  --receipt="$CPU_PRIVATE_RECEIPT"
```

Prepare performs reads only. Review its source/project/build/artifact hashes, version, origin, text/proof/reference counts and estimated D1 reads/writes. The local source closure must match the generated build key, and that key must match the authenticated running Worker. Rebuild and prepare again if either check fails. An operation prepared on an earlier UTC day must be replaced; abort its staging before preparing a new file if any writes already occurred.

Before a writing command, obtain current **account-wide** D1 read/write counts for the UTC day and stop other owner data writes. These counts are operator-supplied inputs; the tool does not fetch or independently verify account analytics. Estimates include staging, readback, index maintenance, cache replacement and cleanup. One operation is capped at 250000 estimated reads and 45000 estimated writes. The account preflight reserves capacity above 4500000 daily reads and 90000 daily writes. Actual owner-query receipts and the final transaction receipt are reported separately; they do not include unrelated account activity or every HTTP status lookup. Missing or ambiguous receipts require reconciliation before continuing.

```sh
node scripts/cms-migrate-cpu.mjs --apply \
  --origin="$CPU_COPY_ORIGIN" --persist-to="$CPU_COPY_DIR" \
  --receipt="$CPU_PRIVATE_RECEIPT" \
  --read-today="$CPU_READS_TODAY" --written-today="$CPU_WRITES_TODAY"
```

The final [D1 binding batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) claims a sealed operation only while source bytes, head version, origin, build key, budget day and prior cache identity still match. It replaces canonical text/proofs and fills a missing historical reference index from the **raw revision**. An already complete index is preserved. An error rolls back the transaction. Concurrent Save, source mutation, code change or another current-copy refresh invalidates the claim. Partial staging is never served.

Confirm that state returns the identical project/version, public pages and raw retained revisions are unchanged, existing Save retries still replay, media state remains current and selected previews work. Check release compatibility with this same build. Retain the local receipt and resulting public summary privately. Tests and local timing do not establish Cloudflare edge CPU: record actual cold/warm `cpu_time_ms` and `exceededCpu` results before claiming the Free-plan requirement is satisfied.

## Production and recovery

Production uses the same commands with `--remote --origin=https://omaryusuf.se`, without `--persist-to`, and the intended checked configuration. An explicit `--config=PATH` can select the reviewed configuration. Record a D1 Time Travel bookmark and the Worker version first. This is an owner-run data operation; a green PR does not authorize its execution. Keep Cloudflare Builds enabled and coordinate the deployment/write window as described in [DEPLOYMENT.md](DEPLOYMENT.md).

Inspect the small authenticated receipt after an interrupted command:

```sh
node scripts/cms-migrate-cpu.mjs --status --remote \
  --origin=https://omaryusuf.se --receipt="$CPU_PRIVATE_RECEIPT"
```

An exact `--apply` retry resumes immutable staging or returns the retained committed result. After an ambiguous response, refresh the account-wide usage inputs first; the last command's output may not include its completed database work. A committed retry remains receipt-only after a later Save and never reapplies the old project. A different artifact cannot reuse the operation ID. A stale uncommitted plan needs a fresh preparation rather than edited hashes or a relaxed guard.

Terminal receipts store a scalar version and do not require the source revision to remain as a parent row. Current product retention preserves raw revisions; this separate receipt lifetime does not introduce or authorize raw-history pruning.

`--abort` with the same private receipt removes uncommitted staging and retains a small terminal receipt. `--cleanup` needs no receipt and aborts at most one operation belonging to the current owner that was created at least 24 hours ago; repeat with refreshed usage inputs until it reports zero. Both require the origin, database selection and account usage arguments used by other writing commands. No background scan or unbounded journal cleanup runs in ordinary requests. Keep terminal receipts: they prevent an old intent from becoming a fresh operation.

`--rollback` invalidates only the canonical copy whose migration ID still equals that committed operation. It restores the ordinary revision-read fallback; it does not alter head, history, rendered pages or the correct historical reference index. A later Save or replacement copy prevents that rollback. Rollback does not cancel a different sealed operation whose original absent-cache precondition becomes true again: such an operation still has to match the identical raw source, build and head. Abort unwanted pending operations explicitly. A rolled-back operation cannot be recommitted; prepare a new one.

CPU migration currently accelerates existing-head state and supplies matching optional target-preview facts. Normal Save/recovery readers and complete cold/warm handler costs still require their own measured qualification. Do not treat a successful cache migration as proof that every API path fits the production CPU limit.
