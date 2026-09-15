# Portfolio Studio

## Logga in och välj miljö

Öppna `/login/`. Cloudflare skickar en kod till den enda tillåtna ägaradressen. Sessionen varar högst en timme. Profilknappen loggar ut. En utgången session raderar inte utkastet: logga in i en ny flik och försök Save igen. **Testmiljö** i sidhuvudet betyder att Save bara ändrar staging.

## Arbetsytan

- **Sidor:** välj hela sidan, inklusive sidhuvud, illustrationer och sidfot. Fäll in panelen vid behov. Ny sida ger tom grundstruktur; Duplicera sida utgår från vald sida.
- **Design:** sidmetadata visas när inget element är valt. Klicka på ett element för text, länkar, bilder, SVG-egenskaper och stil. Välj förälder flyttar markeringen uppåt. Vanliga visuella element kan storleksändras och finjusteras med 1 px eller 10 px utan att byta DOM-förälder; strukturell omordning görs i Lager.
- **Lager:** välj nästlade komponenter. **Lägg till:** dra in sektion, kolumner, text, rubrik, bild, länk, avdelare eller behållare.
- **Dator/Mobil:** verkliga arbetsytor på 1440 respektive 390 px. Mobilstilar gäller vid högst 760 px. Zoom ändrar bara arbetsytans visning. Canvasen hålls centrerad även i mobilvy, vid paneländringar och när Lock view lämnas.
- **Jämför:** validerad sida i två förhandsvisningar. **Lock view:** prova sidan utan redigering. Kontakt och statistik har inga externa effekter i förhandsvisningen.
- **Telefon:** Sidor och Egenskaper öppnar paneler. Alla kommandon finns under canvasen.

## Text, form och typsnitt

Dubbelklicka för direktredigering. **Shift+Enter** skapar synlig radbrytning, exempelvis `Omar` följt av `Yusuf.` på nästa rad. Textfältet till höger stöder samma radbrytning. Typografi innehåller typsnitt, storlek, vikt, radavstånd, teckenavstånd, färg och justering.

Webbplatsens stil har två tydliga scope. Utan markerat element ändras webbplatsens gemensamma palett, grundtypsnitt, storlek och hörnradie. Med ett markerat element blir panelen ett färg-/effektläge för just det elementet: text- och bakgrundsfärg, gradient/bakgrund, kant/outline, SVG fill/stroke, opacity, box/text shadow samt säkra filter som blur/saturation. Presets skriver vanlig validerad CSS och kan därefter finjusteras. Egna WOFF2-filer laddas upp i Resurser och kan väljas globalt eller på ett element. Explicita komponentstilar har CSS-företräde framför globala grundvärden.

Layout, rutnät/flex, avstånd, position, transformering, bakgrund, kanter och skuggor finns kvar i vanliga Design-panelen. Fler stilegenskaper accepterar giltiga CSS-egenskaper; servern kontrollerar även dessa vid Save.

## Resurser och vinster

PNG, JPEG, WebP, GIF och WOFF2 stöds. AVIF kräver stöd i den konfigurerade bildtjänsten. Rasterbilder kontrolleras både strukturellt och genom avkodning på servern innan de registreras. Max 10 MiB per fil; rasterbilder högst 8192 px per sida och 32 megapixlar. Godkända inbyggda ikon-/illustrationsresurser har dessutom ett managed SVG-original som kan redigeras i samma canvas. SVG-källan saneras mot en strikt allowlist; webbplatsen fortsätter använda ett genererat rasterderivat. Godtyckliga aktiva SVG-uppladdningar accepteras inte.

