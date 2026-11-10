/** Offline α usability preview. LOCALHOST ONLY. NOT Discord-authenticated. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { createNode, editNode, publishNode, setVisibility, newLibrary,
  publicSeries, publicTree, toReader, managedList } from '../../../packages/contracts/dist/index.js';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(appRoot, '../..');
const staticDir = path.join(appRoot, 'public');
const dataDir = process.env.PREVIEW_DATA_DIR ? path.resolve(process.env.PREVIEW_DATA_DIR) : path.join(root, '.local');
const dataFile = path.join(dataDir, 'preview-data.json');
const PORT = Number(process.env.PREVIEW_PORT ?? 4173);
const key = randomBytes(24).toString('hex');
const MAX_INPUT = 130_000;
if (!Number.isSafeInteger(PORT) || PORT < 1 || PORT > 65535) throw Error('Invalid PREVIEW_PORT');
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
let library = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : newLibrary();
if (!library || !Array.isArray(library.nodes)) throw Error('Invalid local preview data; back up .local and repair file');
function persist(next) {
  const temp = `${dataFile}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
  fs.renameSync(temp, dataFile);
  library = next;
}
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml' };
function send(res, status, content, contentType='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type':contentType, 'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'", 'Referrer-Policy':'no-referrer' });
  res.end(contentType.startsWith('application/json') ? JSON.stringify(content) : content);
}
async function readJson(req) {
  let size = 0, text = '';
  for await (const part of req) {
    size += part.byteLength;
    if (size > MAX_INPUT) { const err = new Error('Payload too large'); err.status=413; throw err; }
    text += part.toString('utf8');
  }
  try { return JSON.parse(text); } catch { const err=new Error('Invalid JSON'); err.status=400; throw err; }
}
function safeMethod(req) { return req.method === 'GET' || req.method === 'HEAD'; }
function guard(req, url) {
  if (req.headers['x-preview-key'] !== key) { const err = new Error('Author preview key required'); err.status=401; throw err; }
  if (!safeMethod(req)) {
    const origin = req.headers.origin;
    if (origin && origin !== `http://127.0.0.1:${PORT}` && origin !== `http://localhost:${PORT}`) {
      const err = new Error('Untrusted origin'); err.status=403; throw err;
    }
  }
}
function fail(res, e) {
  const status = e.status ?? ({ 'bad-request':400, 'not-found':404, 'conflict':409 }[e.code] ?? 500);
  send(res, status, { error: status === 500 ? 'Internal error' : (e.message ?? 'Invalid request'), code: status === 500 ? 'internal' : (e.code ?? 'request') });
  if (status === 500) console.error('Preview internal error', String(e));
}
function hasData(body) { return body && typeof body === 'object' && !Array.isArray(body); }
const server = http.createServer(async (req, res) => {
  try {
    // Explicit loopback Host enforcement, including DNS rebinding defense.
    const host = req.headers.host;
    if (![ `localhost:${PORT}`, `127.0.0.1:${PORT}` ].includes(host)) return send(res, 403, { error:'Localhost only' });
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
    const pathname = url.pathname;
    if (pathname === '/api/health') return send(res,200,{ status:'ok', mode:'localhost-alpha-preview' });
    if (pathname === '/api/public/series' && req.method === 'GET') return send(res, 200, publicSeries(library, Date.now()));
    const tree = /^\/api\/public\/series\/([0-9a-f-]{36})\/tree$/.exec(pathname);
    if (tree && req.method==='GET') {
      const nodes = publicTree(library,tree[1],Date.now());
      if (!nodes.length) return send(res,404,{error:'Not found'});
      return send(res,200,nodes);
    }
    const publicItem = /^\/api\/public\/items\/([0-9a-f-]{36})$/.exec(pathname);
    if (publicItem && req.method==='GET') {
      const value = toReader(library,publicItem[1],Date.now());
      return value ? send(res,200,value) : send(res,404,{error:'Not found'});
    }
    if (pathname.startsWith('/api/admin/')) {
      guard(req,url);
      if (pathname === '/api/admin/nodes' && req.method==='GET') return send(res,200,managedList(library));
      if (pathname === '/api/admin/nodes' && req.method==='POST') {
        const input = await readJson(req);
        if (!hasData(input)) return send(res,400,{error:'Invalid payload'});
        const id = randomUUID();
        persist(createNode(library, {id, kind:input.kind, parentId:input.parentId??null, content:input.content, now:Date.now()}));
        return send(res,201,{id});
      }
      const edit = /^\/api\/admin\/nodes\/([0-9a-f-]{36})$/.exec(pathname);
      if (edit && req.method==='PATCH') {
        const input = await readJson(req);
        if (!hasData(input)) return send(res,400,{error:'Invalid payload'});
        persist(editNode(library,edit[1],input.expectedRevision,input.content,Date.now()));
        return send(res,200,{ok:true});
      }
      const pub = /^\/api\/admin\/nodes\/([0-9a-f-]{36})\/publish$/.exec(pathname);
      if (pub && req.method==='POST') {
        const input = await readJson(req);
        if (!hasData(input)) return send(res,400,{error:'Invalid payload'});
        persist(publishNode(library,pub[1],input.expectedRevision,Date.now()));
        return send(res,200,{ok:true});
      }
      const vis = /^\/api\/admin\/nodes\/([0-9a-f-]{36})\/visibility$/.exec(pathname);
      if (vis && req.method==='POST') {
        const input = await readJson(req);
        if (!hasData(input)) return send(res,400,{error:'Invalid payload'});
        persist(setVisibility(library,vis[1],input.expectedRevision,input.isPublic,input.publicSince ?? null,Date.now()));
        return send(res,200,{ok:true});
      }
    }
    if (pathname.startsWith('/api/')) return send(res,404,{error:'Not found'});
    if (req.method !== 'GET') return send(res,405,{error:'Method not allowed'});
    const fileName = pathname === '/admin' ? 'admin.html' : pathname.startsWith('/assets/') ? path.basename(pathname) : 'index.html';
    const target = path.join(staticDir, fileName);
    const extension = path.extname(target);
    if (!Object.hasOwn(mime,extension) || !fs.existsSync(target)) return send(res,404,'Not found','text/plain; charset=utf-8');
    return send(res,200,fs.readFileSync(target),mime[extension]);
  } catch (e) { fail(res,e); }
});
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT,'127.0.0.1',() => {
    console.log(`\nEternalia α 読者: http://127.0.0.1:${PORT}/`);
    console.log(`Eternalia α 作者: http://127.0.0.1:${PORT}/admin#key=${key}`);
    console.log('ローカル検証専用: Discord認証・PostgreSQL連携は未実装です。\n');
  });
}
export { server };
