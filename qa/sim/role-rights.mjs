#!/usr/bin/env node
// Role matrix, phase 5: the rights that used to follow a role's name now follow the boxes in the grid.
//   node qa/sim/role-rights.mjs [--base http://localhost:3011]
// Makes a clerk, gives the clerk a custom role on top, and checks each single right opens its door only
// while its box is ticked. Then previews a custom role and switches one off. Local QA database only.
// Leaves no test role behind.
import { api, assertSafeDatabase, QA_PASSWORD, QA_USERS } from './lib.mjs';

assertSafeDatabase();
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3011';
const a = api(base);
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 220)}`); };
const R = '/api/users/roles';
const NOBODY = '00000000-0000-0000-0000-000000000000';
const stamp = Date.now().toString(36);

await a.login('admin');
await a.login('csr');
const me = await a.get('/api/auth/me');
const home = me.body?.user?.homeLocationId || me.body?.homeLocationId || undefined;
const make = async (key, role) => {
  QA_USERS[key] = `qa-rights-${key}-${stamp}@qa.test`;
  const r = await a.post('/api/users', { email: QA_USERS[key], password: QA_PASSWORD, firstName: 'Rights', lastName: key, role, homeLocationId: home });
  check(`a ${role} login is made for the run`, r.status === 201, r.body);
  await a.login(key);
  return r.body?.id || r.body?.user?.id;
};
const targetId = await make('target', 'CSR');
const managerId = await make('manager', 'BRANCH_MANAGER');
const A = (id) => `/api/users/${id}/access`;

// Each right, the request it guards, and what the server says when the right is missing.
const DOORS = [
  ['orders:releaseCreditHold', 'POST', `/api/orders/${NOBODY}/credit-release`, {}, /credit hold needs a manager/],
  ['jobs:releaseQualityHold', 'PUT', `/api/work-orders/${NOBODY}/release-hold`, {}, /quality hold is released by/],
  ['sales:editProducts', 'POST', '/api/products', {}, /Adding a product needs/],
  ['sales:editGrades', 'POST', '/api/grades', {}, /Adding a grade needs/],
  ['sales:setListPrice', 'PUT', `/api/pricing/list-price/${NOBODY}`, {}, /list price needs a manager/],
  ['inventory:adjust', 'POST', '/api/inventory/adjust', {}, /Correcting a stock balance/],
  ['sales:approveOverride', 'POST', `/api/pos/sessions/${NOBODY}/pricing/discount/${NOBODY}/approve`, {}, /Only a manager can approve a discount/],
  ['sales:approveOverride', 'GET', '/api/overrides/stats', undefined, /Only a manager can do this/],
];
const knock = async ([, method, url, body], who) => a.call(method, url, body, who);
const shut = async (door, who) => { const r = await knock(door, who); return r.status === 403 && door[4].test(r.body?.error || ''); };
const RIGHTS = [...new Set(DOORS.map((d) => d[0]))];
// What lets the requests through the front gate, so only the single right decides.
const WAY_IN = ['general:view', 'general:create', 'general:edit', 'orders:view', 'orders:create', 'production:view', 'jobs:edit', 'inventory:view', 'inventory:create', 'counterSales:create', 'sales:view'];

// ── The built-in roles hold what their names held ──
for (const door of DOORS) {
  check(`${door[0]}: a clerk is refused (${door[1]} ${door[2].split('/').slice(0, 4).join('/')})`, (await knock(door, 'target')).status === 403);
  // A quality hold was never a branch manager's to release: quality staff and the production manager release it.
  if (door[0] === 'jobs:releaseQualityHold') { check(`${door[0]}: a branch manager is refused, as before`, await shut(door, 'manager')); continue; }
  const r = await knock(door, 'manager');
  check(`${door[0]}: a branch manager is let through`, r.status !== 403, r);
}
QA_USERS.quality = `qa-rights-quality-${stamp}@qa.test`;
const qualityId = (await a.post('/api/users', { email: QA_USERS.quality, password: QA_PASSWORD, firstName: 'Rights', lastName: 'quality', role: 'QC_MANAGER', homeLocationId: home })).body?.id;
await a.login('quality');
const release = await knock(DOORS[1], 'quality');
check('jobs:releaseQualityHold: the quality manager is let through', release.status !== 403, release);
check('sales:editGrades: the quality manager keeps the grade list, and not the products', (await knock(DOORS[3], 'quality')).status !== 403 && (await knock(DOORS[2], 'quality')).status === 403);
const mine = (await a.get('/api/auth/me', 'manager')).body;
check('a branch manager\'s sign-in lists the new rights', RIGHTS.filter((p) => p !== 'jobs:releaseQualityHold').every((p) => (mine.user?.permissions || mine.permissions || []).includes(p)) && !(mine.user?.permissions || []).includes('jobs:releaseQualityHold'));
const catalog = (await a.get(`${R}/catalog`)).body;
const boxes = catalog.areas.flatMap((x) => x.special.map((s) => `${x.id}:${s.action}`));
check('every one of the rights is a box in the grid', [...RIGHTS, 'customers:setCredit', 'staff:viewPay', 'dropTags:override'].every((p) => boxes.includes(p)));
const list = (await a.get(`${R}/list?all=1`)).body;
check('no role shows the catalog mark among its permissions', list.every((r) => r.grants.every((p) => !String(p).startsWith('@'))));

// ── A custom role on top: the way in, without the rights ──
const doorsRole = await a.post(R, { displayName: `QA way in ${stamp}`, grants: WAY_IN, branchScope: 'ASSIGNED' });
check('a custom role is made', doorsRole.status === 201 && doorsRole.body.grants.every((p) => !String(p).startsWith('@')), doorsRole.body);
const rightsRole = await a.post(R, { displayName: `QA single rights ${stamp}`, grants: RIGHTS });
check('a custom role holding the single rights is made', rightsRole.status === 201 && RIGHTS.every((p) => rightsRole.body.grants.includes(p)), rightsRole.body);
let given = await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }] });
check('the way-in role is given to the clerk', given.status === 200, given.body);
for (const door of DOORS) check(`${door[0]}: the way in alone does not open it`, await shut(door, 'target'));

given = await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }, { roleId: rightsRole.body.id }] });
check('the rights role is given to the clerk', given.status === 200, given.body);
for (const door of DOORS) { const r = await knock(door, 'target'); check(`${door[0]}: the ticked box opens it`, r.status !== 403, r); }

// ── Unticking one box closes its door and no other ──
for (const right of RIGHTS) {
  const without = await a.put(`${R}/${rightsRole.body.id}`, { grants: RIGHTS.filter((p) => p !== right) });
  check(`${right}: the box is unticked`, without.status === 200 && !without.body.grants.includes(right), without.body);
  for (const door of DOORS) {
    const closed = await shut(door, 'target');
    check(`${right} unticked: ${door[0]} at ${door[2].split('/').slice(2, 4).join('/')} is ${door[0] === right ? 'closed' : 'still open'}`, closed === (door[0] === right));
  }
}
await a.put(`${R}/${rightsRole.body.id}`, { grants: RIGHTS });

// ── A single exception on the person does the same ──
given = await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }], exceptions: [{ permission: 'inventory:adjust', effect: 'GRANT', reason: 'Covers the stock count this week' }] });
check('the right is given to the person alone', given.status === 200, given.body);
const adjust = DOORS.find((d) => d[0] === 'inventory:adjust');
check('the exception opens stock corrections and nothing else', !(await shut(adjust, 'target')) && await shut(DOORS[0], 'target'));
given = await a.put(A(managerId), { extras: [], exceptions: [{ permission: 'inventory:adjust', effect: 'DENY', reason: 'Not while the audit runs' }] });
check('the right is taken from one manager', given.status === 200, given.body);
check('that manager is refused, and keeps the other rights', await shut(adjust, 'manager') && !(await shut(DOORS[0], 'manager')));
await a.put(A(managerId), { extras: [], exceptions: [] });

// ── Pay rates on the operator list ──
const pay = async (who) => { const row = (await a.get('/api/staff/operators', who)).body?.data?.[0]; return row ? 'hourlyRate' in row && 'emergencyContactPhone' in row : null; };
check('there is an operator to look at', (await pay('manager')) !== null);
check('pay rates and emergency contacts are sent to the manager and not to the clerk', (await pay('manager')) === true && (await pay('target')) === false);
given = await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }], exceptions: [{ permission: 'staff:viewPay', effect: 'GRANT', reason: 'Runs payroll while the manager is away' }] });
check('with the right given, the clerk is sent them', given.status === 200 && (await pay('target')) === true, given.body);

// ── A customer's credit limit and pricing tier ──
const customer = await a.post('/api/customers', { name: `QA credit ${stamp}`, code: `QACR-${stamp}`.toUpperCase(), type: 'OEM' });
const customerId = customer.body?.id || customer.body?.data?.id;
check('a customer is made for the run', customer.status === 201 && Boolean(customerId), customer.body);
const limit = (who, amount) => a.put(`/api/customers/${customerId}/preferences`, { creditLimit: amount }, who);
const refusedLimit = await limit('target', 25000);
check('a clerk cannot set a credit limit', refusedLimit.status === 403 && /pricing tier or credit limit/.test(refusedLimit.body?.error || ''), refusedLimit);
given = await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }], exceptions: [{ permission: 'customers:setCredit', effect: 'GRANT', reason: 'Covers credit this week' }] });
const setLimit = await limit('target', 25000);
check('with the right given, the clerk sets it', given.status === 200 && setLimit.status === 200, setLimit);
check('the manager sets it too', (await limit('manager', 30000)).status === 200);

// ── The credit hold list tells the screen whether to offer Release ──
const holds = async (who) => (await a.get('/api/orders/credit-holds', who)).body?.canRelease;
check('the credit hold list offers Release to the manager and not to the clerk', (await holds('manager')) === true && (await holds('target')) === false, [await holds('manager'), await holds('target')]);

// ── View as: a custom role ──
const token = async (who) => (await (await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: QA_PASSWORD }) })).json()).token;
const as = async (who, role, method, url, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${await token(who)}`, 'x-view-as-role': role }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const own = (await a.get('/api/auth/me')).body.user;
check('the top bar is offered the custom roles to preview', (own.previewableCustomRoles || []).some((r) => r.name === doorsRole.body.name) && own.previewableCustomRoles.some((r) => r.name === rightsRole.body.name), own.previewableCustomRoles);
const seen = (await as('admin', doorsRole.body.name, 'GET', '/api/auth/me')).body.user;
check('previewing a custom role: its name is shown and the login carries the role it stands on', seen.previewRole === doorsRole.body.name && seen.previewLabel === doorsRole.body.displayName && seen.role === 'VIEWER' && seen.realRole === 'SUPER_ADMIN', { previewRole: seen.previewRole, role: seen.role, label: seen.previewLabel });
check('the preview holds exactly the custom role\'s permissions', seen.permissions.length === WAY_IN.length && WAY_IN.every((p) => seen.permissions.includes(p)), seen.permissions);
check('the preview is held to the administrator\'s branches when the role is', seen.branchScope !== 'ALL', seen.branchScope);
const peek = await as('admin', doorsRole.body.name, 'GET', '/api/ledger/status');
check('the preview cannot read what the role cannot (the ledger)', peek.status === 403, peek);
const write = await as('admin', doorsRole.body.name, 'POST', '/api/grades', {});
check('the preview is view-only', write.status === 403 && /previewing/.test(write.body?.error || ''), write);
// An administrator sees only the custom roles that hold nothing they lack.
const beyond = await a.post(R, { displayName: `QA books starter ${stamp}`, grants: ['finance:activate'] });
const adminId = await make('roleAdmin', 'ADMIN');
const adminSees = (await a.get('/api/auth/me', 'roleAdmin')).body.user;
check('an administrator is offered a custom role within their own permissions', (adminSees.previewableCustomRoles || []).some((r) => r.name === doorsRole.body.name));
check('and not one that holds more than they do', !(adminSees.previewableCustomRoles || []).some((r) => r.name === beyond.body.name));
const tooMuch = (await as('roleAdmin', beyond.body.name, 'GET', '/api/auth/me')).body.user;
check('asking for it anyway previews nothing', tooMuch.previewRole === null && tooMuch.role === 'ADMIN', { previewRole: tooMuch.previewRole, role: tooMuch.role });
const clerkTries = (await as('target', rightsRole.body.name, 'GET', '/api/auth/me')).body.user;
check('a clerk cannot preview any role', clerkTries.previewRole === null && (clerkTries.previewableCustomRoles || []).length === 0);
const unknown = (await as('admin', 'QA_NO_SUCH_ROLE', 'GET', '/api/auth/me')).body.user;
check('a role that does not exist previews nothing', unknown.previewRole === null);

