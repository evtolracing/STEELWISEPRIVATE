#!/usr/bin/env node
// The web store, the promise check and the cut-off settings on real branches (2026-11-22), in a real browser on
// the QA server and QA database. Before this they showed four made-up locations.
//   node qa/sim/ui-store-branches.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };

(async () => {
  if (!/localhost.*qa|127\.0\.0\.1.*qa/.test(process.env.DATABASE_URL || '')) throw new Error('Refusing: DATABASE_URL is not a local QA database');
  const owner = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const call = async (method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${owner.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const branches = (await call('GET', '/api/ecom/branches')).body.data;
  const rulesBefore = (await call('GET', '/api/ecom/cutoff-rules')).body.data;
  const target = rulesBefore.find((r) => !r.isSet) || rulesBefore[0];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  // A session saved while the store listed made-up locations.
  await context.addInitScript(([t, u]) => {
    localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u));
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('steelwise_customer_session', JSON.stringify({ locationId: 'loc-2', locationName: 'Detroit', division: 'METALS' })); sessionStorage.setItem('seeded', '1'); }
  }, [owner.token, owner.user]);
  const page = await context.newPage();
  const asked = [];
  page.on('request', (r) => { if (r.url().includes('/api/')) asked.push(r.url()); });

  try {
    // ── Online settings: one rule per real branch ──
    await page.goto(`${APP}/admin/online-settings`);
    const picker = page.getByLabel('Select Location');
    await picker.waitFor({ timeout: 20000 });
    check('the simple cut-off list of made-up locations is gone', (await page.getByText('Simple Cutoff Times').count()) === 0);
    await picker.click();
    const options = await page.getByRole('option').allInnerTexts();
    check('the location picker lists the real selling branches', options.length === branches.length && branches.every((b) => options.some((o) => o.startsWith(b.name))), `${options.length} of ${branches.length}`);
    await page.getByRole('option', { name: new RegExp(`^${target.locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(`) }).first().click();
    if (!target.isSet) check('a branch with no rule says so', await page.getByTestId('cutoff-not-set').isVisible());
    await page.getByLabel('Cutoff Time').first().fill('13:15');
    await page.getByRole('button', { name: /Save Cutoff Rules/ }).click();
    await page.getByText(/Cutoff rules saved/).waitFor({ timeout: 10000 });
    const after = (await call('GET', `/api/ecom/cutoff-rules/${target.locationId}`)).body.data;
    check('saving on the screen saves on the server', after.isSet === true && Object.values(after.divisionRules)[0].cutoffLocal === '13:15', after.divisionRules);
    check('the warning goes once the rule is saved', (await page.getByTestId('cutoff-not-set').count()) === 0);
    await page.reload();
    await page.getByLabel('Select Location').waitFor({ timeout: 20000 });
    await page.getByLabel('Select Location').click();
    await page.getByRole('option', { name: new RegExp(`^${target.locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(`) }).first().click();
    check('the saved time is still there after a reload', (await page.getByLabel('Cutoff Time').first().inputValue()) === '13:15');

    // ── The store: a session saved with a made-up location moves to a real branch ──
    asked.length = 0;
    await page.goto(`${APP}/shop`);
    await page.waitForFunction(() => { try { return Boolean(JSON.parse(localStorage.getItem('steelwise_customer_session')).locationId); } catch { return false; } }, null, { timeout: 20000 });
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('steelwise_customer_session')));
    check('the store session holds a real branch', branches.some((b) => b.id === session.locationId && b.name === session.locationName), session);
    await page.waitForTimeout(1500);
    check('the store never asks the server about a made-up location', !asked.some((u) => /loc-\d/.test(u)), asked.filter((u) => /loc-\d/.test(u)));

    // ── Promise preview on a phone-size screen ──
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto(`${APP}/mobile-rep/promise`);
    const branch = page.getByLabel('Branch');
    await branch.waitFor({ timeout: 20000 });
    await branch.click();
    const offered = await page.getByRole('option').allInnerTexts();
    check('the promise preview offers the real branches', offered.length === branches.length && branches.every((b) => offered.includes(b.name)), `${offered.length} of ${branches.length}`);
    const unset = rulesBefore.find((r) => !r.isSet && r.locationId !== target.locationId);
    if (unset) {
      await page.getByRole('option', { name: unset.locationName, exact: true }).first().click();
      await page.getByRole('button', { name: 'Check Promise' }).click();
      await page.getByText(/Cut-off times are not set/).first().waitFor({ timeout: 10000 });
      check('a branch with no cut-off rule promises nothing and says why', true);
    } else { await page.keyboard.press('Escape'); }
    check('the made-up tip about the earliest cut-off is gone', (await page.getByText(/typically has the earliest cutoff/).count()) === 0);
  } catch (e) {
    failed.push(`the walk stopped: ${String(e.message).slice(0, 300)}`);
  } finally {
    // Put the rule back as it was found.
    const { PrismaClient } = require(require('path').resolve(__dirname, '../../src/backend/node_modules/@prisma/client'));
    const prisma = new PrismaClient();
    const row = await prisma.appSetting.findUnique({ where: { key: 'online.cutoffRules' } });
    if (row && !target.isSet) { const value = { ...row.value }; delete value[target.locationId]; await prisma.appSetting.update({ where: { key: 'online.cutoffRules' }, data: { value } }); }
    await prisma.$disconnect();
    await browser.close();
  }
  console.log(`store branches screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
