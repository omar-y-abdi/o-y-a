import { getCard, nextCard } from './cards.55ab8f9fdceb.mjs';

export function initJoy({ toast, track }) {
  const reduced = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('[data-machine]');
  let current = null;
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
    button.disabled = false;
    function showCard(card) {
      current = card;
      message.textContent = card.text;
      receipt.hidden = false;
      status.textContent = `En liten vinst: ${card.text}`;
      document.querySelectorAll('[data-share],[data-save]').forEach(control => { control.disabled = false; });
      const radio = document.querySelector(`input[name="flavor"][value="${card.flavor}"]`);
      if (radio) radio.checked = true;
    }
    button.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      stage.classList.add('is-working');
      receipt.hidden = true;
      buttonLabel.textContent = 'En liten vinst på väg…';
      const flavor = document.querySelector('input[name="flavor"]:checked')?.value ?? 'kind';
      const card = nextCard(flavor, current?.id);
      setTimeout(() => {
        showCard(card);
        celebrate(button);
        buttonLabel.textContent = 'En liten vinst till';
        stage.classList.remove('is-working');
        button.disabled = false;
        busy = false;
        track('joy');
      }, reduced() ? 0 : 550);
    });
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
    const shared = getCard(id);
    if (shared && location.pathname === '/verkstad/') {
      showCard(shared);
      requestAnimationFrame(() => stage.scrollIntoView({ block:'center', behavior:'instant' }));
    } else if (id) toast('Det kortet finns inte. Tryck fram ett nytt i stället.');
  }

  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    if (!current) return;
    const url = new URL('/verkstad/', location.origin); url.searchParams.set('kort', current.id);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      toast('Kortlänken är kopierad. Skicka vidare en liten vinst.');
    } catch {
      const fallback = document.querySelector('[data-copy-fallback]');
      const input = fallback.querySelector('input');
      fallback.hidden = false; input.value = url.href; input.focus(); input.select();
      toast('Automatisk kopiering gick inte. Länken finns i fältet.');
    }
  });
  document.querySelector('[data-save]')?.addEventListener('click', () => {
    if (!current) return;
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) { toast('Bilden kunde inte skapas i den här webbläsaren. Kopiera kortlänken i stället.'); return; }
    ctx.fillStyle = '#fff0b3'; ctx.fillRect(0,0,1200,800);
    ctx.fillStyle = '#20261e'; ctx.font = 'bold 23px Arial'; ctx.fillText('EN LITEN VINST FRÅN OMAR YUSUF',75,94);
    ctx.strokeStyle = '#b0a46a'; ctx.lineWidth = 1; ctx.beginPath();ctx.moveTo(75,125);ctx.lineTo(1125,125);ctx.stroke();
    ctx.font = 'bold 61px Arial';
    const lines = []; let line = '';
    for (const word of current.text.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > 1030 && line) { lines.push(line); line = word; } else line = candidate;
    }
    if (line) lines.push(line);
    const top = 390 - (lines.length - 1) * 39;
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i],75,top + i * 78);
    ctx.fillStyle = '#234ce7';ctx.fillRect(0,670,1200,130);
    ctx.fillStyle = '#fffdf6';ctx.font = 'bold 24px Arial';ctx.fillText('omaryusuf.se',75,746);
    ctx.font = '20px Arial';ctx.fillText('Lite hjärna. Lite hjärta. Lite bus i systemet.',550,746);
    canvas.toBlob(blob => {
      if (!blob) { toast('Bilden kunde inte sparas. Kopiera kortlänken i stället.'); return; }
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `en-liten-vinst-${current.id}.png`;
      document.body.append(link);link.click();link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast('Din lilla vinst är redo att sparas.');
    },'image/png');
  });

  const bubbles = [...document.querySelectorAll('[data-bubble]')];
  if (!bubbles.length) return;
  let popped = new Set(); let sound = false; let audio = null;
  const bubbleStatus = document.querySelector('[data-bubble-status]');
  const soundButton = document.querySelector('[data-sound-toggle]');
  function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(sound));
    soundButton.lastChild.textContent = sound ? ' Ljud: på' : ' Ljud: av';
  }
  soundButton?.addEventListener('click', async () => {
    sound = !sound;
    if (sound) {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio unavailable');
        audio ??= new Audio();
        await audio.resume();
      } catch { sound = false; toast('Ljud stöds inte här. Bubblorna fungerar ändå.'); }
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
      button.setAttribute('aria-label', `Bubbla ${Number(id)+1}, poppad`);
      popTone();
      const remaining = bubbles.length - popped.size;
      bubbleStatus.textContent = remaining === 0 ? 'Alla poppade. Inget blev gjort. Det var hela poängen.' : `${remaining} ${remaining === 1 ? 'bubbla kvar' : 'bubblor kvar'}. Ingen brådska.`;
      if (remaining === 0) { celebrate(button);track('bubble_complete'); }
    });
  });
  document.querySelector('[data-bubble-reset]').addEventListener('click', () => {
    popped = new Set();
    bubbles.forEach((button,i) => { button.classList.remove('is-popped');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Poppa bubbla ${i+1}`); });
    bubbleStatus.textContent = '12 nya bubblor. En ny, helt rimlig paus.';
  });
}
