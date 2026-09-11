# Publicering och DNS

## Utgångsläge

Det finns en lokalt byggd webbplats och en Git-leverans. Ingen fjärrpublicering, repo-skapning, DNS-ändring eller Cloudflare-anslutning har gjorts. Den här guiden beskriver återstående åtgärder, inte redan genomförda resultat.

Avsett konto är `omar-y-abdi`. Avsett reponamn är `omaryusuf-se`. Kontrollera om det redan finns innan det skapas. Använd inte force-push och skriv inte över ett annat projekt.

## 1. Skapa GitHub-repot från det verifierade Git-paketet

Följande är kommandon för en behörig dator med Git och inloggad GitHub CLI. Det privata repo-valet undviker oavsiktlig publicering av källkod; själva webbplatsen kan fortfarande vara offentlig.

```sh
git clone omar-yusuf-git.bundle omaryusuf-se
cd omaryusuf-se
git branch -m main
git remote remove origin
gh repo create omar-y-abdi/omaryusuf-se --private --source=. --remote=origin --push
```

Om repot redan finns: stanna, läs dess historia och integrera med en granskad branch/PR. Skapa inte om det och använd inte `--force`. ZIP-alternativet innehåller samma arbetsfiler men ingen Git-historik.

Låt den medföljande kvalitetskontrollen köra. GitHub Actions-workflowen är `Website quality and release`, med kvalitetsjobbet `verify`. Ange detta jobb som ett obligatoriskt statuskrav för main om kontots plan och åtkomst medger det. Workflowen installerar testwebbläsaren, kör verklig HTTP-navigering och gör en Wrangler dry-run. Dess framtida resultat är inte känt i denna leverans.

## 2. Läs befintligt Cloudflare- och DNS-läge innan någon ändring

Spara en export eller skärmbilder av befintliga DNS-poster och domänkopplingar. Bekräfta rätt konto och en aktiv Cloudflare-zon för `omaryusuf.se`. Jämför namnservrarna hos registraren med de namnservrar Cloudflare faktiskt visar. Gissa inte namnservrar eller origin-IP-adresser.

Kontrollera apex och www separat, inklusive A, AAAA, CNAME, eventuella befintliga Worker/Pages-kopplingar samt certifikat/CAA-inställningar. Kontrollera vilken tjänst varje post redan betjänar. Ändra inte MX, SPF, DKIM, DMARC eller andra orelaterade namn som en del av denna publicering.

