"""Create a portable ZIP from an explicit, non-secret allowlist."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Package the built SKIFT game and its source.')
parser.add_argument('--output', type=Path)
args = parser.parse_args()
version = json.loads((ROOT / 'package.json').read_text())['version']
output = args.output or ROOT / f'SKIFT-{version}.zip'

roots = ['src', 'tests', 'docs', 'public', 'dist']
files = [ROOT / name for name in ['README.md', 'CREDITS.md', 'index.html', 'package.json',
         'package-lock.json', 'start.py', 'START.command', 'START.bat',
         'scripts/audio.py', 'scripts/build.mjs', 'scripts/verify.mjs', 'scripts/release.py']]
for name in roots:
    files.extend(p for p in (ROOT / name).rglob('*') if p.is_file() and not p.is_symlink()
                 and not any(part.startswith('.') or part == '__pycache__' for part in p.relative_to(ROOT).parts))
reports = ['browser-tests.json', 'mouse-input.json', 'lifecycle.json', 'compatibility.json',
           'campaign-normal.json', 'campaign-assist.json', 'performance.json', 'unit-tests.txt',
           'title-desktop.png', 'play-desktop.png', 'pause-desktop.png', 'title-mobile.png',
           'play-mobile.png', 'play-mobile-landscape.png', 'play-mobile-compact.png',
           'sector-2-play.png', 'sector-3-play.png', 'campaign-win-normal.png']
files.extend(ROOT / 'evidence' / name for name in reports if (ROOT / 'evidence' / name).is_file())
required = files + [ROOT / 'dist/play/skift/assets/app.js', ROOT / 'dist/play/skift/assets/app.css',
                   ROOT / 'dist/play/skift/audio/shift.mp3', ROOT / 'dist/play/skift/THIRD-PARTY-LICENSES.txt']
missing = [str(p.relative_to(ROOT)) for p in required if not p.is_file()]
if missing:
    raise SystemExit('Release files missing. Run npm run build first: ' + ', '.join(missing))
output.parent.mkdir(parents=True, exist_ok=True)
manifest = []
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(set(files)):
        name = path.relative_to(ROOT).as_posix()
        content = path.read_bytes()
        entry = zipfile.ZipInfo('skift/' + name, (2026, 9, 24, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.create_system = 3
        entry.external_attr = (0o100755 if name in ['START.command', 'start.py'] else 0o100644) << 16
        archive.writestr(entry, content)
        manifest.append(hashlib.sha256(content).hexdigest() + '  ' + name)
    entry = zipfile.ZipInfo('skift/MANIFEST.sha256', (2026, 9, 24, 0, 0, 0))
    entry.compress_type = zipfile.ZIP_DEFLATED
    entry.create_system = 3
    entry.external_attr = 0o100644 << 16
    archive.writestr(entry, '\n'.join(manifest) + '\n')
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix + '.sha256').write_text(digest + '  ' + output.name + '\n')
print(f'{output}\n{len(manifest)} files; {output.stat().st_size:,} bytes\nSHA-256 {digest}')
