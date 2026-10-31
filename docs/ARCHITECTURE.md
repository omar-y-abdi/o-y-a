# Arkitektur

Det här dokumentet beskriver hur koden är uppdelad, vilka filer som äger vilken data och vilka filer som ändras för vanliga uppgifter. Det beskriver koden i det här trädet. Verifiering finns i [QA-guiden](QA.md), driftsättning i [driftguiden](DEPLOYMENT.md) och CMS-publicering i [CMS-designen](CMS-DESIGN.md).

## Översikt

- `src/worker.mjs` är den enda Cloudflare Worker-ingången. Den routar publika sidor, `/admin`, `/api/*`, `/media/*` och `/mail-file/*`, sätter säkerhetshuvuden och kör schemalagt underhåll av mailfiler.
- Den publika webbplatsen byggs statiskt till `dist/` av `scripts/build.mjs`. Före första publiceringen (version 0) serveras de statiska filerna från `ASSETS`. När CMS:et har publicerat en version serverar Workern sidorna från D1, och en sida som saknas där ger 404.
- CMS:et ligger i `src/cms/`. Versioner lagras i D1 (binding `CMS_DB`, schema i `migrations/`), bilder och typsnitt i R2 (`CMS_MEDIA`). Studion är en GrapesJS-baserad editor som byggs till `dist/admin/` och bara är åtkomlig efter Cloudflare Access-inloggning.
- Övriga bindings i `wrangler.jsonc`: `CMS_IMAGES` (Cloudflare Images för bildkontroll i `src/cms/raster-integrity.mjs`), `ANALYTICS` (Analytics Engine för `/api/event`), `CONTACT_RATE_LIMIT` (hastighetsgräns för kontaktformuläret och mejl-API:t) och `ASSETS` (statiska filer). Cron-jobbet `17 * * * *` kör `maintainMailFiles` i `src/worker.mjs`.
- SKIFT är ett eget paket i `games/skift/` med egen `package.json`. `scripts/build.mjs` bygger det till `dist/play/skift/`. Spelsidan är kodägd: CMS:et lagrar inte dess HTML, bara speltexterna i `runtime.skift.*`.

## Moduler

### `src/` (publik webbplats och Worker)

| Plats | Ansvar |
| --- | --- |
| `src/worker.mjs` | Värdkontroll, HTTPS och kanoniska adresser, säkerhetshuvuden, routing och schemalagt underhåll. |
| `src/csp.mjs` | Content-Security-Policy för publika sidor (`CSP`) och för SKIFT (`SKIFT_CSP`). |
| `src/api/http.mjs` | Begränsad läsning av request-kroppar. Används av Workern, kontakt-API:t och CMS:et (`http.mjs`, `admin-seed.mjs`). |
| `src/client/` | Publik webbläsarkod. `main.mjs` är startpunkten. `copy.mjs` hanterar text, `privacy.mjs` samtyckeskakan, `contact.mjs` kontaktformuläret, `cards.mjs` och `win.mjs` vinstkorten (`win.mjs` laddas vid behov), `games.mjs`, `memory.mjs` och `playlogic.mjs` lekarna och deras spellogik, `joy.mjs` firandeanimationen och nedladdning av filer, `skift-bootstrap.mjs` startar SKIFT och `previewdata.mjs` läser förhandsvisningsdata i en srcdoc-ruta som studion skapar. |
| `src/content/` | Innehåll som koden äger: `site.mjs` (sidlista och webbplatsdata), `skift.mjs` (SKIFT-adress och menylänk), `resources.mjs` (resursplatser och standardbilder), `win-design.mjs` (standarddesign för vinstkort), `openapi.mjs` och `llms.mjs` (API-beskrivning och `llms.txt`). |
| `src/templates/` | Statisk HTML. `layout.mjs` är sidskalet med header, sidfot, samtyckesbanner och integritetsdialog. `home.mjs`, `pages.mjs`, `legal.mjs`, `developers.mjs` och `expansion.mjs` bygger sidinnehållet. `components.mjs` innehåller hjälpare som `escape` och ikoner. |
| `src/styles/` | Publik CSS. `base.css` ingår i alla mallar, `home.css` och `pages.css` i alla utom SKIFT. Övriga filer läggs till per mall i `additions` i `scripts/build.mjs`. |
| `src/server/` | Kontakt och mejl: `contact.mjs` (kontakt-API), `contact-secrets.mjs` (krypterade kontaktinställningar i D1), `emails.mjs` och `email-render.mjs` (mejlinnehåll), `markdown.mjs` (Markdown-svar vid innehållsförhandling) och `api-version.mjs` (API-version). |

