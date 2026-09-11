export const site = Object.freeze({
  name: 'Omar Yusuf',
  origin: 'https://omaryusuf.se',
  github: 'https://github.com/omar-y-abdi',
  furl: 'https://github.com/omar-y-abdi/furl-ctx',
  updated: '11 september 2026',
});
export const routes = Object.freeze([
  { path: '/', name: 'Hem', title: 'Omar Yusuf | Teknik med hjärna. Lite bus i systemet.', description: 'Omar Yusufs lilla del av internet. Upptäck projekt, lek i glädjeverkstaden och möt en maskiningenjör med nyfikenhet för kod och detaljer.', template: 'home' },
  { path: '/verkstad/', name: 'Glädjeverkstaden', title: 'Glädjeverkstaden | En liten paus med Omar Yusuf', description: 'Tryck fram en liten vinst, välj ett skämt och poppa några bubblor. En lekfull, interaktiv paus i Omar Yusufs digitala verkstad.', template: 'workshop' },
  { path: '/om/', name: 'Människan', title: 'Människan bakom knappen | Omar Yusuf', description: 'Möt Omar Yusuf. Maskinteknik, kod, automation och en stor dos nyfikenhet. Här finns människan bakom projekten och glädjeverkstaden.', template: 'about' },
  { path: '/projekt/furl/', name: 'Furl', title: 'Furl | Kontextkomprimering för AI-agenter | Omar Yusuf', description: 'Furl komprimerar stora verktygssvar för AI-agenter och gör originalinnehållet tillgängligt för senare hämtning. Läs om Omar Yusufs öppna projekt.', template: 'furl' },
  { path: '/kontakt/', name: 'Säg hej', title: 'Säg hej | Kontakt med Omar Yusuf', description: 'En idé, ett projekt eller en fråga om Furl? Hitta Omar Yusufs offentliga GitHub-profil och projekt. Börja ett samtal utan kontaktformulär.', template: 'contact' },
  { path: '/integritet/', name: 'Integritet', title: 'Integritet och personuppgifter | Omar Yusuf', description: 'Så hanteras integritet på omaryusuf.se. Läs om samtycke, begränsad besöksstatistik, tekniska uppgifter och dina möjligheter att göra egna val.', template: 'privacy' },
  { path: '/kakor/', name: 'Kakor', title: 'Kakor och dina val | Omar Yusuf', description: 'Vilka kakor som används på omaryusuf.se, vad de gör och hur länge de sparas. Ändra eller återkalla ditt val om statistik när som helst.', template: 'cookies' },
  { path: '/villkor/', name: 'Villkor', title: 'Användarvillkor | Omar Yusuf', description: 'Villkor för att använda omaryusuf.se. Information om innehåll, öppna projekt, externa länkar och den lekfulla glädjeverkstaden.', template: 'terms' },
  { path: '/tillganglighet/', name: 'Tillgänglighet', title: 'Tillgänglighet | Omar Yusuf', description: 'Läs om tangentbordsstöd, rörelseinställningar, tydliga kontraster och tillgänglighet på omaryusuf.se. Här kan du också rapportera problem.', template: 'accessibility' },
  { path: '/404.html', name: 'Sidan saknas', title: '404. Sidan tog fikapaus | Omar Yusuf', description: 'Den här sidan verkar ha tagit fikapaus. Hitta tillbaka till Omar Yusufs startsida eller ta en liten omväg genom glädjeverkstaden.', template: 'notFound', noindex: true },
]);
