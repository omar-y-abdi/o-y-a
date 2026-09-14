#!/usr/bin/env python3
"""Real HTTP/browser export checks for every original small-win card.

The browser loads the public page and production modules over HTTP. The test
uses the real Save button and download event, then checks the resulting PNG and
the rendered text bounds inside the shadow-DOM win design.
"""

from __future__ import annotations

import json
import os
import re
import struct
import sys
import time
from pathlib import Path
from urllib.parse import quote, urlsplit

from playwright.sync_api import Browser, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:5273").rstrip("/")
OUTPUT = Path(os.environ.get("CARD_EXPORT_OUTPUT", str(ROOT / "output" / "card-export")))
PNG_DIR = OUTPUT / "png"
SCREENSHOT_DIR = OUTPUT / "screenshots"
REPORT_PATH = OUTPUT / "card-export-report.json"
BANK = json.loads((ROOT / "public" / "data" / "cards.json").read_text(encoding="utf-8"))
KEEP_SCREENSHOTS = {"k01", "j01", "p01", "r01"} | {
    card["id"] for card in sorted(BANK, key=lambda card: len(card["text"]), reverse=True)[:4]
}


class CardFailure(RuntimeError):
    pass


def compact(value: str, limit: int = 700) -> str:
    return re.sub(r"\s+", " ", value).strip()[:limit]


def loopback(url: str) -> bool:
    parsed = urlsplit(url)
    return parsed.scheme in {"http", "https"} and (parsed.hostname or "").lower() in {"127.0.0.1", "localhost", "::1"}


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise CardFailure(f"{path.name}: exporten är inte en PNG med IHDR")
    width, height = struct.unpack(">II", data[16:24])
    if width <= 0 or height <= 0:
        raise CardFailure(f"{path.name}: ogiltiga PNG-dimensioner {width}x{height}")
    return width, height


def wait_for_rendered_card(page: Page, expected_text: str, timeout: float = 20) -> dict:
    deadline = time.monotonic() + timeout
    host = page.locator("[data-win-artwork]")
    while time.monotonic() < deadline:
        if host.count():
            state = host.evaluate(
                """host => {
                  const root = host.shadowRoot;
                  const text = root?.querySelector('[data-card-text]');
                  // The first shadow child is the fitting viewport, not the card.
                  // Its scroll area retains unscaled dimensions after scale().
                  const content = text?.closest('.win-design');
                  if (!text || !content) return null;
                  const h = host.getBoundingClientRect();
                  const t = text.getBoundingClientRect();
                  const c = content.getBoundingClientRect();
                  const range = document.createRange();
                  range.selectNodeContents(text);
                  const size = el => ({clientWidth:el.clientWidth, clientHeight:el.clientHeight, scrollWidth:el.scrollWidth, scrollHeight:el.scrollHeight});
                  const overflows = el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
                  return {
                    text: text.textContent,
                    host: { left:h.left, top:h.top, right:h.right, bottom:h.bottom, width:h.width, height:h.height },
                    textBox: { left:t.left, top:t.top, right:t.right, bottom:t.bottom, width:t.width, height:t.height },
                    contentBox: { left:c.left, top:c.top, right:c.right, bottom:c.bottom, width:c.width, height:c.height },
                    lineCount: range.getClientRects().length,
                    contentSize: size(content),
                    textSize: size(text),
                    overflow: overflows(content) || overflows(text),
                  };
                }"""
            )
            if state and state["text"] == expected_text and state["host"]["width"] > 0 and state["host"]["height"] > 0:
                return state
        time.sleep(0.1)
    raise CardFailure(f"cardens shadow-DOM-rendering blev inte klar för {expected_text[:70]!r}")


def assert_layout(card_id: str, expected_text: str, state: dict) -> None:
    host = state["host"]
    text = state["textBox"]
    content = state["contentBox"]
    if state["text"] != expected_text:
        raise CardFailure(f"{card_id}: fel text i exportdesignen")
    if state["overflow"]:
        raise CardFailure(f"{card_id}: text/content overflow i win-design (design={state['contentSize']}, text={state['textSize']})")
    if text["left"] < host["left"] - 1 or text["top"] < host["top"] - 1 or text["right"] > host["right"] + 1 or text["bottom"] > host["bottom"] + 1:
        raise CardFailure(f"{card_id}: text bounds utanför exportkortet {text} / {host}")
    if content["left"] < host["left"] - 1 or content["top"] < host["top"] - 1 or content["right"] > host["right"] + 1 or content["bottom"] > host["bottom"] + 1:
        raise CardFailure(f"{card_id}: design bounds utanför exportkortet {content} / {host}")
    if state["lineCount"] < 1:
        raise CardFailure(f"{card_id}: texten saknar layoutlinjer")


