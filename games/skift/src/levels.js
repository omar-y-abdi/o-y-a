// Hand-authored play spaces. Positions are x/z on a flat 28 × 24 metre deck.
export const LEVELS = [
  { id:'relay', name:{sv:'Växelhuset',en:'The relay yard'}, subtitle:{sv:'Väck verkstaden.',en:'Wake the workshop.'},
    color:'#aebdad', accent:'#234ce7', edge:'#668d83', ground:'#e9e2d1', number:'01',
    start:[-10,8], exit:[10,-8], cells:[[-10,-7],[1,8],[10,3]],
    obstacles:[{x:0,z:0,w:5,d:4,type:'turbine'},{x:-8,z:1,w:3,d:2,type:'crate'},{x:7,z:-4,w:3,d:3,type:'tank'},{x:5,z:7,w:2,d:2,type:'crate'}],
    enemies:[{type:'chaser',x:-9,z:-5},{type:'chaser',x:8,z:4},{type:'shooter',x:8,z:-8},{type:'chaser',x:1,z:7}],
    scrap:[[-12,3],[-11,-2],[-7,-9],[-3,-8],[3,-8],[10,-2],[12,6],[7,9],[-4,7],[-4,3]],
    hazards:[], par:95,
  },
  { id:'coolant', name:{sv:'Kylverket',en:'The cooling works'}, subtitle:{sv:'Håll huvudet kallt.',en:'Keep your cool.'},
    color:'#a7c4bc',accent:'#ec7853',edge:'#4d807c',ground:'#dde8e1',number:'02',
    start:[-10,8],exit:[10,-8],cells:[[-10,-8],[10,7],[1,-9]],
    obstacles:[{x:-4,z:2,w:3,d:6,type:'tank'},{x:5,z:-1,w:3,d:6,type:'tank'},{x:-5,z:-7,w:4,d:2,type:'crate'},{x:3,z:7,w:3,d:2,type:'crate'}],
    enemies:[{type:'charger',x:-10,z:-4},{type:'shooter',x:10,z:1},{type:'charger',x:7,z:8},{type:'chaser',x:-1,z:-7},{type:'shooter',x:5,z:-8}],
    scrap:[[-12,2],[-12,-5],[-8,-10],[-1,-6],[1,-2],[1,2],[8,6],[12,9],[12,3],[-7,8],[-6,5]],
    hazards:[{x:0,z:3,w:3,d:0.6,period:4.4,offset:0},{x:8,z:-5,w:6,d:0.6,period:4.4,offset:2.2}],par:115,
  },
  { id:'heart',name:{sv:'Maskinhjärtat',en:'The machine heart'},subtitle:{sv:'Ett sista ryck.',en:'One last spark.'},
    color:'#d5c693',accent:'#cf6e4d',edge:'#8c946e',ground:'#ece2cd',number:'03',
    start:[-10,8],exit:[10,-8],cells:[[-10,-7],[10,6],[0,8]],
    obstacles:[{x:-6,z:0,w:2,d:4,type:'crate'},{x:6,z:0,w:2,d:4,type:'crate'},{x:0,z:3,w:3,d:1.4,type:'crate'}],
    enemies:[{type:'charger',x:-9,z:-4},{type:'shooter',x:10,z:2},{type:'chaser',x:-1,z:7}],
    scrap:[[-12,2],[-11,-9],[-7,-9],[7,-9],[12,-3],[12,8],[6,9],[-6,9]],hazards:[],boss:[0,-4],par:155,
  }
];
export const DECK={halfWidth:14,halfDepth:12};
export function blocked(level,x,z,padding=0.6) {
  if(Math.abs(x)>DECK.halfWidth-padding||Math.abs(z)>DECK.halfDepth-padding)return true;
  return level.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+padding && Math.abs(z-o.z)<o.d/2+padding);
}
