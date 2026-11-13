#!/usr/bin/env node
// Opens every screen in the app as an admin and records crashes, console
// errors and failed API calls.   node qa/sim/ui-smoke.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-smoke.json');
const WHO = arg('who', 'qa-admin@qa.test');
const ONLY = arg('only', '');
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, '../.inventory.json'), 'utf8'));

(async () => {
  const login = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: WHO, password: 'qa-password-1' }) }).then((r) => r.json());
  if (!login.token) throw new Error(`login failed: ${JSON.stringify(login)}`);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [login.token, login.user]);

  const routes = [...new Set(inventory.routes.map((r) => (r.startsWith('/') ? r : `/${r}`)))].filter((r) => r !== '/login' && !r.includes('*')).filter((r) => !ONLY || ONLY.split(',').includes(r));
  const results = [];
  for (const route of routes) {
    const url = route.replace(/:[A-Za-z]+/g, '00000000-0000-4000-8000-000000000000');
    const page = await context.newPage();
    const r = { route, pageErrors: [], consoleErrors: [], apiFailures: [], status: 'OK' };
    page.on('pageerror', (e) => r.pageErrors.push(String(e.message).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') r.consoleErrors.push(m.text().slice(0, 200)); });
    page.on('response', (res) => { const u = res.url(); if (u.includes('/api/') && res.status() >= 400) r.apiFailures.push(`${res.request().method()} ${u.replace(APP, '').split('?')[0]} → ${res.status()}`); });
    try {
      await page.goto(APP + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      const text = (await page.locator('body').innerText().catch(() => '')) || '';
      r.landedOn = new URL(page.url()).pathname;
      r.textLength = text.trim().length;
      if (r.landedOn === '/login') r.status = 'SENT_TO_LOGIN';
      else if (r.textLength < 20) r.status = 'BLANK';
      else if (/something went wrong|unexpected application error|cannot read properties/i.test(text)) r.status = 'CRASH_SCREEN';
      else if (r.pageErrors.length) r.status = 'JS_ERROR';
      else if (/no access/i.test(text) && text.length < 400) r.status = 'NO_ACCESS';
    } catch (e) { r.status = 'LOAD_FAILED'; r.pageErrors.push(String(e.message).slice(0, 200)); }
    r.hasParam = route.includes(':');
    results.push(r);
    process.stdout.write(r.status === 'OK' ? '.' : r.status[0]);
    await page.close();
  }
  await browser.close();
  const tally = results.reduce((t, r) => ({ ...t, [r.status]: (t[r.status] || 0) + 1 }), {});
  const failing = {};
  for (const r of results) for (const f of new Set(r.apiFailures)) (failing[f.replace(/[0-9a-f-]{36}/g, ':id')] ||= []).push(r.route);
  const report = { app: APP, at: new Date().toISOString(), who: WHO, screens: results.length, tally, screensWithFailedApiCalls: results.filter((r) => r.apiFailures.length).length, failedApiCalls: failing, results };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  console.log(`\n${results.length} screens: ${JSON.stringify(tally)}; ${report.screensWithFailedApiCalls} screens made at least one failing API call`);
  for (const r of results.filter((x) => x.status !== 'OK')) console.log(`  ${r.status} ${r.route} ${r.pageErrors[0] || ''}`.slice(0, 200));
  const top = Object.entries(failing).sort((a, b) => b[1].length - a[1].length);
  console.log(`${top.length} distinct failing API calls from screens:`);
  for (const [k, v] of top) console.log(`  ${k}  ← ${v.slice(0, 3).join(', ')}${v.length > 3 ? ` +${v.length - 3}` : ''}`);
})().catch((e) => { console.error(e); process.exit(1); });
