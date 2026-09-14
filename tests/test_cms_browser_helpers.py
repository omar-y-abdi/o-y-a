"""Regression tests for CMS harness ordering, navigation and response handling.

Navigation uses the actual library renderers in isolated DOM fixtures. Transport
objects are controlled here; the main CMS suites still use real Worker requests.
"""
import importlib.util
import json
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from playwright.sync_api import Error as PlaywrightError, TimeoutError as PlaywrightTimeoutError, sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cms_helpers_qa', ROOT/'tests/cms-browser.py')
qa = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa
spec.loader.exec_module(qa)
Q = qa.CMSBrowserQA


class LibraryNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.bundle = Path(cls.temp.name)/'library.js'
        subprocess.run(['node', '--input-type=module', '-e', "import {build} from 'esbuild'; await build({entryPoints:['src/cms/client/library.mjs'],bundle:true,format:'iife',globalName:'libraryFixture',outfile:process.argv[1]});", str(cls.bundle)], cwd=ROOT, check=True)
        cls.pw = sync_playwright().start()
        cls.browser = qa.launch_browser(cls.pw)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.temp.cleanup()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.set_default_timeout(700)
        self.page.set_content('''<button data-library="pages" aria-selected="true">Sidor</button>
            <button data-library="assets" aria-selected="false">Resurser</button>
            <div id="library-list"></div><div id="special-stage"></div><div id="custom-inspector"></div>''')
        self.page.add_script_tag(path=str(self.bundle))
        self.page.evaluate('''() => {
          window.fixture={requests:0,view:'pages'};
          libraryFixture.pageList([{id:'home',name:'Home',path:'/'}],'home');
          const assets=()=>libraryFixture.assetNavigation('media',[],[]);
          const media=()=>{fixture.view='media';fixture.requests++;assets();
            setTimeout(()=>{if(fixture.view==='media')libraryFixture.mediaGallery([])},180)};
          document.addEventListener('click',event=>{
            const el=event.target.closest('button');if(!el)return;
            if(el.dataset.library==='assets'){
              document.querySelector('[data-library=assets]').setAttribute('aria-selected','true');
              document.querySelector('[data-library=pages]').setAttribute('aria-selected','false');
              media();
            }
            if(el.dataset.special==='media')media();
            if(el.dataset.special==='wins'){
              fixture.view='wins';libraryFixture.assetNavigation('wins',[],[]);libraryFixture.winGallery([]);
            }
          });
        }''')

    def tearDown(self):
        self.page.close()

    def test_media_from_details_ignores_duplicate_back_button(self):
        self.page.evaluate("libraryFixture.assetNavigation('asset',[],[]);libraryFixture.assetDetail({id:'image',name:'image.png',mime:'image/png',src:'/image.png',alt:''})")
        self.assertEqual(self.page.locator('[data-special=media]').count(), 2)
        Q.open_assets(self.page)
        expect(self.page.locator('#special-stage [data-action=toggle-archived]')).to_be_visible()
        self.assertEqual(self.page.evaluate('fixture.requests'), 1)

    def test_wins_opens_assets_from_initial_pages_tab(self):
        self.assertEqual(self.page.locator('[data-special=wins]').count(), 0)
        Q.open_assets(self.page, 'wins')
        expect(self.page.locator('#special-stage #win-search')).to_be_visible()
        self.assertEqual(self.page.evaluate('fixture.view'), 'wins')

    def test_media_opens_from_pages_without_duplicate_fetch(self):
        Q.open_assets(self.page)
        expect(self.page.locator('#special-stage [data-action=toggle-archived]')).to_be_visible()
        self.assertEqual(self.page.evaluate('fixture.requests'), 1)

    def preview_fixture(self, previous=True, new_script=True, replace=True):
        self.page.set_content('<button data-action="lock">Lock</button><div id="preview-stage"></div>')
        self.page.evaluate("""options => {
          const stage=document.querySelector('#preview-stage');
          const frame=(name, script)=>{
            const element=document.createElement('iframe');
            element.srcdoc='<html><head>'+(script?'<script type="module" src="/assets/main.'+name+'.mjs"><'+'/script>':'')+'</head><body>'+name+'</body></html>';
            return element;
          };
          if(options.previous)stage.append(frame('old',true));
          document.querySelector('[data-action=lock]').onclick=()=>{
            if(options.replace)setTimeout(()=>stage.replaceChildren(frame('new',options.newScript)),250);
          };
        }""", {'previous': previous, 'newScript': new_script, 'replace': replace})
        if previous:
            expect(self.page.frame_locator('#preview-stage iframe').locator('script[src]')).to_have_count(1)

    def test_lock_preview_waits_for_new_frame_not_existing_compare_view(self):
        self.preview_fixture()
        self.assertEqual(Q.lock_preview(self.page, timeout=1500), ['/assets/main.new.mjs'])

    def test_lock_preview_rejects_new_document_without_main_script(self):
        self.preview_fixture(new_script=False)
        with self.assertRaises(PlaywrightTimeoutError):
            Q.lock_preview(self.page, timeout=1000)

    def test_lock_preview_rejects_stale_frame_when_render_never_completes(self):
        self.preview_fixture(replace=False)
        with self.assertRaises(PlaywrightTimeoutError):
            Q.lock_preview(self.page, timeout=1000)

    def test_lock_preview_also_waits_when_no_previous_frame_exists(self):
        self.preview_fixture(previous=False)
        self.assertEqual(Q.lock_preview(self.page, timeout=1500), ['/assets/main.new.mjs'])


