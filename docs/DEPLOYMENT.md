# Deploy the portfolio and CMS

Production is the only Worker, `omar-portfolio`, configured by `wrangler.jsonc`. Workers Builds deploys it about 30 s after each push to `main`. GitHub Actions performs checks and retains browser evidence; it has no deployment job or production secrets.

## Cloudflare Workers Builds

For the connected production repository, keep the Workers Builds commands aligned with the schema-dependent Worker code:

- Build command: none (the deploy command builds first)
- Deploy command: `npm run deploy:cloudflare`

`dist/` is ignored by Git. `wrangler.jsonc` uploads assets from `./dist`; it does not create that directory. `scripts/build.mjs` recreates it from source and `public/`, and `scripts/build-cms.mjs` writes `.generated/cms-seed.mjs`, which the Worker imports. Every deploy needs that build even when a local output directory already exists. Check the connected repository's dashboard commands before changing its build configuration.

Do **not** use plain `npx wrangler deploy` as the production deploy command. `npm run deploy:cloudflare` runs four steps in order: build, release gate, migrations, deploy. It first builds the site. Then the read-only release gate (`scripts/cms-pull-release.mjs`) reads the head revision and every `cms_media` row with read-only SELECTs, checks them against the new code in local SQLite, and blocks the deploy on any incompatibility or unreadable D1. Then it applies every pending remote migration for the `CMS_DB` binding, and only publishes the Worker after the schema is current. This prevents a newly deployed CMS from querying columns or tables that have not yet been created in D1.

The gate checks the head revision as it was when the gate ran. A studio save during the deploy is not covered, so do not save while a deploy runs. The manual `stored-revisions` workflow checks every stored revision with `node scripts/cms-pull-release.mjs --all --allow=1-4,84-88 --allow-errors="$CMS_ALLOW_ERRORS_FILE"`. It requires the `historical_errors_json` dispatch input: a JSON object with exactly the keys `"1"`, `"2"`, `"3"`, `"4"`, `"84"`, `"85"`, `"86"`, `"87"`, `"88"`, each mapped to its reviewed exact nonempty error string. The workflow passes this through an environment variable, validates the shape and writes a private runner temporary file. Missing or malformed input fails closed. Each incompatible revision must match its recorded message exactly; the head is never allowlisted. The normal production deploy gate still checks the head without any exceptions. The manual workflow needs repository secrets `CLOUDFLARE_D1_READ_TOKEN` (D1 read access) and `CLOUDFLARE_ACCOUNT_ID`.

There is no checked-in verified inventory of those historical error messages. To obtain evidence, an authorized owner builds this source and runs the read-only `node scripts/cms-pull-release.mjs --all` against the intended database. This command deliberately exits unsuccessfully when historical incompatibilities exist and prints their version/error pairs. Review those results against the original historical defects before creating the input object; do not automatically bless the current failures. Investigate any new version or changed message rather than broadening the exceptions. Keep the reviewed report and dispatch input with the release evidence; do not include credentials in either.

The shared-frame release changes the stored project format on publication. Follow [CMS-FRAME-MIGRATION.md](CMS-FRAME-MIGRATION.md) before its first production Save or a rollback to an older Worker.

Production runs on the Cloudflare Workers Free plan (owner decision, 2026-10-24). Each request has a 10 ms CPU limit, so a request over budget can fail with 503. D1 allows 100,000 written rows per day, and one D1 database can hold at most 500 MB.

Historical CPU evidence retained from the rapid-save handoff:

- Worker tail recorded `/admin/api/state`, `/save` and `/recover` returning 503 with outcome `exceededCpu`, CPU time 10–12 ms and `Worker exceeded CPU time limit.`
- The handoff reported earlier successful saves on the same production-shaped fixture at 410–503 ms CPU, with about 375 KB of project data, 14 pages and 240 cards. Those historical samples do not establish the current deployment's budget or behavior.
- The observed 2–5 minute recovery interval was not established as a Cloudflare guarantee.

If a Worker has already been deployed against an older D1 schema, recover the current deployment by applying the pending migrations and redeploying:

```sh
npm run build &&
npx wrangler d1 migrations apply CMS_DB --remote --config wrangler.jsonc &&
npx wrangler deploy --config wrangler.jsonc
```

R2 has no SQL schema migration step. A CMS boot failure caused by missing D1 columns/tables is not repaired by replacing or reconnecting the R2 bucket.

## Production data runbook

There is no staging Worker or staging config. The production D1 database keeps its historical name `omar-portfolio-cms-staging` (binding `CMS_DB`); it is the production database. Before any production data change:

