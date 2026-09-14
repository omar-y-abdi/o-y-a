import { site } from '../content/site.mjs';
import { escape, icon, flower } from './components.mjs';
import { resourceSlots } from '../content/resources.mjs';
export function structuredData(page) {
  const url = site.origin + page.path;
  const graph = [
    { '@type': 'Person', '@id': site.origin + '/#omar', name: site.name, url: site.origin + '/', jobTitle: 'Maskiningenjör', sameAs: [site.github] },
    { '@type': 'WebSite', '@id': site.origin + '/#website', name: site.name, url: site.origin + '/', inLanguage: 'sv-SE', creator: { '@id': site.origin + '/#omar' } },
    { '@type': page.path === '/om/' ? 'AboutPage' : page.path === '/kontakt/' ? 'ContactPage' : 'WebPage', '@id': url, url, name: page.title, description: page.description, inLanguage: 'sv-SE', isPartOf: { '@id': site.origin + '/#website' }, about: { '@id': site.origin + '/#omar' } },
  ];
  if (page.path !== '/' && !page.noindex) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Hem', item: site.origin + '/' }, { '@type': 'ListItem', position: 2, name: page.name, item: url }] });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
export function layout(page, content, assets) {
  const resources = assets.resources ?? resourceSlots;
  const social = resources.social;
  const imageOrigin = assets.resourceOrigin ?? site.origin;
  return `<!doctype html>
<html lang="sv" data-motion="auto">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<link rel="canonical" href="${site.origin + page.path}">
<meta name="theme-color" content="#fff0b3"><meta name="color-scheme" content="light">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<meta property="og:type" content="website"><meta property="og:locale" content="sv_SE"><meta property="og:site_name" content="Omar Yusuf">
<meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${site.origin + page.path}">
<meta property="og:image" content="${escape(imageOrigin + social.src)}"><meta property="og:image:width" content="${social.width}"><meta property="og:image:height" content="${social.height}"><meta property="og:image:type" content="${escape(social.mime)}"><meta property="og:image:alt" content="${escape(social.alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${escape(imageOrigin + social.src)}"><meta name="twitter:image:alt" content="${escape(social.alt)}">
<link rel="icon" href="${escape(resources.icon.src === resourceSlots.icon.src ? '/favicon.svg' : resources.icon.src)}" type="${resources.icon.src === resourceSlots.icon.src ? 'image/svg+xml' : escape(resources.icon.mime)}"><link rel="apple-touch-icon" href="${escape(resources.icon.src)}">
<link rel="stylesheet" href="${assets.css}">
<script type="application/ld+json">${structuredData(page)}</script>
<script type="module" src="${assets.main}"></script>
</head>
<body id="top" class="page-${page.template}" data-page="${page.path}">
<a class="skip-link" href="#main">Hoppa till innehållet</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="/" aria-label="Omar Yusuf, startsida">${flower('brand-mark')}<span>omar yusuf<span class="brand-dot">.</span></span></a>
<nav class="primary-nav" aria-label="Huvudmeny"><a href="/#byggen">Byggen</a><a href="/om/" ${page.path === '/om/' ? 'aria-current="page"' : ''}>Människan</a><a href="/verkstad/" ${page.path === '/verkstad/' ? 'aria-current="page"' : ''}>Lek en stund <span aria-hidden="true">↗</span></a></nav>
<div class="header-actions"><button class="motion-toggle js-only" data-motion-toggle aria-label="Pausa rörelser" aria-pressed="false" title="Pausa rörelser" hidden>${icon('pause')}</button><a class="hello-link" href="/kontakt/">Säg hej ${icon('diagonal')}</a><button class="menu-toggle js-only" data-menu-toggle aria-label="Öppna menyn" aria-expanded="false" aria-controls="mobile-menu" hidden><span></span><span></span></button></div>
</div><nav class="mobile-menu" id="mobile-menu" aria-label="Mobilmeny" hidden><a href="/#byggen">Byggen ${icon('arrow')}</a><a href="/om/">Människan ${icon('arrow')}</a><a href="/verkstad/">Lek en stund ${icon('arrow')}</a><a href="/kontakt/">Säg hej ${icon('arrow')}</a></nav>
</header>
<main id="main" tabindex="-1">${content}</main>
<footer class="site-footer"><div class="footer-main"><a class="brand footer-brand" href="/">${flower('brand-mark')}<span>omar yusuf.</span></a><p>Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.</p><a class="footer-back" href="#top" data-back-top>Upp igen ${icon('down')}</a></div>
<div class="footer-bottom"><span>© ${new Date().getUTCFullYear()} Omar Yusuf</span><nav aria-label="Sidfotsmeny"><a href="/integritet/">Integritet</a><a href="/kakor/">Kakor</a><a href="/villkor/">Villkor</a><a href="/tillganglighet/">Tillgänglighet</a><button class="link-button js-only" data-privacy-open hidden>Ändra dataval</button></nav><span class="footer-signoff">Tack för titten. På riktigt. <span aria-hidden="true">✳</span></span></div></footer>
<aside class="consent-banner" data-consent-banner aria-label="Ditt val om statistik" hidden><div class="consent-mark" aria-hidden="true">${icon('smile')}</div><div><h2>Din paus. Dina villkor.</h2><p>Får sidan räkna besök och knapptryck? Inga profiler, ingen reklam. <a href="/kakor/">Så fungerar det.</a></p></div><div class="consent-actions"><button data-consent="deny">Bara nödvändiga</button><button data-consent="allow">Tillåt statistik</button></div></aside>
<dialog class="privacy-dialog" data-privacy-dialog aria-labelledby="privacy-title"><button class="dialog-close" data-dialog-close aria-label="Stäng dataval">${icon('close')}</button><span class="eyebrow">DU BESTÄMMER</span><h2 id="privacy-title">Små data.<br>Stora valmöjligheter.</h2><p>Statistik är frivillig. Den räknar enbart kända sidnamn och vissa knapptryck. Inga besökarprofiler eller personliga meddelanden.</p><p data-privacy-status class="privacy-status" role="status"></p><div class="privacy-choice"><span>Nödvändiga inställningar</span><strong>Alltid tillåtna</strong></div><div class="consent-actions"><button data-consent="deny">Bara nödvändiga</button><button data-consent="allow">Tillåt statistik</button></div><a href="/integritet/" class="text-link">Läs om integritet ${icon('arrow')}</a></dialog>
<div class="toast" data-toast role="status" aria-live="polite" hidden></div>
</body></html>`;
}
