/** Input mapping only: browser Pointer Events provide capture and multitouch IDs. */
export class Input {
  constructor(canvas,onPause) {
    this.enabled=false;this.keys=new Set();this.stick={x:0,y:0,id:null};this.held={dash:false,pulse:false};this.taps={dash:false,pulse:false};
    this.canvas=canvas;
    window.addEventListener('keydown',e=>{
      if(e.code==='Escape'&&this.enabled){e.preventDefault();onPause();return;}
      if(!this.enabled||e.target.closest?.('input,select,button'))return;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyE'].includes(e.code)){e.preventDefault();this.keys.add(e.code);
        if(!e.repeat&&['Space','ShiftLeft','ShiftRight'].includes(e.code))this.taps.dash=true;
        if(!e.repeat&&['KeyJ','KeyK','KeyE'].includes(e.code))this.taps.pulse=true;}
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.clear());
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    const mouseButtons=e=>{if(!this.enabled||e.pointerType!=='mouse')return;for(const [action,bit] of [['pulse',1],['dash',2]]){const down=!!(e.buttons&bit);if(down&&!this.held[action])this.taps[action]=true;this.held[action]=down;}};
    canvas.addEventListener('pointerdown',e=>{if(!this.enabled||e.pointerType!=='mouse')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);mouseButtons(e);});
    canvas.addEventListener('pointermove',mouseButtons);
    const release=()=>{this.held.dash=false;this.held.pulse=false;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    for(const action of ['dash','pulse']){
      const el=document.getElementById(`${action}-control`);
      el.addEventListener('pointerdown',e=>{if(!this.enabled)return;e.preventDefault();el.setPointerCapture(e.pointerId);this.held[action]=true;this.taps[action]=true;});
      const up=()=>{this.held[action]=false;};for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,up);
      el.addEventListener('click',e=>{if(e.detail===0&&this.enabled)this.taps[action]=true;});
    }
    const pad=document.getElementById('joystick'),nub=pad.querySelector('i');this.nub=nub;
    const move=e=>{if(this.stick.id!==e.pointerId)return;const r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),max=42;
      this.stick.x=x/Math.max(max,l);this.stick.y=y/Math.max(max,l);nub.style.transform=`translate(${this.stick.x*max}px,${this.stick.y*max}px)`;};
    pad.addEventListener('pointerdown',e=>{if(!this.enabled||this.stick.id!==null)return;e.preventDefault();this.stick.id=e.pointerId;pad.setPointerCapture(e.pointerId);move(e);});
    pad.addEventListener('pointermove',move);
    const stop=e=>{if(this.stick.id===e.pointerId){this.stick={x:0,y:0,id:null};nub.style.transform='';}};
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,stop);
  }
  clear(){this.keys.clear();this.stick={x:0,y:0,id:null};this.held={dash:false,pulse:false};this.taps={dash:false,pulse:false};if(this.nub)this.nub.style.transform='';}
  read(){
    if(!this.enabled)return {x:0,y:0,dash:false,pulse:false};
    const k=this.keys;
    const result={x:Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))+this.stick.x,
      y:Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp'))+this.stick.y,
      dash:k.has('Space')||k.has('ShiftLeft')||k.has('ShiftRight')||this.held.dash||this.taps.dash,
      pulse:k.has('KeyJ')||k.has('KeyK')||k.has('KeyE')||this.held.pulse||this.taps.pulse};
    this.taps.dash=false;this.taps.pulse=false;return result;
  }
}
