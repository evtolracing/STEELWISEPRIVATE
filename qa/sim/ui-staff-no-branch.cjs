#!/usr/bin/env node
// Staff with no branch are shown on the Users screen (2026-11-22). A login held to branches with no branch on
// file signs in and sees nothing that belongs to a branch; before this nothing on any screen said so.
//   node qa/sim/ui-staff-no-branch.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };

(async () => {
  if (!/(localhost|127\.0\.0\.1).*qa/.test(process.env.DATABASE_URL || '')) throw new Error('Refusing: DATABASE_URL is not a local QA database');
  const { PrismaClient } = require(path.resolve(__dirname, '../../src/backend/node_modules/@prisma/client'));
  const prisma = new PrismaClient();
  const signIn = async (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const owner = await signIn('qa-admin@qa.test');
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const as = (token) => async (url) => (await fetch(API + url, { headers: { authorization: `Bearer ${token}` } })).json();
  const admin = as(owner.token);
  const manager = as((await signIn('qa-branch-a@qa.test')).token);

  const stamp = Date.now().toString(36);
  const me = await prisma.user.findUnique({ where: { id: owner.user.id }, select: { organizationId: true, passwordHash: true } });
  const mk = (n, more) => prisma.user.create({ data: { email: `qa-nobranch-${n}-${stamp}@qa.test`, passwordHash: me.passwordHash, firstName: 'Nobranch', lastName: `Person${n}${stamp}`, role: 'CSR', organizationId: me.organizationId, ...more } });
  const branch = await prisma.location.findFirst({ where: { code: 'QA-L01' } });
  const made = [await mk(1, {}), await mk(2, { homeLocationId: branch.id }), await mk(3, { isActive: false }), await mk(4, { role: 'ADMIN' })];
  const EXEMPT = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'OPS_MANAGER', 'SALES_DIRECTOR', 'CREDIT_MANAGER', 'DATA_ANALYST', 'AUDITOR', 'INTEGRATION_ADMIN'];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [owner.token, owner.user]);
  const page = await context.newPage();
  try {
    const all = await admin('/api/users?limit=5');
    const only = await admin('/api/users?noBranch=true&limit=500');
    check('the count is on the users list', Number.isInteger(all.noBranchCount) && all.noBranchCount >= 1, all.noBranchCount);
    check('asking for them lists exactly that many, each flagged', only.users.length === all.noBranchCount && only.users.every((u) => u.noBranch === true), `${only.users.length} vs ${all.noBranchCount}`);
    const ids = only.users.map((u) => u.id);
    check('the login with no branch is listed; the ones with a branch, switched off, or seeing every branch are not', ids.includes(made[0].id) && !ids.includes(made[1].id) && !ids.includes(made[2].id) && !ids.includes(made[3].id));
    const inDb = await prisma.user.findMany({ where: { id: { in: ids } }, select: { role: true, isActive: true, homeLocationId: true, userLocations: { select: { id: true } } } });
    check('every listed login is active staff held to branches with none on file, by the database', inDb.length === ids.length && inDb.every((u) => u.isActive && !u.homeLocationId && u.userLocations.length === 0 && !EXEMPT.includes(u.role) && !/^(CUSTOMER_|SUPPLIER_|CARRIER_)/.test(u.role)), inDb.filter((u) => u.homeLocationId).length);
    const mine = await manager('/api/users?limit=5');
    check('a branch manager is not shown people outside their branches by this count', mine.noBranchCount === 0, mine.noBranchCount);

    await page.goto(`${APP}/admin/users`);
    const note = page.getByTestId('users-no-branch');
    await note.waitFor({ timeout: 20000 });
    check('the Users screen says how many staff have no branch', (await note.innerText()).includes(`${all.noBranchCount} active staff`), await note.innerText());
    await page.getByTestId('users-no-branch-toggle').click();
    await page.getByText(made[0].email).first().waitFor({ timeout: 15000 });
    const rows = await page.locator('tbody tr').count();
    check('Show them lists those logins, each marked No branch', rows >= 1 && (await page.getByTestId('user-no-branch').count()) === rows, `${rows} rows`);
    // Give the login a branch: it leaves the list and the count drops by one.
    await prisma.user.update({ where: { id: made[0].id }, data: { homeLocationId: branch.id } });
    const after = await admin('/api/users?noBranch=true&limit=500');
    check('once a branch is chosen the login leaves the list', after.noBranchCount === all.noBranchCount - 1 && !after.users.some((u) => u.id === made[0].id), after.noBranchCount);
  } catch (e) {
    failed.push(`the walk stopped: ${String(e.message).slice(0, 300)}`);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: made.map((m) => m.id) } } });
    await prisma.$disconnect();
    await browser.close();
  }
  console.log(`staff with no branch: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
