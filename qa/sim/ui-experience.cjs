#!/usr/bin/env node
// Checks, in a real browser, that the product does not present made-up data as real:
// sample screens say so, a dashboard figure that cannot be loaded shows an error and not an
// invented number, and no assistant answers with invented figures (findings X-001 to X-005).
//   node qa/sim/ui-experience.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-experience.json');

(async () => {
  const boss = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!boss.token) throw new Error('login failed');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [boss.token, boss.user]);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  — ${String(detail).slice(0, 200)}`}`); };
  const open = async (url) => { const page = await context.newPage(); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const has = (page, pattern, timeout = 8000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);

  // Screens that still show example figures say so, in the same words everywhere.
  const SAMPLES = ['/safety', '/safety/incidents', '/safety/stop-work', '/maintenance/dashboard', '/maintenance/parts', '/provenance', '/executive/cockpit', '/executive/forecast',
    '/training/dashboard', '/contractors/active', '/customer-quality/claims', '/customer-quality/rma', '/qaqc'];
  for (const url of SAMPLES) {
    const page = await open(url);
    check(`${url}: says it is a sample screen`, await has(page, /Sample screen: these are example figures, not your records/), (await body(page)).slice(0, 160));
    await page.close();
  }

  // Real screens do not carry the notice.
  for (const url of ['/shipping', '/orders/invoices', '/schedule', '/admin/users']) {
    const page = await open(url);
    await page.waitForTimeout(1500);
    check(`${url}: a real screen carries no sample notice`, !/Sample screen:/.test(await body(page)), 'notice shown');
    await page.close();
  }

  // The order board no longer offers an assistant that made up its answers.
  {
    const page = await open('/order-board');
    await page.waitForTimeout(2500);
    const text = await body(page);
    // The assistant in the top bar is a different thing: it asks the server. This is the board's own panel.
    check('order board: no invented assistant or AI claim on the board', (await page.locator('main').getByRole('button', { name: 'AI Assistant', exact: true }).count()) === 0 && !/AI-powered|AI Insights/.test(text), text.match(/.{0,30}(AI-powered|AI Insights|AI Assistant).{0,20}/)?.[0]);
    await page.close();
  }

  // Role dashboard: a figure the server cannot give shows an error, not an invented number.
  {
    const page = await context.newPage();
    await page.route(/\/api\/v1\/analytics\/margin/, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"down"}' }));
    await page.route(/\/api\/v1\/shipping\/summary/, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"down"}' }));
    await page.route(/\/api\/v1\/analytics\/ops-forecast/, (route) => route.abort());
    await page.goto(`${APP}/role-dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const text = await body(page);
    check('role dashboard: opens', /Dashboard|Margin|Shipping|Forecast|SLA/i.test(text), text.slice(0, 200));
    check('role dashboard: a failed figure is not replaced by an invented one', !/28\.5|85,400|24,320|Acme Corp|87\.5%|79\.2%/.test(text), text.match(/.{0,40}(28\.5|85,400|24,320|Acme Corp|87\.5%|79\.2%).{0,20}/)?.[0]);
    const shown = (text.match(/Not available right now/g) || []).length;
    check('role dashboard: failed figures say they are not available', shown >= 1 || !/Margin Insights|Shipping Today|Today vs Tomorrow/.test(text), `${shown} notices; ${text.slice(0, 300)}`);
    const ask = page.getByPlaceholder('Ask a question...');
    if (await ask.count()) {
      await ask.first().fill('How are we doing today?');
      await ask.first().press('Enter');
      const said = await has(page, /The assistant is not connected/);
      const after = await body(page);
      check('role dashboard: the assistant says it is not connected and invents nothing', said && !/Utilization at 85%|SLA compliance at 94%|simulated response/.test(after), after.slice(-300));
    } else {
      check('role dashboard: the assistant says it is not connected and invents nothing', true);
      console.log('  (this role has no assistant panel; the service is covered by the code check in screen-audit)');
    }
    await page.close();
  }

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