1. Record a Time Travel bookmark: `npx wrangler d1 time-travel info CMS_DB`.
2. Rehearse migrations on a local copy built from page-wise read-only `SELECT`s.

Branches are not isolated: preview versions bind production D1 and R2.

## Image validation prerequisites

Retain the `images: { binding: "CMS_IMAGES" }` configuration in `wrangler.jsonc` and verify that Images is available for the account. The migration chain includes `0003_media_integrity.sql`; the normal deploy applies pending migrations before publishing. Local test fixtures supply Images and apply migrations without contacting the account.

If an older installation used a different migration filename for the same column addition, inspect its migration history before any schema change. Do not execute that addition twice or delete migration records blindly.

The Images binding decodes actual bytes rather than merely inspecting metadata. Review the account's transformation usage, billing limits and supported formats. An offline codec test does not prove production entitlement or animation support; verify those through the authorized release procedure. Branch previews share production storage.

See [Images binding](https://developers.cloudflare.com/images/optimization/binding/), [format limits](https://developers.cloudflare.com/images/get-started/limits/) and the [local verification guide](CMS-LOCAL-VERIFICATION.md).

## Existing production configuration

Retain the existing production Worker `omar-portfolio`, domain routes, ASSETS, contact configuration and `ANALYTICS_ENABLED: "false"`. Do not copy database IDs, bucket names or Access audience from other configs into production.

`CMS_DB` and `CMS_MEDIA` already identify the production resources, despite their historical names. Do not create replacement databases or buckets as a release step. Record the current Worker version and follow the production data runbook before any data change.

Verify the Access application covers `omaryusuf.se/admin` and descendants and allows only the owner's exact email through the email one-time PIN identity provider, with a one-hour session. Keep HttpOnly, SameSite=Lax and the binding cookie; verify more-specific application policies too. Use no bypass, everyone or wildcard-email policy.

Keep `CMS_ACCESS_TEAM` as the exact HTTPS Access organization origin and `CMS_ACCESS_AUD` as the production application's audience. `CMS_ADMIN_EMAIL` is the same exact owner email, stored as a Worker secret. Leave `CMS_STAGE` and `PREVIEW_ORIGIN` unset in production. Without the required auth settings the admin route fails closed.

Run the local release gates in [QA.md](QA.md). After authorization, publish through `npm run deploy:cloudflare`, including its build and compatibility gate. Every push to `main` also triggers that production deploy through Workers Builds; a commit must be releasable before it is pushed.

## Release verification

Check unauthenticated `/admin/`, admin bundle and API access; each must be intercepted by Access or rejected by the Worker. Verify the allowed owner, logout and a rejected identity. Keep the Access and server allowlists identical.

Make a reversible content change, Save, reload the studio and fetch the public page with a fresh unauthenticated request. Confirm `X-CMS-Version` and the changed HTML. Upload a new image, verify it is private before use, place it on a page and Save, then verify the published media URL. Restore the previous version through History and Save again. Inspect desktop/mobile, internal links, metadata, wins and all workshop interactions.

Run `node scripts/smoke-live.mjs` for public read-only checks after production deployment. Contact delivery requires the separate real-mail procedure in [CONTACT-SETUP.md](CONTACT-SETUP.md); a local provider fixture is not evidence of inbox delivery. Do not enable analytics as a side effect of installation.

## Backup and rollback

For content mistakes, History → Restore → Save appends a new revision. Published R2 objects remain available, so old references survive. Revert affects only unsaved draft content.

Before application/schema changes, run `npm run build`, then the isolated backup drill (`node --test tests/cms-backup-drill.test.mjs`) and the read-only retained-revision checker (`node scripts/cms-check-release.mjs /path/to/trusted-d1-export.sql`). Use Node 24 or newer as required by the project; the checker imports SQL with the native SQLite parser so multiline content is preserved. The live read-only check also requires that build: `node scripts/cms-pull-release.mjs`, the same release gate the deploy runs. Then export D1 using Wrangler and retain the matching Worker version and R2 inventory. `wrangler d1 export <database> --remote --output <backup.sql>` creates a database backup; keep it private because revision records include owner identity and content. Use Cloudflare's retained Worker version or the previous verified commit for a code rollback. Restoring the Worker alone does not roll back database state. Avoid deleting R2 objects needed by any retained revision.

Protected component contracts derive from the source templates. If functional source markup changes after the CMS has been used, migrate existing saved content deliberately and test its continued editability before production deployment. See [CMS-SECURITY.md](CMS-SECURITY.md).

## References

- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
