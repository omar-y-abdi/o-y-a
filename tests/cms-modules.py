"""Actual product modules in isolated Chromium DOM fixtures; no navigation bypass.

This complements, not replaces, the Worker-backed navigational CMS suites.
"""
import json
import base64
import os
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from card_export import CardFailure, assert_layout, wait_for_rendered_card

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'output/cms-modules'
PAGE = json.loads((OUT/'page.json').read_text())
FIXTURE = json.loads((OUT/'fixtures.json').read_text())
BUNDLE = (OUT/'entry.js').read_text()
SHELL = '''<!doctype html><html><head><style>body{margin:0}#editor{width:1000px;height:700px}#side{position:absolute;left:1020px;top:0;width:350px}#styles-panel,#blocks-panel,#layers-panel,#traits-panel{min-height:1px}</style></head><body><div id="editor"></div><aside id="side"><div id="selection-name"></div><div id="selection-type"></div><div id="custom-inspector"></div><div id="styles-panel"></div><div id="blocks-panel"></div><div id="layers-panel"></div><div id="traits-panel"></div></aside></body></html>'''
results = []
with sync_playwright() as pw:
    engine = os.environ.get('CMS_BROWSER', 'chromium')
    options = {'executable_path': os.environ['CMS_BROWSER_EXECUTABLE']} if os.environ.get('CMS_BROWSER_EXECUTABLE') else {}
    browser = getattr(pw, engine).launch(**options)

    def make_page(html=SHELL):
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.set_default_timeout(8000)
        page.set_content(html)
        page.add_style_tag(path=str(ROOT/'node_modules/grapesjs/dist/css/grapes.min.css'))
        page.add_style_tag(path=str(ROOT/'src/cms/styles.css'))
        page.add_script_tag(content=BUNDLE)
        return page

    def editor(page, content=None):
        page.evaluate('''data => {
          window.snapshots=[];window.ready=false;
          window.handle=cmsTest.createEditor({page:data,cssPath:'',assets:[],onChange(value){snapshots.push(value)},onSelect(){},onReady(){ready=true}});
        }''', content or PAGE)
        page.wait_for_function('ready')
        return page.frame_locator('#editor iframe.gjs-frame')

    smoke_cases = {
        'R14-active-typing-newlines-composition-flush',
        'R23-live-text-active-inactive-serialization-stable',
        'R12-clone-anchor-aria-svg-and-style',
        'cms-duplicate-inline-section-preserves-style',
        'cms-usability-resize-nudge-and-style-mode',
        'cms-usability-view-state-and-mobile-center',
        'cms-managed-svg-uses-shared-editor',
    }

    def run(name, fn):
        selected = os.environ.get('CMS_MODULE_CASE')
        if selected and selected != name: return
        if os.environ.get('CMS_MODULE_PROFILE') == 'smoke' and name not in smoke_cases: return
        try:
            value = fn()
            results.append({'name': name, 'passed': True, 'evidence': value})
            print('PASS '+name, flush=True)
        except Exception:
            error = traceback.format_exc()
            results.append({'name': name, 'passed': False, 'error': error})
            print('FAIL '+name+'\n'+error, flush=True)

    def active_input():
        page = make_page()
        try:
            frame = editor(page)
            heading = frame.locator('h1').first
            heading.dispatch_event('dblclick'); expect(heading).to_have_attribute('contenteditable', 'true'); heading.press('ControlOrMeta+A'); heading.press('Backspace')
            heading.press_sequentially('Still editing', delay=15)
            page.wait_for_timeout(700)
            state = page.evaluate('''()=>({visible:handle.editor.Canvas.getDocument().querySelector('h1').innerText,
                saved:snapshots.at(-1)?.html??'',active:handle.editor.Canvas.getDocument().querySelector('h1').isContentEditable})''')
            assert state['active'] and 'Still editing' in state['saved'], state
            heading.press('Shift+Enter'); heading.press_sequentially('Second line', delay=15)
            page.wait_for_timeout(700)
            assert page.evaluate("snapshots.at(-1).html.includes('Second line')")
            assert page.evaluate("handle.editor.Canvas.getDocument().querySelector('h1').isContentEditable")
            # IME input must not replace the active DOM or detach the selection.
            before = heading.evaluate('''el=>{window.composingElement=el;el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));return el.innerHTML}''')
            heading.evaluate('''el=>{el.append(document.createTextNode(' 日本語'));el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText',data:'日本語'}));el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'日本語'}))}''')
            page.wait_for_timeout(700)
            assert page.evaluate("snapshots.at(-1).html.includes('日本語')")
            assert heading.evaluate('el=>el===window.composingElement && el.isContentEditable')
            # Flush/save boundary reads the latest DOM even before the debounce.
            heading.press_sequentially('!')
            page.evaluate('handle.flush()')
            assert page.evaluate("snapshots.at(-1).html.includes('!')")
            return {'active': True, 'line_break_and_composition_captured': True, 'before_composition': before}
        finally: page.close()

    def live_text_serialization():
        page = make_page()
        try:
            value = page.evaluate(r'''()=>{
              const model = {};
              const activeHtml = '<main><button disabled=""><span data-cms-node="text">before</span></button><input disabled=""><br/><noscript><p>Keep no-script content</p></noscript><table><tbody><tr><td>Table cell</td></tr></tbody></table><svg viewBox="0 0 2 2"><path d="M0 0h2v2z"></path></svg></main>';
              const inactiveHtml = '<main><button disabled><span data-cms-node="text">after</span></button><input disabled><br><noscript><p>Keep no-script content</p></noscript><table><tbody><tr><td>Table cell</td></tr></tbody></table><svg viewBox="0 0 2 2"><path d="M0 0h2v2z"></path></svg></main>';
              const active = cmsTest.liveHtml({getWrapper:()=>({getInnerHTML(options){
                if (!options?.attributes) return activeHtml;
                const attrs = options.attributes(model, {});
                return activeHtml.replace('<span data-cms-node="text">', `<span data-cms-capture="${attrs['data-cms-capture']}" data-cms-node="text">`);
              }})}, {el:{isConnected:true},model,getChildrenContainer:()=>({innerHTML:'after'})});
              const inactive = cmsTest.liveHtml({getWrapper:()=>({getInnerHTML:()=>inactiveHtml})}, null);
              const roundtrip = cmsTest.liveHtml({getWrapper:()=>({getInnerHTML:()=>active})}, null);
              const serialize = html => cmsTest.liveHtml({getWrapper:()=>({getInnerHTML:()=>html})}, null);
              const fragments = {row:serialize('<tr><td>Standalone row</td></tr>'),cell:serialize('<td>Standalone cell</td>'),title:serialize('<title>Standalone title</title>')};
              const canonical = value => {const template=document.createElement('template');template.innerHTML=value;return template.innerHTML};
              const structure = value => {const parsed=new DOMParser().parseFromString(value,'text/html');return {noScript:parsed.querySelector('noscript p')?.textContent,tableCell:parsed.querySelector('table td')?.textContent,svgPath:parsed.querySelector('svg path')?.namespaceURI}};
              return {same:active===inactive, stable:active===roundtrip, canonicalSame:canonical(active)===canonical(inactive), fragments,
                fragmentTagsPreserved:/<tr\b/.test(fragments.row)&&/<td\b/.test(fragments.row)&&fragments.row.includes('Standalone row')&&/<td\b/.test(fragments.cell)&&fragments.cell.includes('Standalone cell')&&/<title\b/.test(fragments.title)&&fragments.title.includes('Standalone title'),
                activeHasEdit:active.includes('after')&&!active.includes('before'),
                inactiveHasEdit:inactive.includes('after')&&!inactive.includes('before'),
                activeStructure:structure(active),inactiveStructure:structure(inactive),
                hasBooleanAndVoid:active.includes('disabled')&&inactive.includes('disabled')&&active.includes('<input')&&inactive.includes('<input')&&active.includes('<br')&&inactive.includes('<br')};
            }''')
            assert value['activeHasEdit'] and value['inactiveHasEdit'], value
            assert value['fragmentTagsPreserved'], value
            expected_structure={'noScript':'Keep no-script content','tableCell':'Table cell','svgPath':'http://www.w3.org/2000/svg'}
            assert value['activeStructure']==expected_structure and value['inactiveStructure']==expected_structure, value
            assert value['hasBooleanAndVoid'], value
            assert value['canonicalSame'], value
            assert value['stable'], value
            assert value['same'], 'RTE and inactive model serializers must not create a phantom HTML diff: '+str(value)
            frame = editor(page)
            eligibility = page.evaluate('''()=>{
              const root=handle.editor.getWrapper(), fallback=root.find('noscript')[0];
              if(!fallback)return null;
              const chain=[];
              for(let node=fallback;node;node=node.parent())chain.push({tag:node.get('tagName')??'wrapper',editable:Boolean(node.get('editable'))});
              return {chain,editableAncestors:chain.filter(node=>node.editable).map(node=>node.tag)};
            }''')
            assert eligibility and eligibility['editableAncestors']==[], eligibility
            return {'serialization':value, 'protectedFallbackRteEligibility':eligibility}
        finally: page.close()

    def canonical_reload():
        for legacy in [{'pages': [{'component': '<main><h1>Different text</h1></main>'}]}, {'pages': {}}]:
            page = make_page()
            try:
                content = {**PAGE, 'html': '<main><h1>Canonical text</h1></main>', 'css': 'h1{color:rgb(201,32,17)}', 'project': legacy}
                canvas = editor(page, content)
                expect(canvas.locator('h1')).to_have_text('Canonical text')
                assert canvas.locator('h1').evaluate('el=>getComputedStyle(el).color') == 'rgb(201, 32, 17)'
            finally: page.close()
        return {'authoritative': 'HTML/CSS', 'legacy_variants': 2}

    def rich_structure():
        page = make_page()
        try:
            content = {**PAGE, 'html': '<main><h1>Hello <span id="accent-word" class="accent">world</span>.</h1><p>Simple<br>line</p></main>', 'css': '.accent{color:rgb(201,32,17)}', 'project': None}
            frame = editor(page, content)
            page.evaluate("window.accentModel=handle.editor.getWrapper().find('#accent-word')[0];accentModel.addStyle({'font-size':'31px'})")
            page.evaluate('''()=>{const ed=handle.editor;const c=ed.getWrapper().find('h1')[0];cmsTest.componentInspector(c,ed,{assets:[],change(){handle.flush(true)},onError(message){throw Error(message)},pickImage(){}})}''')
            expect(page.locator('#element-text')).to_be_visible()
            assert frame.locator('#accent-word').evaluate('el=>getComputedStyle(el).fontSize') == '31px'
            page.locator('#element-text').fill('Hello world.!')
            page.evaluate('handle.flush()')
            expect(frame.locator('h1 #accent-word.accent')).to_have_count(1)
            assert page.evaluate("handle.editor.getWrapper().find('#accent-word')[0]===accentModel")
            page.locator('#element-text').fill('Hello wXorld.!')
            expect(frame.locator('#accent-word')).to_have_text('wXorld')
            assert frame.locator('#accent-word').evaluate('el=>getComputedStyle(el).fontSize') == '31px'
            heading = frame.locator('h1'); heading.dispatch_event('dblclick'); expect(heading).to_have_attribute('contenteditable', 'true'); heading.press('End'); heading.press_sequentially('?')
            page.wait_for_timeout(700)
            assert frame.locator('.accent').evaluate('el=>getComputedStyle(el).color') == 'rgb(201, 32, 17)'
            assert page.evaluate("snapshots.at(-1).html.includes('class=\"accent\"')")
            heading.press('Escape')
            page.evaluate('''()=>{const ed=handle.editor;cmsTest.componentInspector(ed.getWrapper().find('p')[0],ed,{assets:[],change(){handle.flush(true)},onError(message){throw Error(message)},pickImage(){}})}''')
            page.locator('#element-text').fill('Simple\nchanged')
            page.evaluate('handle.flush()')
            assert page.evaluate("snapshots.at(-1).html.includes('changed')")
            return {'styled_span_retained': True, 'plaintext_newlines_retained': True}
        finally: page.close()

    def public_spoof():
        page = make_page(SHELL.replace('<div id="editor">', '<div hidden id="cms-preview-data">{"cards":[{"id":"spoof"}]}</div><div id="editor">'))
        try:
            value = page.evaluate('''async()=>{window.fetch=async url=>Response.json(url.includes('cards')?[{id:'validated',flavor:'kind',text:'Safe'}]:{}); const cards=await cmsTest.loadCards(); await cmsTest.loadCopy(); return cards.map(c=>c.id)}''')
            assert value == ['validated'], value
            return value
        finally: page.close()

    def transform_and_export():
        page = make_page()
        try:
            value = page.evaluate('''async()=>{
              const results=[];
              for(const width of [600,240]) {
                const host=document.createElement('div');host.style.width=width+'px';document.body.append(host);
                const design={html:'<article class="custom-card"><p data-card-text></p></article>',css:'.custom-card{box-sizing:border-box;width:400px;height:180px;padding:20px;background:rgb(250,200,30);transform:rotate(12deg) translate(18px,-10px)}'};
                const node=cmsTest.renderWin(host,{id:'test',flavor:'kind',text:'Visible win\\nSecond line',design});
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const transform=getComputedStyle(node).transform;
                const blob=await cmsTest.exportWin(host);const bytes=new Uint8Array(await blob.arrayBuffer());const dv=new DataView(bytes.buffer);
                const png=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
                const image=new Image();image.src=png;await image.decode();
                const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;const colors=new Set();
                for(let i=0;i<pixels.length;i+=4*17)if(pixels[i+3])colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);
                results.push({png,colors:colors.size,width,transform,inline:node.style.transform,text:node.querySelector('[data-card-text]').innerText,pngWidth:dv.getUint32(16),pngHeight:dv.getUint32(20),blobBytes:bytes.length});
              }return results;
            }''')
            for row in value:
                (OUT/f"rotated-{row['width']}.png").write_bytes(base64.b64decode(row.pop('png').split(',',1)[1]))
                assert row['colors'] > 2, row
                assert row['inline'] == '' and row['transform'] not in ['none', 'matrix(1, 0, 0, 1, 0, 0)'], row
                assert 'Second line' in row['text'] and row['pngWidth'] > 800 and row['pngHeight'] > 360, row
            assert value[0]['pngWidth'] == value[1]['pngWidth'], value
            return value
        finally: page.close()


    def text_ranges():
        page = make_page()
        try:
            value = page.evaluate(r"""()=>{
              const original='<span id="word" class="accent">Hi 😀</span> <em id="emphasis">world</em><br><a id="link" href="/om/">next</a>', results=[];
              for (const next of ['Hi 😀 world\nnext!','Hi 😃 world\nnext','Hi 😀 new world\nnext','Hi 😀 world next','Hi 😀\nworld\nnext','<img src=x onerror=1>','', 'Replacement\n日本語', 'Hi 😀 world\nnext']) {
                const html=cmsTest.replaceEditableText(original,next);
                if(cmsTest.editableText(html)!==next)throw Error(JSON.stringify({next,html}));
                const t=document.createElement('template');t.innerHTML=html;
                for(const selector of ['span#word.accent','em#emphasis','a#link[href="/om/"]'])if(!t.content.querySelector(selector))throw Error('Lost '+selector);
                if(t.content.querySelector('img'))throw Error('Plain text became markup');
                results.push({next,html});
              }
              return results;
            }""")
            return {'text_edits': len(value), 'structure_and_escaping_preserved': True}
        finally: page.close()


    def overflow_and_export():
        page = make_page()
        try:
            rows = page.evaluate(r'''async()=>{
              const results=[];
              for(const width of [600,280]) {
                const host=document.createElement('div');host.style.cssText=`width:${width}px;font-family:serif;color:rgb(20,30,40)`;document.body.append(host);
                const card={id:'overflow',flavor:'kind',text:'Do not crop\nSecond line',design:{html:'<section><i class="marker"></i><p data-card-text></p></section>',css:'section{width:400px;height:180px;transform:rotate(12deg);background:rgb(255,230,140);position:relative}.marker{position:absolute;left:12px;top:-28px;width:12px;height:12px;background:rgb(255,0,0)}p{padding:35px}'}};
                const design=cmsTest.renderWin(host,card);
                await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const before=host.shadowRoot.innerHTML, hostBefore=host.getAttribute('style');
                const blob=await cmsTest.exportWin(host), image=new Image();
                const png=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
                image.src=png;await image.decode();
                const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                let red=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>240&&pixels[i+1]<10&&pixels[i+2]<10&&pixels[i+3]>240)red++;
                const marker=design.querySelector('.marker').getBoundingClientRect(), outer=host.getBoundingClientRect();
                results.push({width,red,png,pngWidth:image.width,pngHeight:image.height,unchanged:before===host.shadowRoot.innerHTML&&hostBefore===host.getAttribute('style'),inside:marker.left>=outer.left-1&&marker.right<=outer.right+1&&marker.top>=outer.top-1&&marker.bottom<=outer.bottom+1});
                cmsTest.disposeWin(host);host.remove();
              }
              return results;
            }''')
            for row in rows:
                (OUT/f"overflow-{row['width']}.png").write_bytes(base64.b64decode(row.pop('png').split(',',1)[1]))
                assert row['red'] > 400, 'Export clipped the overflowing marker: '+str(row)
                assert row['inside'], 'The preview also must contain the visible overflow: '+str(row)
                assert row['unchanged'], 'Export mutated the live card: '+str(row)
            assert rows[0]['pngWidth']==rows[1]['pngWidth'] and rows[0]['pngHeight']==rows[1]['pngHeight'], rows
            return rows
        finally: page.close()

    def wrapper_isolation():
        page = make_page()
        try:
            value=page.evaluate('''()=>{
              const host=document.createElement('div');host.style.cssText='position:absolute;left:200px;top:500px;width:600px';document.body.append(host);
              const design=cmsTest.renderWin(host,{id:'isolation',flavor:'kind',text:'Visible',design:{html:'<section><p data-card-text></p><span hidden>hidden</span></section>',css:'*{opacity:.5!important}section{width:400px;height:180px}'}});
              return {height:host.getBoundingClientRect().height,outer:getComputedStyle(host.shadowRoot.firstElementChild).opacity,inner:getComputedStyle(design.parentElement).opacity,design:getComputedStyle(design).opacity};
            }''')
            assert value['height'] < 250, value
            assert value['outer']=='1' and value['inner']=='1' and value['design']=='0.5', value
            return value
        finally: page.close()

    def cloned_references():
        page=make_page()
        try:
            data={**PAGE,'html':'<main id="main"><section id="original"><h2 id="target">Label</h2><p aria-labelledby="target">Copy</p><a href="#target">Jump</a><svg><defs><linearGradient id="paint"><stop offset="0" stop-color="red"></stop></linearGradient></defs><rect width="10" height="10" fill="url(#paint)"></rect></svg></section></main>','css':'#target{color:rgb(201,32,17)}','project':None}
            editor(page,data)
            result=page.evaluate('''()=>{const original=handle.editor.getWrapper().find('#original')[0];const clone=original.clone();original.parent().append(clone);cmsTest.remapClone(original,clone,handle.editor);const target=clone.find('h2')[0].getId(),paint=clone.find('linearGradient')[0]?.getId()??clone.find('lineargradient')[0]?.getId();return {target,href:clone.find('a')[0].getAttributes().href,label:clone.find('p')[0].getAttributes()['aria-labelledby'],paint,fill:clone.find('rect')[0].getAttributes().fill,color:getComputedStyle(clone.find('h2')[0].getEl()).color}}''')
            assert result['target'] != 'target' and result['href'] == '#'+result['target'] and result['label']==result['target']
            assert result['fill']=='url(#'+result['paint']+')'
            assert result['color']=='rgb(201, 32, 17)'
            return result
        finally: page.close()

    def duplicated_inline_section_preserves_style():
        page = make_page()
        try:
            content={**PAGE,'html':'<main><section id="copy-section" aria-labelledby="copy-target" style="padding:19px;color:rgb(201,32,17)"><h2 id="copy-target">Local clone target</h2><a href="#copy-target">Local clone link</a><svg viewBox="0 0 10 10"><defs><clipPath id="copy-clip"><circle cx="5" cy="5" r="5"></circle></clipPath></defs><rect width="10" height="10" clip-path="url(#copy-clip)"></rect></svg></section></main>','css':'','project':None}
            frame=editor(page,content)
            page.evaluate("""()=>{const ed=handle.editor;ed.select(ed.getWrapper().find('#copy-target')[0]);handle.setStyleMode('normal')}""")
            page.wait_for_timeout(100)
            page.evaluate("""()=>{const ed=handle.editor;const section=ed.getWrapper().find('#copy-section')[0];ed.select(section);handle.setStyleMode('normal');cmsTest.componentInspector(section,ed,{assets:[],change(){handle.flush(true)},onError(message){throw Error(message)},pickImage(){}})}""")
            page.wait_for_timeout(100)
            page.locator('#duplicate-element').click()
            page.wait_for_timeout(100)
            page.evaluate("handle.setStyleMode('normal')")
            page.wait_for_timeout(100)
            expect(frame.get_by_text('Local clone target',exact=True)).to_have_count(2)
            page.evaluate('handle.flush()')
            result=page.evaluate("""()=>{const nodes=[...handle.editor.Canvas.getDocument().querySelectorAll('section:has(h2#copy-target),section:has(h2[id^=\"copy-target-\"])')];return {css:snapshots.at(-1)?.css??'',nodes:nodes.map(node=>({id:node.id,padding:getComputedStyle(node).padding,color:getComputedStyle(node).color,heading:node.querySelector('h2').id,href:node.querySelector('a').getAttribute('href'),clip:node.querySelector('clipPath').id,clipRef:node.querySelector('rect').getAttribute('clip-path')}))}}""")
            assert len(result['nodes'])==2,result
            assert result['nodes'][0]['id']!=result['nodes'][1]['id'],result
            for node in result['nodes']:
                assert node['padding']=='19px' and node['color']=='rgb(201, 32, 17)',result
                assert node['href']=='#'+node['heading'],result
                assert node['clipRef']=='url(#'+node['clip']+')',result
            assert 'padding:19px' in result['css'] and 'color:rgb(201,32,17)' in result['css'],result
            assert 'color:black' not in result['css'] and 'border:0 solid black' not in result['css'], result
            return result
        finally: page.close()

    def export_layout_contract():
        page = make_page('<!doctype html><div data-win-artwork></div>')
        card = FIXTURE['cards'][0]
        try:
            measured = []
            for width in [240, 316, 600]:
                page.evaluate("""({card, width})=>{
                  const host=document.querySelector('[data-win-artwork]');
                  host.style.width=width+'px';cmsTest.renderWin(host,card);
                }""", {'card': card, 'width': width})
                page.evaluate('document.fonts.ready')
                page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                state = wait_for_rendered_card(page, card['text'])
                assert_layout(card['id'], card['text'], state)
                measured.append({'width': width, 'state': state})
            return {'widths': measured, 'same_assertion_as_HTTP_export': True}
        finally: page.close()

    def export_layout_rejects_clipping():
        page = make_page('<!doctype html><div data-win-artwork style="width:316px"></div>')
        card = FIXTURE['cards'][0]
        mutations = {
            'card-height': "root.style.cssText+=';min-height:0!important;height:80px!important;overflow:hidden!important'",
            'text-height': "slot.style.cssText+=';flex:0 0 10px!important;max-height:10px!important;overflow:hidden!important'",
            'text-width': "slot.style.cssText+=';white-space:nowrap!important;overflow-wrap:normal!important;overflow:hidden!important'",
            'outside-host': "root.parentElement.style.setProperty('transform','translateX(800px)','important')",
        }
        rejected = []
        try:
            for name, mutation in mutations.items():
                page.evaluate("card=>cmsTest.renderWin(document.querySelector('[data-win-artwork]'),card)", card)
                page.evaluate('document.fonts.ready')
                page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                page.evaluate("()=>{const root=document.querySelector('[data-win-artwork]').shadowRoot.querySelector('.win-design');const slot=root.querySelector('[data-card-text]');"+mutation+"}")
                state = wait_for_rendered_card(page, card['text'])
                try:
                    assert_layout(card['id'], card['text'], state)
                except CardFailure as error:
                    rejected.append({'case': name, 'error': str(error)})
                else:
                    raise AssertionError('The export check accepted real clipping: '+name)
            return rejected
        finally: page.close()

    def representative_card_exports():
        page=make_page('<!doctype html><div data-win-artwork style="width:316px"></div>')
        try:
            # The exhaustive 240-card matrix runs in Playwright Test with parallel
            # workers. This module suite keeps a deterministic cross-browser sample
            # for the shared render/export primitives.
            cards = FIXTURE['cards']
            by_flavor = {}
            for card in cards:
                by_flavor.setdefault(card['flavor'], []).append(card)
            sample = []
            for flavor_cards in by_flavor.values():
                sample.extend([flavor_cards[0], max(flavor_cards, key=lambda card: len(card['text'])), min(flavor_cards, key=lambda card: len(card['text']))])
            sample = list({card['id']: card for card in sample}.values())
            exported = 0
            for card in sample:
                page.evaluate("""async card=>{
                  const root=cmsTest.renderWin(document.querySelector('[data-win-artwork]'),card);
                  const slot=root.matches('[data-card-text]')?root:root.querySelector('[data-card-text]');
                  if(slot.innerText!==card.text)throw Error('Invisible text '+card.id);
                  await document.fonts.ready;
                  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
                }""", card)
                state = wait_for_rendered_card(page, card['text'])
                assert_layout(card['id'], card['text'], state)
                result = page.evaluate("""async()=>{
                  const blob=await cmsTest.exportWin(document.querySelector('[data-win-artwork]'));
                  const bitmap=await createImageBitmap(blob);
                  const result={width:bitmap.width,height:bitmap.height,bytes:blob.size};
                  bitmap.close();return result;
                }""")
                assert result['width'] > 0 and result['height'] > 0 and result['bytes'] >= 1000, (card['id'], result)
                exported += 1
            assert exported == len(sample)
            return {'exported': exported, 'layout_checked': exported, 'host_width': 316, 'renderer': 'renderWin/exportWin', 'coverage': 'representative-per-flavor'}
        finally: page.close()

    def preview_readiness():
        page = make_page()
        try:
            initial_count = page.evaluate("""html=>{const frame=document.createElement('iframe');frame.id='preview-race';frame.srcdoc=html;document.body.append(frame);return frame.contentDocument.querySelectorAll('script[type=module]').length}""", FIXTURE['preview'])
            assert initial_count == 0, 'The reproduction must observe the initial empty iframe'
            preview=page.frame_locator('#preview-race')
            expect(preview.locator('body[data-cms-preview=true]')).to_be_attached()
            expect(preview.locator('head script[type=module][src*="/assets/main."]')).to_have_count(1)
            assert preview.locator('head script[type=module][src*="/assets/main."]').get_attribute('src') == FIXTURE['main']
            return {'initial_scripts': initial_count, 'loaded_script': FIXTURE['main']}
        finally: page.close()


    def export_context():
        page = make_page()
        try:
            value=page.evaluate(r'''async()=>{
              const host=document.createElement('div');host.style.cssText='width:600px;--card-accent:rgb(255,0,0)';document.body.append(host);
              cmsTest.renderWin(host,{id:'context',flavor:'kind',text:'Inherited color',design:{html:'<section><p data-card-text></p></section>',css:'section{width:100%;height:80px;background:var(--card-accent)}'}});
              await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              host.style.width='280px';
              const blob=await cmsTest.exportWin(host), image=new Image();const url=URL.createObjectURL(blob);
              try {
                image.src=url;await image.decode();
                const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixel=[...ctx.getImageData(20,image.height-20,1,1).data];
                return {width:image.width,pixel};
              } finally { URL.revokeObjectURL(url);cmsTest.disposeWin(host);host.remove(); }
            }''')
            assert value['width']==560, 'Export used a stale viewport width: '+str(value)
            assert value['pixel']==[255,0,0,255], 'Export lost inherited design variables: '+str(value)
            return value
        finally: page.close()

    def usability_editor_primitives():
        page = make_page()
        try:
            data = {
                **PAGE,
                'html': '<main><section id="parent"><p id="text">Resize me</p><a id="link" href="/kontakt/" aria-label="Kontakt">Link</a><img id="image" src="/social/omar-yusuf.png" alt="Portrait"><button id="functional" data-print>Print</button><svg id="vector" viewBox="0 0 100 100"><g id="group"><path id="shape" d="M0 0L10 10"></path></g></svg></section></main>',
                'css': '#text{transform:rotate(4deg) scale(.9)}',
                'project': None,
            }
            editor(page, data)
            result = page.evaluate("""async()=>{
              const ed=handle.editor, root=ed.getWrapper();
              const text=root.find('#text')[0], link=root.find('#link')[0], image=root.find('#image')[0], button=root.find('#functional')[0], vector=root.find('#vector')[0], group=root.find('#group')[0], shape=root.find('#shape')[0];
              const parent=text.parent(), index=text.index();
              cmsTest.nudgeComponent(text,1,0);
              cmsTest.nudgeComponent(text,0,1,10);
              const moved={parentSame:text.parent()===parent,indexSame:text.index()===index,translate:text.getStyle().translate,transform:text.getStyle().transform};
              handle.setStyleMode('website');
              const sectors=ed.StyleManager.getSectors({array:true}).map(s=>({id:s.getId(),props:s.getProperties().map(p=>p.getName?.()??p.get('property'))}));
              handle.setStyleMode('normal');
              const normalProps=ed.StyleManager.getSectors({array:true}).flatMap(s=>s.getProperties().map(p=>p.getName?.()??p.get('property')));
              const groupResize=group.get('resizable'), el=group.getEl(), before=el.getBoundingClientRect();
              groupResize.onStart(null,{el}); groupResize.updateTarget(el,{w:before.width*1.5,h:before.height*1.25},{store:true});
              await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const after=el.getBoundingClientRect();
              return {resize:{text:text.get('resizable'),link:link.get('resizable'),image:image.get('resizable'),button:button.get('resizable'),vector:vector.get('resizable'),group:Boolean(groupResize?.onStart&&groupResize?.updateTarget),shape:shape.get('resizable')},groupBounds:{before:{w:before.width,h:before.height},after:{w:after.width,h:after.height}},groupTransform:group.getAttributes().transform,toolbar:text.get('toolbar'),moved,sectors,normalProps};
            }""")
            assert result['resize'] == {'text': True, 'link': True, 'image': True, 'button': False, 'vector': True, 'group': True, 'shape': False}, result
            assert result['groupBounds']['before']['w'] > 0 and result['groupBounds']['before']['h'] > 0, result
            assert result['groupBounds']['after']['w'] > result['groupBounds']['before']['w'] * 1.4, result
            assert result['groupBounds']['after']['h'] > result['groupBounds']['before']['h'] * 1.15, result
            assert 'scale(' in result['groupTransform'], result
            assert result['toolbar'] == [], result
            assert result['moved']['parentSame'] and result['moved']['indexSame'], result
            assert result['moved']['translate'] == '1px 10px', result
            assert result['moved']['transform'] == 'rotate(4deg) scale(0.9)', result
            props = {prop for sector in result['sectors'] for prop in sector['props']}
            for prop in ['color','background-color','border-color','fill','stroke','box-shadow','text-shadow','filter']:
                assert prop in props, (prop, result)
            for forbidden in ['position','top','left','margin','padding','font-size','font-family']:
                assert forbidden not in props, (forbidden, result)
            assert 'font-family' in result['normalProps'], result
            return result
        finally: page.close()

    def usability_view_state_and_mobile_center():
        page = make_page(SHELL.replace('<aside id="side">','<aside class="right-panel" id="side" style="height:180px;overflow:auto">'))
        try:
            data={**PAGE,'html':'<main><div style="height:1000px"><h1 data-cms-node="stable-heading">Heading</h1></div></main>','project':None}
            editor(page,data)
            result=page.evaluate("""async()=>{
              const ed=handle.editor, heading=ed.getWrapper().find('[data-cms-node="stable-heading"]')[0];
              ed.select(heading);
              const panel=document.querySelector('.right-panel'); panel.scrollTop=73;
              const frameWin=ed.Canvas.getWindow(); frameWin.scrollTo(0,120);
              ed.Canvas.setZoom(100); ed.Canvas.setCoords(37,19);
              const snap=cmsTest.captureEditorView(ed,{device:'mobile',zoom:100,tab:'styles'});
              panel.scrollTop=0; frameWin.scrollTo(0,0); ed.select(); ed.Canvas.setCoords(0,0);
              cmsTest.restoreEditorView(ed,snap,{setTab:value=>window.restoredTab=value});
              await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const selected=ed.getSelected();
              const stage=document.querySelector('.gjs-cv-canvas').getBoundingClientRect();
              ed.setDevice('Mobil'); await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const mobileBeforeZoom=ed.Canvas.getFrameEl().getBoundingClientRect();
              ed.Canvas.setZoom(80);
              const x=cmsTest.centerOffset(stage.width,390,80); ed.Canvas.setCoords(x,0);
              await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const frame=ed.Canvas.getFrameEl().getBoundingClientRect();
              return {scroll:panel.scrollTop,frameScroll:frameWin.scrollY,selected:selected?.getAttributes?.()['data-cms-node'],tab:window.restoredTab,device:ed.Devices.getSelected()?.get('id'),mobileBeforeZoom:{left:mobileBeforeZoom.left,width:mobileBeforeZoom.width},x,stageWidth:stage.width,frameLeft:frame.left,frameWidth:frame.width,midpointDelta:Math.abs((frame.left+frame.width/2)-(stage.left+stage.width/2))};
            }""")
            assert result['scroll'] == 73, result
            assert result['frameScroll'] == 120, result
            assert result['selected'] == 'stable-heading', result
            assert result['tab'] == 'styles', result
            assert result['midpointDelta'] <= 1, result
            return result
        finally: page.close()

    def usability_selection_identity_survives_structural_history():
        page = make_page()
        try:
            data={**PAGE,'html':'<main><div id="first">First</div><div id="second">Second</div></main>','project':None}
            editor(page,data)
            result=page.evaluate("""async()=>{
              const ed=handle.editor, main=ed.getWrapper().find('main')[0];
              const added=main.components().add({tagName:'p',components:'New block'});
              await new Promise(resolve=>requestAnimationFrame(resolve));
              const key=added.getAttributes()['data-cms-node'];
              const original=handle.snapshot(true).html;
              added.move(main,{at:0});
              const reordered=handle.snapshot(true).html;
              ed.select(added);
              const undoView=cmsTest.captureEditorView(ed);
              ed.setComponents(original);
              cmsTest.restoreEditorView(ed,undoView);
              await new Promise(resolve=>requestAnimationFrame(resolve));
              const undoSelected=ed.getSelected()?.getAttributes?.()['data-cms-node'];
              const redoView=cmsTest.captureEditorView(ed);
              ed.setComponents(reordered);
              cmsTest.restoreEditorView(ed,redoView);
              await new Promise(resolve=>requestAnimationFrame(resolve));
              const redoSelected=ed.getSelected()?.getAttributes?.()['data-cms-node'];
              return {key,undoSelected,redoSelected,original,reordered};
            }""")
            assert result['key'] and result['key'].startswith('u-'), result
            assert result['undoSelected'] == result['key'], result
            assert result['redoSelected'] == result['key'], result
            assert result['key'] in result['original'] and result['key'] in result['reordered'], result
            return {'stable_user_identity':result['key'],'undo_redo_selection_preserved':True}
        finally: page.close()

    def client_shared_content_sync():
        page = make_page()
        try:
            result=page.evaluate("""()=>{
              const project={sharedContent:{'footer.tagline':'Old'},pages:[
                {id:'a',html:'<footer><p data-cms-node="a-node" data-cms-shared="footer.tagline">Old</p></footer>'},
                {id:'b',html:'<footer><p data-cms-node="b-node" data-cms-shared="footer.tagline">Old</p></footer>'}
              ]};
              const next={...project.pages[0],html:'<footer><p data-cms-node="a-node" data-cms-shared="footer.tagline">New <strong>value</strong></p></footer>'};
              return cmsTest.synchronizeSharedPageClient(project,'a',next);
            }""")
            assert result['sharedContent']['footer.tagline'] == 'New <strong>value</strong>', result
            assert 'data-cms-node="a-node"' in result['pages'][0]['html'], result
            assert 'data-cms-node="b-node"' in result['pages'][1]['html'], result
            assert 'New <strong>value</strong>' in result['pages'][1]['html'], result
            return {'propagated':True,'stable_ids':True}
        finally: page.close()

    def locked_preview_mobile_center():
        page = make_page('''<!doctype html><div class="preview-stage" style="width:1000px;height:600px"><iframe class="preview-frame" style="width:390px;height:500px"></iframe></div>''')
        try:
            result=page.evaluate("""()=>{
              const stage=document.querySelector('.preview-stage').getBoundingClientRect();
              const frame=document.querySelector('.preview-frame').getBoundingClientRect();
              return {midpointDelta:Math.abs((frame.left+frame.width/2)-(stage.left+stage.width/2)),stageWidth:stage.width,frameWidth:frame.width};
            }""")
            assert result['midpointDelta'] <= 1, result
            assert abs(result['frameWidth']-390) <= 1, result
            return result
        finally: page.close()

    def managed_svg_uses_same_editor_canvas():
        page = make_page()
        try:
            data={**PAGE,'html':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g id="face"><circle id="cheek" cx="50" cy="50" r="40" fill="#ffda44" stroke="#252a24" stroke-width="2"></circle></g></svg>','css':'','project':None}
            frame=editor(page,data)
            expect(frame.locator('#cheek')).to_have_count(1)
            result=page.evaluate("""async data=>{
              const ed=handle.editor, cheek=ed.getWrapper().find('#cheek')[0], group=ed.getWrapper().find('#face')[0];
              const resize=group.get('resizable'), el=group.getEl(), beforeRect=el.getBoundingClientRect();
              const before={fill:cheek.getAttributes().fill,shapeResizable:cheek.get('resizable'),groupResizable:Boolean(resize?.onStart&&resize?.updateTarget)};
              resize.onStart(null,{el}); resize.updateTarget(el,{w:beforeRect.width*1.25,h:beforeRect.height*1.25},{store:true});
              cheek.addStyle({opacity:'0.42'});
              cmsTest.nudgeComponent(group,3,4);
              cmsTest.nudgeComponent(cheek,2,1);
              cheek.addAttributes({fill:'#234ce7'});
              await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const afterRect=el.getBoundingClientRect(), snapshot=handle.snapshot(true);
              const source=cmsTest.materializeManagedSvg(snapshot.html,ed);
              handle.destroy();
              window.ready=false;window.handle=cmsTest.createEditor({page:{...data,html:source,css:''},cssPath:'',assets:[],onChange(){},onSelect(){},onReady(){ready=true}});
              await new Promise(resolve=>{const check=()=>ready?resolve():requestAnimationFrame(check);check()});
              await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
              const reopened=handle.editor.getWrapper(), reopenedGroup=reopened.find('#face')[0], reopenedCheek=reopened.find('#cheek')[0], reopenedRect=reopenedGroup.getEl().getBoundingClientRect();
              return {before,bounds:{before:[beforeRect.width,beforeRect.height],after:[afterRect.width,afterRect.height],reopened:[reopenedRect.width,reopenedRect.height]},source,reopened:{opacity:getComputedStyle(reopenedCheek.getEl()).opacity,transform:reopenedGroup.getAttributes().transform,shapeTransform:reopenedCheek.getAttributes().transform}};
            }""", data)
            assert result['before'] == {'fill':'#ffda44','shapeResizable':False,'groupResizable':True}, result
            assert result['bounds']['after'][0] > result['bounds']['before'][0] * 1.15, result
            assert result['bounds']['after'][1] > result['bounds']['before'][1] * 1.15, result
            assert result['bounds']['reopened'][0] > result['bounds']['before'][0] * 1.15, result
            assert result['bounds']['reopened'][1] > result['bounds']['before'][1] * 1.15, result
            assert result['reopened']['opacity'] == '0.42', result
            assert 'translate(3 4)' in result['reopened']['transform'] and 'scale(' in result['reopened']['transform'], result
            assert 'translate(2 1)' in result['reopened']['shapeTransform'], result
            assert 'data-cms-node' not in result['source'] and '<style' not in result['source'], result
            return {'same_editor':True,'safe_shape_protected':True,'group_resize_visible_bounds':True,'save_reopen_opacity_nudge_resize':True}
        finally: page.close()

    def managed_svg_matches_existing_raster_baseline():
        page = make_page('<!doctype html><canvas id="a" width="192" height="192"></canvas><canvas id="b" width="192" height="192"></canvas>')
        try:
            result=page.evaluate("""async fixture=>{
              async function image(src){const img=new Image();img.src=src;await img.decode();return img}
              async function compare(pngData,svg,width,height){
                const blob=new Blob([svg],{type:'image/svg+xml'}), url=URL.createObjectURL(blob);
                try {
                  const [a,b]=await Promise.all([image(pngData),image(url)]), ca=document.querySelector('#a'), cb=document.querySelector('#b');
                  ca.width=cb.width=width;ca.height=cb.height=height;
                  ca.getContext('2d').drawImage(a,0,0,width,height);cb.getContext('2d').drawImage(b,0,0,width,height);
                  const x=ca.getContext('2d').getImageData(0,0,width,height).data, y=cb.getContext('2d').getImageData(0,0,width,height).data;
                  let total=0;for(let i=0;i<x.length;i+=4)total+=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);
                  return total/(width*height*3*255);
                } finally {URL.revokeObjectURL(url)}
              }
              return {mail:await compare(fixture.mailPngData,fixture.mailSvg,192,192),icon:await compare(fixture.iconPngData,fixture.iconSvg,180,180)};
            }""", FIXTURE)
            assert result['mail'] < .02, result
            assert result['icon'] < .006, result
            return result
        finally: page.close()

    run('R14-active-typing-newlines-composition-flush', active_input)
    run('R23-live-text-active-inactive-serialization-stable', live_text_serialization)
    run('R18-canonical-content-reloads-without-divergent-editor-data', canonical_reload)
    run('R20-preserve-rich-structure-and-simple-newlines', rich_structure)
    run('R20-text-ranges-unicode-links-and-escaping', text_ranges)
    run('R15-public-modules-ignore-author-preview-markers', public_spoof)
    run('R21-transform-fit-mobile-and-png-export', transform_and_export)
    run('merge-overflow-export-pixels-and-live-host-isolation', overflow_and_export)
    run('merge-wrapper-style-isolation', wrapper_isolation)
    run('R12-clone-anchor-aria-svg-and-style', cloned_references)
    run('cms-duplicate-inline-section-preserves-style', duplicated_inline_section_preserves_style)
    run('export-layout-scaled-card-not-fitting-wrapper', export_layout_contract)
    run('export-layout-rejects-real-clipping', export_layout_rejects_clipping)
    run('representative-card-exports', representative_card_exports)
    run('CI-preview-srcdoc-readiness', preview_readiness)
    run('merge-export-inherited-theme-and-current-width', export_context)
    run('cms-usability-resize-nudge-and-style-mode', usability_editor_primitives)
    run('cms-usability-view-state-and-mobile-center', usability_view_state_and_mobile_center)
    run('cms-usability-selection-identity-structural-history', usability_selection_identity_survives_structural_history)
    run('cms-client-shared-content-sync', client_shared_content_sync)
    run('cms-locked-preview-mobile-center', locked_preview_mobile_center)
    run('cms-managed-svg-uses-shared-editor', managed_svg_uses_same_editor_canvas)
    run('cms-managed-svg-preserves-existing-visual-baseline', managed_svg_matches_existing_raster_baseline)
    browser.close()
result_path = Path(os.environ.get('CMS_MODULE_RESULT_PATH', str(OUT/'results.json')))
result_path.parent.mkdir(parents=True, exist_ok=True)
result_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))
passed = sum(item['passed'] for item in results)
print(f'SUMMARY pass={passed} fail={len(results)-passed}', flush=True)
raise SystemExit(int(not results or passed != len(results)))
