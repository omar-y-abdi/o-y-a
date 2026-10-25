import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';

/** The real Game and Physics with a silent view/sound: only rendering and audio are stubbed. */
const silentView=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
const silentSound={play(){}};

function bossScene(vulnerable) {
  const g=new Game(silentView(),silentSound,()=>{});
  g.newRun('normal',{sector:2,difficulty:'normal',score:0,time:0,upgrades:[]});
  assert.ok(g.bossState,'sector 2 has the boss');
  for(const e of g.enemies)g.physics.remove(e.body);
  g.enemies=[];
  g.state.invulnerable=0;g.bossState.vulnerable=vulnerable;
  g.player.position.set(g.bossState.x,.6,g.bossState.z+2.1); // inside the contact distance 1.6+.52+.12
  return g;
}
const gap=g=>Math.hypot(g.player.position.x-g.bossState.x,g.player.position.z-g.bossState.z);

test('boss contact costs exactly one hp and knocks the hero away from the boss', () => {
  const g=bossScene(0),hp=g.state.hp,before=gap(g);
  for(let i=0;i<30;i++)g.step(1/60,{x:0,y:0});
  assert.equal(g.state.hp,hp-1);
  assert.ok(gap(g)-before>=.8,`hero only moved ${gap(g)-before} away from the boss`);
});

test('a vulnerable boss deals no damage and gives no knockback', () => {
  const g=bossScene(5),hp=g.state.hp,before=gap(g);
  for(let i=0;i<30;i++)g.step(1/60,{x:0,y:0});
  assert.equal(g.state.hp,hp);
  assert.ok(gap(g)-before<.2,`hero was pushed ${gap(g)-before}`);
});
