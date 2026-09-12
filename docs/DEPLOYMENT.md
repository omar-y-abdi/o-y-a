# Uppdatera o-y-a utan att byta webbplats

Den här revisionen utgår från Omars bifogade, redan publicerade `o-y-a.zip`. Den gör inga fjärrändringar. Repo, domän och nuvarande publiceringskedja ska behållas.

## Före uppladdning

Spara en kopia av nuvarande källkod och fungerande Cloudflare-version. Kopiera den nya projektmappens innehåll till rätt repo, utan att ersätta dina hemligheter eller eventuella befintliga CI-filer som inte ingick i bas-ZIP:en. Publicera inte granskningsarkivet som webbplats.

```sh
npm run check
```

Bygget kräver Node.js 22 eller senare och inga produktionspaket. Den skapade `.generated/csp.mjs` behövs när Worker-koden byggs och återskapas med `npm run build`.

## Behåll befintlig Cloudflare-konfiguration

`wrangler.jsonc` behåller namnet **`omar-portfolio`**, `omaryusuf.se` och `www.omaryusuf.se`, `ASSETS` samt den avstängda statistikflaggan. Kontaktfunktionen lägger till `CONTACT_RATE_LIMIT`. Domänrutterna ändras inte.

Konfigurera de fem servervärdena enligt [CONTACT-SETUP.md](CONTACT-SETUP.md). Den privata mottagaren ska vara en Cloudflare-hemlighet, inte en publik variabel eller ett klientfält. Nycklar finns inte i paketet.

För en normal Wrangler-publicering på rätt, redan autentiserat konto:

```sh
npm run edge:check
npm run deploy
```

Enbart statisk uppladdning ger ingen kontaktsändning. `src/worker.mjs`, dess två servermoduler och bindings måste följa med på din befintliga Worker-publiceringsväg.

Ingen GitHub-workflow fanns i den godkända bas-ZIP:en. Revisionen skapar inte någon ny workflow eller en parallell publiceringskedja. Behåll och kontrollera den du redan använder.

## Kontrollera den nya versionen

Kör `node scripts/smoke-live.mjs` efter din publicering. Scriptet läser offentliga adresser, inklusive de nya projektsidorna, 404 och www-omdirigering; det skickar inget kontaktmejl. Det har inte körts mot en publicerad revision i utvecklingsmiljön.

Kontrollera i en vanlig webbläsare att URL:er, moduler, GIF, kortlek och CSP fungerar tillsammans. Prova navigation, alla fyra stationer, `Upp igen`, tangentbord, mobil, minskad rörelse och privat formulärleverans enligt kontaktguiden. Kontrollera Console och Network. Utvecklingsmiljöns dokumentrendering är inte bevis för en riktig nätverks-E2E-körning.

DNS och certifikat ska inte behöva ändras för denna koduppdatering. Om din befintliga Cloudflare-konfiguration skiljer sig, granska den skillnaden i stället för att blint ersätta zoninställningar. Befintliga MX-poster, andra subdomäner och andra tjänster är utanför ändringen.

## Statistik

`ANALYTICS_ENABLED` förblir `"false"`. Kontaktfunktionen är oberoende av frivillig statistik. Aktivera inte statistik i samband med installationen. En senare aktivering kräver separat genomgång av kontoavtal, loggar, integritetstext, kostnader och missbruksskydd samt verkliga samtyckestester.

## Återställning

Behåll den tidigare fungerande versionen. Vid fel kan den återpubliceras genom din normala väg eller väljas genom Cloudflares versionshantering. Revisionen innehåller ingen DNS-radering eller annan destruktiv återställningsfunktion.
