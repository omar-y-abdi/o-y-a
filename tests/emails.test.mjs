import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { acknowledgment,notification,FROM } from '../src/server/emails.mjs';

test('mail uses a real bounded GIF and a usable static first-frame fallback',async()=>{
  const gif=await readFile('public/mail/omar-smile.gif');
  assert.equal(gif.subarray(0,6).toString(),'GIF89a');
  assert.equal(gif.readUInt16LE(6),192);assert.equal(gif.readUInt16LE(8),192);
  assert.ok(gif.length<160000,'GIF should be a small accessory, not an entire email screenshot');
  assert.ok((await stat('public/mail/omar-smile.png')).size>0);
});
test('both messages are real table emails with text alternatives and no public owner address',()=>{
  assert.equal(FROM,'Omar Yusuf <hej@hej.omaryusuf.se>');
  for(const item of [acknowledgment(),notification({name:'Mira Test',email:'mira@example.org',message:'En fråga.'})]) {
    assert.match(item.html,/^<!DOCTYPE html><html lang="sv">/);
    assert.ok(item.text.length>50 && item.subject.length>5);
    assert.ok(!/<(?:style|script|form|input|button|iframe|video|div)\b/i.test(item.html));
    assert.ok(!item.html.includes('@chalmers.se'));
    for(const table of item.html.matchAll(/<table\b[^>]*>/g))for(const attr of ['cellpadding="0"','cellspacing="0"','border="0"'])assert.ok(table[0].includes(attr),table[0]);
    for(const image of item.html.matchAll(/<img\b[^>]*>/g))for(const attr of ['alt="','width="','height="','border="0"','display:block','src="https://'])assert.ok(image[0].includes(attr),image[0]);
  }
});
test('automated acknowledgment does not reflect arbitrary contact input',()=>{
  const a=acknowledgment({name:'INJECT_ME',message:'INJECT_ME'});
  assert.ok(!a.html.includes('INJECT_ME'));assert.ok(!a.text.includes('INJECT_ME'));
});
