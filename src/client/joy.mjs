import { t } from './copy.mjs';
import { bubbleComment } from './playlogic.mjs';
import { getCard, createDeck, loadCards } from './cards.mjs';

export function initJoy({ toast, track }) {
  const reduced = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('[data-machine]');
  let current = null;
  let winModule;
  let renderingWin = Promise.resolve();
  const animations = new Set();
  function clearParticles() { for (const item of animations) { item.animation.cancel(); item.element.remove(); } animations.clear(); }
  function celebrate(target) {
    if (reduced() || document.hidden || !Element.prototype.animate) return;
    clearParticles();
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2; const y = rect.top + rect.height / 2;
    const colors = ['#ff815f','#234ce7','#ffda44','#7b9364','#fffdf6'];
    for (let i = 0; i < 24; i++) {
      const element = document.createElement('span');
      element.className = 'confetti-piece'; element.setAttribute('aria-hidden','true');
      Object.assign(element.style, { left:x+'px', top:y+'px', background:colors[i % colors.length] });
      document.body.append(element);
      const angle = Math.PI * (1.1 + Math.random() * .8); const power = 75 + Math.random() * 150;
      const dx = Math.cos(angle) * power; const dy = Math.sin(angle) * power;
      const animation = element.animate([
        { transform:'translate(0,0) rotate(0)', opacity:1 },
        { transform:`translate(${dx}px,${dy}px) rotate(${i * 23}deg)`, opacity:1, offset:.5 },
        { transform:`translate(${dx * 1.35}px,${dy + 200}px) rotate(${i * 51}deg)`, opacity:0 },
      ], { duration:1100 + Math.random() * 500, easing:'cubic-bezier(.2,.6,.4,1)', fill:'forwards' });
      const item = { animation, element }; animations.add(item);
      animation.onfinish = () => { element.remove(); animations.delete(item); };
    }
  }
  window.addEventListener('oy:motionchange', clearParticles);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearParticles(); });

  if (stage) {
    const button = stage.querySelector('[data-print]');
    const receipt = stage.querySelector('[data-receipt]');
    const message = stage.querySelector('[data-card-message]');
    const status = stage.querySelector('[data-machine-status]');
    const buttonLabel = button.querySelector('span');
    let busy = false;
    let drawCard=null;
    button.disabled = false;
    function showCard(card) {
      current = card;
      message.replaceChildren(...card.text.split('\n').flatMap((line, index) => [...(index ? [document.createElement('br')] : []), document.createTextNode(line)]));
      message.hidden = false;
      let artwork = receipt.querySelector('[data-win-artwork]');
      if (!artwork) { artwork = document.createElement('div'); artwork.dataset.winArtwork = ''; message.after(artwork); }
      artwork.hidden = true;
      receipt.classList.remove('has-win-design');
      const selected = card;
      renderingWin = (winModule ??= import('./win.mjs')).then(module => {
        if (current !== selected) return;
        const hasDesign = Boolean(selected.design);
        receipt.classList.toggle('has-win-design', hasDesign);
        artwork.hidden = !hasDesign;
        message.hidden = hasDesign;
        // Keep the default export surface without replacing the native receipt.
        module.renderWin(artwork, selected);
      }).catch(() => { receipt.classList.remove('has-win-design'); artwork.hidden = true; message.hidden = false; });
      receipt.hidden = false;
      status.textContent = t('runtime.joy.receipt.status', { text: card.text });
      document.querySelectorAll('[data-share],[data-save]').forEach(control => { control.disabled = false; });
      const radio = document.querySelector(`input[name="flavor"][value="${card.flavor}"]`);
      if (radio) radio.checked = true;
    }
    let printTimer = null, finishPrint = null;
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      stage.classList.add('is-working');
      stage.setAttribute('aria-busy','true');
      receipt.hidden = true;
      buttonLabel.textContent = t('runtime.joy.machine.printing');
      const flavor = document.querySelector('input[name="flavor"]:checked')?.value ?? 'kind';
      let card;
      try { drawCard ??= createDeck(await loadCards()); card = drawCard(flavor,current?.id); }
      catch {
        busy = false; button.disabled = false;
        stage.classList.remove('is-working'); stage.removeAttribute('aria-busy');
        buttonLabel.textContent = t('runtime.joy.machine.retry');
        status.textContent = t('runtime.joy.machine.loadError');
        return;
      }
      finishPrint = () => {
        clearTimeout(printTimer); printTimer = null; finishPrint = null;
        showCard(card);
        celebrate(button);
        buttonLabel.textContent = t('runtime.joy.machine.ready');
        stage.classList.remove('is-working');
        stage.removeAttribute('aria-busy');
        button.disabled = false;
        busy = false;
        track('joy');
      };
      if (reduced() || document.hidden) finishPrint();
      else printTimer = setTimeout(finishPrint,550);
    });
    window.addEventListener('oy:motionchange', () => { if (reduced()) finishPrint?.(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) finishPrint?.(); });
    stage.querySelector('[data-receipt-close]').addEventListener('click', () => { receipt.hidden = true; button.focus(); });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { for (const entry of entries) stage.dataset.inview = String(entry.isIntersecting); }, { threshold:.08 });
      observer.observe(stage);
    }
    let frame = null;
    stage.addEventListener('pointermove', event => {
      if (reduced() || event.pointerType === 'touch' || frame !== null) return;
      frame = requestAnimationFrame(() => {
        const bounds = stage.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - .5) * 4;
        const y = ((event.clientY - bounds.top) / bounds.height - .5) * 3;
        stage.querySelectorAll('.eye i').forEach(eye => { eye.style.transform = `translate(${x}px,${y}px)`; });
        frame = null;
      });
    });
    stage.addEventListener('pointerleave', () => {
      if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
      stage.querySelectorAll('.eye i').forEach(eye => { eye.style.transform = ''; });
    });
    const id = new URLSearchParams(location.search).get('kort');
    if(id && location.pathname === '/verkstad/') loadCards().then(cards=>{
      const shared=getCard(id,cards);
      if(shared){showCard(shared);requestAnimationFrame(()=>stage.scrollIntoView({block:'center',behavior:'instant'}));}
      else toast(t('runtime.joy.sharedCard.invalid'));
    }).catch(()=>toast(t('runtime.joy.sharedCard.loadError')));
  }

  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    if (!current) return;
    const url = new URL('/verkstad/', document.baseURI); url.searchParams.set('kort', current.id);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      toast(t('runtime.joy.share.copied'));
    } catch {
      const fallback = document.querySelector('[data-copy-fallback]');
      const input = fallback.querySelector('input');
      fallback.hidden = false; input.value = url.href; input.focus(); input.select();
      toast(t('runtime.joy.share.fallback'));
    }
  });
  document.querySelector('[data-save]')?.addEventListener('click', async () => {
    if (!current) return;
    const selected = current;
    try {
      await renderingWin;
      const module = await (winModule ??= import('./win.mjs'));
      const host = document.querySelector('[data-win-artwork]');
      const blob = await module.exportWin(host);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = t('runtime.joy.canvas.downloadFilename', { id: selected.id });
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast(t('runtime.joy.canvas.saved'));
    } catch { toast(t('runtime.joy.canvas.saveFailed')); }
  });

  const bubbles = [...document.querySelectorAll('[data-bubble]')];
  if (!bubbles.length) return;
  let popTimes=[];
  document.addEventListener('visibilitychange',()=>{if(document.hidden)popTimes=[];});
  let popped = new Set(); let sound = false; let audio = null;
  const bubbleStatus = document.querySelector('[data-bubble-status]');
  const soundButton = document.querySelector('[data-sound-toggle]');
  function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(sound));
    soundButton.lastChild.textContent = sound ? t('runtime.joy.sound.onSuffix') : t('runtime.joy.sound.offSuffix');
  }
  soundButton?.addEventListener('click', async () => {
    sound = !sound;
    if (sound) {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio unavailable');
        audio ??= new Audio();
        await audio.resume();
      } catch { sound = false; toast(t('runtime.joy.sound.unavailable')); }
    }
    updateSoundButton();
  });
  function popTone() {
    if (!sound || !audio || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.frequency.setValueAtTime(420,now);oscillator.frequency.exponentialRampToValueAtTime(80,now+.07);
    gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.09);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(now+.1);
    oscillator.onended = () => { oscillator.disconnect();gain.disconnect(); };
  }
  bubbles.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const id = button.dataset.bubble;
      if (popped.has(id)) return;
      popped.add(id);button.classList.add('is-popped');button.setAttribute('aria-pressed','true');
      button.setAttribute('aria-label', t('runtime.joy.bubble.aria.popped', { number: Number(id)+1 }));
      popTone();
      popTimes.push(performance.now());popTimes=popTimes.slice(-5);
      if(!reduced() && button.animate) {
        for(let i=0;i<8;i++) {
          const drop=document.createElement('i');drop.className='pop-drop';drop.setAttribute('aria-hidden','true');button.append(drop);
          const a=i*Math.PI/4, distance=button.offsetWidth*.65;
          const animation=drop.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*distance}px),calc(-50% + ${Math.sin(a)*distance}px)) scale(0)`,opacity:0}],{duration:380,easing:'ease-out'});
          const item={animation,element:drop};animations.add(item);animation.onfinish=()=>{drop.remove();animations.delete(item);};
        }
        const ring=document.createElement('i');ring.className='pop-ring';ring.setAttribute('aria-hidden','true');button.append(ring);
        const animation=ring.animate([{transform:'scale(.7)',opacity:.9},{transform:'scale(1.65)',opacity:0}],{duration:330,easing:'ease-out'});
        const item={animation,element:ring};animations.add(item);animation.onfinish=()=>{ring.remove();animations.delete(item);};
      }
      const remaining = bubbles.length - popped.size;
      bubbleStatus.textContent = (remaining ? t(remaining === 1 ? 'runtime.joy.bubble.remaining.one' : 'runtime.joy.bubble.remaining.many', { remaining }) : '') + bubbleComment(popTimes,remaining);
      if (remaining === 0) { celebrate(button);track('bubble_complete'); }
    });
  });
  document.querySelector('[data-bubble-reset]').addEventListener('click', () => {
    popped = new Set();popTimes=[];clearParticles();
    bubbles.forEach((button,i) => { button.classList.remove('is-popped');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',t('runtime.joy.bubble.aria.idle', { number: i+1 })); });
    bubbleStatus.textContent = t('runtime.joy.bubble.reset');
  });
}