### `src/cms/` (CMS-server)

| Plats | Ansvar |
| --- | --- |
| `auth.mjs` | Verifierar Cloudflare Access-token och ägarens e-post. |
| `api.mjs` | Admin-router. Kör autentisering först och skickar sedan till läs- eller skrivhanterare. |
| `admin-site.mjs` | Åtgärder för sidor: `state`, `history`, `revision`, `save`, `validate`, `preview`, `recover`, ramflytt och CPU-migrering. |
| `admin-media.mjs` | Åtgärder för media: bibliotek, uppladdning, SVG-operationer, användning, metadata, livscykel och ersättning av resurser. |
| `admin-seed.mjs` | Laddar seed-definitionerna från den byggda filen och kontrollerar längd och SHA-256. |
| `http.mjs`, `diagnostics.mjs` | `HttpError`, JSON-svar, begränsad läsning, skrivskydd och fel-ID. |
| `store.mjs` | Revisioner, huvudpekaren `cms_head`, publicering i en D1-batch och publika läsningar. |
| `studio-store.mjs` | Kanonisk studiokopia (`cms_studio_heads`, `cms_studio_text`). |
| `preview-store.mjs` | Valideringsbevis (`cms_preview_facts`) och basprojekt för validering. |
| `current-project.mjs` | Det projekt som Save och Validate utgår från: studiokopian om den finns, annars revisionen. |
| `stored-view.mjs`, `digest.mjs`, `legacy-save-identity.mjs` | Läsvy utan oanvänd editor-JSON, SHA-256 och identitetsjämförelse för äldre sparningar. |
| `render.mjs` | Publika svar från `cms_rendered`: sidor, `/cms-public/` CSS, `/data/*`, `/sitemap.xml` och SKIFT-sidan. Även studions förhandsvisning. |
| `routes.mjs`, `skift.mjs`, `public-html.mjs` | Kanoniska sidadresser och reserverade vägar, SKIFT-adressen och borttagning av interna nodnycklar. |
| `project.mjs` | Projektregler: `validateProject` och `validateProjectWithReferences`. Anropas av Save, Validate, förhandsvisning, återställning, media, migreringar och release-grinden. |
| `validation.mjs` | HTML- och CSS-gränser, sidvägar, positionella nycklar och `VALIDATION_POLICY`. |
| `frame.mjs` | Gemensam sidram: dela upp och sätt ihop sidor, CSS-ägarskap, ramdefinitioner från bygget och ramvalidering. |
| `frame-converter.mjs` | Konvertering mellan schema 1 och schema 2 och normalisering av lagrade och klientprojekt. |
| `legacy-project.mjs` | Äldre gemensamt innehåll (`DEFAULT_SHARED_CONTENT`), sidfotsmigrering och SKIFT-normalisering. |
| `legacy-keys.json` | Frusen nyckelkarta för äldre nodnycklar. Skapas en gång med `scripts/legacy-keys.mjs`. |
| `project-changes.mjs` | Deltaformatet för Save: validering av form, tillämpning och härledning av ändringar. |
| `html-tree.mjs`, `id-references.mjs`, `css-references.mjs`, `frame-ids.mjs`, `frame-id-selectors.mjs`, `svg.mjs` | Hjälpare för parse5-träd, ID-referenser, CSS-referenser och SVG-rensning. |
| `theme.mjs`, `theme-core.mjs` | Temavalidering, färgvariabler och typsnitts-CSS. |
| `resources.mjs`, `assets.mjs`, `asset-lifecycle.mjs` | Resursplatser och referenser, mediebibliotekets frågor och övergångarna arkivera, papperskorg och radera. |
| `media-files.mjs`, `raster-integrity.mjs`, `managed-svg.mjs` | Uppladdning och läsning av R2-objekt, bildkontroll och SVG-källor med PNG-derivat. |
| `email-api.mjs`, `email-validate.mjs`, `mail-files.mjs` | Mejl-API under `/admin/api/contact` och `/admin/api/mail/*`, filer för bilagor (`/mail-file/*`) och städning av filer. |
| `compatibility.mjs` | Kompatibilitetskontroll av lagrade revisioner, används av release-grinden. |
| `cpu-migration.mjs` | Status samt `commit`, `abort` och `rollback` för kanonisk studiolagring. Förberedelsen ligger i `scripts/cms-cpu-artifact.mjs`. |
| `templates.mjs`, `styles.css`, `login.css` | HTML-skal och CSS för studion och inloggningssidan. |
| `preview-project.mjs` | Nyttolast för förhandsvisning av en sida eller ett vinstkort. |
| `client/` | Studions webbläsarkod. `app.mjs` är huvudkontrollern för utkast, Save, Validate, förhandsvisning, historik och bibliotek. `api.mjs` anropar `/admin/api/` med skyddshuvudet. `draft.mjs`, `merge.mjs` och `recovery.mjs` hanterar utkast, sammanslagning och lokal återställning. `editor.mjs`, `editor-*.mjs` och `inspector.mjs` är GrapesJS-anpassningen. `library.mjs` är bibliotekspanelen. `email.mjs` är mejlvyn, som laddas som egen chunk. Övriga filer hanterar förhandsvisning, SVG, klonning, positionering och vinstkort. |

