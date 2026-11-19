#!/usr/bin/env node
// Phase 12: three findings that only a server process of its own can prove.
//   E-010  a polite stop (SIGTERM) finishes the request in flight, closes its database connections and exits 0
//   M-013  with no database configured the jobs list answers 503, not a sample job
//   AA-001 with no database configured the home dashboard answers 503, not invented figures
//   SC-07  in production mode another website is given no permission to read answers
// It starts its own servers on spare ports against the local QA database (or none) and stops them.
//   node qa/tools/phase12-process.mjs [--out qa/results/phase12-process.json]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, 'src/backend/package.json'));
const pg = require('pg'); const jwt = require('jsonwebtoken');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('out', 'qa/results/phase12-process.json');
const DB = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/steelwise_qa';
if (!/localhost|127\.0\.0\.1/.test(DB) || !/qa/.test(DB.split('/').pop())) { console.error('Refusing: not a local QA database'); process.exit(1); }
const SECRET = 'qa-jwt-secret-not-real-0123456789abcdef';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = []; const ok = (finding, what, cond, detail = '') => { checks.push({ finding, what, ok: Boolean(cond), detail: String(detail).slice(0, 300) }); console.log(`${cond ? '✓' : '✗'} ${finding}: ${what}${cond ? '' : ` (${detail})`}`); };

