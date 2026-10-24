#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${SKIP_CHECK:-0}" != "1" ]]; then
  npm run check
else
  node --test tests/http-checks.test.mjs
fi
python -m unittest discover -s tests -p test_revision_scroll.py
node scripts/run-quality-browser.mjs
