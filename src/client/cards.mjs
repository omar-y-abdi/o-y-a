export const CARDS = Object.freeze([
  { id:'k01', flavor:'kind', text:'Du behöver inte vara allas kopp te. Du kanske är någons bästa kopp kaffe.' },
  { id:'k02', flavor:'kind', text:'Det är helt okej att vara ett pågående projekt. De bästa sakerna är det.' },
  { id:'k03', flavor:'kind', text:'Du tog dig hit. Det räcker som dagens lilla vinst.' },
  { id:'k04', flavor:'kind', text:'Någonstans finns en hund som skulle bli orimligt glad över att träffa dig.' },
  { id:'k05', flavor:'kind', text:'Du får ta plats. Även när du inte har en PowerPoint redo.' },
  { id:'k06', flavor:'kind', text:'En liten sak i taget är också ett sätt att göra stora saker.' },
  { id:'j01', flavor:'joke', text:'Jag har ett skämt om toleranser. Men det är lite på gränsen.' },
  { id:'j02', flavor:'joke', text:'Min bästa egenskap? Jag kan stänga 38 flikar och fortfarande vara förvirrad.' },
  { id:'j03', flavor:'joke', text:'Det här mötet kunde ha varit en fika. Även om det redan var en fika.' },
  { id:'j04', flavor:'joke', text:'Jag tänkte dra ett skämt om en skruv. Men det blev för invecklat.' },
  { id:'j05', flavor:'joke', text:'Vad kallar en ingenjör en tupplur? Planerat underhåll.' },
  { id:'j06', flavor:'joke', text:'Optimisten ser glaset halvfullt. Ingenjören ser ett onödigt stort glas.' },
  { id:'p01', flavor:'pause', text:'Släpp ner axlarna lite. De behöver inte vara örhängen.' },
  { id:'p02', flavor:'pause', text:'Du behöver inte optimera den här stunden. Den får bara finnas.' },
  { id:'p03', flavor:'pause', text:'Allt som är viktigt låter inte bråttom. Allt som låter bråttom är inte viktigt.' },
  { id:'p04', flavor:'pause', text:'En paus är inte motsatsen till att komma framåt. Den kan vara en del av det.' },
  { id:'p05', flavor:'pause', text:'Titta bort från skärmen en stund. Världen renderar faktiskt ganska bra.' },
  { id:'p06', flavor:'pause', text:'Det är tillåtet att göra något bara för att det är trevligt.' },
].map(Object.freeze));
export const getCard = id => CARDS.find(card => card.id === id) ?? null;
export function nextCard(flavor, previous, random = Math.random) {
  const group = ['kind','joke','pause'].includes(flavor) ? flavor : 'kind';
  const options = CARDS.filter(card => card.flavor === group && card.id !== previous);
  const sample = random();
  const index = Number.isFinite(sample) ? Math.max(0, Math.min(options.length - 1, Math.floor(sample * options.length))) : 0;
  return options[index];
}