function start(port, env) {
  const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(DATABASE_URL|DIRECT_URL|POSTGRES|PG)/.test(k)));
  const p = spawn('node', ['src/server.js'], { cwd: path.join(root, 'src/backend'), env: { ...base, PORT: String(port), JWT_SECRET: SECRET, LOG_REQUESTS: 'off', RATE_LIMIT_MAX: '100000', NODE_ENV: 'test', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.log = ''; p.stdout.on('data', (d) => { p.log += d; }); p.stderr.on('data', (d) => { p.log += d; });
  p.exited = new Promise((r) => p.on('exit', (code, signal) => r({ code, signal, at: Date.now() })));
  return p;
}
async function up(port, p) { for (let i = 0; i < 120; i++) { if (p.exitCode != null) return false; try { const r = await fetch(`http://localhost:${port}/api/health/live`); if (r.status < 500) return true; } catch { /* not yet */ } await sleep(250); } return false; }
const get = (port, url, token) => fetch(`http://localhost:${port}${url}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) })).catch((e) => ({ status: 0, body: null, error: String(e.cause?.code || e.message) }));

// ── no database: M-013 and AA-001 ────────────────────────────────────────────────────────────
{
  const port = 3391; const p = start(port, { DATABASE_URL: '', DIRECT_URL: '' });
  const alive = await up(port, p);
  if (!alive) {
    ok('M-013', 'a server with no database refuses to start, so no screen can be served sample data', p.exitCode != null && p.exitCode !== 0, `exit ${p.exitCode}: ${p.log.slice(-200)}`);
    ok('AA-001', 'a server with no database refuses to start, so the home dashboard cannot answer with invented figures', p.exitCode != null && p.exitCode !== 0, `exit ${p.exitCode}`);
  } else {
    const token = jwt.sign({ userId: '00000000-0000-4000-8000-000000000001' }, SECRET, { expiresIn: '5m' });
    for (const [finding, url, bad] of [['M-013', '/api/jobs', /sample|demo|JOB-\d|"jobNumber"/i], ['AA-001', '/api/dashboard', /ABC Manufacturing|XYZ Industries|125000|SO-1001/], ['AA-001', '/api/dashboard/kpis', /"ordersThisMonth":\s*[1-9]/]]) {
      const r = await get(port, url, token); const text = JSON.stringify(r.body || '');
      ok(finding, `${url} with no database does not answer 200`, r.status !== 200, `${r.status} ${text.slice(0, 160)}`);
      ok(finding, `${url} with no database carries no invented record`, !bad.test(text), text.slice(0, 200));
      ok(finding, `${url} with no database answers 503 (or 401 where sign-in itself needs the database)`, r.status === 503 || r.status === 401, r.status);
    }
    const health = await get(port, '/api/health/ready'); ok('M-013', 'the readiness check says the server is not ready', health.status === 503, health.status);
  }
  p.kill('SIGKILL'); await p.exited;
}

// ── a polite stop: E-010 ─────────────────────────────────────────────────────────────────────
{
  const port = 3392; const app = `p12-shutdown-${Date.now()}`;
  const url = `${DB}${DB.includes('?') ? '&' : '?'}application_name=${app}`;
  const p = start(port, { DATABASE_URL: url, DIRECT_URL: url });
  const alive = await up(port, p); ok('E-010', 'the server starts on the QA database', alive, p.log.slice(-200));
  if (alive) {
    const db = new pg.Client({ connectionString: DB }); await db.connect();
    const conns = async () => (await db.query('SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name = $1', [app])).rows[0].n;
    await Promise.all(Array.from({ length: 6 }, () => get(port, '/api/health/ready')));
    const before = await conns(); ok('E-010', 'it holds database connections while it runs', before > 0, before);
    // Four requests the server has begun to read (headers and half the body have arrived) when the stop comes.
    const body = JSON.stringify({ email: 'p12-nobody@qa.test', password: 'not-a-real-password-0000' });
    const half = (i) => new Promise((resolve) => {
      const sock = net.connect(port, '127.0.0.1'); let got = '';
      sock.on('data', (d) => { got += d; }); sock.on('error', (e) => resolve({ i, error: e.code })); sock.on('close', () => resolve({ i, status: Number((got.match(/^HTTP\/1\.1 (\d+)/) || [])[1] || 0) }));
      sock.write(`POST /api/auth/login HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body.slice(0, 20)}`);
      sock.finish = () => sock.write(body.slice(20));
      socks.push(sock);
    });
    const socks = []; const inflight = Array.from({ length: 4 }, (_, i) => half(i));
    await sleep(400);
    const t = Date.now(); p.kill('SIGTERM');
    await sleep(300); socks.forEach((s) => s.finish());
    const rs = await Promise.all(inflight); const ex = await Promise.race([p.exited, sleep(12000).then(() => null)]);
    ok('E-010', 'requests in flight when the stop arrived were answered, not cut off', rs.every((r) => r.status >= 200 && r.status < 500), rs.map((r) => r.status || r.error).join(','));
    const late = await get(port, '/api/health/live');
    ok('E-010', 'a request that arrives after the stop is not accepted', late.status === 0, late.status);
    ok('E-010', 'it exits by itself with code 0', ex && ex.code === 0, ex ? `code ${ex.code} signal ${ex.signal}` : 'still running after 12 s');
    ok('E-010', 'within 5 seconds', ex && ex.at - t < 5000, ex ? `${ex.at - t} ms` : '');
    ok('E-010', 'it says so in its log', /Server closed/.test(p.log), p.log.slice(-160));
    await sleep(500); const after = await conns(); ok('E-010', 'its database connections are closed', after === 0, `${before} before, ${after} after`);
    ok('E-010', 'it no longer accepts requests', (await get(port, '/api/health/live')).status === 0);
    await db.end();
  }
  if (p.exitCode == null) { p.kill('SIGKILL'); await p.exited; }
}

// ── production mode: which websites may read answers (SC-07) ─────────────────────────────────
{
  const port = 3393;
  const origin = async (env, from) => {
    const p = start(port, { DATABASE_URL: DB, DIRECT_URL: DB, NODE_ENV: 'production', ...env });
    const alive = await up(port, p); let allow = 'not started';
    if (alive) { const r = await fetch(`http://localhost:${port}/api/health/live`, { headers: { origin: from } }); allow = r.headers.get('access-control-allow-origin'); }
    p.kill('SIGKILL'); await p.exited; return { alive, allow, log: p.log.slice(-200) };
  };
  const none = await origin({ CORS_ORIGIN: '' }, 'https://evil.example');
  ok('SC-07', 'a production server starts on the QA database', none.alive, none.log);
  ok('SC-07', 'in production, with no list of allowed websites, another website is given no permission to read answers', none.alive && !none.allow, none.allow);
  const listed = await origin({ CORS_ORIGIN: 'https://app.example' }, 'https://evil.example');
  ok('SC-07', 'with a list, a website not on it is given no permission', listed.alive && listed.allow !== 'https://evil.example' && listed.allow !== '*', listed.allow);
  const good = await origin({ CORS_ORIGIN: 'https://app.example' }, 'https://app.example');
  ok('SC-07', 'and the listed website is', good.allow === 'https://app.example', good.allow);
}

const failed = checks.filter((c) => !c.ok).length;
fs.writeFileSync(path.resolve(root, OUT), `${JSON.stringify({ ranAt: new Date().toISOString(), checks: checks.length, failed, results: checks }, null, 1)}\n`);
console.log(`${checks.length} checks, ${failed} failed → ${OUT}`);
process.exit(failed ? 1 : 0);
