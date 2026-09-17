# Portfolio Studio

## Logga in och välj miljö

Öppna `/login/`. Cloudflare skickar en kod till den enda tillåtna ägaradressen. Sessionen varar högst en timme. Profilknappen loggar ut. En utgången session raderar inte utkastet: logga in i en ny flik och försök Save igen. **Testmiljö** i sidhuvudet betyder att Save bara ändrar staging.

## Arbetsytan

- **Sidor:** välj hela sidan, inklusive sidhuvud, illustrationer och sidfot. Fäll in panelen vid behov. Ny sida ger tom grundstruktur; Duplicera sida utgår från vald sida.
- **Design:** sidmetadata visas när inget element är valt. Klicka på ett element för text, länkar, bilder, SVG-egenskaper och stil. Välj förälder flyttar markeringen uppåt. Piltangenterna i placeringskontrollen flyttar valt element 1 px utan att byta förälder; håll Shift för 10 px. Strukturell omordning görs i Lager.
- **Lager:** välj nästlade komponenter. **Lägg till:** dra in sektion, kolumner, text, rubrik, bild, länk, avdelare eller behållare.
- **Dator/Mobil:** verkliga arbetsytor på 1440 respektive 390 px. Mobilstilar gäller vid högst 760 px. Zoom ändrar bara arbetsytans visning. Mobilramen hålls centrerad även efter zoom, paneländringar, undo/redo och Lock view.
- **Jämför:** validerad sida i två förhandsvisningar. **Lock view:** prova sidan utan redigering. Kontakt och statistik har inga externa effekter i förhandsvisningen.
- **Telefon:** Sidor och Egenskaper öppnar paneler. Alla kommandon finns under canvasen.

## Text, form och typsnitt

Dubbelklicka för direktredigering. **Shift+Enter** skapar synlig radbrytning, exempelvis `Omar` följt av `Yusuf.` på nästa rad. Textfältet till höger stöder samma radbrytning. Typografi innehåller typsnitt, storlek, vikt, radavstånd, teckenavstånd, färg och justering.

När inget element är valt ändrar **Webbplatsens stil** webbplatsens gemensamma färger, grundtypsnitt, storlek och hörnradie. När ett element är valt blir samma läge en färg- och effektpanel för just det elementet: textfärg, bakgrund/gradient, opacitet, kant/outline, SVG fill/stroke, skuggor och säkra filter som blur, brightness, contrast, saturate och hue-rotate. Layout, marginaler och typografisk storlek ligger kvar i vanliga Design-läget, så färgändringar flyttar inte strukturen av misstag. Egna WOFF2-filer laddas upp i Resurser och kan väljas globalt eller på ett element. Explicita komponentstilar har CSS-företräde framför globala grundvärden.

Layout, rutnät/flex, avstånd, position, transformering, bakgrund, kanter och skuggor finns i Design-panelen. Vanliga visuella text-, länk-, bild- och behållarelement visar GrapesJS-resizehandtag där det är säkert; funktionskontroller och lågnivå-SVG-former skyddas. Fler stilegenskaper accepterar giltiga CSS-egenskaper; servern kontrollerar även dessa vid Save.

## Resurser och vinster

PNG, JPEG, WebP, GIF och WOFF2 stöds för uppladdning. AVIF kräver stöd i den konfigurerade bildtjänsten. Rasterbilder kontrolleras både strukturellt och genom avkodning på servern innan de registreras. Max 10 MiB per fil; rasterbilder högst 8192 px per sida och 32 megapixlar. Vektorliknande originalillustrationer använder en sanerad SVG-källa som redigerbar källa. Godtycklig SVG-uppladdning är fortfarande blockerad; script, externt aktivt innehåll och osäkra referenser accepteras inte. När en befintlig konsument behöver raster skapas ett PNG-derivat, medan SVG-källan förblir redigerbar.

