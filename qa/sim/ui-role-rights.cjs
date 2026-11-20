#!/usr/bin/env node
// Role matrix, phase 5: the new single rights, switching a custom role off, and View as for a custom role,
// in a real browser on the QA server and QA database.
//   node qa/sim/ui-role-rights.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
// Needs the frontend dev server and a QA backend on port 3001 (qa/README.md). Leaves no test role behind.
const fs = require('node:fs');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const SHOTS = arg('shots', '');
const PASSWORD = 'qa-password-1';
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${detail}`); };

(async () => {
  const signIn = async (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((r) => r.json());
  const call = async (who, method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const owner = await signIn('qa-admin@qa.test');
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const stamp = Date.now().toString(36);
  const clerkEmail = `qa-rightsui-clerk-${stamp}@qa.test`;
  const madeClerk = await call(owner, 'POST', '/api/users', { email: clerkEmail, password: PASSWORD, firstName: 'Rights', lastName: 'Clerk', role: 'CSR' });
  const clerk = await signIn(clerkEmail);
  const R = '/api/users/roles';
  const role = (await call(owner, 'POST', R, { displayName: `QA counter helper ${stamp}`, grants: ['general:view', 'orders:view', 'inventory:view'], branchScope: 'ASSIGNED' })).body;

  const browser = await chromium.launch();
  const open = async (who) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return { context, page, errors };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); } };

  // ── The new rights are boxes in the grid, ticked for the roles whose names held them ──
  const { context, page, errors } = await open(owner);
  await page.goto(`${APP}/admin/roles`);
  await page.waitForSelector('[data-testid="roles-table"] tbody tr');
  const ticked = async (name, keys) => {
    await page.click(`[data-testid="open-${name}"]`);
    await page.waitForSelector('[data-testid="permission-grid"]');
    const out = {};
    for (const k of keys) out[k] = await page.locator(`[data-testid="perm-${k}"]`).isChecked();
    return out;
  };
  const NEW = ['sales:editProducts', 'sales:editGrades', 'sales:setListPrice', 'sales:approveOverride', 'customers:setCredit', 'orders:releaseCreditHold', 'inventory:adjust', 'jobs:releaseQualityHold', 'staff:viewPay', 'dropTags:override'];
  const stock = await ticked('INVENTORY_MANAGER', NEW);
  check('the inventory manager holds stock corrections, products and tag overrides, and not credit or pay', stock['inventory:adjust'] && stock['sales:editProducts'] && stock['dropTags:override'] && !stock['customers:setCredit'] && !stock['staff:viewPay'] && !stock['jobs:releaseQualityHold'], JSON.stringify(stock));
  const text = await page.locator('[data-testid="permission-grid"]').innerText();
  check('each right is named in plain words', ['Correct a stock balance', 'credit limit', 'Release an order from credit hold', 'what operators are paid'].every((w) => text.toLowerCase().includes(w.toLowerCase())), text.slice(0, 200));
  await shot(page, 'rights-inventory-manager');
  await page.click('[data-testid="back-to-roles"]');
  const csr = await ticked('CSR', NEW);
  check('a clerk holds none of them', NEW.every((k) => !csr[k]), JSON.stringify(csr));
  await page.click('[data-testid="back-to-roles"]');
  const manager = await ticked('BRANCH_MANAGER', NEW);
  check('a branch manager holds the money rights, and not the quality hold', manager['sales:setListPrice'] && manager['customers:setCredit'] && manager['orders:releaseCreditHold'] && manager['sales:approveOverride'] && !manager['jobs:releaseQualityHold'], JSON.stringify(manager));

  // ── Unticking one in the grid is saved and asked about as sensitive ──
  await page.click('[data-testid="perm-customers:setCredit"]');
  await page.click('[data-testid="save-role"]');
  await page.waitForSelector('[data-testid="confirm-save"]');
  const dialog = await page.locator('[role="dialog"]').innerText();
  check('saving warns that a sensitive right changes', dialog.includes('Removed (1)') && dialog.includes('Sensitive'), dialog.slice(0, 200));
  await page.click('[data-testid="confirm-save"]');
  await page.waitForSelector('[data-testid="confirm-save"]', { state: 'detached' });
  await page.waitForTimeout(800);
  const roles = (await call(owner, 'GET', `${R}/list?all=1`)).body;
  const bm = roles.find((r) => r.name === 'BRANCH_MANAGER');
  check('the unticked right is gone and the other new rights stay', !bm.grants.includes('customers:setCredit') && bm.grants.includes('sales:setListPrice') && bm.grants.includes('orders:releaseCreditHold'), bm.grants.filter((g) => NEW.includes(g)).join());
  await page.click('[data-testid="reset-role"]');
  await page.getByText('is back to its default').waitFor({ timeout: 8000 }).catch(() => {});
  const back = (await call(owner, 'GET', `${R}/${bm.id}`)).body;
  check('reset gives it back', back.grants.includes('customers:setCredit'));
  await page.click('[data-testid="back-to-roles"]');

  // ── A custom role is switched off and on from its page ──
  await page.waitForSelector(`[data-testid="open-${role.name}"]`);
  await page.click(`[data-testid="open-${role.name}"]`);
  await page.waitForSelector('[data-testid="switch-role"]');
  check('a custom role offers Switch off', (await page.locator('[data-testid="switch-role"]').innerText()).trim().toLowerCase() === 'switch off' && await page.locator('[data-testid="switch-role"]').isEnabled());
  await page.click('[data-testid="switch-role"]');
  await page.waitForSelector('[data-testid="role-off"]');
  check('it is shown as switched off', (await call(owner, 'GET', `${R}/${role.id}`)).body.isActive === false && (await page.locator('[data-testid="role-notice"]').innerText()).includes('switched off'));
  await shot(page, 'role-switched-off');
  await page.click('[data-testid="switch-role"]');
  await page.waitForSelector('[data-testid="role-off"]', { state: 'detached' });
  check('and switched on again', (await call(owner, 'GET', `${R}/${role.id}`)).body.isActive === true);
  await page.click('[data-testid="back-to-roles"]');
  await page.click('[data-testid="open-CSR"]');
  await page.waitForSelector('[data-testid="permission-grid"]');
  check('a built-in role has no Switch off', (await page.locator('[data-testid="switch-role"]').count()) === 0);

  // ── View as: the custom role, from the top bar ──
  await page.goto(`${APP}/admin/roles`);
  await page.waitForSelector('[data-testid="roles-table"] tbody tr');
  await page.locator('#mui-component-select-undefined, [aria-labelledby*="view-as-label"]').first().click();
  await page.waitForSelector(`[data-testid="view-as-${role.name}"]`);
  check('the View as list has a Custom roles part', (await page.getByText('Custom roles').count()) > 0);
  await page.click(`[data-testid="view-as-${role.name}"]`);
  await page.waitForSelector('[data-testid="preview-banner"]');
  const banner = await page.locator('[data-testid="preview-banner"]').innerText();
  check('the banner names the custom role', banner.includes(`Previewing as QA counter helper ${stamp}`), banner.slice(0, 160));
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText();
  check('the preview shows the role\'s menu: no administration, no roles page', !body.includes('Roles & Permissions') && (await page.locator('[data-testid="roles-table"]').count()) === 0, body.slice(0, 200));
  await shot(page, 'view-as-custom-role');
  await page.getByRole('button', { name: 'End preview' }).click();
  await page.waitForSelector('[data-testid="preview-banner"]', { state: 'detached' });
  await page.getByText('Roles & Permissions').first().waitFor({ timeout: 8000 }).catch(() => {});
  check('ending the preview brings the administrator\'s own menu back', (await page.getByText('Roles & Permissions').count()) > 0);
  check('no script error on the screens', errors.length === 0, errors.join(' | ').slice(0, 300));
  await context.close();

  // ── The list price button follows the right, not the role's name ──
  const priceButtons = async () => {
    const c = await open(await signIn(clerkEmail));
    await c.page.goto(`${APP}/pricing`);
    await c.page.waitForTimeout(3500);
    const n = await c.page.getByRole('button', { name: /Change the list price of/ }).count();
    const rows = await c.page.locator('table tbody tr').count();
    await c.context.close();
    return { n, rows };
  };
  const without = await priceButtons();
  check('a clerk sees the price list without a Change button', without.rows > 0 && without.n === 0, JSON.stringify(without));
  const gave = await call(owner, 'PUT', `/api/users/${madeClerk.body.id}/access`, { extras: [], exceptions: [{ permission: 'sales:setListPrice', effect: 'GRANT', reason: 'Keeps the price list this month' }] });
  const withRight = await priceButtons();
  check('given the right, the same clerk is offered Change', gave.status === 200 && withRight.n > 0, JSON.stringify(withRight));

  await browser.close();
  await call(owner, 'PUT', `/api/users/${madeClerk.body.id}/access`, { extras: [], exceptions: [] });
  check('the test role is deleted', (await call(owner, 'DELETE', `${R}/${role.id}`)).status === 200);
  if (madeClerk.body?.id) await call(owner, 'DELETE', `/api/users/${madeClerk.body.id}`);
  void clerk;

  console.log(`role rights screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