// ── Switching a custom role off ──
const held = await a.put(`${R}/${doorsRole.body.id}`, { isActive: false });
check('a role people hold cannot be switched off', held.status === 400 && /Move them to another role first/.test(held.body.error), held.body);
await a.put(A(targetId), { extras: [], exceptions: [] });
const off = await a.put(`${R}/${doorsRole.body.id}`, { isActive: false });
check('with nobody holding it, it is switched off', off.status === 200 && off.body.isActive === false, off.body);
check('a switched-off role cannot be given', (await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }] })).status === 400);
check('nor previewed', !((await a.get('/api/auth/me')).body.user.previewableCustomRoles || []).some((r) => r.name === doorsRole.body.name) && (await as('admin', doorsRole.body.name, 'GET', '/api/auth/me')).body.user.previewRole === null);
const on = await a.put(`${R}/${doorsRole.body.id}`, { isActive: true });
check('it is switched on again and can be given', on.status === 200 && on.body.isActive === true && (await a.put(A(targetId), { extras: [{ roleId: doorsRole.body.id }] })).status === 200);
const history = (await a.get(`${R}/${doorsRole.body.id}/history`)).body;
check('switching off and on is in the role\'s history', Array.isArray(history) && history.filter((h) => h.event === 'ROLE_UPDATED').length >= 2, history?.length);

// ── Clean up ──
await a.put(A(targetId), { extras: [], exceptions: [] });
for (const id of [targetId, managerId, adminId, qualityId]) await a.put(`/api/users/${id}`, { isActive: false });
let gone = 0;
for (const role of [doorsRole, rightsRole, beyond]) if ((await a.call('DELETE', `${R}/${role.body.id}`)).status < 300) gone += 1;
check('the test roles are deleted', gone === 3, gone);

console.log(`role rights: ${passed} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAILED ${f}`);
process.exit(failed.length ? 1 : 0);
