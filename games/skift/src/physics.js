import * as CANNON from 'cannon-es';
import {DECK} from './levels.js';

/** Collision groups: actors only collide with walls and the opposing side; enemies pass through each other. */
export const GROUP={enemy:1,player:2,wall:4};
/** cannon-es supplies broadphase, contact resolution and fixed-step integration. */
export class Physics {
  constructor(level) {
    this.world=new CANNON.World({gravity:new CANNON.Vec3(0,0,0),allowSleep:true});
    this.world.broadphase=new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations=8;
    this.world.defaultContactMaterial.friction=0;
    this.world.defaultContactMaterial.restitution=0;
    this.walls=[];
    for(const o of level.obstacles)this.box(o.x,o.z,o.w,o.d);
    const w=DECK.halfWidth,d=DECK.halfDepth;
    this.box(-w-.5,0,1,d*2+2);this.box(w+.5,0,1,d*2+2);
    this.box(0,-d-.5,w*2+2,1);this.box(0,d+.5,w*2+2,1);
    this.from=new CANNON.Vec3();this.to=new CANNON.Vec3();this.rayResult=new CANNON.RaycastResult();
  }
  box(x,z,w,d) {
    const body=new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(w/2,2,d/2)),position:new CANNON.Vec3(x,0,z),collisionFilterGroup:GROUP.wall});
    this.world.addBody(body);this.walls.push(body);return body;
  }
  actor(x,z,radius=.5,group=GROUP.enemy,mask=GROUP.wall|GROUP.player) {
    const body=new CANNON.Body({mass:1,shape:new CANNON.Sphere(radius),position:new CANNON.Vec3(x,.6,z),fixedRotation:true,linearDamping:0,collisionFilterGroup:group,collisionFilterMask:mask,allowSleep:false});
    body.linearFactor.set(1,0,1);body.angularFactor.set(0,0,0);this.world.addBody(body);return body;
  }
  step(dt) { this.world.step(1/60,Math.min(Math.max(dt,0),.05),3); }
  remove(body) { if(body.world===this.world)this.world.removeBody(body); }
  obstructed(ax,az,bx,bz) {
    this.from.set(ax,.6,az);this.to.set(bx,.6,bz);this.rayResult.reset();
    return this.world.raycastClosest(this.from,this.to,{collisionFilterMask:4,skipBackfaces:true},this.rayResult);
  }
}
