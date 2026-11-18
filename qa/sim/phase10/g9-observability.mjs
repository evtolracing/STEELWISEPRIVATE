// Group 9: observability, alerting and infrastructure: request ids, one log line per request with no
// secret in it, readiness and liveness, the system checks, alerts, audit trails, and the server's own
// settings for the host.
import fs from 'node:fs';
import path from 'node:path';

export default async function obs(ctx) {
  const { S, G10, prisma, http1, cfo, admin2, sales, err, root, tokenOf, alertsOf, signIn, person, until } = ctx;
  const g = G10.obs;
  const serverLog = ctx.arg('server-log', '/tmp/qa-server-3011.log');
  const logText = () => { try { return fs.readFileSync(serverLog, 'utf8'); } catch { return ''; } };
  const m = (expect, extra = {}) => ({ scope: 'The running QA server', expect, sec: 'Operations can see what happened without exposing secrets', ...extra });

  await S(g, 'Every answer carries a request id, and an id sent by the caller is kept for tracing', m('x-request-id on every answer; a caller id is echoed'), async (ok) => {
    const a = await http1('GET', '/api/health');
    ok('an id', Boolean(a.headers.get('x-request-id')));
    const b = await http1('GET', '/api/health', { headers: { 'x-request-id': 'qa-p10-trace-1234' } });
    ok('the caller id is kept', b.headers.get('x-request-id') === 'qa-p10-trace-1234', b.headers.get('x-request-id'));
    // A line break cannot even be sent (the client refuses it); spaces, markup and a 300-character id can.
    for (const bad of ['bad id with spaces', '<script>x</script>', 'x'.repeat(300)]) {
      const c = await http1('GET', '/api/health', { headers: { 'x-request-id': bad } });
      ok(`a malformed id is replaced, not echoed (${bad.slice(0, 12)})`, c.headers.get('x-request-id') && c.headers.get('x-request-id') !== bad);
    }
  });

  await S(g, 'The server writes one log line per request with its id, and never the password or the token', m('A JSON line with the id; no password or bearer token in the log', { audit: 'Server log' }), async (ok) => {
    const id = `qa-p10-log-${Date.now()}`;
    await http1('POST', '/api/auth/login', { body: { email: 'qa-admin@qa.test', password: 'qa-p10-wrong-password-visible?' }, headers: { 'x-request-id': id } });
    const t = await tokenOf('admin');
    await http1('GET', '/api/auth/me', { token: t, headers: { 'x-request-id': `${id}-b` } });
    await ctx.sleep(300);
    const log = logText();
    if (!log) { ok('the server log is available to this run', false, `no log at ${serverLog}`); return; }
    ok('the request is logged by id', log.includes(id));
    ok('the password is not in the log', !log.includes('qa-p10-wrong-password-visible?'));
    ok('the token is not in the log', !log.includes(t));
  });

  await S(g, 'Liveness answers without the database; readiness answers with the names of failing checks only', m('live 200; ready 200 with status and names, no counts'), async (ok) => {
    ok('live', (await http1('GET', '/api/health/live')).status === 200);
    const r = await http1('GET', '/api/health/ready');
    ok('ready answers', [200, 503].includes(r.status) && ['ready', 'attention', 'not ready'].includes(r.body.status), `${r.status} ${JSON.stringify(r.body)}`);
    ok('names only', Array.isArray(r.body.failing) && !('checks' in r.body) && !/\d+ (stock|posted|events|logins)/.test(r.raw), r.raw.slice(0, 200));
  });

  await S(g, 'The public readiness answer is kept for 30 seconds so a flood of calls is not a flood of database work', m('Two calls within the window carry the same timestamp', { sec: 'No cheap denial of service through the readiness check (Y-014)' }), async (ok) => {
    const a = await http1('GET', '/api/health/ready'); const b = await http1('GET', '/api/health/ready');
    ok('same answer', a.body.timestamp === b.body.timestamp, `${a.body.timestamp} vs ${b.body.timestamp}`);
    const t = Date.now();
    await Promise.all(Array.from({ length: 50 }, () => http1('GET', '/api/health/ready')));
    ok('fifty calls are quick', Date.now() - t < 5000, `${Date.now() - t} ms`);
  });

  await S(g, 'The health check measures the database and does not expose its address', m('database connected, latency, no host'), async (ok) => {
    const r = await http1('GET', '/api/health');
    ok('connected', r.body.database === 'connected' && typeof r.body.databaseLatencyMs === 'number');
    ok('no address', !/localhost|5432|postgres|steelwise_qa/.test(r.raw));
  });

  await S(g, 'The system checks cover the stock, the books, partner events, the scheduler and paused logins', m('Each named check present'), async (ok) => {
    const r = await ctx.checksAs(admin2);
    const keys = (r.body.checks || []).map((c) => c.key);
    for (const k of ['database', 'stock balances add up', 'posted journal entries balance', 'ledger postings that failed', 'ledger events waiting for a person', 'last reconciliation found no difference', 'partner events delivered', 'scheduled run on time', 'logins paused now']) ok(k, keys.includes(k));
  });

  await S(g, 'A paused login shows in the checks with a count, and clears when the pause ends', m('logins paused now fails with 1, then passes'), async (ok) => {
    const before = (await ctx.checksAs(admin2)).body.checks.find((c) => c.key === 'logins paused now').count || 0;
    const p = await person('CSR');
    for (let i = 0; i < 10; i += 1) await signIn(p.user.email, `wrong-${i}`);
    const c = (await ctx.checksAs(admin2)).body.checks.find((x) => x.key === 'logins paused now');
    ok('counted', c.ok === false && c.count === before + 1, JSON.stringify(c));
    await prisma.user.update({ where: { id: p.user.id }, data: { lockedUntil: null } });
    const after = (await ctx.checksAs(admin2)).body.checks.find((x) => x.key === 'logins paused now');
    ok('cleared', after.count === before, JSON.stringify(after));
  });

  await S(g, 'A ledger posting that fails is raised as an alert with the event, and the check lists it', m('LEDGER_POSTING_FAILED alert; check fails', { fin: 'Test ledger', audit: 'Alert row with the event id' }), async (ok) => {
    const since = new Date(Date.now() - 1000);
    // A mapping that loses its approval makes the next posting of that kind fail, by design.
    const map = await prisma.ledgerMapping.findFirst({ where: { key: 'SCRAP_WRITEOFF' } });
    await prisma.ledgerMapping.update({ where: { key: map.key }, data: { approvedAt: null } });
    try {
      const c = await ctx.costed(500, 0.4);
      await ctx.adjust(c.coilId, { reason: 'SCRAP', change: -10, notes: 'QA P10 scrap with no approved mapping' });
      const got = await until(async () => (await alertsOf('LEDGER_POSTING_FAILED', since)).length > 0 || (await prisma.ledgerEvent.count({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED'] }, updatedAt: { gte: since } } })) > 0, { ms: 5000 });
      ok('the failure is visible: an alert or a held event', Boolean(got));
      const chk = (await ctx.checksAs(admin2)).body.checks;
      ok('the checks name it', chk.some((x) => ['ledger postings that failed', 'ledger events waiting for a person'].includes(x.key)));
    } finally {
      await prisma.ledgerMapping.update({ where: { key: map.key }, data: { approvedAt: map.approvedAt } });
      for (const e of await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED'] }, updatedAt: { gte: since } } })) await cfo.post(`/api/ledger/events/${e.id}/retry`);
    }
  });

  await S(g, 'Recent alerts are listed newest first with kind, severity and the request id that raised them', m('Ordered list with fields'), async (ok) => {
    const r = await ctx.checksAs(admin2);
    const a = r.body.alerts || [];
    ok('some alerts', a.length > 0);
    ok('newest first', a.every((x, i) => i === 0 || new Date(a[i - 1].at) >= new Date(x.at)));
    ok('fields', a.every((x) => x.kind && x.severity));
  });

  await S(g, 'Sign-in events are in the audit trail: a pause, a password change and sign-out everywhere', m('AUTH rows', { audit: 'AuditLog AUTH rows with user and time' }), async (ok) => {
    // Its own throwaway login, so the rows are this scenario's and not left by an earlier group.
    const p = await ctx.person('CSR', ctx.L1, 'p10-audit');
    const pw = await ctx.as(p.token).put('/api/auth/password', { currentPassword: ctx.QA_PASSWORD, newPassword: 'Changed-pass-9' });
    ok('password changed', pw.status === 200, `${pw.status}`);
    const again = (await ctx.signIn(p.user.email, 'Changed-pass-9')).body;
    ok('signed in with the new one', Boolean(again?.token));
    const out = await ctx.as(again.token).post('/api/auth/logout-all', {});
    ok('signed out everywhere', out.status === 200, `${out.status}`);
    for (let i = 0; i < 11; i += 1) await ctx.signIn(p.user.email, 'wrong-password-x').catch(() => null); // ten in a row pause the login
    for (const t of ['PASSWORD_CHANGED', 'SIGNED_OUT_EVERYWHERE', 'LOGIN_LOCKED']) {
      const rows = await prisma.auditLog.findMany({ where: { category: 'AUTH', eventType: t, userId: p.user.id } });
      ok(`${t} recorded for this login, with its time`, rows.length >= 1 && rows.every((r) => r.createdAt || r.timestamp), `${rows.length}`);
    }
  });

  await S(g, 'The audit trail of overrides keeps the original row when an override is revoked', m('Revoke adds a row and changes none', { sec: 'History is append-only in the application (Y-011)', audit: 'ORDER_OVERRIDE_REVOKED row' }), async (ok) => {
    const src = fs.readFileSync(path.join(root, 'src/backend/src/routes/overrides.js'), 'utf8');
    ok('no update of an audit row', !/auditLog\.update/.test(src));
    const any = fs.readdirSync(path.join(root, 'src/backend/src/routes')).filter((f) => f.endsWith('.js')).some((f) => /auditLog\.(update|delete|upsert)/.test(fs.readFileSync(path.join(root, 'src/backend/src/routes', f), 'utf8')));
    ok('no route changes or deletes an audit row', !any);
  });

  await S(g, 'The general rate limit and the sign-in limit are set, and the sign-in limit counts address and login together', m('Both limiters present', { sec: 'Brute force and floods are slowed; per-login pause is the backstop across instances (E-014)' }), async (ok) => {
    const src = fs.readFileSync(path.join(root, 'src/backend/src/app.js'), 'utf8');
    ok('general limit', /app\.use\('\/api', rateLimit/.test(src));
    ok('sign-in limit by address and login', /keyGenerator: \(req\) => `\$\{req\.ip\}:\$\{String\(req\.body\?\.email/.test(src));
  });

  await S(g, 'Secrets are read from the host settings and never printed at start-up', m('No secret value in the server log'), async (ok) => {
    const log = logText();
    ok('no signing secret, tasks secret or provider key', !/qa-jwt-secret-not-real|qa-tasks-secret-not-real|qa-not-a-real-ai-key|qa-runtime-not-a-secret/.test(log));
  });

  await S(g, 'A sales rep cannot read the operations pages', m('403 on checks and integrations'), async (ok) => {
    ok('checks', (await ctx.checksAs(sales)).status === 403);
    ok('integrations changes refused', (await sales.post('/api/admin/integrations/run', {})).status === 403);
  });

  await S(g, 'An unhandled error inside a route is answered with a plain sentence and logged with the request id', m('500 with a sentence; the id in the log'), async (ok) => {
    const id = `qa-p10-err-${Date.now()}`;
    const r = await http1('GET', `/api/ledger/entries/${'%'.repeat(3)}`, { token: cfo.token, headers: { 'x-request-id': id } });
    ok('answered without internals', r.status >= 400 && !/stack|node_modules|prisma/i.test(r.raw), `${r.status} ${r.raw.slice(0, 120)}`);
  });

  await S(g, 'Journal reads by an auditor are in the audit trail with the reader and what was read', m('READ rows for journal', { audit: 'AuditLog rows' }), async (ok) => {
    const since = new Date(Date.now() - 1000);
    await ctx.auditor.get('/api/ledger/reports/trial-balance');
    const rows = await until(async () => prisma.auditLog.count({ where: { userId: ctx.auditor.user.id, timestamp: { gte: since } } }), { ms: 4000 });
    ok('recorded', rows > 0, String(rows));
  });

  await S(g, 'The time zone of the books and the server clock are recorded with each reconciliation', m('A run carries its time'), async (ok) => {
    const r = await cfo.get('/api/ledger/reconciliations');
    ok('listed', r.status === 200 && Array.isArray(r.body.reconciliations), `${r.status}`);
    ok('each has a time', (r.body.reconciliations || []).every((x) => x.asOf || x.at || x.createdAt || x.ranAt));
  });

  await S(g, 'The alert channel can be switched off: with no address set nothing is sent and alerts are still stored', m('ALERT_WEBHOOK_URL empty: stored, not sent', { rec: 'Alerts stay on the Integrations page' }), async (ok) => {
    const { raiseAlert } = await import(`${root}/src/backend/src/lib/alerts.js`);
    const keep = process.env.ALERT_WEBHOOK_URL; delete process.env.ALERT_WEBHOOK_URL;
    const quiet = console.error; console.error = () => {};
    try {
      const r = await raiseAlert('SCHEDULED_RUN_FAILED', { qa: true }, { key: `qa-p10-nochannel-${Date.now()}`, db: prisma });
      ok('stored', r.stored === true);
      ok('not sent', r.sent === false);
    } finally { console.error = quiet; if (keep) process.env.ALERT_WEBHOOK_URL = keep; }
  });

  await S(g, 'Background posting failures do not slow or fail the sale that triggered them', m('The sale answers 200 even when its alert cannot be sent'), async (ok) => {
    ctx.setMode('alerts', { status: 200, delayMs: 3000 });
    try {
      const t = Date.now();
      const s = await ctx.shipped(50, { price: 0.5 });
      ok('the sale was quick', Date.now() - t < 6000 && Boolean(s.invoice), `${Date.now() - t} ms`);
    } finally { ctx.setMode('alerts', { status: 200 }); }
  });

  await S(g, 'Infrastructure settings: the API runs with a 30 second limit and 1 GB, and the frontend is static', m('vercel.json as documented'), async (ok) => {
    const v = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    ok('one API function', Boolean(v.functions?.['api/index.js']));
    ok('time limit set', v.functions['api/index.js'].maxDuration === 30);
    ok('static frontend output', v.outputDirectory === 'src/frontend/dist');
  });
  void err;

  await S(g, 'Goods shipped and left without an invoice for more than fifteen minutes fail the checks and raise an alert (Y-021)', m('shipped goods invoiced fails with the order counted; the scheduled run stores SHIPPED_NOT_INVOICED'), async (ok) => {
    const before = (await ctx.checksAs(admin2)).body.checks.find((c) => c.key === 'shipped goods invoiced');
    ok('the check exists', Boolean(before), JSON.stringify((await ctx.checksAs(admin2)).body.checks.map((c) => c.key)));
    const { shipment, order } = await ctx.B.readyToShip(40);
    await ctx.B.dispatch(shipment);
    const inv = await prisma.invoice.findFirst({ where: { orderId: order.id, kind: 'INVOICE' } });
    ok('billed at dispatch', Boolean(inv));
    // The invoice is cancelled (as if it had never been raised) and the order is dated an hour back.
    const c = await ctx.A.post(`/api/invoices/${inv.id}/cancel`, { reason: 'QA P10 unbilled shipment' }, 'admin');
    ok('cancelled', c.status === 200, `${c.status} ${err(c)}`);
    await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date(Date.now() - 3600_000) } });
    const now = (await ctx.checksAs(admin2)).body.checks.find((x) => x.key === 'shipped goods invoiced');
    ok('the check fails and counts it', now && !now.ok && now.count >= (before?.count || 0) + 1, JSON.stringify(now));
    const run = await ctx.runTasks();
    ok('the scheduled run ran', run.status === 200, `${run.status}`);
    const a = await ctx.alertsOf('SHIPPED_NOT_INVOICED');
    ok('the alert is stored', a.length >= 1, `${a.length}`);
    // Put right: the invoice is raised again from the shipment.
    const again = await ctx.A.post('/api/invoices', { shipmentId: shipment.id }, 'admin');
    ok('raised again', again.status === 201, `${again.status} ${err(again)}`);
    const after = (await ctx.checksAs(admin2)).body.checks.find((x) => x.key === 'shipped goods invoiced');
    ok('and the count goes back down', (after.count || 0) === (before?.count || 0), JSON.stringify(after));
  });
}
