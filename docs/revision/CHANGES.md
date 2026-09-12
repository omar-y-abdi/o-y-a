# Ändringar mot den godkända o-y-a.zip

## Form och innehåll

Originalets färger, hero, navigation, grundtypografi och lutande personkort behålls. Bara det stora OY-monogrammet byts ut mot en liten arbetsbänk med laptop, verktyg och kaffekopp. Inga porträtt eller alternativa designförslag från andra leveranser används.

Kontaktkuvertet säger ”Inga frimärken behövs.” och upprepar inte sidans inledning. När kuvertet öppnas ersätts dess rubrik av en enkel stängfunktion. Privat mottagaradress förekommer inte i webbplatsen, dess byggda resurser eller kvittot till besökaren. Spamförklaringen finns i integritetspolicyn, nåbar genom en kort länk vid formuläret. Ingen mängdangivelse för lapparna läggs i användargränssnittet.

Startsidan har riktiga projektkort för Blade & Blend och Backhaul med egna undersidor. Persontexten skiljer avslutad B.Sc. från pågående Chalmersutbildning och beskriver Rebl-arbetet, hackathondeltagande och faktiskt sammanslagna öppna bidrag.

## Funktioner

`Upp igen` riktar sig mot dokumentets början i stället för innehållsankaret nedanför sidhuvudet. JavaScript scrollar till noll och placerar fokus i sidhuvudet; länken fungerar också utan program-JavaScript.

Kortleken utökas utan att bryta de gamla länkarna. Den laddas först när maskinen används. Varje kategori töms före omblandning. Den fysiska sekvensen för uppmatning och förflyttning respekterar paus, flikbyte och minskad rörelse. Figuren reagerar på klick och utskrift. Bubblor spricker med kortlivade ringar och droppar och reagerar på uppmätt tempo. Station 03 är ett memory och 04 ett femsekundersfika.

Kontakt-API:t validerar på serversidan, verifierar Turnstile, hastighetsbegränsar och skickar två separata mejl med Resend. En intern Reply-To leder till besökaren, inte tvärtom. Dubbelklick, identisk omsändning och leverantörsfel testas. Den gula GIF-figuren används i mottagningskvittot; ingen inkorgsavatar påstås vara konfigurerad.

## Avgränsning

Inga fjärrskrivningar, DNS-ändringar, kontonycklar eller riktiga mejlutskick ingår. Slutpaketet byggs från lokal källa. Testresultat och begränsningar finns i `docs/QA.md`; setup för faktisk leverans finns i `docs/CONTACT-SETUP.md`.
