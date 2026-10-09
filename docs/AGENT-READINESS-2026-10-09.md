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

## Cloudflare permissions and separate owner action

The provided Wrangler login was successfully authenticated and has `zone (read)` but not security-management scopes. Read-only calls for either zone's `settings/security_level`, `bot_management` and `rulesets` returned HTTP **403**. The actual challenging product/rule therefore **cannot be determined from the available credentials**.

1. In Cloudflare Dashboard, select **omaryusuf.se** → **Security → Analytics / Events**. Examine challenged requests at approximately 2026-10-09 05:23 UTC (the Ora scan time). Filter bot traffic and record **Service / Rule**, request action and whether the challenge is generated before the Worker. Compare the same timeframe with bladeblendstudio.se.
2. If Service is **Bot Fight Mode**, see [Cloudflare's official docs](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/). On the Free plan Bot Fight Mode **cannot** be bypassed by WAF Skip/Allow rules. Decide whether to disable it in **Security → Settings → Bot traffic → Bot Fight Mode**, while preserving DDoS protection, any other WAF custom rules and Cloudflare Access on `/admin/`. Do not lower security without confirming the source of the false positive. Upgrading to Super Bot Fight Mode is another path if precise verified-bot exemptions are required.
3. If the challenge instead comes from a **WAF custom rule or AI Crawl Control**, narrow only the offending rule and permit legitimate **verified bots** (Cloudflare `cf.client.bot`), not a blindly trusted spoofable User-Agent. Keep CMS routes and write endpoints protected. See [verified-bot examples](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-verified-bots/) and [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/).
4. Re-run Ora on the **deployed site** after the security change. Inspect the **new scan's per-check evidence**, not only the headline number: `https://ora.ai/api/score/omaryusuf.se?include=essentials`. Re-test Markdown/HTML negotiation and crawler responses.
5. For brand search visibility, verify indexing/search coverage for `omaryusuf.se` with the domain owner and submit its existing XML sitemap through the configured search engine webmaster tools. Rankings and re-indexing require search-engine cooperation/time; the PR cannot force them.

## Code work in this PR

- Mobile footer contains every control even when a prior CMS style sets a fixed `height: 282px`.
- Legacy published CMS footer migrates a **single** developer link into the editor's trusted element tree, remapping only verified pre-change identities and selectors. No runtime-only injected extra anchor, and preserving owner-edited text, style, revision history and functions.
- CMS incremental save allows only footer schema version 1, tested with a genuine pre-change D1 revision and an authenticated browser.
- Personal `Person` JSON-LD includes a grounded description of the published portfolio. Public HTML advertises the already-implemented same-URL Markdown representation via an alternate link.

**Do not report a 100/100 result without a fresh Ora score after the real WAF change.**
