#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run check
mkdir -p artifacts
node scripts/serve.mjs >artifacts/preview.log 2>&1 & preview=$!
node scripts/serve.mjs --port 4174 --analytics-test >artifacts/preview-analytics.log 2>&1 & analytics=$!
trap 'kill "$preview" "$analytics" 2>/dev/null || true' EXIT
python - <<'PY'
import time, urllib.request
for port in (4173,4174):
    for attempt in range(40):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/config', timeout=1) as response:
                assert response.status == 200
            break
        except OSError:
            time.sleep(.1)
    else:
        raise SystemExit(f'Preview server did not start on {port}')
PY
python tests/http.py
python tests/browser.py --screenshots
