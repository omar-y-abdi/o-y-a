# Card-export layout regression

Applies on top of `o-y-a-pr2-unified-20260914.zip`. This is a focused follow-up,
not a replacement for the full unified package.

## Cause

`tests/card_export.py` assumed that `host.shadowRoot.firstElementChild` was the
original `.win-design` article. Since the fitting/export refactor, that child
is `cms-win-viewport`, surrounding a scaled frame and the actual card.

A valid 600 x 400 card in a 316 px host had a viewport client height of 211 px
and scroll height of 400 px. Its actual article had client and scroll sizes
of 600 x 400, with its displayed text and bounds inside the host. The old test
mistook the fitting wrapper's unscaled scroll area for clipped card content.
The 240 failures in the supplied HTTP report had this same error message.

CSS transforms do not shrink the scrollable overflow area:
https://www.w3.org/TR/css-transforms-1/#transform-rendering

## Changes

- `tests/card_export.py` locates the original card using the text slot's
  `.win-design` ancestor. It checks both the article's and text slot's
  intrinsic overflow, retains the existing displayed-bounds/text checks, and
  reports concrete client/scroll dimensions on failure.
- `tests/cms-modules.py` reuses that exact measurement and assertion for all
  240 original cards at 316 px before generating and decoding every PNG. The
  existing visible-text assertion is retained. Additional cases accept valid
  cards at 240, 316 and 600 px, and reject clipped article height, clipped text
  height, horizontally overflowing text and a frame shifted outside its host.
- This document records the cause, scope and verification boundary.

No production rendering, card designs, CMS validation, dependencies, database
migrations or package commands were changed. No check was disabled and the
one-pixel layout tolerance was not increased.

## Verification

The two new layout scenarios failed before the measurement fix. After it,
149 Node/Worker tests and all 14 isolated Chromium module scenarios passed,
including layout checks plus decoded PNG generation for 240/240 cards.
The four deliberately broken layouts were correctly rejected.

These module scenarios use the real rendering/export modules and the same
Python layout assertion as the HTTP export suite. They do not replace the
HTTP navigation, actual Save-button interaction and download-event tests.
This environment rejects ordinary loopback browser navigation with
`ERR_BLOCKED_BY_ADMINISTRATOR`, so full navigating E2E and Firefox/WebKit
are not claimed as run here. The user's previous run separately showed
149/149 Node, 19/19 HTTP, 89/89 public browser and 31/31 revision checks passing
before the old export guard stopped `quality`.

## Apply and run locally

From the existing repository root, with the unified package already installed:

```sh
unzip -o ~/Downloads/o-y-a-card-export-layout-fix-20260914.zip -d . &&
source .test-venv/bin/activate &&
npm run quality &&
npm run test:cms &&
npm run test:cms:compat &&
npm run edge:check
```

No reinstall, clean clone, manual deletion or new migration is needed.
`quality` rebuilds the site and runs the real HTTP/card-download suite. Its
card report should read `cards=240 pass=240 fail=0`; the remaining commands
must also succeed before merge. Reports remain under `output/card-export/`
and `output/cms-modules/`.

For a quick check of just the new guard (not a substitute for the full chain):

```sh
npm run build && CMS_MODULE_CASE=export-layout npm run test:cms:modules
```

The old 59-file unified-installation checksum script will now report the
intentionally updated `tests/cms-modules.py` as different. Do not overwrite
this follow-up by reapplying the older unified archive afterward.