class TransportOrderingTests(unittest.TestCase):
    def response_page(self, status=200):
        page = Mock()
        response = Mock(status=status, url=qa.BASE_URL+'/admin/api/assets/asset-one')
        response.request.method = 'POST'
        response.request.headers = {'x-cms-upload-id':'asset-one'}
        # The harness must not depend on Chromium retaining any response body.
        response.json.side_effect = RuntimeError('Request content was evicted from inspector cache')
        response.text.side_effect = RuntimeError('Request content was evicted from inspector cache')
        response.body.side_effect = RuntimeError('Request content was evicted from inspector cache')
        page.expect_response.return_value.__enter__ = Mock(return_value=SimpleNamespace(value=response))
        page.expect_response.return_value.__exit__ = Mock(return_value=False)
        return page, response

    def test_metadata_save_waits_for_server_ack_and_form_replacement(self):
        page, response = self.response_page()
        form = page.locator.return_value.element_handle.return_value
        seen = []
        page.locator.return_value.click.side_effect = lambda: seen.append('click')
        page.expect_response.return_value.__exit__.side_effect = lambda *args: seen.append('ack') or False
        page.wait_for_function.side_effect = lambda *a, **k: seen.append('render')
        Q.save_asset_metadata(page)
        self.assertEqual(seen, ['click','ack','render'])
        self.assertIs(page.wait_for_function.call_args.kwargs['arg'], form)
        response.json.assert_not_called()
        response.finished.assert_not_called()

    def test_metadata_conflict_is_not_counted_as_saved(self):
        page, response = self.response_page(status=409)
        with self.assertRaisesRegex(qa.ScenarioFailure, '409'):
            Q.save_asset_metadata(page)
        page.wait_for_function.assert_not_called()

    def test_upload_reads_persisted_metadata_without_response_body(self):
        page, response = self.response_page(status=201)
        response.url = qa.BASE_URL+'/admin/api/upload'
        record = {'id':'asset-one','name':'font.woff2','src':'/media/asset-one.woff2','mime':'font/woff2'}
        state = page.request.get.return_value
        state.status = 200
        state.json.return_value = {'assets':[record]}
        self.assertEqual(Q.upload_file(page, Path('font.woff2')), record)
        response.json.assert_not_called()
        response.body.assert_not_called()
        page.locator.return_value.set_input_files.assert_called_once_with('font.woff2')
        page.request.get.assert_called_once_with(qa.BASE_URL+'/admin/api/state', max_retries=2)
        response.finished.assert_not_called()
        state.dispose.assert_called_once()

    def test_rejected_upload_stops_without_retry_or_state_read(self):
        page, response = self.response_page(status=422)
        with self.assertRaisesRegex(qa.ScenarioFailure, '422'):
            Q.upload_file(page, Path('font.woff2'))
        page.request.get.assert_not_called()
        page.locator.return_value.set_input_files.assert_called_once()

    def test_success_status_without_registered_asset_is_rejected(self):
        page, response = self.response_page(status=201)
        state = page.request.get.return_value
        state.status = 200
        state.json.return_value = {'assets':[]}
        with self.assertRaisesRegex(qa.ScenarioFailure, 'asset-one'):
            Q.upload_file(page, Path('font.woff2'))
        state.dispose.assert_called_once()

    def test_failed_state_read_is_not_mistaken_for_completed_upload(self):
        page, response = self.response_page(status=201)
        state = page.request.get.return_value
        state.status = 503
        with self.assertRaisesRegex(qa.ScenarioFailure, '503'):
            Q.upload_file(page, Path('font.woff2'))
        state.dispose.assert_called_once()


