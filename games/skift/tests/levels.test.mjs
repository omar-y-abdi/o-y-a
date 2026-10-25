import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,blocked} from '../src/levels.js';
for(const level of LEVELS) {
  test(`${level.id}: all objectives are reachable with player clearance`,()=>{
    const start=level.start.map(Math.round), seen=new Set([start.join(',')]), queue=[start];
    for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const [x,z]=[queue[i][0]+dx,queue[i][1]+dz],key=`${x},${z}`;
      if(!seen.has(key)&&!blocked(level,x,z,0.6)){seen.add(key);queue.push([x,z]);}
    }
    for(const target of [...level.cells,level.exit])assert.ok(seen.has(target.join(',')),`unreachable ${target}`);
  });
  test(`${level.id}: no spawn, pickup or extraction intersects static scenery`,()=>{
    for(const [x,z] of [level.start,level.exit,...level.cells,...level.scrap,...level.enemies.map(e=>[e.x,e.z])])assert.equal(blocked(level,x,z,0.25),false,`${x},${z}`);
    assert.equal(level.cells.length,3);
  });
}
