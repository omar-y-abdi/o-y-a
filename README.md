# Omar Yusuf

**Teknik med hjärna. Lite bus i systemet.**

Den smörgula, koboltblå webbplatsen i Omars godkända `o-y-a.zip`, vidareutvecklad utan att ersätta dess formspråk. Källkod, byggda sidor, tester och konfiguration följer med.

## Den här leveransen

Revisionen uppdaterar den befintliga webbplatsen. Den skapar inget nytt repo, ändrar ingen DNS och publicerar inte automatiskt. Befintligt Worker-namn **`omar-portfolio`** och de två befintliga domänrutterna behålls. Den gamla leveransens påståenden om saknade repo eller kontobehörigheter beskriver inte den här revisionen.

OY-monogrammet har ersatts av en liten illustrerad arbetsbänk i samma lutande papperskort. `Upp igen` går till dokumentets verkliga början. Kontaktkuvertet har egen text, inga privata mottagaruppgifter i klienten och en diskret länk till integritetspolicyn. Ingen lappmängd annonseras i gränssnittet.

Verkstaden innehåller fyra stationer: glädjemaskinen, bubbelpausen, memory och femsekundersfikat. Maskinen har torr humor, kärleksfulla gliringar, pepp och påminnelser, en blandad kortlek per kategori, reaktiv figur och utskrift ovanpå maskinen. De gamla kortlänkarna fungerar fortfarande. Bilder skapas på besökarens enhet. Ljud börjar avstängt och minskad rörelse respekteras.

Persontexten har uppdaterats enligt Omars uppgifter. Blade & Blend och Backhaul har egna projektkort och sidor. Inga privata repo publiceras, inga hackathonvinster eller produktionseffekter uppfinns.

## Visa lokalt

Node.js 22 eller senare behövs. Inga npm-paket behövs för vanligt bygge och förhandsvisning.

```sh
npm run dev
```

Öppna `http://127.0.0.1:4173/`. Avsluta med Ctrl+C. För annan port:

```sh
npm run build
node scripts/serve.mjs --port 4180
```

Använd HTTP-servern, inte dubbelklick på HTML-filer. Länkar, moduler, JSON-kortleken och API-svar behöver rätt origin. Den lokala servern använder samma Worker-handler med en dokumenterad Node-adapter, inte Cloudflares workerd.

## Kontaktmejl

Formuläret använder Cloudflare Turnstile och en serverbaserad Resend-integration. Namn och mejladress krävs. Meddelandet är valfritt. Två separata mejl skickas: en intern avisering med besökarens Reply-To och ett formgivet mottagningskvitto med den egna gula GIF-figuren. Mottagaradressen till Omar finns bara i en serverhemlighet.

**Konfigurera [kontaktfunktionen](docs/CONTACT-SETUP.md) före publicering.** Utan hemligheter och rate-limit-binding stänger API:t kontaktsändningen i stället för att låtsas ha skickat mejl. Den vanliga lokala förhandsvisningen skickar inga riktiga mejl. Tester använder uttryckliga provideradaptrar.

GIF-filen är en bild i mejlet. En avsändaravatar i inkorgens meddelandelista är en annan funktion och styrs av mottagarens mejltjänst. Den har inte konfigurerats av denna leverans.

## Kodens delar

| Plats | Ansvar |
| --- | --- |
| `src/content/site.mjs` | Sidregister, offentliga länkar och metadata |
| `src/templates/` | Semantisk HTML, innehåll och policytexter |
| `src/styles/` | Originalets formspråk och separata tillägg för berörda sidor |
| `src/client/` | Navigation, leksaker, kort, samtycke och kontaktformulär |
| `src/server/contact.mjs` | Validering, Turnstile, hastighetsbegränsning och Resend |
| `src/server/emails.mjs` | Tabellbaserade HTML-mejl och textalternativ |
| `src/worker.mjs` | Routing, säkerhetshuvuden, kontakt- och statistik-API |
| `public/data/cards.json` | Kortlek, hämtad först när maskinen används |
| `public/mail/` | Den animerade figuren och dess stillbild |
| `scripts/build.mjs` | Statiskt bygge, sidberoende CSS och hashade resurser |
| `scripts/serve.mjs` | Lokal server med Node-adapter |
| `tests/` | Enhets-, HTTP-, layout- och interaktionskontroller |

`dist/` ingår som färdigt bygge. `.generated/` återskapas av byggkommandot och innehåller inga hemligheter. Ändra källan och bygg om, inte enstaka filer i `dist/`. Inga typsnittsfiler, produktions-source maps eller tredjepartsramverk levereras. JavaScript för kontakt och spel laddas bara på sidorna som använder funktionerna.

## Kontrollera revisionen

```sh
npm run check
```

Det kör byggning, syntaxkontroll och Node-tester. Webbläsartester använder Python, Playwright och Chromium. För att installera separata testverktyg:

```sh
python3 -m venv .test-venv
. .test-venv/bin/activate
pip install -r requirements-test.txt
python -m playwright install chromium
export CHROMIUM_PATH="$(python -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()')"
npm run quality
```

`quality` startar testservrar på 4173 och 4174, kör HTTP-kontroller och URL-baserade webbläsartester och stänger servrarna. Portarna måste vara lediga. Linux kan även behöva Playwrights systembibliotek, installerade med `python -m playwright install --with-deps chromium`.

I en miljö där webbläsarens navigeringspolicy blockerar adresser kan de **separata dokumentrenderingstesterna** köras:

```sh
python tests/browser.py --render-only --screenshots --section pages
python tests/browser.py --render-only --screenshots --section interactions
python tests/browser.py --render-only --screenshots --section privacy
python tests/revision_browser.py
python tests/card_export.py
python tests/contrast.py
python tests/email_render.py
```

De här lägena kör verklig DOM, CSS, canvas och interaktionskod, men anpassar origin, nätverk, lagring och vissa webbläsarbehörigheter. De är **inte fullständiga nätverks-E2E-tester**. Gränser och aktuella resultat finns i [QA.md](docs/QA.md).

Pillow behövs endast för valfria grafikverktyg som `scripts/mail-art.py`; det ingår inte i webbplatsens drift. Färdig GIF och övriga grafikfiler finns redan i `public/`. Det äldre verktyget `scripts/artwork.py` använder även CairoSVG.

## Uppdatera den befintliga webbplatsen

Följ [DEPLOYMENT.md](docs/DEPLOYMENT.md). Ingen GitHub-workflow följer med den godkända bas-ZIP:en, och revisionen installerar inte någon. Behåll din befintliga publiceringsväg. Ladda inte upp hemligheter till GitHub eller som statiska resurser.

Frivillig statistik förblir avstängd genom `ANALYTICS_ENABLED: "false"`. Kontaktmejl kräver inte samtycke till statistik. Aktivera inte statistik som en bieffekt av formulärinstallationen.
