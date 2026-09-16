#!/usr/bin/env python3
"""Additional owner-UI regressions: controls, recovery, real card preview and media.
Uses the same loopback-only signed identity fixture as cms-browser.py.
"""
import importlib.util
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cms_qa', ROOT/'tests/cms-browser.py')
qa_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa_module
spec.loader.exec_module(qa_module)
Q = qa_module.CMSBrowserQA
BASE = qa_module.BASE_URL
OUT = ROOT/'output/visual/studio'
OUT.mkdir(parents=True, exist_ok=True)
reporter = qa_module.Reporter(ROOT/'output/logs/cms-interactions.log')

def shot(page, name):
    page.mouse.move(5, 5)
    page.screenshot(path=str(OUT/f'{name}.png'))

def save(page):
    page.locator('[data-action=save]').click()
    Q.wait_saved(page)

def original(page):
    page.locator('[data-action=history]').click()
    page.locator('[data-restore-version="0"]').click()
    Q.confirm_yes(page)
    Q.wait_canvas(page)
    if page.locator('[data-action=save]').is_enabled(): save(page)

def style(page, name, value):
    page.locator('#extra-property').fill(name)
    page.locator('#extra-value').fill(value)
    page.locator('#apply-property').click()

with sync_playwright() as p:
    if not qa_module.loopback_base(BASE): raise SystemExit('Loopback required')
    browser = qa_module.launch_browser(p)
    qa = Q(browser, reporter)

    def blocks_and_memory():
        context, page, errors = qa.admin_page({'width':1440,'height':900}, 'blocks-memory')
        try:
            qa.open_page(page, {'id':'workshop','name':'Glädjeverkstaden'})
            frame = qa.frame(page)
            expect(frame.locator('[data-memory-card]')).to_have_count(12)
            card = frame.locator('[data-memory-card="0"]')
            card.scroll_into_view_if_needed()
            card.click()
            page.locator('[data-inspector=design]').click()
            for _ in range(6):
                if page.locator('#selection-type').inner_text().startswith('BUTTON'): break
                page.locator('#select-parent').click()
            assert page.locator('#selection-type').inner_text().startswith('BUTTON')
            page.locator('.advanced-style summary').click()
            style(page, 'border-radius', '31px')
            card_key = card.get_attribute('data-cms-node')
            shot(page, 'memory-design')
            save(page)
            public = browser.new_page(viewport={'width':1440,'height':900}, reduced_motion='reduce')
            public.goto(BASE+'/verkstad/')
            target = public.locator(f'[data-cms-node="{card_key}"]')
            expect(target).to_have_css('border-radius', '31px')
            public.locator('[data-memory-reset]').click()
            expect(target).to_have_css('border-radius', '31px')
            expect(public.locator('[data-memory-card]')).to_have_count(12)
            public.close()
            page.locator('[data-inspector=blocks]').click()
            # Keyboard insertion uses the library's appendOnClick path.
            page.locator('[data-inspector=design]').click()
            for _ in range(10):
                if page.locator('#selection-type').inner_text().startswith('MAIN'): break
                page.locator('#select-parent').click()
            assert page.locator('#selection-type').inner_text().startswith('MAIN')
            page.locator('[data-inspector=blocks]').click()
            page.get_by_role('button', name='Text', exact=True).press('Enter')
            expect(qa.frame(page).get_by_text('Här börjar något nytt.', exact=True)).to_be_visible()
            shot(page, 'blocks-keyboard')
            original(page)
            qa_module.assert_clean(errors, 'blocks-memory')
        finally: context.close()

    def archive_and_lock():
        context, page, errors = qa.admin_page({'width':1440,'height':900}, 'archive-lock')
        try:
            page.locator('[data-library=assets]').click()
            page.locator('#file-input').set_input_files(str(qa.upload_path))
            page.locator('#asset-name').wait_for(state='visible')
            src = page.locator('#special-stage img').get_attribute('src')
            box = page.locator('#special-stage img').bounding_box()
            stage = page.locator('#special-stage').bounding_box()
            assert box['x'] >= stage['x'] and box['x']+box['width'] <= stage['x']+stage['width'], (box, stage)
            page.locator('#asset-name').fill('Liten bild, trygg plats')
            page.locator('#asset-alt').fill('En liten testbild')
            Q.save_asset_metadata(page)
            page.locator('[data-action=archive-asset]').click()
            Q.confirm_yes(page)
            page.locator('[data-action=restore-asset]').wait_for(state='visible', timeout=10000)
            page.locator('#library-list [data-special=media]').click()
            page.locator('[data-media-state=archived]').wait_for(state='visible', timeout=10000)
            page.locator('[data-media-state=archived]').click()
            page.get_by_role('button', name='Liten bild, trygg plats').click()
            page.locator('[data-action=restore-asset]').click()
            expect(page.locator('[data-action=archive-asset]')).to_be_visible()
            shot(page, 'asset-details')
            private_context = browser.new_context()
            try: assert private_context.request.get(BASE+src).status == 404
            finally: private_context.close()
            asset_id = src.rsplit('/',1)[1].split('.')[0]
            page.locator('[data-library=pages]').click()
            page.locator('[data-action=add-page]').click()
            page.locator('#new-page-name').fill('Bildens väg till webben')
            page.locator('#new-page-path').fill('/bildverifiering/')
            page.locator('#create-page').click();qa.wait_canvas(page)
            page.locator('[data-inspector=blocks]').click()
            page.get_by_role('button',name='Bild',exact=True).click()
            page.locator('[data-inspector=design]').click()
            page.locator('#choose-image').click()
            page.locator(f'[data-pick-image="{asset_id}"]').click()
            expect(qa.frame(page).locator('main img')).to_have_attribute('src', src)
            save(page)
            assert src in context.request.get(BASE+'/bildverifiering/').text()
            public_context=browser.new_context()
            published=public_context.request.get(BASE+src)
            assert published.status==200 and published.body()==qa.upload_path.read_bytes()
            public_context.close()
            original(page)
            Q.open_assets(page, 'wins')
            shot(page, 'wins-library')
            page.locator('[data-win-id]').first.click()
            qa.wait_canvas(page)
            expect(qa.frame(page).locator('.win-design')).to_have_css('width', '600px')
            expect(qa.frame(page).locator('.win-design')).to_have_css('padding-top', '38px')
            expect(qa.frame(page).locator('.win-design')).to_have_css('background-color', 'rgb(255, 253, 246)')
            page.locator('[data-inspector=blocks]').click()
            page.get_by_role('button',name='Text',exact=True).press('Enter')
            expect(qa.frame(page).locator('.win-design').get_by_text('Här börjar något nytt.',exact=True)).to_be_visible()
            page.locator('[data-inspector=design]').click()
            page.locator('#win-text').fill('Första raden.\nAndra raden.')
            save(page)
            shot(page, 'win-design')
            page.locator('[data-action=lock]').click()
            frame = page.frame_locator('#preview-stage iframe')
            expect(frame.locator('#cms-win-preview .win-design')).to_be_visible(timeout=20000)
            expect(frame.locator('[data-card-text]')).to_have_text('Första raden.Andra raden.')
            assert frame.locator('[data-card-text]').inner_text() == 'Första raden.\nAndra raden.'
            expect(page.locator('#editor')).to_be_hidden()
            assert page.locator('.right-panel').evaluate('(el)=>el.inert')
            shot(page, 'win-locked')
            page.locator('[data-action=edit]').click()
            expect(page.locator('#editor')).to_be_visible()
            assert not page.locator('.right-panel').evaluate('(el)=>el.inert')
            original(page)
            qa_module.assert_clean(errors, 'archive-lock')
        finally: context.close()

    def conflict_and_recovery():
        c1, first, errors = qa.admin_page({'width':1440,'height':900}, 'conflict')
        c2, second, errors2 = qa.admin_page({'width':1440,'height':900}, 'conflict-second')
        try:
            first.locator('#page-description').fill('Den första flikens genomtänkta beskrivning av portfolion.')
            save(first)
            second.locator('#page-description').fill('Den andra flikens genomtänkta beskrivning av portfolion.')
            second.locator('[data-action=save]').click()
            expect(second.locator('#studio-dialog')).to_be_visible()
            expect(second.locator('#dialog-content')).to_contain_text('En nyare version finns')
            shot(second, 'conflict')
            second.locator('[data-action=reconcile]').click()
            expect(second.locator('#dialog-content')).to_contain_text('Välj dina ändringar')
            Q.confirm_yes(second)
            qa.wait_canvas(second)
            expect(second.locator('#page-description')).to_have_value('Den andra flikens genomtänkta beskrivning av portfolion.')
            save(second)
            second.locator('#page-description').fill('Detta lokala reservutkast ska överleva en omladdning.')
            second.wait_for_timeout(900)
            second.on('dialog', lambda dialog: dialog.accept())
            second.reload()
            expect(second.locator('#dialog-content')).to_contain_text('En idé väntar')
            shot(second, 'recovery')
            Q.confirm_yes(second)
            qa.wait_canvas(second)
            expect(second.locator('#page-description')).to_have_value('Detta lokala reservutkast ska överleva en omladdning.')
            original(second)
            # 409 is the expected network failure in this adversarial scenario.
            assert not [error for error in errors+errors2 if '409' not in error], errors+errors2
        finally:
            c1.close(); c2.close()

    def text_roundtrips():
        context, page, errors = qa.admin_page({'width':1440,'height':900}, 'text-roundtrips')
        try:
            for iteration in range(3):
                frame=qa.frame(page)
                frame.locator('h1').click()
                page.locator('#element-text').fill('Omar\nYusuf' + '.' * (iteration+1))
                save(page)
                page.reload();qa.wait_canvas(page)
                link=qa.frame(page).locator('h3 a[href="/projekt/blade-blend/"]')
                expect(link).to_have_text('Blade & Blend ')
                public=context.request.get(BASE+'/').text()
                assert 'Blade &amp;amp;' not in public
            shot(page, 'newline-roundtrip')
            original(page)
            qa_module.assert_clean(errors, 'text-roundtrips')
        finally: context.close()

    reporter.run('literal-text-survives-three-save-reload-cycles', text_roundtrips)
    reporter.run('keyboard-blocks-and-memory-style-survives-reset', blocks_and_memory)
    reporter.run('asset-archive-recovery-and-locked-win-preview', archive_and_lock)
    reporter.run('two-tab-conflict-and-local-draft-recovery', conflict_and_recovery)
    browser.close()
raise SystemExit(reporter.summary())
