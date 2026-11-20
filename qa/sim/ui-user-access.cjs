#!/usr/bin/env node
// Role matrix, phase 4: the Roles & access dialog on the Users page in a real browser, on the QA server and QA database.
//   node qa/sim/ui-user-access.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
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
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 200)}`); };

(async () => {
  const signIn = async (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((r) => r.json());
  const call = async (who, method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const owner = await signIn('qa-admin@qa.test');
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const stamp = Date.now().toString(36);
  const email = { admin: `qa-accessui-admin-${stamp}@qa.test`, clerk: `qa-accessui-clerk-${stamp}@qa.test` };
  const madeAdmin = await call(owner, 'POST', '/api/users', { email: email.admin, password: PASSWORD, firstName: 'Access', lastName: 'Screen', role: 'ADMIN' });
  const madeClerk = await call(owner, 'POST', '/api/users', { email: email.clerk, password: PASSWORD, firstName: 'Casey', lastName: `Clerk${stamp}`, role: 'CSR', homeLocationId: owner.user.homeLocationId || undefined });
  const clerkId = madeClerk.body?.id || madeClerk.body?.user?.id;
  const floor = await call(owner, 'POST', '/api/users/roles', { displayName: `QA screen floor ${stamp}`, grants: ['general:view', 'orders:view', 'inventory:view'], branchScope: 'OWN' });
  const ledger = await call(owner, 'POST', '/api/users/roles', { displayName: `QA screen ledger ${stamp}`, grants: ['finance:view'], branchScope: 'ALL' });
  check('the run\'s logins and roles are made', madeAdmin.status === 201 && madeClerk.status === 201 && floor.status === 201 && ledger.status === 201, [madeAdmin.status, madeClerk.status, floor.status, ledger.status]);
  const admin = await signIn(email.admin);
  const access = async () => (await call(owner, 'GET', `/api/users/${clerkId}/access`)).body;

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [admin.token, admin.user]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
  const pick = async (label, option) => { await page.getByRole('dialog').getByLabel(label, { exact: true }).click(); await page.getByRole('option', { name: option }).click(); };
  const save = async () => { await page.click('[data-testid="save-access"]'); await page.waitForSelector('[data-testid="access-saved"]', { timeout: 8000 }); };
  const openFor = async (mail) => {
    await page.goto(`${APP}/admin/users`);
    await page.getByPlaceholder('Search by name or email...').fill(mail);
    await page.waitForSelector(`[data-testid="user-menu-${mail}"]`, { timeout: 10000 });
    await page.click(`[data-testid="user-menu-${mail}"]`);
    await page.click('[data-testid="open-access"]');
    await page.waitForSelector('[data-testid="main-role"]');
  };

  // ── Roles ──
  await openFor(email.clerk);
  check('the dialog shows the person\'s main role', (await page.locator('[data-testid="main-role"]').innerText()).includes('built-in role'));
  check('nothing to save before a change', await page.locator('[data-testid="save-access"]').isDisabled());
  await pick('Add a role', new RegExp(`QA screen ledger ${stamp}`));
  await page.fill('[data-testid="extra-until-0"]', new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10));
  await shot('access-roles');
  await save();
  let now = await access();
  check('an extra role with an end date is saved from the screen', now.extras.length === 1 && now.extras[0].counts && Boolean(now.extras[0].expiresAt) && now.effective.permissions.includes('finance:view'), now.extras);

  // ── Exceptions ──
  await page.click('[data-testid="tab-exceptions"]');
  check('an exception cannot be added without a reason', await page.locator('[data-testid="add-exception"]').isDisabled());
  await pick('Permission', 'Customers and contacts: Edit');
  check('still not without a reason', await page.locator('[data-testid="add-exception"]').isDisabled());
  await page.fill('[data-testid="exception-reason"]', 'New starter, read only');
  await page.click('[data-testid="add-exception"]');
  await shot('access-exceptions');
  await save();
  now = await access();
  check('a denial with its reason is saved from the screen', now.exceptions.length === 1 && now.exceptions[0].effect === 'DENY' && now.exceptions[0].reason === 'New starter, read only' && !now.effective.permissions.includes('customers:edit'), now.exceptions);
  check('the extra role was left as it was', now.extras.length === 1);

  // ── What they can do ──
  await page.click('[data-testid="tab-effective"]');
  await page.waitForSelector('[data-testid="effective-access"]');
  check('the result shows the denial and the permission from the extra role', (await page.locator('[data-testid="denied-customers:edit"]').count()) === 1 && (await page.locator('[data-testid="has-finance:view"]').count()) === 1 && (await page.locator('[data-testid="has-orders:edit"]').count()) === 1);
  check('and which branches the person sees', (await page.locator('[data-testid="effective-access"]').innerText()).includes('Every branch'));
  await shot('access-effective');

  // ── A custom main role ──
  await page.click('[data-testid="tab-roles"]');
  await pick('Use a custom role as the main role', new RegExp(`QA screen floor ${stamp}`));
  await save();
  now = await access();
  check('a custom main role is saved from the screen', now.mainRole.custom && now.mainRole.displayName.startsWith('QA screen floor') && now.user.role === 'VIEWER' && !now.effective.permissions.includes('orders:edit') && now.effective.permissions.includes('orders:view'), now.mainRole);
  check('the dialog shows it', (await page.locator('[data-testid="main-role"]').innerText()).includes('custom role'));

  // ── History ──
  await page.click('[data-testid="tab-history"]');
  await page.waitForSelector('[data-testid="access-history"] li');
  const told = await page.locator('[data-testid="access-history"]').innerText();
  check('the history says who changed what', told.includes('Access Screen changed the main role') && told.includes('the exceptions') && told.includes('the extra roles'), told.slice(0, 200));
  await shot('access-history');

  // ── The person's own menu follows ──
  const clerk = await signIn(email.clerk);
  const theirs = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await theirs.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [clerk.token, clerk.user]);
  const their = await theirs.newPage();
  await their.goto(`${APP}/finance`);
  await their.waitForTimeout(2500);
  const seen = await their.locator('body').innerText();
  check('the person\'s own screen opens the finance pages their extra role gives', !seen.includes('No access'), seen.slice(-200));
  await their.goto(`${APP}/orders/new`);
  await their.waitForTimeout(1500);
  await theirs.close();

  // ── A super admin login: nothing to set ──
  await openFor('qa-admin@qa.test');
  check('a super admin login says it holds everything and offers nothing to change', (await page.locator('[data-testid="access-locked"]').count()) === 1 && (await page.locator('[data-testid="add-extra-role"]').count()) === 0 && await page.locator('[data-testid="save-access"]').isDisabled());
  check('no script error on the dialog', errors.length === 0, errors.join(' | ').slice(0, 300));

  await context.close();
  await browser.close();
  // Clean up: the person back to a built-in role with nothing on top, the roles and the logins gone.
  await call(owner, 'PUT', `/api/users/${clerkId}/access`, { extras: [], exceptions: [], primaryRoleId: null });
  const gone = [await call(owner, 'DELETE', `/api/users/roles/${floor.body.id}`), await call(owner, 'DELETE', `/api/users/roles/${ledger.body.id}`)];
  check('the run\'s roles are deleted', gone.every((g) => g.status === 200), gone.map((g) => g.status));
  for (const made of [madeAdmin, madeClerk]) await call(owner, 'DELETE', `/api/users/${made.body?.id || made.body?.user?.id}`);

  console.log(`user access screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
