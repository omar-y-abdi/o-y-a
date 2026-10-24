"""Machine appearance and interaction checks using the built HTML/CSS and real UI code.

Uses the repository's rendered-document adapter, not HTTP/CSP end-to-end coverage.
Run after `npm run build`: python tests/machine_depth.py
"""
import shutil
from playwright.sync_api import sync_playwright, expect
from render_support import load


def inspect_machine(page):
    body = page.locator('.machine-body')
    assert body.evaluate("el => getComputedStyle(el).transform.startsWith('matrix3d(')"), 'The cabinet must have a perspective transform'
    assert page.locator('.machine-vents[aria-hidden="true"]').count() == 1
    assert page.locator('.machine-foot[aria-hidden="true"]').count() == 2
    assert page.locator('.machine-display').evaluate("el => getComputedStyle(el, '::after').pointerEvents === 'none'"), 'Decorative glass must not intercept input'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Machine must not cause horizontal overflow'
    button = page.locator('[data-print]')
    expect(button).to_be_enabled()
    button.focus()
    page.keyboard.press('Enter')
    expect(page.locator('[data-receipt]')).to_be_visible()
    expect(page.locator('[data-card-message]')).not_to_be_empty()
    expect(button).to_be_enabled()
    page.locator('[data-receipt-close]').click()
    expect(page.locator('[data-receipt]')).to_be_hidden()
    expect(button).to_be_focused()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    for route in ['/', '/verkstad/']:
        for width, height in [(320, 780), (390, 844), (768, 1024), (1024, 900), (1440, 1050), (1920, 1080)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            load(page, route)
            inspect_machine(page)
            assert not errors, errors
            print(f'PASS {route} {width}px: depth, overflow, keyboard print, receipt, focus')
            page.close()
    page = browser.new_page(viewport={'width': 1440, 'height': 1050}, reduced_motion='no-preference')
    load(page, '/')
    stage = page.locator('[data-machine]')
    stage.scroll_into_view_if_needed()
    box = stage.bounding_box()
    page.mouse.move(box['x'] + box['width'] * .7, box['y'] + box['height'] * .4)
    page.wait_for_timeout(100)
    assert page.locator('.eye i').first.evaluate("el => el.style.transform.startsWith('translate(')"), 'Eye-following must remain intact'
    page.mouse.move(0, 0)
    page.wait_for_timeout(100)
    assert page.locator('.eye i').first.evaluate("el => el.style.transform === ''")
    page.locator('[data-print]').click()
    expect(page.locator('[data-receipt]')).to_be_visible()
    print('PASS original eye-following and animated receipt')
    page.close()
    page = browser.new_page(viewport={'width': 390, 'height': 844}, java_script_enabled=False)
    load(page, '/', js=False)
    expect(page.locator('[data-print]')).to_be_disabled()
    expect(page.locator('.noscript-note')).to_be_visible()
    assert page.locator('.machine-body').evaluate("el => getComputedStyle(el).transform.startsWith('matrix3d(')")
    print('PASS static depth and fallback without JavaScript')
    browser.close()
