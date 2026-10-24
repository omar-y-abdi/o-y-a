import { mkdir, writeFile } from 'node:fs/promises';
import { cmsRuntime, publicRuntime } from '../tests/helpers/cms-runtime.mjs';
import { initial } from '../.generated/cms-seed.mjs';

// Documented development port; automated fixtures use PORT=0 or runtime.url.
const port = Number(process.env.PORT ?? 8790);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
const publicTests = process.argv.includes('--public-tests');
const runtime = await (publicTests ? publicRuntime({ port }) : cmsRuntime({ port, project: initial }));
try {
  if (!publicTests) {
    await mkdir('output/cms-local', { recursive: true });
    await writeFile('output/cms-local/browser-auth.json', JSON.stringify({ cookies: [{ name: 'CF_Authorization', value: await runtime.token(), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }), { mode: 0o600 });
  }
  console.log(`Local Worker: ${runtime.url}/. ${publicTests ? 'Published v185 fixture.' : 'Browser auth: output/cms-local/browser-auth.json. Not a production identity.'}`);
} catch (error) {
  await runtime.close();
  throw error;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await runtime.close(); process.exit(0); });
