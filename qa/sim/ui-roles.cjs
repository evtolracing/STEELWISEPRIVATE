#!/usr/bin/env node
// Role matrix, phases 2 and 3: the Roles and permissions screens in a real browser, on the QA server and QA database.
//   node qa/sim/ui-roles.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
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
  const clerk = await signIn('qa-csr@qa.test');
  if (!owner.token || !clerk.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const stamp = Date.now().toString(36);
  const adminEmail = `qa-rolesui-admin-${stamp}@qa.test`;
  const made = await call(owner, 'POST', '/api/users', { email: adminEmail, password: PASSWORD, firstName: 'Roles', lastName: 'Screen', role: 'ADMIN' });
  const admin = await signIn(adminEmail);

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

  // ── A clerk has no Roles page ──
  {
    const { context, page } = await open(clerk);
    await page.goto(`${APP}/admin/roles`);
    await page.waitForTimeout(1500);
    check('a clerk is not shown the roles page', (await page.locator('[data-testid="roles-table"]').count()) === 0);
    await context.close();
  }

  // ── An administrator: list, open, grid, compare, save, history, reset ──
  const { context, page, errors } = await open(admin);
  await page.goto(`${APP}/admin/roles`);
  await page.waitForSelector('[data-testid="roles-table"] tbody tr');
  check('the list shows every role', (await page.locator('[data-testid="roles-table"] tbody tr').count()) >= 48);
  check('the page says when changes take effect', await page.locator('[data-testid="applies-now"]').isVisible() && (await page.locator('[data-testid="not-enforced"]').count()) === 0);
  check('the menu offers the page', (await page.getByText('Roles & Permissions').count()) > 0);
  await shot(page, 'roles-list');

  await page.click('[data-testid="open-SUPER_ADMIN"]');
  await page.waitForSelector('[data-testid="permission-grid"]');
  check('the super admin role shows everything ticked and nothing to change', await page.locator('[data-testid="perm-finance:activate"]').isChecked() && await page.locator('[data-testid="perm-orders:edit"]').isDisabled() && (await page.locator('[data-testid="save-role"]').count()) === 0);
  await page.click('[data-testid="back-to-roles"]');

  await page.click('[data-testid="open-QC_INSPECTOR"]');
  await page.waitForSelector('[data-testid="permission-grid"]');
  check('the grid shows what the role has', await page.locator('[data-testid="perm-quality:view"]').isChecked() && !(await page.locator('[data-testid="perm-billing:view"]').isChecked()));
  check('an administrator cannot tick a permission they do not hold', await page.locator('[data-testid="perm-finance:activate"]').isDisabled());
  check('nothing to save before a change', await page.locator('[data-testid="save-role"]').isDisabled());
  const menuBefore = await page.locator('[data-testid="menu-preview"]').innerText();
  await page.click('[data-testid="perm-executive:view"]');
  await page.click('[data-testid="perm-quality:delete"]');
  check('the count of changes follows the boxes', (await page.locator('[data-testid="change-count"]').innerText()).includes('1 added, 1 removed'));
  const menuAfter = await page.locator('[data-testid="menu-preview"]').innerText();
  check('the menu preview follows the View boxes', !menuBefore.includes('Executive') && menuAfter.includes('Executive'), menuAfter.slice(0, 120));
  await page.click('[data-testid="compare-with"]', { force: true }).catch(() => {});
  await page.locator('#compare, [aria-labelledby="compare"]').first().click().catch(() => {});
  await page.getByRole('option', { name: 'QC Manager' }).click();
  check('comparing highlights where two roles differ', (await page.locator('[data-differs="yes"]').count()) > 0);
  await shot(page, 'role-editor');
  await page.click('[data-testid="save-role"]');
  await page.waitForSelector('[data-testid="confirm-save"]');
  const dialog = await page.locator('[role="dialog"]').innerText();
  check('saving asks first and lists what changes', dialog.includes('Added (1)') && dialog.includes('Removed (1)') && dialog.includes('Executive dashboards: View'), dialog.slice(0, 200));
  await shot(page, 'role-confirm');
  await page.click('[data-testid="confirm-save"]');
  await page.waitForSelector('[data-testid="confirm-save"]', { state: 'detached' });
  await page.waitForTimeout(800);
  const roles = (await call(owner, 'GET', '/api/users/roles/list?all=1')).body;
  const qc = roles.find((r) => r.name === 'QC_INSPECTOR');
  check('the change is saved in the database', qc.grants.includes('executive:view') && !qc.grants.includes('quality:delete'));
  await page.waitForSelector('[data-testid="show-history"]');
  await page.click('[data-testid="show-history"]');
  await page.waitForSelector('[data-testid="role-history"] li');
  check('the history shows who changed what', (await page.locator('[data-testid="role-history"]').innerText()).includes('Roles Screen changed the role'));
  await shot(page, 'role-history');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid="role-history"]', { state: 'detached' });
  await page.click('[data-testid="reset-role"]');
  await page.getByText('is back to its default').waitFor({ timeout: 8000 }).catch(() => {});
  const back = (await call(owner, 'GET', `/api/users/roles/${qc.id}`)).body;
  check('reset to default puts the role back', back.grants.join() === back.defaults.grants.join(), `${back.grants.length} against ${back.defaults.grants.length}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="change-count"]')?.innerText === 'No changes' && document.querySelector('[data-testid="reset-role"]')?.disabled === true, null, { timeout: 8000 }).catch(() => {});
  check('and the grid shows the role as reset', await page.locator('[data-testid="perm-quality:delete"]').isChecked() && !(await page.locator('[data-testid="perm-executive:view"]').isChecked()));

  // ── A change reaches the clerk's menu and pages (phase 3) ──
  {
    const csr = (await call(owner, 'GET', '/api/users/roles/list?all=1')).body.find((r) => r.name === 'CSR');
    const menuOf = async () => {
      const c = await open(clerk);
      await c.page.goto(`${APP}/executive/cockpit`);
      await c.page.waitForTimeout(2500);
      const text = await c.page.locator('body').innerText();
      await c.context.close();
      return text;
    };
    const closed = await menuOf();
    check('before: the clerk has no executive pages', !closed.includes('Executive Cockpit'), closed.slice(0, 150));
    const given = await call(owner, 'PUT', `/api/users/roles/${csr.id}`, { grants: [...csr.grants, 'executive:view'] });
    check('the clerk role is given the executive pages', given.status === 200);
    const opened = await menuOf();
    check('after: the clerk\'s menu and the page itself are open', opened.includes('Executive Cockpit'), opened.slice(0, 150));
    const undone = await call(owner, 'POST', `/api/users/roles/${csr.id}/reset`, {});
    check('the clerk role is reset', undone.status === 200 && undone.body.grants.join() === csr.grants.join());
    check('reset: the executive pages are closed again', !(await menuOf()).includes('Executive Cockpit'));
  }

  // ── A new role as a copy, then deleted ──
  await page.click('[data-testid="back-to-roles"]');
  await page.click('[data-testid="new-role"]');
  await page.fill('[data-testid="new-role-name"]', `QA screen role ${stamp}`);
  await page.click('[data-testid="new-role-start"]');
  await page.waitForSelector('[data-testid="permission-grid"]');
  await page.click('[data-testid="perm-orders:view"]');
  await page.click('[data-testid="save-role"]');
  await page.click('[data-testid="confirm-save"]');
  await page.waitForTimeout(1200);
  const created = (await call(owner, 'GET', '/api/users/roles/list?all=1')).body.find((r) => r.displayName === `QA screen role ${stamp}`);
  check('a new role is created from the screen', Boolean(created) && created.grants.join() === 'orders:view' && !created.builtIn);
  if (created) check('and can be deleted while nobody holds it', (await call(owner, 'DELETE', `/api/users/roles/${created.id}`)).status === 200);
  check('no script error on the roles screens', errors.length === 0, errors.join(' | ').slice(0, 300));
  await context.close();
  await browser.close();
  if (made.body?.id) await call(owner, 'DELETE', `/api/users/${made.body.id}`);

  console.log(`roles screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
