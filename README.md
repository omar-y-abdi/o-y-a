# Omar Yusuf

**Teknik med hjärna. Lite bus i systemet.**

En personlig, svensk webbplats med en taktil glädjemaskin, delbara kort och en liten bubbelpaus. Varmt gult, koboltblått, egenritad CSS-grafik och faktisk interaktion. Inte en bild av en webbplats.

## Status

Källkod, statiskt bygge, lokala tester och visuell granskning finns. **Webbplatsen har inte publicerats av den här leveransen. Inget GitHub-repo eller någon Cloudflare-koppling har skapats. DNS och TLS för omaryusuf.se är inte verifierade.**

GitHub-anslutningen i arbetsmiljön kunde läsa men inte skriva. Cloudflare-verktyg exponerades inte. Fullständig webbläsar-E2E och den riktiga Cloudflare-körmiljön återstår också. Se [verifieringsrapporten](docs/QA.md) och [publiceringsguiden](docs/DEPLOYMENT.md).

## Öppna webbplatsen lokalt

Kräver Node.js 22 eller senare. Inga npm-paket behövs för att bygga eller visa sidan.

```sh
npm run dev
```

Öppna `http://127.0.0.1:4173/` i webbläsaren. Avsluta servern med Ctrl+C. Om porten är upptagen:

```sh
npm run build
node scripts/serve.mjs --port 4180
```

Bygg separat med `npm run build`, visa senaste bygget med `npm run preview`. Dubbelklicka inte på HTML-filen: moduler, interna länkar och API-svar ska serveras över HTTP.

## Vad som finns

Glädjemaskinen skriver ut ett av 18 förskrivna kort i tre kategorier. Det går att dela en stabil kortlänk eller skapa en riktig PNG-bild på den egna enheten. Verkstaden har också tangentbordsstyrda bubblor, ljud som är avstängt från början och en knapp för att pausa rörelser. Systemets inställning för minskad rörelse har företräde.

Sidor: hem, verkstad, om Omar, Furl, kontakt, integritet, kakor, villkor, tillgänglighet och en egen 404. Furl är ett verifierat offentligt projekt. Inga påhittade kundcase, porträtt, recensioner, resultat eller företagsadresser används.

SEO finns i genererad HTML: individuella titlar och beskrivningar, absoluta canonical-adresser, Open Graph/Twitter-bild, en h1 per sida, interna länkar, brödsmulor och strukturerade data. sitemap.xml, robots.txt och llms.txt byggs från samma sidregister. 404 är noindex och inte med i webbplatskartan. Person-schema används; en lokal verksamhet har inte verifierats.

## Integritet

**Statistik är avstängd i levererad driftskonfiguration.** En Analytics Engine-binding räcker inte för att starta den. Även `ANALYTICS_ENABLED` måste vara strängen `"true"`, och besökaren måste uttryckligen samtycka. GPC och Do Not Track stoppar frivillig statistik även efter ett tidigare ja.

När funktionen aktiveras tar API:t endast emot en känd sidväg och ett av fyra fasta händelsenamn. Varje typ räknas högst en gång per sidladdning i klienten. Det lagras inget besökar-ID, ingen IP-adress eller fritext i dessa datapunkter. Cloudflare behandlar fortfarande nätverksuppgifter för att leverera anrop; detta är inte ett löfte om anonym eller EU-exklusiv hosting.

Inga externa typsnitt, annonsbibliotek, inbäddade sociala flöden eller låtsaskontaktformulär. Kontaktlänkarna går bara till verifierade offentliga GitHub-sidor. En lämplig privat kontaktväg och hostingkontots faktiska integritetsinställningar måste godkännas före lansering med statistik.

## Kodens delar

| Plats | Ansvar |
| --- | --- |
| `src/content/site.mjs` | Namn, offentliga länkar, sidregister och metadata |
| `src/templates/` | Semantisk HTML, delade delar, sidor och policytexter |
| `src/styles/` | Färger, responsiv layout, maskin, illustrationer och rörelse |
| `src/client/` | Kort, animationer, menyer, delning, samtycke och bubblor |
| `src/worker.mjs` | Säkerhetshuvuden, domänomdirigering och statistik-API |
| `scripts/build.mjs` | Statiskt bygge, hashade resurser och CSP-hashar |
| `scripts/serve.mjs` | Lokal HTTP-server med samma Worker-handler och en Node-adapter |
| `tests/` | Enhets-, HTTP-, renderings- och webbläsartester |
| `.github/workflows/quality.yml` | Kvalitetsgrind och separat, avstängd publiceringsgrind |
| `public/` | Egen favicon, appikon och social delningsbild |

Det genererade `dist/` ingår i ZIP-leveransen men inte i Git. `.generated/` återskapas av byggkommandot. Ändra källan, inte genererade filer. Bygget behöver inga externa paket, bundlers eller typsnittsfiler. Flera sidor laddar bara grundmodulen; leksakskoden laddas på sidor som använder den.

## Tester

```sh
npm run check
```

Kör bygge, syntaxkontroll, innehålls-/resurskontroller och Node-tester. För webbläsartester behövs Python, Playwright enligt `requirements-test.txt` och Chromium:

```sh
python3 -m venv .test-venv
. .test-venv/bin/activate
pip install -r requirements-test.txt
python -m playwright install chromium
export CHROMIUM_PATH="$(python -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()')"
npm run quality
```

`npm run quality` startar egna testservrar på 4173 och 4174, kör HTTP- och verkliga URL-baserade webbläsartester och stänger sedan servrarna. Låt de portarna vara lediga. På Linux kan Chromium också kräva systembibliotek; CI använder Playwrights `--with-deps`.

`python tests/browser.py --render-only --screenshots` är ett uttryckligt reservläge för dokumentrendering när webbläsarnavigering är blockerad. Det är **inte** en ersättning för full E2E. Rapporten namnger adaptrarna. `python tests/contrast.py` och `python tests/card_export.py` kontrollerar kontraster respektive samtliga kortbilder i samma renderingsläge. `scripts/artwork.py` är ett separat verktyg för att återskapa ikoner/delningsbild, inte ett krav för vanligt bygge; det använder även Pillow och CairoSVG.

## Publicering

Läs [DEPLOYMENT.md](docs/DEPLOYMENT.md) före publicering. Cloudflare-konfigurationen riktar sig till exakt `omaryusuf.se` och `www.omaryusuf.se`. Den får inte användas för att blint ersätta befintlig DNS eller en annan applikation.

Den förberedda kedjan är GitHub Actions → tester → Cloudflare. `DEPLOY_ENABLED` är en separat repo-variabel som måste vara `true` innan deploy-jobbet över huvud taget kan köras. Privata kontouppgifter hör hemma i godkända anslutningar eller GitHub Secrets, inte i koden eller i en chatt.
