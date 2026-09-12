# Underlag och proveniens

Kontrollerat under arbetet den 11 september 2026. Offentliga projektdokument är ägarens beskrivning, inte en oberoende verifiering av samtliga produktpåståenden.

## Personen och innehållet

Användaren angav namnet **Omar Yusuf**, rollen maskiningenjör, domänen och önskemålet om en glad, omsorgsfull personlig webbplats. Det anslutna GitHub-kontot verifierades som `omar-y-abdi`.

- [Offentlig GitHub-profil](https://github.com/omar-y-abdi)
- [Profilens README](https://github.com/omar-y-abdi/omar-y-abdi/blob/main/README.md): underlag för intressen inom kod, automation/mekatronik och R&B, soul och jazz. Privata kontaktuppgifter och spekulativa examina har inte publicerats.
- [Furls README](https://github.com/omar-y-abdi/furl-ctx/blob/main/README.md): reversibel kontextkomprimering och senare åtkomst till original. Inga benchmarkprocent eller oberoende prestandalöften har kopierats till webbplatsen. Den lilla vikillustrationen är uttryckligen inte ett benchmark eller en körning av Furl.

Revisionen använder även användarens uttryckligen godkända beskrivningar av Blade & Blend och Backhaul, med README-filerna från KNC-STUDIO och einride-backhaul som tekniskt underlag. Inget privat repo eller databasens kundinnehåll publiceras. Glädjeverkstaden är byggd för den här webbplatsen, inte presenterad som ett externt kunduppdrag.

## Tekniska och integritetsrelaterade primärkällor

- [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare statiska sidor och 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Analytics Engine: komma igång](https://developers.cloudflare.com/analytics/analytics-engine/get-started/)
- [Analytics Engine: gränser och lagringstid](https://developers.cloudflare.com/analytics/analytics-engine/limits/)
- [Analytics Engine: priser](https://developers.cloudflare.com/analytics/analytics-engine/pricing/)
- [PTS: kakor](https://pts.se/internet-och-telefoni/kakor-cookies/)
- [IMY: rättigheter och radering](https://www.imy.se/privatperson/dataskydd/dina-rattigheter/radering/)

Publiceringsguiden skiljer kontrollerbar implementation från kontospecifika inställningar. Inget kontoavtal, ingen verklig DNS-zon och ingen full juridisk efterlevnad har verifierats genom dessa allmänna dokument.

## Pinnade verktyg

GitHub-connectorns läsning av officiella release-/Git-referenser gav:

| Verktyg | Verifierad referens |
| --- | --- |
| actions/checkout | v7.0.1, `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.0.0, `820762786026740c76f36085b0efc47a31fe5020` |
| Wrangler | `wrangler@4.131.1`, officiell release publicerad 2026-09-11 |

Detta var versionsunderlag i den tidigare utvecklingen. Ingen workflow finns i den godkända bas-ZIP:en eller har lagts till i revisionen. Playwright 1.57.0 var installerad i arbetsmiljön och är pinnad i `requirements-test.txt`; Chromium-versionen i den lokala granskningen finns i `ENVIRONMENT.json`.

## Visuellt material

Maskinen, symbolerna, vikningen och personkortets arbetsbänk är egen CSS/SVG-utformning i koden. Socialbilden bygger på samma formspråk och maskin. Kortbilder skapas av webbplatsens egen canvas-kod. Ingen av de tidigare genererade portfolio-mockuperna, deras porträtt eller deras påhittade projekt används. Inga typsnittsfiler har lagts i leveransen.

## Uttryckliga uppgifter i revisionsbeställningen

Omar anger avslutad B.Sc. som maskiningenjör, pågående civilingenjörsutbildning vid Chalmers inom Automation and Mechatronics med M.Sc. Systems, Learning and Control, samt deltidsarbete med AI-dataannotering hos Rebl Industries genom Chalmers Teknologbolag. Webbplatsen presenterar inte den pågående utbildningen som avslutad. Uppgifterna är användarens egna, inte verifierade genom lärosätets register.

Blade & Blend beskrivs som solo-utvecklad fullstackwebbplats för en barbershop i Göteborg. Privat README verifierade arkitekturens Preact, TypeScript, Supabase, Cloudflare, bokningar och transaktionsmejl. Backhauls README verifierade SSEN National Hackathon, Einride Track 2026 och prototypens funktion. Inga intäkts-/klimatpåståenden eller produktionsintegrationer hämtas från pitchmaterial.

Kontrollerade exempel på sammanslagna bidrag: [Ruff #26419](https://github.com/astral-sh/ruff/pull/26419), [Payload #16120](https://github.com/payloadcms/payload/pull/16120), [ccusage #889](https://github.com/ccusage/ccusage/pull/889).

Resend-domänens sändstatus och spårningsinställningar lästes genom den anslutna tjänsten. Inga kontonycklar kopierades. Kontakt- och integritetsreferenser finns i [revision/PRIVACY-DECISIONS.md](revision/PRIVACY-DECISIONS.md).
