# Aktivera kontaktmejl i den befintliga Workern

Formulär, API, mejlmallar och GIF finns i revisionen. Kontots nycklar följer inte med. Ingen riktig sändning har gjorts i utvecklingsmiljön.

## 1. Behåll rätt applikation

Worker-namnet i den godkända basversionen är `omar-portfolio`. Kontrollera att det är din befintliga applikation innan du lägger till hemligheter eller publicerar. Ändra inte DNS, MX eller andra appar för denna koduppdatering.

## 2. Skapa en Turnstile-widget

Skapa en managed Turnstile-widget för `omaryusuf.se` i ditt Cloudflare-konto. Spara dess site key och secret key. Klienten använder action `contact`; servern kontrollerar både denna action och exakt värdnamn.

Site key är offentlig till sin natur, men lagras här på serversidan och lämnas ut av `/api/contact/config` först när funktionen är konfigurerad. Secret key lämnar aldrig servern. Tillåt bara relevanta domäner i widgeten.

## 3. Resend och mottagare

Den kontrollerade Resend-domänen `hej.omaryusuf.se` var verifierad för sändning den 12 september 2026. Öppnings- och klickspårning var avstängda. Inkommande mejl var avstängt. Detta är ett kontostatusprov, inte ett leveranstest av revisionen.

Skapa en Resend-nyckel för den avsedda domänen. Begränsad sändbehörighet räcker för att skicka; status och avbryt i studion kräver en nyckel som även tillåter dessa anrop. Håll spårningen avstängd. Standardavsändaren är `Omar Yusuf <hej@hej.omaryusuf.se>`; studions mejlinställningar kan ändra visningsnamn och lokal adress inom den serverbestämda domänen `hej.omaryusuf.se`.

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

`CONTACT_HASH_SECRET` är huvudnyckeln för tre funktioner: kontaktformulärets HMAC-baserade hastighets- och idempotensnycklar, kryptering av de fyra kontaktvärden som sparas i D1 via studion, samt signerade privata bilagelänkar. Spara samma värde mellan normala publiceringar. Ett byte gör tidigare sparade värden oläsbara, ogiltigförklarar gamla bilagelänkar och ändrar kontaktformulärets idempotensnycklar. Värdet används inte för besökarspårning.

De fyra värdena kan också sparas i **Mejl → Inställningar** efter att D1-migreringarna och huvudnyckeln finns. Ett sparat D1-värde ersätter motsvarande miljövärde. Ett oläsbart sparat värde stänger funktionen; servern använder inte tyst miljövärdet som reserv. Ett uttryckligt tomt värde tar däremot bort D1-värdet och återgår till miljökonfigurationen.

`wrangler.jsonc` innehåller redan en `CONTACT_RATE_LIMIT`-binding med fem försök per minut. Servern prövar separata HMAC-nycklar för IP-adress och destination. Bindingen är Cloudflares distribuerade hastighetsbegränsning, inte en garanterad global spärr mot all spam. Ändra inte namespace till ett som används av en annan funktion.

## 4. Publicera på din vanliga väg

Vid uppgradering från bilagelänkar av formen `/mail-file/{id}/{exp}/{token}` behöver befintliga bilageutskick först avslutas eller avbrytas. Den här versionen utfärdar och accepterar endast `/mail-file/{id}/{exp}?token=…`. Äldre länkar avvisas, eftersom deras hemlighet ligger i sökvägen och inte kan döljas med query-redigering. Kontrollera schemalagda mejl och alla obekräftade utskick i Resend, även sådana som finns frysta i en öppen studioflik. Bekräfta leverans eller avbryt hos Resend innan uppgraderingen; skapa inte en ny identitet för ett utskick vars resultat fortfarande är okänt. Stäng gamla skrivflikar under övergången. Om inga sådana utskick finns, dokumentera den kontrollen i releaseunderlaget.

