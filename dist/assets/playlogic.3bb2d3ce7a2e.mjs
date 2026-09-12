export function bubbleComment(times, remaining) {
  if (!remaining) return 'Alla poppade. Inget blev gjort. Det var hela poängen.';
  if (times.length < 2) return 'Ingen brådska.';
  const recent = times.slice(-5);
  const average = (recent.at(-1)-recent[0])/(recent.length-1);
  const fast = ['Lugn, det är bubblor. Inte ett akutärende.','Bubblorna har ingen avgångstid. Andas.','Fingret vann. Resten av kroppen får komma ikapp.'];
  const slow = ['Ska vi boka nästa popp i kalendern?','Bubblan hinner snart fylla år.','En bubbla i taget. En årstid i taget.'];
  const steady = ['Fint tempo. Helt utan prestationssamtal.','Det där var ett väl avvägt popp.','Ingen produktivitet i sikte. Utmärkt.'];
  return (average < 450 ? fast : average > 2200 ? slow : steady)[remaining % 3];
}
export function fikaResult(elapsed) {
  const seconds = (Math.max(0,elapsed)/1000).toFixed(2).replace('.',',');
  const error = Math.abs(elapsed-5000);
  const comment = error <= 150 ? 'Där satt den. Din inre äggklocka vill ha löneförhöjning.'
    : error <= 600 ? 'Lagom bryggt. Det här kan du ta en fika på.'
    : elapsed < 3500 ? 'Lite väl espresso. Koppen hann knappt säga hej.'
    : elapsed < 5000 ? 'En liten tjuvstart på kaffet. Fullt förståeligt.'
    : elapsed < 7500 ? 'En påtår hann nästan med. Prova igen?'
    : 'Kaffet hann kallna och skaffa sig ett fritidsintresse.';
  return { seconds, comment };
}
export function shuffledPairs(random = Math.random) {
  const values = [...Array(6).keys(), ...Array(6).keys()];
  for (let i=values.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
  return values;
}
