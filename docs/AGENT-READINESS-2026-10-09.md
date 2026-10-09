# Agent-readiness diagnosis: Omar Yusuf versus Blade & Blend

Evidence captured 2026-10-09, **read-only**. This document distinguishes the score measured by Ora from HTTP behavior verified outside Ora. It does not claim a target score has been achieved.

## Actual measured results

Source: `GET https://ora.ai/api/score/{domain}?include=essentials`

| | omaryusuf.se | bladeblendstudio.se |
|---|---|---|
| Ora scan timestamp (UTC) | 2026-10-09 05:23 | 2026-10-09 05:31 |
| Ora essentials | **5/100** | **100/100** |
| Ora main score | 18/100 | 59/100 |
| Essential points | 0/80 | 80/80 |
| Crawler access according to Ora | Cloudflare challenge | Pass |
| Content without JavaScript according to Ora | Unreadable behind challenge | Pass |
| Direct homepage HTTP from authorized desktop | 200 HTML and 200 Markdown (Vary: Accept) | 200 HTML and 200 Markdown (Vary: Accept) |
| Sitemap and llms.txt from desktop | 200 | 200 |
| OpenAPI | Real spec at /openapi.json | Not present; Ora marks it N/A |

**Primary bottleneck:** Ora's requests to omaryusuf.se are challenged **before** the Worker serves the real content. Consequently its report incorrectly lists existing metadata, JSON-LD, llms.txt, sitemap, Markdown and OpenAPI as missing/failed. Testing by spoofing only the User-Agent from another network is not proof that Ora or genuine crawlers can access the page. A Git/Worker patch cannot alter an edge security challenge that runs before the Worker.

**Not directly portable:** Blade is a booking business with its own live business structured data and a public booking action; Omar Yusuf is a personal portfolio with `Person` identity and no agent-writable public service. Ora correctly marks Blade's OpenAPI and developer portal as *not applicable*; inventing a company, transaction API, CLI or credentials on the portfolio would be deceptive.

## Confirmed cause of Ora 5/100 (second scan, 2026-10-09)

Read-only Cloudflare GraphQL `firewallEventsAdaptive` for 06:25–06:30 UTC returned **100 sampled Security Events**, all with `source=botFight` and `action=managed_challenge`. Events at 06:27:33 UTC included `OraBot/1.0 (+https://ora.ai/bot)` requests for `/`, `/openapi.json` and probe paths; a homepage event at 06:27:49 UTC used `is-agentic-site-type/1.0`. The Ora essentials score remained **5/100** at its 06:27 UTC scan, while direct HTML, Markdown, sitemap, OpenAPI and llms.txt tests from the owner's network returned HTTP 200.

For comparison, the same read-only GraphQL query returned **zero Security Events** in Blade & Blend's five-minute Ora scan window (05:29–05:34 UTC). These are limited samples, **not** full request totals or proof of either site's current Bot Fight Mode settings.

**Conclusion:** This is a confirmed Cloudflare Bot Fight Mode false positive **before** the portfolio Worker, not missing source content. Cloudflare explicitly states that the Free-plan Bot Fight Mode [cannot be bypassed by WAF Skip/Allow rules](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/). Rewriting HTML or publishing fake API products cannot fix this score. The owner must choose between disabling Bot Fight Mode (reducing bot challenges site-wide) or an appropriate paid granular protection with verified-bot exceptions. Preserve Cloudflare Access to `/admin/`, API/contact Turnstile, rate limits, the WAF and DDoS safeguards.

## Cloudflare permissions and separate owner action

The Wrangler OAuth session has `zone (read)` and can read Security Events using GraphQL, but does **not** have Bot Management Read/Write or Zone Settings Write. Direct calls to `bot_management`, `settings/security_level`, `settings/browser_check` and `rulesets` returned **HTTP 403**. The source (`botFight`) is now confirmed by event evidence, but the current credentials cannot change its setting. Cloudflare Dashboard redirected to `/login`, with no authenticated browser session. **No production security setting was modified.**

