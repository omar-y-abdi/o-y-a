# Aktivera kontaktmejl i den befintliga Workern

Formulär, API, mejlmallar och GIF finns i revisionen. Kontots nycklar följer inte med. Ingen riktig sändning har gjorts i utvecklingsmiljön.

## 1. Behåll rätt applikation

Worker-namnet i den godkända basversionen är `omar-portfolio`. Kontrollera att det är din befintliga applikation innan du lägger till hemligheter eller publicerar. Ändra inte DNS, MX eller andra appar för denna koduppdatering.

## 2. Skapa en Turnstile-widget

Skapa en managed Turnstile-widget för `omaryusuf.se` i ditt Cloudflare-konto. Spara dess site key och secret key. Klienten använder action `contact`; servern kontrollerar både denna action och exakt värdnamn.

Site key är offentlig till sin natur, men lagras här på serversidan och lämnas ut av `/api/contact/config` först när funktionen är konfigurerad. Secret key lämnar aldrig servern. Tillåt bara relevanta domäner i widgeten.

## 3. Resend och mottagare

Den kontrollerade Resend-domänen `hej.omaryusuf.se` var verifierad för sändning den 12 september 2026. Öppnings- och klickspårning var avstängda. Inkommande mejl var avstängt. Detta är ett kontostatusprov, inte ett leveranstest av revisionen.

Skapa en Resend-nyckel med begränsad sändbehörighet för den avsedda domänen. Håll spårningen avstängd. Avsändaren är fast i servermallen: `Omar Yusuf <hej@hej.omaryusuf.se>`.

Lägg in din privata mottagaradress som **`CONTACT_TO`**. Den ska inte skrivas i publika filer, klientkod, mottagningskvittot eller en versionshanterad konfiguration.

Från projektmappen, efter att Wrangler är autentiserat mot rätt konto:

```sh
npx --yes wrangler@4.131.1 secret put RESEND_API_KEY
npx --yes wrangler@4.131.1 secret put CONTACT_TO
npx --yes wrangler@4.131.1 secret put TURNSTILE_SITE_KEY
npx --yes wrangler@4.131.1 secret put TURNSTILE_SECRET_KEY
npx --yes wrangler@4.131.1 secret put CONTACT_HASH_SECRET
```

Varje kommando frågar efter värdet. Lägg aldrig värdena som kommandoradsargument, i chatten eller i ZIP-filen. För `CONTACT_HASH_SECRET`, skapa ett slumpvärde lokalt och klistra in det vid den sista prompten:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Detta värde används för HMAC av hastighetsnycklar och idempotens, inte för besökarspårning. Spara samma värde mellan normala publiceringar så att identiska omsändningar behåller sin nyckel.

`wrangler.jsonc` innehåller redan en `CONTACT_RATE_LIMIT`-binding med fem försök per minut. Servern prövar separata HMAC-nycklar för IP-adress och destination. Bindingen är Cloudflares distribuerade hastighetsbegränsning, inte en garanterad global spärr mot all spam. Ändra inte namespace till ett som används av en annan funktion.

## 4. Publicera på din vanliga väg

Behåll din befintliga repo-/Cloudflare-koppling. Byggkommandot är `npm run build`; statiska filer ligger i `dist/` och Workern i `src/worker.mjs`. Om du använder Wrangler direkt:

```sh
npm run edge:check
npm run deploy
```

`edge:check` gör en dry-run utan publicering. Den nya kontaktfunktionen behöver Workern och dess bindings: en uppladdning av enbart statiska filer till en annan hostingtjänst aktiverar inte API:t.

Kontrollera att `/api/contact/config` svarar med `enabled: true` och en site key, utan andra konfigurationsvärden. Detta bevisar bara konfigurationsnärvaro, inte att nycklarna är korrekta eller att mejl kan levereras.

## 5. Gör ett eget riktigt leveranstest

Öppna kontaktkuvertet på den publicerade HTTPS-adressen, fyll i ditt namn och en mejladress du själv kontrollerar. Börja utan meddelande. Kontrollera att:

1. Turnstile godkänns och formuläret visar en bekräftelse först efter lyckat API-svar.
2. Det interna mejlet kommer till `CONTACT_TO`, med besökarens uppgifter och rätt Reply-To.
3. Besökaren får det separata kvittot. Inga interna mottagaruppgifter finns i dess kropp eller headers.
4. GIF-figuren laddas från `https://omaryusuf.se/mail/omar-smile.gif`. Om bilder blockeras finns läsbara rubriker, text och alternativtext kvar.
5. Ett avsiktligt fel lämnar formulärets text kvar och visar inte framgång. Undvik verkliga testsändningar till andra personer.

Resend accepterar ett lyckat batchanrop innan den faktiska SMTP-leveransen är avslutad. Kontrollera därför också leveransstatus och eventuella studsar i Resend. Logga inte meddelandenas innehåll eller nycklar i offentliga felrapporter.

## Svar och avatar

Det interna mejlet har besökarens adress som Reply-To, så Omar kan svara direkt på aviseringen. Besökarens automatiska kvitto anger att det inte tar emot svar och länkar till postluckan. Detta undviker både en oanvändbar dold svarsväg och att den privata mottagaren röjs, eftersom avsändardomänens inkommande mejl inte är aktiverat.

GIF-filen är färdig och används inne i kvittot. En avsändarbild i Gmail, Outlook eller andra inkorgars meddelandelistor är separat från HTML-mejlet. Ingen universell GIF-avatar kan ställas in genom Resend-mallen. Resends [avatarvägledning](https://resend.com/docs/knowledge-base/how-do-i-send-with-an-avatar) beskriver leverantörernas olika alternativ.

## Säkerhets- och integritetsbeslut

API:t accepterar bara samma origin, JSON, begränsad kroppsstorlek, tillåtna fält, giltiga kontaktuppgifter och ett serververifierat Turnstile-svar. Samma försök får en HMAC-baserad idempotensnyckel hos Resend. Inget vanligt inmatningsfel eller leverantörsfel ger ett låtsat lyckat utskick.

Läs också [integritetsbesluten](revision/PRIVACY-DECISIONS.md). Verkliga leverantörsavtal, eventuell överföring, kontologgar, mottagarbrevlådans hantering och gallring behöver motsvara policyn. Detta paket är inte en juridisk certifiering.