### `migrations/`

Filerna körs i namnordning. De bygger D1-schemat:

| Filer | Innehåll |
| --- | --- |
| `0001`–`0005` | Huvudpekare, revisioner, renderade sidor, media, mediaversioner, valideringsversion, livscykel för media och revisionsindex. |
| `0006` | Operationer för SVG-källor med PNG-derivat. |
| `0007`–`0010` | Kontaktinställningar, skickad post, mailfiler, sändningsförsök, mailfilernas livscykel och kvitton. |
| `0011` | Begäransformat för Save. |
| `0012`–`0013` | Kanonisk studiokopia och valideringsbevis. |
| `0014` | Operationer och rader för CPU-migrering. |

### `scripts/`

| Grupp | Filer och ansvar |
| --- | --- |
| Bygge | `build.mjs` bygger den publika webbplatsen, SKIFT och CMS. `build-cms.mjs` är ett internt steg som skapar CMS-originalet, seed och editorbunten. `lint.mjs`, `third-party-notices.mjs` och `prepare-base-worker.mjs` (bygger den pinnade historiska Worker som kompatibilitetstesterna använder). |
| Testdrivning | `run-node-tests.mjs` (lägena `fast`, `slow` och `watch`), `quality.sh` och `run-quality-browser.mjs` (kvalitetskedjan), `test-python.mjs` (väljer Python-tolk för de manuella verktygen), `test-cms.mjs` (kör ett manuellt Python-verktyg mot en isolerad lokal Worker) och `test-cms-compat.mjs` (Firefox och WebKit). |
| Lokal utveckling | `cms-dev.mjs` startar en lokal Worker med seed och testidentitet. |
| Release och drift | `cms-check-release.mjs` (kontrollerar en lokal exportfil), `cms-pull-release.mjs` (skrivskyddad release-grind mot D1), `cms-release-errors.mjs` (validerar listan över granskade historiska fel), `cms-prune-rendered.mjs` (pagad rensning av utgångna `cms_rendered`-rader), `cms-strip-media.mjs` (rensar bildmetadata från befintliga rasterbilder via de vanliga vägarna), `cms-migrate-frame.mjs` (ramflytt med förväntad version och hash), `cms-migrate-cpu.mjs` och `cms-cpu-artifact.mjs` (CPU-migrering), `smoke-live.mjs` (röktest mot produktion), `measure-cms-handlers.mjs` (mätning av CMS-hanterare) och `legacy-keys.mjs` (engångsverktyg för den frusna nyckelkartan). |
| Manuella Python-verktyg | `capture-cms.py` (visuella granskningsbilder), `artwork.py` (varumärkes-PNG från sidans CSS) och `mail-art.py` (mejl-GIF). Se avsnittet om Python i [QA-guiden](QA.md). |

