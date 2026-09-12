export function initContact() {
  const box=document.querySelector('[data-postbox]');
  const form=document.querySelector('[data-contact-form]');
  const status=document.querySelector('[data-contact-status]');
  const button=document.querySelector('[data-contact-send]');
  const success=document.querySelector('[data-contact-success]');
  let widget=null, token='', loading=false, sending=false, sent=false, submission=null, previousPayload='';
  function canSend(){button.disabled=!token||sending||sent;}
  function loadScript() {
    if(window.turnstile)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;script.defer=true;
      const timer=setTimeout(()=>{script.remove();reject(new Error('timeout'));},15000);
      script.onload=()=>{clearTimeout(timer);resolve();};
      script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('script'));};
      document.head.append(script);
    });
  }
  async function open() {
    if(!box.open||loading||widget!==null||sent)return;
    loading=true;status.textContent='';
    try {
      const response=await fetch('/api/contact/config',{credentials:'same-origin',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});
      const config=response.ok?await response.json():null;
      if(!config?.enabled||!config.sitekey)throw new Error('unavailable');
      await loadScript();
      widget=window.turnstile.render(document.querySelector('[data-turnstile]'),{
        sitekey:config.sitekey,action:'contact',theme:'light',size:'flexible',appearance:'interaction-only',
        callback:value=>{token=value;canSend();},
        'expired-callback':()=>{token='';canSend();},
        'error-callback':()=>{token='';canSend();status.textContent='Kontrollen kunde inte slutföras. Stäng och öppna kuvertet för att försöka igen.';if(widget!==null){window.turnstile.remove(widget);widget=null;}return true;}
      });
    } catch {status.textContent='Postluckan är tillfälligt stängd. Försök öppna den igen om en stund.';}
    finally{loading=false;}
  }
  box.addEventListener('toggle',open);if(box.open)open();
  form.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||sent)return;
    const fields=[form.elements.name,form.elements.email];
    fields.forEach(field=>{field.value=field.value.trim();});
    const invalid=fields.find(field=>!field.validity.valid||!field.value);
    if(invalid){invalid.setAttribute('aria-invalid','true');status.textContent=invalid.name==='name'?'Vad heter du? Skriv ditt namn.':'Skriv en giltig mejladress så jag kan återkomma.';invalid.focus();return;}
    if(!token){status.textContent='Vänta tills säkerhetskontrollen är klar.';return;}
    const data={name:form.elements.name.value,email:form.elements.email.value,message:form.elements.message.value.trim(),website:form.elements.website.value};
    const payload=JSON.stringify(data);
    if(payload!==previousPayload||!submission){submission=crypto.randomUUID();previousPayload=payload;}
    sending=true;canSend();form.setAttribute('aria-busy','true');button.textContent='På väg till Omar…';status.textContent='';
    try {
      const response=await fetch('/api/contact',{method:'POST',credentials:'same-origin',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token,submission}),signal:AbortSignal.timeout(30000)});
      const result=await response.json();
      if(!response.ok||result.ok!==true){status.textContent=typeof result.message==='string'?result.message:'Utskicket kunde inte bekräftas. Försök igen.';return;}
      sent=true;form.hidden=true;success.hidden=false;success.focus({preventScroll:true});form.reset();
      if(widget!==null){window.turnstile.remove(widget);widget=null;}
    } catch {status.textContent='Posten kom inte hela vägen. Dina rader finns kvar. Försök igen.';}
    finally {
      sending=false;token='';form.removeAttribute('aria-busy');button.textContent='Skicka till Omar';canSend();
      if(!sent&&widget!==null)window.turnstile.reset(widget);
    }
  });
}
