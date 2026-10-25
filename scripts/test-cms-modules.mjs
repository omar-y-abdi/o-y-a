import './prepare-cms-modules.mjs';
import { spawn } from 'node:child_process';
import { testPython } from './test-python.mjs';

const python = await testPython();
const child = spawn(python, ['tests/cms-modules.py'], { stdio: 'inherit', env: process.env });
process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