### `tests/`

| Mönster | Innehåll |
| --- | --- |
| `*.test.mjs` | Node-tester. `run-node-tests.mjs` kör alla utom `cms-backup-drill.test.mjs` i läget `fast`. Backup-drillen kör i läget `slow`. Områden: CMS-lagring, API, validering, rambyte, migrering, release, publik rendering, mejl och kontakt, HTTP mot riktig Worker (`http-checks.test.mjs`), byggbudgetar (`assets.test.mjs`), dokumentlänkar och skript (`docs.test.mjs`) och CI-kontrakt (`quality-gates.test.mjs`). |
| `*.spec.mjs` | Playwright-specifikationer. CMS-specifikationer startar egna Workers med `cmsRuntime()`, som använder port 0 som standard. Publika specifikationer använder `publicRuntime` eller `runtime.url`. Omfattar publika sidor, SKIFT, kortexport, CMS-redigering, granskning, sidfot, revisioner, mejl och Firefox/WebKit-matriser. |
| `helpers/` | Hjälpare som importeras av testerna. `cms-runtime.mjs` startar lokala Workers med migreringar och ett startprojekt. `cms-node.mjs` skapar SQLite-runtime för Node-test. |
| `fixtures/` | Fryst historiskt projekt (`cms-v185-project.json`), e-postfixturer och typsnitt för tester. |
| Python | `cms-browser.py` är gemensam hjälpare för `capture-cms.py`. `render_support.py` renderar byggd HTML för `contrast.py`, `machine_depth.py` och `artwork.py`. `contrast.py` läses av `capture-cms.py` för kontrastkontroller. `machine_depth.py` är ett manuellt maskintest. |

### `games/skift/` (separat paket)

Spelet har egen `package.json`, `index.html`, källa i `src/`, tester i `tests/` och docs i `docs/`. `games/skift/scripts/build-portfolio.mjs` bygger portföljversionen som `scripts/build.mjs` använder. `games/skift/scripts/release.py` och `start.py` är Python-skript för det fristående paketet.

## Begäransflöden

### Publik sidläsning

1. `src/worker.mjs` kontrollerar värd, HTTPS och kanoniska adresser och skickar `/about`, `/contact` och `/privacy` vidare till sina svenska adresser.
2. GET och HEAD till sidor går till `publicContent` i `src/cms/render.mjs`. Adressen normaliseras med `canonicalPagePath` i `src/cms/routes.mjs`.
3. `readPublicPage` i `src/cms/store.mjs` läser huvudversionen och sidans rad i `cms_rendered` med en SQL-fråga. Om ingen version är publicerad (version 0) returneras `null`, och Workern serverar en statisk fil från `ASSETS`. Det gäller också adresser som `canonicalPagePath` inte räknar som sidor: reserverade prefix och filnamn med punkt.
4. En publicerad sida renderas av `renderPage`. Sidskalet kommer från `layout()` med CSS-länken till den build som körs just nu (`built.styles`). Sidram och innehåll kommer från den lagrade HTML:en. Sidor som inte har `frameVersion` 2 normaliseras vid läsning. Ett fel i normaliseringen rapporteras och den lagrade sidan serveras ändå.
5. Saknas sidans rad i den publicerade versionen svarar Workern 404 med sidan `/404.html` från D1, eller med en kort text om den raden också saknas. Undantaget är `/developers/`, som då kommer från `ASSETS` eftersom en äldre databas kan sakna sidan.
6. `/data/cards.json`, `/data/runtime.json` och `/sitemap.xml` läses från D1 och kommer från `ASSETS` när raden saknas. `/data/cards/<id>.json` svarar 404 när raden saknas. SKIFT-sidans (`/play/skift/`) kropp kommer från bygget och sidramen från D1.

