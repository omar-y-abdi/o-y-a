# Vinstmaskinen: djup och material

Endast vinstmaskinens presentation är ändrad. Effekten är CSS-baserad 2,5D med perspektiv, inte en WebGL-modell. Inga bibliotek, externa bilder, nätverksanrop eller JavaScript har lagts till.

Höljet har fått en synlig sidovägg, ventilationsspår, en skarv och gummifötter. Skärmen har en infälld ram och glasreflexer. Knapp, instrument, metallreglage och spak har separata material, ljuskanter och kontaktskuggor. Ansiktet får plats innanför glaset även på smala skärmar. Mobilvyn reserverar utrymme för fötter och skugga.

## Filer

Produktionsändringarna finns i `src/styles/toys.css` och `src/templates/components.mjs`. Malländringen består av tre dekorativa, `aria-hidden`-markerade element. Befintlig JavaScript-kod, skämt, ögonföljning, kvitto, utskriftsanimation och övriga sidor är oförändrade.

`tests/machine_depth.py` är ett nytt test för maskinen. `tests/assets.test.mjs` ger enbart startsidan och verkstadssidan ytterligare 3 000 byte CSS-budget efter gzip, för de nya materiallagren. Den ursprungliga CSS-gränsen på 14 000 byte gäller fortfarande alla andra sidor. JavaScript-budgeten är oförändrad.

Efter ombyggnad ökar startsidans CSS från 12 847 till 15 688 byte gzip och verkstadssidans från 13 178 till 16 053 byte. Storlekarna jämför samma byggskript före och efter ändringen, inte den äldre förbyggda `dist`-mappen i originalarkivet.

## Kör lokalt

Med Node.js 22 eller senare:

```sh
npm run dev
```

Öppna adressen som servern skriver ut. Ett produktionsbygge skapas med `npm run build`. Projektarkivet innehåller även en ombyggd `dist`-mapp. Arkivet med enbart ändrade filer måste läggas över originalprojektet och byggas om.

## Verifiering

```sh
npm run check
python tests/machine_depth.py
python tests/browser.py --render-only
```

Bygge, syntaxkontroll och samtliga 57 Node-tester passerade. Maskinens 14 kontroller passerade, liksom den befintliga webbläsarsvitens 89 kontroller.

Maskintestet omfattar startsidan och verkstaden vid 320, 390, 768, 1 024, 1 440 och 1 920 pixlar. Det kontrollerar perspektiv, dekorativa element, horisontell överrinning, tangentbordsutskrift, kvitto, återställt fokus, ögonföljning, normal rörelse, reducerad rörelse och presentation utan JavaScript.

Alla klientmoduler är byte-identiska med originalet. De tio genererade HTML-sidor som inte innehåller vinstmaskinen är också byte-identiska efter samma ombyggnad.

Webbläsartesterna och skärmbilderna använder Chromium med projektets befintliga `render_support.py`: verklig byggd HTML, CSS och klientkod, men testadaptrar för ursprung, nätverk och kakor. Miljön blockerar vanlig URL-navigering. Detta är därför lokal renderings- och komponentverifiering, inte ett HTTP/CSP-test, ett Safari-test eller en live-deploy.
