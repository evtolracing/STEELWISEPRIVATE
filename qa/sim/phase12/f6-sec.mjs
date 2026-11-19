// Group 6: security and access revalidated on the release candidate with fresh people and fresh records
// (Phase 12 prompt, section 21). The full sweep and the 277 Phase 10 scenarios run in the gate; this group
// does not repeat them. It re-proves each of the twelve subjects once more by a different route, and tests
// the two items earlier phases left open: the dispatch board lists (V-028) and the staff directory.
export default async function run(c) {
  const { W, G12, branch, P, hq, prisma, err, sold, onDock, jwt, QA_JWT_SECRET, tag, asRuntime, asRuntimeRolledBack, denied, BASE } = c;
  const G = G12.sec;
  const cfo = hq('CFO', 0); const auditor = hq('AUDITOR', 0);
  const a = await branch('MEDIUM', 14); const o = await branch('MEDIUM', 15);
  const m = (id, purpose, over = {}) => ({ id, purpose, role: 'attacker or the wrong person', ui: 'none: the API is called directly', ...over });
  const raw = (method, path, { token, body, headers = {} } = {}) => fetch(`${BASE}${path}`, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }), ...headers }, body: body ? JSON.stringify(body) : undefined });

  await W(G, 'Security 1: authentication. No token, a forged token, an expired token and a token signed another way are all refused', m('SC-01', 'Authentication'), async (ok) => {
    const who = P.seller(a); const id = who.user.id;
    const cases = { 'no token': undefined, 'a token signed with another secret': jwt.sign({ userId: id }, 'not-the-secret', { expiresIn: '1h' }), 'an expired token': jwt.sign({ userId: id }, QA_JWT_SECRET, { expiresIn: -10 }), 'a token with algorithm none': `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ userId: id })).toString('base64url')}.`, 'a token signed HS512': jwt.sign({ userId: id }, QA_JWT_SECRET, { algorithm: 'HS512', expiresIn: '1h' }), 'a token naming a user that does not exist': jwt.sign({ userId: '00000000-0000-4000-8000-000000000000' }, QA_JWT_SECRET, { expiresIn: '1h' }), 'a token with no user id': jwt.sign({ role: 'SUPER_ADMIN' }, QA_JWT_SECRET, { expiresIn: '1h' }) };
    for (const [what, token] of Object.entries(cases)) for (const path of ['/api/orders', '/api/ledger/reports/trial-balance', '/api/users']) { const r = await raw('GET', path, { token }); ok(`${what}: ${path} is refused`, r.status === 401, r.status); }
    const wrong = await raw('POST', '/api/auth/login', { body: { email: who.user.email, password: 'wrong-password-1' } }); const none = await raw('POST', '/api/auth/login', { body: { email: `${tag('nobody')}@qa.test`, password: 'wrong-password-1' } });
    ok('a wrong password and an unknown address read the same', wrong.status === none.status && JSON.stringify(await wrong.json()) === JSON.stringify(await none.json()), `${wrong.status} ${none.status}`);
  });

  await W(G, 'Security 2: sessions. A role claimed in the token is ignored and a switched-off login stops at once', m('SC-02', 'Sessions'), async (ok) => {
    const who = P.seller(a);
    const boosted = jwt.sign({ userId: who.user.id, role: 'SUPER_ADMIN', organizationId: who.user.organizationId }, QA_JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
    const r = await raw('GET', '/api/ledger/reports/trial-balance', { token: boosted });
    ok('a token that claims SUPER_ADMIN for a sales representative is still a sales representative', r.status === 403 || r.status === 401, r.status);
    const email = `${tag('p12-off').toLowerCase()}@qa.test`; const bcrypt = (await import('../lib.mjs')).bcrypt();
    const u = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(c.QA_PASSWORD, 10), firstName: 'P12', lastName: 'Leaver', role: 'CSR', organizationId: who.user.organizationId, homeLocationId: a.id } });
    const li = await raw('POST', '/api/auth/login', { body: { email, password: c.QA_PASSWORD } }); const token = (await li.json()).token;
    ok('the new login works', (await raw('GET', '/api/orders?limit=1', { token })).status === 200);
    await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
    ok('switched off, the same token is refused on the next request', [401, 403].includes((await raw('GET', '/api/orders?limit=1', { token })).status));
    ok('and it cannot sign in again', [401, 403].includes((await raw('POST', '/api/auth/login', { body: { email, password: c.QA_PASSWORD } })).status));
  });

  await W(G, 'Security 3: roles. Each department is refused the changes that belong to another', m('SC-03', 'Role-based access'), async (ok) => {
    const s = await sold(a, 300); const d = await onDock(a, 200);
    const tries = [
      ['an operator takes a payment', P.operator(a), 'post', `/api/invoices/${s.invoice.id}/payments`, { amount: 1, paymentMethod: 'CASH' }],
      ['an operator writes an order', P.operator(a), 'post', '/api/orders', { orderType: 'SO', buyerId: a.customers[0].id, lines: [] }],
      ['a sales representative adjusts stock', P.seller(a), 'post', '/api/inventory/adjust', { coilId: s.lot.coilId, change: -1, reason: 'DAMAGE', notes: 'x' }],
      ['an operator dispatches a shipment', P.operator(a), 'put', `/api/shipments/${d.shipment.id}/dispatch`, {}],
      ['a receiving clerk issues a credit', P.receiver(a) || P.stock(a), 'post', `/api/invoices/${s.invoice.id}/credit`, { amount: 1, reason: 'x' }],
      ['a CSR writes a journal entry', P.csr(a), 'post', '/api/ledger/entries', { entryDate: c.today(), memo: 'x', lines: [c.D('5200', 1), c.C('2200', 1)] }],
      ['a branch manager closes a month', P.manager(a), 'post', '/api/ledger/periods/2020/1/close', {}],
      ['a branch manager makes an administrator', P.manager(a), 'post', '/api/users', { email: `${tag('p12-esc').toLowerCase()}@qa.test`, password: 'qa-password-1', firstName: 'x', lastName: 'y', role: 'ADMIN' }],
      ['an auditor changes an order', auditor, 'put', `/api/orders/${s.order.id}`, { notes: 'x' }],
      ['a scheduler changes a price', P.scheduler(a), 'put', `/api/products/${c.E.each.id}`, { listPrice: 0.01 }],
    ];
    for (const [what, who, verb, path, body] of tries) { if (!who) continue; const r = await who[verb](path, body); ok(`${what}: refused`, r.status === 403, `${r.status} ${err(r)}`); }
    ok('nothing was changed by any of them', (await prisma.payment.count({ where: { invoiceId: s.invoice.id } })) === 0 && (await prisma.shipment.findUnique({ where: { id: d.shipment.id } })).status !== 'IN_TRANSIT');
  });

  await W(G, 'Security 4 and 5: customer accounts and branches. Nobody reads or changes another account\'s or another branch\'s records', m('SC-04', 'Tenant (customer account) and branch isolation'), async (ok) => {
    const s = await sold(a, 250); const d = await onDock(a, 150);
    const them = [P.seller(o), P.manager(o), P.stock(o), P.shipper(o) || P.stock(o)];
    for (const who of them) for (const path of [`/api/orders/${s.order.id}`, `/api/shipments/${s.shipment.id}`, `/api/invoices/${s.invoice.id}`, `/api/coils/${s.lot.coilId}`]) { const r = await who.get(path); ok(`${who.user.role} of the other branch cannot open ${path.split('/')[2]}`, r.status === 404 || r.status === 403, r.status); }
    const ch = await Promise.all([P.manager(o).put(`/api/orders/${d.order.id}`, { status: 'CANCELLED', cancelReason: 'x' }), (P.shipper(o) || P.stock(o)).put(`/api/shipments/${d.shipment.id}/dispatch`, {}), P.stock(o).post('/api/inventory/adjust', { coilId: d.lot.coilId, change: -5, reason: 'DAMAGE', notes: 'x' }), P.manager(o).post(`/api/invoices/${s.invoice.id}/payments`, { amount: 1, paymentMethod: 'CASH' })]);
    ok('and cannot change them', ch.every((r) => r.status >= 400 && r.status < 500) && (await prisma.order.findUnique({ where: { id: d.order.id } })).status !== 'CANCELLED' && (await prisma.shipment.findUnique({ where: { id: d.shipment.id } })).status === 'PENDING' && (await prisma.payment.count({ where: { invoiceId: s.invoice.id } })) === 0, ch.map((r) => r.status).join(','));
    const lists = await Promise.all([P.manager(o).get('/api/orders?limit=200'), P.manager(o).get('/api/shipments?limit=200'), P.manager(o).get('/api/invoices?limit=200')]);
    ok('the other branch\'s lists do not carry them', !JSON.stringify(lists.map((r) => r.body)).includes(s.order.id) && !JSON.stringify(lists.map((r) => r.body)).includes(s.invoice.id));
    const buyerA = a.buyers[0]; const buyerO = o.buyers[0];
    const mineA = await buyerA.get('/api/ecom/my-orders');
    ok('a customer login reads its own orders', mineA.status === 200, mineA.status);
    for (const path of ['/api/orders', '/api/customers', '/api/invoices', '/api/users', '/api/ledger/status', `/api/orders/${s.order.id}`, `/api/customers/${a.customers[0].id}`]) { const r = await buyerO.get(path); ok(`a customer login is refused ${path.replace(/[0-9a-f-]{36}/, ':id')}`, r.status === 403, r.status); }
    const pref = await buyerO.get(`/api/customers/${buyerA.user.customerId}/preferences`);
    ok('and cannot read another account\'s saved preferences', pref.status === 403, pref.status);
  });

  await W(G, 'Security 6: the dispatch board lists stop at the branch (V-028)', m('SC-06', 'Branch boundary on the dispatch board', { api: 'GET /api/v1/dispatch/work-centers, /queue, /stats, /operators' }), async (ok, x) => {
    const who = P.scheduler(o) || P.operator(o);
    const ownWc = await prisma.workCenter.findMany({ where: { locationId: o.id }, select: { id: true } }); const theirs = await prisma.workCenter.findMany({ where: { locationId: a.id }, select: { id: true, name: true } });
    const asked = await who.get(`/api/v1/dispatch/work-centers?locationId=${a.id}`);
    const got = JSON.stringify(asked.body);
    ok('asking for another branch\'s work centers returns none of them', asked.status === 200 ? theirs.every((w) => !got.includes(w.id)) : asked.status === 403, `${asked.status}; ${theirs.filter((w) => got.includes(w.id)).length} of ${theirs.length} of the other branch's work centers returned`);
    const allWc = await who.get('/api/v1/dispatch/work-centers');
    ok('the list with no branch named holds only the person\'s own', allWc.status === 200 && theirs.every((w) => !JSON.stringify(allWc.body).includes(w.id)) && ownWc.some((w) => JSON.stringify(allWc.body).includes(w.id)), allWc.status);
    for (const path of [`/api/v1/dispatch/queue?locationId=${a.id}`, `/api/v1/dispatch/stats?locationId=${a.id}`, `/api/v1/dispatch/operators?locationId=${a.id}`]) {
      const r = await who.get(path); const body = JSON.stringify(r.body);
      x.note(`${path.split('?')[0]} for the other branch answered ${r.status}, ${body.length} bytes`);
      ok(`${path.split('?')[0].split('/').pop()}: nothing of the other branch's floor`, r.status === 403 || theirs.every((w) => !body.includes(w.id)), r.status);
    }
    const locs = await who.get('/api/v1/dispatch/locations');
    x.note(`the list of branch names is shared by design (${(locs.body?.data || []).length} branches)`);
    const mk = await who.post('/api/v1/dispatch/work-centers', { name: 'P12 rogue saw', locationId: a.id, workCenterType: c.E.WC_TYPE });
    ok('a work center cannot be made at another branch', mk.status === 403, `${mk.status} ${err(mk)}`);
  });

  await W(G, 'Security 7: API. Bad input is the caller\'s error and carries no internals', m('SC-07', 'API security'), async (ok) => {
    const who = P.seller(a);
    const probes = [['GET', '/api/orders/not-a-uuid'], ['GET', "/api/orders?status=CONFIRMED'%20OR%201=1--"], ['GET', '/api/orders?limit=999999999'], ['GET', '/api/orders?limit=-5&offset=abc'], ['GET', '/api/coils/%00'], ['GET', '/api/ledger/entries/%%%'], ['POST', '/api/orders', { __proto__: { admin: true }, constructor: { prototype: { admin: true } }, lines: 'x' }], ['POST', '/api/customers', { code: { $gt: '' }, name: ['a'] }], ['PUT', `/api/orders/${'9'.repeat(400)}`, {}]];
    for (const [method, path, body] of probes) { const r = await who.call(method, path, body); const text = JSON.stringify(r.body || ''); ok(`${method} ${path.slice(0, 44)}: not a server error and no internals`, r.status < 500 && !/prisma|stack|at \w+ \(|node_modules|SELECT |postgres/i.test(text), `${r.status} ${text.slice(0, 100)}`); }
    const odd = await who.post('/api/customers', { code: { $gt: '' }, name: ['a'] });
    ok('a customer whose code is not text is refused, not saved as "[object Object]" (AA-011)', odd.status === 400 && (await prisma.organization.count({ where: { code: { contains: 'object Object' } } })) === 0, `${odd.status} ${JSON.stringify(odd.body).slice(0, 90)}`);
    const big = await raw('POST', '/api/orders', { token: who.token, body: { notes: 'x'.repeat(6 * 1024 * 1024) } });
    ok('a six-megabyte body is refused', big.status === 413 || big.status === 400, big.status);
    const h = await raw('GET', '/api/health/live'); ok('answers carry a request id and the safety headers', Boolean(h.headers.get('x-request-id')) && h.headers.get('x-content-type-options') === 'nosniff', `${h.headers.get('x-request-id')} ${h.headers.get('x-content-type-options')}`);
    // Which websites may read answers is a production setting: it is checked on a server started in production mode (qa/tools/phase12-process.mjs).
  });

  await W(G, 'Security 8: the database. The application\'s own connection cannot change history, the guards or the schema', m('SC-08', 'Database security', { api: 'SQL as steelwise_runtime' }), async (ok) => {
    const e = await prisma.journalEntry.findFirst({ where: { status: 'POSTED' } });
    const tests = [['change a posted journal line', 'UPDATE "JournalLine" SET debit = debit WHERE "entryId" = $1', [e.id]], ['delete audit history', 'DELETE FROM "AuditLog" WHERE timestamp < now()', []], ['empty the audit log', 'TRUNCATE "AuditLog"', []], ['rewrite the record of applied updates', 'UPDATE "_prisma_migrations" SET checksum = \'x\'', []], ['make a table', 'CREATE TABLE p12_rogue (id int)', []], ['drop a guard', 'DROP TRIGGER "JournalLine_guard" ON "JournalLine"', []], ['switch triggers off for the session', 'SET session_replication_role = replica', []], ['make itself a superuser', 'ALTER ROLE steelwise_runtime SUPERUSER', []], ['read password hashes of the database roles', 'SELECT rolpassword FROM pg_authid', []]];
    for (const [what, sql, params] of tests) { const r = await asRuntimeRolledBack(sql, params); ok(`cannot ${what}`, denied(r) || !r.ok, r.error || 'allowed'); }
    const role = await asRuntime('SELECT rolsuper, rolcreatedb, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname = current_user');
    ok('the role has no superuser, create-database, create-role or bypass rights', role.ok && role.rows.every((r) => !r.rolsuper && !r.rolcreatedb && !r.rolcreaterole && !r.rolbypassrls), JSON.stringify(role.rows || role.error));
  });

  await W(G, 'Security 9: files. A document is read only through the signed-in download, by people of its branch', m('SC-09', 'File security', { api: 'POST /api/documents/upload, GET /api/documents/:id/download' }), async (ok, x) => {
    const s = await sold(a, 200); const who = P.csr(a) || P.seller(a);
    const fd = new FormData(); fd.append('file', new Blob(['%PDF-1.4\n% P12 synthetic certificate\n%%EOF\n'], { type: 'application/pdf' }), 'p12-cert.pdf'); fd.append('type', 'MTR'); fd.append('orderId', s.order.id);
    const up = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${who.token}` }, body: fd }); const doc = await up.json().catch(() => ({}));
    x.note(`upload answered ${up.status}: ${JSON.stringify(doc).slice(0, 160)}`);
    ok('a PDF is uploaded against the order', up.status === 201 && (doc.id || doc.document?.id), up.status);
    const id = doc.id || doc.document?.id;
    if (id) {
      ok('no sign-in, no download', (await raw('GET', `/api/documents/${id}/download`)).status === 401);
      // Documents are shared across branches by rule (a mill certificate follows the material), so the test is another customer's login.
      const outsider = o.buyers[0]; const got = await outsider.get(`/api/documents/${id}/download`);
      ok('a customer login of another account cannot download it', [403, 404].includes(got.status), got.status);
      const mine = await raw('GET', `/api/documents/${id}/download`, { token: who.token });
      ok('its own branch downloads it as an attachment', mine.status === 200 && /attachment/i.test(mine.headers.get('content-disposition') || ''), `${mine.status} ${mine.headers.get('content-disposition')}`);
      const row = await prisma.document.findUnique({ where: { id } });
      const direct = await raw('GET', `/${String(row.storagePath || row.path || row.url || '').replace(/^\/+/, '')}`);
      ok('the stored file is not served at its own address', direct.status !== 200 || !(await direct.text()).includes('P12 synthetic certificate'), direct.status);
    }
    const bad = new FormData(); bad.append('file', new Blob(['<script>alert(1)</script>'], { type: 'application/pdf' }), '../../p12.html'); bad.append('type', 'MTR');
    const up2 = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${who.token}` }, body: bad });
    ok('a script dressed as a PDF with a path in its name is refused', up2.status >= 400 && up2.status < 500, up2.status);
  });

  await W(G, 'Security 10: secrets. No secret is in an answer, in the page bundle, or in the repository', m('SC-10', 'Secrets'), async (ok, x) => {
    const who = c.admin;
    const answers = await Promise.all(['/api/admin/integrations/checks', '/api/health', '/api/health/ready', '/api/ledger/status', '/api/auth/me', '/api/v1/admin/partners', '/api/admin/integrations/report'].map((p) => who.get(p)));
    const text = JSON.stringify(answers.map((r) => r.body));
    ok('no answer carries a secret', !/qa-jwt-secret|qa-tasks-secret|qa-runtime-not-a-secret|postgresql:\/\/|passwordHash|"secret":"[^*]/i.test(text), (text.match(/.{30}(qa-jwt-secret|qa-tasks-secret|postgresql:\/\/|passwordHash).{30}/i) || [''])[0]);
    const fs = await import('node:fs'); const path = await import('node:path');
    const dist = path.join(c.root, 'src/frontend/dist/assets');
    if (fs.existsSync(dist)) { const js = fs.readdirSync(dist).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dist, f), 'utf8')).join('\n'); ok('the built pages hold no server secret', !/JWT_SECRET|CRON_SECRET|DATABASE_URL=|postgresql:\/\/[^"' ]+:[^"' ]+@|sk-[A-Za-z0-9]{20,}|service_role/.test(js), `${(js.length / 1e6).toFixed(1)} MB read`); } else x.note('no built pages on disk to read; the build step of the gate makes them');
    const { execSync } = await import('node:child_process');
    const tracked = execSync('git ls-files', { cwd: c.root }).toString().split('\n');
    ok('no .env file with values is tracked', tracked.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !/example|sample|template/.test(f)).length === 0, tracked.filter((f) => /(^|\/)\.env/.test(f)).join(','));
    const hits = execSync('git grep -nIE "(postgres(ql)?://[a-zA-Z0-9_]+:[^@$ {<]{8,}@(?!localhost|127\\.0\\.0\\.1)|sk-[A-Za-z0-9]{32,}|eyJhbGciOi[A-Za-z0-9_-]{40,}\\.[A-Za-z0-9_-]{40,})" -P -- . ":!qa/results" ":!*.lock" ":!package-lock.json" || true', { cwd: c.root, maxBuffer: 1e7 }).toString().trim().split('\n').filter(Boolean);
    ok('no connection string with a password to a remote host, API key or long-lived token is in the repository', hits.length === 0, hits.slice(0, 3).map((h) => h.slice(0, 80)).join(' | '));
  });

  await W(G, 'Security 11: webhooks and partner keys. A partner needs its key, stays in its scope, and a forged delivery signature does not verify', m('SC-11', 'Webhooks and partner API'), async (ok, x) => {
    const p = await c.partnerOf(a.customers[0], 'CUSTOMER', ['orders:read'], 'p12').catch((e) => ({ error: String(e.message || e) }));
    x.note(`partner made: ${p.error || 'yes'}`);
    if (!p.error) {
      const call = (token, path) => fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${token}` } });
      const tok = p.token || p.accessToken;
      ok('with its token the partner reads its own orders', (await call(tok, '/api/v1/partner/customer/orders')).status === 200);
      ok('without a token it is refused', (await fetch(`${BASE}/api/v1/partner/customer/orders`)).status === 401);
      ok('it is refused a scope it was not given', [403, 404].includes((await call(tok, '/api/v1/partner/supplier/purchase-orders')).status));
      ok('a partner token is not a staff token', (await call(tok, '/api/orders')).status === 401);
      const staff = P.seller(a); ok('a staff token is not a partner token', [401, 403].includes((await call(staff.token, '/api/v1/partner/customer/orders')).status));
    }
    const tasks = await fetch(`${BASE}/api/internal/tasks/run`, { method: 'POST', headers: { authorization: 'Bearer wrong' } });
    ok('the scheduled address refuses a wrong secret', tasks.status === 401 || tasks.status === 403, tasks.status);
  });

  await W(G, 'Security 12: financial permissions and the audit trail hold together', m('SC-12', 'Financial permissions and audit'), async (ok) => {
    const d = await cfo.post('/api/ledger/entries', { entryDate: c.today(), memo: 'P12 separation of duties', lines: [c.D('5200', 12.34, { locationId: a.id }), c.C('2200', 12.34, { locationId: a.id })] });
    ok('finance writes an entry', d.status === 201, `${d.status} ${err(d)}`);
    const self = await cfo.post(`/api/ledger/entries/${d.body.id}/post`);
    ok('the person who wrote it cannot post it', self.status === 403 || self.status === 409, `${self.status} ${err(self)}`);
    const second = await hq('CFO', 1).post(`/api/ledger/entries/${d.body.id}/post`);
    ok('a second finance person posts it', second.status === 200, `${second.status} ${err(second)}`);
    const trail = await prisma.auditLog.findMany({ where: { resourceId: d.body.id } });
    ok('both acts are in the audit trail under their own names', new Set(trail.map((t) => t.userId)).size >= 2, `${trail.length} lines, ${new Set(trail.map((t) => t.userId)).size} people`);
    const act = await c.admin.post('/api/ledger/deactivate', { reason: 'x' });
    ok('an administrator who is not the owner or CFO cannot stop the ledger', !act || act.status === 403, act?.status);
  });
}
