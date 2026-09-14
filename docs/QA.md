# Portfolio and CMS verification

This replaces the original ZIP delivery's rendered-document report. Current acceptance uses real HTTP navigation and the actual Cloudflare Worker runtime for CMS storage tests. Historical notes under `docs/revision/` describe the earlier delivery, not the current branch.

## Reproduce

Install dependencies and browsers as described in the README, then:

```sh
npm run check
npm run quality
npm run test:cms
```

`check` builds all public/admin assets, checks JavaScript syntax and runs Node tests. `quality` starts public and analytics fixture servers, verifies HTTP behavior and runs the public browser suite. It refuses occupied ports. Set `PUBLIC_TEST_PORT` and `ANALYTICS_TEST_PORT` when needed. Activate `.test-venv` first so `python` resolves to the installed Playwright environment.

`test:cms` first checks actual editor/public modules in isolated DOM fixtures, then starts an isolated Miniflare Worker on an ephemeral loopback port with real D1/R2 and a signed RSA identity fixture, runs the original CMS browser/interactions scripts plus both review suites and disposes the runtime and cookie fixture. There is no production authentication bypass. The local JWKS provider is replaced only in the harness. Cloudflare Access itself is verified separately in remote staging.

Additional public regressions, with the public preview running:

```sh
BASE_URL=http://127.0.0.1:5273 python tests/revision_browser.py
BASE_URL=http://127.0.0.1:5273 python tests/card_export.py
```

Both navigate over real HTTP and load built modules. Contact cases intercept only the contact configuration, Turnstile script and contact API with explicit test responses; no real message is sent. The card suite checks every original card's text/layout and actual PNG output from the shared production renderer.

The PR #2 completion commands, engine matrix and exact restricted-environment limitations are documented in [CMS-LOCAL-VERIFICATION.md](CMS-LOCAL-VERIFICATION.md). Run `npm run test:cms:compat` for targeted Firefox/WebKit acceptance.

## What is checked

| Layer | Evidence |
| --- | --- |
| Public build | Internal links, fragments, metadata, CSP hashes, assets and fixed transfer budgets |
| Owner boundary | Valid owner, wrong owner, missing/expired/invalid JWT, wrong issuer/audience, unsigned identity headers and missing configuration |
| Write boundary | Origin, content type, request marker, Fetch Metadata, route encoding and bounded bodies |
| Content | Active HTML, CSS escapes/imports/URLs, editor JSON execution fields, structural hooks, functional parents, image alternatives and links |
| Storage | Actual D1/R2, CAS conflicts, atomic rollback, idempotent retry, historical restore and private/public media transitions |
| CMS browser | Full original pages, independent mobile styles, text/Shift+Enter, repeated Save/Reload, pages, typography, fonts, media, wins and image export |
| Difficult editor cases | Keyboard block insertion, inline-style preservation, memory style after hydration/reset, real R2 image selection, archival recovery, locked win preview, two-tab conflicts and local draft recovery |
| Public browser | All routes and responsive widths, navigation, no-JS content, privacy choices, motion, four workshop stations and contact fixtures |

The native public modules retain their original combined 14,000-byte gzip budget. The separate lazy win renderer/export bundle is capped at 8,000 gzip bytes; it loads only when needed. Editor JavaScript is isolated under `/admin/` with a 350,000-byte combined gzip cap. Every public page's CSS remains below 14,000 gzip bytes; home HTML remains below 9,000. These are enforced transfer-size contracts, not latency or field Core Web Vitals.

## Visual evidence

`scripts/capture-cms.py` captures actual browser surfaces and each main section in desktop/mobile canvases. Run it with an isolated local Worker using:

```sh
node scripts/test-cms.mjs scripts/capture-cms.py
```

Screenshots are review inputs, not an automatic assertion of visual correctness. The primary agent separately inspects images; the single Luna Max agent handles repetitive regression execution. No generated mockups are used as proof of implementation.

- `output/visual/studio/`: main studio states and section captures.
- `output/visual/cms/`: timestamped scenario evidence, including Shift+Enter.
- `artifacts/screenshots/`: public responsive captures.
- `output/card-export/`: original card PNGs, dimensions and layout report.
- `output/logs/`: complete test logs, kept outside Git.
- `output/perf/`: Lighthouse JSON and measured admin readiness/contrast data.

The computed contrast audit checks text over simple solid backgrounds. It excludes disabled/decorative content and complex compositing; it is not a full WCAG certification. Admin readiness measurements include the harness's explicit stabilization waits, documented in the JSON, and must not be presented as pure network latency.

## Remote staging and release boundary

Remote staging verifies the allowed owner's actual Cloudflare Access session, durable Save, public reload, media visibility and history restore. A successful Wrangler upload alone is insufficient. Staging has dedicated D1/R2 bindings and its own Access audience; production has not been deployed by this task.

The release instructions remain in [DEPLOYMENT.md](DEPLOYMENT.md). Production CMS bindings and Access policy are configured after merge. Neither mock contact responses nor a successful provider call prove email inbox delivery. No production mail, full accessibility certification or field-performance guarantee is claimed.