class StateConnectionTests(unittest.TestCase):
    """Real Playwright HTTP transport; only UI events are controlled test doubles."""

    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()

    @classmethod
    def tearDownClass(cls):
        cls.pw.stop()

    def setUp(self):
        self.calls = 0
        self.resets = 0
        self.status = 200
        self.record = {'id': 'asset-one', 'name': 'font.woff2', 'src': '/media/asset-one.woff2', 'mime': 'font/woff2'}
        self.body = json.dumps({'assets': [self.record]}).encode()
        test = self

        class Handler(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'

            def log_message(self, *args):
                pass

            def do_GET(self):
                test.calls += 1
                if test.calls <= test.resets:
                    self.close_connection = True
                    self.connection.shutdown(socket.SHUT_RDWR)
                    self.connection.close()
                    return
                self.send_response(test.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(test.body)))
                self.end_headers()
                self.wfile.write(test.body)

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.origin = f'http://127.0.0.1:{self.server.server_port}'
        self.request = self.pw.request.new_context(timeout=5000)
        self.page, self.response = TransportOrderingTests().response_page(status=201)
        self.page.request = self.request

    def tearDown(self):
        self.request.dispose()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def upload(self):
        with patch.object(qa, 'BASE_URL', self.origin):
            return Q.upload_file(self.page, Path('font.woff2'))

    def test_one_socket_reset_reads_committed_asset_without_reupload(self):
        self.resets = 1
        self.assertEqual(self.upload(), self.record)
        self.assertEqual(self.calls, 2)
        self.page.locator.return_value.set_input_files.assert_called_once()
        self.response.finished.assert_not_called()

    def test_two_socket_resets_are_bounded_and_read_only(self):
        self.resets = 2
        self.assertEqual(self.upload(), self.record)
        self.assertEqual(self.calls, 3)
        self.page.locator.return_value.set_input_files.assert_called_once()

    def test_persistent_socket_failure_still_fails_after_three_attempts(self):
        self.resets = 10
        with self.assertRaisesRegex(PlaywrightError, 'socket hang up|ECONNRESET'):
            self.upload()
        self.assertEqual(self.calls, 3)
        self.page.locator.return_value.set_input_files.assert_called_once()

    def test_http_failure_is_not_retried_or_counted_as_upload_success(self):
        for status in (401, 409, 422, 500, 503):
            with self.subTest(status=status):
                self.calls = 0
                self.status = status
                with self.assertRaisesRegex(qa.ScenarioFailure, str(status)):
                    self.upload()
                self.assertEqual(self.calls, 1)

    def test_malformed_json_is_not_retried_or_treated_as_success(self):
        self.body = b'{'
        with self.assertRaises(json.JSONDecodeError):
            self.upload()
        self.assertEqual(self.calls, 1)

    def test_ui_not_ready_is_not_replaced_by_successful_api_read(self):
        self.page.wait_for_function.side_effect = qa.ScenarioFailure('UI not ready')
        with self.assertRaisesRegex(qa.ScenarioFailure, 'UI not ready'):
            self.upload()
        self.assertEqual(self.calls, 0)
        self.page.locator.return_value.set_input_files.assert_called_once()


if __name__ == '__main__':
    unittest.main(verbosity=2)
