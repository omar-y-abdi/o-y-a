"""Validate the actual distributable, not an artificial archive fixture."""
import hashlib
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]

class ReleaseTest(unittest.TestCase):
    def test_portable_complete_archive(self):
        script = ROOT / 'scripts' / 'release.py'
        self.assertTrue(script.is_file(), 'The documented release command must exist')
        with tempfile.TemporaryDirectory(prefix='.release-check-', dir=ROOT) as folder:
            output = Path(folder) / 'SKIFT.zip'
            subprocess.run([sys.executable, str(script), '--output', str(output)], cwd=ROOT, check=True)
            with zipfile.ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                names = set(archive.namelist())
                for name in ['README.md', 'START.command', 'START.bat', 'start.py',
                             'package.json', 'package-lock.json', 'src/game.js',
                             'docs/VERIFICATION.md', 'docs/INTEGRATION.md',
                             'tests/browser.mjs', 'scripts/release.py',
                             'scripts/build-options.mjs', 'scripts/notices.mjs', 'THIRD-PARTY-LICENSES.txt',
                             'dist/play/skift/index.html', 'dist/play/skift/assets/app.js',
                             'dist/play/skift/assets/app.css', 'dist/play/skift/audio/shift.mp3',
                             'dist/play/skift/THIRD-PARTY-LICENSES.txt', 'MANIFEST.sha256']:
                    self.assertIn('skift/' + name, names)
                for name in names:
                    parts = Path(name).parts
                    self.assertEqual(parts[0], 'skift')
                    self.assertNotIn('..', parts)
                    self.assertFalse(any(p.startswith('.') or p == 'node_modules' for p in parts), name)
                    self.assertFalse(name.endswith(('polish.py', 'final-polish.py')), name)
                manifest = archive.read('skift/MANIFEST.sha256').decode().splitlines()
                self.assertEqual(len(manifest), len(names) - 1)
                for line in manifest:
                    digest, name = line.split('  ', 1)
                    self.assertEqual(hashlib.sha256(archive.read('skift/' + name)).hexdigest(), digest)
                self.assertTrue(archive.getinfo('skift/START.command').external_attr >> 16 & 0o111)
                html = archive.read('skift/dist/play/skift/index.html').decode()
                self.assertIn('./assets/app.js', html)
                self.assertIn('./assets/app.css', html)
                self.assertEqual(archive.read('skift/THIRD-PARTY-LICENSES.txt'),
                                 archive.read('skift/dist/play/skift/THIRD-PARTY-LICENSES.txt'))
            digest = output.with_suffix('.zip.sha256').read_text().split()[0]
            self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), digest)

    def test_extracted_source_rebuilds_without_repository_dependencies(self):
        # Outside this checkout: ancestor node_modules must not hide missing
        # source files or undeclared dependencies in the distributable.
        with tempfile.TemporaryDirectory(prefix='skift-rebuild-') as folder:
            output = Path(folder) / 'SKIFT.zip'
            subprocess.run([sys.executable, str(ROOT / 'scripts/release.py'), '--output', str(output)], check=True)
            with zipfile.ZipFile(output) as archive:
                archive.extractall(Path(folder) / 'unpacked')
            unpacked = Path(folder) / 'unpacked/skift'
            shutil.rmtree(unpacked / 'dist')
            npm = shutil.which('npm.cmd' if sys.platform == 'win32' else 'npm')
            self.assertIsNotNone(npm, 'Node/npm are required to rebuild the source release')
            subprocess.run([npm, 'ci', '--no-audit', '--no-fund'], cwd=unpacked, check=True, timeout=180)
            subprocess.run([npm, 'run', 'build'], cwd=unpacked, check=True, timeout=120)
            built = unpacked / 'dist/play/skift'
            for name in ['index.html', 'assets/app.js', 'assets/app.css', 'assets/app.js.LEGAL.txt', 'audio/shift.mp3']:
                self.assertGreater((built / name).stat().st_size, 0, name)
            self.assertEqual((built / 'THIRD-PARTY-LICENSES.txt').read_bytes(),
                             (unpacked / 'THIRD-PARTY-LICENSES.txt').read_bytes())

if __name__ == '__main__':
    unittest.main(verbosity=2)
