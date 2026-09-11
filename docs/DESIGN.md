# Omar Yusuf: en seriöst lekfull verkstad

## Scope and authority
The requested deliverable is a deployed personal site, not a mockup. The user explicitly requested autonomous execution. Local design/build/test may proceed. Remote creation and deployment require actual authorized write tools, which are not exposed in this conversation. No remote mutation has occurred. Do not claim production readiness until the hosted gates pass.

## Chosen direction
An original tactile workshop in butter yellow, cobalt, warm paper, coral and ink. Large, confident, closely set system typography. A CSS-built joy machine that prints a small kind or funny receipt. This is not the generated mockup and uses none of its invented portraits or projects. Mechanical play should make a visitor smile without obscuring navigation or content.

A generic gradient portfolio was rejected as impersonal. A full 3D/WebGL world was rejected because loading and accessibility would compete with the content. A small, purpose-built static multi-page site with progressively enhanced physical-feeling controls earns its complexity.

## Architecture
Build HTML at development time with native Node ES modules. No application runtime framework or production dependency downloads. Separate content, templates, CSS, interaction logic and Cloudflare worker. Content-hash assets; no source maps. Static source contains actual headings and metadata. Public navigation remains useful without JavaScript.

Cloudflare Worker serves assets, canonicalizes www/HTTP, supplies security headers, and accepts only consented, fixed-enumeration aggregate analytics events. Analytics Engine binding has no user ID, IP, free text, referrer or query string in stored points. Requests still pass through the hosting provider. Local preview explicitly does not persist analytics. Provider retention and cookie behavior are accurately described in policies. No external fonts, images, scripts, embeds, fake contact form or fabricated local-business schema.

## Pages
Home; interactive workshop; about; Furl project; contact; privacy; cookies; terms; accessibility; custom 404. Each regular page has a unique title, description, absolute canonical, Open Graph, one h1, internal navigation and structured data. Inner pages have breadcrumbs. sitemap.xml excludes 404. robots.txt and llms.txt reflect the actual pages.

## Evidence for public content
- User: public name Omar Yusuf, mechanical engineer, playful but meticulous personal site.
- Authenticated GitHub profile: current login omar-y-abdi.
- Public profile README at https://github.com/omar-y-abdi/omar-y-abdi/blob/main/README.md: automation/mechatronics, coding, R&B/soul/jazz. Avoid publishing private account email or speculative credentials.
- Public Furl README at https://github.com/omar-y-abdi/furl-ctx/blob/main/README.md: reversible context compression. Do not repeat performance percentages as independently verified results.

## Acceptance gates
Real screenshots of every page at desktop/mobile, and every major interaction state. Keyboard operation; reduced motion; JS disabled; blocked cookies; narrow widths; touch; clipboard fallback; no unknown outgoing requests or runtime errors. HTML/SEO/internal links and source-map scan. Server tests for bad analytics payloads, consent revocation, origins, methods, limits and missing binding. Cold-load lab metrics and transfer budgets. Native Cloudflare runtime and production DNS/TLS remain explicitly unverified until authorized hosting access exists.
