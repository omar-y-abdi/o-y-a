# Deploy the portfolio and CMS

Production deployment is a separate step **after merge**. This branch provisions and verifies only staging. GitHub Actions performs checks and retains browser evidence; it has no deployment job or production secrets.

## Existing staging

- Worker: `omar-portfolio-cms-staging`
- URL: https://omar-portfolio-cms-staging.s2305975.workers.dev
- Config: `wrangler.staging.jsonc`
- Dedicated D1 and R2 resources share the staging name.
- Cloudflare Access protects `/admin`; the Worker repeats exact owner verification.
- `CMS_ADMIN_EMAIL` is a Worker secret. It is not recorded in Git.

```sh
npm ci
npm run check
npx wrangler d1 migrations apply omar-portfolio-cms-staging --remote --config wrangler.staging.jsonc
npx wrangler deploy --config wrangler.staging.jsonc
```

A migration or deploy command succeeding is not proof of working login or publication. Visit `/login/`, complete Access sign-in and verify Save from the studio through a fresh public request. Use the same hostname for all steps.

## Image validation prerequisite for this release

Apply `0003_media_integrity.sql` to the correct database before deploying this Worker. Retain the `images: { binding: "CMS_IMAGES" }` configuration in both environments and verify that Images is available for the account. Do not deploy a worker expecting the new column against the old schema. Local test fixtures supply Images and apply migrations without contacting the account.

Use **only `0003_media_integrity.sql`** from the unified package. The older alternative ZIP used `0003_media_validation.sql` for the identical column addition. Do not retain or run both. If either has already been applied to a deployed database, inspect its migration history and reconcile the filename with that history before deployment; do not execute the same column addition again or delete migration records blindly. For a clean WIP checkout, no source deletion is required.

The Images binding decodes actual bytes rather than merely inspecting metadata. This introduces deployment transformation usage; review account billing/limits. Cloudflare currently documents AVIF input as Enterprise-only. An offline AVIF pass does not prove production entitlement. Test your actual supported formats and animation in staging; unsupported format/configuration failures never register an unchecked asset.

See [Images binding](https://developers.cloudflare.com/images/optimization/binding/), [format limits](https://developers.cloudflare.com/images/get-started/limits/) and the [local verification guide](CMS-LOCAL-VERIFICATION.md). No Images subscription, remote migration or deployment was performed by the completion package.

## Prepare production after merge

Retain the existing production Worker `omar-portfolio`, domain routes, ASSETS, contact configuration and `ANALYTICS_ENABLED: "false"`. Do not copy staging database IDs, bucket names or Access audience into production.

1. Record the current Worker version and take a D1 export if production CMS data already exists. Inspect existing account resources before creating duplicates.
2. Create a separate production D1 database and R2 Standard bucket, for example `omar-portfolio-cms`, with Wrangler. Add their actual returned identifiers to `wrangler.jsonc` as `CMS_DB` and `CMS_MEDIA`, using `migrations_dir: "migrations"`. R2 free allowances are not an unlimited billing cap; review account usage/notifications.
3. Create an Access self-hosted application for `omaryusuf.se/admin` and descendants. Allow only the owner's exact email through the email one-time PIN identity provider, with a one-hour session. Enable HttpOnly, SameSite=Lax and the binding cookie. Use no bypass, everyone or wildcard-email policy. Test any more-specific application policies that could override it.
4. Add `CMS_ACCESS_TEAM` as the exact HTTPS Access organization origin and `CMS_ACCESS_AUD` as that production application's audience. Leave `CMS_STAGE` and `PREVIEW_ORIGIN` unset. Store the same exact email as secret `CMS_ADMIN_EMAIL` on the production Worker:

   ```sh
   npx wrangler secret put CMS_ADMIN_EMAIL --config wrangler.jsonc
   ```

5. Apply the schema to the production database, build and inspect the deployment before publishing:

   ```sh
   npx wrangler d1 migrations apply omar-portfolio-cms --remote --config wrangler.jsonc
   npm run check
   npm run edge:check
   npx wrangler deploy --config wrangler.jsonc
   ```

Bindings must be configured before deploying the CMS. Without auth settings the admin route fails closed; without a CMS database the public site continues to serve the built original. Merging the PR alone does not provision production or publish a CMS revision.

## Release verification

Check unauthenticated `/admin/`, admin bundle and API access; each must be intercepted by Access or rejected by the Worker. Verify the allowed owner, logout and a rejected identity. Keep the Access and server allowlists identical.

Make a reversible content change, Save, reload the studio and fetch the public page with a fresh unauthenticated request. Confirm `X-CMS-Version` and the changed HTML. Upload a new image, verify it is private before use, place it on a page and Save, then verify the published media URL. Restore the previous version through History and Save again. Inspect desktop/mobile, internal links, metadata, wins and all workshop interactions.

Run `node scripts/smoke-live.mjs` for public read-only checks after production deployment. Contact delivery requires the separate real-mail procedure in [CONTACT-SETUP.md](CONTACT-SETUP.md); a local provider fixture is not evidence of inbox delivery. Do not enable analytics as a side effect of installation.

## Backup and rollback

For content mistakes, History → Restore → Save appends a new revision. Published R2 objects remain available, so old references survive. Revert affects only unsaved draft content.

Before application/schema changes, run the isolated backup drill (`node --test tests/cms-backup-drill.test.mjs`) and the read-only retained-revision checker (`node scripts/cms-check-release.mjs /path/to/trusted-d1-export.sql`). The latter requires Node 22.13 or newer and imports SQL with the native SQLite parser so multiline content is preserved. Then export D1 using Wrangler and retain the matching Worker version and R2 inventory. `wrangler d1 export <database> --remote --output <backup.sql>` creates a database backup; keep it private because revision records include owner identity and content. Use Cloudflare's retained Worker version or the previous verified commit for a code rollback. Restoring the Worker alone does not roll back database state. Avoid deleting R2 objects needed by any retained revision.

Protected component contracts derive from the source templates. If functional source markup changes after the CMS has been used, migrate existing saved content deliberately and test its continued editability before production deployment. See [CMS-SECURITY.md](CMS-SECURITY.md).

## References

- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
