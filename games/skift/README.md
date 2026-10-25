# SKIFT

**Sista skiftet. Full fart.**

Ett originalspel för Omar Yusufs portfolio. En liten underhållsrobot, tre handgjorda 3D-distrikt och ett maskinhjärta som behöver startas om. Undvik attacker, slå tillbaka med dash och puls, samla energiceller och välj uppgraderingar mellan distrikten.

## Spela direkt

Packa upp hela ZIP-filen. På Mac: öppna `START.command`. Alternativt kör detta från den uppackade mappen:

```sh
python3 start.py
```

Webbläsaren öppnas på `http://127.0.0.1:8787/play/skift/`. Om porten är upptagen väljs en ledig port och rätt adress öppnas automatiskt. Stoppa servern med Ctrl+C. På Windows finns `START.bat` (Python 3 behöver vara installerat).

**Spelet är färdigbyggt. Node, npm, ffmpeg och internet behövs inte för att spela det lokalt.** Python 3 behövs endast för den lokala webbservern. På en webbplats behövs inte heller Python. Öppna inte HTML-filen direkt via `file://`; använd startfilen eller en vanlig statisk webbserver.

På den befintliga Mac-installationen ligger projektet i `/Users/k/dev/o-y-a game`.

## Kontroller

| Handling | Tangentbord / mus | Touch |
| --- | --- | --- |
| Förflyttning | WASD eller piltangenter | Vänster styrspak |
| Dash | Mellanslag, Shift eller höger musknapp | DASH |
| Puls | J, K, E eller vänster musknapp | PULS |
| Paus | Escape eller pausknappen | Pausknappen |

Dash ger ett kort skydd och skadar fiender du passerar. Puls skadar närliggande fiender och vänder fientliga projektiler. Läs fiendernas röda förvarningar. Samla tre blå energiceller och ta dig till utgången. I sista distriktet måste maskinhjärtat också besegras. Kärnan kan skadas när den är öppen.

Gula skrotdelar, snabba avslut och obrutna kombinationer höjer poängen. En energicell återställer ett hälsosteg. Assistläge ger mer hälsa och mindre aggressiva attacker, men samma banor och slutmål. Byte av svårighetsgrad gäller en ny omgång; en fortsatt sparning behåller sin ursprungliga svårighetsgrad.

Framsteg sparas vid **början av varje distrikt**, inte efter varje steg. Efter omladdning fortsätter du från distriktets start. Blockerad lokal lagring hindrar inte spelandet, men då kan framsteg inte sparas. Sparningen tillhör webbläsaren och adressen, så byte av lokal port eller domän ger en separat sparning.

## Belastning och tillgänglighet

Standardläget är **Eco, 30 FPS**, med högst en miljon renderade pixlar även på en 4K-skärm. Läget **60 FPS** finns i inställningarna och använder en högre pixelbudget. Fysiken använder ett fast tidssteg; dekorativa effekter är begränsade. Pausade och dolda spel fortsätter inte simulera. Startskärmens korta animation somnar efter tio sekunder.

Svenska och engelska ingår. Ljud, musik och dekorativ rörelse kan stängas av. Menyer har tangentbordsfokus och använder webbläsarens dialogfunktion. Actionspelvärlden är inte en skärmläsarekvivalent upplevelse. En webbläsare med **WebGL 2** krävs; det finns ingen CPU-renderad reservversion.

Mätresultat och deras begränsningar finns i [docs/VERIFICATION.md](docs/VERIFICATION.md). CPU-strypning är inte en fysisk 8 GB-enhet och verifierar inte temperatur eller batteritid.

## För webbplatsen

Den färdiga sidan är `dist/play/skift/index.html`; alla spelresurser ligger under samma katalog och använder relativa sökvägar. Förberedd adress: `/play/skift/`. Läs [integrationsguiden](docs/INTEGRATION.md). Inga repofiler har ändrats och inget har publicerats.

## Utveckling och reproducerbara tester

Node.js 20 eller senare behövs bara för utveckling:

```sh
npm ci
npm test
npm run build
npm run dev
```

`npm run dev` bygger, bevakar källfilerna och serverar spelet lokalt. Produktionsspelet behöver inga npm-beroenden på servern: bibliotekskoden ingår redan i bygget.

För browser-E2E används Google Chrome samt Playwrights Firefox och WebKit. Installera Chrome om det saknas. Installera testmotorerna med `npx playwright install firefox webkit`. Linux kan också behöva Playwrights systemberoenden (`npx playwright install-deps`). Testverktygens installation är inte ett krav för att spela spelet.

```sh
npm run test:e2e     # Enhetstester, bygge, browser-, input- och livscykeltester
npm run test:all     # Även två kompletta kampanjer, browsermatris och prestandaprov
npm run test:package # ZIP-integritet, filmanifest och portabel struktur
npm run release     # Bygge, tester, ZIP och browserprov av den uppackade ZIP-filen
npm run test:release # Upprepa browserprovet på den senaste ZIP-filen
```

Testskripten startar en egen loopback-server på en ledig port och stänger den efteråt. `evidence/` innehåller rapporter och skärmbilder. `?qa=1` aktiverar endast läsbara diagnoser; där finns inga teleport-, odödlighets- eller vinstkommandon.

Modellerna skapas från originalgeometri i `src/art.js`, inte från importerade spel. Ljuden och musiken är färdigbyggda i `public/audio/`; `npm run assets` återskapar dem med Python 3 och ffmpeg. ffmpeg behövs aldrig för normal spelstart.

## Innehåll

`dist/` är den körbara sidan. `src/` är spelets källkod. `public/` innehåller ikonen och det färdiga ljudet. `tests/` och `scripts/` innehåller kontroller, bygge och paketering. `docs/` innehåller design, arbetsplan, verifiering och integration. `CREDITS.md` och de medföljande bibliotekslicenserna redovisar ursprung och beroenden.

ZIP-filen innehåller ett SHA-256-manifest för varje fil. `node_modules`, webbläsarinstallationer, macOS-metadata och tillfälliga arbetsfiler ingår inte.
