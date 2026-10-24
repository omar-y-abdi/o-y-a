import test from 'node:test';
import assert from 'node:assert/strict';
import {Physics,GROUP} from '../src/physics.js';
test('Cannon contact resolution blocks a maximum-speed dash through a thin wall',()=>{
  const physics=new Physics({obstacles:[{x:0,z:0,w:.5,d:8}]});
  const body=physics.actor(-4,0,.52);
  for(let i=0;i<90;i++){body.velocity.set(25,0,0);physics.step(1/60);}
  assert.ok(body.position.x<-.6,`tunnelled to ${body.position.x}`);
});
test('deck boundaries retain a moving actor over a long run',()=>{
  const p=new Physics({obstacles:[]}),b=p.actor(0,0);
  for(let i=0;i<600;i++){b.velocity.set(20,0,20);p.step(1/60);}
  assert.ok(b.position.x<14&&b.position.z<12);
});
test('projectile ray query sees walls, not actor bodies',()=>{
  const p=new Physics({obstacles:[{x:2,z:0,w:1,d:2}]});p.actor(0,0);
  assert.equal(p.obstructed(-1,0,1,0),false);assert.equal(p.obstructed(0,0,4,0),true);
});
test('player and enemy bodies are solid to each other, enemies still overlap each other',()=>{
  const p=new Physics({obstacles:[]});
  const hero=p.actor(0,0,.52,GROUP.player,GROUP.wall|GROUP.enemy),a=p.actor(4,0,.48),b=p.actor(-4,0,.48),c=p.actor(-4.2,0,.48);
  let minHeroEnemy=9,minEnemyEnemy=9;
  for(let i=0;i<240;i++){hero.velocity.set(0,0,0);a.velocity.set(-2.5,0,0);b.velocity.set(2.5,0,0);c.velocity.set(2.5,0,0);p.step(1/60);
    minHeroEnemy=Math.min(minHeroEnemy,Math.hypot(hero.position.x-a.position.x,hero.position.z-a.position.z),Math.hypot(hero.position.x-b.position.x,hero.position.z-b.position.z));
    minEnemyEnemy=Math.min(minEnemyEnemy,Math.hypot(b.position.x-c.position.x,b.position.z-c.position.z));}
  assert.ok(minHeroEnemy>=.9,`enemy reached the hero: ${minHeroEnemy}`);
  assert.ok(minEnemyEnemy<.2,`enemies should still overlap: ${minEnemyEnemy}`);
});
test('a dashing player (enemy bit removed from its mask) passes through an enemy',()=>{
  const p=new Physics({obstacles:[]});
  const hero=p.actor(-3,0,.52,GROUP.player,GROUP.wall),e=p.actor(0,0,.48);
  for(let i=0;i<30;i++){hero.velocity.set(24,0,0);e.velocity.set(0,0,0);p.step(1/60);}
  assert.ok(hero.position.x>1,`hero stopped at ${hero.position.x}`);
});
