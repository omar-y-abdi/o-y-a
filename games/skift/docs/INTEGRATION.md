# Integrating SKIFT into a portfolio

The distributable already contains a complete page at `dist/play/skift/`. The local preview serves it at `/play/skift/`. Integration is a separate publishing decision: the project does not edit a repository, configure Cloudflare, create an external project, or deploy anything.

## Static hosting

Copy the **whole** `dist/play/skift/` directory into the static output served by the target site. Keep `assets/`, `audio/`, `icon.svg`, the page and license files together. The page's scripts and styles use relative paths; audio uses the same-origin `/play/skift/audio/` path, including when previewed under a CMS URL. Keep that audio path when hosting the standalone build. No backend, database, API key or runtime package installation is needed.

The root `dist/index.html` is only a convenience redirect for standalone preview. Do not copy it over the portfolio's homepage.

A Worker, CMS or single-page router may intercept `/play/skift/`. Configure the host to serve this directory as static content rather than returning another page for game asset requests. This must be checked against the site's routing at integration time; merely copying a directory does not prove that a site's custom router serves it.

The title page's portfolio links use `https://omaryusuf.se/`. Change those links in the root source `index.html` and rebuild only when the intended portfolio address changes.

The portfolio repository builds this source directly with its root `npm run build` rather than copying a standalone release. Its page and stylesheet adapters preserve the portfolio shell. See the repository's `docs/SKIFT.md` for that pipeline and its content-versioned caching; the standalone instructions here still describe the game's own build script.

## Verify before publishing

Visit the final nested URL, start a run, use dash and pulse, reload to confirm the checkpoint, then request `assets/app.js` and `audio/shift.mp3` directly. They must return the actual JS/audio, not a CMS HTML fallback. Check portrait and landscape layouts on the target page.

Serve JavaScript as JavaScript, CSS as CSS and audio with the appropriate MIME types. A restrictive site-wide Content Security Policy needs to permit this page's same-origin scripts, styles and audio. The game's UI sets inline style properties for cooldowns and positions, and Howler may use blob audio paths. Test the actual site policy rather than weakening the site's security globally.

A dedicated page is preferable to an iframe: it avoids competing keyboard focus, parent-page scroll gestures and fullscreen layout constraints. An iframe is not a tested deployment target.

## Updating and local state

Replace the game's directory atomically or deploy a coherent build so that HTML, scripts and assets match. Do not put immutable long-lived caching on these unversioned filenames without adding a versioned deployment path. No service worker is registered by SKIFT.

The key `oy-skift-v1` in localStorage contains preferences, personal best and the current district-start checkpoint. It is not a server-authoritative leaderboard. Browser storage can be cleared or modified by the player. A different origin or local port has a different save. No tracking or remote score submission is implemented.
