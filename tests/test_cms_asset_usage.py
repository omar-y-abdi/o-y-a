"""Regression test for delayed asset-usage responses preserving metadata edits."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class AssetUsageRefreshTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.bundle = Path(cls.temp.name) / 'library.js'
        subprocess.run([
            'node', '--input-type=module', '-e',
            "import {build} from 'esbuild'; await build({entryPoints:['src/cms/client/library.mjs'],bundle:true,format:'iife',globalName:'libraryFixture',outfile:process.argv[1]});",
            str(cls.bundle),
        ], cwd=ROOT, check=True)
        cls.pw = sync_playwright().start()
        browser_name = os.environ.get('CMS_BROWSER', 'chromium')
        cls.browser = getattr(cls.pw, browser_name).launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.temp.cleanup()

    def test_delayed_usage_refresh_preserves_metadata_draft(self):
        page = self.browser.new_page()
        try:
            page.set_content('<div id="special-stage"></div><div id="custom-inspector"></div>')
            page.add_script_tag(path=str(self.bundle))
            asset = {
                'id': 'asset-one',
                'name': 'original.png',
                'mime': 'image/png',
                'src': '/image.png',
                'alt': 'original alt',
                'state': 'active',
            }
            page.evaluate('(asset) => libraryFixture.assetDetail(asset)', asset)
            page.locator('#asset-name').fill('draft name.png')
            page.locator('#asset-alt').fill('draft alt text')

            page.evaluate('(asset) => libraryFixture.assetDetail(asset, {currentReferences: 2, historyReferences: 3})', asset)

            self.assertEqual(page.locator('#asset-name').input_value(), 'draft name.png')
            self.assertEqual(page.locator('#asset-alt').input_value(), 'draft alt text')
            self.assertEqual(page.locator('#asset-usage').inner_text(), '2 referenser i aktuellt utkast · 3 i sparad historik.')
        finally:
            page.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
