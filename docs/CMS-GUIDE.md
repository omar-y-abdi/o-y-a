# Portfolio Studio

## Logga in och välj miljö

Öppna `/login/`. Cloudflare skickar en kod till den enda tillåtna ägaradressen. Sessionen varar högst en timme. Profilknappen loggar ut. En utgången session raderar inte utkastet: logga in i en ny flik och försök Save igen. **Testmiljö** i sidhuvudet betyder att Save bara ändrar staging.

## Arbetsytan

- **Sidor:** välj hela sidan, inklusive sidhuvud, illustrationer och sidfot. Fäll in panelen vid behov. Ny sida ger tom grundstruktur; Duplicera sida utgår från vald sida.
- **Design:** sidmetadata visas när inget element är valt. Klicka på ett element för text, länkar, bilder, SVG-egenskaper och stil. Välj förälder flyttar markeringen uppåt. Flytta upp/ned är alternativ till dragning.
- **Lager:** välj nästlade komponenter. **Lägg till:** dra in sektion, kolumner, text, rubrik, bild, länk, avdelare eller behållare.
- **Dator/Mobil:** verkliga arbetsytor på 1440 respektive 390 px. Mobilstilar gäller vid högst 760 px. Zoom ändrar bara arbetsytans visning.
- **Jämför:** validerad sida i två förhandsvisningar. **Lock view:** prova sidan utan redigering. Kontakt och statistik har inga externa effekter i förhandsvisningen.
- **Telefon:** Sidor och Egenskaper öppnar paneler. Alla kommandon finns under canvasen.

## Text, form och typsnitt

Dubbelklicka för direktredigering. **Shift+Enter** skapar synlig radbrytning, exempelvis `Omar` följt av `Yusuf.` på nästa rad. Textfältet till höger stöder samma radbrytning. Typografi innehåller typsnitt, storlek, vikt, radavstånd, teckenavstånd, färg och justering.

Webbplatsens stil ändrar gemensamma färger, grundtypsnitt, storlek och hörnradie. Egna WOFF2-filer laddas upp i Resurser och kan väljas globalt eller på ett element. Explicita komponentstilar har CSS-företräde framför globala grundvärden.

Layout, rutnät/flex, avstånd, position, transformering, bakgrund, kanter och skuggor finns i samma panel. Fler stilegenskaper accepterar giltiga CSS-egenskaper; servern kontrollerar även dessa vid Save.

## Resurser och vinster

PNG, JPEG, WebP, GIF, AVIF och WOFF2 accepteras. Max 10 MiB per fil; rasterbilder högst 8192 px per sida och 32 megapixlar. Befintliga SVG-illustrationer kan redigeras som komponenter. Aktiva SVG-filer kan inte laddas upp.

Uppladdade filer är privata tills de används i publicerat innehåll. Editorbibliotekets registrering räcker inte för publicering. Alternativtext följer med när bilden läggs in; befintliga bilders text ändras på respektive sida. Ersätt fil byter ut referenser i utkastet. Save publicerar bytet. Arkivera döljer filen; Visa arkiverade och Återför till biblioteket tar tillbaka den. Publicerade filer bevaras för historik och tidigare länkar.

Små vinster har sökning och kategorier. Varje vinst har stabil identitet, text, kategori och egen visuell design. Samma renderare används i låst förhandsvisning, publik maskin och PNG-export. Originalkortens länkar behåller sina ID:n; nya vinster får egna ID:n.

Lekarnas texter samlar JavaScript-styrda meddelanden för maskin, memory, fika, bubblor och kontakt. Behåll dynamiska värden inom klamrar, exempelvis `{number}`. Servern avvisar ändringar som tar bort eller skapar sådana värden.

Memorykortens grundmarkup finns i editorn. Kort, fram-/baksida och SVG-behållare behåller sina stilar efter omblandning. Spelets sex symboler och matchningslogik styrs av koden. Funktionselement får inte flyttas ut ur sin funktion; flytta hela gruppen. Vanliga komponenter kan flyttas, dupliceras och tas bort.

## Spara och återställa

| Knapp | Resultat |
| --- | --- |
| Edit | Återgå till redigering. |
| Save / Cmd eller Ctrl+S | Validera och publicera hela utkastet som ny version. |
| Ångra / Gör om | Ändra utkast, aldrig publicerad sida. Upp till 50 steg i sessionen. |
| Revert | Bekräfta och hämta senast publicerad version. |
| History | Läs historik; Granska påverkar inte utkastet. |
| Restore | Läs vald version som utkast. Save krävs för publicering. |
| Lock view | Lås redigering och visa validerad förhandsvisning. |

Reservutkast sparas lokalt i IndexedDB och kan återupptas vid nästa inloggning. Exportera utkast ger en JSON-reservkopia vid nätverks- eller sessionsproblem. Den innehåller innehåll och editorprojekt, inga inloggningsuppgifter.

Två flikar kan inte tyst skriva över varandra. Vid konflikt kan utkast exporteras, historik granskas eller ändringar sammanföras. Oberoende sidor, vinstkort, temavärden och funktionstexter sammanförs. Har båda flikarna ändrat samma sida krävs uttryckligt val; vald sidversion behålls som helhet. Granska sedan och välj Save.

Save visar valideringsfel utan att kasta bort arbetet. Trasiga interna länkar, saknade alternativtexter, ändrade funktionskopplingar och otillåten kod måste rättas. Godtycklig HTML-/JavaScript-körning ingår inte i studion.
