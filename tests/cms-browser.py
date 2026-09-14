#!/usr/bin/env python3
"""Real-browser smoke and visual QA for the local CMS.

The test deliberately drives the owner UI with clicks and text input.  It only
accepts loopback BASE_URL values so a local fixture cannot accidentally mutate
the public site.  Each scenario is independent unless its named dependency
failed; a dependent scenario is recorded as BLOCKED instead of being counted
as a pass.
"""

from __future__ import annotations

import base64
import os
import re
import sys
import time
import traceback
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import Browser, BrowserContext, Frame, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8790").rstrip("/")
STATE_ENV = os.environ.get("CMS_STORAGE_STATE", "output/cms-local/browser-auth.json")
STATE_PATH = Path(STATE_ENV)
if not STATE_PATH.is_absolute():
    STATE_PATH = ROOT / STATE_PATH
OUTPUT = ROOT / "output"
VISUAL = OUTPUT / "visual" / "cms"
LOG_PATH = OUTPUT / "logs" / "cms-browser.log"
RUN_ID = time.strftime("%Y%m%d-%H%M%S", time.localtime())
HEADLESS = os.environ.get("CMS_HEADLESS", "1").lower() not in {"0", "false", "no"}


class ScenarioFailure(RuntimeError):
    """A visible QA failure; the runner records it and continues independently."""


@dataclass
class Result:
    name: str
    status: str
    detail: str = ""


class Reporter:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self.file = path.open("w", encoding="utf-8")
        self.results: list[Result] = []

    def write(self, line: str) -> None:
        print(line, flush=True)
        self.file.write(line + "\n")
        self.file.flush()

    def note(self, line: str) -> None:
        self.write(f"NOTE {line}")

    def run(self, name: str, fn, depends: tuple[str, ...] = ()) -> bool:
        blocked = [
            result.name
            for result in self.results
            if result.name in depends and result.status != "PASS"
        ]
        if blocked:
            detail = f"beroende misslyckades: {', '.join(blocked)}"
            self.results.append(Result(name, "BLOCKED", detail))
            self.write(f"BLOCKED {name}: {detail}")
            return False
        try:
            fn()
        except ScenarioFailure as error:
            detail = compact(str(error))
            self.results.append(Result(name, "FAIL", detail))
            self.write(f"FAIL {name}: {detail}")
            self.write_traceback()
            return False
        except Exception as error:  # Keep independent checks running on unexpected failures.
            detail = compact(f"{type(error).__name__}: {error}")
            self.results.append(Result(name, "FAIL", detail))
            self.write(f"FAIL {name}: {detail}")
            self.write_traceback()
            return False
        self.results.append(Result(name, "PASS"))
        self.write(f"PASS {name}")
        return True

    def write_traceback(self) -> None:
        lines = traceback.format_exc().splitlines()
        for line in lines[-8:]:
            self.write(f"  {compact(line, 600)}")

    def summary(self) -> int:
        counts = {status: sum(result.status == status for result in self.results) for status in ("PASS", "FAIL", "BLOCKED")}
        self.write(f"SUMMARY pass={counts['PASS']} fail={counts['FAIL']} blocked={counts['BLOCKED']}")
        self.write(f"ARTIFACT log={self.path}")
        self.file.close()
        return 0 if counts["FAIL"] == 0 and counts["BLOCKED"] == 0 else 1


def compact(value: str, limit: int = 1000) -> str:
    return re.sub(r"\s+", " ", value).strip()[:limit]


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return result[:70] or "page"


def loopback_base(url: str) -> bool:
    parsed = urlsplit(url)
    host = (parsed.hostname or "").lower()
    return parsed.scheme in {"http", "https"} and host in {"127.0.0.1", "localhost", "::1"}


def read_api(request, url: str):
    """Reconnect at most twice for GET/ECONNRESET; HTTP failures are not retried."""
    return request.get(url, max_retries=2)