### Administrativ åtkomst

1. `/admin` och `/admin/*` går till `handleAdmin` i `src/cms/api.mjs`. Identiteten kontrolleras först, även för de statiska studiofilerna.
2. `authenticateAdmin` i `src/cms/auth.mjs` läser token från huvudet `Cf-Access-Jwt-Assertion` eller cookien `CF_Authorization`. Token verifieras med `jose` mot teamets nycklar. Issuer, audience, RS256, claims `exp`, `iat`, `sub` och `email`, högst en timme gammal token och ägarens e-postadress måste stämma. Adressen konfigureras som `CMS_ADMIN_EMAIL` utanför repot.
3. Adresser utan prefixet `/admin/api/` serveras från `ASSETS`.
4. `/admin/api/contact` och `/admin/api/mail/*` hanteras av `src/cms/email-api.mjs`. Övriga `/admin/api/*`-adresser kräver `CMS_DB` och svarar 503 om den saknas.
5. GET och HEAD går till läshanterarna. POST kräver `requireWriteRequest` i `src/cms/http.mjs`: metoden POST, samma origin, huvudet `X-CMS-Request: 1`, `Sec-Fetch-Site` som `same-origin` när huvudet finns och rätt innehållstyp.

### `/admin/api/state`

1. `studio()` i `api.mjs` laddar seed-definitionerna från `admin-seed.mjs`.
2. `readStudioHead` i `studio-store.mjs` returnerar den kanoniska studiokopian om en rad med samma build key finns för huvudversionen. Annars läser `readSite` i `store.mjs` revisionen från `cms_revisions` och dekomprimerar den. Utan revision används initialprojektet med version 0.
3. Svaret innehåller hela projektet. Den kanoniska kopian skickas som text utan att tolkas om (`state` i `admin-site.mjs`). Mediekatalogen läses separat av `assets.mjs`.

### Förhandsvisning (`/admin/api/preview`)

`validate()` i `admin-site.mjs` hanterar förhandsvisning när adressen slutar på `/preview`. `previewPayload` väljer en sida eller ett vinstkort. `previewBaseline` i `preview-store.mjs` hämtar giltiga bevis. `validateProjectWithReferences` kontrollerar utkastet, och svaret är HTML från `renderPage` eller `renderWinPreview`. Studion visar HTML:en i en srcdoc-ruta. Ingen revision skapas och huvudpekaren flyttas inte, men `validateReferencedMedia` kan uppdatera `cms_media.validation_version` för refererad äldre media efter lyckad integritetskontroll.

### Validera (`/admin/api/validate`)

`validate()` kör samma projektregler som Save och kontrollerar refererade filer med `validateReferencedMedia`. `reusableRows` avgör vilka rader en Save skulle kopiera, och `publicationChunks` renderar resten för att se om publiceringen ryms. Ingen revision skapas och huvudpekaren flyttas inte, men `validateReferencedMedia` kan uppdatera `cms_media.validation_version` för refererad äldre media efter lyckad integritetskontroll. Svaret är projektet.

### Spara (`/admin/api/save`)

