import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { contactConfig, handleContact } from '../src/server/contact.mjs';
import { encryptSecret } from '../src/server/contact-secrets.mjs';
import { DEFAULT_EMAIL, renderEmail } from '../src/server/email-render.mjs';
import { validateEmailSettings } from '../src/cms/email-validate.mjs';
import { resourceSlots } from '../src/content/resources.mjs';
import { publicationChunks } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';
const valid={name:'Ada Lovelace',email:'ada@example.net',message:'En idé',website:'',token:'verified-token',submission:'6c77eb01-9260-4e9c-8a72-262b520ee1b1'};
const env=()=>({CONTACT_TO:'owner@example.org',RESEND_API_KEY:'test-key',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'site-key',CONTACT_HASH_SECRET:'a'.repeat(64),CONTACT_RATE_LIMIT:{limit:async()=>({success:true})}});
const request=(data=valid,headers={},method='POST')=>new Request('https://omaryusuf.se/api/contact',{method,headers:{Origin:'https://omaryusuf.se','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...headers},...(!['GET','HEAD'].includes(method)?{body:typeof data==='string'?data:JSON.stringify(data)}:{})});
async function handler(){assert.ok(existsSync('src/server/contact.mjs'),'Contact handler must exist');return (await import('../src/server/contact.mjs')).handleContact;}
function provider(options={}) {const calls=[];const fetch=async(url,init)=>{calls.push({url,init});if(url.includes('siteverify'))return Response.json({success:options.verify!==false,hostname:'omaryusuf.se',action:'contact',...options.verification});return Response.json(options.result??{data:[{id:'owner-id'},{id:'visitor-id'}]},{status:options.status??200});};return {calls,fetch};}
test('valid contact sends two isolated messages, optional message, no inbox disclosure',async()=>{
 const handle=await handler(), service=provider();const response=await handle(request({...valid,message:''}),env(),service.fetch);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
 const emails=JSON.parse(service.calls.at(-1).init.body);assert.equal(emails.length,2);assert.deepEqual(emails[0].to,['owner@example.org']);assert.deepEqual(emails[1].to,['ada@example.net']);assert.equal(emails[0].reply_to,'ada@example.net');assert.ok(!emails[1].html.includes('owner@example.org'));assert.ok(!emails[1].text.includes('owner@example.org'));
});
for (const [name,data,code] of [
 ['missing name',{...valid,name:''},400],['bad email',{...valid,email:'bad'},400],['email newline',{...valid,email:'a@b.se\nBcc:x@y.se'},400],['name newline',{...valid,name:'Ada\nBcc'},400],['message too long',{...valid,message:'x'.repeat(4001)},400],['missing token',{...valid,token:''},400],['bad submission id',{...valid,submission:'../escape'},400],['honeypot',{...valid,website:'spam'},400],['extra recipient',{...valid,to:'attacker@example.net'},400],['malformed JSON','{',400],['oversized body','x'.repeat(17000),413]])
 test(name,async()=>{const handle=await handler(),s=provider();const r=await handle(request(data),env(),s.fetch);assert.equal(r.status,code);assert.equal(s.calls.length,0);});
test('wrong origin and content-type never call providers',async()=>{const h=await handler();for(const [headers,status] of [[{Origin:'https://evil.example'},403],[{'Content-Type':'text/plain'},415],[{'Sec-Fetch-Site':'cross-site'},403]]){const s=provider();assert.equal((await h(request(valid,headers),env(),s.fetch)).status,status);assert.equal(s.calls.length,0);}});
test('missing configuration fails closed',async()=>{const h=await handler(),s=provider();for(const key of Object.keys(env())){const e=env();delete e[key];assert.equal((await h(request(),e,s.fetch)).status,503);}assert.equal(s.calls.length,0);});
test('rate limits and provider exceptions never become success',async()=>{
 const h=await handler(),s=provider(),e=env();e.CONTACT_RATE_LIMIT.limit=async()=>({success:false});
 const denied=await h(request(),e,s.fetch);
 assert.equal(denied.status,429);
 assert.equal(denied.headers.get('Retry-After'),'60');
 assert.equal(denied.headers.get('RateLimit-Policy'),'"contact";q=5;w=60');
 assert.equal(denied.headers.get('RateLimit'),'"contact";r=0;t=60');
 assert.equal(denied.headers.get('RateLimit-Remaining'),null);
 const message=await denied.json();
 assert.equal(message.code,'RATE_LIMITED');
 assert.ok(message.hint);
 assert.equal(s.calls.length,0);
 assert.equal((await h(request(),env(),async()=>{throw Error('secret transport error');})).status,503);
});
test('hostname action and Turnstile failure checked before email',async()=>{const h=await handler();for(const options of [{verify:false},{verification:{hostname:'evil.example'}},{verification:{action:'login'}}]){const s=provider(options);assert.equal((await h(request(),env(),s.fetch)).status,403);assert.equal(s.calls.length,1);}});
test('batch partial response and errors never become success',async()=>{const h=await handler();for(const options of [{status:500},{result:{data:[{id:'only-one'}]}},{result:{data:[{},{}]}},{status:409}]){const s=provider(options);assert.equal((await h(request(),env(),s.fetch)).status,503);}});
test('retries with new challenge token keep the same send idempotency key',async()=>{const h=await handler(),a=provider(),b=provider();await h(request(),env(),a.fetch);await h(request({...valid,token:'fresh-token'}),env(),b.fetch);assert.equal(a.calls[1].init.headers['Idempotency-Key'],b.calls[1].init.headers['Idempotency-Key']);assert.equal(a.calls[1].init.body,b.calls[1].init.body);});
test('escaping confines attacker HTML to plain text and never reflects it in acknowledgment',async()=>{const h=await handler(),s=provider();assert.equal((await h(request({...valid,message:'<img src=x onerror=alert(1)>'}),env(),s.fetch)).status,200);const emails=JSON.parse(s.calls[1].init.body);assert.ok(emails[0].html.includes('&lt;img'));assert.ok(!emails[0].html.includes('<img src=x'));assert.ok(!emails[1].html.includes('onerror'));});
test('the full allowed message length also works for multibyte text',async()=>{
 const h=await handler(),s=provider();
 const r=await h(request({...valid,name:'名'.repeat(100),message:'漢'.repeat(4000),token:'t'.repeat(2048)}),env(),s.fetch);
 assert.equal(r.status,200);assert.equal(s.calls.length,2);
});

// A D1 stand-in for the two contact queries: saved settings (unbound .all())
// and the pinned revision rows (bound .all() / .first()).
const fakeDb=(revisions,secrets=[])=>({prepare(sql){const run=params=>({all:async()=>sql.includes('cms_contact_secrets')?{results:secrets}:{results:Object.entries(revisions[params[0]]??{}).map(([path,value])=>({path,html:JSON.stringify(value)}))},first:async()=>revisions[params[0]]?{version:params[0]}:null});return {...run([]),bind:(...params)=>run(params)};}});
const variant=edit=>{const email=structuredClone(DEFAULT_EMAIL);edit(email);return email;};
const sentBodies=calls=>JSON.parse(calls.at(-1).init.body);
test('a retry after a template change sends the same body and key',async()=>{
 const templateA=DEFAULT_EMAIL,templateB=variant(email=>{email.templates.notification.subject='Ny mall B';});
 const v1={'@resources':resourceSlots,'@email':templateA},v2={'@resources':resourceSlots,'@email':templateB};
 const first=provider(),retry=provider(),fresh=provider();
 assert.equal((await handleContact(request({...valid,contentVersion:1}),{...env(),CMS_DB:fakeDb({1:v1})},first.fetch)).status,200);
 assert.equal((await handleContact(request({...valid,contentVersion:1,token:'fresh-token'}),{...env(),CMS_DB:fakeDb({1:v1,2:v2})},retry.fetch)).status,200);
 assert.equal(first.calls[1].init.headers['Idempotency-Key'],retry.calls[1].init.headers['Idempotency-Key']);
 assert.equal(first.calls[1].init.body,retry.calls[1].init.body);
 assert.equal((await handleContact(request({...valid,contentVersion:2}),{...env(),CMS_DB:fakeDb({1:v1,2:v2})},fresh.fetch)).status,200);
 assert.equal(sentBodies(fresh.calls)[0].subject,'Ny mall B');
 assert.notEqual(first.calls[1].init.headers['Idempotency-Key'],fresh.calls[1].init.headers['Idempotency-Key']);
});
test('B8: a frame publication keeps contact retries pinned to the original custom letter image',async()=>{
 const oldImage='/media/123e4567-e89b-42d3-a456-426614174000.png',newImage='/media/123e4567-e89b-42d3-a456-426614174001.png';
 const resources=src=>({...resourceSlots,emailStatic:{...resourceSlots.emailStatic,src,alt:'Ägarens brevbild'}});
 const project=structuredClone(initial),changed=structuredClone(initial);
 assert.equal(project.schemaVersion,2);
 changed.frame.html=changed.frame.html.replace('Thanks for stopping by.','En ny sidram.');
 const rows=(project,assets)=>Object.fromEntries(publicationChunks(project,assets).flat().filter(row=>['@resources','@email'].includes(row.path)).map(row=>[row.path,JSON.parse(row.html)]));
 const v1=rows(project,resources(oldImage)),v2=rows(changed,resources(newImage));
 const first=provider(),retry=provider(),fresh=provider();
 assert.equal((await handleContact(request({...valid,contentVersion:1}),{...env(),CMS_DB:fakeDb({1:v1})},first.fetch)).status,200);
 assert.equal((await handleContact(request({...valid,contentVersion:1,token:'fresh-token'}),{...env(),CMS_DB:fakeDb({1:v1,2:v2})},retry.fetch)).status,200);
 assert.equal(first.calls[1].init.body,retry.calls[1].init.body);
 assert.equal(first.calls[1].init.headers['Idempotency-Key'],retry.calls[1].init.headers['Idempotency-Key']);
 assert.ok(sentBodies(first.calls)[1].html.includes(oldImage));
 assert.equal((await handleContact(request({...valid,contentVersion:2}),{...env(),CMS_DB:fakeDb({1:v1,2:v2})},fresh.fetch)).status,200);
 assert.ok(sentBodies(fresh.calls)[1].html.includes(newImage));
 assert.ok(!sentBodies(fresh.calls)[1].html.includes(oldImage));
});
test('contentVersion 0 uses default templates',async()=>{
 const payload={name:valid.name,email:valid.email,message:valid.message};
 const expected=[renderEmail(DEFAULT_EMAIL,'notification',{resources:resourceSlots,origin:'https://omaryusuf.se',visitor:payload}),renderEmail(DEFAULT_EMAIL,'receipt',{resources:resourceSlots,origin:'https://omaryusuf.se'})];
 for(const [contentVersion,revisions] of [[0,{}],[4,{4:{'@resources':resourceSlots}}],[5,{5:{'@resources':resourceSlots,'@email':null}}]]){
  const s=provider();
  assert.equal((await handleContact(request({...valid,contentVersion}),{...env(),CMS_DB:fakeDb(revisions)},s.fetch)).status,200);
  const emails=sentBodies(s.calls);
  assert.equal(emails.length,2);
  emails.forEach((email,index)=>{assert.equal(email.html,expected[index].html);assert.equal(email.text,expected[index].text);assert.equal(email.subject,expected[index].subject);assert.equal(email.from,expected[index].from);});
  assert.equal(emails[0].reply_to,valid.email);assert.equal(emails[1].reply_to,undefined);
 }
});
test('config keeps its shape and opens only when complete',async()=>{
 const read=async e=>(await contactConfig(e)).json();
 const open=await read(env());
 assert.deepEqual(Object.keys(open),['enabled','sitekey']);
 assert.deepEqual(open,{enabled:true,sitekey:'site-key'});
 for(const key of Object.keys(env())){const e=env();delete e[key];assert.deepEqual(await read(e),{enabled:false,sitekey:null},key);}
 const master='a'.repeat(64),saved={RESEND_API_KEY:'re_savedKey_123456',CONTACT_TO:'saved@example.org',TURNSTILE_SITE_KEY:'0xsavedSite_1234',TURNSTILE_SECRET_KEY:'0xsavedSecret_1234'};
 const rows=await Promise.all(Object.entries(saved).map(async([name,value])=>({name,...await encryptSecret(master,name,value),updated_at:'2026-10-24T10:00:00.000Z'})));
 const onlySaved={CONTACT_HASH_SECRET:master,CONTACT_RATE_LIMIT:env().CONTACT_RATE_LIMIT,CMS_DB:fakeDb({},rows)};
 assert.deepEqual(await read(onlySaved),{enabled:true,sitekey:'0xsavedSite_1234'});
 assert.deepEqual(await read({...onlySaved,CONTACT_HASH_SECRET:undefined}),{enabled:false,sitekey:null});
 assert.deepEqual(await read({...onlySaved,CONTACT_RATE_LIMIT:undefined}),{enabled:false,sitekey:null});
});
test('receipt off sends one mail and checks one id',async()=>{
 const off={6:{'@resources':resourceSlots,'@email':variant(email=>{email.templates.receipt.enabled=false;})}};
 const one=provider({result:{data:[{id:'owner-id'}]}});
 const response=await handleContact(request({...valid,contentVersion:6}),{...env(),CMS_DB:fakeDb(off)},one.fetch);
 assert.equal(response.status,200);
 const emails=sentBodies(one.calls);
 assert.equal(emails.length,1);assert.deepEqual(emails[0].to,['owner@example.org']);
 assert.equal((await handleContact(request({...valid,contentVersion:6}),{...env(),CMS_DB:fakeDb(off)},provider().fetch)).status,503);
 assert.equal((await handleContact(request(),env(),provider({result:{data:[{id:'owner-id'}]}}).fetch)).status,503);
});

test('a valid visitor mailbox cannot inject mailto headers into the delivered notification',async()=>{
 const email=structuredClone(DEFAULT_EMAIL);email.templates.notification.blocks[1].text='[svara](mailto:{mejl})';
 const configured=validateEmailSettings(email),address='victim?bcc=copy@attacker.example',service=provider();
 const response=await handleContact(request({...valid,email:address,contentVersion:9}),{...env(),CMS_DB:fakeDb({9:{'@resources':resourceSlots,'@email':configured}})},service.fetch);
 assert.equal(response.status,200);
 const [notification,receipt]=sentBodies(service.calls);
 const href=notification.html.match(/<a href="([^"]*)"/)[1],url=new URL(href);
 assert.equal(decodeURIComponent(url.pathname),address);assert.equal(url.search,'');assert.equal(url.hash,'');
 assert.equal(notification.reply_to,address);assert.deepEqual(receipt.to,[address]);
 assert.ok(!receipt.html.includes(address));
});
