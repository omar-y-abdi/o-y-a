# Omar Yusuf

**Teknik med hjärna. Lite bus i systemet.**

Personlig portfolio med tolv ursprungliga sidor, fyra lekstationer och en visuell redigeringsstudio. Publika sidan använder statisk HTML och små native ES-moduler. Cloudflare Worker publicerar CMS-innehåll från D1; GrapesJS laddas endast i den autentiserade studion. Bilder och typsnitt lagras i R2.

## Kom igång

Node.js 22 eller senare, npm och låsta beroenden behövs. CI använder Node 24.

```sh
npm ci
npm run dev
```

Publik förhandsvisning: `http://127.0.0.1:4173/`. Annan port: `node scripts/serve.mjs --port 5273`. Använd HTTP, inte direkt öppnade HTML-filer. Servern använder en Node-adapter för den riktiga Worker-handlern.

```sh
npm run cms:dev
```

CMS-utveckling kör en riktig lokal Worker med D1 och R2 via Miniflare på port 8790. Testidentiteten `owner@example.test` signeras med en temporär RSA-nyckel; ingen inloggningsgenväg finns i produktionskoden. Kommandot skriver privat Playwright-lagring till `output/cms-local/browser-auth.json`. Lokal data är tillfällig och identiteten ger ingen åtkomst till Cloudflare.

## Redigera webbplatsen

På en konfigurerad installation: öppna `/login/`, verifiera ägarens e-post med Cloudflare Access och öppna studion. Dashboardkontots GitHub-adress behöver inte vara samma som den tillåtna CMS-adressen.

Välj sida till vänster. Klicka eller dubbelklicka på innehållet i arbetsytan. Justera text, typsnitt, layout, färger, avstånd och storlekar till höger. **Shift+Enter behåller radbrytningar**, även efter Save och omladdning. Mobil har en egen brytpunkt; Jämför visar båda storlekarna. Resurser innehåller bilder, uppladdade WOFF2-typsnitt och vinstkort.

**Save publicerar direkt i aktuell miljö.** Revert hämtar senast sparat innehåll. History visar tidigare versioner; Restore läser in vald version som utkast. Save krävs sedan för att publicera återställningen. Originalversionen finns som version 0. Historik och publicerade filer raderas inte av dessa åtgärder.

Läs [användarguiden](docs/CMS-GUIDE.md), [arkitekturen](docs/CMS-DESIGN.md), [säkerhetsgränserna](docs/CMS-SECURITY.md) och [driftsättningen](docs/DEPLOYMENT.md).

## Kodens delar

| Plats | Ansvar |
| --- | --- |
| `src/content/`, `src/templates/`, `src/styles/` | Ursprungligt innehåll, HTML och formspråk |
| `src/client/` | Navigation, lekar, vinstdesign/export, kontakt och integritetsval |
| `src/cms/client/` | Visuell editor, bibliotek, utkast och konfliktlösning |
| `src/cms/auth.mjs`, `validation.mjs`, `project.mjs` | Ägarkontroll och serverns innehållsgräns |
| `src/cms/store.mjs`, `assets.mjs`, `render.mjs` | D1-versioner, R2-filer och publicering |
| `src/server/` | Befintlig kontaktserver och mejlmallar |
| `src/worker.mjs` | Routing och säkerhetshuvuden |
| `scripts/build*.mjs` | Publikt bygge, separat editorbundle och CMS-original |
| `migrations/` | CMS-databasens schema |
| `tests/` | Node-, Worker-, lagrings- och browserkontroller |

`dist/` är det spårade bygget. `.generated/` återskapas vid bygge. Redigera källfiler och bygg om. Hemligheter, testidentiteter och arbetsloggar ignoreras av Git.

## Verifiering

```sh
npm run check
python3 -m venv .test-venv
. .test-venv/bin/activate
pip install -r requirements-test.txt
python -m playwright install chromium
npm run verify:fast
npm run verify:full
```

`verify:fast` är den lokala standardloopen: bygge, lint, parallella `node:test`-tester och kritiska GrapesJS-smokes. `verify:full` är release/CI-gaten och lägger till publik HTTP/browser-E2E, 240 parallella kortexporter, autentiserad CMS-browser-E2E, Firefox/WebKit och Wrangler dry-run. `test:cms` startar isolerade Workers på lediga portar och kör autentiserad browser-E2E med riktig D1/R2. Linux kan behöva `python -m playwright install --with-deps chromium`. [QA-guiden](docs/QA.md) beskriver testgränser och artefakter. GitHub Actions kör kontroller på PR; workflowen publicerar inte.

## Miljöer och kontakt

`wrangler.staging.jsonc` pekar på separat testmiljö. Produktion använder `wrangler.jsonc` och befintlig Worker `omar-portfolio`. Produktions-CMS behöver egna bindings och en egen Access-applikation enligt [driftguiden](docs/DEPLOYMENT.md); dessa konfigureras först efter merge. Stagingdatabasen får aldrig bindas till produktion.

Kontaktformuläret behåller Cloudflare Turnstile, serverbaserad Resend-integration och befintligt missbruksskydd. Se [CONTACT-SETUP.md](docs/CONTACT-SETUP.md). Lokala tester använder uttryckliga testsvar och skickar inga riktiga mejl. Frivillig statistik förblir avstängd med `ANALYTICS_ENABLED: "false"`.
