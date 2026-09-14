#!/usr/bin/env python3
"""Real HTTP/browser regression checks for the public Omar Yusuf site.

The old revision test loaded a flattened module adapter. This test starts a
real browser against BASE_URL, lets the built page load its production
modules, and uses route fixtures only for contact/Turnstile requests so no
message can reach a real mail endpoint.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import Browser, BrowserContext, Page, Request, Route, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:5273").rstrip("/")
OUTPUT = Path(os.environ.get("REVISION_OUTPUT", str(ROOT / "output" / "revision" / "browser")))
REPORT_PATH = OUTPUT / "revision-browser.json"
SCREENSHOT_DIR = OUTPUT / "screenshots"

PUBLIC_PATHS = [
    "/",
    "/verkstad/",
    "/om/",
    "/projekt/furl/",
    "/projekt/blade-blend/",
    "/projekt/backhaul/",
    "/kontakt/",
    "/integritet/",
    "/kakor/",
    "/villkor/",
    "/tillganglighet/",
    "/404.html",
]


class CheckFailure(RuntimeError):
    pass


def compact(value: object, limit: int = 900) -> str:
    return re.sub(r"\s+", " ", str(value)).strip()[:limit]


def is_loopback(url: str) -> bool:
    parsed = urlsplit(url)
    return parsed.scheme in {"http", "https"} and (parsed.hostname or "").lower() in {
        "127.0.0.1",
        "localhost",
        "::1",
    }


def wait_until(predicate, timeout: float = 12, interval: float = 0.05, description: str = "villkor"):
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            value = predicate()
            if value:
                return value
        except Exception as error:  # DOM can be between two render turns.
            last_error = error
        time.sleep(interval)
    suffix = f": {compact(last_error)}" if last_error else ""
    raise CheckFailure(f"timeout väntade på {description}{suffix}")


def visible(locator) -> bool:
    try:
        return locator.is_visible()
    except Exception:
        return False


def text(locator) -> str:
    return locator.inner_text().strip()


def focused(page: Page, locator) -> bool:
    return bool(locator.evaluate("element => document.activeElement === element"))


def assert_shell(page: Page, label: str) -> dict:
    metrics = page.evaluate(
        """() => {
          const root = document.documentElement, body = document.body;
          const controls = [...document.querySelectorAll('button, a, input, textarea, select')].filter(node => {
            const style = getComputedStyle(node);
            return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
          });
          const unlabeled = controls.filter(node => {
            if (node.matches('input,textarea,select')) return !node.getAttribute('aria-label') && !node.closest('label') && !document.querySelector(`label[for="${node.id}"]`);
            return !node.getAttribute('aria-label') && !node.textContent.trim() && !node.getAttribute('title');
          }).map(node => node.outerHTML.slice(0, 160));
          const images = [...document.images].filter(image => !image.getAttribute('alt'));
          return {
            viewportWidth: innerWidth,
            documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
            viewportHeight: innerHeight,
            documentHeight: Math.max(root.scrollHeight, body.scrollHeight),
            unlabeled,
            imagesWithoutAlt: images.length,
          };
        }"""
    )
    if metrics["documentWidth"] > metrics["viewportWidth"] + 1:
        raise CheckFailure(f"{label}: horisontell overflow {metrics}")
    if metrics["imagesWithoutAlt"]:
        raise CheckFailure(f"{label}: bilder saknar alt ({metrics['imagesWithoutAlt']})")
    if metrics["unlabeled"]:
        raise CheckFailure(f"{label}: synliga kontroller saknar etikett {metrics['unlabeled'][:3]}")
    return metrics


def assert_clean(errors: list[str], label: str) -> None:
    if errors:
        raise CheckFailure(f"{label}: browserfel: {'; '.join(errors[:5])}")


def launch(browser_type, headless: bool = True):
    options = {"headless": headless, "args": ["--no-sandbox"]}
    executable = os.environ.get("CHROMIUM_PATH")
    if executable:
        options["executable_path"] = executable
    return browser_type.launch(**options)


def install_contact_fixtures(page: Page, fixture: dict) -> None:
    """Intercept only local test fixtures; no contact request reaches the Worker."""

    turnstile_js = """
      (() => {
        const callbacks = new Map();
        window.turnstile = {
          render(element, config) {
            const id = 'local-turnstile';
            callbacks.set(id, config);
            element.dataset.localTurnstile = 'true';
            queueMicrotask(() => config.callback?.('local-test-token'));
            return id;
          },
          reset(id) {
            callbacks.get(id)?.callback?.('local-test-token');
          },
          remove(id) {
            callbacks.delete(id);
          },
        };
      })();
    """

    def turnstile(route: Route) -> None:
        route.fulfill(status=200, content_type="application/javascript", body=turnstile_js)

    def config(route: Route) -> None:
        fixture["configRequests"] += 1
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"enabled": True, "sitekey": "local-test-sitekey"}),
        )

    def contact(route: Route, request: Request) -> None:
        try:
            body = request.post_data_json
        except Exception as error:
            raise CheckFailure(f"kontakt-fixture: ogiltig JSON: {error}") from error
        fixture["contacts"].append(body)
        if fixture.get("failFirst") and not fixture["failed"]:
            fixture["failed"] = True
            route.fulfill(
                status=503,
                content_type="application/json",
                body=json.dumps(
                    {
                        "ok": False,
                        "message": "Posten kom inte hela vägen. Dina rader finns kvar. Försök igen.",
                    }
                ),
            )
            return
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": True}))

    page.route("**/turnstile/v0/api.js*", turnstile)
    page.route("**/api/contact/config", config)
    page.route("**/api/contact", contact)


def make_page(
    browser: Browser,
    width: int,
    height: int | None = None,
    motion: str = "reduce",
    javascript: bool = True,
    contact_fixture: dict | None = None,
) -> tuple[BrowserContext, Page, list[str], list[str]]:
    context = browser.new_context(
        viewport={"width": width, "height": height or (844 if width < 600 else 1000)},
        reduced_motion=motion,
        device_scale_factor=1,
        java_script_enabled=javascript,
        accept_downloads=True,
    )
    page = context.new_page()
    errors: list[str] = []
    requests: list[str] = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{compact(message.text)}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"pageerror:{compact(error)}"))
    page.on("request", lambda request: requests.append(request.url))
    if contact_fixture is not None:
        install_contact_fixtures(page, contact_fixture)
    return context, page, errors, requests


def goto(page: Page, path: str, expected_status: int = 200, javascript: bool = True):
    response = page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=30000)
    status = response.status if response else None
    if expected_status == 200 and status != 200:
        raise CheckFailure(f"{path}: HTTP {status}, väntade 200")
    if expected_status != 200 and status != expected_status:
        raise CheckFailure(f"{path}: HTTP {status}, väntade {expected_status}")
    if javascript:
        wait_until(lambda: page.locator("html.js-ready").count() == 1, description=f"js-ready på {path}")
    return status


def save_screenshot(page: Page, name: str, selector: str | None = None, full_page: bool = False) -> str:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = str(SCREENSHOT_DIR / f"{name}.png")
    if selector:
        locator = page.locator(selector)
        wait_until(lambda: visible(locator), description=f"synlig screenshot-selektor {selector}")
        locator.screenshot(path=path, animations="disabled")
    else:
        page.evaluate("window.scrollTo({top: 0, left: 0, behavior: 'instant'})")
        page.screenshot(path=path, full_page=full_page, animations="disabled")
    return path


def wait_scroll_settled(page: Page, timeout: float = 3) -> float:
    """Require unchanged offsets; one-pixel drift is still scrolling."""
    deadline = time.monotonic() + timeout
    previous = page.evaluate("scrollY")
    stable = 0
    while time.monotonic() < deadline:
        time.sleep(0.08)
        current = page.evaluate("scrollY")
        if current == previous:
            stable += 1
            if stable >= 3:
                return current
        else:
            stable = 0
        previous = current
    raise CheckFailure(f"scrollningen stabiliserades inte (senast {previous})")


def scroll_to_footer(page: Page) -> float:
    # Position the fixture without a wheel animation competing with the click.
    page.evaluate("window.scrollTo({top: document.documentElement.scrollHeight, left: 0, behavior: 'instant'})")
    current = wait_scroll_settled(page)
    maximum = page.evaluate("Math.max(0, document.documentElement.scrollHeight - innerHeight)")
    if current <= 0 or current < maximum - 2:
        raise CheckFailure(f"sidans slut nåddes inte: scrollY={current}, maximum={maximum}")
    return maximum


def wait_at_top(page: Page, timeout: float = 5) -> float:
    wait_until(lambda: page.evaluate("scrollY") == 0, timeout=timeout, description="toppläge")
    current = wait_scroll_settled(page, timeout=timeout)
    if current != 0:
        raise CheckFailure(f"toppläget flyttades efter klicket: scrollY={current}")
    return current


def run_check(results: list[dict], name: str, fn) -> None:
    started = time.monotonic()
    try:
        details = fn() or {}
        results.append({"name": name, "status": "PASS", "details": details, "seconds": round(time.monotonic() - started, 3)})
        print(f"PASS {name}", flush=True)
    except Exception as error:
        results.append({"name": name, "status": "FAIL", "error": compact(error), "seconds": round(time.monotonic() - started, 3)})
        print(f"FAIL {name}: {compact(error)}", flush=True)
        traceback.print_exc(limit=2)


def check_public_pages(browser: Browser, results: list[dict]) -> None:
    for path in PUBLIC_PATHS:
        def page_smoke(path=path):
            context, page, errors, _requests = make_page(browser, 390)
            try:
                status = goto(page, path, expected_status=404 if path == "/404.html" else 200)
                if page.locator("h1").count() != 1:
                    raise CheckFailure(f"{path}: väntade exakt en h1")
                if page.locator("main").inner_text().strip() == "":
                    raise CheckFailure(f"{path}: main är tom")
                if page.locator("html").get_attribute("lang") != "sv":
                    raise CheckFailure(f"{path}: html lang saknas/är fel")
                metrics = assert_shell(page, f"{path}@390")
                allowed_errors = [error for error in errors if not (path == "/404.html" and "404 (Not Found)" in error)]
                assert_clean(allowed_errors, path)
                if path in {"/", "/verkstad/", "/kontakt/"}:
                    save_screenshot(page, f"page-{path.strip('/').replace('/', '-') or 'home'}-390", full_page=False)
                return {"path": path, "status": status, "metrics": metrics}
            finally:
                context.close()

        run_check(results, f"Real HTTP page smoke {path}", page_smoke)


def check_top_and_nojs(browser: Browser, results: list[dict]) -> None:
    for width in (320, 390, 768, 1440):
        for motion in ("reduce", "no-preference"):
            def top(width=width, motion=motion):
                context, page, errors, _requests = make_page(browser, width, motion=motion)
                try:
                    goto(page, "/")
                    maximum = scroll_to_footer(page)
                    page.locator("[data-back-top]").click()
                    try:
                        wait_at_top(page)
                    except CheckFailure as error:
                        current = page.evaluate("scrollY")
                        raise CheckFailure(f"{error}; scrollY={current}; maximum={maximum}; width={width}; motion={motion}") from error
                    if not focused(page, page.locator(".site-header .brand")):
                        raise CheckFailure("fokus flyttades inte till sidhuvudets varumärke")
                    assert_shell(page, f"top {width}/{motion}")
                    assert_clean(errors, f"top {width}/{motion}")
                    if width in (390, 1440) and motion == "reduce":
                        save_screenshot(page, f"top-{width}")
                    return {"width": width, "motion": motion, "scrollY": page.evaluate("scrollY"), "maximum": maximum}
                finally:
                    context.close()

            run_check(results, f"Footer back-to-top {width}px {motion}", top)

    def nojs_top():
        context, page, _errors, _requests = make_page(browser, 390, javascript=False)
        try:
            goto(page, "/", javascript=False)
            if page.locator("noscript").count() == 0:
                raise CheckFailure("no-JS fallback saknas")
            scroll_to_footer(page)
            page.locator("[data-back-top]").click()
            wait_at_top(page)
            return {"javascript": False, "scrollY": page.evaluate("scrollY")}
        finally:
            context.close()

    run_check(results, "Native back-to-top works without application JavaScript", nojs_top)


def check_identity_projects(browser: Browser, results: list[dict]) -> None:
    for width in (390, 1440):
        def identity(width=width):
            context, page, errors, requests = make_page(browser, width)
            try:
                goto(page, "/")
                if page.locator(".id-monogram").count() != 0:
                    raise CheckFailure("gammal id-monogram finns kvar")
                wait_until(lambda: visible(page.locator(".human-card .curiosity-drawing")), description="mänsklig illustration")
                if page.locator(".project-grid article").count() != 4:
                    raise CheckFailure("projektgriden innehåller inte fyra projekt")
                if page.locator('a[href="/projekt/blade-blend/"]').count() < 2:
                    raise CheckFailure("Blade & Blend saknar förväntade länkar")
                if page.locator('a[href="/projekt/backhaul/"]').count() < 2:
                    raise CheckFailure("Backhaul saknar förväntade länkar")
                if any(urlsplit(url).path == "/data/cards.json" for url in requests):
                    raise CheckFailure("hem laddade kortbanken trots att maskinen inte används")
                metrics = assert_shell(page, f"identity {width}")
                assert_clean(errors, f"identity {width}")
                save_screenshot(page, f"identity-{width}", selector=".about-teaser")
                save_screenshot(page, f"projects-{width}", selector="#byggen")
                return {"width": width, "metrics": metrics, "cardBankRequests": 0}
            finally:
                context.close()

        run_check(results, f"Identity/projects/lazy card bank {width}px", identity)


def check_machine(browser: Browser, results: list[dict]) -> None:
    for width in (390, 1440):
        def machine(width=width):
            context, page, errors, requests = make_page(browser, width, motion="no-preference")
            try:
                goto(page, "/verkstad/")
                stage = page.locator("[data-machine]")
                button = page.locator("[data-print]")
                receipt = page.locator("[data-receipt]")
                stage.scroll_into_view_if_needed()
                if page.locator("[data-face], .printer-top").count() != 0:
                    raise CheckFailure("gammal maskinfigur finns kvar")
                if page.locator(".joy-ball").evaluate("element => element.tagName") != "DIV":
                    raise CheckFailure("joy-ball är inte en div")
                if page.locator(".machine-display").get_attribute("aria-hidden") != "true":
                    raise CheckFailure("maskinens dekor-display saknar aria-hidden")
                bounds = stage.bounding_box()
                if not bounds:
                    raise CheckFailure("maskinens bounding box saknas")
                page.mouse.move(bounds["x"] + bounds["width"] * 0.8, bounds["y"] + bounds["height"] * 0.3)
                wait_until(
                    lambda: page.locator(".eye i").first.evaluate("element => element.style.transform") != "",
                    description="ögonpekning",
                )
                if not page.locator(".eye i").first.evaluate("element => element.style.transform").startswith("translate("):
                    raise CheckFailure("ögontransform är inte translate")
                page.mouse.move(0, 0)
                wait_until(
                    lambda: page.locator(".eye i").first.evaluate("element => element.style.transform") == "",
                    description="återställ ögonpekning",
                )
                face = page.locator(".joy-ball").bounding_box()
                if not face:
                    raise CheckFailure("vinstmaskinens ansikte saknar bounding box")
                page.mouse.click(face["x"] + face["width"] / 2, face["y"] + face["height"] / 2)
                if stage.get_attribute("data-mood") is not None:
                    raise CheckFailure("ansiktsklick ändrade data-mood")
                page.locator('input[name="flavor"][value="joke"]').check()
                button.click()
                wait_until(lambda: not button.is_enabled(), description="Skriv ut blir upptagen")
                if visible(receipt):
                    raise CheckFailure("kvitto visas innan printfasen är klar")
                wait_until(lambda: visible(receipt), timeout=8, description="kvitto")
                animation = receipt.evaluate(
                    "element => ({name:getComputedStyle(element).animationName, duration:getComputedStyle(element).animationDuration, origin:getComputedStyle(element).transformOrigin})"
                )
                if animation["name"] != "receipt-in" or animation["duration"] != "0.55s":
                    raise CheckFailure(f"kvittoanimation avviker: {animation}")
                save_screenshot(page, f"printer-enter-{width}")
                wait_until(lambda: button.is_enabled(), timeout=8, description="Skriv ut aktiveras")
                first = text(page.locator("[data-card-message]"))
                if not first:
                    raise CheckFailure("första vinsttexten är tom")
                rect = receipt.bounding_box()
                if not rect or rect["x"] < -1 or rect["x"] + rect["width"] > width + 1:
                    raise CheckFailure(f"kvitto utanför viewport: {rect}")
                card_requests = [url for url in requests if urlsplit(url).path == "/data/cards.json"]
                if len(card_requests) != 1:
                    raise CheckFailure(f"kortbanken laddades {len(card_requests)} gånger i färsk kontext")
                page.locator("[data-receipt-close]").click()
                if not focused(page, button):
                    raise CheckFailure("kvitto-close återförde inte fokus till printknappen")
                button.click()
                wait_until(lambda: not visible(receipt), description="andra printfasen")
                page.locator("[data-motion-toggle]").click()
                wait_until(lambda: button.is_enabled() and visible(receipt), timeout=5, description="paus avslutar print")
                second = text(page.locator("[data-card-message]"))
                if not second or second == first:
                    raise CheckFailure("andra vinstkortet skiljer sig inte")
                if stage.get_attribute("data-print-phase") is not None or stage.get_attribute("data-mood") is not None:
                    raise CheckFailure("maskinens arbets-/mood-state låg kvar efter finish")
                save_screenshot(page, f"printer-finished-{width}")
                assert_shell(page, f"machine {width}")
                assert_clean(errors, f"machine {width}")
                return {"width": width, "cardBankRequests": len(card_requests), "eyeTracking": True, "pauseFinishes": True}
            finally:
                context.close()

        run_check(results, f"Machine receipt/eye tracking/pause {width}px", machine)


def open_contact(page: Page) -> None:
    box = page.locator("[data-postbox]")
    page.locator(".envelope").click()
    wait_until(lambda: box.get_attribute("open") is not None, description="öppnat kuvert")
    wait_until(lambda: page.locator("[data-contact-send]").is_enabled(), timeout=8, description="Turnstile-fixture")


def check_contact(browser: Browser, results: list[dict]) -> None:
    for width in (390, 1440):
        def contact(width=width):
            fixture = {"configRequests": 0, "contacts": [], "failFirst": False, "failed": False}
            context, page, errors, _requests = make_page(browser, width, contact_fixture=fixture)
            try:
                goto(page, "/kontakt/")
                if fixture["configRequests"] != 0:
                    raise CheckFailure("kontaktkonfiguration hämtades innan kuvertet öppnades")
                save_screenshot(page, f"contact-closed-{width}", full_page=False)
                open_contact(page)
                save_screenshot(page, f"contact-open-{width}", full_page=False)
                if "@chalmers.se" in page.content() or "När du öppnar kuvertet laddas" in text(page.locator("main")):
                    raise CheckFailure("kontaktens test-/implementationstext läcker publikt")
                page.locator("[data-contact-send]").click()
                wait_until(lambda: focused(page, page.locator("#contact-name")), description="fokus på obligatoriskt namn")
                page.locator("#contact-name").fill("Mira Test")
                page.locator("#contact-email").fill("mira@example.org")
                page.locator("[data-contact-send]").click()
                wait_until(lambda: visible(page.locator("[data-contact-success]")), timeout=8, description="kontaktbekräftelse")
                if len(fixture["contacts"]) != 1:
                    raise CheckFailure(f"väntade en lokal kontaktpost, fick {len(fixture['contacts'])}")
                body = fixture["contacts"][0]
                if body.get("message") != "" or body.get("website") != "":
                    raise CheckFailure(f"valfria/honeypot-fält skickades fel: {body}")
                save_screenshot(page, f"contact-success-{width}", full_page=False)
                assert_shell(page, f"contact {width}")
                assert_clean(errors, f"contact {width}")
                return {"width": width, "configRequests": fixture["configRequests"], "contactRequests": len(fixture["contacts"])}
            finally:
                context.close()

        run_check(results, f"Contact required fields/local request fixture {width}px", contact)

    def retry():
        fixture = {"configRequests": 0, "contacts": [], "failFirst": True, "failed": False}
        context, page, errors, _requests = make_page(browser, 390, contact_fixture=fixture)
        try:
            goto(page, "/kontakt/")
            open_contact(page)
            page.locator("#contact-name").fill("Mira Test")
            page.locator("#contact-email").fill("mira@example.org")
            page.locator("#contact-message").fill("En fråga som ska finnas kvar.")
            page.locator("[data-contact-send]").click()
            wait_until(
                lambda: "Dina rader finns kvar" in text(page.locator("[data-contact-status]")),
                timeout=8,
                description="kontaktfel behåller text",
            )
            if page.locator("#contact-message").input_value() != "En fråga som ska finnas kvar.":
                raise CheckFailure("meddelandet försvann efter kontaktfel")
            if not fixture["contacts"]:
                raise CheckFailure("första lokala kontaktposten saknas")
            first_submission = fixture["contacts"][0].get("submission")
            wait_until(lambda: page.locator("[data-contact-send]").is_enabled(), timeout=8, description="retry-knapp")
            page.locator("[data-contact-send]").click()
            wait_until(lambda: visible(page.locator("[data-contact-success]")), timeout=8, description="retry-bekräftelse")
            if len(fixture["contacts"]) != 2 or fixture["contacts"][1].get("submission") != first_submission:
                raise CheckFailure("retry återanvände inte idempotency-ID")
            save_screenshot(page, "contact-error-retry-390", full_page=False)
            assert_clean([error for error in errors if "503 (Service Unavailable)" not in error], "contact retry")
            return {"attempts": len(fixture["contacts"]), "sameSubmission": True}
        finally:
            context.close()

    run_check(results, "Contact error retains input and retry reuses submission ID", retry)


def memory_buttons(page: Page):
    buttons = page.locator("[data-memory-card]")
    if buttons.count() == 0:
        buttons = page.locator(".memory-card")
    return buttons


def check_bubbles_and_memory(browser: Browser, results: list[dict]) -> None:
    def bubbles():
        context, page, errors, _requests = make_page(browser, 1440, motion="no-preference")
        try:
            page.add_init_script("Object.defineProperty(window, 'AudioContext', {configurable: true, value: undefined}); Object.defineProperty(window, 'webkitAudioContext', {configurable: true, value: undefined});")
            goto(page, "/verkstad/")
            buttons = page.locator("[data-bubble]")
            if buttons.count() != 12:
                raise CheckFailure(f"väntade 12 bubblor, fick {buttons.count()}")
            buttons.first.scroll_into_view_if_needed()
            buttons.nth(0).click()
            wait_until(lambda: buttons.nth(0).get_attribute("aria-pressed") == "true", description="första bubbla")
            wait_until(lambda: page.locator(".pop-drop").count() > 0, timeout=2, description="bubbelpartiklar")
            save_screenshot(page, "bubble-burst-1440")
            page.locator("[data-bubble-reset]").click()
            for index in range(12):
                buttons.nth(index).focus()
                page.keyboard.press("Space")
            wait_until(lambda: "Alla poppade" in text(page.locator("[data-bubble-status]")), description="alla bubblor")
            if page.locator("[data-bubble].is-popped").count() != 12:
                raise CheckFailure("inte alla bubblor fick is-popped efter tangentbordsrundan")
            page.locator("[data-bubble-reset]").click()
            if any(buttons.nth(index).get_attribute("aria-pressed") != "false" for index in range(12)):
                raise CheckFailure("bubbelreset återställde inte aria-pressed")
            page.locator("[data-sound-toggle]").click()
            wait_until(lambda: page.locator("[data-sound-toggle]").get_attribute("aria-pressed") == "false", description="ljudfallback")
            assert_clean(errors, "bubbles")
            return {"bubbles": buttons.count(), "keyboard": True, "audioFallback": True}
        finally:
            context.close()

    run_check(results, "Bubbles click/keyboard/reset and unavailable audio fallback", bubbles)

    def memory():
        context, page, errors, _requests = make_page(browser, 390)
        try:
            page.add_init_script(
                """
                (() => {
                  const mark = () => {
                    const first = document.querySelector('[data-memory-card]');
                    if (!first || first.dataset.qaStyle) return;
                    first.dataset.qaStyle = 'keep';
                    first.style.setProperty('--qa-memory-style', 'rgb(35, 76, 231)');
                  };
                  new MutationObserver(mark).observe(document, {childList: true, subtree: true});
                  document.addEventListener('DOMContentLoaded', mark, {once: true});
                  mark();
                })();
                """
            )
            response = page.goto(f"{BASE_URL}/verkstad/", wait_until="domcontentloaded", timeout=30000)
            if not response or response.status != 200:
                raise CheckFailure(f"memory: HTTP {response.status if response else None}")
            html = response.text()
            ssr_count = html.count("data-memory-card")
            if ssr_count != 12:
                raise CheckFailure(f"SSR-memory innehåller {ssr_count} kort, väntade 12")
            wait_until(
                lambda: page.locator("[data-memory-card][data-qa-style='keep']").count() == 1,
                description="CMS-stil på SSR-memorykort",
            )
            styled = page.locator("[data-memory-card][data-qa-style='keep']")
            style_before = styled.get_attribute("style") or ""
            qa_before = styled.get_attribute("data-qa-style")
            wait_until(lambda: page.locator("html.js-ready").count() == 1, description="memory js-ready")
            buttons = memory_buttons(page)
            if buttons.count() != 12:
                raise CheckFailure(f"hydraterad memory innehåller {buttons.count()} kort")
            if any(buttons.nth(index).is_disabled() for index in range(12)):
                raise CheckFailure("memorykort är fortfarande disabled efter hydrering")

            first = buttons.nth(0)
            classes = buttons.evaluate_all(
                "elements => elements.map(element => [...element.querySelector('.memory-front').classList].find(name => /^memory-color-\\d+$/.test(name)))"
            )
            other = next((index for index, value in enumerate(classes) if value != classes[0]), None)
            if other is None:
                raise CheckFailure("memory har inga två olika parvärden")
            first.click()
            buttons.nth(other).click()
            wait_until(lambda: text(page.locator("[data-memory-status]")).startswith("Inte ett par"), description="memory mismatch")
            page.locator("[data-memory-reset]").click()
            wait_until(lambda: page.locator(".memory-card.is-open").count() == 0, timeout=3, description="memory reset")
            if first.get_attribute("style") != style_before or first.get_attribute("data-qa-style") != qa_before:
                raise CheckFailure("hydrering/reset skrev över CMS-stil på memorykort")

            classes = buttons.evaluate_all(
                "elements => elements.map(element => [...element.querySelector('.memory-front').classList].find(name => /^memory-color-\\d+$/.test(name)))"
            )
            for value in dict.fromkeys(classes):
                pair = [index for index, item in enumerate(classes) if item == value]
                if len(pair) != 2:
                    raise CheckFailure(f"minnesvärde {value} har inte exakt två kort")
                for index in pair:
                    buttons.nth(index).focus()
                    page.keyboard.press("Enter")
            wait_until(
                lambda: page.locator(".memory-card.is-matched").count() == 12,
                timeout=8,
                description="alla memorypar",
            )
            status = text(page.locator("[data-memory-status]"))
            if "Alla hittade hem på" not in status or "6 försök" not in status:
                raise CheckFailure(f"oväntad memorystatus: {status}")
            if first.get_attribute("style") != style_before:
                raise CheckFailure("memoryspel skrev över redigerad inline-stil")
            save_screenshot(page, "memory-complete-390", selector=".memory-section")
            assert_shell(page, "memory")
            assert_clean(errors, "memory")
            return {"ssrCards": ssr_count, "hydratedCards": buttons.count(), "pairs": 6, "stylePreserved": True}
        finally:
            context.close()

    run_check(results, "SSR 12 memory cards hydrate, reset, pair and preserve style", memory)


def check_fika(browser: Browser, results: list[dict]) -> None:
    def fika():
        context, page, errors, _requests = make_page(browser, 1440)
        try:
            goto(page, "/verkstad/")
            button = page.locator("[data-fika-button]")
            button.focus()
            page.keyboard.press("Enter")
            wait_until(lambda: "Starta" not in text(button), description="fika start")
            started = time.monotonic()
            time.sleep(5.0)
            page.keyboard.press("Enter")
            wait_until(lambda: "?" not in text(page.locator("[data-fika-result]")), timeout=3, description="fikaresultat")
            value = float(text(page.locator("[data-fika-result]")).replace(",", ".").replace(" s", ""))
            elapsed = time.monotonic() - started
            if not 4.7 <= value <= 5.8:
                raise CheckFailure(f"fikaresultat {value} s ligger utanför väntat intervall")
            if "äggklocka" not in text(page.locator("[data-fika-status]")):
                raise CheckFailure("fikaresultatet saknar äggklockekommentar")
            save_screenshot(page, "fika-result-1440", selector=".fika-section")
            button.click()
            page.evaluate(
                """() => {
                  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
                  document.dispatchEvent(new Event('visibilitychange'));
                }"""
            )
            if "fliken" not in text(page.locator("[data-fika-status]")):
                raise CheckFailure("fika avbröts inte när dokumentet blev dolt")
            assert_clean(errors, "fika")
            return {"measuredSeconds": value, "wallSeconds": round(elapsed, 2), "backgroundAbort": True}
        finally:
            context.close()

    run_check(results, "Fika measures elapsed time and aborts on hidden document", fika)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not is_loopback(BASE_URL):
        print(f"FAIL config: BASE_URL måste vara loopback: {BASE_URL}", flush=True)
        return 2
    results: list[dict] = []
    headless = os.environ.get("HEADLESS", "1").lower() not in {"0", "false", "no"}
    with sync_playwright() as playwright:
        browser = launch(playwright.chromium, headless=headless)
        print(f"NOTE BASE_URL={BASE_URL}", flush=True)
        print(f"NOTE browser={playwright.chromium.executable_path}", flush=True)
        print(f"NOTE browser-version={browser.version}", flush=True)
        try:
            check_public_pages(browser, results)
            check_top_and_nojs(browser, results)
            check_identity_projects(browser, results)
            check_machine(browser, results)
            check_contact(browser, results)
            check_bubbles_and_memory(browser, results)
            check_fika(browser, results)
        finally:
            browser.close()

    passed = sum(item["status"] == "PASS" for item in results)
    failed = len(results) - passed
    report = {
        "mode": "real HTTP + production browser modules + local contact fixtures",
        "baseUrl": BASE_URL,
        "browser": os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or "Playwright bundled Chromium",
        "passed": passed,
        "failed": failed,
        "checks": results,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"SUMMARY pass={passed} fail={failed}", flush=True)
    print(f"ARTIFACT report={REPORT_PATH}", flush=True)
    print(f"ARTIFACT screenshots={SCREENSHOT_DIR}", flush=True)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
