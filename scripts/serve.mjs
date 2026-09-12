import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import worker from '../src/worker.mjs';

const root = fileURLToPath(new URL('../dist/',import.meta.url));
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const origin = `http://127.0.0.1:${port}`;
const analyticsTest = process.argv.includes('--analytics-test');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.gif':'image/gif','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.ico':'image/x-icon'};
const points = [];
const env = {
  PREVIEW_ORIGIN:origin,
  ...(analyticsTest ? {ANALYTICS_ENABLED:'true',ANALYTICS:{ writeDataPoint(point) { points.push(point);if(points.length>1000)points.shift(); } }} : {}),
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      let path;
      try { path = decodeURIComponent(url.pathname); } catch { return new Response('Bad path',{status:400}); }
      if (path.includes('\0') || path.includes('\\') || path.split('/').some(p=>p.startsWith('.')) || path.startsWith('/_')) return new Response('Not found',{status:404});
      const file = resolve(root,'.'+path);
      if (relative(root,file).startsWith('..')) return new Response('Not found',{status:404});
      let target = file;
      try {
        const info = await stat(file);
        if (info.isDirectory()) {
          if (!path.endsWith('/')) return new Response(null,{status:308,headers:{Location:url.pathname+'/'+url.search}});
          target = resolve(file,'index.html');
        }
        if (path.endsWith('/index.html')) return new Response(null,{status:308,headers:{Location:url.pathname.slice(0,-10)+url.search}});
        const body = await readFile(target);
        return new Response(body,{headers:{'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'}});
      } catch {
        return new Response(await readFile(resolve(root,'404.html')),{status:404,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
      }
    },
  },
};
const server = createServer(async (incoming,outgoing) => {
  try {
    const url = origin + incoming.url;
    const method = incoming.method || 'GET';
    const body = ['GET','HEAD'].includes(method) ? undefined : incoming;
    const request = new Request(url,{method,headers:incoming.headers,body,...(body?{duplex:'half'}:{})});
    const response = await worker.fetch(request,env);
    let buffer = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers.entries());
    if (buffer.length > 800 && /\bgzip\b/.test(incoming.headers['accept-encoding'] || '') && !/image\/png/.test(headers['content-type'] || '')) {
      buffer = gzipSync(buffer);headers['content-encoding']='gzip';headers.vary='Accept-Encoding';
    }
    if (method !== 'HEAD' && ![204,304].includes(response.status)) headers['content-length']=String(buffer.length);
    outgoing.writeHead(response.status,headers);outgoing.end(method==='HEAD'?undefined:buffer);
  } catch {
    outgoing.writeHead(500,{'Content-Type':'text/plain'});outgoing.end('Preview server error');
  }
});
server.listen(port,'127.0.0.1',() => console.log(`Local preview ${origin} | analytics ${analyticsTest?'IN-MEMORY TEST ONLY':'disabled'} | same Worker handler, not a Cloudflare runtime emulator`));
