# Vinstmaskinen: djup och material

Endast vinstmaskinens presentation är ändrad. Effekten är CSS-baserad 2,5D med perspektiv, inte en WebGL-modell. Inga bibliotek, externa bilder, nätverksanrop eller JavaScript har lagts till.

Höljet har fått en synlig sidovägg, ventilationsspår, en skarv och gummifötter. Skärmen har en infälld ram och glasreflexer. Knapp, instrument, metallreglage och spak har separata material, ljuskanter och kontaktskuggor. Ansiktet får plats innanför glaset även på smala skärmar. Mobilvyn reserverar utrymme för fötter och skugga.

## Filer

Produktionsändringarna finns i `src/styles/toys.css` och `src/templates/components.mjs`. Malländringen består av tre dekorativa, `aria-hidden`-markerade element. Befintlig JavaScript-kod, skämt, ögonföljning, kvitto, utskriftsanimation och övriga sidor är oförändrade.

`tests/machine_depth.py` är det manuella maskintestet. `tests/assets.test.mjs` ger startsidan och verkstadssidan en CSS-budget på 18 400 byte efter gzip för materiallagren. Gränsen på 14 000 byte gäller alla andra sidor.

## Kör lokalt

Med Node.js 24 eller senare och beroenden enligt [README.md](../README.md):

```sh
npm run dev
```

Öppna adressen som servern skriver ut. `npm run dev` bygger före serverstart. Ett separat produktionsbygge skapas med `npm run build`; `dist/` och `.generated/` ignoreras av Git.

## Verifiering

```sh
npm run check &&
python tests/machine_depth.py
```

Aktivera Python-miljön och installera Chromium enligt [QA-guiden](QA.md). Vid en separat körning av Python-kommandona måste `npm run build` köras först.

Maskintestet omfattar startsidan och verkstaden vid 320, 390, 768, 1 024, 1 440 och 1 920 pixlar. Det kontrollerar perspektiv, dekorativa element, horisontell överrinning, tangentbordsutskrift, kvitto, återställt fokus, ögonföljning, normal rörelse, reducerad rörelse och presentation utan JavaScript.

Maskintestet använder Chromium med projektets `render_support.py`: verklig byggd HTML, CSS och klientkod, men testadaptrar för ursprung, nätverk och kakor. Detta är lokal renderings- och komponentverifiering. HTTP/CSP och övriga browserflöden verifieras separat enligt [QA-guiden](QA.md).