Projektet använder **Workers Custom Domains**, inte ett gissat A-record till en server. Cloudflare dokumenterar att Custom Domains kräver en aktiv zon och skapar tillhörande DNS-poster och certifikat. Ett befintligt CNAME på samma värdnamn måste hanteras; ta inte bort det förrän det är klart vilken gammal tjänst som påverkas. [Cloudflares dokumentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Ingen av dessa kontroller har kunnat utföras mot Omars riktiga konto. Att en DNS-post nyligen lagts till bevisar inte att rätt Worker, zon, certifikat eller GitHub-kedja är ansluten. Misslyckad åtkomst från den begränsade arbetsmiljön är inte heller bevis för att användarens DNS är fel.

## 3. Konfigurationen som följer med

`wrangler.jsonc` anger:

- Worker `omaryusuf-se`, statiska resurser i `dist`, binding `ASSETS`.
- `omaryusuf.se` och `www.omaryusuf.se` som Custom Domains. Inga wildcards eller andra domäner.
- `workers_dev: false` och `preview_urls: false`. Offentlig förhandsvisning på en alternativ domän är inte avsedd.
- Worker-first-routing, statiska sidor och riktig 404, inte SPA-fallback till startsidan.
- `ANALYTICS_ENABLED: "false"`. En Analytics Engine-binding finns för den framtida funktionen men möjliggör inte insamling på egen hand.
- Worker Observability avstängt. Detta stänger inte automatiskt av alla separata konto-/säkerhetsloggar hos leverantören.

Worker-koden omdirigerar www och HTTP till HTTPS på apex med bibehållen sökväg och query. Okända värdnamn avvisas. HSTS gäller bara värdnamnet, inte alla subdomäner. Ändra inte zonens allmänna SSL-läge eller orelaterade tjänster som en genväg.

Testa paketet med `npm run edge:check` på en dator där Wrangler kan installeras. Verktyget är pinnat till `wrangler@4.131.1`. Detta är en validering utan publicering, inte ett bevis för att DNS eller kontobehörigheter är klara.

## 4. Koppla GitHub till Cloudflare med testgrind

Den medföljande kopplingen använder GitHub Actions för att undvika två konkurrerande automatpubliceringar. Aktivera inte också en separat, ogranskad Workers Builds-kedja som publicerar förbi testerna.

Skapa ett GitHub Environment med namnet `production`, helst med obligatoriskt manuellt godkännande åtminstone vid första publiceringen. Lägg följande hemligheter där:

| Hemlighet | Innehåll |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Det verifierade kontots ID |
| `CLOUDFLARE_API_TOKEN` | En begränsad token för det berörda kontot och de Worker-/domänåtgärder publiceringen kräver |

Använd minsta nödvändiga behörighet. Be inte någon lägga en global API-nyckel eller token i källkoden. Kontots faktiska krav måste verifieras vid första auktoriserade anslutningen. Ingen token har skapats eller hämtats i denna leverans.

Sätt repository variable `DEPLOY_ENABLED=true` **först när** DNS-/innehållsgenomgången är klar och `verify` passerar i den riktiga CI-miljön. Deploy-jobbet kräver dessutom main, ett icke-PR-event och det godkända `production`-miljöns åtkomst. Ett godkänt lokalt testresultat öppnar inte denna grind.

Första domänkopplingen kan kräva att en krock med en befintlig tjänst löses. Godkänn inte en ersättning utan att kontrollera den gamla tjänsten. Domän- och certifikatprovisionering måste hinna bli klar före produktionsgodkännande. Workflowen kör en efterkontroll; en tillfällig provisioneringsfördröjning kan göra den röd även om uppladdningen lyckades. Kontrollera båda tillstånden separat.

## 5. Statistik aktiveras separat

Behåll `ANALYTICS_ENABLED` som `"false"` tills Omar har godkänt en fungerande privat kontaktväg för integritetsfrågor och kontots faktiska hostingavtal, säkerhetsloggar, överföringar, lagring och kostnads-/missbruksskydd har granskats. Uppdatera policytexterna till det verkliga driftsläget innan aktivering.

Därefter kan en granskad kodändring sätta flaggan till `"true"`. Testa då att `/api/config` visar tillgänglighet, att bannern visas utan automatiskt samtycke, att ett ja möjliggör händelser och att ett nej stoppar nya anrop. Prova också återkallat samtycke, blockerade kakor, GPC och Do Not Track i en riktig webbläsare.

Tillåtna data är endast `{event, page}`. Händelser: `page_view`, `joy`, `bubble_complete`, `project_open`. Klienten räknar varje typ högst en gång per sidladdning. Det är inte besökarstatistik, försäljning eller en räkning av alla knapptryck. Servern lagrar fasta sidvägar/händelser, värdet 1 och ett gemensamt index `site`; tjänsten tillför tidpunkt. [Analytics Engines dokumenterade lagringstid är tre månader](https://developers.cloudflare.com/analytics/analytics-engine/limits/). [Prisvillkor](https://developers.cloudflare.com/analytics/analytics-engine/pricing/) måste kontrolleras för det aktuella kontot.

Origin- och payloadkontroller stoppar felaktiga webbläsaranrop men är inte bot-autentisering: en icke-webbläsarklient kan imitera headers. Därför ska frivillig statistik inte beskrivas som manipulationssäker. Ingen användaridentifierare eller permanent IP-lagring har lagts till för att försöka lösa det problemet. Statistik är inte aktiverad förrän driftsägaren gjort ett lämpligt val om kostnads- och missbruksskydd.

## 6. Godkänn verklig drift

När publicering och certifikat är klara:

```sh
node scripts/smoke-live.mjs
```

Scriptet kontrollerar de riktiga sidornas HTTP-status, resurser för sökmotorer, anpassad 404 och www-omdirigering. Det får inte rapporteras som passerat innan det har körts. Följ upp med verklig webbläsarnavigering på domänen, Console/Network, samtycke, PNG-sparning/delning, mobil och tangentbord. Kontrollera att CSS/moduler laddas under den verkliga CSP:n och att inga oavsiktliga analysverktyg injiceras från kontot.

Mät därefter faktisk mobilprestanda och kontrollera strukturdata/social delningsbild med externa validerare. Lokala gzip-storlekar är inte Lighthouse-resultat eller Core Web Vitals.

## Återställning

Spara den befintliga konfigurationen före första domänändringen. Vid senare kodproblem: återgå till en tidigare granskad commit och publicera den genom samma grind, eller använd den verifierade Cloudflare-versionens återställningsfunktion. Koden här innehåller ingen automatisk DNS-radering eller destruktiv kontoåterställning.
