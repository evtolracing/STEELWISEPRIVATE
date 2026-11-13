#!/usr/bin/env node
// Stock screens driven like a person would, in a real browser, against the QA server.
// Covers the Units and Heats screens, which used to show made-up rows (findings I-001, I-002).
//   node qa/sim/ui-inventory.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-inventory.json');

(async () => {
  const signIn = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const [clerk, boss] = await Promise.all([signIn('qa-csr@qa.test'), signIn('qa-admin@qa.test')]);
  if (!clerk.token || !boss.token) throw new Error('login failed');
  const api = (url, who = clerk) => fetch(API + url, { headers: { authorization: `Bearer ${who.token}` } }).then((r) => r.json());
  const browser = await chromium.launch();
  const contextFor = async (who) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    return context;
  };
  const clerkContext = await contextFor(clerk);
  const bossContext = await contextFor(boss);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${String(detail).slice(0, 300)}`}`); };
  const open = async (context, url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('body').innerText();
  const seen = (page, text, timeout = 10000) => page.getByText(text, { exact: true }).first().waitFor({ timeout }).then(() => true).catch(() => false);

  // Units: the list is the real stock, searchable, and a clerk is not shown cost.
  {
    const stock = await api('/api/coils?limit=3');
    const first = stock[0];
    const page = await open(clerkContext, '/units');
    check('units: the list shows real stock items', await seen(page, first.coilNumber), await body(page));
    const other = (await api('/api/coils?limit=200')).find((c) => !c.coilNumber.includes(first.coilNumber) && !first.coilNumber.includes(c.coilNumber));
    await page.getByLabel('Search stock items').fill(first.coilNumber).catch(() => page.getByRole('textbox').first().fill(first.coilNumber));
    await page.waitForTimeout(1200);
    const narrowed = await body(page);
    check('units: search narrows the list on the server', narrowed.includes(first.coilNumber) && (!other || !narrowed.includes(other.coilNumber)), narrowed);
    await page.getByText(first.coilNumber, { exact: true }).first().click().catch(() => {});
    await page.waitForURL(/\/units\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    await seen(page, first.coilNumber);
    const detail = await body(page);
    check('units: an item opens with its own details', /\/units\/[^/]+$/.test(page.url()) && detail.includes(first.coilNumber), `${page.url()} ${detail.slice(0, 200)}`);
    check('units: a clerk is not shown what the stock cost', !/unit cost|landed cost/i.test(detail), 'cost is on the screen');
    check('units: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
    const gone = await open(clerkContext, '/units/no-such-item');
    await gone.waitForTimeout(1500);
    check('units: an item that does not exist says so instead of showing a sample', /not found|does not exist|could not be/i.test(await body(gone)), await body(gone));
    await gone.close();
  }

  // Heats: the list is the real heats; one opens with its stock; a manager adds one.
  {
    const heats = await api('/api/heats?limit=50');
    const withStock = heats.find((h) => h.unitCount > 0) || heats[0];
    const page = await open(clerkContext, '/heats');
    check('heats: the list shows real heats, not samples', (await seen(page, withStock.heatNumber)) && !/HT-2024-001|US Steel Gary Works/.test(await body(page)), await body(page));
    await page.getByLabel('Search heats').fill(withStock.heatNumber);
    await page.waitForTimeout(1200);
    const rows = await page.locator('tbody tr').count();
    check('heats: search narrows the list on the server', rows >= 1 && rows < Math.max(heats.length, 2) && (await body(page)).includes(withStock.heatNumber), `${rows} rows`);
    await page.getByText(withStock.heatNumber, { exact: true }).first().click();
    await page.waitForURL(/\/heats\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    await page.getByText(`Heat ${withStock.heatNumber}`).waitFor({ timeout: 8000 }).catch(() => {});
    const one = await api(`/api/heats/${withStock.id}`);
    const overview = await body(page);
    check('heats: a heat opens with its own mill and grade', overview.includes(`Heat ${withStock.heatNumber}`) && overview.includes(one.mill.name) && overview.includes(one.grade.code) && !/PO-2024-00123|Gary, Indiana/.test(overview), overview.slice(0, 300));
    await page.getByRole('tab', { name: /Stock items/ }).click().catch(() => {});
    const stockShown = one.coils.length === 0 ? /No stock has been received/.test(await body(page)) : await seen(page, one.coils[0].coilNumber);
    check('heats: the stock items tab lists the items from this heat', stockShown, await body(page));
    check('heats: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
    const gone = await open(clerkContext, '/heats/no-such-heat');
    await gone.getByText('This heat does not exist.').waitFor({ timeout: 8000 }).catch(() => {});
    check('heats: a heat that does not exist says so instead of showing a sample', /This heat does not exist/.test(await body(gone)), await body(gone));
    await gone.close();

    const number = `QA-UI-${Date.now().toString(36).toUpperCase()}`;
    const add = await open(bossContext, '/heats');
    await add.getByRole('button', { name: 'Add Heat' }).click({ timeout: 8000 }).catch(() => {});
    await add.getByLabel(/Heat number/).fill(number).catch(() => {});
    await add.getByLabel(/Cast date/).fill('2026-03-01').catch(() => {});
    await add.getByLabel(/^Mill/).click().catch(() => {});
    await add.getByRole('option').first().click().catch(() => {});
    await add.getByLabel(/^Grade/).click().catch(() => {});
    await add.getByRole('option').first().click().catch(() => {});
    await add.getByRole('button', { name: 'Add heat', exact: true }).click({ timeout: 5000 }).catch(() => {});
    await add.getByText(`Heat ${number}`).waitFor({ timeout: 10000 }).catch(() => {});
    const saved = (await api(`/api/heats?search=${number}`, boss)).find((h) => h.heatNumber === number);
    check('heats: a manager adds a heat and lands on it', Boolean(saved) && (await body(add)).includes(`Heat ${number}`), await body(add));
    await add.getByRole('button', { name: 'Edit' }).click({ timeout: 5000 }).catch(() => {});
    await add.getByLabel('Total weight (lb)').fill('12345').catch(() => {});
    await add.getByRole('button', { name: 'Save', exact: true }).click({ timeout: 5000 }).catch(() => {});
    await add.getByText('12,345 lb').first().waitFor({ timeout: 8000 }).catch(() => {});
    check('heats: an edit is saved and shown', /12,345 lb/.test(await body(add)), await body(add));
    await add.close();
  }

  // Receiving: what was really received, and a receipt through the form becomes stock.
  {
    const heats = await api('/api/heats?limit=50');
    const heat = heats.find((h) => h.unitCount > 0) || heats[0];
    const number = `QA-UI-R${Date.now().toString(36).toUpperCase()}`;
    const page = await open(bossContext, '/receiving');
    await page.getByText('Received in the last 30 days').first().waitFor({ timeout: 10000 }).catch(() => {});
    const first = await body(page);
    check('receiving: no sample deliveries are shown', !/Outokumpu|TAG-10001|ABC Steel|INV-10001/.test(first) && /Expected deliveries are not listed here yet/.test(first), first.slice(0, 400));
    await page.getByRole('button', { name: 'Receive item' }).click({ timeout: 8000 }).catch(() => {});
    await page.getByLabel(/Item number/).fill(number).catch(() => {});
    await page.getByLabel(/Weight \(lb\)/).fill('1234').catch(() => {});
    await page.getByLabel(/Heat or lot number/).fill('NO-SUCH-HEAT-XYZ').catch(() => {});
    await page.getByLabel(/Heat or lot number/).blur().catch(() => {});
    const warned = await page.getByText(/This heat is not on file/).waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    check('receiving: a heat that is not on file is said before saving', warned && await page.getByRole('button', { name: 'Receive item', exact: true }).last().isDisabled(), await body(page));
    await page.getByLabel(/Heat or lot number/).fill(heat.heatNumber).catch(() => {});
    await page.getByLabel(/Heat or lot number/).blur().catch(() => {});
    await page.getByText(new RegExp(`On file: .*grade ${heat.grade.code}`)).waitFor({ timeout: 8000 }).catch(() => {});
    check('receiving: a heat on file fills in its grade', /Set by the heat/.test(await body(page)), await body(page));
    await page.getByLabel(/^Location/).click().catch(() => {});
    await page.getByRole('option').first().click().catch(() => {});
    await page.getByRole('button', { name: 'Receive item', exact: true }).last().click({ timeout: 5000 }).catch(() => {});
    await page.getByText(`${number} received`).first().waitFor({ timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: number }).waitFor({ timeout: 10000 }).catch(() => {});
    const after = await body(page);
    const stock = (await api(`/api/coils?search=${number}`, boss)).find((c) => c.coilNumber === number);
    check('receiving: the form receives a real stock item and lists it', Boolean(stock) && after.includes(number) && /1,234 lb/.test(after), after.slice(0, 500));
    await page.getByLabel('Search receipts').fill('zz-no-such-receipt');
    check('receiving: search filters the list and says when nothing matches', /No receipts match your search/.test(await body(page)), await body(page));
    check('receiving: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();

    // The item just received is moved to another location from its own screen.
    if (stock) {
      const item = await open(bossContext, `/units/${stock.id}`);
      await item.getByRole('button', { name: 'Move' }).click({ timeout: 10000 }).catch(() => {});
      await item.getByRole('combobox', { name: /Move to/ }).click().catch(() => {});
      await item.getByRole('option').first().click().catch(() => {});
      await item.getByRole('button', { name: 'Move item' }).click({ timeout: 5000 }).catch(() => {});
      await item.getByText('Item moved').waitFor({ timeout: 8000 }).catch(() => {});
      const moved = await api(`/api/coils/${stock.id}`, boss);
      const history = await api(`/api/coils/${stock.id}/history`, boss);
      check('units: an item is moved to another location and the move is in its history', moved.locationId && moved.locationId !== stock.locationId && (history.events || []).some((e) => e.type === 'TRANSFER'), `${stock.locationId} -> ${moved.locationId}; ${(history.events || []).map((e) => e.type).join(',')}`);
      check('units: the move screen has no script errors', item.errors.length === 0, item.errors.join(' | '));
      await item.close();
    }
  }

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
