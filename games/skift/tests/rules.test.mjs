import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, tick, dash, pulse, hurt, award, collect, finishSector, upgrade, sanitizeSave, saveRun, loadSave, rank } from '../src/rules.js';

test('new run starts with complete, independent state', () => {
  const a = createRun(), b = createRun();
  assert.equal(a.hp, 5); assert.equal(a.sector, 0); assert.equal(a.cells.size, 0);
  a.cells.add('a'); assert.equal(b.cells.size, 0);
});
test('assist affects health rather than granting completed objectives', () => {
  const a = createRun('assist'); assert.equal(a.maxHp, 8); assert.equal(a.cells.size, 0);
});
test('dash cooldown blocks repeated activation and expires on simulated time', () => {
  const a = createRun(); assert.equal(dash(a), true); assert.equal(dash(a), false);
  tick(a, 0.1); assert.equal(a.dashing > 0, true);
  for (let i=0;i<90;i++) tick(a, 1/60);
  assert.equal(a.dashing, 0); assert.equal(dash(a), true);
});
test('negative or nonfinite elapsed time does not corrupt state', () => {
  const a=createRun(); for(const dt of [-1,NaN,Infinity]) tick(a,dt);
  assert.equal(a.time,0); assert.equal(a.hp,5);
});
test('time is independent of rendered framerate', () => {
  const a=createRun(), b=createRun();
  for(let i=0;i<600;i++)tick(a,1/60);
  for(let i=0;i<300;i++)tick(b,1/30);
  assert.ok(Math.abs(a.time-b.time)<1e-8);
});
test('dash invulnerability, damage invulnerability and death clamp', () => {
  const a=createRun(); dash(a); assert.equal(hurt(a,1),false);
  for(let i=0;i<90;i++)tick(a,1/60);
  assert.equal(hurt(a,1),true); assert.equal(hurt(a,1),false); assert.equal(a.hp,4);
  for(let i=0;i<100;i++)tick(a,1/60);
  hurt(a,100); assert.equal(a.hp,0); assert.equal(a.dead,true); assert.equal(dash(a),false);
});
test('pulse is bounded and cannot fire after death', () => {
  const a=createRun(); assert.equal(pulse(a),true); assert.equal(pulse(a),false);
  a.dead=true; a.pulseCooldown=0; assert.equal(pulse(a),false);
});
test('cell collection is idempotent', () => {
  const a=createRun(); assert.equal(collect(a,'cell-1'),true); const s=a.score;
  assert.equal(collect(a,'cell-1'),false); assert.equal(a.score,s); assert.equal(a.cells.size,1);
});
test('combo has a cap and expires', () => {
  const a=createRun(); for(let i=0;i<50;i++)award(a,100);
  assert.ok(a.combo<=8); for(let i=0;i<500;i++)tick(a,1/60); assert.equal(a.combo,0);
});
test('exit is locked until all cells, and final exit requires boss', () => {
  const a=createRun(); assert.equal(finishSector(a),false);
  for(let i=0;i<3;i++)collect(a,`c${i}`); assert.equal(finishSector(a),true);
  a.sector=2; a.ended=false; a.bossDefeated=false; assert.equal(finishSector(a),false);
  a.bossDefeated=true; assert.equal(finishSector(a),true); assert.equal(a.won,true);
});
test('upgrades are validated and are not duplicated', () => {
  const a=createRun(); assert.equal(upgrade(a,'hax'),false);
  assert.equal(upgrade(a,'pulse'),true); assert.equal(upgrade(a,'pulse'),false);
  assert.deepEqual(a.upgrades,['pulse']);
});
test('save validation rejects hostile shape, infinite fields and unknown upgrades', () => {
  for (const x of [null,[],5,{}, {version:9}, {version:1,unlocked:Infinity}]) {
    const s=sanitizeSave(x); assert.equal(s.version,1); assert.ok(s.unlocked>=0&&s.unlocked<=2);
  }
  const s=sanitizeSave({version:1,unlocked:99,best:-1,checkpoint:{sector:99,upgrades:['bad']}});
  assert.equal(s.unlocked,2); assert.equal(s.best,0); assert.equal(s.checkpoint,null);
});
test('blocked storage and broken JSON degrade to usable defaults', () => {
  assert.equal(loadSave({getItem(){throw Error('blocked')}}).unlocked,0);
  assert.equal(loadSave({getItem(){return '{broken'}}).best,0);
  assert.equal(saveRun({setItem(){throw Error('full')}},sanitizeSave(null)),false);
});
test('ranks have deterministic, bounded thresholds', () => {
  assert.equal(rank(0),'C'); assert.equal(rank(100000),'S');
});

test('resuming keeps checkpoint difficulty when the next-run preference changes', () => {
  const checkpoint={sector:1,score:900,time:20,upgrades:['pulse'],difficulty:'normal'};
  const saved=sanitizeSave({version:1,unlocked:1,checkpoint,settings:{difficulty:'assist'}});
  assert.equal(saved.checkpoint.difficulty,'normal');
  const resumed=createRun('assist',saved.checkpoint);
  assert.equal(resumed.difficulty,'normal');assert.equal(resumed.hp,5);
  assert.equal(resumed.sector,1);assert.equal(resumed.score,900);
});
test('unknown checkpoint difficulty cannot introduce an unsupported mode', () => {
  const saved=sanitizeSave({version:1,unlocked:0,checkpoint:{sector:0,difficulty:'impossible'},settings:{difficulty:'assist'}});
  assert.equal(saved.checkpoint.difficulty,'assist');
});
