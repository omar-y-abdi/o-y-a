# Verifieringsrapport

**Datum: 11 september 2026. Status: lokal implementation verifierad inom nedanstående gränser. Inte publicerad och inte produktionsgodkänd.**

## Resultat som faktiskt finns

| Kontroll | Resultat | Vad det bevisar |
| --- | --- | --- |
| `npm run check` | 22 tester passerade, 0 fel; bygge och syntaxkontroll passerade | Kodlogik, statiska sidor, metadata, resurser och Worker-handler |
| `python tests/http.py` | 15 kontroller passerade, 0 fel | Riktiga lokala HTTP-svar genom Worker-handlern med Node-adapter |
| Renderade sidor | 62 scenarier passerade, 0 fel | 10 sidor vid 6 bredder samt startsidan utan JavaScript i 2 bredder |
| Renderade interaktioner | 9 scenarier passerade, 0 fel | Maskin, länkutmatning, PNG-generering, bubblor, meny, fokus och rörelse |
| Renderat samtycke | 6 scenarier passerade, 0 fel | Ja/nej, återkallelse, lagringsfel, GPC och Do Not Track med uttryckliga adaptrar |
| Kontrastkontroll | 362 textnoder kontrollerade, 0 under gränsen i det undersökta urvalet | Beräknad textkontrast mot enkla bakgrunder, inte en fullständig WCAG-granskning |
| Kortbilder | Alla 18 kontrollerade | Riktiga canvas-PNG-filer, textramar inom bilden och mobilkvittots bredd |

De tre renderingssviterna innehåller tillsammans **77 scenarier**. De avslutades separat för att hålla varje körning inom verktygets exekveringsgräns. En tidigare kombinerad körning avbröts av exekveringsgränsen; den räknas inte som ett passerat testresultat.

JSON-rapporter och loggar finns i det separata granskningspaketet. Negativa regressionstestloggar är avsiktliga bevis på fel före rättning, inte fel i slutresultatet.

## Avgörande begränsning: rendering är inte full E2E

Den installerade Chromium-webbläsaren har en hanterad `URLBlocklist=*`. Ett riktigt navigeringsförsök till lokal HTTP gav `ERR_BLOCKED_BY_ADMINISTRATOR`. Policyn har inte ändrats.

Den genomförda visuella granskningen använder därför byggd HTML och riktig CSS som ett renderat dokument i webbläsaren. Interaktionskoden kommer från källans verkliga moduler, men importsättet, sidans origin, kakor och nätverksanrop anpassas uttryckligen av `tests/render_support.py`. Verklig layout, DOM, tangentbord, canvas och animationer körs. Detta bevisar **inte** vanlig URL-navigering, riktiga modulanrop under produktions-CSP eller native cookie-/clipboardbeteende.

De separata HTTP-testerna använder riktiga HTTP-förfrågningar och samma Worker-handler. Däremot är `ASSETS` en Node-adapter, inte Cloudflares workerd. Fullt webbläsarläge finns i testerna och i CI, men har inte passerat här. Save-dialogen och den verkliga systemurklippsbehörigheten är också separata webbläsargrindar; PNG-bytes och den manuella kopieringsvägen är verifierade.

## Visuell granskning

Hela startsidan, verkstaden, om-sidan, Furl, kontakt, integritet, kakor, villkor, tillgänglighet och 404 har granskats visuellt i **1440 px och 390 px**. Granskningen omfattade sidhuvud, innehåll, radbrytningar, mellanrum, knappar och sidfot. Automatiska breddkontroller kördes dessutom vid 320, 768, 1024 och 1920 px utan horisontellt sidöverflöde.

Även öppet kvitto, samtliga kortkategorier, alla 18 exporterade kort, bubblor efter klick, mobilmeny, datavalsdialog, samtyckesbanner, kopieringsfallback, vikt Furl-illustration och socialbild har granskats. Bilderna kommer från den kodade webbplatsen, inte de tidigare genererade portfolio-mockuperna. Samtyckesbannerns skärmbild visar det uttryckliga testläget där statistik är tillgänglig, inte en aktiverad produktionsinstallation.

Ingen allmän garanti om att alla människor tycker om designen eller blir glada ges. Målet har omsatts i egen interaktion och visuell utformning, inte i fabricerade omdömen eller ett påstående om en säkerställd känslomässig effekt.

## Fel som hittades och rättades

**Mobilknappar:** en kort hälsningsknapp bröts till en trång två-radig kapsel, och en om-sida-knapp pressades ihop. Korta knappar fick korrekta brytningsregler, mobilheadern använder menyn för kontaktlänken och om-sidans avslutande layout bryts på rätt ställe. Regressionen testar knappgeometrin.

**Återkallat samtycke:** om ett gammalt allow-värde inte gick att skriva över kunde en kontroll som enbart läste kakan åter tillåta statistik. En omedelbar spärr i den öppna sidans minne infördes före lagringsförsöket. Pågående anrop avbryts och nya stoppas. Misslyckad sparning förklaras sanningsenligt. Regressionen behåller det gamla allow-värdet och gör skrivningen verkningslös.

**Statistik vid oavsiktlig provisionering:** en binding ensam kunde annars göra funktionen tillgänglig. Server och konfiguration kräver nu också `ANALYTICS_ENABLED === 'true'`. Levererad flagga är `false`. Ett negativt test visade först felet och passerar efter rättning.

