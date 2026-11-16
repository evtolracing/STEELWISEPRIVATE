#!/usr/bin/env node
// Phase 9: measured front-end performance, on the production build (vite preview), not the dev server.
// For each screen: time to the heading, time until the network is quiet, the number of API calls and
// repeated calls, script bytes transferred, and the longest task. Also the size of the build.
//   node qa/tools/frontend-performance.cjs --app http://localhost:5198 --api http://localhost:3001 [--out file]
const fs = require('node:fs'); const path = require('node:path'); const zlib = require('node:zlib'); const { chromium } = require('playwright');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5198'); const API = arg('api', 'http://localhost:3001'); const OUT = arg('out', 'qa/results/frontend-performance.json');
const SCREENS = ['/', '/orders', '/orders/intake', '/customers', '/units', '/heats', '/receiving', '/purchase-orders', '/work-orders', '/schedule', '/order-board', '/production', '/qc', '/shopfloor', '/shipping', '/orders/invoices', '/orders/closeout', '/sales/rfq-inbox', '/pricing', '/admin/users'];
(async () => {
  const dist = path.resolve('src/frontend/dist/assets'); const files = fs.existsSync(dist) ? fs.readdirSync(dist).filter((f) => /\.(js|css)$/.test(f)).map((f) => { const b = fs.readFileSync(path.join(dist, f)); return { file: f, bytes: b.length, gzip: zlib.gzipSync(b).length }; }).sort((a, b) => b.bytes - a.bytes) : [];
  const build = { files: files.length, totalBytes: files.reduce((s, f) => s + f.bytes, 0), totalGzip: files.reduce((s, f) => s + f.gzip, 0), largest: files.slice(0, 8) };
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: arg('email', 'qa-admin@qa.test'), password: 'qa-password-1' }) }).then((r) => r.json());
  const browser = await chromium.launch(); const rows = [];
  for (const url of SCREENS) {
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); window.__long = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long = Math.max(window.__long, e.duration); }).observe({ entryTypes: ['longtask'] }); } catch (e) { /* not supported */ } }, [who.token, who.user]);
      const page = await context.newPage(); const calls = []; let scriptBytes = 0;
      page.on('response', async (r) => { const u = r.url(); if (/\/api\//.test(u)) calls.push(`${r.request().method()} ${u.replace(/^.*\/api/, '').replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ':id')}`); else if (/\.js(\?|$)/.test(u)) { const len = Number(r.headers()['content-length'] || 0); scriptBytes += len; } });
      const t0 = Date.now(); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.locator('main h1').first().waitFor({ timeout: 20000 }).catch(() => {}); const heading = Date.now() - t0;
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}); const quiet = Date.now() - t0; const longTask = await page.evaluate(() => Math.round(window.__long || 0));
      const counts = {}; for (const c of calls) counts[c] = (counts[c] || 0) + 1; runs.push({ heading, quiet, apiCalls: calls.length, repeated: Object.entries(counts).filter(([, n]) => n > 1).map(([c, n]) => `${n}x ${c}`), scriptBytes, longTask });
      await context.close();
    }
    runs.sort((a, b) => a.quiet - b.quiet); const mid = runs[1]; rows.push({ url, ...mid }); console.log(`${url.padEnd(22)} heading ${String(mid.heading).padStart(5)} ms  quiet ${String(mid.quiet).padStart(5)} ms  calls ${String(mid.apiCalls).padStart(3)}  repeated ${mid.repeated.length}  longest task ${mid.longTask} ms`);
  }
  await browser.close();
  const med = (k) => { const v = rows.map((r) => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  const summary = { screens: rows.length, medianHeadingMs: med('heading'), medianQuietMs: med('quiet'), slowest: [...rows].sort((a, b) => b.quiet - a.quiet).slice(0, 3).map((r) => `${r.url} ${r.quiet} ms`), totalApiCalls: rows.reduce((s, r) => s + r.apiCalls, 0), screensWithRepeatedCalls: rows.filter((r) => r.repeated.length).length };
  fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), app: APP, build, summary, rows }, null, 1)); console.log(JSON.stringify(summary)); console.log(`build: ${build.files} files, ${(build.totalBytes / 1024).toFixed(0)} KB, ${(build.totalGzip / 1024).toFixed(0)} KB gzipped; largest ${build.largest.slice(0, 3).map((f) => `${f.file} ${(f.gzip / 1024).toFixed(0)} KB gz`).join(', ')}`);
})();
