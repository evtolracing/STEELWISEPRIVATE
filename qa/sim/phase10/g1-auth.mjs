// Group 1: authentication, sessions and roles, checked at the server.
export default async function auth(ctx) {
  const { S, G10, prisma, A, admin2, owner, sales, bm1, err, person, signIn, forge, as, QA_PASSWORD, jwt, users } = ctx;
  const g = G10.auth;
  const me = (t) => as(t).get('/api/auth/me');
  const sess = { init: 'A fresh login made for this scenario only', rec: 'The person signs in again with the current password' };

  await S(g, 'Changing your password ends every other sign-in of that login and keeps this one going with a new token', { ...sess, scope: 'The login itself', expect: 'Old token 401 SESSION_ENDED; the token in the answer works', sec: 'A stolen token stops working when the password is changed', db: 'User.passwordHash and tokensValidAfter change; one AuditLog row', audit: 'AuditLog AUTH/PASSWORD_CHANGED' }, async (ok) => {
    const p = await person('CSR');
    const other = (await signIn(p.user.email)).body.token;
    const r = await as(p.token).put('/api/auth/password', { currentPassword: QA_PASSWORD, newPassword: 'Changed-pass-1' });
    ok('changed', r.status === 200 && r.body.token, `${r.status} ${err(r)}`);
    const old = await me(other);
    ok('the other sign-in is refused, and says why', old.status === 401 && old.body.code === 'SESSION_ENDED', `${old.status} ${JSON.stringify(old.body)}`);
    ok('the token handed back works', (await me(r.body.token)).status === 200);
    ok('the old password no longer signs in', (await signIn(p.user.email)).status === 401);
    ok('the new one does', (await signIn(p.user.email, 'Changed-pass-1')).status === 200);
    ok('the change is in the audit log', (await prisma.auditLog.count({ where: { eventType: 'PASSWORD_CHANGED', resourceId: p.user.id } })) === 1);
  });

  await S(g, 'An administrator resetting a password ends every sign-in of that login', { ...sess, scope: 'Administrator over a staff login', expect: 'Old token 401', sec: 'A reset locks out whoever held the old password or token', db: 'tokensValidAfter set, failed count cleared' }, async (ok) => {
    const p = await person('CSR');
    const r = await admin2.post(`/api/users/${p.user.id}/reset-password`, { newPassword: 'Reset-pass-12' });
    ok('reset', r.status === 200, `${r.status} ${err(r)}`);
    ok('the old token is refused', (await me(p.token)).status === 401);
    ok('the new password signs in', (await signIn(p.user.email, 'Reset-pass-12')).status === 200);
  });

  await S(g, 'Switching a login off ends its sign-ins at once, and it cannot sign in again', { ...sess, scope: 'Administrator over a staff login', expect: 'Old token 401; sign-in 403', sec: 'A leaver loses access immediately, not after 8 hours', db: 'isActive false, tokensValidAfter set' }, async (ok) => {
    const p = await person('CSR');
    const r = await admin2.put(`/api/users/${p.user.id}`, { isActive: false });
    ok('switched off', r.status === 200, `${r.status} ${err(r)}`);
    ok('the token is refused', [401, 403].includes((await me(p.token)).status));
    ok('sign-in is refused', (await signIn(p.user.email)).status === 403);
    await admin2.put(`/api/users/${p.user.id}`, { isActive: true });
    ok('switched on again, the old token stays dead', (await me(p.token)).status === 401);
  });

  await S(g, 'Removing a login (it is switched off, not deleted) ends its sign-ins', { ...sess, scope: 'Administrator', expect: 'Old token 401', sec: 'Deactivation cuts the session', db: 'The User row stays, isActive false' }, async (ok) => {
    const p = await person('CSR');
    const r = await admin2.del(`/api/users/${p.user.id}`);
    ok('removed', r.status === 200, `${r.status} ${err(r)}`);
    ok('the token is refused', [401, 403].includes((await me(p.token)).status));
    ok('the row is kept for history', Boolean(await prisma.user.findUnique({ where: { id: p.user.id } })));
  });

  await S(g, 'Sign out everywhere ends every sign-in of the login, this one included, and is recorded', { ...sess, scope: 'The login itself', expect: 'Both tokens 401; audit row', sec: 'A person who lost a device can end its session', audit: 'AuditLog AUTH/SIGNED_OUT_EVERYWHERE' }, async (ok) => {
    const p = await person('CSR');
    const other = (await signIn(p.user.email)).body.token;
    const r = await as(p.token).post('/api/auth/logout-all');
    ok('done', r.status === 200, `${r.status} ${err(r)}`);
    ok('this token is refused', (await me(p.token)).status === 401);
    ok('the other is refused', (await me(other)).status === 401);
    ok('a new sign-in works', (await signIn(p.user.email)).status === 200);
    ok('recorded', (await prisma.auditLog.count({ where: { eventType: 'SIGNED_OUT_EVERYWHERE', userId: p.user.id } })) === 1);
    ok('it needs a sign-in', (await ctx.http1('POST', '/api/auth/logout-all')).status === 401);
  });

  await S(g, 'Ten wrong passwords in a row pause the login for 15 minutes, even with the right password', { ...sess, scope: 'Anyone who knows the address', expect: '10 refusals, then the right password refused', sec: 'Password guessing is capped per login', db: 'lockedUntil set, count back to 0', audit: 'AuditLog AUTH/LOGIN_LOCKED and an alert LOGIN_LOCKED' }, async (ok) => {
    const p = await person('CSR');
    for (let i = 0; i < 10; i += 1) await signIn(p.user.email, `wrong-${i}`);
    const u = await prisma.user.findUnique({ where: { id: p.user.id } });
    ok('paused for about 15 minutes', u.lockedUntil && Math.abs(u.lockedUntil - Date.now() - 15 * 60000) < 60000, String(u.lockedUntil));
    ok('the right password is refused while paused', (await signIn(p.user.email)).status === 401);
    ok('the pause is in the audit log', (await prisma.auditLog.count({ where: { eventType: 'LOGIN_LOCKED', resourceId: p.user.id } })) === 1);
    ok('and raised as an alert', Boolean(await ctx.until(async () => (await ctx.alertsOf('LOGIN_LOCKED')).find((a) => a.resourceId === `LOGIN_LOCKED:${p.user.id}`), { ms: 4000 })));
  });

  await S(g, 'The pause holds whatever address the guesses come from', { ...sess, scope: 'An attacker rotating addresses', expect: 'Paused after 10 from 10 addresses', sec: 'The per-address limit alone is not the only guard (E-014)' }, async (ok) => {
    const p = await person('CSR');
    for (let i = 0; i < 10; i += 1) await signIn(p.user.email, `wrong-${i}`, { 'x-forwarded-for': `203.0.113.${i + 1}` });
    ok('paused', Boolean((await prisma.user.findUnique({ where: { id: p.user.id } })).lockedUntil));
    ok('refused from a new address with the right password', (await signIn(p.user.email, QA_PASSWORD, { 'x-forwarded-for': '198.51.100.7' })).status === 401);
  });

  await S(g, 'Nine wrong passwords and then the right one sign in and clear the count', { ...sess, scope: 'The person', expect: '200 and count 0', sec: 'A person who mistypes is not punished' }, async (ok) => {
    const p = await person('CSR');
    for (let i = 0; i < 9; i += 1) await signIn(p.user.email, `wrong-${i}`);
    ok('nine counted', (await prisma.user.findUnique({ where: { id: p.user.id } })).failedLoginCount === 9);
    ok('the right password works', (await signIn(p.user.email)).status === 200);
    ok('count cleared', (await prisma.user.findUnique({ where: { id: p.user.id } })).failedLoginCount === 0);
  });

  await S(g, 'When the pause ends the right password works again', { ...sess, scope: 'The person', expect: '200 once lockedUntil is past', rec: 'The pause ends by itself' }, async (ok) => {
    const p = await person('CSR');
    await prisma.user.update({ where: { id: p.user.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
    ok('signs in', (await signIn(p.user.email)).status === 200);
    ok('the old pause is cleared', (await prisma.user.findUnique({ where: { id: p.user.id } })).lockedUntil === null);
  });

  await S(g, 'An administrator\'s password reset lifts a pause', { ...sess, scope: 'Administrator', expect: 'Sign-in with the new password at once', rec: 'Support can unlock a person' }, async (ok) => {
    const p = await person('CSR');
    await prisma.user.update({ where: { id: p.user.id }, data: { lockedUntil: new Date(Date.now() + 600000) } });
    await admin2.post(`/api/users/${p.user.id}/reset-password`, { newPassword: 'Unlocked-pass-1' });
    ok('signs in', (await signIn(p.user.email, 'Unlocked-pass-1')).status === 200);
  });

  await S(g, 'A refusal reads the same whether the address has a login, has none, or is paused', { scope: 'Anyone', expect: 'One message for all three', sec: 'Sign-in does not reveal which addresses have logins (Y-003)' }, async (ok) => {
    const p = await person('CSR');
    await prisma.user.update({ where: { id: p.user.id }, data: { lockedUntil: new Date(Date.now() + 600000) } });
    const known = await signIn(users.admin.email, 'not-the-password-x');
    const unknown = await signIn(`nobody-${Date.now()}@qa.test`, 'not-the-password-x');
    const paused = await signIn(p.user.email);
    ok('all 401', [known, unknown, paused].every((r) => r.status === 401));
    ok('one message', new Set([known, unknown, paused].map((r) => r.body.error)).size === 1, [known, unknown, paused].map((r) => r.body.error).join(' | '));
  });

  await S(g, 'A wrong password for an address with no login takes about as long as for one with a login', { init: 'A throwaway login', scope: 'Anyone', expect: 'Median times within 50 ms of each other', sec: 'Timing does not reveal which addresses have logins (Y-003)' }, async (ok) => {
    const p = await person('CSR');
    const time = async (email) => { const t = Date.now(); await signIn(email, 'wrong-x'); return Date.now() - t; };
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const k = []; const u = [];
    for (let i = 0; i < 5; i += 1) { k.push(await time(p.user.email)); u.push(await time(`nobody-${i}-${Date.now()}@qa.test`)); }
    ok('close', Math.abs(med(k) - med(u)) < 50, `known ${med(k)} ms, unknown ${med(u)} ms`);
  });

  const forged = [
    ['an unsigned token (algorithm none)', () => jwt.sign({ userId: users.admin.id }, null, { algorithm: 'none' })],
    ['a token signed with another algorithm (HS512)', () => forge({ userId: users.admin.id }, { algorithm: 'HS512' })],
    ['a token signed with another secret', () => forge({ userId: users.admin.id }, { secret: 'not-the-server-secret-0123456789abcdef' })],
    ['an expired token', () => jwt.sign({ userId: users.admin.id, exp: Math.floor(Date.now() / 1000) - 60 }, ctx.QA_JWT_SECRET)],
    ['a token whose user is not text', () => forge({ userId: { not: '' } })],
    ['a token for a login that does not exist', () => forge({ userId: 'no-such-user-id' })],
    ['a token with no user in it', () => forge({ role: 'SUPER_ADMIN' })],
    ['a token cut short', () => forge({ userId: users.admin.id }).slice(0, -6)],
  ];
  for (const [what, make] of forged) {
    await S(g, `The server refuses ${what}`, { scope: 'An attacker with a crafted token', expect: '401', sec: 'Only a token the server signed, unexpired, for a live login, is accepted' }, async (ok) => {
      const r = await me(make());
      ok('refused', r.status === 401, `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
    });
  }

  await S(g, 'A role written into a token is ignored: the role comes from the database on every request', { scope: 'A sales rep holding a token that claims SUPER_ADMIN', expect: 'Treated as a sales rep', sec: 'Changing a claim gains nothing' }, async (ok) => {
    const t = forge({ userId: sales.user.id, role: 'SUPER_ADMIN', orgId: sales.user.organizationId });
    ok('me says sales rep', (await me(t)).body.role === 'SALES_REP');
    ok('administration is refused', (await as(t).get('/api/users')).status !== 200 || (await as(t).post('/api/users', {})).status === 403);
    ok('the books are refused', (await as(t).get('/api/ledger/entries')).status === 403);
  });

  await S(g, 'A role taken away takes effect on the next request, without signing out', { init: 'A fresh CFO login', scope: 'Administrator changes a role', expect: 'The same token reads as the new role', sec: 'Removing a privilege is immediate' }, async (ok) => {
    const p = await person('CFO');
    ok('reads the books as CFO', (await p.get('/api/ledger/entries')).status === 200);
    await admin2.put(`/api/users/${p.user.id}`, { role: 'SALES_REP' });
    ok('refused straight after', (await p.get('/api/ledger/entries')).status === 403);
  });

  await S(g, 'A switched-off login cannot sign in, and the answer does not give the password away', { scope: 'A former employee', expect: '403 with the right password, 401 with a wrong one', sec: 'A disabled login is shut out' }, async (ok) => {
    const p = await person('CSR');
    await prisma.user.update({ where: { id: p.user.id }, data: { isActive: false } });
    ok('right password: 403', (await signIn(p.user.email)).status === 403);
    ok('wrong password: 401', (await signIn(p.user.email, 'wrong-pass-1')).status === 401);
  });

  await S(g, 'Sign-in refuses missing, empty and non-text fields without a server error', { scope: 'Anyone', expect: '400 for each', sec: 'No query is built from an object in place of text' }, async (ok) => {
    const bad = [{}, { email: 'a@b.c' }, { password: 'x' }, { email: { $ne: '' }, password: 'x' }, { email: ['a@b.c'], password: 'x' }, { email: 'a@b.c', password: { $gt: '' } }, { email: null, password: null }];
    for (const b of bad) { const r = await ctx.http1('POST', '/api/auth/login', { body: b }); ok(`refused: ${JSON.stringify(b)}`, r.status === 400, `${r.status}`); }
  });

  await S(g, 'Changing a password needs the current one and a new one of at least 8 characters', { scope: 'The login itself', expect: '401 wrong current, 400 short, nothing changed', sec: 'A token alone cannot change the password' }, async (ok) => {
    const p = await person('CSR');
    ok('wrong current: 401', (await as(p.token).put('/api/auth/password', { currentPassword: 'wrong-x', newPassword: 'Another-pass-1' })).status === 401);
    ok('short new: 400', (await as(p.token).put('/api/auth/password', { currentPassword: QA_PASSWORD, newPassword: 'short' })).status === 400);
    ok('the old password still works and the token too', (await signIn(p.user.email)).status === 200 && (await me(p.token)).status === 200);
  });

  await S(g, 'Registering a login is closed once the first login exists; an administrator cannot register a super administrator; a sales rep cannot register at all', { scope: 'Not signed in; an administrator; a sales rep', expect: '401; 403; 403', sec: 'Nobody can make themselves a login or a higher one' }, async (ok) => {
    const body = { email: `qa-p10-reg-${Date.now()}@qa.test`, password: 'Register-pass-1', role: 'SUPER_ADMIN', firstName: 'QA', lastName: 'Reg' };
    ok('not signed in: refused', (await ctx.http1('POST', '/api/auth/register', { body })).status === 401);
    const a = await admin2.post('/api/auth/register', body);
    ok('administrator making a super administrator: refused', a.status === 403, `${a.status} ${err(a)}`);
    ok('sales rep: refused', (await sales.post('/api/auth/register', { ...body, role: 'CSR' })).status === 403);
    ok('no login was made', !(await prisma.user.findUnique({ where: { email: body.email } })));
  });

  await S(g, 'The owner registering a login cannot place it in another organization or make a customer login without its account', { scope: 'Tenant owner', expect: '403 other organization; 400 customer role; 201 own company', sec: 'Register keeps the Users screen rules (Y-013)', audit: 'AuditLog DATA/CREATE through register' }, async (ok) => {
    const cust = await prisma.organization.findFirst({ where: { code: { startsWith: 'QA-C' } } });
    const email = `qa-p10-reg-${Date.now()}@qa.test`;
    const names = { firstName: 'QA', lastName: 'Registered' };
    const other = await owner.post('/api/auth/register', { email, password: 'Register-pass-1', role: 'ADMIN', organizationId: cust.id, ...names });
    ok('another organization: refused', other.status === 403, `${other.status} ${err(other)}`);
    const custRole = await owner.post('/api/auth/register', { email, password: 'Register-pass-1', role: 'CUSTOMER_BUYER', ...names });
    ok('a customer role: refused', custRole.status === 400, `${custRole.status} ${err(custRole)}`);
    ok('nothing made so far', !(await prisma.user.findUnique({ where: { email } })));
    ok('no names: refused', (await owner.post('/api/auth/register', { email, password: 'Register-pass-1', role: 'CSR' })).status === 400);
    const good = await owner.post('/api/auth/register', { email, password: 'Register-pass-1', role: 'CSR', ...names });
    const made = await prisma.user.findUnique({ where: { email } });
    ok('in the owner\'s own company', good.status === 201 && made?.organizationId === owner.user.organizationId, `${good.status} ${err(good)}`);
    ok('recorded', (await prisma.auditLog.count({ where: { resourceId: made?.id, eventType: 'CREATE' } })) === 1);
    ok('the same address twice: refused, not a server error', (await owner.post('/api/auth/register', { email, password: 'Register-pass-1', role: 'CSR', ...names })).status === 400);
  });

  await S(g, 'A branch manager cannot make a super administrator, an administrator, or change their own role', { scope: 'Branch manager', expect: '403 each', sec: 'No path from branch manager to the top (C-001 kept)' }, async (ok) => {
    const base = { email: `qa-p10-bm-${Date.now()}@qa.test`, password: 'Branch-pass-12', firstName: 'QA', lastName: 'BM', homeLocationId: ctx.L1.id };
    ok('super admin: refused', (await bm1.post('/api/users', { ...base, role: 'SUPER_ADMIN' })).status === 403);
    ok('admin: refused', (await bm1.post('/api/users', { ...base, role: 'ADMIN' })).status === 403);
    ok('own role: refused', (await bm1.put(`/api/users/${bm1.user.id}`, { role: 'ADMIN' })).status === 403);
    ok('still a branch manager', (await prisma.user.findUnique({ where: { id: bm1.user.id } })).role === 'BRANCH_MANAGER');
  });

  await S(g, 'An administrator cannot make an owner or a super administrator', { scope: 'Administrator', expect: '403', sec: 'The top roles are granted only from the top' }, async (ok) => {
    const p = await person('CSR');
    ok('owner: refused', (await admin2.put(`/api/users/${p.user.id}`, { role: 'TENANT_OWNER' })).status === 403);
    ok('super admin: refused', (await admin2.put(`/api/users/${p.user.id}`, { role: 'SUPER_ADMIN' })).status === 403);
  });

  await S(g, 'Fields that guard sign-in cannot be set through the user screen', { scope: 'Administrator sending extra fields', expect: 'Ignored', sec: 'No mass assignment of password, cut-off, count or pause', db: 'Those columns unchanged' }, async (ok) => {
    const p = await person('CSR');
    const before = await prisma.user.findUnique({ where: { id: p.user.id } });
    await admin2.put(`/api/users/${p.user.id}`, { firstName: 'Renamed', passwordHash: 'x', tokensValidAfter: '2000-01-01', failedLoginCount: 99, lockedUntil: '2999-01-01', organizationId: 'other' });
    const after = await prisma.user.findUnique({ where: { id: p.user.id } });
    ok('the name changed', after.firstName === 'Renamed');
    ok('the rest did not', after.passwordHash === before.passwordHash && after.failedLoginCount === 0 && after.lockedUntil === null && after.organizationId === before.organizationId && String(after.tokensValidAfter) === String(before.tokensValidAfter));
  });

  await S(g, 'No answer about a login carries its password hash', { scope: 'Administrator and the person', expect: 'No passwordHash in sign-in, me, list or detail', sec: 'Hashes never leave the server' }, async (ok) => {
    const p = await person('CSR');
    const texts = [(await signIn(p.user.email)).raw, (await me(p.token)).raw, (await admin2.get('/api/users?limit=200')).raw, (await admin2.get(`/api/users/${p.user.id}`)).raw];
    ok('none', texts.every((t) => !/passwordHash|\$2[aby]\$/.test(t)), texts.map((t) => t.length).join(','));
  });

  await S(g, 'A colleague looking up logins sees names and roles, not who is being guessed at', { scope: 'Sales rep and administrator', expect: 'No count, pause or cut-off for the sales rep; present for the administrator', sec: 'Sign-in guard state is for login managers (Y-015)' }, async (ok) => {
    const p = await person('CSR');
    await prisma.user.update({ where: { id: p.user.id }, data: { failedLoginCount: 4 } });
    const seen = await sales.get(`/api/users/${p.user.id}`);
    ok('a sales rep can look the person up', seen.status === 200 && seen.body.email === p.user.email, `${seen.status}`);
    ok('but not the sign-in guards', !('failedLoginCount' in seen.body) && !('lockedUntil' in seen.body) && !('tokensValidAfter' in seen.body), Object.keys(seen.body).join(','));
    const list = await sales.get(`/api/users?search=${encodeURIComponent(p.user.email)}`);
    ok('nor in the list', (list.body.users || []).every((u) => !('failedLoginCount' in u)));
    ok('an administrator sees them', (await admin2.get(`/api/users/${p.user.id}`)).body.failedLoginCount === 4);
  });

  const staffOnly = ['/api/ledger/entries', '/api/admin/integrations/checks', '/api/v1/admin/partners', '/api/admin/integrations'];
  await S(g, 'A sales rep is refused the administration, the books and the system checks', { scope: 'Sales rep', expect: '403 on each', sec: 'Role checks are at the server, not the menu' }, async (ok) => {
    for (const u of staffOnly) { const r = await sales.get(u); ok(u, [403, 404].includes(r.status), `${r.status}`); }
    ok('nor can a sales rep add a login', (await sales.post('/api/users', { email: 'x@qa.test', password: 'Xxxxxxxx1', firstName: 'x', lastName: 'x', role: 'CSR' })).status === 403);
  });

  await S(g, 'A customer login is refused staff routes, the books and the system checks', { scope: 'Customer buyer login', expect: '403 on each', sec: 'Customers stay in the store' }, async (ok) => {
    const t = await ctx.tokenOf('custA');
    for (const u of [...staffOnly, '/api/users', '/api/orders', '/api/invoices', '/api/inventory']) { const r = await as(t).get(u); ok(u, [401, 403, 404].includes(r.status), `${r.status}`); }
  });

  await S(g, 'A switched-off login with a valid unexpired token made before Phase 10 is refused', { scope: 'An old token with no session mark', expect: '401', sec: 'Tokens issued before the fix also end on deactivation' }, async (ok) => {
    const p = await person('CSR');
    const legacy = forge({ userId: p.user.id, role: 'CSR', orgId: p.user.organizationId });
    ok('works while active', (await me(legacy)).status === 200);
    await admin2.put(`/api/users/${p.user.id}`, { isActive: false });
    ok('refused once switched off', [401, 403].includes((await me(legacy)).status));
  });

  await S(g, 'Twenty wrong passwords at once pause the login and none gets through', { ...sess, scope: 'A burst of guesses', expect: 'Paused; all 401', sec: 'The count is atomic in the database' }, async (ok) => {
    const p = await person('CSR');
    const rs = await Promise.all(Array.from({ length: 20 }, (_, i) => signIn(p.user.email, `wrong-${i}`)));
    ok('all refused', rs.every((r) => r.status === 401));
    ok('paused', Boolean((await prisma.user.findUnique({ where: { id: p.user.id } })).lockedUntil));
    ok('one pause recorded', (await prisma.auditLog.count({ where: { eventType: 'LOGIN_LOCKED', resourceId: p.user.id } })) === 1);
  });
  void A;
}
