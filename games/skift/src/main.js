import './style.css';
import {loadSave,saveRun,sanitizeSave} from './rules.js';
import {View} from './view.js';
import {Game} from './game.js';
import {Input} from './input.js';
import {Sound} from './sound.js';
import {UI} from './ui.js';

let storage;try{storage=window.localStorage;}catch{storage=null;}
const save=loadSave(storage),settings=save.settings;
if(!storage)Object.assign(save,sanitizeSave(null));
if(matchMedia('(prefers-reduced-motion: reduce)').matches)settings.motion=false;
let mode='menu',game,view,input,sound,ready=false,raf=0,lastFrame=0,menuSince=performance.now(),lastHUD=0,returnTo='menu';
let ui;const perf={frames:0,steps:0,cost:[],maxCost:0};
const persist=()=>{const ok=saveRun(storage,save);if(!ok&&ready&&!persist.warned){persist.warned=true;ui.toast(ui.t('noStorage'));}return ok;};
ui=new UI(settings,save,action,changeSetting);
function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
function frame(now){
  raf=0;if(!ready||document.hidden)return;
  const interval=1000/(settings.quality==='smooth'?60:30);
  if(now-lastFrame<interval-.7){wake();return;}
  const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;const begin=performance.now();
  if(mode==='play'){game.step(dt,input.read());perf.steps++;}
  view.draw(game,mode,mode==='play'||mode==='menu'?dt:0,now/1000);
  if(mode!=='menu'){ui.wp(game,view);if(now-lastHUD>90){ui.hud(game,view);lastHUD=now;}}
  const cost=performance.now()-begin;perf.frames++;perf.maxCost=Math.max(perf.maxCost,cost);perf.cost.push(cost);if(perf.cost.length>600)perf.cost.shift();
  if(mode==='play'||(mode==='menu'&&now-menuSince<10000))wake();
}
function play(){mode='play';input.enabled=true;input.clear();ui.close();ui.mode(mode);sound.start();lastFrame=performance.now();lastHUD=0;view.renderer.domElement.focus({preventScroll:true});wake();}
function pause(){if(mode!=='play')return;mode='pause';input.enabled=false;input.clear();sound.pause();ui.open('pause',game);wake();}
function start(checkpoint=null){
  ui.close();mode='play';game.newRun(settings.difficulty,checkpoint);ui.didDash=false;ui.didPulse=false;play();
}
function action(name,value){
  if(name==='reload'){location.reload();return;}
  if(name==='language'){changeSetting('language',settings.language==='sv'?'en':'sv');return;}
  if(name==='how'||name==='settings'){
    if(mode==='play')pause();returnTo=mode==='menu'?'menu':'pause';ui.open(name,game);return;
  }
  if(!ready)return;
  if(name==='start')start(save.checkpoint);
  else if(name==='new')start();
  else if(name==='pause')pause();
  else if(name==='resume')play();
  else if(name==='close'){if(!['pause','settings','how'].includes(ui.kind))return;if(ui.kind==='pause')play();else if(returnTo==='pause')ui.open('pause',game);else ui.close();}
  else if(name==='retry'){mode='play';game.retry();play();}
  else if(name==='upgrade'){game.advance(value);play();}
  else if(name==='menu'){
    ui.close();mode='menu';input.enabled=false;input.clear();sound.pause();game.newRun(settings.difficulty);ui.mode(mode);ui.updateTitle();menuSince=performance.now();view.setCamera('menu',true);wake();
  }
}
function changeSetting(key,value){
  if(!Object.hasOwn(settings,key))return;
  settings[key]=value;Object.assign(settings,sanitizeSave({...save,settings}).settings);persist();sound?.apply();
  ui.translate();if(ui.kind==='settings'){ui.open('settings',game);ui.modal.querySelector(`[data-setting="${key}"]`)?.focus({preventScroll:true});}
  view?.resize();wake();
}
function onGameEvent(type,data){
  if(type==='loaded'){
    if(mode==='play'){save.unlocked=Math.max(save.unlocked,data.sector);save.checkpoint=data;persist();}
    return;
  }
  if(type==='cell'){ui.announce(ui.t('cellFound'));return;}
  if(type==='boss'){ui.announce(ui.t('bossDown'));return;}
  if(type==='dash'){ui.didDash=true;return;}if(type==='pulse'){ui.didPulse=true;return;}
  if(type==='won'){
    save.best=Math.max(save.best,game.state.score);save.wins++;save.checkpoint=null;save.unlocked=2;persist();
  }
  if(['dead','won','sector'].includes(type)){
    mode=type;input.enabled=false;input.clear();sound.pause();sound.play(type==='dead'?'fail':'clear');ui.open(type,game);wake();
  }
}
async function boot(){
  try{
    sound=new Sound(settings);view=new View(document.getElementById('world'),settings);
    view.renderer.domElement.tabIndex=0;
    game=new Game(view,sound,onGameEvent);input=new Input(view.renderer.domElement,pause);
    await view.renderer.compileAsync(view.scene,view.camera);
    view.draw(game,mode,0,performance.now()/1000);
    ready=true;ui.ready();lastFrame=menuSince=performance.now();wake();
    window.addEventListener('resize',()=>{input.clear();view.resize();wake();});
    window.addEventListener('blur',pause);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){pause();sound.pause();if(raf)cancelAnimationFrame(raf);raf=0;}
      else {lastFrame=performance.now();wake();}
    });
    view.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();ready=false;ui.open('error',game,ui.t('contextLost'));});
    if(new URLSearchParams(location.search).has('qa')){
      // Read-only diagnostics. No teleport, force-win, invulnerability or state mutation.
      Object.defineProperty(window,'__SKIFT__',{value:Object.freeze({snapshot:()=>({...game.snapshot(),mode,audio:{active:sound.active,music:!!sound.music?.playing()},render:view.stats(),perf:{frames:perf.frames,steps:perf.steps,maxCost:perf.maxCost,p95:[...perf.cost].sort((a,b)=>a-b)[Math.floor(perf.cost.length*.95)]||0},settings:{...settings}})})});
    }
    persist();
  }catch(error){console.error('SKIFT startup failed',error);ui.open('error',null,/webgl/i.test(String(error))?ui.t('faultText'):ui.t('startupError'));document.getElementById('load-status').textContent=ui.t('fault');}
}
boot();
