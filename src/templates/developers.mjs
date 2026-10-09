import { breadcrumb } from './components.mjs';
import { site } from '../content/site.mjs';

export function developers(page) {
  return `<div class="section-wrap legal-wrap">${breadcrumb(page)}
  <header class="legal-heading"><p class="eyebrow">ÖPPNA RESURSER / FAKTISKA GRÄNSSNITT</p>
  <h1>För utvecklare<br>och AI-agenter.</h1>
  <p class="large-lead">Så kan du läsa Omar Yusufs portfolio och hitta projektdokumentation utan att gissa vilka funktioner som finns.</p>
  </header>
  <div class="legal-content">
  <section><h2>Vad webbplatsen erbjuder</h2>
  <p>Det här är en personlig portfolio, inte en tjänst där användare skapar API-konton. Innehållet om maskinteknik, automation, mekatronik och webbutveckling finns i de offentliga sidorna. Projektet Furl har sin egen källkod och tekniska dokumentation på <a href="${site.furl}">GitHub</a>. Inga prestandapåståenden eller installationer ska antas utifrån den här portfolion.</p>
  <p>Hämta den <a href="/openapi.json">maskinläsbara OpenAPI 3.1-beskrivningen</a> för de JSON-endpoints som webbplatsen faktiskt använder. Den beskriver datatyper, metoder, fel och åtkomstkrav.</p></section>
  <section><h2>Snabbstart utan API-nyckel</h2>
  <p>För publik läsning behövs ingen inloggning: <code>GET /api/config</code> visar om frivillig statistik är aktiverad, <code>GET /api/contact/config</code> visar om kontaktformuläret kan användas och <a href="/data/cards.json"><code>GET /data/cards.json</code></a> ger verkstadens förskrivna kort. <code>GET /data/runtime.json</code> ger publicerade verkstadsinställningar.</p>
  <p>Begär <code>Accept: text/markdown</code> på samma adress som den vanliga sidan för Markdown, eller <code>Accept: text/html</code> för original-HTML. Läs också <a href="/llms.txt">llms.txt</a>, <a href="/sitemap.xml">sitemap.xml</a> och <a href="/robots.txt">robots.txt</a>. Ingen JavaScript-körning krävs för sidtexten.</p></section>
  <section><h2>Åtkomst och begränsningar</h2>
  <p><strong>Ingen publik API-nyckel</strong>, SDK, CLI eller öppet skriv-sandbox finns för denna portfolio. Ägarens redigeringsstudio under <code>/admin/</code> är skyddad av Cloudflare Access och ingår inte i det publika API:et. Hitta inte på en åtkomsttoken eller automatisera ägarfunktioner.</p>
  <p><code>POST /api/contact</code> är det befintliga kontaktformuläret för människor, inte ett fritt meddelande-API. Det kräver samma ursprung, en giltig Turnstile-kontroll, engångs-ID och konfigurerad mejlleverans. Servern begränsar till fem försök per 60 sekunder per hashad IP-adress respektive avsändaradress. <code>Retry-After</code> ges vid 429; den publicerade kvotpolicyn beskrivs med <code>RateLimit-Policy</code>. Det finns inga verifierade återstående kvoter att rapportera för lyckade anrop.</p>
  <p><code>POST /api/event</code> används endast för frivillig, uttryckligen godkänd besöksstatistik från webbplatsens egna sidor. Automatiserade agenter ska inte skicka händelser. Läs <a href="/integritet/">integritet</a> och <a href="/kakor/">kakor</a> för hur samtycke fungerar.</p></section>
  <section><h2>När ska en agent använda sidan?</h2>
  <p>Använd <a href="/om/">personpresentationen</a> för att beskriva Omar Yusuf, <a href="/#byggen">projektsidorna</a> för att hitta publicerade exempel och <a href="/projekt/furl/">Furls projektsida</a> för att hitta länken till dess faktiska dokumentation. Använd <a href="/kontakt/">kontaktsidan</a> när en människa behöver ta kontakt. Använd inte verkstadskort som personliga råd eller en marknadsföringstext som API-kontrakt.</p>
  <p>Om du vill bidra till ett öppet projekt, följ dess egna GitHub-instruktioner. Den här portfolion erbjuder inte en generell transaktionsfunktion, produktkatalog eller egen server för agentverktyg.</p></section>
  </div></div>`;
}
