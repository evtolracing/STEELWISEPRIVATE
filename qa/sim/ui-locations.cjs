#!/usr/bin/env node
// Managing locations (owner's request, 2026-11-22), in a real browser on the QA server and QA database:
// who may add, change, switch off and delete a location; what the screen and every branch list show after;
// and that a location with history is never deleted. Leaves its test locations switched off or deleted.
//   node qa/sim/ui-locations.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const PASSWORD = 'qa-password-1';
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };

(async () => {
  const signIn = async (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((r) => r.json());
  const call = async (who, method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const owner = await signIn('qa-admin@qa.test');
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const stamp = Date.now().toString(36).toUpperCase();
  const mk = async (role, more = {}) => { const email = `qa-loc-${role.toLowerCase()}-${stamp.toLowerCase()}@qa.test`; const made = await call(owner, 'POST', '/api/users', { email, password: PASSWORD, firstName: 'Loc', lastName: role, role, ...more }); return { ...(await signIn(email)), id: made.body?.id || made.body?.user?.id }; };
  const admin = await mk('ADMIN');
  const production = await mk('PRODUCTION_MANAGER', { homeLocationId: owner.user.homeLocationId || undefined });
  const coo = await mk('COO');
  if (!admin.token || !production.token || !coo.token) throw new Error('The test logins could not be made.');

  const code = `QL${stamp.slice(-6)}`;
  const body = { code, name: `QA Location ${stamp}`, addressLine1: '1298 Lipsey Dr.', city: 'Charlotte', state: 'MI', postalCode: '48813', phone: '(517) 541-2558', timezone: 'America/Detroit', hours: 'Mon-Fri 7AM-5PM', divisions: ['METALS'], processes: ['Saw Cutting'], squareFeet: 126600 };

  // ── Who may do what, at the server ──
  check('an admin cannot add a location', (await call(admin, 'POST', '/api/admin/locations', body)).status === 403);
  check('a production manager cannot add one (the old dispatch route let them)', (await call(production, 'POST', '/api/admin/locations', body)).status === 403);
  check('the old dispatch add route is gone', [403, 404].includes((await call(production, 'POST', '/api/v1/dispatch/locations', { name: `Old way ${stamp}` })).status) && [404].includes((await call(owner, 'POST', '/api/v1/dispatch/locations', { name: `Old way ${stamp}` })).status));
  check('a COO cannot add one', (await call(coo, 'POST', '/api/admin/locations', body)).status === 403);
  check('a location needs a name', (await call(owner, 'POST', '/api/admin/locations', { code: `${code}X` })).status === 400);
  const made = await call(owner, 'POST', '/api/admin/locations', body);
  const loc = made.body?.data;
  check('the super admin adds one, as a branch, with its details', made.status === 201 && loc?.code === code && loc?.isBranch === true && loc?.phone === body.phone && loc?.squareFeet === 126600 && loc?.divisions?.[0] === 'METALS', `${made.status} ${JSON.stringify(made.body).slice(0, 200)}`);
  check('the same code twice is refused', (await call(owner, 'POST', '/api/admin/locations', body)).status === 409);
  const edited = await call(admin, 'PUT', `/api/admin/locations/${loc.id}`, { phone: '(517) 555-0100', hours: 'Mon-Fri 6AM-4PM' });
  check('an admin changes its details, and only what was sent', edited.status === 200 && edited.body?.data?.phone === '(517) 555-0100' && edited.body?.data?.city === 'Charlotte' && edited.body?.data?.squareFeet === 126600, `${edited.status} ${JSON.stringify(edited.body).slice(0, 200)}`);
  check('a production manager cannot change it', (await call(production, 'PUT', `/api/admin/locations/${loc.id}`, { phone: '1' })).status === 403);
  check('an admin cannot switch it off or delete it', (await call(admin, 'POST', `/api/admin/locations/${loc.id}/deactivate`, {})).status === 403 && (await call(admin, 'DELETE', `/api/admin/locations/${loc.id}`)).status === 403);
  check('a bad state is refused with a sentence', (await call(admin, 'PUT', `/api/admin/locations/${loc.id}`, { state: 'Michigan' })).body?.error?.includes('two-letter'));

  // ── Every branch list offers it; a storage area is offered by none ──
  const inList = async (who, url, pick) => ((pick((await call(who, 'GET', url)).body)) || []).some((l) => l.id === loc.id || l.code === code);
  const lists = [['/api/orders/intake/branches', (b) => b?.data], ['/api/v1/dispatch/locations', (b) => b?.data], ['/api/users/locations', (b) => b], ['/api/inventory/locations?all=true', (b) => b]];
  const offered = [];
  for (const [url, pick] of lists) offered.push(await inList(owner, url, pick));
  check('the new branch is offered in every branch list', offered.every(Boolean), offered.join(','));
  const me = (await call(owner, 'GET', '/api/auth/me')).body;
  check('and in the top bar of a login that sees every branch', ((me?.user || me)?.branches || []).some((b) => b.id === loc.id), JSON.stringify(Object.keys(me || {})));
  const meProd = (await call(production, 'GET', '/api/auth/me')).body;
  check('a login held to its own branch does not get the new branch', !((meProd?.user || meProd)?.branches || []).some((b) => b.id === loc.id) && !(await inList(production, '/api/orders/intake/branches', (b) => b?.data)));
  const rack = (await call(owner, 'POST', '/api/admin/locations', { code: `${code}R`, name: `QA Rack ${stamp}`, type: 'RACK', isBranch: false, parentId: loc.id })).body?.data;
  const rackOffered = [];
  for (const [url, pick] of lists) rackOffered.push(((pick((await call(owner, 'GET', url)).body)) || []).some((l) => l.id === rack?.id));
  check('a storage area inside a branch is offered in no branch list', Boolean(rack) && rackOffered.every((x) => !x), rackOffered.join(','));
  check('a branch cannot be put inside another location', (await call(owner, 'PUT', `/api/admin/locations/${loc.id}`, { parentId: rack.id })).status === 400);

  // ── Switching off: blocked while people or storage areas are attached ──
  const clerkEmail = `qa-loc-clerk-${stamp.toLowerCase()}@qa.test`;
  const clerkMade = await call(owner, 'POST', '/api/users', { email: clerkEmail, password: PASSWORD, firstName: 'Loc', lastName: 'Clerk', role: 'CSR', homeLocationId: loc.id });
  const clerk = await signIn(clerkEmail);
  const clerkMe = (await call(clerk, 'GET', '/api/auth/me')).body;
  check('a person whose home is the new branch sees that branch and no other', ((clerkMe?.user || clerkMe)?.branches || []).length === 1 && ((clerkMe?.user || clerkMe)?.branches || [])[0]?.id === loc.id, JSON.stringify(((clerkMe?.user || clerkMe)?.branches || []).map((b) => b.code)));
  const blocked = await call(owner, 'POST', `/api/admin/locations/${loc.id}/deactivate`, {});
  check('it is not switched off while a person and a storage area are attached, and says what', blocked.status === 409 && (blocked.body?.blocks || []).some((b) => /home branch/.test(b)) && (blocked.body?.blocks || []).some((b) => /storage area/.test(b)), JSON.stringify(blocked.body).slice(0, 300));
  const detail = (await call(owner, 'GET', `/api/admin/locations/${loc.id}`)).body;
  check('its page says it was used, so it cannot be deleted', detail?.everUsed === true && detail?.used?.users === 1 && detail?.used?.children === 1, JSON.stringify(detail?.used));
  check('deleting a used location is refused with the reason', (await call(owner, 'DELETE', `/api/admin/locations/${loc.id}`)).status === 409);

  // ── The screen ──
  const browser = await chromium.launch();
  const open = async (who) => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); localStorage.removeItem('sw.branchId'); }, [who.token, who.user]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return { page, errors, context };
  };
  const top = await open(owner);
  if (process.env.DBG) top.page.on('response', (r) => { if (r.url().includes('/admin/locations') && r.request().method() !== 'GET') console.log(r.request().method(), r.status(), r.url()); });
  await top.page.goto(`${APP}/admin/locations`);
  const rowOf = (page, text) => page.locator('[data-testid="location-row"]', { hasText: text }).first();
  await rowOf(top.page, code).waitFor({ timeout: 20000 }).catch(() => {});
  let rowText = await rowOf(top.page, code).innerText().catch(() => '');
  check('the Locations screen lists the new branch with its address, phone and people', rowText.includes('1298 Lipsey Dr., Charlotte, MI 48813') && rowText.includes('(517) 555-0100') && /Branch/.test(rowText) && /Active/.test(rowText), rowText.replace(/\n/g, ' | '));
  check('the menu has Locations for the super admin', (await top.page.getByRole('link', { name: 'Locations', exact: true }).count()) > 0);
  check('the super admin has Add, Edit, Switch off and Delete', (await top.page.getByRole('button', { name: 'Add location' }).count()) === 1 && /Edit/.test(rowText) && /Switch off/.test(rowText) && /Delete/.test(rowText), rowText.replace(/\n/g, ' | '));

  // Add one through the form.
  const code2 = `QM${stamp.slice(-6)}`;
  await top.page.getByRole('button', { name: 'Add location' }).click();
  const dialog = top.page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Code', exact: true }).fill(code2.toLowerCase());
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(`QA Screen Branch ${stamp}`);
  await dialog.getByRole('textbox', { name: 'City', exact: true }).fill('Potterville');
  await dialog.getByRole('textbox', { name: 'State', exact: true }).fill('mi');
  await dialog.getByRole('textbox', { name: 'Phone', exact: true }).fill('(517) 645-9900');
  await dialog.getByRole('textbox', { name: 'Working hours', exact: true }).fill('Mon-Fri 7AM-5PM');
  await dialog.getByRole('button', { name: 'Add location' }).click();
  await rowOf(top.page, code2).waitFor({ timeout: 15000 }).catch(() => {});
  rowText = await rowOf(top.page, code2).innerText().catch(() => '');
  const all = (await call(owner, 'GET', '/api/admin/locations')).body?.data || [];
  const loc2 = all.find((l) => l.code === code2);
  check('a location added on the screen is saved as typed (code in capitals, state MI)', rowText.includes('Potterville, MI') && loc2?.state === 'MI' && loc2?.hours === 'Mon-Fri 7AM-5PM' && loc2?.isBranch === true, `${rowText.replace(/\n/g, ' | ')} ${JSON.stringify(loc2 && { state: loc2.state, hours: loc2.hours })}`);
  check('the screen says what to do next after adding', /Assign its people/.test(await top.page.locator('main').innerText()));

  // Edit it on the screen.
  await rowOf(top.page, code2).getByRole('button', { name: 'Edit' }).click();
  await top.page.getByRole('dialog').getByRole('textbox', { name: 'Phone', exact: true }).fill('(517) 645-0000');
  await top.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await top.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await rowOf(top.page, '(517) 645-0000').waitFor({ timeout: 15000 }).catch(() => {});
  const afterEdit = await rowOf(top.page, code2).innerText().catch(() => '');
  check('an edit on the screen is saved and the rest is kept', afterEdit.includes('(517) 645-0000') && ((await call(owner, 'GET', `/api/admin/locations/${loc2.id}`)).body?.data?.hours === 'Mon-Fri 7AM-5PM'), `${afterEdit.replace(/\n/g, ' | ')} ## ${(await top.page.getByRole('dialog').innerText().catch(() => 'no dialog')).slice(0, 200).replace(/\n/g, ' | ')}`);

  // Switch off dialog on the branch with a person: lists what is attached.
  await rowOf(top.page, code).getByRole('button', { name: 'Switch off' }).click();
  await top.page.locator('[data-testid="location-blocks"]').waitFor({ timeout: 15000 }).catch(() => {});
  const blocksText = await top.page.locator('[data-testid="location-blocks"]').innerText().catch(() => '');
  check('switching off shows what is still attached before anything happens', /home branch/.test(blocksText) && /storage area/.test(blocksText), blocksText.replace(/\n/g, ' | '));
  await top.page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  // Delete dialog on the used branch: refused with the reason; on the never-used one: deleted.
  await rowOf(top.page, code).getByRole('button', { name: 'Delete' }).click();
  await top.page.locator('[data-testid="location-used"]').waitFor({ timeout: 15000 }).catch(() => {});
  check('deleting a used location is not offered: the screen says why and the button is off', /cannot be deleted/.test(await top.page.locator('[data-testid="location-used"]').innerText().catch(() => '')) && await top.page.getByRole('dialog').getByRole('button', { name: 'Delete' }).isDisabled());
  await top.page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await rowOf(top.page, code2).getByRole('button', { name: 'Delete' }).click();
  await top.page.getByRole('dialog').getByText('It was never used').waitFor({ timeout: 15000 }).catch(() => {});
  await top.page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await top.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await rowOf(top.page, code2).waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  check('a location that was never used is deleted', (await call(owner, 'GET', `/api/admin/locations/${loc2.id}`)).status === 404 && (await rowOf(top.page, code2).count()) === 0);
  check('no script error on the super admin\'s screen', top.errors.length === 0, top.errors.join(' | ').slice(0, 300));

  // An admin: details only.
  const mid = await open(admin);
  await mid.page.goto(`${APP}/admin/locations`);
  await rowOf(mid.page, code).waitFor({ timeout: 20000 }).catch(() => {});
  const midRow = await rowOf(mid.page, code).innerText().catch(() => '');
  check('an admin sees Edit only, and is told who may add and remove', /Edit/.test(midRow) && !/Switch off/.test(midRow) && !/Delete/.test(midRow) && (await mid.page.getByRole('button', { name: 'Add location' }).count()) === 0 && /super admin or the tenant owner/.test(await mid.page.locator('main').innerText()), midRow.replace(/\n/g, ' | '));
  // A production manager: no menu entry, no page.
  const low = await open(production);
  await low.page.goto(`${APP}/admin/locations`);
  await low.page.waitForTimeout(2500);
  check('a production manager has no Locations menu and cannot open the page', (await low.page.getByRole('link', { name: 'Locations', exact: true }).count()) === 0 && (await low.page.locator('[data-testid="locations-table"]').count()) === 0, low.page.url());
  await browser.close();

  // ── Switch off for real: move the person, switch off the storage area, then the branch ──
  const home = owner.user.homeLocationId;
  check('people can only be moved to another active branch', (await call(owner, 'POST', `/api/admin/locations/${loc.id}/deactivate`, { moveUsersTo: rack.id })).status === 400);
  const rackOff = await call(owner, 'POST', `/api/admin/locations/${rack.id}/deactivate`, {});
  check('the storage area is switched off', rackOff.status === 200 && rackOff.body?.data?.isActive === false, JSON.stringify(rackOff.body).slice(0, 200));
  const off = home ? await call(owner, 'POST', `/api/admin/locations/${loc.id}/deactivate`, { moveUsersTo: home, reason: 'QA run' }) : { status: 0 };
  check('with its people moved to another branch it is switched off', off.status === 200 && off.body?.data?.isActive === false && Boolean(off.body?.data?.deactivatedAt), JSON.stringify(off.body).slice(0, 300));
  const clerkAfter = (await call(await signIn(clerkEmail), 'GET', '/api/auth/me')).body;
  check('the person moved now belongs to the other branch', ((clerkAfter?.user || clerkAfter)?.branches || []).length === 1 && ((clerkAfter?.user || clerkAfter)?.branches || [])[0]?.id === home, JSON.stringify(((clerkAfter?.user || clerkAfter)?.branches || []).map((b) => b.code)));
  const offeredAfter = [];
  for (const [url, pick] of lists) offeredAfter.push(await inList(owner, url, pick));
  const meAfter = (await call(owner, 'GET', '/api/auth/me')).body;
  check('a switched-off branch leaves every branch list and the top bar', offeredAfter.every((x) => !x) && !((meAfter?.user || meAfter)?.branches || []).some((b) => b.id === loc.id), offeredAfter.join(','));
  check('it is still on the Locations list, as switched off', ((await call(owner, 'GET', '/api/admin/locations')).body?.data || []).some((l) => l.id === loc.id && !l.isActive));
  const audit = (await call(owner, 'GET', `/api/admin/locations/${loc.id}/history`)).body;
  const events = (audit?.data || []).map((e) => e.eventType);
  check('the audit log has the add, the change and the switch-off', ['LOCATION_ADDED', 'LOCATION_CHANGED', 'LOCATION_DEACTIVATED'].every((e) => events.includes(e)), events.join(',') || JSON.stringify(audit).slice(0, 200));
  const on = await call(owner, 'POST', `/api/admin/locations/${loc.id}/reactivate`);
  check('it can be switched back on', on.status === 200 && on.body?.data?.isActive === true && on.body?.data?.deactivatedAt === null);
  await call(owner, 'POST', `/api/admin/locations/${loc.id}/deactivate`, { reason: 'QA clean-up' });

  console.log(`locations: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