def make_png(path: Path) -> None:
    """Create a tiny deterministic local PNG for the upload control."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    path.write_bytes(data)


def shell_metrics(page: Page) -> dict[str, int]:
    return page.evaluate(
        """() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
          bodyClientWidth: document.body ? document.body.clientWidth : 0,
        })"""
    )


def assert_no_overflow(page: Page, label: str) -> None:
    metrics = shell_metrics(page)
    if metrics["scrollWidth"] > metrics["clientWidth"] or metrics["bodyScrollWidth"] > metrics["bodyClientWidth"]:
        raise ScenarioFailure(f"{label}: horisontell overflow {metrics}")


def track_page(page: Page, label: str) -> list[str]:
    errors: list[str] = []

    def on_console(message) -> None:
        if message.type == "error":
            errors.append(f"console error: {compact(message.text, 500)}")

    def on_pageerror(error) -> None:
        errors.append(f"pageerror: {compact(str(error), 500)}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    return errors


def assert_clean(errors: list[str], label: str) -> None:
    if errors:
        detail = "; ".join(errors[:8])
        suffix = "" if len(errors) <= 8 else f" (+{len(errors) - 8} till)"
        raise ScenarioFailure(f"{label}: {detail}{suffix}")


class CMSBrowserQA:
    def __init__(self, browser: Browser, reporter: Reporter) -> None:
        self.browser = browser
        self.reporter = reporter
        self.page_entries: list[dict[str, str]] = []
        self.upload_path = OUTPUT / "cms-local" / "cms-browser-upload.png"
        self.font_fixture = ROOT / "tests" / "fixtures" / "dm-sans-latin-400-normal.woff2"
        make_png(self.upload_path)

    def context(self, viewport: dict[str, int], authenticated: bool = True) -> BrowserContext:
        options = {"viewport": viewport, "accept_downloads": True}
        if authenticated:
            options["storage_state"] = str(STATE_PATH)
        return self.browser.new_context(**options)

    def admin_page(self, viewport: dict[str, int], label: str) -> tuple[BrowserContext, Page, list[str]]:
        context = self.context(viewport)
        try:
            page = context.new_page()
            errors = track_page(page, label)
            response = page.goto(f"{BASE_URL}/admin/", wait_until="domcontentloaded", timeout=20000)
            if response is not None and response.status >= 400:
                raise ScenarioFailure(f"{label}: /admin/ HTTP {response.status}")
            if "/login" in page.url or "studio" not in (page.locator("body").get_attribute("class") or ""):
                raise ScenarioFailure(f"{label}: autentiserad admin-vy saknas ({page.url})")
            if viewport["width"] <= 500:
                # The mobile shell intentionally hides the desktop sidebar. Its
                # Sidor drawer is opened only when a scenario selects a page.
                page.locator('[data-action="toggle-pages"]').wait_for(state="visible", timeout=10000)
            else:
                page.locator("#library-list").wait_for(state="visible", timeout=20000)
                page.locator("[data-page-id]").first.wait_for(state="visible", timeout=20000)
            # Boot opens the initial canvas even while the mobile drawer is closed;
            # use the actual canvas/load state as the readiness contract.
            self.wait_canvas(page)
            page.wait_for_timeout(600)
            self.dismiss_recovery(page)
            return context, page, errors
        except Exception:
            context.close()
            raise

    @staticmethod
    def dismiss_recovery(page: Page) -> None:
        dialog = page.locator("#studio-dialog[open]")
        if dialog.count() and dialog.is_visible():
            text = dialog.inner_text()
            if "idé väntar" in text or "lokalt utkast" in text:
                dialog.locator("[data-confirm=no]").click()
                dialog.wait_for(state="hidden", timeout=5000)

    @staticmethod
    def open_assets(page: Page, section: str = "media") -> None:
        """Open the resource tab before selecting its unique sidebar entry."""
        if section not in {"media", "wins"}:
            raise ValueError(f"Unknown resource section: {section}")
        # Selecting this tab already opens media; clicking its sidebar row too
        # starts another fetch and can match the detail view's back button.
        page.locator('[data-library=assets]').click()
        if section == "wins":
            page.locator('#library-list [data-special=wins]').click()
        target = '#win-search' if section == "wins" else '[data-action=toggle-archived]'
        page.locator(f'#special-stage {target}').wait_for(state="visible", timeout=20000)

    @staticmethod
    def save_asset_metadata(page: Page) -> None:
        """Wait for both the server acknowledgement and the new version's form."""
        previous = page.locator('#asset-name').element_handle()
        if previous is None:
            raise ScenarioFailure("Filens metadataformulär saknas")
        try:
            with page.expect_response(lambda response: response.request.method == 'POST' and urlsplit(response.url).path.startswith('/admin/api/assets/')) as pending:
                page.locator('[data-action=save-asset]').click()
            response = pending.value
            if response.status != 200:
                raise ScenarioFailure(f"Metadata sparades inte: HTTP {response.status}")
            # A visible input alone is not an acknowledgement: the old form is
            # still visible while the POST runs, with the old CAS version.
            page.wait_for_function('input => !input.isConnected', arg=previous, timeout=20000)
            page.locator('#asset-name').wait_for(state="visible", timeout=20000)
        finally:
            previous.dispose()

    @staticmethod
    def upload_file(page: Page, path: Path) -> dict:
        """Upload via the UI; read its committed metadata outside the CDP cache."""
        with page.expect_response(lambda response: response.request.method == 'POST' and urlsplit(response.url).path == '/admin/api/upload') as pending:
            page.locator('#file-input').set_input_files(str(path))
        response = pending.value
        if response.status != 201:
            raise ScenarioFailure(f"Uppladdningen misslyckades: HTTP {response.status}")
        asset_id = response.request.headers.get('x-cms-upload-id')
        if not asset_id:
            raise ScenarioFailure("Uppladdningen saknar sin begärans fil-ID")
        # The app clears this input in finally, after processing upload and
        # any replacement. Do not replay a mutation to recover a cached body.
        page.wait_for_function("() => document.querySelector('#file-input').files.length === 0", timeout=20000)
        page.locator('#asset-name').wait_for(state="visible", timeout=20000)
        state = read_api(page.request, BASE_URL+'/admin/api/state')
        try:
            if state.status != 200:
                raise ScenarioFailure(f"Uppladdningens metadata kunde inte läsas: HTTP {state.status}")
            matches = [asset for asset in state.json()['assets'] if asset['id'] == asset_id]
        finally:
            state.dispose()
        if len(matches) != 1 or matches[0]['name'] != Path(path).name:
            raise ScenarioFailure(f"Uppladdad fil saknas eller stämmer inte i lagringen: {asset_id}")
        return matches[0]

    @staticmethod
    def wait_canvas(page: Page, timeout: int = 20000) -> None:
        page.locator("#editor iframe.gjs-frame").wait_for(state="attached", timeout=timeout)
        page.locator("#loading-state").wait_for(state="hidden", timeout=timeout)
        page.wait_for_timeout(500)

    @staticmethod
    def frame(page: Page) -> Frame:
        handle = page.locator("#editor iframe.gjs-frame").element_handle()
        if handle is None:
            raise ScenarioFailure("GrapesJS .gjs-frame saknar element handle")
        frame = handle.content_frame()
        if frame is None:
            raise ScenarioFailure("GrapesJS .gjs-frame saknar innehållsram")
        frame.locator("body").wait_for(state="attached", timeout=10000)
        return frame

    @staticmethod
    def first_text_target(frame: Frame):
        for selector in ("h1", "h2", "h3", "p"):
            candidates = frame.locator(selector)
            for index in range(min(candidates.count(), 12)):
                candidate = candidates.nth(index)
                if candidate.is_visible():
                    return candidate
        raise ScenarioFailure("canvas saknar klickbar rubrik eller text")

    @staticmethod
    def wait_saved(page: Page, timeout: float = 30) -> str:
        deadline = time.monotonic() + timeout
        save = page.locator("[data-action=save]")
        revert = page.locator("[data-action=revert]")
        status = page.locator("#save-status")
        while time.monotonic() < deadline:
            label = status.inner_text()
            if "Sparar" not in label and save.is_disabled() and revert.is_disabled():
                return label
            time.sleep(0.2)
        raise ScenarioFailure(f"Save avslutades inte: {status.inner_text()}")

    @staticmethod
    def confirm_yes(page: Page) -> None:
        dialog = page.locator("#studio-dialog[open]")
        dialog.wait_for(state="visible", timeout=5000)
        dialog.locator("[data-confirm=yes]").click()
        dialog.wait_for(state="hidden", timeout=10000)

    @staticmethod
    def revert_if_dirty(page: Page) -> None:
        button = page.locator("[data-action=revert]")
        if button.is_disabled():
            return
        button.click()
        CMSBrowserQA.confirm_yes(page)
        CMSBrowserQA.wait_canvas(page)

    @staticmethod
    def screenshot(page: Page, name: str) -> None:
        VISUAL.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(VISUAL / f"{RUN_ID}-{slug(name)}.png"), full_page=True)

    @staticmethod
    def open_page(page: Page, entry: dict[str, str]) -> None:
        row = page.locator(f'[data-page-id="{entry["id"]}"]')
        if not row.count():
            raise ScenarioFailure(f"sidrad saknas: {entry['id']}")
        if not row.is_visible():
            toggle = page.locator('[data-action="toggle-pages"]')
            if not toggle.is_visible():
                raise ScenarioFailure("mobilens Sidor-drawer kan inte öppnas")
            toggle.click()
            row.wait_for(state="visible", timeout=10000)
        row.click()
        CMSBrowserQA.wait_canvas(page)
        path = page.locator("#canvas-path").inner_text()
        if not path:
            raise ScenarioFailure(f"sidans canvas saknar path: {entry['name']}")

    def login(self, viewport: dict[str, int], label: str) -> None:
        context = self.context(viewport, authenticated=False)
        try:
            page = context.new_page()
            errors = track_page(page, label)
            response = page.goto(f"{BASE_URL}/login/", wait_until="domcontentloaded", timeout=20000)
            if response is not None and response.status >= 400:
                # Keep visual evidence of a routing failure before recording it.
                self.screenshot(page, label)
                raise ScenarioFailure(f"{label}: /login/ HTTP {response.status}")
            page.locator(".login-button").wait_for(state="visible", timeout=10000)
            if not page.locator(".login-trust").is_visible():
                raise ScenarioFailure(f"{label}: Cloudflare Access-förtroendetext saknas")
            self.screenshot(page, label)
            assert_no_overflow(page, label)
            assert_clean(errors, label)
        finally:
            context.close()

    def admin(self, viewport: dict[str, int], label: str, remember_pages: bool = False) -> None:
        context, page, errors = self.admin_page(viewport, label)
        try:
            count = page.locator("[data-page-id]").count()
            if count == 0:
                raise ScenarioFailure(f"{label}: inga sidor i biblioteket")
            if remember_pages:
                self.page_entries = []
                for index in range(count):
                    row = page.locator("[data-page-id]").nth(index)
                    self.page_entries.append(
                        {
                            "id": row.get_attribute("data-page-id") or "",
                            "name": row.locator(".page-name").inner_text(),
                        }
                    )
                self.reporter.note(f"canvas-sidor upptäckta dynamiskt: {len(self.page_entries)}")
            self.screenshot(page, label)
            assert_no_overflow(page, label)
            assert_clean(errors, label)
        finally:
            context.close()

    def edit_save_public(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "edit-save")
        old = ""
        try:
            if not self.page_entries:
                self.page_entries = self.discover_pages(page)
            self.open_page(page, self.page_entries[0])
            frame = self.frame(page)
            target = self.first_text_target(frame)
            target.click()
            page.locator("#element-text").wait_for(state="visible", timeout=10000)
            old = page.locator("#element-text").input_value()
            marker = f"{old} · QA-{RUN_ID}"
            page.locator("#element-text").fill(marker)
            page.wait_for_timeout(600)
            if not page.locator("[data-action=save]").is_enabled():
                raise ScenarioFailure("textinmatning aktiverade inte Save")
            page.locator("[data-action=save]").click()
            save_label = self.wait_saved(page)
            if "sparad" not in save_label.lower() and "original" not in save_label.lower():
                raise ScenarioFailure(f"oväntat Save-läge: {save_label}")
            page.locator("[data-device=compare]").click()
            page.locator("#preview-stage iframe").nth(1).wait_for(state="attached", timeout=20000)
            self.screenshot(page, "edit-save-compare")

            public_context = self.browser.new_context(viewport={"width": 1440, "height": 900})
            public_page = public_context.new_page()
            public_errors = track_page(public_page, "public-reload")
            try:
                response = public_page.goto(f"{BASE_URL}/", wait_until="domcontentloaded", timeout=20000)
                if response is not None and response.status >= 400:
                    raise ScenarioFailure(f"public HTTP {response.status}")
                public_page.wait_for_timeout(700)
                if marker not in public_page.locator("body").inner_text():
                    raise ScenarioFailure("public HTTP saknar sparad text")
                public_page.reload(wait_until="domcontentloaded", timeout=20000)
                public_page.wait_for_timeout(700)
                if marker not in public_page.locator("body").inner_text():
                    raise ScenarioFailure("public reload saknar sparad text")
                assert_no_overflow(public_page, "public-reload")
                assert_clean(public_errors, "public-reload")
                self.screenshot(public_page, "public-reload")
            finally:
                public_context.close()

            # Verify the preview itself contains the public scripts used by the page.
            page.locator("[data-action=lock]").click()
            page.locator("#preview-stage iframe").first.wait_for(state="attached", timeout=20000)
            preview_frame = page.frame_locator("#preview-stage iframe").first
            # Attached frames first expose about:blank; wait for the srcdoc document,
            # not an instantaneous count on a frame whose navigation just started.
            preview_frame.locator('script[type=module][src*="/assets/main."]').wait_for(state="attached", timeout=20000)
            scripts = [
                preview_frame.locator("script[src]").nth(index).get_attribute("src") or ""
                for index in range(preview_frame.locator("script[src]").count())
            ]
            if not any("main" in source or source.endswith(".mjs") for source in scripts):
                raise ScenarioFailure(f"publica scripts saknas i preview: {scripts}")
        finally:
            # Keep the local CMS fixture clean even if public verification fails.
            if old:
                try:
                    page.locator("[data-action=edit]").click()
                    self.wait_canvas(page)
                    frame = self.frame(page)
                    self.first_text_target(frame).click()
                    page.locator("#element-text").wait_for(state="visible", timeout=10000)
                    page.locator("#element-text").fill(old)
                    page.wait_for_timeout(500)
                    if page.locator("[data-action=save]").is_enabled():
                        page.locator("[data-action=save]").click()
                        self.wait_saved(page)
                except Exception as cleanup_error:
                    self.reporter.note(f"edit-save cleanup kunde inte återställa lokal text: {compact(str(cleanup_error))}")
            assert_clean(errors, "edit-save")
            context.close()

    @staticmethod
    def shift_enter_text(locator, first: str = "Omar", second: str = "Yusuf.") -> str:
        locator.click()
        locator.press("ControlOrMeta+A")
        locator.press("Backspace")
        locator.type(first)
        locator.press("Shift+Enter")
        locator.type(second)
        return f"{first}\n{second}"

    def public_copy_check(self, expected: str, label: str) -> None:
        for device, viewport in (("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})):
            context = self.browser.new_context(viewport=viewport)
            page = context.new_page()
            errors = track_page(page, f"{label}-{device}")
            try:
                response = page.goto(f"{BASE_URL}/", wait_until="domcontentloaded", timeout=20000)
                if response is not None and response.status >= 400:
                    raise ScenarioFailure(f"{label}-{device}: public HTTP {response.status}")
                page.wait_for_timeout(700)
                heading = page.locator("h1").first.inner_text()
                body = page.locator("body").inner_text()
                if expected not in heading and expected not in body:
                    raise ScenarioFailure(f"{label}-{device}: saknar exakt radbrytning {expected!r}")
                assert_no_overflow(page, f"{label}-{device}")
                assert_clean(errors, f"{label}-{device}")
                self.screenshot(page, f"{label}-{device}")
            finally:
                context.close()

    def newline_rte_save_reload(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "newline-rte")
        old = ""
        expected = "Omar\nYusuf."
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            frame = self.frame(page)
            target = self.first_text_target(frame)
            old = target.inner_text()
            target.dblclick()
            page.wait_for_timeout(300)
            editable = frame.locator("[contenteditable=true]").first
            editable.wait_for(state="visible", timeout=5000)
            typed = self.shift_enter_text(editable)
            if editable.inner_text() != typed:
                raise ScenarioFailure(f"RTE gav oväntad text efter Shift+Enter: {editable.inner_text()!r}")
            page.locator("#canvas-label").click()
            page.wait_for_timeout(600)
            if not page.locator("[data-action=save]").is_enabled():
                raise ScenarioFailure("RTE-radbrytning aktiverade inte Save")
            page.locator("[data-action=save]").click()
            self.wait_saved(page)
            self.public_copy_check(expected, "newline-rte")
            self.screenshot(page, "newline-rte-admin")
        finally:
            if old:
                try:
                    page.locator("[data-action=edit]").click()
                    self.wait_canvas(page)
                    target = self.first_text_target(self.frame(page))
                    target.click()
                    page.locator("#element-text").wait_for(state="visible", timeout=10000)
                    if page.locator("#element-text").input_value() != old:
                        page.locator("#element-text").fill(old)
                        page.wait_for_timeout(500)
                        if page.locator("[data-action=save]").is_enabled():
                            page.locator("[data-action=save]").click()
                            self.wait_saved(page)
                except Exception as cleanup_error:
                    self.reporter.note(f"newline RTE cleanup kunde inte återställa lokal text: {compact(str(cleanup_error))}")
            assert_clean(errors, "newline-rte")
            context.close()

    def newline_textarea_save_reload(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "newline-textarea")
        old = ""
        expected = "Omar\nYusuf."
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            target = self.first_text_target(self.frame(page))
            target.click()
            page.locator("#element-text").wait_for(state="visible", timeout=10000)
            old = page.locator("#element-text").input_value()
            typed = self.shift_enter_text(page.locator("#element-text"))
            if page.locator("#element-text").input_value() != typed:
                raise ScenarioFailure(f"inspector-textarea gav oväntad text efter Shift+Enter: {page.locator('#element-text').input_value()!r}")
            page.wait_for_timeout(600)
            if not page.locator("[data-action=save]").is_enabled():
                raise ScenarioFailure("textarea-radbrytning aktiverade inte Save")
            page.locator("[data-action=save]").click()
            self.wait_saved(page)
            self.public_copy_check(expected, "newline-textarea")
            self.screenshot(page, "newline-textarea-admin")
        finally:
            if old:
                try:
                    page.locator("[data-action=edit]").click()
                    self.wait_canvas(page)
                    target = self.first_text_target(self.frame(page))
                    target.click()
                    page.locator("#element-text").wait_for(state="visible", timeout=10000)
                    if page.locator("#element-text").input_value() != old:
                        page.locator("#element-text").fill(old)
                        page.wait_for_timeout(500)
                        if page.locator("[data-action=save]").is_enabled():
                            page.locator("[data-action=save]").click()
                            self.wait_saved(page)
                except Exception as cleanup_error:
                    self.reporter.note(f"newline textarea cleanup kunde inte återställa lokal text: {compact(str(cleanup_error))}")
            assert_clean(errors, "newline-textarea")
            context.close()

    def discover_pages(self, page: Page) -> list[dict[str, str]]:
        entries: list[dict[str, str]] = []
        for index in range(page.locator("[data-page-id]").count()):
            row = page.locator("[data-page-id]").nth(index)
            entries.append({"id": row.get_attribute("data-page-id") or "", "name": row.locator(".page-name").inner_text()})
        if not entries:
            raise ScenarioFailure("inga dynamiskt upptäckta sidor")
        return entries

    def create_and_duplicate_pages(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "pages")
        created_name = f"QA sida {RUN_ID}"
        created_path = f"/qa-browser-{RUN_ID.replace('-', '')}/"
        copy_name = f"QA kopia {RUN_ID}"
        copy_path = f"/qa-browser-{RUN_ID.replace('-', '')}-copy/"
        try:
            before = page.locator("[data-page-id]").count()
            page.locator("[data-action=add-page]").click()
            page.locator("#new-page-name").fill(created_name)
            page.locator("#new-page-path").fill(created_path)
            page.locator("#create-page").click()
            page.locator("#canvas-path").wait_for(state="visible", timeout=10000)
            if page.locator("#canvas-path").inner_text() != created_path:
                raise ScenarioFailure("ny sida öppnades inte i angiven path")
            page.locator("#page-name").wait_for(state="visible", timeout=10000)
            if page.locator("#page-name").input_value() != created_name:
                raise ScenarioFailure("ny sidans namn saknas i inspector")
            if page.locator("[data-page-id]").count() != before + 1:
                raise ScenarioFailure("ny sida syns inte i sidbiblioteket")

            page.locator("#duplicate-page").click()
            page.locator("#new-page-name").fill(copy_name)
            page.locator("#new-page-path").fill(copy_path)
            page.locator("#create-page").click()
            if page.locator("#canvas-path").inner_text() != copy_path:
                raise ScenarioFailure("duplicerad sida öppnades inte i angiven path")
            if page.locator("[data-page-id]").count() != before + 2:
                raise ScenarioFailure("duplicerad sida syns inte i sidbiblioteket")
            page.locator("[data-action=save]").click()
            self.wait_saved(page)

            public_context = self.browser.new_context(viewport={"width": 1200, "height": 800})
            public_page = public_context.new_page()
            public_errors = track_page(public_page, "new-page-public")
            try:
                response = public_page.goto(f"{BASE_URL}{copy_path}", wait_until="domcontentloaded", timeout=20000)
                if response is None or response.status >= 400:
                    raise ScenarioFailure(f"duplicerad sida publicerades inte: {response.status if response else 'ingen response'}")
                assert_no_overflow(public_page, "new-page-public")
                assert_clean(public_errors, "new-page-public")
            finally:
                public_context.close()
        finally:
            # Remove both local QA pages through the same UI when possible.
            try:
                if page.locator("#delete-page").is_visible():
                    page.locator("#delete-page").click()
                    self.confirm_yes(page)
                    self.wait_canvas(page)
                duplicate_row = page.locator("[data-page-id]").filter(has_text=created_name)
                if duplicate_row.count():
                    duplicate_row.first.click()
                    self.wait_canvas(page)
                    page.locator("#delete-page").click()
                    self.confirm_yes(page)
                    self.wait_canvas(page)
                if page.locator("[data-action=save]").is_enabled():
                    page.locator("[data-action=save]").click()
                    self.wait_saved(page)
            except Exception as cleanup_error:
                self.reporter.note(f"page cleanup kunde inte ta bort lokala QA-sidor: {compact(str(cleanup_error))}")
            assert_clean(errors, "pages")
            context.close()

    def style_and_devices(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "style-devices")
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            page.locator("[data-action=theme]").click()
            page.locator("#theme-size").wait_for(state="visible", timeout=10000)
            old_value = int(page.locator("#theme-size").input_value())
            new_value = old_value + 1 if old_value < 32 else old_value - 1
            page.locator("#theme-size").fill(str(new_value))
            page.locator("#theme-size").press("Tab")
            page.wait_for_timeout(500)
            if not page.locator("[data-action=save]").is_enabled():
                raise ScenarioFailure("stiländring aktiverade inte Save")
            page.locator("[data-device=mobile]").click()
            if "390" not in page.locator("#viewport-size").inner_text():
                raise ScenarioFailure("Mobil device ändrade inte canvasstorleken")
            page.locator("[data-device=desktop]").click()
            if "1440" not in page.locator("#viewport-size").inner_text():
                raise ScenarioFailure("Dator device ändrade inte canvasstorleken")
            self.screenshot(page, "style-devices")
            self.revert_if_dirty(page)
            assert_no_overflow(page, "style-devices")
            assert_clean(errors, "style-devices")
        finally:
            context.close()

    def undo_redo_revert(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "undo-redo-revert")
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            target = self.first_text_target(self.frame(page))
            target.click()
            page.locator("#element-text").wait_for(state="visible", timeout=10000)
            old = page.locator("#element-text").input_value()
            marker = f"{old} · UNDO-{RUN_ID}"
            page.locator("#element-text").fill(marker)
            page.wait_for_timeout(500)
            page.locator("[data-action=undo]").click()
            self.wait_canvas(page)
            if marker in self.first_text_target(self.frame(page)).inner_text():
                raise ScenarioFailure("Undo återställde inte canvastexten")
            page.locator("[data-action=redo]").click()
            self.wait_canvas(page)
            if marker not in self.first_text_target(self.frame(page)).inner_text():
                raise ScenarioFailure("Redo återställde inte canvastexten")
            page.locator("[data-action=revert]").click()
            self.confirm_yes(page)
            self.wait_canvas(page)
            if self.first_text_target(self.frame(page)).inner_text() != old:
                raise ScenarioFailure("Revert återställde inte sparad canvastext")
            self.screenshot(page, "undo-redo-revert")
            assert_no_overflow(page, "undo-redo-revert")
            assert_clean(errors, "undo-redo-revert")
        finally:
            context.close()

    def history_review_restore(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "history")
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            page.locator("[data-action=history]").click()
            page.locator("#special-stage").wait_for(state="visible", timeout=10000)
            page.locator(".history-row").first.wait_for(state="visible", timeout=20000)
            rows = page.locator(".history-row")
            if not rows.count():
                raise ScenarioFailure("historiken saknar versionsrader")
            review = rows.first.locator("[data-review-version]")
            restore = rows.nth(1 if rows.count() > 1 else 0).locator("[data-restore-version]")
            review_version = review.get_attribute("data-review-version")
            restore_version = restore.get_attribute("data-restore-version")
            if not review_version or not restore_version:
                raise ScenarioFailure("historikraden saknar dynamiska review/restore-hooks")
            review.click()
            page.locator("#preview-stage iframe").first.wait_for(state="attached", timeout=20000)
            self.screenshot(page, f"history-review-{review_version}")
            page.locator("[data-action=history]").click()
            page.locator(".history-row").first.wait_for(state="visible", timeout=20000)
            restore = page.locator(f'[data-restore-version="{restore_version}"]').first
            restore.click()
            self.confirm_yes(page)
            self.wait_canvas(page)
            if not page.locator("[data-action=save]").is_enabled() and not page.locator("[data-action=revert]").is_enabled():
                self.reporter.note(f"restore version {restore_version} gav inget synligt utkastläge (redan aktuell version)")
            else:
                self.revert_if_dirty(page)
            assert_no_overflow(page, "history")
            assert_clean(errors, "history")
        finally:
            context.close()

    def lock_compare(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "lock-compare")
        try:
            entries = self.page_entries or self.discover_pages(page)
            self.open_page(page, entries[0])
            page.locator("[data-action=lock]").click()
            page.locator("[data-action=lock][aria-pressed=true]").wait_for(state="visible", timeout=5000)
            page.locator("#preview-stage iframe").first.wait_for(state="attached", timeout=20000)
            preview = page.frame_locator("#preview-stage iframe").first
            script_count = preview.locator("script[src]").count()
            scripts = [preview.locator("script[src]").nth(i).get_attribute("src") or "" for i in range(script_count)]
            if not scripts:
                raise ScenarioFailure("Lock preview saknar publicerade script")
            page.locator("[data-device=compare]").click()
            page.locator("#preview-stage iframe").nth(1).wait_for(state="attached", timeout=20000)
            self.screenshot(page, "lock-compare")
            assert_no_overflow(page, "lock-compare")
            assert_clean(errors, "lock-compare")
        finally:
            context.close()

    def upload_asset_metadata(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "assets-upload")
        try:
            page.locator("[data-library=assets]").click()
            page.locator("[data-action=upload]").wait_for(state="visible", timeout=10000)
            with page.expect_file_chooser(timeout=5000) as chooser_info:
                page.locator("[data-action=upload]").click()
            chooser_info.value.set_files(str(self.upload_path))
            page.locator("#asset-name").wait_for(state="visible", timeout=20000)
            original_name = page.locator("#asset-name").input_value()
            if not original_name.lower().endswith(".png"):
                raise ScenarioFailure(f"uppladdad PNG fick oväntat namn: {original_name}")
            asset_name = f"QA metadata {RUN_ID}.png"
            asset_alt = f"Lokal QA PNG {RUN_ID}"
            page.locator("#asset-name").fill(asset_name)
            page.locator("#asset-alt").fill(asset_alt)
            self.save_asset_metadata(page)
            if page.locator("#asset-name").input_value() != asset_name or page.locator("#asset-alt").input_value() != asset_alt:
                raise ScenarioFailure("assetmetadata sparades inte via UI")
            self.screenshot(page, "assets-upload-metadata")
            assert_no_overflow(page, "assets-upload")
            assert_clean(errors, "assets-upload")
        finally:
            context.close()

    @staticmethod
    def font_select(page: Page, font_value: str):
        """Find the GrapesJS font-family select containing an uploaded font."""
        selectors = page.locator("#styles-panel select")
        for index in range(selectors.count()):
            selector = selectors.nth(index)
            if selector.locator(f'option[value="{font_value}"]').count():
                return selector
        # The typography sector can be collapsed after a component reload.
        titles = page.locator("#styles-panel .gjs-sm-sector-title")
        for index in range(titles.count()):
            if "Typografi" in titles.nth(index).inner_text():
                titles.nth(index).click()
                break
        page.wait_for_timeout(250)
        selectors = page.locator("#styles-panel select")
        for index in range(selectors.count()):
            selector = selectors.nth(index)
            if selector.locator(f'option[value="{font_value}"]').count():
                return selector
        raise ScenarioFailure(f"individuell font-family-hook saknas för {font_value}")

    @staticmethod
    def asset_ids(page: Page) -> set[str]:
        return {
            asset_id
            for asset_id in (
                page.locator("[data-asset-id]").nth(index).get_attribute("data-asset-id")
                for index in range(page.locator("[data-asset-id]").count())
            )
            if asset_id
        }

    def public_font_check(self, font_value: str, label: str) -> None:
        for device, viewport in (("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})):
            context = self.browser.new_context(viewport=viewport)
            page = context.new_page()
            errors = track_page(page, f"{label}-{device}")
            font_responses = []

            def capture_font(response) -> None:
                if f"/media/{font_value.removeprefix('cms-font-')}.woff2" in response.url:
                    font_responses.append(response)

            page.on("response", capture_font)
            try:
                response = page.goto(f"{BASE_URL}/", wait_until="domcontentloaded", timeout=20000)
                if response is not None and response.status >= 400:
                    raise ScenarioFailure(f"{label}-{device}: public HTTP {response.status}")
                page.wait_for_timeout(500)
                loaded = page.evaluate(
                    """async family => {
                      await document.fonts.ready;
                      await document.fonts.load(`16px "${family}"`);
                      return document.fonts.check(`16px "${family}"`);
                    }""",
                    font_value,
                )
                body_family = page.evaluate("() => getComputedStyle(document.body).fontFamily")
                heading_family = page.locator("h1").first.evaluate("node => getComputedStyle(node).fontFamily")
                if not loaded:
                    raise ScenarioFailure(f"{label}-{device}: document.fonts.check=false")
                if font_value not in body_family or font_value not in heading_family:
                    raise ScenarioFailure(
                        f"{label}-{device}: computed font saknar {font_value} "
                        f"(body={body_family!r}, h1={heading_family!r})"
                    )
                matching = [
                    item
                    for item in font_responses
                    if item.status == 200 and item.headers.get("content-type", "").lower().startswith("font/woff2")
                ]
                if not matching:
                    seen = [(item.status, item.headers.get("content-type", "")) for item in font_responses]
                    raise ScenarioFailure(f"{label}-{device}: font request saknar HTTP 200 font/woff2: {seen}")
                page.reload(wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(500)
                reloaded = page.evaluate(
                    """async family => {
                      await document.fonts.ready;
                      await document.fonts.load(`16px "${family}"`);
                      return document.fonts.check(`16px "${family}"`);
                    }""",
                    font_value,
                )
                if not reloaded:
                    raise ScenarioFailure(f"{label}-{device}: document.fonts.check=false efter reload")
                assert_no_overflow(page, f"{label}-{device}")
                assert_clean(errors, f"{label}-{device}")
                self.screenshot(page, f"{label}-{device}")
            finally:
                context.close()

    def font_upload_and_apply(self) -> None:
        if not self.font_fixture.is_file():
            raise ScenarioFailure(f"legal WOFF2-fixture saknas: {self.font_fixture}")
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "font")
        asset_id = ""
        font_value = ""
        original_theme = ""
        original_individual = ""
        original_individual_index = 0
        main_error: Exception | None = None
        cleanup_error: Exception | None = None
        try:
            try:
                if not self.page_entries:
                    page.locator('[data-library="pages"]').click()
                    page.locator('[data-page-id]').first.wait_for(state="visible", timeout=10000)
                    self.page_entries = self.discover_pages(page)
                entries = self.page_entries
                page.locator("[data-library=assets]").click()
                page.locator('[data-action="upload"]').wait_for(state="visible", timeout=10000)
                before_ids = self.asset_ids(page)
                with page.expect_file_chooser(timeout=5000) as chooser_info:
                    page.locator('[data-action="upload"]').click()
                chooser_info.value.set_files(str(self.font_fixture))
                page.locator("#asset-name").wait_for(state="visible", timeout=20000)
                if not page.locator("#asset-name").input_value().lower().endswith(".woff2"):
                    raise ScenarioFailure("WOFF2-upload fick inte .woff2-filnamn")
                page.locator('.asset-nav-row[data-special="media"]').click()
                page.locator('[data-action="upload"]').wait_for(state="visible", timeout=10000)
                after_ids = self.asset_ids(page)
                new_ids = after_ids - before_ids
                if len(new_ids) != 1:
                    raise ScenarioFailure(f"WOFF2-upload gav inte exakt en ny asset: {sorted(new_ids)}")
                asset_id = next(iter(new_ids))
                page.locator(f'[data-asset-id="{asset_id}"]').click()
                page.locator("#asset-name").wait_for(state="visible", timeout=10000)
                if page.locator("#selection-type").inner_text() != "font/woff2":
                    raise ScenarioFailure(f"asset MIME blev {page.locator('#selection-type').inner_text()!r}")
                self.screenshot(page, "font-upload")

                page.locator('[data-library="pages"]').click()
                page.locator('[data-page-id]').first.wait_for(state="visible", timeout=10000)
                self.open_page(page, entries[0])
                page.locator('[data-action="theme"]').click()
                page.locator("#theme-font").wait_for(state="visible", timeout=10000)
                theme = page.locator("#theme-font")
                original_theme = theme.input_value()
                font_value = f"cms-font-{asset_id}"
                if not theme.locator(f'option[value="{font_value}"]').count():
                    raise ScenarioFailure(f"nytt WOFF2 saknas i Webbplatsens stil: {font_value}")
                theme.select_option(value=font_value)
                page.wait_for_timeout(600)
                if theme.input_value() != font_value:
                    raise ScenarioFailure("Webbplatsens stil valde inte uppladdat WOFF2")

                target = self.first_text_target(self.frame(page))
                target.click()
                page.locator("#styles-panel").wait_for(state="visible", timeout=10000)
                individual = self.font_select(page, font_value)
                original_individual = individual.input_value()
                options = individual.locator("option")
                for index in range(options.count()):
                    if options.nth(index).get_attribute("value") == original_individual:
                        original_individual_index = index
                        break
                individual.select_option(value=font_value)
                page.wait_for_timeout(700)
                if individual.input_value() != font_value:
                    raise ScenarioFailure("individuell font-family-inspector valde inte uppladdat WOFF2")
                editor_family = self.frame(page).evaluate(
                    "() => getComputedStyle(document.querySelector('.gjs-selected')).fontFamily"
                )
                if font_value not in editor_family:
                    raise ScenarioFailure(f"canvasens computed font saknar {font_value}: {editor_family!r}")
                if not page.locator("[data-action=save]").is_enabled():
                    raise ScenarioFailure("fontval aktiverade inte Save")
                page.locator("[data-action=save]").click()
                self.wait_saved(page)
                self.screenshot(page, "font-theme-individual")
                self.public_font_check(font_value, "font-public")
            except Exception as error:
                main_error = error
        finally:
            try:
                if asset_id and original_theme:
                    # Restore the selected element's original family through the
                    # same inspector before restoring the global theme.
                    page.locator('[data-action="edit"]').click()
                    self.wait_canvas(page)
                    target = self.first_text_target(self.frame(page))
                    target.click()
                    individual = self.font_select(page, font_value)
                    if original_individual in [
                        individual.locator("option").nth(index).get_attribute("value")
                        for index in range(individual.locator("option").count())
                    ]:
                        individual.select_option(value=original_individual)
                    else:
                        individual.select_option(index=original_individual_index)
                    page.locator('[data-action="theme"]').click()
                    page.locator("#theme-font").wait_for(state="visible", timeout=10000)
                    page.locator("#theme-font").select_option(value=original_theme)
                    page.wait_for_timeout(500)
                    if page.locator("[data-action=save]").is_enabled():
                        page.locator("[data-action=save]").click()
                        self.wait_saved(page)
                if asset_id:
                    page.locator("[data-library=assets]").click()
                    page.locator('.asset-nav-row[data-special="media"]').wait_for(state="visible", timeout=10000)
                    asset_card = page.locator(f'[data-asset-id="{asset_id}"]')
                    if asset_card.count():
                        asset_card.click()
                        page.locator('[data-action="archive-asset"]').wait_for(state="visible", timeout=10000)
                        page.locator('[data-action="archive-asset"]').click()
                        self.confirm_yes(page)
            except Exception as error:
                cleanup_error = error
            try:
                assert_clean(errors, "font")
            except Exception as error:
                cleanup_error = cleanup_error or error
            context.close()
        if main_error is not None:
            if cleanup_error is not None:
                self.reporter.note(f"font cleanup misslyckades efter huvudfel: {compact(str(cleanup_error))}")
            raise main_error
        if cleanup_error is not None:
            raise ScenarioFailure(f"font cleanup misslyckades: {compact(str(cleanup_error))}")

    def win_edit_export(self) -> None:
        context, page, errors = self.admin_page({"width": 1440, "height": 900}, "win-export")
        try:
            page.locator("[data-library=assets]").click()
            page.locator('[data-special="wins"]').click()
            card = page.locator(".win-card").first
            card.wait_for(state="visible", timeout=15000)
            card.click()
            page.locator("#win-text").wait_for(state="visible", timeout=15000)
            original = page.locator("#win-text").input_value()
            marker = f"{original} · QA-{RUN_ID}"
            page.locator("#win-text").fill(marker)
            page.wait_for_timeout(500)
            if page.locator("#win-text").input_value() != marker:
                raise ScenarioFailure("vinsttext kunde inte redigeras")
            with page.expect_download(timeout=20000) as download_info:
                page.locator("[data-action=export-win]").click()
            download = download_info.value
            export_path = VISUAL / f"{RUN_ID}-win-export.png"
            download.save_as(str(export_path))
            if not export_path.exists() or export_path.stat().st_size < 100:
                raise ScenarioFailure("vinstexport skapade ingen PNG-artifact")
            if not export_path.read_bytes().startswith(b"\x89PNG"):
                raise ScenarioFailure("vinstexportens artifact är inte PNG")
            self.screenshot(page, "win-edit-export")
            self.revert_if_dirty(page)
            assert_no_overflow(page, "win-export")
            assert_clean(errors, "win-export")
        finally:
            context.close()

    def canvas_snapshot(self, entry: dict[str, str], device: str) -> None:
        label = f"canvas-{slug(entry['name'])}-{device}"
        context, page, errors = self.admin_page(
            {"width": 1440, "height": 900} if device == "desktop" else {"width": 390, "height": 844},
            label,
        )
        try:
            self.open_page(page, entry)
            page.locator(f"[data-device={device}]").click()
            page.locator(f"[data-device={device}][aria-pressed=true]").wait_for(state="visible", timeout=5000)
            frame = self.frame(page)
            box = page.locator("#editor iframe.gjs-frame").bounding_box()
            expected_width = 1440 if device == "desktop" else 390
            viewport_width = page.viewport_size["width"] if page.viewport_size else 0
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                inner_width = frame.evaluate("() => window.innerWidth")
                box = page.locator("#editor iframe.gjs-frame").bounding_box()
                if (
                    inner_width <= expected_width
                    and box
                    and box["x"] >= 0
                    and box["y"] >= 0
                    and box["x"] + box["width"] <= viewport_width + 1
                ):
                    break
                time.sleep(0.1)
            else:
                raise ScenarioFailure(f"canvasens geometri blev inte klar: innerWidth={inner_width}, box={box}")
            # Wheel over the real canvas viewport. This follows the same input
            # path as a user and avoids treating a programmatic scroll as QA.
            wheel_x = box["x"] + box["width"] * 0.82
            wheel_y = box["y"] + box["height"] * 0.55
            page.mouse.move(wheel_x, wheel_y)
            page.mouse.wheel(0, -10000)
            page.wait_for_timeout(250)
            top_scroll = frame.evaluate(
                """() => {
                  const node = document.scrollingElement || document.documentElement;
                  return { y: node.scrollTop, max: Math.max(0, node.scrollHeight - node.clientHeight) };
                }"""
            )
            if top_scroll["y"] != 0:
                raise ScenarioFailure(f"canvas kunde inte nå toppen med wheel: {top_scroll}")
            self.screenshot(page, f"{label}-top")
            # A full-page screenshot can briefly re-layout an iframe. Re-read
            # its geometry before sending the downward wheel events.
            frame = self.frame(page)
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                inner_width = frame.evaluate("() => window.innerWidth")
                box = page.locator("#editor iframe.gjs-frame").bounding_box()
                if (
                    inner_width <= expected_width
                    and box
                    and box["x"] >= 0
                    and box["y"] >= 0
                    and box["x"] + box["width"] <= viewport_width + 1
                ):
                    break
                time.sleep(0.1)
            else:
                raise ScenarioFailure(f"canvasens geometri ändrades efter top-screenshot: innerWidth={inner_width}, box={box}")
            wheel_x = box["x"] + box["width"] * 0.82
            wheel_y = box["y"] + box["height"] * 0.55
            page.mouse.move(wheel_x, wheel_y)
            scroll = top_scroll
            for _ in range(12):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(120)
                scroll = frame.evaluate(
                    """() => {
                      const node = document.scrollingElement || document.documentElement;
                      return { y: node.scrollTop, max: Math.max(0, node.scrollHeight - node.clientHeight) };
                    }"""
                )
                if scroll["y"] == scroll["max"]:
                    break
            self.reporter.note(f"{label} slutkontroll scrollY={scroll['y']} max={scroll['max']}")
            if scroll["y"] != scroll["max"]:
                raise ScenarioFailure(f"canvas nådde inte slutet: {scroll}")
            self.screenshot(page, f"{label}-end")
            assert_no_overflow(page, label)
            assert_clean(errors, label)
        finally:
            context.close()


def launch_browser(playwright):
    name = os.environ.get('CMS_BROWSER', 'chromium')
    if name not in ('chromium', 'firefox', 'webkit'):
        raise ValueError('CMS_BROWSER must be chromium, firefox or webkit')
    options = {'headless': HEADLESS}
    if os.environ.get('CMS_BROWSER_EXECUTABLE'):
        options['executable_path'] = os.environ['CMS_BROWSER_EXECUTABLE']
    return getattr(playwright, name).launch(**options)


def main() -> int:
    reporter = Reporter(LOG_PATH)
    if not loopback_base(BASE_URL):
        reporter.write(f"FAIL config: BASE_URL måste vara loopback, fick {BASE_URL}")
        return reporter.summary()
    if not STATE_PATH.is_file():
        reporter.write(f"FAIL config: CMS_STORAGE_STATE saknas: {STATE_PATH}")
        return reporter.summary()

    reporter.note(f"BASE_URL={BASE_URL}")
    reporter.note(f"CMS_STORAGE_STATE={STATE_PATH}")
    reporter.note(f"screenshots={VISUAL}")

    try:
        with sync_playwright() as playwright:
            browser = launch_browser(playwright)
            reporter.note(f"browser={os.environ.get('CMS_BROWSER', 'chromium')}")
            reporter.note(f"browser-version={browser.version}")
            qa = CMSBrowserQA(browser, reporter)

            reporter.run("login-desktop", lambda: qa.login({"width": 1440, "height": 900}, "login-desktop"))
            reporter.run("login-mobile", lambda: qa.login({"width": 390, "height": 844}, "login-mobile"))
            reporter.run("admin-desktop", lambda: qa.admin({"width": 1440, "height": 900}, "admin-desktop", True))
            reporter.run("admin-mobile", lambda: qa.admin({"width": 390, "height": 844}, "admin-mobile"))
            reporter.run("edit-save-public-reload", qa.edit_save_public, ("admin-desktop",))
            reporter.run("newline-rte-shift-enter-save-reload", qa.newline_rte_save_reload, ("admin-desktop",))
            reporter.run("newline-textarea-shift-enter-save-reload", qa.newline_textarea_save_reload, ("admin-desktop",))
            reporter.run("new-pages-duplicate", qa.create_and_duplicate_pages, ("admin-desktop",))
            reporter.run("style-device-changes", qa.style_and_devices, ("admin-desktop",))
            reporter.run("undo-redo-revert", qa.undo_redo_revert, ("admin-desktop",))
            reporter.run("history-review-restore", qa.history_review_restore, ("admin-desktop",))
            reporter.run("lock-compare-public-scripts", qa.lock_compare, ("admin-desktop",))
            reporter.run("assets-upload-metadata", qa.upload_asset_metadata, ("admin-desktop",))
            reporter.run("font-upload-theme-individual", qa.font_upload_and_apply, ("admin-desktop",))
            reporter.run("win-edit-export", qa.win_edit_export, ("admin-desktop",))

            if qa.page_entries:
                for index, entry in enumerate(qa.page_entries, start=1):
                    desktop_name = f"canvas-{index:02d}-desktop"
                    mobile_name = f"canvas-{index:02d}-mobile"
                    reporter.run(desktop_name, lambda item=entry: qa.canvas_snapshot(item, "desktop"), ("admin-desktop",))
                    reporter.run(mobile_name, lambda item=entry: qa.canvas_snapshot(item, "mobile"), ("admin-desktop", desktop_name))
            else:
                reporter.write("BLOCKED canvas-pages: admin-desktop upptäckte inga sidrader")
            browser.close()
    except Exception as error:
        reporter.write(f"FAIL browser-launch-or-run: {type(error).__name__}: {compact(str(error))}")
        reporter.write_traceback()
    return reporter.summary()


if __name__ == "__main__":
    sys.exit(main())
