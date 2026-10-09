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
