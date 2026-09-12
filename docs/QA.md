# Verifiering av den korrigerade o-y-a-revisionen

Datum: **12 september 2026**. Underlag: användarens godkända `o-y-a.zip`, inte den alternativa webbplatsen från tidigare svar. ZIP-filens SHA-256 och lokal basreferens finns i `ENVIRONMENT.json`.

## Leveransstatus

Källkod, byggda sidor, korrigeringar, fyra lekstationer, kontaktserver, mejlmallar och animerad figur ingår. Ingen publicering, GitHub-skrivning, DNS-ändring eller riktig mejlsändning har genomförts. Den befintliga Workern heter fortfarande `omar-portfolio`. Kontaktmejl behöver de privata servervärdena enligt `CONTACT-SETUP.md`.

## Körda kontroller

| Kontroll | Utfall | Avgränsning |
| --- | --- | --- |
| Bygge, syntax och Node-tester | 56 godkända, inga misslyckade eller överhoppade | Renderad HTML, metadata, interna resurser, logik, Worker, mejl och kontaktgränser |
| Riktiga lokala HTTP-anrop | 19 godkända | Samma Worker-handler, med en Node-baserad ASSETS-adapter, inte workerd |
| Sid- och breddkombinationer | 74 godkända | 12 sidor vid 6 bredder samt 2 fall utan program-JavaScript |
| Ursprungliga interaktionsfall | 9 godkända | Maskin, kortlänkar, canvas, bubblor, meny, fokus, rörelse |
| Samtyckesfall | 6 godkända | Ja/nej, återkallelse, blockerad lagring, GPC och DNT |
| Nya regressionsfall | 20 godkända | Verklig scrollposition, kort, utskrift, formulär, tempo, memory och fika |
| Kortbilder | 240 godkända | Varje riktig canvas-PNG och dess mobila kvittobredd kontrollerad |
| Avgränsad kontrastkontroll | 488 textnoder, inga underskridna gränser | Beräknad kontrast på enkla bakgrunder; inte en full WCAG-granskning |
| Mejllayout | 4 godkända | Två mallar i 360 och 680 px; Chromium-rendering, inte mejlklienttest |

Browsergrupperna ovan omfattar tillsammans 109 renderade testfall. Rapporterna anger sina adaptrar; dessa fall betecknas inte som full nätverks-E2E. JSON-resultat, sista körningarnas loggar och skärmbilder finns i det separata verifieringsarkivet.

## De uttryckligen begärda rättningarna

**Personkortet:** den lutande pappersformen, färgerna, namnet och klisterlappen finns kvar. Det stora OY-monogrammet finns inte i HTML eller CSS. Arbetsbänken med laptop, verktyg och kaffe har granskats i mobil- och datorvy.

**Upp igen:** testet börjar långt ned på sidan, klickar den riktiga knappen och väntar på faktisk `scrollY === 0`. Det passerar vid 320, 390, 768 och 1440 px, både med vanlig och minskad rörelse. Ett separat fall med bara den inbyggda ankarlänken och utan applikationens JavaScript når också noll. Det här kontrollerar position, inte bara att en klickhanterare anropats.

**Kontakt:** kuvertet har en egen rubrik, ”Inga frimärken behövs.” Den tidigare upprepningen av inledningen, den privata adressen och spamförklaringen som löptext är borttagna. Den fullständiga förklaringen finns i integritetspolicyn. En kort policylänk finns vid formuläret. Namn och mejl krävs; tomt meddelande accepteras.

**Lappar:** ingen mängdangivelse annonseras i gränssnittet. De gamla stabila kort-ID:na behålls. Varje kategori använder en blandad kortlek och töms innan den blandas om.

**Projekten:** skärmbilder visar de nya Blade & Blend- och Backhaul-korten och respektive projektsida. Texten skiljer användaruppgifter från projektens dokumentation, pågående utbildning från avslutad examen och hackathonprototyp från ett driftsatt kundsystem.

## Visuell granskning