Uppladdade filer är privata tills de används i publicerat innehåll. Editorbibliotekets registrering räcker inte för publicering. Alternativtext följer med när bilden läggs in; befintliga bilders text ändras på respektive sida. Ersätt fil byter ut referenser i utkastet. Save publicerar bytet. Resursrummet har Aktiva, Arkiverade och Papperskorg. Arkivering är återställningsbar. Flytt till papperskorg blockeras om resursen fortfarande används i aktuellt utkast. Permanent radering kräver papperskorg och blockeras om resursen används i aktuellt innehåll eller någon sparad revision; dialogen visar current/history-användning före åtgärden. Redan publicerade bytes/historik raderas alltså inte tyst.

Små vinster har sökning, kategorier och persistent multi-select. Du kan markera synliga eller alla sökträffar och utföra kategoriändring, export, arkivering, återställning, papperskorg eller permanent radering i batch. Permanent radering är endast tillgänglig från papperskorgen. Import/export använder ett versionsmärkt JSON-format och kontrollerar resursreferenser samt ID-kollisioner. Varje vinst har stabil identitet, text, kategori och egen visuell design. Slumpmässiga publika vinster använder bara aktiva poster; en arkiverad vinst kan fortfarande öppnas via sitt stabila ID, medan papperskorgsvinster inte visas publikt. Samma renderare används i låst förhandsvisning, publik maskin och PNG-export.

Lekarnas texter samlar JavaScript-styrda meddelanden för maskin, memory, fika, bubblor och kontakt. Behåll dynamiska värden inom klamrar, exempelvis `{number}`. Servern avvisar ändringar som tar bort eller skapar sådana värden.

Memorykortens grundmarkup finns i editorn. Kort, fram-/baksida och SVG-behållare behåller sina stilar efter omblandning. Spelets sex symboler och matchningslogik styrs av koden. Funktionselement får inte flyttas ut ur sin funktion. Vanliga visuella komponenter kan resize:as och flyttas några pixlar med nudge utan reparenting; använd Lager när DOM-strukturen faktiskt ska ändras.

## Gemensamt innehåll

Innehåll som uttryckligen är semantiskt gemensamt markeras av CMS:et i stället för att kopplas ihop genom textlikhet. Footerns slogan är den första shared-komponenten: ändrar du den på en sida propageras samma säkra markup till alla sidor i samma utkast och hamnar i samma undo-steg. Orelaterade texter kopplas aldrig ihop bara för att de råkar vara lika.

## Spara och återställa

| Knapp | Resultat |
| --- | --- |
| Edit | Återgå till redigering. |
| Save / Cmd eller Ctrl+S | Validera och publicera hela utkastet som ny version. |
| Ångra / Gör om | Ändra utkast, aldrig publicerad sida. Upp till 50 steg i sessionen. Canvasposition, zoom, device, iframe-scroll, markering och inspector-scroll återställs tillsammans med innehållet. |
| Revert | Bekräfta och hämta senast publicerad version. |
| History | Läs historik; Granska påverkar inte utkastet. |
| Restore | Läs vald version som utkast. Save krävs för publicering. |
| Lock view | Lås redigering och visa validerad förhandsvisning. |

Reservutkast sparas lokalt i IndexedDB och kan återupptas vid nästa inloggning. Exportera utkast ger en JSON-reservkopia vid nätverks- eller sessionsproblem. Den innehåller HTML, CSS, övrigt innehåll och resursreferenser, inga inloggningsuppgifter. Äldre editor-JSON används inte som en separat innehållskälla. Vid öppning av en sådan version visas en möjlighet att exportera originalet; granska det kanoniska utkastet före Save.

Två flikar kan inte tyst skriva över varandra. Vid konflikt kan utkast exporteras, historik granskas eller ändringar sammanföras. Oberoende sidor, vinstkort, temavärden och funktionstexter sammanförs. Har båda flikarna ändrat samma sida krävs uttryckligt val; vald sidversion behålls som helhet. Granska sedan och välj Save.

Save visar valideringsfel utan att kasta bort arbetet. Trasiga interna länkar, saknade alternativtexter, ändrade funktionskopplingar och otillåten kod måste rättas. Godtycklig HTML-/JavaScript-körning ingår inte i studion.
