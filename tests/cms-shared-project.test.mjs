import { test } from 'vitest';
import assert from 'node:assert/strict';
import { extractSharedValues, synchronizeSharedPage } from '../src/cms/shared-project.mjs';

const value='Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.';
const page=(id,text=value)=>({id,html:`<main id="main"><h1>${id}</h1></main><footer><p data-cms-node="${id}-p" data-cms-shared="footer.tagline">${text.replace('<br>','<br data-cms-node="'+id+'-br">')}</p></footer>`,css:''});

test('shared extraction ignores editor node identities',()=>{
  assert.equal(extractSharedValues(page('a').html).get('footer.tagline'),value);
});

test('editing one linked page propagates semantic content without replacing stable outer nodes',()=>{
  const project={pages:[page('a'),page('b')],sharedContent:{'footer.tagline':value}};
  const edited={...page('a'),html:page('a','Ny text<br>Fortfarande gemensam').html};
  const result=synchronizeSharedPage(project,'a',edited);
  assert.equal(result.sharedContent['footer.tagline'],'Ny text<br>Fortfarande gemensam');
  assert.equal(extractSharedValues(result.pages[1].html).get('footer.tagline'),'Ny text<br>Fortfarande gemensam');
  assert.match(result.pages[1].html,/data-cms-node="b-p"/);
});