1. Begäran har antingen `changes` (delta) eller `project` (hela projektet) samt `baseVersion` och `requestId`. `requestId` gör Save idempotent: `replaySave` och `replayFullSave` returnerar den tidigare revisionen, och samma identitet med annat innehåll ger 409.
2. Delta: `validateProjectChanges` kontrollerar formen. Ändringar i SKIFT-sidan avvisas. `baseVersion` måste vara den aktuella versionen, annars 409. Nuvarande projekt läses med `readCurrentProject`, eller med `readSite` för en äldre delta (`sharedContent` eller sid-HTML som inte börjar med `<main`), och ändringarna tillämpas med `applyProjectChanges`.
3. Hela projektet: `fromClient` normaliserar det och `publishedBaseline` ger basen.
4. `validateProjectWithReferences` i `project.mjs` kör projektreglerna, och `validateReferencedMedia` kontrollerar mediafilerna.
5. `publishSite` i `store.mjs` komprimerar hela projektet (högst 1,5 MB efter gzip). I en `db.batch` skriver den revisionen, resursindexet, raderna i `cms_rendered`, mediets publiceringstid, studiokopian och valideringsbevisen, tar bort raderna för högst en utgången version och uppdaterar huvudpekaren. Villkoren i varje SQL-sats gör att en inaktuell skrivning inte lämnar delvisa rader.
6. Efter batchen läses den committade raden. Om den inte finns eller har annan identitet blir svaret 409.

En delta-Save renderar bara de sidor och kort som ändringen berör. `reusableRows` jämför projektet med huvudversionen, och oförändrade rader i `cms_rendered` kopieras från den i samma batch. Det kräver att sidramen, typsnitten, resurserna, renderingskoden och UTC-året är oförändrade. Annars renderas alla rader. Det gäller också en Save med hela projektet och ramflytten (`/admin/api/migrate-frame`). Raden `@frame` och dataraderna renderas alltid. Revisionen, komprimeringen och studiokopians digest omfattar hela projektet. `publicationChunks` i `store.mjs` avvisar publiceringen med 413 före skrivning när en renderad rad överskrider `PUBLIC_ROW_LIMIT` eller `PUBLIC_BIND_LIMIT`, eller när raderna tillsammans överskrider applikationens publiceringsgräns på 16 MiB. Kopierade och renderade rader räknas på samma sätt mot den gränsen.

### Återställning (`/admin/api/recover`)

`recover()` validerar lokal återställningsdata från webbläsaren, inklusive en väntande Save, och returnerar projektet, den väntande Save:en och varningar. Ingen rad skrivs.

### Migreringar

`/admin/api/migrate-frame` byter mellan schema 1 och 2 med förväntad version och hash. `/admin/api/cpu-migration` visar status (GET) och kör `commit`, `abort` eller `rollback` på en förberedd operation (POST). Förberedelsen görs utanför Workern av `scripts/cms-migrate-cpu.mjs` med D1-ägarens behörighet. Se [CPU-migreringen](CMS-CPU-MIGRATION.md) och [ramflytten](CMS-FRAME-MIGRATION.md).

## Dataägarskap

| Tabell | Innehåll | Status |
| --- | --- | --- |
| `cms_head` | En rad med aktuell version. | Auktoritativ. Ändras bara av `publishSite`. |
| `cms_revisions` | Oföränderliga revisioner: komprimerat projekt, manifest, `request_id`, basversion, payloadhash och aktör. | Auktoritativ. |
| `cms_rendered` | Publika rader per version. Skrivs i samma batch som revisionen. | Härledd från revisionen. Varje publicering kopierar eller renderar raderna. Rader för äldre versioner tas bort 24 timmar efter att nästa version publicerats (`store.mjs`, `scripts/cms-prune-rendered.mjs`). `@resources` och `@email` behålls. En saknad rad återskapas inte vid läsning, så en saknad sidrad för den aktuella versionen ger 404, utom för `/developers/`. |
| `cms_revision_resource_index`, `cms_revision_resource_indexed` | Resursreferenser per revision. | Härledd. `retainedResourceUsage` i `store.mjs` fyller på saknade revisioner från `cms_revisions`, 20 i taget. |
| `cms_studio_heads`, `cms_studio_text` | Kanonisk studiokopia per version och build key. | Härledd. Används bara när build key matchar. Annars läses revisionen. CPU-migreringen kan förbereda eller uppdatera kopian (`cpu-migration.mjs`). |
| `cms_preview_facts` | Valideringsbevis per sidram och sida. | Härledd och valfri. Saknade rader gör att valideringen körs fullt ut (`preview-store.mjs`). |
| `cms_media`, `cms_builtin_resource_state`, `cms_media_delete_queue`, `cms_managed_svg_operations` | Mediaregister, status för inbyggda resurser, borttagningskö och SVG-operationer. | Auktoritativa för metadata. Filerna ligger i R2 (`CMS_MEDIA`). |
| `cms_contact_secrets`, `cms_sent_mail`, `cms_mail_receipts`, `cms_mail_files`, `cms_mail_cleanup` | Kontaktinställningar, mejlstatus, kvitton och städning av mailfiler. | Auktoritativa för sina poster. |
| `cms_cpu_migrations`, `cms_cpu_migration_rows` | Status och förberedda rader för CPU-migreringen. | Operationsstatus. Källprojektet nollas när en operation committas (`cpu-migration.mjs`). |

