import { DEFAULT_EMAIL, isEmailAddress, renderEmail } from './email-render.mjs';
import { readContactSettings } from './contact-secrets.mjs';
import { resourceSlots } from '../content/resources.mjs';
import { readBounded } from '../api/http.mjs';
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
export function contactReady(env) {
  return isEmailAddress(env.CONTACT_TO) && typeof env.RESEND_API_KEY==='string' && !!env.RESEND_API_KEY && typeof env.TURNSTILE_SECRET_KEY==='string' && !!env.TURNSTILE_SECRET_KEY && typeof env.TURNSTILE_SITE_KEY==='string' && !!env.TURNSTILE_SITE_KEY && typeof env.CONTACT_HASH_SECRET==='string' && env.CONTACT_HASH_SECRET.length>=32 && typeof env.CONTACT_RATE_LIMIT?.limit==='function';
}
// Saved settings override env per name; an unreadable saved value is undefined, never env.
const withSettings=async env=>({...env,...(await readContactSettings(env)).values});
export async function contactConfig(env){env=await withSettings(env);return json({enabled:contactReady(env),sitekey:contactReady(env)?env.TURNSTILE_SITE_KEY:null});}
export async function contactDigest(value,secret) {
  const encoder=new TextEncoder();const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function handleContact(request,env,transport=fetch) {
  env=await withSettings(env);
  const policy=contactReady(env)?{'RateLimit-Policy':'"contact";q=5;w=60'}:{};
  const guidance={
    400:['INVALID_REQUEST','Check the form fields and send valid JSON from the webpage.'],
    403:['FORBIDDEN','Use the first-party contact page and pass the security challenge.'],
    405:['METHOD_NOT_ALLOWED','Use POST for this form.'],
    409:['STALE_CONTENT','Reload the contact page before resubmitting.'],
    413:['PAYLOAD_TOO_LARGE','Reduce the form request size.'],
    415:['UNSUPPORTED_MEDIA_TYPE','Send Content-Type: application/json.'],
    429:['RATE_LIMITED','Wait at least 60 seconds before attempting again.'],
    503:['SERVICE_UNAVAILABLE','Use the published contact page later; do not retry automatically.'],
  };
  const fail=(message,status=400,headers={})=>{
    const [code,hint]=guidance[status]||guidance[400];
    return json({ok:false,message,code,hint},status,{...policy,...(status===429?{'RateLimit':'"contact";r=0;t=60'}:{}),...headers});
  };
  if(request.method!=='POST')return fail('Använd formulärets skickaknapp.',405,{Allow:'POST'});
  const url=new URL(request.url);
  if(request.headers.get('Origin')!==url.origin || request.headers.get('Sec-Fetch-Site')==='cross-site')return fail('Öppna formuläret på webbplatsen och försök igen.',403);
  if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return fail('Fel format på meddelandet.',415);
  let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,16384)??new Uint8Array()));}catch(error){return fail('Meddelandet kunde inte läsas.',error instanceof RangeError?413:400);}
  if(!data||Array.isArray(data)||typeof data!=='object'||Object.keys(data).some(k=>!['name','email','message','website','token','submission','contentVersion'].includes(k)))return fail('Kontrollera formuläret.');
  const contentVersion=data.contentVersion??0;
  if(!Number.isSafeInteger(contentVersion)||contentVersion<0)return fail('Kontrollera formulärets version.');
  if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100||/[\u0000-\u001f\u007f]/.test(data.name))return fail('Skriv ditt namn på en rad.');
  if(!isEmailAddress(data.email))return fail('Kontrollera mejladressen.');
  if(data.message!==undefined && (typeof data.message!=='string'||data.message.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.message)))return fail('Meddelandet får innehålla högst 4 000 tecken.');
  if(data.website!=='' || typeof data.token!=='string'||!data.token||data.token.length>2048||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submission||''))return fail('Formuläret behöver kontrolleras igen.');
  if(!contactReady(env))return fail('Postluckan är tillfälligt stängd. Försök igen senare.',503);
  try {
    const ip=request.headers.get('CF-Connecting-IP');
    if(!ip)return fail('Förfrågan kunde inte kontrolleras.',403);
    const ipKey=await contactDigest('ip:'+ip,env.CONTACT_HASH_SECRET);
    const emailKey=await contactDigest('email:'+data.email.toLowerCase(),env.CONTACT_HASH_SECRET);
    for(const key of [ipKey,emailKey])if(!(await env.CONTACT_RATE_LIMIT.limit({key})).success)return fail('Postluckan behöver en liten paus. Försök igen om en minut.',429,{'Retry-After':'60'});
    const verification=await transport('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.token,remoteip:ip}),signal:AbortSignal.timeout(8000)});
    if(!verification.ok)return fail('Kontrollen tog en paus. Försök igen.',503);
    const verified=await verification.json();
    if(verified.success!==true||verified.hostname!==url.hostname||verified.action!=='contact')return fail('Kontrollen behöver göras om. Försök igen.',403);
    const payload={name:data.name.trim(),email:data.email,message:data.message?.trim()||''};
    // Pin receipt images and templates to the loaded page version: retries keep
    // the same immutable provider payload even when the owner publishes again.
    // A revision without an @email row (or with null) uses the default mails.
    let resources=resourceSlots,email;
    if(contentVersion){
      const rows=(await env.CMS_DB?.prepare("SELECT p.path, p.html FROM cms_rendered p JOIN cms_revisions r ON r.version = p.version WHERE p.version = ? AND p.path IN ('@resources','@email')").bind(contentVersion).all())?.results??[];
      const pinned=path=>rows.find(row=>row.path===path);
      if(pinned('@resources'))resources=JSON.parse(pinned('@resources').html);
      else if(!await env.CMS_DB?.prepare('SELECT version FROM cms_revisions WHERE version = ?').bind(contentVersion).first())return fail('Sidans version saknas. Ladda om formuläret.',409);
      email=JSON.parse(pinned('@email')?.html??'null')??undefined;
    }
    const id=await contactDigest(JSON.stringify([data.submission,payload,...(contentVersion?[contentVersion]:[])]),env.CONTACT_HASH_SECRET);
    // Only the notification sees visitor input; the receipt never reflects it.
    const message=(kind,head,visitor)=>{const {from,subject,html,text}=renderEmail(email,kind,{resources,origin:url.origin,...visitor});return {from,...head,subject,html,text};};
    const emails=[message('notification',{to:[env.CONTACT_TO],reply_to:data.email},{visitor:payload}),...((email??DEFAULT_EMAIL).templates.receipt.enabled?[message('receipt',{to:[data.email]})]:[])];
    const response=await transport('https://api.resend.com/emails/batch',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`contact/${id}`},body:JSON.stringify(emails),signal:AbortSignal.timeout(12000)});
    if(!response.ok)return fail('Vi kunde inte bekräfta utskicket. Dina rader finns kvar här. Försök igen.',503);
    const result=await response.json();
    if(!Array.isArray(result.data)||result.data.length!==emails.length||result.data.some(item=>typeof item?.id!=='string'||!item.id))return fail('Vi kunde inte bekräfta utskicket. Försök igen.',503);
    return json({ok:true});
  } catch {return fail('Posten kom inte hela vägen. Dina rader finns kvar. Försök igen.',503);}
}
