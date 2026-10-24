#!/usr/bin/env python3
"""Rendered-card readiness and layout assertions shared by the CMS module suite."""

from __future__ import annotations

import time
from playwright.sync_api import Page


class CardFailure(RuntimeError):
    pass


def render_state_ready(state: dict | None, expected_text: str) -> bool:
    return bool(state and state.get('shadowReady') and state.get('text') == expected_text)


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
                    shadowReady: Boolean(text && content),
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
            if render_state_ready(state, expected_text):
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
