import assert from 'node:assert/strict';
const origin = 'https://omaryusuf.se';
for (const [path, expected] of [['/',200],['/verkstad/',200],['/om/',200],['/kontakt/',200],['/integritet/',200],['/kakor/',200],['/villkor/',200],['/tillganglighet/',200],['/projekt/furl/',200],['/projekt/blade-blend/',200],['/projekt/backhaul/',200],['/sitemap.xml',200],['/robots.txt',200],['/llms.txt',200],['/this-page-does-not-exist/',404]]) {
  const response = await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(12000)});
  assert.equal(response.status,expected,`${path}: expected ${expected}, got ${response.status}`);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  if (path === '/') assert.ok((await response.text()).includes('Glädjeverkstaden'));
  console.log('PASS',path,expected);
}
const www = await fetch('https://www.omaryusuf.se/verkstad/?kort=k01',{redirect:'manual',signal:AbortSignal.timeout(12000)});
assert.equal(www.status,308);
assert.equal(www.headers.get('location'),origin+'/verkstad/?kort=k01');
console.log('PASS www canonical redirect');
