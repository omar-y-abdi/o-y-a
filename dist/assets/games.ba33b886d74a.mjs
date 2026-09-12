import { fikaResult, shuffledPairs } from './playlogic.3bb2d3ce7a2e.mjs';
export function initGames() {
  const grid = document.querySelector('[data-memory-grid]');
  const status = document.querySelector('[data-memory-status]');
  const labels = ['sol','kaffekopp','blixt','blomma','hjärta','kod'];
  const drawings = [
    '<circle cx="30" cy="30" r="13"/><path d="M30 5v6m0 38v6M5 30h6m38 0h6M12 12l5 5m26 26 5 5m0-36-5 5M17 43l-5 5"/>',
    '<path d="M12 22h30v22q-15 10-30 0zM42 26h8q12 12-8 13M20 14v-4m12 4V8"/>',
    '<path d="m34 5-20 28h14l-3 22 22-31H33z"/>',
    '<path d="M30 21C7-6 0 37 22 30 0 52 40 63 31 39c16 23 41-14 10-10 25-17-6-42-11-8Z"/><circle cx="30" cy="30" r="5"/>',
    '<path d="M30 50 9 29C-3 9 22 0 30 17 38 0 63 9 51 29Z"/>',
    '<path d="m19 17-12 13 12 13m22-26 12 13-12 13M34 12 26 48"/>'
  ];
  let values=[], open=[], matched=new Set(), attempts=0, timer=null;
  function reset(focus=false) {
    clearTimeout(timer);timer=null;open=[];matched.clear();attempts=0;values=shuffledPairs();
    grid.replaceChildren(...values.map((value,index)=>{
      const button=document.createElement('button');button.type='button';button.className='memory-card';button.dataset.index=index;
      button.setAttribute('aria-label',`Vänd kort ${index+1}`);button.setAttribute('aria-pressed','false');
      button.innerHTML=`<span class="memory-back" aria-hidden="true">?</span><span class="memory-front memory-color-${value}" aria-hidden="true"><svg width="52" height="52" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[value]}</svg></span>`;
      return button;
    }));
    status.textContent='Vänd två kort och se om de känner varandra.';
    if(focus)grid.firstElementChild.focus();
  }
  function closeUnmatched() {
    for(const index of open) {const button=grid.children[index];button.classList.remove('is-open');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Vänd kort ${index+1}`);}
    open=[];timer=null;
  }
  grid.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const index=Number(button.dataset.index);
    if(timer || open.includes(index)||matched.has(index))return;
    button.classList.add('is-open');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',`Kort ${index+1}: ${labels[values[index]]}`);open.push(index);
    if(open.length<2)return;
    attempts++;
    if(values[open[0]]===values[open[1]]) {
      for(const i of open){matched.add(i);grid.children[i].classList.add('is-matched');grid.children[i].setAttribute('aria-disabled','true');}
      open=[];
      status.textContent=matched.size===12 ? `Alla hittade hem på ${attempts} försök. Hjärnan får ta rast.` : `${matched.size/2} av 6 par. De där två hade tydligen redan träffats.`;
    } else {
      status.textContent=attempts%2 ? 'Inte ett par. Mer två bekanta från olika sammanhang.' : 'Nästan. Om man är väldigt generös med ordet nästan.';
      timer=setTimeout(closeUnmatched,1000);
    }
  });
  document.querySelector('[data-memory-reset]').addEventListener('click',()=>reset(true));reset();
  const button=document.querySelector('[data-fika-button]'), result=document.querySelector('[data-fika-result]'), note=document.querySelector('[data-fika-status]'), board=document.querySelector('.fika-board');
  let started=null;
  button.addEventListener('click',()=>{
    if(started===null){started=performance.now();button.textContent='Stoppa min fika';board.classList.add('is-timing');result.textContent='…';note.textContent='Ingen stress. Din tidskänsla har ordet.';}
    else {const outcome=fikaResult(performance.now()-started);started=null;board.classList.remove('is-timing');result.textContent=outcome.seconds+' s';note.textContent=outcome.comment;button.textContent='En fika till';}
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)return;
    if(timer){clearTimeout(timer);closeUnmatched();}
    if(started!==null){started=null;board.classList.remove('is-timing');result.textContent='PAUS';button.textContent='Starta om min fika';note.textContent='Vi pausade när du lämnade fliken. Börja om när du är tillbaka.';}
  });
}