## Ändringsscenarier

| Ändring | Filer att ändra | Följd och kontroll |
| --- | --- | --- |
| Standardtexten i sidfoten | `src/templates/layout.mjs` (texten i `data-cms-shared="footer.tagline"`) och `src/cms/legacy-project.mjs` (`DEFAULT_SHARED_CONTENT`). Tester som hårdkodar texten: `tests/cms-project.test.mjs`, `tests/cms-shared-conflict.test.mjs`, `tests/cms-frame.test.mjs` och `tests/cms-frame-recovery.spec.mjs`. | De två kopiorna måste vara identiska. Annars stoppas bygget av `validateSharedInstances`, som `validateProject` kör i `scripts/build-cms.mjs`. `scripts/build-cms.mjs` använder `DEFAULT_SHARED_CONTENT` för seed och startprojekt, så nya projekt och version 0 får den nya texten. Publicerade revisioner behåller sin lagrade sidram. Inloggningssidan (`src/cms/templates.mjs`) och mejlen (`src/server/email-render.mjs`) har egna texter och påverkas inte. |
| Nytt CMS-redigerbart gemensamt fält | Tolkning: gemensamt innehåll med `data-cms-shared`, inte temavariabler. Ändra mallen som renderar elementet (till exempel `src/templates/layout.mjs`), `DEFAULT_SHARED_CONTENT` i `src/cms/legacy-project.mjs` och `validateFrame` i `src/cms/frame.mjs`. `validateFrame` tillåter idag bara nyckeln `footer.tagline` och kräver exakt en förekomst av den. Rubriken för konflikter ligger i `src/cms/client/api.mjs`. | Lagrade sidramar saknar den nya platsen. Ett krav på exakt en förekomst stoppar dem, så den nya nyckeln behöver en migrering som skriver platsen i lagrade sidramar eller vara valfri i `validateFrame`. `frame-converter.mjs` avvisar också bakåtkonvertering av en sidram som saknar en seedad nyckel. Nyckelmönstret kontrolleras i `src/cms/validation.mjs`. Jämför med `tests/shared-content-lifecycle.test.mjs`. Fält i sidinnehållet, alltså utanför sidramen, omfattas inte av denna tabell. |
| Stil för en publik komponent | `src/styles/*.css`. `base.css` ingår i alla mallar, `home.css` och `pages.css` i alla utom SKIFT. Övriga filer läggs till per mall i `additions` i `scripts/build.mjs`. | Sidskalet länkar till aktuell build, så publicerade CMS-sidor får ändringen efter deploy utan Save (`src/cms/render.mjs`). CSS-budgetarna kontrolleras av `tests/assets.test.mjs`. |
| Markup i en publik komponent | `src/templates/*.mjs` och `src/templates/layout.mjs`. | Statiska sidor, alltså version 0 och sidor före första publicering, följer bygget. På publicerade sidor kommer `<head>` från `layout()` i den build som körs, medan sidans kropp och sidramen kommer från revisionen. En vanlig Save skriver inte om sidramen från mallen, så ändringen når publicerade sidor först när sidramen ändras i studion eller en migrering skriver nya revisioner. Sidornas kontrakt kommer från seed (`preparePage` i `scripts/build-cms.mjs`), så en ändring i seed ändrar också `studioKey`. Kontroll: `tests/cms-template-drift.test.mjs`. |
| Uppdatera SKIFT | `games/skift/` (spelet, `index.html`, texterna i `src/i18n.js`, `games/skift/scripts/build-portfolio.mjs`), `games/skift/src/page.mjs` (sidskal i portföljbygget), `src/styles/skift.css`, `src/content/skift.mjs` (adress och menylänk) och `src/csp.mjs` (`SKIFT_CSP`). | Spelsidans kropp kommer från bygget. `normalizeSkiftProject` i `legacy-project.mjs` tar bort lagrade kopior av spelsidan, och Save avvisar redigering av den (`admin-site.mjs`). Speltexterna är ett undantag: `games/skift/src/copy.mjs` gör dem till `runtime.skift.*`, och lagrade värden går före seed (`src/cms/project.mjs`, `games/skift/src/ui.js`). En ändrad standardtext för en befintlig nyckel når därför inte publicerade sidor förrän texten ändras i studion. Nya nycklar läggs till av `normalizeSkiftProject` och publiceras vid nästa Save. Dynamiska värden i klamrar måste stämma med seed. Kontroller: `node --test --test-concurrency=1 games/skift/tests/*.test.mjs`, `tests/skift*.test.mjs` och `npm run test:skift`. |
| Ny migrering | `migrations/NNNN_<namn>.sql`, med nästa nummer efter `0014`. | Körs i namnordning i lokala tester (`tests/helpers/cms-runtime.mjs`, `tests/helpers/cms-node.mjs`) och i release-grindens lokala SQLite (`scripts/cms-pull-release.mjs`). Driftsättningen kör `wrangler d1 migrations apply CMS_DB --remote` efter grinden och före `wrangler deploy` (`package.json`, `tests/cms-hotfix.test.mjs`). Nya tabeller som ska ingå i säkerhetskopiedrillen läggs till i de två listorna i `tests/cms-backup-drill.test.mjs`. Ändras kolumnerna i `cms_studio_heads` eller `cms_studio_text` ska `src/cms/studio-store.mjs`, `src/cms/cpu-migration.mjs` och `releaseVerdict` i `scripts/cms-pull-release.mjs` granskas. |
| Ny validering vid Save | Projektregel: `src/cms/project.mjs` (`validateProjectWithReferences`). HTML och CSS: `src/cms/validation.mjs`. Ram: `src/cms/frame.mjs`. | Samma regel körs av Save, Validate, förhandsvisning, återställning och migreringar (`admin-site.mjs`). Deltaformatet validerar bara formen (`project-changes.mjs`), och projektregler körs efter att ändringarna tillämpats. Ändrar regeln vilka sparade bevis som är giltiga: höj `VALIDATION_POLICY` i `validation.mjs`, uppdatera strängen i `tests/cms-frame-ids.test.mjs` och lägg den gamla strängen bland de gamla policyerna i `tests/cms-manipulation.test.mjs`. Ändringar i valideringskoden ändrar också `studioKey`, eftersom `scripts/build-cms.mjs` hashar de moduler som projektvalideringen använder. Release-grinden kör projektvalideringen mot huvudversionen vid deploy och mot historiken med `--all` i det manuella jobbet `stored-revisions` (`compatibility.mjs`, `scripts/cms-pull-release.mjs`). Om huvudversionen inte klarar regeln blockeras deploy. Historiska fel tolereras bara om exakt samma fel finns i den granskade listan (`gateFailures`). |

## Drift och verifiering

- [Driftsättning](DEPLOYMENT.md): deploy-kedjan `npm run deploy:cloudflare`, migreringar, återställning.
- [CPU-migrering](CMS-CPU-MIGRATION.md): förberedelse och uppdatering av kanonisk studiolagring.
- [Ramflytt](CMS-FRAME-MIGRATION.md): övergång mellan schema 1 och 2.
- [Säkerhetsgränser](CMS-SECURITY.md): identitet, skrivgränser och driftgränser.
- [QA-guiden](QA.md): kommandon, CI-jobb och verifieringsgränser.
