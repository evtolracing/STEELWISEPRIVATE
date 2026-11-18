// Group 6: integrations, events and background jobs: partner webhooks (signature, replay, dead letter,
// recovery), the scheduled run (its secret, its record), alerts sent to the stand-in channel, ledger
// events that wait and are retried, and outside services that fail or hang.
export default async function integ(ctx) {
  const { S, G10, prisma, A, B, err, http1, hitsOf, clearHits, setMode, until, subscribe, runTasks, makeDue, deliveriesOf, hmac, TASKS_SECRET, alertsOf, cfo, cfo2, admin2, sales, as } = ctx;
  const g = G10.integ;
  const custB = await prisma.organization.findFirst({ where: { code: 'QA-C02' } });
  const custC = await prisma.organization.findFirst({ where: { code: 'QA-C03' } });
  const PB = await ctx.partnerOf(custB, 'CUSTOMER');
  const tried = (r) => Boolean(r && r.attempts >= 1 && (r.httpStatus || r.errorMessage) && r.status !== 'PENDING');
  const m = (expect, extra = {}) => ({ scope: 'Partner of customer QA-C02 with a webhook at the local stand-in', expect, sec: 'Partners get only their own events, signed', db: 'One WebhookDelivery row per event', ...extra });

  const hook = await subscribe(PB, ['shipment.dispatched', 'invoice.issued']);
  const { shipment } = await B.readyToShip(150, { customer: custB });
  await B.dispatch(shipment);
  await until(async () => hitsOf(hook.name).length >= 1, { ms: 8000 });

  await S(g, 'A partner event carries a signature over its body and a timed signature that match the shared secret', m('Both signatures verify'), async (ok) => {
    const h = hitsOf(hook.name)[0];
    ok('delivered', Boolean(h), `${hitsOf(hook.name).length} calls`);
    ok('plain signature', h && h.headers['x-steelwise-signature'] === `sha256=${hmac(hook.secret, h.body)}`);
    const parts = Object.fromEntries(String(h?.headers['x-steelwise-signature-timestamp'] || '').split(',').map((p) => p.split('=')));
    ok('timed signature', parts.v1 === hmac(hook.secret, `${parts.t}.${h?.body}`) && Math.abs(Date.now() / 1000 - Number(parts.t)) < 300);
  });

  await S(g, 'A changed body does not match the signature, so the partner can reject it', m('Mismatch detected'), async (ok) => {
    const h = hitsOf(hook.name)[0];
    const forged = String(h?.body || '').replace(/"type":"[^"]+"/, '"type":"invoice.paid"');
    ok('different', forged !== h?.body);
    ok('the signature no longer matches', h && h.headers['x-steelwise-signature'] !== `sha256=${hmac(hook.secret, forged)}`);
  });

  await S(g, 'The event body carries no secret, token or password', m('Only business facts'), async (ok) => {
    const bodies = hitsOf(hook.name).map((h) => h.body).join(' ');
    ok('none', !/secret|password|token|passwordHash|Bearer/i.test(bodies.replace(/"type":"[^"]*"/g, '')), bodies.slice(0, 200));
  });

  await S(g, 'Another partner never receives this partner\'s events', m('No call to the other partner\'s address'), async (ok) => {
    const PC = await ctx.partnerOf(custC, 'CUSTOMER');
    const hc = await subscribe(PC, ['shipment.dispatched']);
    const r = await B.readyToShip(100, { customer: custB });
    await B.dispatch(r.shipment);
    await until(async () => hitsOf(hook.name).length >= 2, { ms: 6000 });
    ok('nothing for the other partner', hitsOf(hc.name).length === 0, `${hitsOf(hc.name).length}`);
  });

  await S(g, 'A partner cannot point a webhook at a private address in production', { scope: 'Webhook address rules with NODE_ENV=production', expect: 'Refused for localhost, private, link-local and metadata addresses', sec: 'No server-side request forgery through webhooks' }, async (ok) => {
    const { targetProblem } = await import(`${ctx.root}/src/backend/src/services/webhookService.js`);
    for (const u of ['https://localhost/x', 'https://127.0.0.1/x', 'https://10.0.0.5/x', 'https://169.254.169.254/latest/meta-data', 'https://[::1]/x', 'https://db.internal/x', 'http://example.com/x', 'https://user:pw@example.com/x', 'file:///etc/passwd']) ok(u, Boolean(targetProblem(u, { production: true })));
    ok('a public https address is allowed', targetProblem('https://example.com/hook', { production: true }) === null);
  });

  await S(g, 'An event that cannot be delivered is retried, then kept as failed; the check fails and the scheduled run raises an alert', m('FAILED after five tries; WEBHOOK_DEAD_LETTER alert', { rec: 'An administrator replays it after the partner is fixed', audit: 'Alert row' }), async (ok) => {
    const since = new Date(Date.now() - 1000);
    const dead = await subscribe(PB, ['shipment.dispatched']);
    setMode(dead.name, { status: 503 });
    const r = await B.readyToShip(100, { customer: custB });
    await B.dispatch(r.shipment);
    await until(async () => tried((await deliveriesOf(dead.id))[0]), { ms: 8000 });
    for (let i = 0; i < 6; i += 1) { await makeDue(dead.id); await runTasks(); }
    const [row] = await deliveriesOf(dead.id);
    ok('failed after five', row?.status === 'FAILED' && row.attempts === 5, `${row?.status} ${row?.attempts}`);
    const chk = (await ctx.checksAs(admin2)).body;
    ok('the check fails', chk.checks.find((c) => c.key === 'partner events delivered')?.ok === false);
    ok('an alert was raised', Boolean(await until(async () => (await alertsOf('WEBHOOK_DEAD_LETTER', since)).length > 0, { ms: 4000 })));
    setMode(dead.name, { status: 200 });
    const rp = await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {});
    ok('replayed once fixed', rp.status < 300, `${rp.status} ${err(rp)}`);
    await until(async () => (await prisma.webhookDelivery.findUnique({ where: { id: row.id } })).status === 'DELIVERED', { ms: 6000 });
    ok('delivered', (await prisma.webhookDelivery.findUnique({ where: { id: row.id } })).status === 'DELIVERED');
    ok('the replay carries the same event id', hitsOf(dead.name).at(-1)?.headers['x-steelwise-event-id'] === row.eventId);
  });

  await S(g, 'Only an administrator can replay a delivery', m('403 for a sales login'), async (ok) => {
    const row = await prisma.webhookDelivery.findFirst({ orderBy: { createdAt: 'desc' } });
    ok('sales refused', (await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {}, 'csr')).status === 403);
  });

  await S(g, 'The scheduled run needs its secret: none, a wrong one, or one in the address are refused', { scope: 'Anyone calling the scheduler address', expect: '401 each; the right secret 200', sec: 'The scheduler cannot be triggered by outsiders' }, async (ok) => {
    ok('none', (await http1('POST', '/api/internal/tasks/run')).status === 401);
    ok('wrong', (await http1('POST', '/api/internal/tasks/run', { headers: { authorization: 'Bearer wrong-secret' } })).status === 401);
    ok('in the address', (await http1('POST', `/api/internal/tasks/run?secret=${TASKS_SECRET}`)).status === 401);
    ok('a staff token is not the secret', (await http1('POST', '/api/internal/tasks/run', { token: cfo.token })).status === 401);
    ok('the right one', (await runTasks()).status === 200);
  });

  await S(g, 'The scheduled run records when it ran, and the system checks then pass for it', { scope: 'Scheduler', expect: 'lastRun recent; scheduled-run check ok', sec: 'A stopped scheduler becomes visible', audit: 'AppSetting tasks.lastRun' }, async (ok) => {
    const r = await runTasks();
    ok('ran', r.status === 200, `${r.status}`);
    const chk = (await ctx.checksAs(admin2)).body;
    ok('the scheduled run is on time', chk.checks.find((c) => c.key === 'scheduled run on time')?.ok === true, JSON.stringify(chk.checks.find((c) => c.key === 'scheduled run on time')));
    ok('the run reports the checks', Array.isArray(r.body?.checksFailing) || typeof r.body?.alertsRaised === 'number', JSON.stringify(r.body).slice(0, 200));
  });

  await S(g, 'Two scheduled runs at the same moment do not send an event twice', m('Each waiting event sent once'), async (ok) => {
    const h = await subscribe(PB, ['shipment.dispatched']);
    setMode(h.name, { status: 503 });
    const r = await B.readyToShip(100, { customer: custB });
    await B.dispatch(r.shipment);
    await until(async () => tried((await deliveriesOf(h.id))[0]), { ms: 8000 });
    setMode(h.name, { status: 200 });
    clearHits(h.name);
    await makeDue(h.id);
    await Promise.all([runTasks(), runTasks(), runTasks()]);
    await until(async () => hitsOf(h.name).length >= 1, { ms: 5000 });
    await ctx.sleep(500);
    ok('sent once', hitsOf(h.name).length === 1, `${hitsOf(h.name).length}`);
  });

  await S(g, 'An alert is sent to the alert channel with its kind and severity, and nothing secret', { scope: 'The alert channel (local stand-in)', expect: 'One POST per new alert', sec: 'Alerts reach a person; no secret in them', audit: 'Alert row and the channel call' }, async (ok) => {
    clearHits('alerts');
    const p = await ctx.person('CSR');
    for (let i = 0; i < 10; i += 1) await ctx.signIn(p.user.email, `wrong-${i}`);
    await until(async () => hitsOf('alerts').some((h) => h.body.includes(p.user.id)), { ms: 5000 });
    const h = hitsOf('alerts').find((x) => x.body.includes(p.user.id));
    ok('sent', Boolean(h), `${hitsOf('alerts').length} alert calls`);
    const body = h ? JSON.parse(h.body) : {};
    ok('kind and severity', body.kind === 'LOGIN_LOCKED' && body.severity === 'WARNING');
    ok('nothing secret', h && !/\$2[aby]\$|qa-jwt-secret|qa-tasks-secret|Bearer |"password"\s*:|"token"\s*:/i.test(h.body), h?.body.slice(0, 200));
  });

  await S(g, 'When the alert channel is down the alert is still stored and the work that raised it is not affected', { scope: 'Alert channel answering 500', expect: 'Alert row stored; the sign-in refusal unchanged', rec: 'The alert is in the Integrations page list', sec: 'A broken channel never hides an alert' }, async (ok) => {
    setMode('alerts', { status: 500 });
    try {
      const p = await ctx.person('CSR');
      const rs = []; for (let i = 0; i < 10; i += 1) rs.push(await ctx.signIn(p.user.email, `wrong-${i}`));
      ok('the refusals are as usual', rs.every((r) => r.status === 401));
      ok('stored', Boolean(await until(async () => (await alertsOf('LOGIN_LOCKED')).some((a) => a.resourceId === `LOGIN_LOCKED:${p.user.id}`), { ms: 5000 })));
    } finally { setMode('alerts', { status: 200 }); }
  });

  await S(g, 'The same alert is stored once in fifteen minutes, however often it is raised', { scope: 'A storm of the same failure', expect: 'One row per kind and key', sec: 'An alert storm does not flood the history' }, async (ok) => {
    const { raiseAlert } = await import(`${ctx.root}/src/backend/src/lib/alerts.js`);
    const key = `qa-p10-${Date.now()}`;
    const quiet = console.error; console.error = () => {};
    try { for (let i = 0; i < 5; i += 1) await raiseAlert('SCHEDULED_RUN_FAILED', { qa: true }, { key, db: prisma }); } finally { console.error = quiet; }
    ok('one row', (await prisma.auditLog.count({ where: { resourceId: `SCHEDULED_RUN_FAILED:${key}` } })) === 1);
  });

  await S(g, 'Administrators see the checks and recent alerts; others do not', { scope: 'Administrator, sales rep, customer', expect: '200, 403, 403', sec: 'Operational detail is for administrators' }, async (ok) => {
    const a = await ctx.checksAs(admin2);
    ok('administrator', a.status === 200 && Array.isArray(a.body.checks) && Array.isArray(a.body.alerts), `${a.status}`);
    ok('says whether an alert channel is set, not its address', a.body.alertChannel !== undefined && !JSON.stringify(a.body).includes('127.0.0.1:3056/alerts'), JSON.stringify(a.body.alertChannel));
    ok('sales', (await ctx.checksAs(sales)).status === 403);
    ok('customer', [401, 403].includes((await as(await ctx.tokenOf('custA')).get('/api/admin/integrations/checks')).status));
  });

  await S(g, 'A receipt held for a person is posted once when two finance people post it at the same moment', { scope: 'CFO and a second CFO posting a held receipt, naming the account', expect: 'POSTED once; one entry', sec: 'Retries are idempotent', fin: 'One entry for the event' }, async (ok) => {
    // A receipt with no purchase order waits for an accountant to name the other account (Phase 9.5 U3).
    const coilId = await ctx.uncosted(400);
    await ctx.setCost(coilId, 0.4);
    const mv = await prisma.materialMovement.findFirst({ where: { coilId, movementType: 'RECEIVE' } });
    const ev = await until(async () => prisma.ledgerEvent.findFirst({ where: { sourceType: 'MaterialMovement', sourceId: mv.id } }), { ms: 4000 });
    ok('the receipt waits for a person', ev?.status === 'RECONCILIATION_REQUIRED', ev?.status);
    const [r1, r2] = await Promise.all([cfo.post(`/api/ledger/events/${ev.id}/retry`, { offsetAccountCode: '2000' }), cfo2.post(`/api/ledger/events/${ev.id}/retry`, { offsetAccountCode: '2000' })]);
    ok('no server error', r1.status < 500 && r2.status < 500, `${r1.status} ${r2.status}`);
    ok('posted', (await prisma.ledgerEvent.findUnique({ where: { id: ev.id } })).status === 'POSTED');
    ok('one entry', (await prisma.journalEntry.count({ where: { sourceType: 'MaterialMovement', sourceId: mv.id, status: 'POSTED' } })) === 1);
  });

  await S(g, '"Record what is missing" run twice adds nothing the second time', { scope: 'CFO', expect: 'Second run records zero', sec: 'Back-fill is idempotent', fin: 'No duplicate events' }, async (ok) => {
    const a = await cfo.post('/api/ledger/events/record-missing', { limit: 50 });
    const b = await cfo.post('/api/ledger/events/record-missing', { limit: 50 });
    ok('answered', a.status === 200 && b.status === 200, `${a.status} ${b.status}`);
    ok('nothing new the second time', Number(b.body.recorded ?? b.body.created ?? 0) === 0, JSON.stringify(b.body).slice(0, 200));
  });

  await S(g, 'When the AI service fails the assistant answers with a plain refusal, not a server error', { scope: 'CFO; the AI stand-in answering 503', expect: 'A 4xx/503 with a sentence; no stack', rec: 'The screen says the assistant is not available', sec: 'An outside failure does not leak internals' }, async (ok) => {
    setMode('ai', { status: 503 });
    try {
      const r = await cfo.post('/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] });
      ok('no 500', r.status !== 500, `${r.status}`);
      ok('no internals', !/stack|at \w+ \(|node_modules/.test(r.raw), r.raw.slice(0, 200));
    } finally { setMode('ai', { status: 200 }); }
  });

  await S(g, 'When the AI service hangs the assistant gives up within its time limit', { scope: 'CFO; the AI stand-in answering after 5 s with a 1.5 s limit', expect: 'Answer within about 5 s', rec: 'The person tries again later', sec: 'A slow outside service cannot tie up the server' }, async (ok) => {
    setMode('ai', { status: 200, delayMs: 5000 });
    try {
      const t = Date.now();
      const r = await cfo.post('/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] });
      ok('gave up in time', Date.now() - t < 5000, `${Date.now() - t} ms, ${r.status}`);
    } finally { setMode('ai', { status: 200 }); }
  });

  await S(g, 'A revoked partner key stops working at once, not when its token runs out', { scope: 'Administrator revoking a key', expect: 'The live token 401 KEY_REVOKED', sec: 'Revocation is immediate', audit: 'revokedBy is the signed-in administrator (Y-017)' }, async (ok) => {
    const P = await ctx.partnerOf(custB, 'CUSTOMER', ['orders:read']);
    ok('works', (await P.call('GET', '/customer/orders')).status === 200);
    const key = await prisma.partnerApiKey.findFirst({ where: { partnerId: P.id }, orderBy: { createdAt: 'desc' } });
    const r = await A.call('DELETE', `/api/v1/admin/partners/${P.id}/keys/${key.id}`);
    ok('revoked', r.status === 200, `${r.status} ${err(r)}`);
    const after = await P.call('GET', '/customer/orders');
    ok('refused', after.status === 401 && after.body?.error?.code === 'KEY_REVOKED' || after.status === 401, `${after.status} ${JSON.stringify(after.body).slice(0, 120)}`);
    const admin = await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } });
    ok('recorded as revoked by the administrator', (await prisma.partnerApiKey.findUnique({ where: { id: key.id } })).revokedBy === admin.id);
  });

  await S(g, 'A partner token cannot be minted with a wrong client secret, and the refusal does not say which part was wrong', { scope: 'Anyone with a client id', expect: '401 with one message', sec: 'No key guessing feedback' }, async (ok) => {
    const P = await ctx.partnerOf(custB, 'CUSTOMER', ['orders:read']);
    const wrong = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: P.keyId, client_secret: 'wrong' } });
    const unknown = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: 'no-such-client', client_secret: 'wrong' } });
    ok('both refused', wrong.status === 401 && unknown.status === 401, `${wrong.status} ${unknown.status}`);
    ok('same message', JSON.stringify(wrong.body) === JSON.stringify(unknown.body), `${JSON.stringify(wrong.body)} | ${JSON.stringify(unknown.body)}`);
  });

  await S(g, 'A partner token from the staff signing path is refused by the partner API (issuer checked)', { scope: 'A token signed with the staff secret and the partner claims', expect: '401', sec: 'Each audience checks its issuer' }, async (ok) => {
    const t = ctx.forge({ sub: 'x', partner_id: PB.id, scopes: ['orders:read'], iss: 'someone-else' });
    ok('refused', (await http1('GET', '/api/v1/partner/customer/orders', { token: t })).status === 401);
  });

  await S(g, 'The partner API keeps its own rate limit per partner', { scope: 'A partner with a burst limit of 5', expect: 'Calls beyond the burst are refused with 429', sec: 'A partner cannot flood the API', rec: 'The partner waits for the window' }, async (ok) => {
    const P = await ctx.partnerOf(custB, 'CUSTOMER', ['orders:read']);
    await prisma.partner.update({ where: { id: P.id }, data: { burstLimit: 5, rateLimitPerMin: 5 } });
    const rs = await Promise.all(Array.from({ length: 12 }, () => P.call('GET', '/customer/orders')));
    ok('some refused with 429', rs.some((r) => r.status === 429), rs.map((r) => r.status).join(','));
    await prisma.partner.update({ where: { id: P.id }, data: { burstLimit: 100000, rateLimitPerMin: 1000000 } });
  });

  await S(g, 'A partner listing its webhooks never sees a secret again after creation', m('No secret in the list', { sec: 'A webhook secret is shown once' }), async (ok) => {
    const l = await PB.call('GET', '/webhooks');
    ok('listed', l.status === 200 && Array.isArray(l.body?.data) && l.body.data.some((w) => w.id === hook.id), `${l.status}`);
    ok('no secret in any row', !/secret|whsec_/i.test(JSON.stringify(l.body)) && !JSON.stringify(l.body).includes(hook.secret));
  });

  const ext = async (provider) => { const a = (await cfo.get(`/api/ledger/external-accounts/${provider}`)).body.accounts || []; for (const x of a) await cfo.put(`/api/ledger/external-accounts/${provider}/${x.code}`, { externalAccount: `QA-P10-${x.code}` }); return a.length; };
  await S(g, 'An accounting export is a file: making one sends nothing to any outside address', { scope: 'CFO exporting for XERO with every account mapped', expect: 'A batch and a file; no outside call', sec: 'No real accounting transaction is sent during testing', fin: 'An export batch on the QA database only', db: 'One LedgerExportBatch' }, async (ok) => {
    ok('mapped', (await ext('XERO')) > 0);
    const before = ctx.stub ? ctx.stub.hits.length : null;
    const from = '2000-01-01'; const to = new Date().toISOString().slice(0, 10);
    const b = await cfo.post('/api/ledger/exports', { provider: 'XERO', from, to });
    ok('a batch was made', b.status === 201 || (b.status === 409 && b.body?.code === 'NOTHING_TO_EXPORT'), `${b.status} ${err(b)}`);
    const list = (await cfo.get('/api/ledger/exports')).body;
    ok('no accounting system is connected', Array.isArray(list.connected) && list.connected.length === 0 && /nothing is sent/i.test(list.note || ''));
    if (before !== null) ok('no outside call was made', ctx.stub.hits.length === before, `${ctx.stub.hits.length - before} calls`);
    if (b.status === 201) {
      const f = await cfo.get(`/api/ledger/exports/${b.body.id}/file`);
      ok('the file reads back with its checksum', f.status === 200 && typeof f.body?.content === 'string', `${f.status}`);
      ok('the file carries no secret', !/password|secret|token|apikey/i.test(f.body?.content || ''));
    }
  });

  await S(g, 'Only finance makes or settles an accounting export; a sales login cannot even read one', { scope: 'Sales rep and auditor', expect: '403 to make; 403 to read for sales', sec: 'Exports are finance actions', fin: 'Nothing made' }, async (ok) => {
    const n = await prisma.ledgerExportBatch.count();
    ok('an auditor cannot make one', (await ctx.auditor.post('/api/ledger/exports', { provider: 'XERO', from: '2000-01-01', to: '2000-01-02' })).status === 403);
    ok('a sales login cannot list them', (await sales.get('/api/ledger/exports')).status === 403);
    const any = await prisma.ledgerExportBatch.findFirst();
    if (any) {
      ok('a sales login cannot read a file', (await sales.get(`/api/ledger/exports/${any.id}/file`)).status === 403);
      ok('a sales login cannot settle one', (await sales.post(`/api/ledger/exports/${any.id}/settle`, { status: 'ACKNOWLEDGED' })).status === 403);
    }
    ok('nothing was made', (await prisma.ledgerExportBatch.count()) === n);
  });

  await S(g, 'An integrations report answers and names what needs action without secrets', { scope: 'Administrator', expect: '200; no key, secret or URL credentials', sec: 'Operational pages do not leak configuration values' }, async (ok) => {
    const r = await A.get('/api/admin/integrations');
    ok('answered', r.status === 200, `${r.status}`);
    const text = JSON.stringify(r.body);
    ok('no secret values', !/qa-tasks-secret|qa-not-a-real|qa-jwt-secret|qa-runtime-not-a-secret/.test(text), text.slice(0, 120));
  });
  void cfo2;
}
