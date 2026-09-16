import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
test('rate limits and provider exceptions never become success',async()=>{const h=await handler(),s=provider(),e=env();e.CONTACT_RATE_LIMIT.limit=async()=>({success:false});assert.equal((await h(request(),e,s.fetch)).status,429);assert.equal(s.calls.length,0);assert.equal((await h(request(),env(),async()=>{throw Error('secret transport error');})).status,503);});
test('hostname action and Turnstile failure checked before email',async()=>{const h=await handler();for(const options of [{verify:false},{verification:{hostname:'evil.example'}},{verification:{action:'login'}}]){const s=provider(options);assert.equal((await h(request(),env(),s.fetch)).status,403);assert.equal(s.calls.length,1);}});
test('batch partial response and errors never become success',async()=>{const h=await handler();for(const options of [{status:500},{result:{data:[{id:'only-one'}]}},{result:{data:[{},{}]}},{status:409}]){const s=provider(options);assert.equal((await h(request(),env(),s.fetch)).status,503);}});
test('retries with new challenge token keep the same send idempotency key',async()=>{const h=await handler(),a=provider(),b=provider();await h(request(),env(),a.fetch);await h(request({...valid,token:'fresh-token'}),env(),b.fetch);assert.equal(a.calls[1].init.headers['Idempotency-Key'],b.calls[1].init.headers['Idempotency-Key']);assert.equal(a.calls[1].init.body,b.calls[1].init.body);});
test('escaping confines attacker HTML to plain text and never reflects it in acknowledgment',async()=>{const h=await handler(),s=provider();assert.equal((await h(request({...valid,message:'<img src=x onerror=alert(1)>'}),env(),s.fetch)).status,200);const emails=JSON.parse(s.calls[1].init.body);assert.ok(emails[0].html.includes('&lt;img'));assert.ok(!emails[0].html.includes('<img src=x'));assert.ok(!emails[1].html.includes('onerror'));});
test('the full allowed message length also works for multibyte text',async()=>{
 const h=await handler(),s=provider();
 const r=await h(request({...valid,name:'名'.repeat(100),message:'漢'.repeat(4000),token:'t'.repeat(2048)}),env(),s.fetch);
 assert.equal(r.status,200);assert.equal(s.calls.length,2);
});
