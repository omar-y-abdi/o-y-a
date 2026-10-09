"""Real legacy D1 publication -> editable CMS -> preview/save/reload, on loopback only."""
import importlib.util
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('footer_qa', ROOT/'tests/cms-browser.py')
qa = importlib.util.module_from_spec(spec); sys.modules[spec.name] = qa; spec.loader.exec_module(qa)
BASE, Q = qa.BASE_URL, qa.CMSBrowserQA
assert qa.loopback_base(BASE), 'Legacy fixture tests may never write to production'
ENGINE = os.environ.get('CMS_BROWSER', 'chromium')
OUT = ROOT/'output/visual/footer'/ENGINE; OUT.mkdir(parents=True, exist_ok=True)
report = qa.Reporter(ROOT/f'output/logs/footer-{ENGINE}.log')

CONTAINMENT = """footer => {
  const box = footer.getBoundingClientRect(), padding = parseFloat(getComputedStyle(footer).paddingBottom);
  const controls = [...footer.querySelectorAll('nav a, nav button')].filter(el => el.getBoundingClientRect().width > 0);
  return {
    footer: {width:box.width,height:box.height,bottom:box.bottom},
    overflow: controls.filter(el => { const r=el.getBoundingClientRect(); return r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom - padding + 1; }).map(el => el.textContent.trim()),
    horizontal: footer.scrollWidth > footer.clientWidth + 1
  };
}"""

def contained(footer):
    result = footer.evaluate(CONTAINMENT)
    assert not result['overflow'] and not result['horizontal'], result


def props(page):
    panel = page.locator('#element-text')
    if not panel.is_visible() and page.get_by_role('button', name='Egenskaper', exact=True).is_visible():
        page.get_by_role('button', name='Egenskaper', exact=True).click()


def close_props(page):
    if page.locator('body.show-properties').count():
        page.get_by_role('button', name='Egenskaper', exact=True).click()


def save(page):
    with page.expect_response(lambda response: response.url.endswith('/admin/api/save') and response.request.method == 'POST') as result:
        page.locator('[data-action=save]').click()
    if result.value.status != 200:
        body = result.value.request.post_data_json
        groups = body.get('changes', {})
        pages = groups.get('pages', {}).get('upsert', [])
        print('SAVE_DELTA_DIAG', {'fields': list(groups), 'upserts': [{'id': p.get('id'), 'keys': sorted(p), 'footerVersion': p.get('footerVersion')} for p in pages]}, flush=True)
    assert result.value.status == 200, result.value.text()[:1200]
    Q.wait_saved(page)


with sync_playwright() as pw:
    browser = qa.launch_browser(pw)
    report.note(f'{ENGINE} {browser.version}')

    def public_footer(width, javascript=True):
        context = browser.new_context(viewport={'width':width,'height':680}, java_script_enabled=javascript, reduced_motion='reduce')
        try:
            page = context.new_page()
            page.goto(BASE+'/', wait_until='networkidle')
            footer = page.locator('footer')
            expect(footer.locator('a[href="/developers/"]')).to_have_count(1)
            contained(footer)
            if javascript:
                privacy = footer.locator('[data-privacy-open]')
                privacy.scroll_into_view_if_needed()
                expect(privacy).to_be_visible()
                privacy.click()
                expect(page.locator('[data-privacy-dialog]')).to_be_visible()
                page.locator('[data-dialog-close]').click()
            page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
            page.screenshot(path=str(OUT/f'public-{width}-js-{javascript}.png'))
        finally: context.close()

    def cms_roundtrip(width):
        context = browser.new_context(storage_state=str(qa.STATE_PATH), viewport={'width':width,'height':900}, reduced_motion='reduce')
        try:
            page = context.new_page(); page.on('dialog', lambda dialog: dialog.accept())
            page.goto(BASE+'/admin/'); Q.wait_canvas(page)
            page.locator(f'[data-device={"mobile" if width <= 760 else "desktop"}]').click()
            frame = Q.frame(page)
            link = frame.locator('footer a[href="/developers/"], footer a[href="/developers/#main"]').first
            expect(link).to_have_count(1)
            contained(frame.locator('footer'))
            link.click(); props(page)
            if not page.locator('#element-text').is_visible():
                print('CMS_SELECTION_DIAG', {'viewport':width,'pageUrl':page.url,
                    'linkHref':link.get_attribute('href'),
                    'frameDocument':link.evaluate('(element) => element.ownerDocument.location.href'),
                    'bodyClasses':page.locator('body').get_attribute('class'),
                    'textFields':page.locator('#element-text').count(),
                    'hrefFields':page.locator('#element-href').count(),
                    'editButtons':page.locator('[data-action=edit]').count(),
                    'selected':frame.locator('[data-cms-selected]').count()}, flush=True)
            label = f'Utvecklardokumentation {width}'
            expect(page.locator('#element-text')).to_be_visible()
            page.locator('#element-text').fill(label)
            page.locator('#element-href').fill('/developers/#main')
            page.locator('#element-href').press('Tab')
            close_props(page)
            save(page)
            page.reload(); Q.wait_canvas(page)
            page.locator(f'[data-device={"mobile" if width <= 760 else "desktop"}]').click()
            frame = Q.frame(page)
            expect(frame.locator('footer a[href="/developers/#main"]')).to_have_text(label)

            # Reproduce the user's ordinary edit on another footer element.
            frame.locator('footer a[href="/tillganglighet/"]').click(); props(page)
            page.locator('#element-text').fill('Tillgänglighet och stöd')
            close_props(page); save(page)

            # Keep explicit CMS size editing, but it must not clip wrapped text.
            frame = Q.frame(page)
            frame.locator('footer').click(position={'x':5,'y':5})
            if not page.locator('.advanced-style').is_visible():
                page.get_by_role('button', name='Egenskaper', exact=True).click()
            page.locator('.advanced-style > summary').click()
            page.locator('#extra-property').fill('height')
            page.locator('#extra-value').fill(str(260 if width == 390 else 270)+'px')
            page.locator('#apply-property').click()
            close_props(page); save(page)
            contained(Q.frame(page).locator('footer'))
            Q.lock_preview(page)
            preview = page.frame_locator('#preview-stage iframe').first
            expect(preview.locator('footer a[href="/developers/#main"]')).to_have_text(label)
            contained(preview.locator('footer'))
            page.screenshot(path=str(OUT/f'cms-preview-{width}.png'))

            public = context.new_page()
            for viewport in [320,390,393,760,1440]:
                public.set_viewport_size({'width':viewport,'height':680})
                public.goto(BASE+'/',wait_until='networkidle')
                expect(public.locator('footer a[href="/developers/#main"]')).to_have_text(label)
                expect(public.locator('footer a[href="/developers/"]')).to_have_count(0)
                contained(public.locator('footer'))
                public.locator('footer [data-privacy-open]').click()
                expect(public.locator('[data-privacy-dialog]')).to_be_visible()
                public.locator('[data-dialog-close]').click()
            state = context.request.get(BASE+'/admin/api/state').json()
            assert any(p['path']=='/developers/' for p in state['project']['pages'])
            assert state['project']['pages'][0]['description']=='Owner description retained across the footer upgrade.'
        finally: context.close()

    for width in [320,390,393,760,1440]:
        report.run(f'legacy-fixed-footer-contained-{width}', lambda width=width: public_footer(width))
    report.run('legacy-fixed-footer-no-javascript', lambda: public_footer(390,False))
    for width in [390,1440]:
        report.run(f'cms-edit-save-preview-reload-{width}', lambda width=width: cms_roundtrip(width))
    browser.close()
raise SystemExit(report.summary())