def launch(browser_type, headless: bool = True):
    options = {"headless": headless, "args": ["--no-sandbox"]}
    executable = os.environ.get("CHROMIUM_PATH")
    if executable:
        options["executable_path"] = executable
    return browser_type.launch(**options)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    if not loopback(BASE_URL):
        print(f"FAIL config: BASE_URL måste vara loopback: {BASE_URL}", flush=True)
        return 2
    if len(BANK) != 240:
        print(f"FAIL config: public/data/cards.json innehåller {len(BANK)} kort; förväntade 240 originalkort", flush=True)
        return 2

    results = []
    with sync_playwright() as playwright:
        browser = launch(playwright.chromium, os.environ.get("HEADLESS", "1").lower() not in {"0", "false", "no"})
        print(f"NOTE BASE_URL={BASE_URL}", flush=True)
        print(f"NOTE browser={playwright.chromium.executable_path}", flush=True)
        print(f"NOTE browser-version={browser.version}", flush=True)
        context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce", accept_downloads=True)
        page = context.new_page()
        browser_errors: list[str] = []
        network: list[tuple[str, int]] = []
        page.on("console", lambda message: browser_errors.append(f"console:{message.type}:{compact(message.text)}") if message.type == "error" else None)
        page.on("pageerror", lambda error: browser_errors.append(f"pageerror:{compact(str(error))}"))
        page.on("response", lambda response: network.append((response.url, response.status)) if "/data/cards.json" in response.url else None)
        try:
            for card in BANK:
                card_id = card["id"]
                browser_errors.clear()
                network.clear()
                started = time.monotonic()
                try:
                    response = page.goto(f"{BASE_URL}/verkstad/?kort={quote(card_id)}", wait_until="domcontentloaded", timeout=30000)
                    if response is None or response.status != 200:
                        raise CardFailure(f"HTTP {response.status if response else 'ingen response'} på kortsidan")
                    state = wait_for_rendered_card(page, card["text"])
                    assert_layout(card_id, card["text"], state)
                    save = page.locator("[data-save]")
                    if not save.is_enabled():
                        raise CardFailure(f"{card_id}: Spara som bild är inte aktiverad")
                    with page.expect_download(timeout=30000) as download_info:
                        save.click()
                    download = download_info.value
                    target = PNG_DIR / f"{card_id}.png"
                    download.save_as(str(target))
                    width, height = png_dimensions(target)
                    if width < 100 or height < 100:
                        raise CardFailure(f"{card_id}: PNG är orimligt liten ({width}x{height})")
                    if card_id in KEEP_SCREENSHOTS:
                        page.screenshot(path=str(SCREENSHOT_DIR / f"{card_id}.png"), full_page=True, animations="disabled")
                    if browser_errors:
                        raise CardFailure("; ".join(browser_errors[:5]))
                    results.append({"id": card_id, "status": "PASS", "png": str(target), "dimensions": [width, height], "lineCount": state["lineCount"], "cardsRequest": network[-1] if network else None, "seconds": round(time.monotonic() - started, 3)})
                    print(f"PASS {card_id}", flush=True)
                except Exception as error:
                    results.append({"id": card_id, "status": "FAIL", "error": compact(str(error)), "seconds": round(time.monotonic() - started, 3)})
                    print(f"FAIL {card_id}: {compact(str(error))}", flush=True)
        finally:
            context.close()
            browser.close()

    passed = sum(item["status"] == "PASS" for item in results)
    failed = len(results) - passed
    report = {"mode": "real HTTP + production browser modules + real download", "baseUrl": BASE_URL, "cards": len(BANK), "passed": passed, "failed": failed, "results": results}
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"SUMMARY cards={len(BANK)} pass={passed} fail={failed}", flush=True)
    print(f"ARTIFACT report={REPORT_PATH}", flush=True)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
