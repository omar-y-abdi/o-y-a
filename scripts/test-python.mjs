import { access } from 'node:fs/promises';

export async function testPython() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const python = '.test-venv/bin/python';
  try {
    await access(python);
    return python;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return 'python3';
}
