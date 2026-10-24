import {Physics} from './physics.js';
import {LEVELS} from './levels.js';
import {createRun,tick,dash,pulse,hurt,award,collect,finishSector,nextSector,upgrade} from './rules.js';
import {PALETTE} from './art.js';
const length=(x,z)=>Math.hypot(x,z);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/** Gameplay-specific orchestration. Collision and rendering belong to their libraries. */
export class Game {
  constructor(view,sound,events) {this.view=view;this.sound=sound;this.events=events;this.state=createRun();this.load();}
  newRun(difficulty,checkpoint=null) {
    this.state=createRun(difficulty,checkpoint);
    if(this.state.upgrades.includes('shield')){this.state.maxHp+=2;this.state.hp=this.state.maxHp;}
    this.load();
  }
  load() {
    this.level=LEVELS[this.state.sector];this.physics=new Physics(this.level);this.view.load(this.level);
    this.player=this.physics.actor(...this.level.start,.52);this.facing=Math.PI;this.moving=false;this.dashVector={x:0,z:-1};
    this.scrap=new Set();this.bullets=[];this.hitDash=new Set();this.elapsed=0;
    this.enemies=this.level.enemies.map((def,i)=>{
      const e={...def,body:this.physics.actor(def.x,def.z,def.type==='charger'?.62:.48),hp:def.type==='charger'?5:3,
        home:{x:def.x,z:def.z},timer:.7+i*.31,telegraph:0,stunned:0,charge:0,dead:false,seed:i,aim:{x:0,z:0},facing:0};this.view.addEnemy(e);return e;
    });
    this.bossState=this.level.boss?{x:this.level.boss[0],z:this.level.boss[1],hp:24,maxHp:24,timer:3,pattern:0,vulnerable:0,waveRadius:0,invulnerable:0,active:false}:null;
    this.checkpoint={difficulty:this.state.difficulty,sector:this.state.sector,score:this.state.score,time:this.state.time,upgrades:[...this.state.upgrades]};
    this.events('loaded',this.checkpoint);
  }
  retry() {this.newRun(this.state.difficulty,this.checkpoint);}
  advance(choice) {if(!this.state.ended||this.state.won)return;upgrade(this.state,choice);nextSector(this.state);this.load();}
  hazardActive(i) {const h=this.level.hazards[i];return (this.state.sectorTime+h.offset)%h.period>h.period*.67;}
  hit(amount=1) {
    if(!hurt(this.state,amount))return;
    this.sound.play('hit');this.view.shake=.22;this.view.wave(this.player.position.x,this.player.position.z,PALETTE.coral,1.8,.3);
    this.events('hit');
    if(this.state.dead){this.player.velocity.set(0,0,0);this.sound.play('fail');this.events('dead');}
  }
  strike(e,damage,stun=.35) {
    if(e.dead)return;e.hp-=damage;e.stunned=stun;e.charge=0;e.telegraph=0;
    this.view.burst(e.body.position.x,e.body.position.z,PALETTE.coral,6);this.sound.play('strike');
    if(e.hp<=0){e.dead=true;this.physics.remove(e.body);this.state.kills++;award(this.state,e.type==='charger'?400:250);this.view.burst(e.body.position.x,e.body.position.z,PALETTE.yellow,12);this.events('kill');}
  }
  strikeBoss(damage) {
    const b=this.bossState;if(!b||b.hp<=0||b.vulnerable<=0||b.invulnerable>0)return;
    b.hp=Math.max(0,b.hp-damage);b.invulnerable=.32;this.sound.play('strike');this.view.burst(b.x,b.z,PALETTE.yellow,10);this.view.shake=.09;
    if(!b.hp){this.state.bossDefeated=true;this.bullets.length=0;b.waveRadius=0;award(this.state,2000);this.sound.play('clear');this.view.wave(b.x,b.z,PALETTE.yellow,9,1.1);this.events('boss');}
  }
  shoot(x,z,dx,dz,speed=5,friendly=false) {
    if(this.bullets.length>=32)return;const l=length(dx,dz)||1;
    this.bullets.push({x,z,vx:dx/l*speed,vz:dz/l*speed,life:5.5,friendly});
  }
  discharge() {
    const s=this.state;if(!pulse(s))return;
    const p=this.player.position,range=s.upgrades.includes('pulse')?4.1:3.4;
    this.view.wave(p.x,p.z,PALETTE.blue,range,.42);this.view.burst(p.x,p.z,PALETTE.paper,5);this.sound.play('pulse');this.events('pulse');
    for(const e of this.enemies)if(!e.dead&&distance(p,e.body.position)<range&&!this.physics.obstructed(p.x,p.z,e.body.position.x,e.body.position.z)){
      this.strike(e,2,.65);const dx=e.body.position.x-p.x,dz=e.body.position.z-p.z,l=length(dx,dz)||1;e.body.velocity.set(dx/l*5,0,dz/l*5);
    }
    for(const b of this.bullets)if(!b.friendly&&distance(p,b)<range){b.vx*=-1.7;b.vz*=-1.7;b.friendly=true;b.life=3;}
    if(this.bossState&&distance(p,this.bossState)<range+1.1)this.strikeBoss(3);
  }
  step(dt,control) {
    const s=this.state;if(s.dead||s.won||s.ended)return;
    dt=clamp(dt,0,.05);tick(s,dt);this.elapsed+=dt;
    let ix=control.x||0,iy=control.y||0,mag=length(ix,iy);if(mag>1){ix/=mag;iy/=mag;mag=1;}
    let dx=(ix+iy)*Math.SQRT1_2,dz=(iy-ix)*Math.SQRT1_2;
    if(mag>.1)this.facing=Math.atan2(dx,dz);
    if(control.dash&&dash(s)){
      if(mag<.1){dx=Math.sin(this.facing);dz=Math.cos(this.facing);}
      const l=length(dx,dz)||1;this.dashVector={x:dx/l,z:dz/l};this.hitDash.clear();
      this.sound.play('dash');this.view.wave(this.player.position.x,this.player.position.z,PALETTE.paper,1.1,.22);this.events('dash');
    }
    if(control.pulse)this.discharge();
    const speed=s.dashing>0?24:6.5;
    this.player.velocity.set((s.dashing>0?this.dashVector.x:dx)*speed,0,(s.dashing>0?this.dashVector.z:dz)*speed);
    this.moving=mag>.1||s.dashing>0;
    const p=this.player.position;
    for(const e of this.enemies)this.stepEnemy(e,p,dt);
    this.physics.step(dt);
    for(const e of this.enemies){if(e.dead)continue;const d=distance(p,e.body.position);
      if(s.dashing>0&&d<1.65&&!this.hitDash.has(e)){this.hitDash.add(e);this.strike(e,3);}
      else if(d<.98&&e.stunned<=0)this.hit();
    }
    for(let i=0;i<this.level.cells.length;i++){
      const [x,z]=this.level.cells[i];
      if(distance(p,{x,z})<1.1&&collect(s,`cell-${i}`)){
        this.sound.play('cell');this.view.burst(x,z,PALETTE.yellow,18);this.view.wave(x,z,PALETTE.blue,2.2);this.events('cell');
      }
    }
    for(let i=0;i<this.level.scrap.length;i++){if(this.scrap.has(i))continue;const [x,z]=this.level.scrap[i];if(distance(p,{x,z})<.9){this.scrap.add(i);s.scrap++;award(s,65);this.sound.play('scrap');}}
    for(let i=0;i<this.level.hazards.length;i++){const h=this.level.hazards[i];if(this.hazardActive(i)&&Math.abs(p.x-h.x)<h.w/2+.25&&Math.abs(p.z-h.z)<h.d/2+.3)this.hit();}
    this.stepBoss(dt);
    this.stepBullets(dt);
    if(distance(p,{x:this.level.exit[0],z:this.level.exit[1]})<1.25&&finishSector(s)){this.sound.play('clear');this.events(s.won?'won':'sector');}
  }
  stepEnemy(e,p,dt) {
    if(e.dead)return;e.stunned=Math.max(0,e.stunned-dt);
    if(e.stunned>0){e.body.velocity.scale(Math.exp(-dt*8),e.body.velocity);return;}
    const pos=e.body.position,dx=p.x-pos.x,dz=p.z-pos.z,d=length(dx,dz)||1;
    e.facing=Math.atan2(dx,dz);e.timer-=dt;
    const visible=!this.physics.obstructed(pos.x,pos.z,p.x,p.z),speed=this.state.difficulty==='assist'?.85:1;
    if(e.type==='shooter') {
      e.body.velocity.set(0,0,0);
      if(d>13||!visible){e.telegraph=0;e.timer=Math.max(.6,e.timer);return;}
      if(e.timer<.8&&e.telegraph<=0){e.telegraph=.8;e.timer=.8;e.aim={x:dx/d,z:dz/d};}
      if(e.telegraph>0)e.telegraph=Math.max(.001,e.telegraph-dt);
      if(e.timer<=0){this.shoot(pos.x,pos.z,e.aim.x,e.aim.z,5.6*speed);this.sound.play('shot');e.timer=2.6;e.telegraph=0;}
    } else if(e.type==='charger') {
      if(e.charge>0){e.charge-=dt;e.body.velocity.set(e.aim.x*11*speed,0,e.aim.z*11*speed);return;}
      if(d<10&&visible&&e.timer<=.85){
        if(e.telegraph<=0){e.telegraph=.85;e.timer=.85;e.aim={x:dx/d,z:dz/d};}
        e.body.velocity.set(0,0,0);e.telegraph=Math.max(.001,e.telegraph-dt);
        if(e.timer<=0){e.charge=.55;e.telegraph=0;e.timer=3.3;this.sound.play('shot');}
      }else {e.telegraph=0;if(d>1.5){this.seek(e,dx/d,dz/d,2*speed,visible);}else e.body.velocity.set(0,0,0);}
    } else {
      if(d<12)this.seek(e,dx/d,dz/d,2.5*speed,visible);else e.body.velocity.set(0,0,0);
    }
  }
  seek(e,dx,dz,speed,clear) {
    // Lightweight steering choices; cannon-es still owns every contact.
    if(!clear){
      const p=e.body.position,turn=e.seed%2?1:-1;
      const options=[[dx,dz],[-dz*turn,dx*turn],[dz*turn,-dx*turn]];
      for(const [x,z] of options)if(!this.physics.obstructed(p.x,p.z,p.x+x*1.7,p.z+z*1.7)){dx=x;dz=z;break;}
    }
    e.body.velocity.set(dx*speed,0,dz*speed);
  }
  stepBoss(dt) {
    const b=this.bossState,s=this.state;if(!b||s.bossDefeated)return;
    const p=this.player.position;b.active=s.cells.size>=2||distance(p,b)<7;
    if(!b.active)return;
    b.invulnerable=Math.max(0,b.invulnerable-dt);b.vulnerable=Math.max(0,b.vulnerable-dt);b.timer-=dt;
    if(b.waveRadius>0){b.waveRadius+=dt*4.7;if(Math.abs(distance(p,b)-b.waveRadius)<.55)this.hit();if(b.waveRadius>21)b.waveRadius=0;}
    if(s.dashing>0&&distance(p,b)<2.3)this.strikeBoss(3);
    if(distance(p,b)<1.6&&b.vulnerable<=0)this.hit();
    if(b.timer<=0){
      const slow=s.difficulty==='assist'?.8:1;
      if(b.pattern%3===0){for(let i=0;i<12;i++){const a=i*Math.PI/6;this.shoot(b.x,b.z,Math.sin(a),Math.cos(a),4.4*slow);}}
      else if(b.pattern%3===1){b.waveRadius=1;}
      else {const a=Math.atan2(p.z-b.z,p.x-b.x);for(let i=-2;i<=2;i++)this.shoot(b.x,b.z,Math.cos(a+i*.18),Math.sin(a+i*.18),6.4*slow);}
      b.pattern++;b.timer=b.hp<=12?4.4:5.1;b.vulnerable=3.1;this.sound.play('boss');this.view.wave(b.x,b.z,PALETTE.coral,2,.6);
    }
  }
  stepBullets(dt) {
    const p=this.player.position;
    for(let i=this.bullets.length-1;i>=0;i--){
      const b=this.bullets[i],nx=b.x+b.vx*dt,nz=b.z+b.vz*dt;b.life-=dt;
      if(b.life<=0||this.physics.obstructed(b.x,b.z,nx,nz)){this.bullets.splice(i,1);continue;}
      b.x=nx;b.z=nz;
      if(b.friendly){let hit=false;for(const e of this.enemies)if(!e.dead&&distance(b,e.body.position)<.75){this.strike(e,3);hit=true;break;}
        if(this.bossState&&distance(b,this.bossState)<1.7&&!this.state.bossDefeated){this.strikeBoss(2);hit=true;}
        if(hit)this.bullets.splice(i,1);
      } else if(distance(b,p)<.7){if(this.state.dashing>0){b.vx*=-1.6;b.vz*=-1.6;b.friendly=true;award(this.state,40);}else {this.hit();this.bullets.splice(i,1);}}
    }
  }
  objective() {
    const p=this.player.position;
    const targets=this.level.cells.map(([x,z],i)=>({x,z,id:i,kind:'cell'})).filter(t=>!this.state.cells.has(`cell-${t.id}`));
    if(targets.length)return targets.sort((a,b)=>distance(a,p)-distance(b,p))[0];
    if(this.bossState&&!this.state.bossDefeated)return {...this.bossState,kind:'boss'};
    return {x:this.level.exit[0],z:this.level.exit[1],kind:'exit'};
  }
  snapshot() {
    const s=this.state,p=this.player.position;
    return {sector:s.sector,hp:s.hp,maxHp:s.maxHp,cells:[...s.cells],score:s.score,time:s.time,dead:s.dead,won:s.won,
      player:{x:p.x,z:p.z},dashCooldown:s.dashCooldown,pulseCooldown:s.pulseCooldown,
      enemies:this.enemies.map(e=>({x:e.body.position.x,z:e.body.position.z,hp:e.hp,dead:e.dead,type:e.type})),
      boss:this.bossState?{hp:this.bossState.hp,vulnerable:this.bossState.vulnerable,wave:this.bossState.waveRadius}:null,
      bullets:this.bullets.length,bodies:this.physics.world.bodies.length,objective:this.objective()};
  }
}
