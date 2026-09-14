import { drawings } from './memory.mjs';
import { fikaResult, shuffledPairs } from './playlogic.mjs';
import { t } from './copy.mjs';
export function initGames() {
  const grid = document.querySelector('[data-memory-grid]');
  const status = document.querySelector('[data-memory-status]');
  const labels = [
    t('runtime.memory.label.sun'),
    t('runtime.memory.label.coffeeCup'),
    t('runtime.memory.label.bolt'),
    t('runtime.memory.label.flower'),
    t('runtime.memory.label.heart'),
    t('runtime.memory.label.code'),
  ];
  let values=[], buttons=[], open=[], matched=new Set(), attempts=0, timer=null;
  function reset(focus=false) {
    clearTimeout(timer);timer=null;open=[];matched.clear();attempts=0;values=shuffledPairs();
    buttons = [...grid.querySelectorAll('[data-memory-card]')];
    buttons.forEach((button, index) => {
      const value = values[index];
      button.disabled = false;
      button.dataset.index = index;
      button.classList.remove('is-open', 'is-matched');
      button.removeAttribute('aria-disabled');
      button.setAttribute('aria-label', t('runtime.memory.aria.cardIdle', { number: index + 1 }));
      button.setAttribute('aria-pressed', 'false');
      const front = button.querySelector('.memory-front');
      for (const name of [...front.classList]) if (/^memory-color-\d+$/.test(name)) front.classList.remove(name);
      front.classList.add(`memory-color-${value}`);
      // The six game symbols are code-owned; their styled SVG container and
      // every card/face remain the exact components edited in the CMS.
      button.querySelector('[data-memory-symbol]').innerHTML = drawings[value];
    });
    status.textContent=t('runtime.memory.status.initial');
    if(focus)buttons[0].focus();
  }
  function closeUnmatched() {
    for(const index of open) {const button=buttons[index];button.classList.remove('is-open');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',t('runtime.memory.aria.cardIdle',{number:index+1}));}
    open=[];timer=null;
  }
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-memory-card]');if(!button || !buttons.includes(button))return;
    const index=Number(button.dataset.index);
    if(timer || open.includes(index)||matched.has(index))return;
    button.classList.add('is-open');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',t('runtime.memory.aria.cardOpen',{number:index+1,label:labels[values[index]]}));open.push(index);
    if(open.length<2)return;
    attempts++;
    if(values[open[0]]===values[open[1]]) {
      for(const i of open){matched.add(i);buttons[i].classList.add('is-matched');buttons[i].setAttribute('aria-disabled','true');}
      open=[];
      status.textContent=matched.size===12
        ? t('runtime.memory.status.complete',{attempts})
        : t('runtime.memory.status.progress',{matchedPairs:matched.size/2,totalPairs:6});
    } else {
      status.textContent=t(attempts%2 ? 'runtime.memory.status.mismatch.odd' : 'runtime.memory.status.mismatch.even');
      timer=setTimeout(closeUnmatched,1000);
    }
  });
  document.querySelector('[data-memory-reset]').addEventListener('click',()=>reset(true));reset();
  const button=document.querySelector('[data-fika-button]'), result=document.querySelector('[data-fika-result]'), note=document.querySelector('[data-fika-status]'), board=document.querySelector('.fika-board');
  let started=null;
  button.addEventListener('click',()=>{
    if(started===null){started=performance.now();button.textContent=t('runtime.fika.button.stop');board.classList.add('is-timing');result.textContent=t('runtime.fika.result.running');note.textContent=t('runtime.fika.status.running');}
    else {const outcome=fikaResult(performance.now()-started);started=null;board.classList.remove('is-timing');result.textContent=t('runtime.fika.result.seconds',{seconds:outcome.seconds});note.textContent=outcome.comment;button.textContent=t('runtime.fika.button.again');}
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)return;
    if(timer){clearTimeout(timer);closeUnmatched();}
    if(started!==null){started=null;board.classList.remove('is-timing');result.textContent=t('runtime.fika.result.paused');button.textContent=t('runtime.fika.button.restart');note.textContent=t('runtime.fika.status.paused');}
  });
}