Startsida, verkstad, om-sida, Furl, Blade & Blend, Backhaul, kontakt, integritet, kakor, villkor, tillgänglighet och 404 har granskats i mobil- och datorvy. Granskningen omfattar även öppet/stängt kontaktkuvert, lyckat simulerat svar och leveransfel, utskriftens uppmatning/förflyttning/slutläge, bubbeleffekt, färdigt memory, fikaresultat, båda mejlmallarna och GIF-figurens bildrutor.

Bilderna kommer från faktisk HTML/CSS och riktig interaktionskod, inte bildgenererade webbplatsförslag. Formulärets framgångs- och felbilder använder uttryckliga Turnstile/Resend-adaptrar och är inte bevis på verkliga utskick.

Chromiums helsidesskärmbilder kunde visa en fixerad, i verkligheten utanför skärmen placerad skip-länk när dokumentet var scrollat vid fotograferingen. Dess verkliga ruta låg helt ovanför viewporten. Den slutliga fotograferingen börjar därför vid dokumentets nollpunkt och använder en dokumentbaserad beskärning. Ingen produktions-CSS ändrades för att dölja en tillgänglighetsfunktion.

## Fel som de adversariella kontrollerna fångade

Ett för lågt storlekstak kunde avvisa ett giltigt långt meddelande med flerbytesbokstäver. Taket är nu begränsat men förenligt med formulärets angivna teckenlängd. Kontroller omfattar fel typ, ogiltig UTF-8, för stor kropp, fel origin, botfält, saknad konfiguration, rate-limit, ogiltig Turnstile och ofullständigt/felaktigt Resend-svar.

Ett sent kortlekssvar efter flikbyte kunde starta utskriftsanimationen igen. Synligheten kontrolleras nu också efter att laddningen är klar. Paus och minskad rörelse färdigställer kvittot utan att låsa gränssnittet. Memory-reset under väntande felpar och en bakgrundsavbruten fikamätning har egna kontroller.

Den privata mottagaren läses bara från `CONTACT_TO`. Den återfinns inte i publika byggfiler eller besökarens kvitto. Kontaktuppgifter reflekteras inte in i kvittot till en godtyckligt angiven mejladress. Inmatning i det interna mejlet HTML-escapas. Omsändning av oförändrat försök återanvänder Resends idempotensnyckel. Ett misslyckat API-svar behåller besökarens inmatning och visar inte framgång.

## Resursstorlek

Den ursprungliga testgränsen på 14 000 gzip-byte för varje sidas CSS har behållits, inte höjts. Sidberoende tillägg för spel och kontakt ligger i separata källfiler och byggs bara in där de behövs. All klient-JavaScript summerar till **13 470 gzip-byte**. Den separata kortleken är **7 356 gzip-byte** och hämtas först när maskinen används. GIF-filen är **22 646 byte**.

Det här är komprimerade filstorlekar från Node zlib, inte uppmätta laddningstider, Lighthouse-poäng eller Core Web Vitals. Per-sida- och per-resursvärden finns i `ASSET-SIZES.json`.

## Vad dessa kontroller inte bevisar

Den hanterade Chromium-installationen blockerar vanlig URL-navigering med `ERR_BLOCKED_BY_ADMINISTRATOR`. Policyn har inte ändrats. Dokumentrenderingen använder därför verkliga byggfiler och kod med tydligt avgränsade adaptrar för origin, modulladdning, nätverk, cookie-lagring och säker kontext. Riktig URL-navigering, CSP tillsammans med modulladdning, inbyggda cookie-/urklippsbehörigheter och den publicerade Cloudflare-körmiljön är inte verifierade genom det läget.

Ingen faktisk SMTP-leverans, studshantering i drift, Gmail-/Outlook-rendering eller inkorgsavatar har verifierats. GIF-filen används i mejlkroppen; den är inte en konfigurerad avsändaravatar. Resend-domänen lästes som verifierad för sändning och utan öppnings-/klickspårning, men det ersätter inte ett riktigt leveranstest efter uppladdning.

En slutlig kontroll i vanlig webbläsare på den publicerade adressen samt test till egna mejladresser återstår efter Omars uppladdning och privata konfiguration. Anvisningar finns i `DEPLOYMENT.md` och `CONTACT-SETUP.md`. Ingen fullständig juridisk efterlevnad eller tillgänglighetscertifiering påstås.
