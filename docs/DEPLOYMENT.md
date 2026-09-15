# Production deployment

## Staging is intentionally separate

`wrangler.staging.jsonc` deploys `omar-portfolio-cms-staging` with its own D1 database and R2 Standard bucket. It does not send real contact email and uses `PREVIEW_ORIGIN` so generated content points back to staging. Keep preview URLs disabled and use the explicit `workers.dev` staging hostname.

Create a dedicated Cloudflare Access self-hosted staging application for `https://omar-portfolio-cms-staging.<subdomain>.workers.dev/admin` and its descendants. Use a one-hour session and a reusable/legacy Allow policy that includes only the owner's exact email. Limit the login method to One-time PIN, enable HttpOnly/SameSite=Lax and binding-cookie settings, then copy the application audience and organization hostname into `CMS_ACCESS_AUD` and `CMS_ACCESS_TEAM` in `wrangler.staging.jsonc`. Do not use `Everyone`, `Bypass` or email-domain policies.

Before the first staging deploy, create the configured D1/R2 resources and apply migrations:

```sh
npx wrangler d1 create omar-portfolio-cms-staging --config wrangler.staging.jsonc
npx wrangler r2 bucket create omar-portfolio-cms-staging --config wrangler.staging.jsonc
npx wrangler d1 migrations apply omar-portfolio-cms-staging --remote --config wrangler.staging.jsonc
npx wrangler secret put CMS_ADMIN_EMAIL --config wrangler.staging.jsonc
npx wrangler deploy --config wrangler.staging.jsonc
```

A migration or deploy command succeeding is not proof of working login or publication. Visit `/login/`, complete Access sign-in and verify Save from the studio through a fresh public request. Use the same hostname for all steps.

## CMS usability schema migrations

Den här utbyggnaden kräver två additiva migrationer efter `0003_media_integrity.sql`:

- `0004_resource_lifecycle.sql` lägger till papperskorgstillstånd för uppladdad media och den separata livscykeltabellen för inbyggda resurser.
- `0005_managed_vectors.sql` lägger till den sanerade managed SVG-källan för resurser som uttryckligen får vektorredigeras.

Ta D1-backup före schemaändringen och applicera migrationerna i ordning via det konfigurerade `CMS_DB`-bindingnamnet. Kör inte manuella `ALTER TABLE`-kopior och markera inte gamla resurser som raderade för att "städa". Befintliga rader saknar `trashed_at`/`vector_svg` och fortsätter därför som aktiva rasterresurser tills de ändras genom CMS:et.

```sh
npx wrangler d1 export CMS_DB --remote --config wrangler.jsonc --output ../cms-before-usability.sql
npx wrangler d1 migrations apply CMS_DB --remote --config wrangler.jsonc
```

Managed SVG är en redigeringskälla, inte ett nytt publikt aktivt filformat. Save genererar ett rasterderivat som går genom den vanliga media-/publiceringskedjan. Säkerhetskopiera därför både D1 och R2 enligt återställningsproceduren; enbart D1 innehåller inte rasterbytes.

## Image validation prerequisite for this release

Apply `0003_media_integrity.sql` to the correct database before deploying this Worker. Retain the `images: { binding: "CMS_IMAGES" }` configuration in both environments and verify that Images is available for the account. Do not deploy a worker expecting the new column against the old schema. Local test fixtures supply Images and apply migrations without contacting the account.

Use **only `0003_media_integrity.sql`** from the unified package. The older alternative ZIP used `0003_media_validation.sql` for the identical column addition. Do not retain or run both. If either has already been applied to a deployed database, inspect its migration history and reconcile the filename with that history before deployment; do not execute the same column addition again or delete migration records blindly. For a clean WIP checkout, no source deletion is required.

The Images binding decodes actual bytes rather than merely inspecting metadata. This introduces deployment transformation usage; review account billing/limits. Cloudflare currently documents AVIF input as Enterprise-only. An offline AVIF pass does not prove production entitlement. Test your actual supported formats and animation in staging; unsupported format/configuration failures never register an unchecked asset.

