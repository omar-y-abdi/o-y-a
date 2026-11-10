import { escape } from './components.mjs';

// Self-contained 503 page for when public rendering fails. It reuses the 404
// classes from the built stylesheet and needs no D1, runtime JSON or script.
export function unavailablePage({ requestId, css }) {
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tillfälligt avbrott | Omar Yusuf</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#fff0b3"><meta name="color-scheme" content="light">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${escape(css)}">
</head>
<body class="page-notFound">
<main id="main"><section class="not-found section-wrap"><p class="eyebrow">TILLFÄLLIGT AVBROTT</p><h1>Sidan tar en kort paus.</h1><p>Sidan går inte att visa just nu.<br>Vänta en liten stund och försök igen.</p><div class="error-actions"><a href="/" class="button button-ink">Försök igen från startsidan</a></div><span class="error-note">Fel-ID: ${escape(requestId)}</span></section></main>
</body></html>`;
}