Uppladdade och inbyggda resurser visas i **Aktiva / Arkiverade / Papperskorg**. Arkivering döljer resursen från normalvyn men bryter inga befintliga länkar. Flytt till papperskorg blockeras om aktuellt utkast fortfarande använder resursen. Permanent radering finns bara i papperskorgen och blockeras så länge aktuell webbplats eller någon sparad historikversion refererar till resursen. Resursdetaljen visar referensantal innan en destruktiv åtgärd. Metadata och ersättning sparas separat från publicering; Save publicerar projektets nya referenser.

Små vinster har sökning, kategorier och **Aktiva / Arkiverade / Papperskorg**. Kryssrutor kan markera enstaka kort, alla synliga eller alla träffar i aktuell sökning/filter. Markerade kort kan arkiveras, återställas, flyttas till papperskorg, raderas permanent, byta kategori eller exporteras tillsammans i `omar-wins/v1` JSON. Import validerar hela paketet före ändring och hanterar ID-krock med Skip, Replace eller Import as copy. Aktiva kort används i den vanliga slumpningen; arkiverade kort kan fortfarande nås via sina stabila direkta ID-länkar; kort i papperskorgen visas inte publikt.

Lekarnas texter samlar JavaScript-styrda meddelanden för maskin, memory, fika, bubblor och kontakt. Behåll dynamiska värden inom klamrar, exempelvis `{number}`. Servern avvisar ändringar som tar bort eller skapar sådana värden.

Memorykortens grundmarkup finns i editorn. Kort, fram-/baksida och SVG-behållare behåller sina stilar efter omblandning. Spelets sex symboler och matchningslogik styrs av koden. Funktionselement får inte flyttas ut ur sin funktion; flytta hela gruppen. Vanliga komponenter kan flyttas, dupliceras och tas bort. Direkt nudge ändrar bara visuell `translate` och byter aldrig komponentens parent/index; strukturell omordning görs uttryckligen i Lager.

Återkommande innehåll länkas med en CMS-nyckel i stället för genom att råka ha samma text. Sidfotens **“Lite hjärna. Lite hjärta. Ganska mycket nyfikenhet.”** är den första gemensamma platsen: redigera den på en sida så uppdateras alla länkade sidfötter i samma utkast och som ett undo-steg. Save vägrar publicera om länkade instanser har blivit olika.

## Spara och återställa

| Knapp | Resultat |
| --- | --- |
| Edit | Återgå till redigering. |
| Save / Cmd eller Ctrl+S | Validera och publicera hela utkastet som ny version. |
| Ångra / Gör om | Ändra utkast, aldrig publicerad sida. Upp till 50 steg i sessionen. Canvasposition, iframe-scroll, vald komponent, device/zoom och panelens scroll återställs så arbetet inte hoppar till toppen. |
| Revert | Bekräfta och hämta senast publicerad version. |
| History | Läs historik; Granska påverkar inte utkastet. |
| Restore | Läs vald version som utkast. Save krävs för publicering. |
| Lock view | Lås redigering och visa validerad förhandsvisning. |

Reservutkast sparas lokalt i IndexedDB och kan återupptas vid nästa inloggning. Exportera utkast ger en JSON-reservkopia vid nätverks- eller sessionsproblem. Den innehåller HTML, CSS, övrigt innehåll och resursreferenser, inga inloggningsuppgifter. Äldre editor-JSON används inte som en separat innehållskälla. Vid öppning av en sådan version visas en möjlighet att exportera originalet; granska det kanoniska utkastet före Save.

Två flikar kan inte tyst skriva över varandra. Vid konflikt kan utkast exporteras, historik granskas eller ändringar sammanföras. Oberoende sidor, vinstkort, temavärden och funktionstexter sammanförs. Har båda flikarna ändrat samma sida krävs uttryckligt val; vald sidversion behålls som helhet. Granska sedan och välj Save.

Save visar valideringsfel utan att kasta bort arbetet. Trasiga interna länkar, saknade alternativtexter, ändrade funktionskopplingar och otillåten kod måste rättas. Godtycklig HTML-/JavaScript-körning ingår inte i studion.
