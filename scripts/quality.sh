#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run check
python -m unittest discover -s tests -p test_revision_scroll.py
mkdir -p artifacts
public_port=${PUBLIC_TEST_PORT:-4173}
analytics_port=${ANALYTICS_TEST_PORT:-4174}
python - "$public_port" "$analytics_port" <<'PYPORT'
import socket, sys
for port in map(int, sys.argv[1:]):
    with socket.socket() as probe:
        try: probe.bind(('127.0.0.1', port))
        except OSError: raise SystemExit(f'Test port {port} is occupied; choose PUBLIC_TEST_PORT and ANALYTICS_TEST_PORT.')
PYPORT
node scripts/serve.mjs --port "$public_port" >artifacts/preview.log 2>&1 & preview=$!
node scripts/serve.mjs --port "$analytics_port" --analytics-test >artifacts/preview-analytics.log 2>&1 & analytics=$!
trap 'kill "$preview" "$analytics" 2>/dev/null || true' EXIT
python - "$public_port" "$analytics_port" <<'PY'
import time, urllib.request, sys
for port in map(int, sys.argv[1:]):
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
python tests/http_checks.py --base-url "http://127.0.0.1:$public_port" --analytics-url "http://127.0.0.1:$analytics_port"
python tests/browser.py --base-url "http://127.0.0.1:$public_port" --analytics-url "http://127.0.0.1:$analytics_port" --screenshots
BASE_URL="http://127.0.0.1:$public_port" python tests/revision_browser.py
BASE_URL="http://127.0.0.1:$public_port" python tests/card_export.py
