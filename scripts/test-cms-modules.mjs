import './prepare-cms-modules.mjs';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch {}
const child = spawn(python, ['tests/cms-modules.py'], { stdio: 'inherit', env: process.env });
process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
