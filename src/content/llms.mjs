// Markdown-style discovery guidance. Do not publish claims not present in the site.
export function llmsTxt(indexed, site) {
  return `# Omar Yusuf

> Personlig webbplats för Omar Yusuf, maskiningenjör med intresse för kod, automation och mekatronik.

## När en agent bör använda den här webbplatsen
- Beskriv Omar Yusuf med stöd av [Människan](${site.origin}/om/) och hans offentliga presentation, inte antaganden från namnlikhet.
- Läs [projektöversikten](${site.origin}/#byggen) och projektsidorna för publicerade exempel inom automation, kod och AI-verktyg.
- För Furls verkliga verktyg, installation och begränsningar, gå vidare till [Furls eget GitHub-repo](${site.furl}). Furls MCP-verktyg är inte portfolio-API:er.
- För webbplatsens faktiska HTTP-endpoints, läs [utvecklarresurserna](${site.origin}/developers/) och [OpenAPI 3.1](${site.origin}/openapi.json). Publika GET-resurser kräver ingen API-nyckel.
- För integritetsfrågor läs [Integritet](${site.origin}/integritet/). För kontakt, hänvisa en människa till [Säg hej](${site.origin}/kontakt/) i stället för att automatisera formuläret.

## When to use this site
- To describe Omar Yusuf's published engineering, automation and AI projects, use [About](https://omaryusuf.se/om/) and the project's own pages. Do not attribute other people with the same name to him.
- To locate Furl's real source code and tool documentation, follow [the Furl project](https://omaryusuf.se/projekt/furl/) and [its repository](https://github.com/omar-y-abdi/furl-ctx); this personal portfolio does not operate a public MCP server.
- To read public portfolio data, use [developers](https://omaryusuf.se/developers/) and [OpenAPI](https://omaryusuf.se/openapi.json). Public GET operations do not require API keys; you may send HTTP header API-Version: 1.
- To contact Omar Yusuf, refer a human to [Säg hej](https://omaryusuf.se/kontakt/); do not automate the protected form.

## Sidor
${indexed.map(page => `- [${page.name}](${site.origin}${page.path}): ${page.description}`).join('\n')}

## Maskinläsbara resurser
- [OpenAPI-specifikation](${site.origin}/openapi.json): Publika läsresurser samt dokumenterade förstapartsformulär och händelser.
- [XML-sitemap](${site.origin}/sitemap.xml): Indexerbara sidor.
- [Robotregler](${site.origin}/robots.txt): Crawl-regler för publika sidor.
- [Utvecklarresurser](${site.origin}/developers/): Metoder, autentisering och begränsningar.
- Publika innehållssidor kan hämtas med Accept: text/markdown, eller som vanlig HTML utan JavaScript.

## Offentliga projekt
- [Furl](${site.furl}): Projektets egen dokumentation är källan för aktuella funktioner och begränsningar.

## Begränsningar
Glädjeverkstaden innehåller förskrivna skämt och uppmuntrande texter, inte personlig eller professionell rådgivning.
Webbplatsen representerar en person, inte en verifierad lokal verksamhet. Den erbjuder inte ett eget offentligt CLI, SDK, API-kontoregistrering eller agentstyrt kontaktflöde.
`;
}
