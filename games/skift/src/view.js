import * as T from 'three';
import {buildDistrict,robot,sentinel,cell,scrap,extraction,boss,disposeTree,PALETTE,material} from './art.js';

export class View {
  constructor(container,settings) {
    this.container=container;this.settings=settings;
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate=false;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','SKIFT — spelvärld');
    this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-20,20,15,-15,.1,150);
    this.target=new T.Vector3();this.offset=new T.Vector3(22,29,22);this.projected=new T.Vector3();
    this.scene.add(new T.HemisphereLight('#fff5de','#607883',2.3));
    const sun=new T.DirectionalLight('#fff3d6',3.2);sun.position.set(-12,25,16);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:65});
    sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;sun.shadow.radius=3;this.scene.add(sun);this.sun=sun;
    this.ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#e9e2d1',roughness:1}));
    this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-2.2;this.ground.receiveShadow=true;this.scene.add(this.ground);
    this.scene.fog=new T.Fog('#e9e2d1',65,120);
    this.world=null;this.hero=null;this.time=0;this.shake=0;this.mode='menu';
    this.particleData=[];const pg=new T.TetrahedronGeometry(.11);
    this.particles=new T.InstancedMesh(pg,new T.MeshBasicMaterial({color:'#ffffff'}),64);
    this.particles.instanceMatrix.setUsage(T.DynamicDrawUsage);this.particles.frustumCulled=false;this.particles.count=0;this.scene.add(this.particles);
    this.matrix=new T.Object3D();this.tempColor=new T.Color();
    this.rings=[];
    for(let i=0;i<8;i++){const m=new T.Mesh(new T.RingGeometry(.94,1,64),new T.MeshBasicMaterial({color:PALETTE.blue,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;this.scene.add(m);this.rings.push({mesh:m,life:0});}
    this.resize();
  }
  resize() {
    this.width=this.container.clientWidth;this.height=this.container.clientHeight;
    if(!this.width||!this.height)return;
    const key=`${this.width}x${this.height}:${this.settings.quality}`;
    if(key===this.sizeKey)return;this.sizeKey=key;
    const budget=this.settings.quality==='smooth'?1700000:1000000;
    const ratio=Math.min(this.settings.quality==='smooth'?1.4:1,Math.sqrt(budget/(this.width*this.height)));
    this.renderer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height,false);
    this.setCamera(this.mode,this.mode==='menu',null,0); // refit the frustum; only the menu snaps its target
    if(this.world)this.renderer.render(this.scene,this.camera); // a resized canvas is blank until drawn
  }
  setCamera(mode,immediate=false,hero=null,dt=1/30) {
    const aspect=this.width/this.height,portrait=aspect<.95;
    const h=mode==='menu'?(portrait?53:36):(portrait?31:25);
    this.camera.left=-h*aspect/2;this.camera.right=h*aspect/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();
    let x=0,z=0,y=0;
    if(mode==='menu'){x=portrait?-.5:-7;z=portrait?.5:7;y=portrait?7:0;}
    else if(hero){x=Math.max(-8,Math.min(8,hero.x*.76));z=Math.max(-6,Math.min(6,hero.z*.76));}
    const target=new T.Vector3(x,y,z);
    if(immediate)this.target.copy(target);else this.target.lerp(target,1-Math.exp(-dt*5));
    this.camera.position.copy(this.target).add(this.offset);
    if(this.settings.motion&&this.shake>0){this.camera.position.x+=Math.sin(this.time*73)*this.shake;this.camera.position.z+=Math.cos(this.time*53)*this.shake;}
    this.camera.lookAt(this.target);
  }
  load(level) {
    if(this.world){this.scene.remove(this.world);disposeTree(this.world);}
    this.level=level;this.world=new T.Group();this.scene.add(this.world);
    const district=buildDistrict(level);this.world.add(district.root);this.dynamic=district.dynamicArt;this.dynamic.traverse(o=>{if(o.isMesh)o.castShadow=false;});
    this.hero=robot();this.hero.position.set(...[level.start[0],0,level.start[1]]);this.world.add(this.hero);
    this.cellModels=level.cells.map(([x,z])=>{const g=cell();g.position.set(x,0,z);this.world.add(g);return g;});
    this.scrapModels=level.scrap.map(([x,z])=>{const g=scrap();g.position.set(x,0,z);this.world.add(g);return g;});
    this.exit=extraction();this.exit.position.set(level.exit[0],0,level.exit[1]);this.world.add(this.exit);
    this.boss=level.boss?boss():null;if(this.boss){this.boss.position.set(level.boss[0],0,level.boss[1]);this.world.add(this.boss);}
    this.enemyModels=[];this.telegraphs=[];
    this.bulletModels=[];
    const bulletGeo=new T.SphereGeometry(.15,8,6);
    for(let i=0;i<32;i++){const m=new T.Mesh(bulletGeo,material(PALETTE.coral,true));m.visible=false;this.world.add(m);this.bulletModels.push(m);}
    this.hazardModels=level.hazards.map(h=>{const m=new T.Mesh(new T.BoxGeometry(h.w,.11,h.d),new T.MeshBasicMaterial({color:'#f08b51',transparent:true,opacity:.3}));m.position.set(h.x,.22,h.z);this.world.add(m);return m;});
    this.bossRing=new T.Mesh(new T.RingGeometry(.975,1,80),new T.MeshBasicMaterial({color:'#e76441',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));
    this.bossRing.rotation.x=-Math.PI/2;this.bossRing.visible=false;this.world.add(this.bossRing);
    this.particleData.length=0;this.rings.forEach(r=>{r.life=0;r.mesh.visible=false;});
    this.ground.material.color.set(level.ground);this.scene.background=new T.Color(level.ground);this.scene.fog.color.set(level.ground);
    this.renderer.shadowMap.needsUpdate=true;this.mode='menu';this.setCamera('menu',true);
  }
  addEnemy(enemy) {
    const g=sentinel(enemy.type);g.position.set(enemy.body.position.x,0,enemy.body.position.z);this.world.add(g);enemy.visual=g;
    const tell=new T.Mesh(new T.RingGeometry(.91,1,40),new T.MeshBasicMaterial({color:'#d24d29',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));tell.rotation.x=-Math.PI/2;this.world.add(tell);enemy.tell=tell;this.enemyModels.push(g);
    const beam=new T.Mesh(new T.BoxGeometry(.07,.015,5),new T.MeshBasicMaterial({color:'#d45c31',transparent:true,opacity:.45,depthWrite:false}));beam.visible=false;this.world.add(beam);enemy.beam=beam;
  }
  burst(x,z,color=PALETTE.yellow,count=12) {
    if(!this.settings.motion)count=Math.min(count,4);
    for(let i=0;i<count&&this.particleData.length<64;i++){
      const a=Math.random()*Math.PI*2,speed=1+Math.random()*3;
      this.particleData.push({x,y:.7,z,vx:Math.cos(a)*speed,vz:Math.sin(a)*speed,vy:2+Math.random()*3,life:.35+Math.random()*.35,color});
    }
  }
  wave(x,z,color=PALETTE.blue,radius=3.5,duration=.45) {
    const r=this.rings.find(v=>v.life<=0)||this.rings[0];Object.assign(r,{life:duration,max:duration,radius});
    r.mesh.position.set(x,.08,z);r.mesh.material.color.set(color);r.mesh.visible=true;r.mesh.scale.setScalar(.1);
  }
  draw(game,mode,dt,elapsed) {
    this.time=elapsed;this.mode=mode;const playing=mode==='play',animate=playing||mode==='menu';
    const s=game?.state,position=game?.player?.position;
    this.shake=Math.max(0,this.shake-dt*1.5);
    this.setCamera(mode==='menu'?'menu':'play',false,position,dt);
    if(animate && this.settings.motion)for(const f of this.dynamic.children)f.rotation.y+=dt*(f.userData.spin||0);
    if(game){
      this.hero.position.set(position.x,0,position.z);
      const body=this.hero.userData.body;
      const delta=T.MathUtils.euclideanModulo(game.facing-this.hero.rotation.y+Math.PI,Math.PI*2)-Math.PI;
      this.hero.rotation.y+=delta*(1-Math.exp(-dt*18));
      if(this.settings.motion){body.position.y=game.moving?Math.abs(Math.sin(elapsed*19))*.075:Math.sin(elapsed*3)*.026;body.rotation.x=s.dashing>0?-.18:0;}
      else {body.position.y=0;body.rotation.x=0;}
      body.visible=true; // Keep the player readable throughout damage immunity and dashes.
      const immunityFlash=playing&&s.invulnerable>0&&this.settings.motion&&Math.floor(elapsed*8)%2===0;
      this.hero.userData.halo.material=material(immunityFlash?PALETTE.coral:PALETTE.blue);
      if(s.dashing>0&&this.settings.motion&&Math.random()>.3)this.burst(position.x,position.z,PALETTE.blue,1);
      for(let i=0;i<this.cellModels.length;i++){
        const c=this.cellModels[i];c.visible=!s.cells.has(`cell-${i}`);
        if(animate&&this.settings.motion){c.userData.body.rotation.y=elapsed*.9+i;c.userData.body.position.y=.4+Math.sin(elapsed*2+i)*.08;}
      }
      for(let i=0;i<this.scrapModels.length;i++){const m=this.scrapModels[i];m.visible=!game.scrap.has(i);if(this.settings.motion)m.rotation.y=elapsed*1.8+i;}
      for(const e of game.enemies){
        if(e.dead){e.visual.visible=false;e.tell.visible=false;e.beam.visible=false;continue;}
        e.visual.position.set(e.body.position.x,0,e.body.position.z);e.visual.rotation.y=e.facing||0;
        e.visual.userData.body.position.y=this.settings.motion?Math.sin(elapsed*4+e.seed)*.045:0;
        e.tell.visible=e.telegraph>0;e.tell.material.opacity=e.telegraph>0?.25+.5*(1-e.telegraph/.9):0;
        e.tell.position.set(e.body.position.x,.09,e.body.position.z);e.tell.scale.setScalar(e.type==='charger'?1.2:1.0);
        e.beam.visible=e.telegraph>0;e.beam.position.set(e.body.position.x+e.aim.x*2.5,.11,e.body.position.z+e.aim.z*2.5);e.beam.rotation.y=Math.atan2(e.aim.x,e.aim.z);
        if(e.telegraph>0)e.visual.rotation.y=e.beam.rotation.y;
        if(e.stunned>0)e.visual.rotation.z=Math.sin(elapsed*27)*.13;else e.visual.rotation.z=0;
      }
      for(let i=0;i<this.bulletModels.length;i++){const m=this.bulletModels[i],b=game.bullets[i];m.visible=!!b;if(b){m.position.set(b.x,.65,b.z);m.material=material(b.friendly?PALETTE.blue:PALETTE.coral,true);}}
      for(let i=0;i<this.hazardModels.length;i++){const active=game.hazardActive(i),m=this.hazardModels[i];m.material.opacity=active?.8:.13;m.scale.y=active?6:1;}
      const unlocked=s.cells.size===3&&(!game.bossState||s.bossDefeated);
      this.exit.userData.ring.material=material(unlocked?PALETTE.blue:PALETTE.metal,true);
      if(this.settings.motion)this.exit.userData.ring.scale.setScalar(unlocked?1+Math.sin(elapsed*3)*.08:1);
      if(this.boss){
        const b=game.bossState;this.boss.visible=!s.bossDefeated;
        if(this.settings.motion)this.boss.userData.rotor.rotation.y=elapsed*(b?.vulnerable>0?2:.55);
        this.boss.userData.core.material=material(b?.vulnerable>0?PALETTE.yellow:PALETTE.coral,true);
        this.bossRing.visible=(!!b?.waveRadius||(b?.active&&b.timer<1))&&!s.bossDefeated;
        if(this.bossRing.visible){this.bossRing.position.set(b.x,.10,b.z);this.bossRing.scale.setScalar(b.waveRadius||2+(1-b.timer)*1.2);}
      }
    }
    for(let i=this.particleData.length-1;i>=0;i--){const p=this.particleData[i];p.life-=dt;if(p.life<=0){this.particleData.splice(i,1);continue;}p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=13*dt;}
    this.particles.count=this.particleData.length;
    for(let i=0;i<this.particleData.length;i++){const p=this.particleData[i];this.matrix.position.set(p.x,Math.max(.08,p.y),p.z);this.matrix.scale.setScalar(Math.min(1,p.life*6));this.matrix.rotation.set(p.life*3,p.life*7,0);this.matrix.updateMatrix();this.particles.setMatrixAt(i,this.matrix.matrix);this.particles.setColorAt(i,this.tempColor.set(p.color));}
    this.particles.instanceMatrix.needsUpdate=true;if(this.particles.instanceColor)this.particles.instanceColor.needsUpdate=true;
    for(const r of this.rings){r.life=Math.max(0,r.life-dt);r.mesh.visible=r.life>0;if(r.life>0){r.mesh.scale.setScalar((1-r.life/r.max)*r.radius+.1);r.mesh.material.opacity=r.life/r.max*.8;}}
    this.renderer.render(this.scene,this.camera);
  }
  project(x,z,y=1) {this.projected.set(x,y,z).project(this.camera);return {x:(this.projected.x*.5+.5)*this.width,y:(-.5*this.projected.y+.5)*this.height};}
  stats(){const i=this.renderer.info;return {drawCalls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures,width:this.renderer.domElement.width,height:this.renderer.domElement.height,pixelRatio:this.renderer.getPixelRatio()};}
}