`wrangler.jsonc` aktiverar `observability.redact_query_string`, som enligt [Cloudflares inställningskontrakt](https://developers.cloudflare.com/api/typescript/resources/workers/subresources/scripts/subresources/settings/methods/get/) tar bort query-strängar från begäransadresser i loggar och traces. Efter publiceringen ska kontots effektiva inställning kontrolleras med en egen ofarlig test-token. Det ändrar inte historiska loggar eller andra tjänsters loggning. Dela aldrig fullständiga bilagelänkar i felrapporter.

Behåll din befintliga repo-/Cloudflare-koppling. Deploykommandot `npm run deploy:cloudflare` bygger självt före publicering. Kontrollera kontots faktiska bygg- och deploykommandon enligt [DEPLOYMENT.md](DEPLOYMENT.md); en separat byggfas i dashboarden kan annars bygga samma källor två gånger. Statiska filer skapas i `dist/` och Workern finns i `src/worker.mjs`. För manuell verifiering och publicering:

```sh
npm run edge:check &&
npm run quality &&
npm run test:cms &&
node scripts/test-footer-cms.mjs &&
node scripts/test-cms-compat.mjs &&
npm run deploy:cloudflare
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

Studions utskick har en separat beständig identitet och ett D1-register över varje försök innan Resend anropas. Ett 409-svar kan betyda att samma utskick fortfarande behandlas eller redan har accepterats med andra data; det får därför inte radera avsikten eller frigöra bilagor. En vägran får bara rensa en ny avsikt som inget annat försök har använt. Se [Resends idempotenskontrakt](https://resend.com/changelog/idempotency-keys).

## Kontrollerat byte av huvudnyckel

Nyckelbyte är ett planerat driftavbrott, inte en vanlig publicering. Koden har ingen överlappning mellan gamla och nya huvudnycklar.

1. Förvara den gamla huvudnyckeln och alla fyra aktuella kontaktvärden i ägarens säkra hemlighetsförvaring. Studion lämnar inte ut de två privata värdena i klartext; kontrollera att de kan återställas innan något ändras. Ta en D1-backup som hör till den gamla nyckeln.
2. Stoppa nya kontakt- och studiosändningar under bytet, och stäng öppna skrivflikar. Avsluta eller avbryt schemalagda bilageutskick hos Resend. Utred varje obekräftat utskick och varje fryst omsändning innan du byter nyckel; ett nytt idempotensvärde får inte användas för att försöka kringgå ett okänt tidigare resultat.
3. Lägg in den nya `CONTACT_HASH_SECRET` via Wranglers hemlighetsprompt. Befintliga sparade inställningar blir nu oläsbara och kontaktfunktionen stängs. Spara därefter samtliga fyra bevarade värden genom **Mejl → Inställningar**, så att de krypteras med den nya huvudnyckeln. En avsiktlig miljöbaserad konfiguration återställs i stället genom att uttryckligen tömma respektive D1-värde och kontrollera miljövärdet.
4. Kontrollera inställningsstatus och `/api/contact/config`. Ett godkänt konfigurationssvar bevisar inte leverans. Gör ett separat ägargodkänt leveranstest och ett nytt privat bilagetest innan sändningarna öppnas igen. Gamla bilagelänkar blir inte giltiga av att inställningarna sparas på nytt; ladda upp bilagor på nytt för nya utskick.
5. Om återställning behövs före första omsparningen, återställ den gamla huvudnyckeln. Efter att värden sparats med den nya nyckeln krävs även motsvarande D1-backup eller att alla fyra värden åter sparas under den återställda nyckeln. Byt aldrig bara nyckeln och anta att blandade ciphertext-rader går att läsa.

Om en huvudnyckel misstänks vara röjd kan omedelbar återkallelse behövas även om gamla bilageutskick då misslyckas. Den driftbedömningen och kontots verkliga utskicksstatus måste ägaren göra; koden kan inte bevisa dem från en PR-körning.

Läs också [integritetsbesluten](PRIVACY-DECISIONS.md). Verkliga leverantörsavtal, eventuell överföring, kontologgar, mottagarbrevlådans hantering och gallring behöver motsvara policyn. Detta paket är inte en juridisk certifiering.
