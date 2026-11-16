#!/usr/bin/env node
// Phase 9: the work a task takes on the screens as they are now, counted by doing it in a browser.
// Each task reports the clicks, key presses (not counting typed text), characters typed and the time.
//   node qa/tools/productivity.cjs [--app http://localhost:5199] [--api http://localhost:3001]
const fs = require('node:fs'); const { chromium } = require('playwright');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199'); const API = arg('api', 'http://localhost:3001'); const PW = 'qa-password-1';
(async () => {
  const login = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PW }) }).then((r) => r.json());
  const admin = await login('qa-admin@qa.test'); const get = (who, p) => fetch(`${API}/api${p}`, { headers: { authorization: `Bearer ${who.token}` } }).then((r) => r.json());
  const rowsOf = (d) => (Array.isArray(d) ? d : d?.data || []); const order = rowsOf(await get(admin, '/orders?limit=1'))[0];
  const browser = await chromium.launch(); const out = [];
  const signedIn = async (who) => { const c = await browser.newContext({ viewport: { width: 1366, height: 900 } }); await c.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]); return c; };
  const task = async (name, fn) => { const n = { clicks: 0, keys: 0, typed: 0 }; const t0 = Date.now(); let ok = false; let note = ''; try { [ok, note] = await fn(n); } catch (e) { note = String(e.message).split('\n')[0]; } out.push({ task: name, done: !!ok, ...n, ms: Date.now() - t0, note }); console.log(`${ok ? 'done  ' : 'FAILED'} ${name}: ${n.clicks} clicks, ${n.keys} keys, ${n.typed} typed, ${Date.now() - t0} ms ${note || ''}`); };

  await task('find an order by its number and open it, from any screen', async (n) => {
    const c = await signedIn(admin); const page = await c.newPage(); await page.goto(`${APP}/units`); await page.locator('main h1').first().waitFor(); const t = Date.now();
    await page.keyboard.press('Control+k'); n.keys += 1; await page.keyboard.type(order.orderNumber); n.typed += order.orderNumber.length;
    await page.locator('[role="option"]', { hasText: order.orderNumber }).first().waitFor({ timeout: 8000 }); await page.keyboard.press('Enter'); n.keys += 1;
    await page.waitForURL(new RegExp(`/orders/${order.id}`), { timeout: 8000 }); const ok = await page.locator('main').getByText(order.orderNumber).first().waitFor({ timeout: 8000 }).then(() => true, () => false); await c.close(); return [ok, `${Date.now() - t} ms after the page was up`];
  });
  await task('a shipping coordinator signs in and reaches the shipping desk', async (n) => {
    const c = await browser.newContext({ viewport: { width: 1366, height: 900 } }); const page = await c.newPage(); await page.goto(`${APP}/login`);
    await page.locator('input[type="email"], input[name="email"]').first().fill('qa-shipping@qa.test'); n.typed += 'qa-shipping@qa.test'.length; await page.locator('input[type="password"]').fill(PW); n.typed += PW.length;
    await page.keyboard.press('Enter'); n.keys += 1; await page.waitForURL(/\/shipping/, { timeout: 10000 }); await page.locator('main h1').first().waitFor(); const p = new URL(page.url()).pathname; await c.close(); return [p === '/shipping', `lands on ${p}`];
  });
  await task('reach the page content by keyboard, past the menu', async (n) => {
    const c = await signedIn(admin); const page = await c.newPage(); await page.goto(`${APP}/orders`); await page.locator('main h1').first().waitFor();
    const before = await page.evaluate(() => { const main = document.querySelector('main'); return [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((e) => !main.contains(e) && e.offsetParent !== null && !e.disabled && !e.classList.contains('skip-link')).length; });
    await page.keyboard.press('Tab'); n.keys += 1; await page.keyboard.press('Enter'); n.keys += 1; const inMain = await page.evaluate(() => { const m = document.querySelector('main'); return m === document.activeElement || m.contains(document.activeElement); }); await c.close(); return [inMain, `${before} stops stand before the content without the skip link`];
  });
  await task('open a stock item from the list without a mouse', async (n) => {
    const c = await signedIn(admin); const page = await c.newPage(); await page.goto(`${APP}/units`); const row = page.locator('main tbody tr[tabindex="0"]').first(); await row.waitFor({ timeout: 15000 });
    await row.focus(); await page.keyboard.press('Enter'); n.keys += 1; await page.waitForURL(/\/units\/[^/]+/, { timeout: 8000 }); await c.close(); return [true, 'Enter on the focused row; before, a row answered only to a mouse'];
  });
  await task('come back to the same page after the session ends', async (n) => {
    const c = await signedIn({ token: 'not-a-token', user: admin.user }); const page = await c.newPage(); await page.goto(`${APP}/orders/invoices`); await page.waitForURL(/\/login/, { timeout: 15000 });
    await page.locator('input[type="email"], input[name="email"]').first().fill('qa-admin@qa.test'); n.typed += 'qa-admin@qa.test'.length; await page.locator('input[type="password"]').fill(PW); n.typed += PW.length; await page.keyboard.press('Enter'); n.keys += 1;
    await page.waitForURL(/\/orders\/invoices/, { timeout: 10000 }); await c.close(); return [true, 'back on Invoices with no further step'];
  });
  await browser.close(); fs.writeFileSync('qa/results/productivity.json', JSON.stringify({ at: new Date().toISOString(), tasks: out }, null, 1)); process.exit(out.every((o) => o.done) ? 0 : 1);
})();
