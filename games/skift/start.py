#!/usr/bin/env python3
"""Serve the packaged game on loopback using Python's standard HTTP server."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import argparse, subprocess, shutil, sys, webbrowser
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='Start SKIFT locally, without publishing it.')
parser.add_argument('--no-open',action='store_true');parser.add_argument('--port',type=int,default=8787)
a=parser.parse_args()
if not (ROOT/'dist/play/skift/assets/app.js').exists():
    npm=shutil.which('npm')
    if not npm:sys.exit('Install Node.js 20+ to build this source package. The prebuilt game needs only Python 3.')
    print('Preparing the game. Dependencies are installed only in this directory.',flush=True)
    subprocess.run([npm,'ci' if (ROOT/'package-lock.json').exists() else 'install','--no-fund','--no-audit'],cwd=ROOT,check=True)
    subprocess.run([npm,'run','build'],cwd=ROOT,check=True)
handler=partial(SimpleHTTPRequestHandler,directory=str(ROOT/'dist'))
try:server=ThreadingHTTPServer(('127.0.0.1',a.port),handler)
except OSError:server=ThreadingHTTPServer(('127.0.0.1',0),handler)
url=f'http://127.0.0.1:{server.server_port}/play/skift/'
print(f'\nSKIFT: {url}\nCtrl+C stops the local server. No files are published.\n',flush=True)
if not a.no_open:webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
