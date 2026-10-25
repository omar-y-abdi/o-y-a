import { realpathSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const versions = ['1', '2', '3', '4', '84', '85', '86', '87', '88'];

// This validates the manual job's inventory shape, never its truth. The release
// gate independently compares every message and always rejects an invalid head.
export function historicalErrors(source) {
  const errors = JSON.parse(source);
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)
    || Object.keys(errors).length !== versions.length
    || versions.some(version => !Object.hasOwn(errors, version) || typeof errors[version] !== 'string' || !errors[version].trim())) {
    throw new Error('Expected a JSON object with exactly versions 1-4 and 84-88, each containing its reviewed exact nonempty error.');
  }
  return errors;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.HISTORICAL_ERRORS_JSON || !process.env.HISTORICAL_ERRORS_FILE) throw new Error('Historical errors input and private output file are required.');
  await writeFile(process.env.HISTORICAL_ERRORS_FILE, JSON.stringify(historicalErrors(process.env.HISTORICAL_ERRORS_JSON)) + '\n', { mode: 0o600 });
}
