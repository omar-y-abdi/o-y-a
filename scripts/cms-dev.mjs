import { mkdir, writeFile } from 'node:fs/promises';
import { cmsRuntime } from '../tests/helpers/cms-runtime.mjs';
const runtime = await cmsRuntime({ port: 8790 });
await mkdir('output/cms-local', { recursive: true });
await writeFile('output/cms-local/browser-auth.json', JSON.stringify({ cookies: [{ name: 'CF_Authorization', value: await runtime.token(), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }), { mode: 0o600 });
console.log(`Local CMS: ${runtime.url}/login/. Browser auth fixture: output/cms-local/browser-auth.json. Not a production identity.`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => runtime.close().then(() => process.exit(0)));
