import {Howl,Howler} from 'howler';
export class Sound {
  constructor(settings){this.settings=settings;this.ready=false;this.fx={};this.active=false;}
  ensure(){
    if(this.ready){Howler.ctx?.resume().catch(()=>{});return;}
    this.ready=true;
    const base=new URL('./audio/',document.baseURI).href;
    for(const name of ['dash','pulse','hit','strike','scrap','cell','shot','clear','fail','boss'])this.fx[name]=new Howl({src:[`${base}${name}.wav`],volume:name==='shot'?.13:.3,preload:true});
    this.music=new Howl({src:[`${base}shift.mp3`],loop:true,volume:.17,preload:true});
    this.apply();
  }
  apply(){if(!this.ready)return;Howler.mute(!this.settings.sound);if(this.active&&this.settings.sound&&this.settings.music){if(!this.music.playing())this.music.play();}else this.music.pause();}
  play(name){if(!this.ready||!this.settings.sound)return;const fx=this.fx[name];if(fx&&(!fx.playing()||name==='dash'))fx.play();}
  start(){this.ensure();this.active=true;this.apply();}
  pause(){this.active=false;if(!this.ready)return;this.music.pause();Object.values(this.fx).forEach(f=>f.stop());}
}
