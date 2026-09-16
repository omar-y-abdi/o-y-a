const FLAVORS=new Set(['kind','joke','pause','roast']);
const STATES=new Set(['active','archived','trash']);
const ID=/^[a-z0-9-]{1,80}$/;
const MEDIA=/\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg|gif|webp|avif|woff2|svg)/g;
const stateOf=card=>card.state??'active';
function assertCard(card){
  if(!card||typeof card!=='object'||!ID.test(card.id)||!FLAVORS.has(card.flavor)||typeof card.text!=='string'||!card.text.trim()||card.text.length>500||!STATES.has(stateOf(card)))throw new Error('Vinstpaketet innehåller en ogiltig vinst.');
  if(card.design!==undefined){if(!card.design||typeof card.design!=='object'||typeof card.design.html!=='string'||typeof card.design.css!=='string'||card.design.html.length>500000||card.design.css.length>500000)throw new Error('Vinstpaketet innehåller en ogiltig design.');}
}
function assertPublicFlavors(cards){for(const flavor of FLAVORS)if(!cards.some(card=>card.flavor===flavor&&stateOf(card)==='active'))throw new Error('Varje kategori behöver minst en aktiv vinst.');}
export function filterWins(cards,{state='active',flavor='all',query=''}={}){
  const needle=query.trim().toLowerCase();
  return cards.filter(card=>(state==='all'||stateOf(card)===state)&&(flavor==='all'||card.flavor===flavor)&&(!needle||card.id.toLowerCase().includes(needle)||card.text.toLowerCase().includes(needle)));
}
export function applyWinAction(cards,selected,action,value=''){
  const ids=new Set(selected); if(!ids.size)return cards.map(card=>({...card}));
  const known=new Set(cards.map(card=>card.id)); for(const id of ids)if(!known.has(id))throw new Error('En vald vinst finns inte längre.');
  let result=cards.map(card=>{
    if(!ids.has(card.id))return {...card};
    if(action==='delete'){if(stateOf(card)!=='trash')throw new Error('Bara vinster i papperskorgen kan raderas permanent.');return null;}
    if(action==='archive')return {...card,state:'archived'};
    if(action==='restore')return {...card,state:'active'};
    if(action==='trash')return {...card,state:'trash'};
    if(action==='category'){if(!FLAVORS.has(value))throw new Error('Kategorin är ogiltig.');return {...card,flavor:value};}
    throw new Error('Batchåtgärden är ogiltig.');
  }).filter(Boolean);
  result.forEach(assertCard); assertPublicFlavors(result); return result;
}
export function exportWinPackage(cards,selected){
  const ids=new Set(selected); const picked=cards.filter(card=>ids.has(card.id)).map(card=>({...structuredClone(card),state:stateOf(card)}));
  if(picked.length!==ids.size)throw new Error('En vald vinst finns inte längre.');
  const resources=new Set(); for(const card of picked){assertCard(card);const source=(card.design?.html??'')+'\n'+(card.design?.css??'');for(const match of source.matchAll(MEDIA))resources.add(match[0]);}
  return {format:'omar-wins/v1',cards:picked,resources:[...resources].sort()};
}
export function planWinImport(existing,pkg,{collision='skip',availableResources=new Set(),makeId=()=>`win-${crypto.randomUUID()}`}={}){
  if(!pkg||pkg.format!=='omar-wins/v1'||!Array.isArray(pkg.cards)||!Array.isArray(pkg.resources)||!['skip','replace','copy'].includes(collision))throw new Error('Importpaketet är ogiltigt.');
  const importedIds=new Set(); for(const card of pkg.cards){assertCard(card);if(importedIds.has(card.id))throw new Error('Importpaketet innehåller dubbla ID:n.');importedIds.add(card.id);}
  const missing=pkg.resources.filter(resource=>!availableResources.has(resource)); if(missing.length)throw new Error(`Importpaketet saknar resurser: ${missing.join(', ')}`);
  let cards=existing.map(card=>structuredClone(card)), imported=0; const ids=new Set(cards.map(card=>card.id));
  for(const source of pkg.cards){
    const card=structuredClone(source); card.state=stateOf(card);
    if(ids.has(card.id)){
      if(collision==='skip')continue;
      if(collision==='replace'){cards=cards.map(current=>current.id===card.id?card:current);imported++;continue;}
      let next; do{next=makeId();}while(!ID.test(next)||ids.has(next)); card.id=next;
    }
    ids.add(card.id); cards.push(card); imported++;
  }
  assertPublicFlavors(cards); return {cards,imported};
}