See [Images binding](https://developers.cloudflare.com/images/optimization/binding/), [format limits](https://developers.cloudflare.com/images/get-started/limits/) and the [local verification guide](CMS-LOCAL-VERIFICATION.md). No Images subscription, remote migration or deployment was performed by the completion package.

## Existing staging

The test application is `omar-portfolio-cms-staging.s2305975.workers.dev`; its D1 database and R2 bucket are both named `omar-portfolio-cms-staging`. Its owner boundary and durable CMS were verified through that hostname with real Access OTP before the earlier merge. Preserve it for smoke tests after main changes.

## Prepare production after merge

1. In Cloudflare Access, create a separate production self-hosted application for `/admin` and its descendants on `omaryusuf.se`. Use a maximum one-hour session, HttpOnly/SameSite=Lax and binding-cookie settings, and an Allow policy containing only the exact owner email. Limit the app to One-time PIN. Copy its audience and Access organization hostname into production-only `CMS_ACCESS_AUD` and `CMS_ACCESS_TEAM` vars. Keep the owner email only in the `CMS_ADMIN_EMAIL` Worker secret.
2. Create a separate production D1 database and R2 Standard bucket, for example `omar-portfolio-cms`, with Wrangler. Add their actual returned identifiers to `wrangler.jsonc` as `CMS_DB` and `CMS_MEDIA`, using `migrations_dir: "migrations"`. R2 free allowances are not an unlimited billing cap; review account usage/notifications.
3. Run the full local suite on the release candidate before any remote write:
   ```sh
   npm run quality
   npm run test:cms
   npm run edge:check
   ```
4. Take a production D1 export and R2 inventory before schema/application changes. Keep them together with the currently deployed Worker version and configuration identifiers. Secrets are retained in Cloudflare, not copied into the backup directory.
5. Apply migrations and deploy using the production config only:
   ```sh
   npx wrangler d1 migrations apply omar-portfolio-cms --remote --config wrangler.jsonc
   npx wrangler secret put CMS_ADMIN_EMAIL --config wrangler.jsonc
   npx wrangler deploy --config wrangler.jsonc
   ```
6. In a private browser window, use the production Access application as the allowed owner. Verify login, Profile/logout, reload after logout, and a rejected non-owner identity. Then publish a harmless content-only change and confirm the version advances once, a fresh anonymous request sees it and History can restore the prior revision.
7. Upload one small image, confirm its R2 object is private before Save, use it on a page, Save, then verify exact public bytes and content type. Exercise each raster format/animation you intend to support against the hosted Images binding. Upload one WOFF2 font, use it in the theme and one per-element style, replace it with a visibly different WOFF2, verify fresh public output, then restore history and confirm the old font bytes/style return.
8. Restore original content after the release smoke test. Confirm the workshop's public games, contact consent flow, no-JS page content and private `/admin`/API routes. Real contact delivery requires the production sender secret and a controlled inbox check; do not infer inbox delivery from a successful provider response.

Production `ANALYTICS_ENABLED` remains `false` until Analytics Engine rows and the privacy/cookie disclosures are validated against live policy. Enabling analytics is a separate release decision.

## Release compatibility

Before a Worker release that changes templates, component contracts or validation policy, run:

```sh
npm run build
npx wrangler d1 export <database> --remote --output cms-export.sql
node scripts/cms-check-release.mjs cms-export.sql
```

The checker imports the trusted SQL export into an isolated local D1 copy, runs all repo migrations and verifies every retained revision with cached validation disabled. A nonzero exit blocks the release. Do not deploy a new Worker over an incompatible retained revision set; migrate the affected content explicitly or keep the previous Worker until the incompatibility is resolved.

## Backups and rollback

Before application/schema changes, run the isolated backup drill (`node --test tests/cms-backup-drill.test.mjs`) and the read-only retained-revision checker (`node scripts/cms-check-release.mjs /path/to/trusted-d1-export.sql`). The latter requires Node 22.13 or newer and imports SQL with the native SQLite parser so multiline content is preserved. Then export D1 using Wrangler and retain the matching Worker version and R2 inventory. `wrangler d1 export <database> --remote --output <backup.sql>` creates a database backup; keep it private because revision records include owner identity and content. Use Cloudflare's retained Worker version or the previous verified commit for a code rollback. Restoring the Worker alone does not roll back database state. Avoid deleting R2 objects needed by any retained revision.

A recovery drill is incomplete until the backup has been restored into separate D1/R2 staging resources with the matching Worker code. Verify current and historical public pages, exact media bytes, login, editor state, a historical restore followed by Save, and fresh anonymous reads. Record the backup identifiers, restored Worker version and result outside the repository. The local automated drill rehearses the D1/R2 mechanics but does not prove that account-level backups, Access configuration, Images entitlements or third-party email delivery are available during an incident.

## Staging discipline

- Never point staging config at production D1/R2, contact secrets or Access audience.
- Never run production smoke tests with fixture identity headers or local JWKS.
- Keep Worker version and content version separate in incident notes: restoring content does not restore Worker code, and rolling back Worker code does not rewrite D1 revisions.

References:

- [Cloudflare Access self-hosted applications](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/)
- [Cloudflare Access One-time PIN](https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