**404-status som doldes av lokal adapter:** den lokala adaptern satte först själv 404 på den explicita filen `/404.html`. Det kunde dölja att Worker-handlern skulle lämna status 200 om en annan assets-tjänst serverade filen så. Ett nytt test matade in en sådan 200-respons och föll med `200 !== 404`. Statusansvaret ligger nu i Worker-koden; befintliga 503-fel omvandlas inte felaktigt till 404. Den lokala specialregeln togs bort.

**HEAD i lokalservern:** ett svar utan kropp fick felaktigt `Content-Length: 0`, trots att GET-versionen hade innehåll. Ett verkligt HTTP-test reproducerade skillnaden. Lokalservern utelämnar nu den beräknade längden vid HEAD i stället för att ange ett falskt värde. Kontrollen ingår i samtliga vanliga sidors HTTP-test.

## Kravgenomgång

| Krav | Lokal implementation och kvarvarande gräns |
| --- | --- |
| Personlig, lekfull webbplats utan blogg | Egen maskin, kvitton, bubbellek, monogram och konsekvent formgivning. Inga bloggsektioner. |
| Korrekt sidkälla, titlar, beskrivningar, canonical och en h1 | Finns i genererad HTML och kontrolleras automatiskt. Ingen klientrenderad tom skal-sida. |
| sitemap.xml, robots.txt och llms.txt | Byggs från samma sidregister. 9 indexerbara URL:er. 404 undantas. llms.txt innebär ingen garanti om AI-indexering. |
| Interna länkar och brödsmulor | Länkmål och fragment verifieras. Brödsmulor finns på undersidor. |
| Strukturerade data | Person, WebSite, sidtyp och relevanta BreadcrumbList. Ingen påhittad LocalBusiness. Extern rich-results-validering återstår. |
| Social delning och ikoner | Egen 1200 × 630 PNG, favicon och appikon. Metataggar finns; riktiga sociala plattformars cache/rendering är inte provad. |
| Alt-text | Inga vanliga innehållsfoton i sidkroppen. Dekorativ CSS/SVG är dold för hjälpmedel. Socialbild har beskrivande metadata. |
| Tillgänglighet | Semantik, fokus, tangentbord, radiofält, native dialog, minskad rörelse och no-JS-fallback kontrollerade. Ingen skärmläsar-/WCAG-certifiering. |
| Konsolfel | Inga fel registrerade i de passerade renderade scenarierna. Produktionens Console/Network måste granskas efter publicering. |
| Inga produktions-source maps | Bygget producerar inga maps; sökvägar för maps blockeras också i Worker-koden. |
| Små JavaScript-resurser och egen sidtitel | Fyra små native-moduler, inget React/Vite-runtime, inga standardtitlar eller externa typsnitt. |
| Villkor och cookie-/integritetspolicy | Sidorna finns och beskriver kodens beteende. Faktiska kontovillkor, tekniska loggar och privat kontaktväg kräver ägarens genomgång före lansering. |
| Samtycke och dataminimering | Implementerat och adversarialt testat med tydligt avgränsade adaptrar. Statistik avstängd i driftskonfigurationen. |
| Analytics tracking | Klient, strikt API och Engine-binding finns. Ingen riktig insamling eller dashboardsession har aktiverats eller verifierats. |
| Formulär och externa embeds | Inga falska kontakt-/nyhetsbrevsformulär eller externa embeds. Befintliga radioval och kopieringsfält har etiketter och tangentbordsstöd. |
| Inga ogrundade påståenden | Endast användarens egna uppgifter och lästa offentliga projektunderlag. Inga benchmarkprocent, kundresultat, adressuppgifter eller låtsasporträtt. |
| GitHub, Cloudflare och omaryusuf.se | Konfiguration och workflow skrivna. Repo, kontokoppling, DNS, TLS, CI och publicerad webbplats är inte utförda/verifierade. |

## Resursstorlekar

Mätt på de slutligt byggda filerna med Nodes `gzipSync`:

| Resurs | Byte efter gzip |
| --- | ---: |
| Alla fyra JavaScript-moduler tillsammans | 7 896 |
| CSS | 12 118 |
| Startsida HTML | 5 415 |

Detta är filstorlekar efter lokal komprimering, inte faktiska nätverksmätningar, ett Lighthouse-betyg eller Core Web Vitals. Ingen mätning av verklig mobil LCP/INP/CLS på omaryusuf.se har gjorts. Kontrastkontrollen hoppar uttryckligen över dekorativ text, inaktiva kontroller, komplexa gradienter och element med varierande opacitet.

## Kvar före produktionsgodkännande

Riktig GitHub-skrivåtkomst och Cloudflare-kontoåtkomst behövs. Därefter ska det förberedda CI-flödet och Wrangler dry-run köras, DNS/domänkollisioner läsas, TLS verifieras och samtliga viktiga flöden provas genom verklig URL-navigering på den publicerade domänen. Policytexter och privat kontaktväg ska matcha verklig drift. Statistik förblir avstängd tills den separata aktiveringsgrinden är godkänd.

En lokal Git-commit eller ett visuellt snyggt testdokument ersätter inte dessa produktionsbevis.