1. **Owner action requiring Cloudflare dashboard login or Bot Management Write scope:** open **omaryusuf.se → Security → Settings → Bot traffic → Bot Fight Mode**. The event source has been proven as `botFight`. Turn **Bot Fight Mode Off** only if the owner accepts reduced bot-challenge mitigation site-wide. Keep Cloudflare Access on `/admin/`, WAF/DDoS protection and contact Turnstile/rate limits unchanged. A spoofable User-Agent allowlist is not an equivalent safe workaround.
2. If Bot Fight Mode must remain in place, consider **Super Bot Fight Mode** with scoped verified-bot exceptions rather than trusting arbitrary `User-Agent` headers; [Cloudflare's documentation](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/) confirms that Free-plan Bot Fight Mode cannot be bypassed by custom WAF Skip/Allow rules. This is a product/security decision, not a Git diff.
3. **Only if a new audit still fails after changing Bot Fight Mode**, inspect fresh Security Events for other controls (WAF custom rules or AI Crawl Control). Narrow only a verified offending rule, using [Cloudflare's verified-bot guidance](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-verified-bots/) rather than a spoofable User-Agent. Keep CMS and contact-write routes protected.
4. Re-run Ora on the **deployed site** after the security change. Inspect the **new scan's per-check evidence**, not only the headline number: `https://ora.ai/api/score/omaryusuf.se?include=essentials`. Re-test Markdown/HTML negotiation and crawler responses.
5. For brand search visibility, verify indexing/search coverage for `omaryusuf.se` with the domain owner and submit its existing XML sitemap through the configured search engine webmaster tools. Rankings and re-indexing require search-engine cooperation/time; the PR cannot force them.

## Code already merged via PR #10 and PR #11

- Mobile footer contains every control even when a prior CMS style sets a fixed `height: 282px`.
- Legacy published CMS footer migrates a **single** developer link into the editor's trusted element tree, remapping only verified pre-change identities and selectors. No runtime-only injected extra anchor, and preserving owner-edited text, style, revision history and functions.
- CMS incremental save allows only footer schema version 1, tested with a genuine pre-change D1 revision and an authenticated browser.
- Personal `Person` JSON-LD includes a grounded description of the published portfolio. Public HTML advertises the already-implemented same-URL Markdown representation via an alternate link.

## Independent post-merge verification (2026-10-09)

The same source tree as production `main` (`a0bdcb9d3e45c36794a9b19392cde6e84c8fbf63`) was tested in an **isolated Git worktree** so concurrent local CMS edits in `/Users/k/dev/o-y-a` remain intact:

- `TEST_CONCURRENCY=2 npm run check:fast`: **237/237 tests passed**, including build and lint.
- `SKIP_CHECK=1 npm run quality`: **21/21 real HTTP checks**, **320/320 Chromium browser tests**, interaction/privacy checks and **31/31 revision tests** passed.
- `npm run test:cms:footer` using the pinned Playwright environment: **8/8 Chromium**, **8/8 WebKit**, and **8/8 Firefox** regressions passed (CMS edit/save/preview/reload and widths 320–1440 px).
- `npm run edge:check:built`: Wrangler's production Worker dry-run passed.
- Independent live HTTP verification on `https://omaryusuf.se`: **17/17 targeted checks passed**, including at least 500 visible HTML characters, H1/heading order, homepage Markdown with `Vary: Accept`, JSON API errors, valid OpenAPI 3.1.1 with seven distinct operations, sitemap, robots, `llms.txt`, Person JSON-LD, developer links, and genuine trust anchors.
- Six named bot User-Agent strings returned 200 on the owner's connection; **Cloudflare Security Events proved Ora's separate network was challenged**, so this is not evidence that Ora can crawl.

No application code, WAF setting, Worker deployment, or third-party index was changed as part of this evidence update. The Ora essentials score remains **5/100** until the Cloudflare mitigation decision is implemented and verified by a fresh scan.

**Do not report a 100/100 result without a fresh Ora score after the real WAF change.**
