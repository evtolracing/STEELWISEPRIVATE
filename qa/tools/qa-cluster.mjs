// Phase 11: several copies of the QA server behind one address, the way a host runs the application
// as more than one instance. A small front door on --port hands each request to the next copy in turn.
// The front door can also be told to misbehave, for the failure scenarios: stop a copy without warning,
// start it again, hold every answer back for a while, or cut the line after a request has gone in.
//   node qa/tools/qa-cluster.mjs --workers 3 --port 3110            (workers listen on port+1 ... port+N)
// Local QA database only: each copy is started by qa/tools/start-qa-server.sh, which refuses anything else.
// Control (local only):  GET /__cluster/state   POST /__cluster/kill/<n>   POST /__cluster/term/<n>
//   POST /__cluster/start/<n>   POST /__cluster/mode  {"delayMs":0,"cutAfterSend":0,"only":"<path part>"}
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', '3110'));
const N = Number(arg('workers', '3'));
const LOG = arg('log', '/tmp/qa-cluster');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const agent = new http.Agent({ keepAlive: true, maxSockets: 256 });

const workers = Array.from({ length: N }, (_, i) => ({ n: i + 1, port: PORT + 1 + i, proc: null, up: false, served: 0, startedAt: null, exits: 0 }));
const mode = { delayMs: 0, cutAfterSend: 0, only: '' };
const counters = { requests: 0, noWorker: 0, upstreamErrors: 0, cut: 0, delayed: 0 };

function start(w) {
  if (w.proc) return;
  const out = fs.openSync(`${LOG}-${w.n}.log`, 'a');
  w.proc = spawn('bash', [path.join(root, 'qa/tools/start-qa-server.sh')], { env: { ...process.env, PORT: String(w.port), QA_INSTANCE: String(w.n) }, stdio: ['ignore', out, out] });
  w.startedAt = Date.now();
  w.proc.on('exit', () => { w.proc = null; w.up = false; w.exits += 1; });
}
async function probe(w) {
  if (!w.proc) { w.up = false; return; }
  try { const r = await fetch(`http://127.0.0.1:${w.port}/api/health/live`, { signal: AbortSignal.timeout(1500) }); w.up = r.status === 200; } catch { w.up = false; }
}
setInterval(() => workers.forEach(probe), 300).unref();

let turn = 0;
function next() {
  for (let i = 0; i < workers.length; i++) { const w = workers[(turn++) % workers.length]; if (w.up) return w; }
  return null;
}
const readBody = (req) => new Promise((resolve) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/__cluster/')) {
    const [, , what, n] = req.url.split('/');
    const w = workers.find((x) => x.n === Number(n));
    if (what === 'state') return json(res, 200, { port: PORT, mode, counters, workers: workers.map(({ proc, ...x }) => ({ ...x, pid: proc?.pid || null })) });
    if (what === 'mode') { Object.assign(mode, { delayMs: 0, cutAfterSend: 0, only: '' }, JSON.parse((await readBody(req)).toString() || '{}')); return json(res, 200, mode); }
    if (!w) return json(res, 404, { error: 'no such worker' });
    if (what === 'kill' || what === 'term') { if (w.proc) { // the start script execs node, so this is the server itself
      w.up = false; process.kill(w.proc.pid, what === 'kill' ? 'SIGKILL' : 'SIGTERM'); } return json(res, 200, { n: w.n, signalled: what }); }
    if (what === 'start') { start(w); return json(res, 200, { n: w.n, starting: true }); }
    return json(res, 404, { error: 'unknown' });
  }
  counters.requests += 1;
  const body = await readBody(req);
  const hit = !mode.only || req.url.includes(mode.only);
  const send = (attempt) => {
    const w = next();
    if (!w) { counters.noWorker += 1; return json(res, 503, { error: 'No copy of the application is running. Try again shortly.', code: 'NO_INSTANCE' }); }
    w.served += 1;
    const up = http.request({ host: '127.0.0.1', port: w.port, method: req.method, path: req.url, headers: { ...req.headers, 'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress }, agent }, (r) => {
      const pass = () => { res.writeHead(r.statusCode, { ...r.headers, 'x-qa-instance': String(w.n) }); r.pipe(res); };
      if (hit && mode.delayMs) { counters.delayed += 1; setTimeout(pass, mode.delayMs); } else pass();
    });
    up.on('error', (e) => {
      // A copy that died before answering. A read is safe to hand to another copy; a change is not
      // repeated by the front door (the caller decides), so it answers 502 and says so.
      w.up = false; counters.upstreamErrors += 1;
      if (req.method === 'GET' && attempt < workers.length) return send(attempt + 1);
      if (!res.headersSent) json(res, 502, { error: 'The application stopped before it answered. The change may or may not have been saved.', code: 'INSTANCE_LOST', detail: e.code });
    });
    up.end(body);
    if (hit && mode.cutAfterSend) { counters.cut += 1; setTimeout(() => req.socket.destroy(), mode.cutAfterSend); }
  };
  send(1);
});
server.keepAliveTimeout = 60000;
workers.forEach(start);
server.listen(PORT, '127.0.0.1', () => console.log(`front door on ${PORT}, ${N} copies on ${workers.map((w) => w.port).join(', ')}`));
const stop = () => { for (const w of workers) if (w.proc) try { process.kill(w.proc.pid, 'SIGTERM'); } catch { /* gone */ } setTimeout(() => process.exit(0), 800); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
