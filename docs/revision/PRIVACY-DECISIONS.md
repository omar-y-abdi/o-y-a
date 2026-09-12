# Kontaktfunktionens integritetsbeslut

Detta är dokumenterade produktbeslut och en avgränsad bedömning, inte ett juridiskt godkännande av driftkontot.

## Ändamål och nödvändighet

En besökare väljer själv att kontakta Omar. Namn och mejladress behövs för att hantera och besvara kontakten. Fritext är valfri. Uppgifterna skickas till den privata mottagarbrevlådan och Resend skickar ett separat mottagningskvitto till besökaren. De används inte här för nyhetsbrev, annonsering, profilering eller publik innehållspublicering.

Kontaktpolicyn anger berättigat intresse för att ta emot och besvara en uttryckligen initierad kontakt, samt för proportionerligt spamskydd. Intresset är ett fungerande kontaktsätt. Intrånget begränsas av minimala fält, ingen frivillig marknadsföring, ingen publicerad mottagaradress och ingen lagring av meddelanden i en separat webbdatabas. Detta måste fortfarande stämma med den verkliga användningen. Ett nytt ändamål kräver en ny bedömning.

## Leverantörer och skydd

Cloudflare levererar sidan och Turnstile. Kontrollen laddas först när kuvertet öppnas och kan behandla nätverks-/enhetsuppgifter. Servern verifierar token, origin, värdnamn och action. Hashade hastighetsnycklar är HMAC, inte en garanti för anonymitet. Kontolagring och loggar måste granskas separat.

Resend skickar transaktionsmejlen. Domänprovet visade avstängd öppnings-/klickspårning och sändregion EU-west-1. Detta är inte ett löfte om att alla underleverantörer och all behandling sker enbart inom EU. Omar behöver granska sina personuppgiftsbiträdesavtal och tillämpliga överföringsskydd hos hosting-, mail- och brevlådeleverantörerna.

Resends idempotensnycklar gäller 24 timmar enligt dokumentationen. Applikationen återanvänder samma nyckel när samma formulärförsök skickas om; detta skyddar inte mot alla nya, avsiktliga inlämningar. Hastighetsbegränsning och Turnstile är kompletterande skydd, inte ett löfte om noll spam.

## Gallring och rättigheter

Meddelanden finns i mottagarens brevlåda och leverantörernas nödvändiga leveranshantering, inte i en webbplatsdatabas. Policyn säger att kontaktuppgifter sparas medan dialogen och relevant uppföljning kräver det. Ingen automatisk gallring av privata brevlådor eller Resend-loggar har införts eller påstås finnas. Omar behöver tillämpa denna gallring i sin riktiga brevlåda och kontrollera leverantörernas retention.

Integritetsfrågor kan skickas genom kontaktformuläret. Tillgång, rättelse, radering och andra tillämpliga rättigheter beskrivs i policyn. Länken vid formuläret leder till informationen, utan att lägga det tekniska integritetsstycket mitt i sidans kreativa introduktion.

## Primärkällor kontrollerade för revisionen

- [IMY: intresseavvägning](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/intresseavvagning/)
- [Cloudflare: serververifiera Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare: Worker rate limits](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Resend: idempotens](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend: batchsändning](https://resend.com/docs/api-reference/emails/send-batch-emails)
