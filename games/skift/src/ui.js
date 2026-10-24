import {STRINGS} from './i18n.js';
import {clock,rank,dashDelay,pulseDelay} from './rules.js';
export class UI {
  constructor(settings,save,onAction,onSetting) {
    this.touchQuery=matchMedia('(pointer:coarse)');
    this.settings=settings;this.save=save;this.onAction=onAction;this.onSetting=onSetting;
    this.modal=document.getElementById('modal');this.kind=null;this.game=null;this.didDash=false;this.didPulse=false;
    this.nodes=Object.fromEntries(['title-screen','game-screen','start-button','new-button','sector-number','sector-title','objective-text','cell-count','cell-icons','health','score','clock','dash-control','pulse-control','dash-ready','pulse-ready','waypoint','waypoint-label','combo','combo-number','tutorial','boss-hud','boss-health','boss-state'].map(id=>[id,document.getElementById(id)]));
    document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)onAction(b.dataset.action,b.dataset.value);});
    this.modal.addEventListener('change',e=>{const key=e.target.dataset.setting;if(!key)return;onSetting(key,e.target.type==='checkbox'?e.target.checked:e.target.value);});
    this.modal.addEventListener('cancel',e=>{e.preventDefault();onAction('close');});
    this.translate();
  }
  t(key){return STRINGS[this.settings.language][key]||key;}
  translate(){document.documentElement.lang=this.settings.language;document.querySelectorAll('[data-t]').forEach(e=>e.textContent=this.t(e.dataset.t));
    document.getElementById('language-button').textContent=this.settings.language==='sv'?'SV / EN':'EN / SV';
    document.getElementById('pause-button').setAttribute('aria-label',this.t('pause'));
    const swedish=this.settings.language==='sv',world=swedish?'Spelvärld':'Game world';
    document.getElementById('world').setAttribute('aria-label',world);document.querySelector('#world canvas')?.setAttribute('aria-label','SKIFT — '+world);
    document.querySelector('.site-header nav').setAttribute('aria-label',swedish?'Spelmeny':'Game menu');
    document.getElementById('joystick').setAttribute('aria-label',swedish?'Styrspak':'Movement joystick');
    this.nodes['pulse-control'].setAttribute('aria-label',swedish?'Puls':'Pulse');
    document.getElementById('language-button').setAttribute('aria-label',swedish?'Byt till engelska':'Switch to Swedish');
    this.nodes.health.setAttribute('aria-label',this.t('hull'));this.updateTitle();if(this.isReady)document.getElementById('load-status').textContent=this.t('ready');
  }
  updateTitle(){
    const has=!!this.save.checkpoint;
    this.nodes['start-button'].querySelector('[data-t]').textContent=this.t(has?'resumeRun':'start');
    this.nodes['new-button'].hidden=!has;
  }
  ready(){this.isReady=true;this.nodes['start-button'].disabled=false;document.getElementById('load-status').textContent=this.t('ready');this.translate();}
  mode(mode){const menu=mode==='menu';this.nodes['title-screen'].hidden=!menu;this.nodes['game-screen'].hidden=menu;document.body.dataset.mode=mode;}
  announce(text){document.getElementById('announcer').textContent=text;}
  toast(text){const e=document.getElementById('toast');e.textContent=text;e.hidden=false;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>{e.hidden=true;},5000);}
  close(){if(this.modal.open)this.modal.close();this.kind=null;}
  open(kind,game=this.game,message='') {
    this.kind=kind;this.game=game;const t=k=>this.t(k),s=game?.state;
    let title='',desc='',body='',actions='',eyebrow='SKIFT / POWER WORKS',closable=['how','settings','pause'].includes(kind);
    if(kind==='pause'){title=t('paused');desc=t('pausedText');actions=`<button class="primary" data-action="resume">${t('resume')} ↗</button><button class="secondary" data-action="settings">${t('settings')}</button><button class="text-button" data-action="menu">${t('toMenu')}</button>`;}
    if(kind==='how'){
      title=t('howTitle');desc=t('howText');
      body=[['WASD','moveText'],['↗','dashText'],['◎','pulseText'],['!','readText'],['×','scoreText'],['03','bossText']].map(([label,key])=>`<div class="how-row"><b>${label}</b><p>${t(key)}</p></div>`).join('');
      actions=`<button class="primary" data-action="close">${t('back')} ↗</button>`;
    }
    if(kind==='settings'){
      title=t('settings');
      const select=(key,label,items)=>`<label class="setting-row"><span>${t(label)}</span><select data-setting="${key}">${items.map(([v,label])=>`<option value="${v}" ${this.settings[key]===v?'selected':''}>${label}</option>`).join('')}</select></label>`;
      const toggle=(key,label)=>`<label class="setting-row"><span>${t(label)}</span><input type="checkbox" data-setting="${key}" ${this.settings[key]?'checked':''}></label>`;
      body=select('language','language',[['sv','Svenska'],['en','English']])+select('quality','quality',[['eco',t('eco')],['smooth',t('smooth')]])+toggle('sound','sound')+toggle('music','music')+toggle('motion','motion')+select('difficulty','difficulty',[['normal',t('normal')],['assist',t('assist')]])+`<p class="setting-note">${t('difficultyNote')}</p><p class="setting-note">${t('storageNote')}</p>`;
      actions=`<button class="primary" data-action="close">${t('back')} ↗</button>`;
    }
    if(kind==='sector'){
      title=t('sectorDone');desc=t('upgradePrompt');eyebrow=`${t('sector')} ${String(s.sector+1).padStart(2,'0')} / ${t('choose')}`;
      body=`<div class="upgrade-grid">${['dash','pulse','shield'].filter(id=>!s.upgrades.includes(id)).map((id)=>`<button class="upgrade" data-action="upgrade" data-value="${id}"><span class="upgrade-icon">${id==='dash'?'↗':id==='pulse'?'◎':'▤'}</span><span><h3>${t(id+'Name')}</h3><p>${t(id+'Desc')}</p></span><span class="upgrade-arrow">→</span></button>`).join('')}</div>`;
    }
    if(kind==='dead'){title=t('dead');desc=t('deadText');body=`<div class="result-stats"><div><span>${t('sector')}</span><strong>0${s.sector+1}</strong></div><div><span>${t('score')}</span><strong>${s.score.toLocaleString(this.settings.language)}</strong></div></div>`;actions=`<button class="primary" data-action="retry">${t('retry')} ↗</button><button class="secondary" data-action="menu">${t('toMenu')}</button>`;}
    if(kind==='won'){
      title=t('won');desc=t('wonText');eyebrow=`SKIFT / ${t('rank')} ${rank(s.score)}`;
      body=`<div class="rank-stamp" aria-label="${t('rank')} ${rank(s.score)}">${rank(s.score)}</div><div class="result-stats"><div><span>${t('total')}</span><strong>${s.score.toLocaleString(this.settings.language)}</strong></div><div><span>${t('time')}</span><strong>${clock(s.time)}</strong></div><div><span>${t('best')}</span><strong>${this.save.best.toLocaleString(this.settings.language)}</strong></div><div><span>${t('difficulty')}</span><strong>${s.difficulty==='assist'?'Assist':t('normal')}</strong></div></div>${s.score>=this.save.best?`<span class="new-best">${t('newBest')}</span>`:''}`;
      actions=`<button class="primary" data-action="new">${t('again')} ↗</button><button class="secondary" data-action="menu">${t('toMenu')}</button>`;
    }
    if(kind==='error'){title=t('fault');desc=message||t('faultText');actions=`<button class="primary" data-action="reload">${t('reload')} ↗</button>`;}
    this.modal.innerHTML=`<div class="modal-inner">${closable?`<button class="modal-close" data-action="close" aria-label="${t('close')}">×</button>`:''}<p class="eyebrow">${eyebrow}</p><h2 id="modal-title">${title}</h2>${desc?`<p>${desc}</p>`:''}${body}${actions?`<div class="modal-actions">${actions}</div>`:''}</div>`;
    if(!this.modal.open)this.modal.showModal();
    // Native dialog provides focus containment; choose the useful primary action.
    (this.modal.querySelector('.primary,.upgrade')||this.modal.querySelector('select,button'))?.focus({preventScroll:true});
  }
  hud(game,view){
    this.game=game;const s=game.state,n=this.nodes;
    n['sector-number'].textContent=`0${s.sector+1} / 03`;n['sector-title'].textContent=game.level.name[this.settings.language];
    n['objective-text'].textContent=this.t(s.cells.size<3?'collect':game.bossState&&!s.bossDefeated?'bossGoal':'exit');
    n['cell-count'].textContent=`${s.cells.size} / 3`;
    [...n['cell-icons'].children].forEach((el,i)=>el.classList.toggle('on',s.cells.has(`cell-${i}`)));
    [...n.health.children].forEach((el,i)=>{el.hidden=i>=s.maxHp;el.classList.toggle('empty',i>=s.hp);});
    n.health.setAttribute('aria-valuenow',String(s.hp));n.health.setAttribute('aria-valuemax',String(s.maxHp));
    n.score.textContent=String(s.score).padStart(5,'0');n.clock.textContent=clock(s.time);
    for(const [key,wait,total] of [['dash',s.dashCooldown,dashDelay(s)],['pulse',s.pulseCooldown,pulseDelay(s)]]){
      n[`${key}-control`].style.setProperty('--cooldown',`${Math.min(100,wait/total*100)}%`);
      n[`${key}-ready`].textContent=wait>0?`${wait.toFixed(1)}s`:this.t('available');
    }
    n.combo.hidden=s.combo<2;n['combo-number'].textContent=`×${(1+(s.combo-1)*.2).toFixed(1)}`;
    const target=game.objective(),point=view.project(target.x,target.z,1.4);
    n.waypoint.style.left=`${Math.max(25,Math.min(view.width-25,point.x))}px`;
    n.waypoint.style.top=`${Math.max(170,Math.min(view.height-145,point.y))}px`;
    n['waypoint-label'].textContent=target.kind==='cell'?`${target.id+1}`:target.kind==='boss'?'!':'→';
    n['boss-hud'].hidden=!game.bossState?.active||s.bossDefeated;
    if(game.bossState){n['boss-health'].style.width=`${game.bossState.hp/game.bossState.maxHp*100}%`;n['boss-state'].textContent=game.bossState.vulnerable>0?(this.settings.language==='sv'?'KÄRNAN ÄR ÖPPEN':'CORE EXPOSED'):'';}
    n.tutorial.textContent=s.sector===0&&s.sectorTime<32?this.t(s.cells.size>0?'tutorialCell':s.sectorTime>10?(this.touchQuery.matches?'tutorialTouchDash':'tutorialDash'):(this.touchQuery.matches?'tutorialTouchMove':'tutorialMove')):'';
  }
}
