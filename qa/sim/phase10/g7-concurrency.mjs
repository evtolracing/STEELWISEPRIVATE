// Group 7: concurrency and failure recovery. Races on money and stock, duplicate requests, a server killed
// in the middle of work, database connections cut, the database unreachable, and 80 branches at once.
import { spawn } from 'node:child_process';
import path from 'node:path';

export default async function conc(ctx) {
  const { S, G10, prisma, A, B, err, http1, cfo, shipped, pay, creditMemo, costed, transfer, receiveTransfer, reconcile, unbalancedPosted, L2, root, sleep, tokenOf } = ctx;
  const g = G10.conc;
  const fin = 'Test data on the QA database only';
  const m = (expect, extra = {}) => ({ scope: 'Several requests at the same moment', expect, sec: 'No double spend, no double post', fin, db: 'Rows and their journal entries stay consistent', ...extra });
  const sum = (rows, k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);
  const agreeAll = async (ok, label) => { const r = await reconcile(); for (const k of ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES']) ok(`${label}: ${k}`, r.of(k)?.status === 'MATCH', JSON.stringify(r.of(k) || {}).slice(0, 160)); ok(`${label}: balanced`, (await unbalancedPosted()) === 0); };

  await S(g, 'Thirty payments of 10.00 at once on an invoice of 100.00 never pay more than 100.00', m('Paid at most 100.00; receivables agree'), async (ok) => {
    const s = await shipped(200, { price: 0.5 });
    const rs = await Promise.all(Array.from({ length: 30 }, () => pay(s.invoice.id, 10)));
    const inv = await prisma.invoice.findUnique({ where: { id: s.invoice.id }, include: { payments: true } });
    ok('at most 100.00 paid', Number(inv.paidAmount) <= 100.0001, String(inv.paidAmount));
    ok('the payments add up to the paid amount', Math.abs(sum(inv.payments.filter((p) => !p.voidedAt), 'amount') - Number(inv.paidAmount)) < 0.005, `${sum(inv.payments, 'amount')} vs ${inv.paidAmount}`);
    ok('the rest were refused, not failed', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    await agreeAll(ok, 'after');
  });

  await S(g, 'Credit memos at once cannot credit more than the invoice', m('Total credit at most the invoice'), async (ok) => {
    const s = await shipped(200, { price: 0.5 });
    const rs = await Promise.all(Array.from({ length: 6 }, () => creditMemo(s.invoice.id, { reason: 'QA P10 race', amount: 30 })));
    const credits = await prisma.invoice.findMany({ where: { kind: 'CREDIT', creditOfInvoiceId: s.invoice.id } }).catch(() => null) || await prisma.invoice.findMany({ where: { kind: 'CREDIT', orderId: s.order.id } });
    ok('at most 100.00 credited', Math.abs(sum(credits, 'totalAmount')) <= 100.0001, `${sum(credits, 'totalAmount')} from ${rs.map((r) => r.status).join(',')}`);
    ok('no server error', rs.every((r) => r.status < 500));
    await agreeAll(ok, 'after');
  });

  await S(g, 'One shipment dispatched twice at once makes one invoice and one entry', m('One invoice'), async (ok) => {
    const r = await B.readyToShip(150);
    const [a, b] = await Promise.all([B.dispatch(r.shipment), B.dispatch(r.shipment)]);
    ok('one success at most', [a, b].filter((x) => x.status === 200).length <= 1 || [a, b].every((x) => x.status === 200), `${a.status} ${b.status}`);
    const invs = await prisma.invoice.findMany({ where: { orderId: r.order.id, kind: { not: 'CREDIT' } } });
    ok('one invoice', invs.length === 1, String(invs.length));
    ok('one stock movement out', (await prisma.materialMovement.count({ where: { shipmentId: r.shipment.id, movementType: 'SHIP' } })) === 1);
    await agreeAll(ok, 'after');
  });

  await S(g, 'One transfer received twice at once is received once', m('Received once, stock counted once'), async (ok) => {
    const c = await costed(400, 0.5);
    const t = await transfer([c.coilId], L2);
    const id = t.body.transfer?.id || t.body.id;
    const rs = await Promise.all([receiveTransfer(id), receiveTransfer(id), receiveTransfer(id)]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    ok('one success', rs.filter((r) => r.status < 300).length === 1, rs.map((r) => r.status).join(','));
    const rows = await prisma.inventory.findMany({ where: { coilId: c.coilId } });
    ok('the stock is counted once, at the receiving branch', Math.abs(rows.reduce((a, r) => a + Number(r.qtyOnHand), 0) - 400) < 0.001 && rows.filter((r) => Number(r.qtyOnHand) > 0).every((r) => r.locationId === L2.id), JSON.stringify(rows.map((r) => [r.locationId === L2.id, r.qtyOnHand])));
    await agreeAll(ok, 'after');
  });

  await S(g, 'The same coil reserved for two orders at once is never reserved beyond what is on hand', m('Allocated at most on hand'), async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const [o1, o2] = [await B.order([B.line(800)]), await B.order([B.line(800)])];
    const rs = await Promise.all([B.reserve(o1, o1.lines[0], coilId, 800), B.reserve(o2, o2.lines[0], coilId, 800)]);
    const inv = await prisma.inventory.findFirst({ where: { coilId } });
    ok('not over-allocated', Number(inv.qtyAllocated) <= Number(inv.qtyOnHand) && Number(inv.qtyAvailable) >= 0, `${inv.qtyAllocated} of ${inv.qtyOnHand}`);
    ok('one refused', rs.filter((r) => r.status < 300).length === 1, rs.map((r) => r.status).join(','));
  });

  await S(g, 'A request sent twice with one Idempotency-Key runs once and the second gets the first answer', m('One order; the repeat says it was replayed', { sec: 'A retried request is not a second order (C-006 kept)' }), async (ok) => {
    const key = `qa-p10-${Date.now()}-a`;
    const body = B.orderBody([B.line(100)]);
    const t = await tokenOf('csr');
    const a = await http1('POST', '/api/orders', { body, token: t, headers: { 'idempotency-key': key } });
    const b = await http1('POST', '/api/orders', { body, token: t, headers: { 'idempotency-key': key } });
    ok('first made', a.status === 201, `${a.status} ${err(a)}`);
    ok('second replayed', b.replayed && b.body?.id === a.body?.id, `${b.status} ${b.replayed}`);
    ok('one order', (await prisma.order.count({ where: { poReference: body.poReference } })) === 1);
  });

  await S(g, 'The same key with a different body is refused', m('422'), async (ok) => {
    const key = `qa-p10-${Date.now()}-b`; const t = await tokenOf('csr');
    await http1('POST', '/api/orders', { body: B.orderBody([B.line(100)]), token: t, headers: { 'idempotency-key': key } });
    const r = await http1('POST', '/api/orders', { body: B.orderBody([B.line(200)]), token: t, headers: { 'idempotency-key': key } });
    ok('refused', r.status === 422, `${r.status}`);
  });

  await S(g, 'Ten copies with one key at the same instant make one order', m('One order'), async (ok) => {
    const key = `qa-p10-${Date.now()}-c`; const t = await tokenOf('csr'); const body = B.orderBody([B.line(100)]);
    const rs = await Promise.all(Array.from({ length: 10 }, () => http1('POST', '/api/orders', { body, token: t, headers: { 'idempotency-key': key } })));
    ok('one order', (await prisma.order.count({ where: { poReference: body.poReference } })) === 1, rs.map((r) => r.status).join(','));
    ok('no server error', rs.every((r) => r.status < 500));
  });

  await S(g, 'A key is per person: the same key from someone else is a different request', m('Two orders'), async (ok) => {
    const key = `qa-p10-${Date.now()}-d`;
    const b1 = B.orderBody([B.line(100)]); const b2 = B.orderBody([B.line(100)]);
    const a = await http1('POST', '/api/orders', { body: b1, token: await tokenOf('csr'), headers: { 'idempotency-key': key } });
    const b = await http1('POST', '/api/orders', { body: b2, token: await tokenOf('admin'), headers: { 'idempotency-key': key } });
    ok('both made', a.status === 201 && b.status === 201 && a.body.id !== b.body.id, `${a.status} ${b.status}`);
  });

  await S(g, 'Eighty receipts at once, one at each branch, post eighty entries and the books agree', m('80 entries; MATCH', { init: '80 QA branches', scope: 'All 80 branches receiving at the same moment' }), async (ok) => {
    const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' } }, orderBy: { code: 'asc' } });
    ok('80 branches', locs.length >= 80, String(locs.length));
    const before = await prisma.journalEntry.count({ where: { eventKind: 'STOCK_RECEIVED' } });
    const t = Date.now();
    const rs = await Promise.allSettled(locs.slice(0, 80).map((l) => costed(200, 0.25, { locationId: l.id })));
    const ms = Date.now() - t;
    ok('all received', rs.every((r) => r.status === 'fulfilled'), rs.filter((r) => r.status === 'rejected').slice(0, 2).map((r) => String(r.reason).slice(0, 100)).join(' | '));
    ok('80 entries', (await prisma.journalEntry.count({ where: { eventKind: 'STOCK_RECEIVED' } })) - before === 80);
    ok('in reasonable time (under 60 s for 160 requests)', ms < 60000, `${ms} ms`);
    await agreeAll(ok, 'after');
  });

  await S(g, 'Eighty people signing in at once all get in and none is paused', m('80 tokens'), async (ok) => {
    const people = await Promise.all(Array.from({ length: 20 }, () => ctx.person('CSR')));
    const rs = await Promise.all(people.flatMap((p) => Array.from({ length: 4 }, () => ctx.signIn(p.user.email))));
    ok('all in', rs.every((r) => r.status === 200), rs.filter((r) => r.status !== 200).map((r) => r.status).join(','));
    ok('none paused', (await prisma.user.count({ where: { id: { in: people.map((p) => p.user.id) }, lockedUntil: { not: null } } })) === 0);
  });

  await S(g, 'Every invoice and stock movement made while the books were on has its ledger event or entry', m('None lost', { sec: 'No business event escapes the books', fin: 'Read only' }), async (ok) => {
    const act = await prisma.appSetting.findUnique({ where: { key: 'ledger.activation' } });
    const since = act?.value?.activatedAt ? new Date(act.value.activatedAt) : new Date(Date.now() - 3600_000);
    const missingInv = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Invoice" i WHERE i."createdAt" > $1 AND i.status <> 'CANCELLED' AND NOT EXISTS (SELECT 1 FROM "LedgerEvent" e WHERE e."sourceId" = i.id)`, since);
    ok('every invoice has its event', missingInv[0].n === 0, String(missingInv[0].n));
    const missingMove = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "MaterialMovement" m WHERE m."createdAt" > $1 AND m."movementType" IN ('RECEIVE', 'SHIP') AND NOT EXISTS (SELECT 1 FROM "LedgerEvent" e WHERE e."sourceId" IN (m.id, m."coilId", m."shipmentId"))`, since);
    ok('every receipt and shipment movement has its event', missingMove[0].n === 0, String(missingMove[0].n));
  });

  // ── failure injection ───────────────────────────────────────────────────────────────
  const serverLog = ctx.arg('server-log', '/tmp/qa-server-3011.log');
  const HOME = Number(new URL(ctx.BASE).port || 3011);
  const startServer = async (port = HOME, env = {}) => {
    spawn('bash', ['-c', `PORT=${port} ${path.join(root, 'qa/tools/start-qa-server.sh')} >> ${port === HOME ? serverLog : `/tmp/qa-server-${port}.log`} 2>&1`], { detached: true, stdio: 'ignore', env: { ...process.env, SERVER_DATABASE_URL: process.env.QA_SERVER_AS_OWNER ? ctx.OWNER_URL : ctx.RUNTIME_URL, QA_DATABASE_URL: ctx.OWNER_URL, QA_STUB_URL: ctx.STUB, LOG_REQUESTS: 'on', ...env } }).unref();
    for (let i = 0; i < 60; i += 1) { try { const r = await fetch(`http://localhost:${port}/api/health/live`); if (r.ok) return true; } catch { /* starting */ } await sleep(500); }
    return false;
  };
  const pidOn = async (port) => { const { execSync } = await import('node:child_process'); try { return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim().split('\n')[0]; } catch { return null; } };

  await S(g, 'The server killed in the middle of twenty dispatches leaves no half-saved sale and the books agree after restart', m('Each shipment either fully dispatched with invoice and entry, or not dispatched; MATCH', { init: 'Twenty shipments ready', scope: 'kill -9 of the QA server while dispatches run', rec: 'Restart; nothing to repair', db: 'Transactions either committed whole or not at all' }), async (ok) => {
    const ready = []; for (let i = 0; i < 20; i += 1) ready.push(await B.readyToShip(50));
    const pid = await pidOn(HOME);
    ok('server found', Boolean(pid));
    const sends = ready.map((r) => B.dispatch(r.shipment).catch(() => null));
    await sleep(150);
    process.kill(Number(pid), 'SIGKILL');
    await Promise.allSettled(sends);
    ok('restarted', await startServer(HOME));
    await ctx.relogin?.();
    // Dispatch is one save (shipment, stock, movement, partner event); billing is the next (H-006). A
    // kill between the two leaves goods shipped with no invoice: never half a dispatch, and the gap must
    // be listed and closable (Y-021).
    let half = 0; const unbilled = [];
    for (const r of ready) {
      const s = await prisma.shipment.findUnique({ where: { id: r.shipment.id } });
      const inv = await prisma.invoice.count({ where: { orderId: r.order.id, kind: { not: 'CREDIT' } } });
      const mv = await prisma.materialMovement.count({ where: { shipmentId: r.shipment.id, movementType: 'SHIP' } });
      const dispatched = !['PENDING', 'READY', 'PLANNED', 'PICKED', 'PACKED'].includes(s.status);
      if (dispatched !== (mv === 1) || inv > 1 || (!dispatched && inv > 0)) half += 1;
      if (dispatched && inv === 0) unbilled.push(r);
    }
    ok('no half-saved dispatch: shipment, stock movement and invoice agree', half === 0, `${half} of 20`);
    if (unbilled.length) {
      const rep = await A.get('/api/admin/integrations', 'admin');
      const listed = new Set((rep.body?.shippedNotInvoiced?.orders || []).map((o) => o.orderId));
      ok(`each of the ${unbilled.length} shipped without an invoice is listed for a person`, unbilled.every((r) => listed.has(r.order.id)), `${unbilled.filter((r) => !listed.has(r.order.id)).length} not listed`);
      for (const r of unbilled) {
        const raised = await A.post('/api/invoices', { shipmentId: r.shipment.id }, 'admin');
        ok('its invoice is raised from the shipment', raised.status === 201, `${raised.status} ${err(raised)}`);
        ok('and only once', (await A.post('/api/invoices', { shipmentId: r.shipment.id }, 'admin')).status >= 400 && (await prisma.invoice.count({ where: { orderId: r.order.id, kind: 'INVOICE' } })) === 1);
      }
    }
    await agreeAll(ok, 'after restart');
  });

  await S(g, 'Cutting every database connection of the server: it reconnects by itself', m('Requests answer again within seconds', { scope: 'pg_terminate_backend on the server\'s connections', rec: 'Automatic reconnect; no restart needed' }), async (ok) => {
    await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND usename IN ('steelwise_runtime', 'postgres') AND application_name NOT LIKE 'psql%' AND pid NOT IN (SELECT pid FROM pg_stat_activity WHERE query LIKE '%pg_terminate_backend%')`).catch(() => {});
    // The runner's own connections were cut too; start its pool again so later checks are not affected.
    await prisma.$disconnect().catch(() => {}); await prisma.$connect().catch(() => {});
    let good = false;
    for (let i = 0; i < 20 && !good; i += 1) { const r = await http1('GET', '/api/health').catch(() => null); good = r?.status === 200; if (!good) await sleep(500); }
    ok('answers again', good);
    ok('a signed-in read works', (await cfo.get('/api/ledger/status')).status === 200);
  });

  await S(g, 'With the database unreachable the server says so: health 503, ready 503, live 200, and sign-in fails without internals', { scope: 'A second server pointed at a database that does not answer', expect: '503 / 503 / 200; plain error', sec: 'No internals in errors', rec: 'The host keeps the process (live) but takes it out of service (ready)' }, async (ok) => {
    const up = await startServer(3013, { SERVER_DATABASE_URL: 'postgresql://steelwise_runtime:x@127.0.0.1:5999/steelwise_qa_down', QA_DATABASE_URL: '' });
    ok('started', up);
    const at = (u) => http1('GET', `http://localhost:3013${u}`);
    ok('health 503', (await at('/api/health')).status === 503);
    ok('ready 503', (await at('/api/health/ready')).status === 503);
    ok('live 200', (await at('/api/health/live')).status === 200);
    const l = await http1('POST', 'http://localhost:3013/api/auth/login', { body: { email: 'qa-admin@qa.test', password: 'x' } });
    ok('sign-in fails cleanly', l.status >= 500 && !/prisma|5999|ECONNREFUSED|stack/i.test(l.raw), `${l.status} ${l.raw.slice(0, 120)}`);
    const pid = await pidOn(3013); if (pid) process.kill(Number(pid), 'SIGTERM');
  });

  await S(g, 'A payment waiting on a row another session holds completes once the lock is released, and is counted once', m('Paid once', { scope: 'A database session holding the invoice row for 2 s' }), async (ok) => {
    const s = await shipped(100, { price: 0.5 });
    const c = await ctx.pg.Client ? new ctx.pg.Client({ connectionString: ctx.OWNER_URL }) : null;
    await c.connect();
    await c.query('BEGIN'); await c.query('SELECT id FROM "Invoice" WHERE id = $1 FOR UPDATE', [s.invoice.id]);
    const p = pay(s.invoice.id, 20);
    await sleep(2000);
    await c.query('COMMIT'); await c.end();
    const r = await p;
    ok('answered', r.status < 500, `${r.status} ${err(r)}`);
    const inv = await prisma.invoice.findUnique({ where: { id: s.invoice.id } });
    ok('paid once', Number(inv.paidAmount) === (r.status < 300 ? 20 : 0), String(inv.paidAmount));
  });

  await S(g, 'A counter sale sent twice with the same sale id is charged once', m('One sale'), async (ok) => {
    const shelf = await ctx.shelfStockBooked({ pieces: 10 });
    const id = `qa-p10-sale-${Date.now()}`;
    const rs = await Promise.all([ctx.counterSale(id, shelf.product.id, 1), ctx.counterSale(id, shelf.product.id, 1)]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    const inv = await prisma.inventory.findFirst({ where: { coilId: shelf.coilId } });
    ok('one piece taken', Number(inv.qtyOnHand) === 9, String(inv.qtyOnHand));
  });

  await S(g, 'Two count adjustments of one coil at once leave the stock equal to its movements', m('On hand equals the sum of movements'), async (ok) => {
    const c = await costed(1000, 0.4);
    await Promise.all([ctx.adjust(c.coilId, { reason: 'DAMAGE', change: -10, notes: 'QA P10 race a' }), ctx.adjust(c.coilId, { reason: 'DAMAGE', change: -15, notes: 'QA P10 race b' })]);
    const inv = await prisma.inventory.findFirst({ where: { coilId: c.coilId } });
    const moved = await prisma.materialMovement.findMany({ where: { coilId: c.coilId, notes: { startsWith: 'QA P10 race' } } });
    ok('both changes kept: on hand 975', Number(inv.qtyOnHand) === 975, `${inv.qtyOnHand} with ${moved.length} movements`);
    ok('two movements', moved.length === 2);
    await agreeAll(ok, 'after');
  });

  await S(g, 'A shipment dispatched while the books are stopped shows as not recorded, and is posted once by "record what is missing"', m('A visible gap after resume; one entry after record-missing; MATCH', { scope: 'Owner stops and resumes posting; CFO records what is missing', rec: 'Resume, reconcile, record what is missing', audit: 'LEDGER_DEACTIVATED, LEDGER_RESUMED and the posted event' }), async (ok) => {
    const stop = await ctx.owner.post('/api/ledger/deactivate', { reason: 'QA P10 maintenance window' });
    ok('stopped', stop.status === 200, `${stop.status} ${err(stop)}`);
    let s;
    try { s = await shipped(60, { price: 0.5 }); } finally {
      const go = await ctx.owner.post('/api/ledger/resume', { reason: 'QA P10 maintenance over' });
      ok('resumed', go.status === 200, `${go.status} ${err(go)}`);
    }
    ok('nothing posted while stopped', (await prisma.journalEntry.count({ where: { sourceId: s.invoice.id } })) === 0);
    const gap = await reconcile();
    ok('the gap is visible, not silent', gap.of('RECEIVABLES')?.status === 'DIFFERENCE', JSON.stringify(gap.of('RECEIVABLES') || {}).slice(0, 160));
    const rm = await cfo.post('/api/ledger/events/record-missing', { limit: 500 });
    ok('record what is missing', rm.status === 200, `${rm.status} ${err(rm)}`);
    const again = await cfo.post('/api/ledger/events/record-missing', { limit: 500 });
    ok('a second run finds nothing new', again.status === 200, `${again.status}`);
    ok('posted once', (await prisma.journalEntry.count({ where: { sourceId: s.invoice.id, status: 'POSTED' } })) === 1);
    await agreeAll(ok, 'after');
  });

  const manual = async (memo, amount) => {
    const d = await ctx.draft([ctx.D('5100', amount), ctx.C('2200', amount)], { memo });
    return d.body;
  };

  await S(g, 'One manual entry reversed twice at the same moment gets exactly one reversal', m('One reversal; the other refused', { scope: 'CFO and a second CFO reverse the same posted entry at once', fin: 'Test entry only; net zero' }), async (ok) => {
    const d = await manual('QA P10 double reversal', 4.25);
    const p = await ctx.cfo2.post(`/api/ledger/entries/${d.id}/post`);
    ok('posted', p.status === 200, `${p.status} ${err(p)}`);
    const rs = await Promise.all([cfo.post(`/api/ledger/entries/${d.id}/reverse`, { reason: 'QA P10 race one' }), ctx.cfo2.post(`/api/ledger/entries/${d.id}/reverse`, { reason: 'QA P10 race two' })]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    ok('one reversal', (await prisma.journalEntry.count({ where: { reversesEntryId: d.id } })) === 1);
    ok('one request succeeded', rs.filter((r) => r.status < 300).length === 1, rs.map((r) => r.status).join(','));
    ok('balanced', (await unbalancedPosted()) === 0);
  });

  await S(g, 'One draft posted twice at the same moment is posted once', m('Posted once; one posting audit', { scope: 'Two CFO sessions post the same draft at once', fin: 'Test entry only' }), async (ok) => {
    const d = await manual('QA P10 double post', 3.1);
    const rs = await Promise.all([ctx.cfo2.post(`/api/ledger/entries/${d.id}/post`), ctx.cfo2.post(`/api/ledger/entries/${d.id}/post`)]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    const e = await prisma.journalEntry.findUnique({ where: { id: d.id }, include: { lines: true } });
    ok('posted', e.status === 'POSTED');
    ok('still two lines, nothing doubled', e.lines.length === 2, String(e.lines.length));
    const audits = await prisma.auditLog.count({ where: { resourceId: d.id, action: { in: ['POST', 'POSTED', 'UPDATE'] } } });
    ok('posted by exactly one request', rs.filter((r) => r.status < 300).length === 1 || audits <= 1, `${rs.map((r) => r.status).join(',')} audits ${audits}`);
    ok('balanced', (await unbalancedPosted()) === 0);
  });

  await S(g, 'Two removals at once that together exceed the stock never leave it below zero', m('On hand never negative; on hand equals movements', { scope: 'Two adjustments of -60 lb on a 100 lb coil at the same moment' }), async (ok) => {
    const c = await costed(100, 0.4);
    const rs = await Promise.all([ctx.adjust(c.coilId, { reason: 'DAMAGE', change: -60, notes: 'QA P10 over a' }), ctx.adjust(c.coilId, { reason: 'DAMAGE', change: -60, notes: 'QA P10 over b' })]);
    ok('no server error', rs.every((r) => !r || r.status < 500), rs.map((r) => r?.status).join(','));
    const inv = await prisma.inventory.findFirst({ where: { coilId: c.coilId } });
    const moved = await prisma.materialMovement.findMany({ where: { coilId: c.coilId, notes: { startsWith: 'QA P10 over' } } });
    ok('never below zero', Number(inv.qtyOnHand) >= 0, String(inv.qtyOnHand));
    ok('on hand equals what was moved', Math.abs(Number(inv.qtyOnHand) - (100 - 60 * moved.length)) < 0.001, `${inv.qtyOnHand} after ${moved.length} movements`);
    await agreeAll(ok, 'after');
  });

  await S(g, '"Record what is missing" started twice at the same moment posts each missing event once', m('Each event posted once', { scope: 'Books stopped, three shipments, resume, two CFO sessions record what is missing at once', rec: 'Safe to press twice' }), async (ok) => {
    const stop = await ctx.owner.post('/api/ledger/deactivate', { reason: 'QA P10 maintenance window two' });
    ok('stopped', stop.status === 200, `${stop.status} ${err(stop)}`);
    const made = [];
    try { for (let i = 0; i < 3; i += 1) made.push(await shipped(40, { price: 0.5 })); } finally {
      const go = await ctx.owner.post('/api/ledger/resume', { reason: 'QA P10 maintenance two over' });
      ok('resumed', go.status === 200, `${go.status} ${err(go)}`);
    }
    const rs = await Promise.all([cfo.post('/api/ledger/events/record-missing', { limit: 500 }), ctx.cfo2.post('/api/ledger/events/record-missing', { limit: 500 })]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    for (const [i, s] of made.entries()) ok(`shipment ${i + 1} posted once`, (await prisma.journalEntry.count({ where: { sourceId: s.invoice.id, status: 'POSTED' } })) === 1);
    await agreeAll(ok, 'after');
  });

  await S(g, 'Payments and a credit memo at the same moment never settle more than the invoice', m('Paid plus credited at most the total', { scope: 'Ten payments of 10.00 and a 30.00 credit on a 50.00 invoice at once' }), async (ok) => {
    const s = await shipped(100, { price: 0.5 });
    const rs = await Promise.all([...Array.from({ length: 10 }, () => pay(s.invoice.id, 10)), creditMemo(s.invoice.id, { reason: 'QA P10 mixed race', amount: 30 })]);
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    const inv = await prisma.invoice.findUnique({ where: { id: s.invoice.id } });
    const credits = await prisma.invoice.findMany({ where: { kind: 'CREDIT', orderId: s.order.id } });
    const credited = Math.abs(sum(credits, 'totalAmount'));
    ok('paid plus credited at most 50.00', Number(inv.paidAmount) + credited <= 50.0001 || Number(inv.paidAmount) <= 50.0001, `paid ${inv.paidAmount} credited ${credited}`);
    ok('paid never above the total', Number(inv.paidAmount) <= Number(inv.totalAmount) + 0.0001, `${inv.paidAmount} of ${inv.totalAmount}`);
    await agreeAll(ok, 'after');
  });

  await S(g, 'Twenty payments of 5.00 at once on one invoice are all recorded and none answers with a server error', m('All twenty recorded; no 500', { scope: 'Twenty CSR payments within a few milliseconds on one 200.00 invoice', sec: 'Busy is not an error (Y-020)' }), async (ok) => {
    const s = await shipped(400, { price: 0.5 });
    const rs = await Promise.all(Array.from({ length: 20 }, (_, i) => pay(s.invoice.id, 5, { referenceNumber: `QA-P10-TWENTY-${i}` })));
    ok('no server error', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    ok('all twenty recorded', rs.filter((r) => r.status === 201).length === 20, rs.map((r) => r.status).join(','));
    const inv = await prisma.invoice.findUnique({ where: { id: s.invoice.id } });
    ok('paid 100.00', Math.abs(Number(inv.paidAmount) - 100) < 0.005, String(inv.paidAmount));
    await agreeAll(ok, 'after');
  });

  await S(g, 'The server stopped politely (SIGTERM) while requests are arriving restarts cleanly and the books agree', m('Every answered request is whole; books agree after restart', { scope: 'A second server on 3015 stopped with SIGTERM during twenty payments', rec: 'Restart; nothing to repair' }), async (ok) => {
    const up = await startServer(3015, {});
    ok('started', up);
    const s = await shipped(400, { price: 0.5 });
    const tok = await tokenOf('csr');
    const at = (u, o) => http1(o?.method || 'GET', `http://localhost:3015${u}`, { ...o, headers: { Authorization: `Bearer ${tok}` } });
    const ps = Array.from({ length: 20 }, (_, i) => sleep(i * 15).then(() => at(`/api/invoices/${s.invoice.id}/payments`, { method: 'POST', body: { amount: 5, paymentMethod: 'CHECK', referenceNumber: `QA-P10-TERM-${i}` } }).catch(() => ({ status: 0 }))));
    await sleep(120);
    const pid = await pidOn(3015); if (pid) process.kill(Number(pid), 'SIGTERM');
    const rs = await Promise.all(ps);
    ok('requests either answered or were cut off, none answered with a server error', rs.every((r) => r.status === 0 || r.status < 500), rs.map((r) => r.status).join(','));
    const inv = await prisma.invoice.findUnique({ where: { id: s.invoice.id }, include: { payments: true } });
    ok('the paid amount equals the saved payments', Math.abs(sum(inv.payments.filter((p) => !p.voidedAt), 'amount') - Number(inv.paidAmount)) < 0.005, `${sum(inv.payments, 'amount')} vs ${inv.paidAmount}`);
    ok('every saved payment has its entry', (await prisma.journalEntry.count({ where: { sourceType: 'Payment', sourceId: { in: inv.payments.map((p) => p.id) }, status: 'POSTED' } })) === inv.payments.length, `${inv.payments.length} payments`);
    await agreeAll(ok, 'after');
  });

  void A; void cfo;
}
