// Group 7: failure injection and recovery on several server copies. A copy is killed or restarted, the
// network drops or delays answers, the database blocks, connections run out, sessions expire, outside
// services go away. After each: nothing half-saved, a client that retries ends with one result, and the
// books agree. Local QA only; needs the multi-copy front door (qa/tools/qa-cluster.mjs).
import { spawn } from 'node:child_process';
import path from 'node:path';
export default async function run(c) {
  const { S, G11, E, branch, P, hq, lot, order, onDock, sold, all, statuses, count, inv, n, prisma, err, tag, http1, sleep, until, cluster, forge, as, signIn, QA_PASSWORD, D, C, today, reconcile, unbalancedPosted, hitsOf, clearHits, setMode, subscribe, runTasks, makeDue, deliveriesOf, partnerOf, pg, OWNER_URL, root } = c;
  const G = G11.fail;
  const cfo = hq('CFO', 0); const cfo2 = hq('CFO', 1);
  const total = (await cluster.state())?.workers.length || 0;
  const REST = 3300; const seen = { crashes: 0, exhausted: null };
  const none = { status: 0, body: null, raw: '', headers: new Headers() };
  const safe = (p) => Promise.resolve(p).catch((e) => ({ ...none, lost: String(e?.cause?.code || e?.name || e) }));
  const send = (who, m, url, body, headers, timeoutMs) => safe(http1(m, url, { body: m === 'GET' ? undefined : (body ?? {}), headers, token: who.token, timeoutMs }));
  const settled = (r) => r.status > 0 && r.status < 500 && !(r.status === 409 && /still being processed|just sent|Try again|busy/i.test(err(r)));
  /** What a careful client does: send again until there is a definite answer. */
  const again = async (fn, { tries = 10, wait = 500 } = {}) => { let r; for (let i = 0; i < tries; i++) { r = await safe(fn()); if (settled(r)) return r; await sleep(wait); } return r; };
  const outcome = (rs) => `${rs.filter((r) => r.status >= 200 && r.status < 300).length} answered, ${rs.filter((r) => r.status === 502).length} lost with the copy (502), ${rs.filter((r) => r.status === 0).length} cut, ${rs.filter((r) => r.status === 503).length} no copy (503), ${rs.filter((r) => r.status === 500).length} server errors`;
  const down = async (nn, how = 'kill') => { await cluster.post(`${how}/${nn}`); };
  /** Starts the named copies again once each has gone (a polite stop takes a moment), and waits until every copy answers. */
  const up = async (...ns) => {
    for (let i = 0; i < 160; i++) {
      const st = await cluster.state(); const mine = st.workers.filter((w) => ns.includes(w.n));
      for (const w of mine.filter((x) => !x.pid)) await cluster.post(`start/${w.n}`);
      // `up` is cleared the moment a copy is signalled, so "has a process and is up" means it is the new one.
      if (mine.every((w) => w.pid && w.up) && st.workers.every((w) => w.up)) return true;
      await sleep(250);
    }
    return false;
  };
  const whenSaved = async (fn, ms = 3000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn().catch(() => 0)) return true; await sleep(15); } return false; };
  const KEYS = ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES', 'IN_TRANSIT'];
  const agrees = async (ok, label) => { const r = await reconcile(cfo); for (const k of KEYS) { const x = r.of(k); ok(`${label}: ${k} agrees`, x && x.status === 'MATCH', x ? `${x.status} ${x.difference} ${JSON.stringify(x.detail || '').slice(0, 140)}` : `no such check (${r.status})`); } return r; };
  const liveInvoices = (shipmentId) => prisma.invoice.findMany({ where: { shipmentId, kind: 'INVOICE', status: { not: 'CANCELLED' } } });
  const dispatch = (d) => send(d.shipper, 'PUT', `/api/shipments/${d.shipment.id}/dispatch`, {});
  /** Brings every shipment of the list to "left, with one invoice", the way the dock and the office would after a failure. */
  async function finish(docks) {
    const out = { resent: 0, billed: 0 };
    for (const d of docks) {
      let s = await prisma.shipment.findUnique({ where: { id: d.shipment.id } });
      if (!['IN_TRANSIT', 'DELIVERED'].includes(s.status)) { out.resent += 1; await again(() => dispatch(d)); }
      if (!(await liveInvoices(d.shipment.id)).length) { out.billed += 1; await again(() => send(P.csr(d.b) || P.manager(d.b), 'POST', '/api/invoices', { shipmentId: d.shipment.id })); }
    }
    return out;
  }
  const whole = async (docks) => { let half = 0; for (const d of docks) { const s = await prisma.shipment.findUnique({ where: { id: d.shipment.id } }); const mv = await prisma.materialMovement.count({ where: { shipmentId: d.shipment.id, movementType: 'SHIP' } }); const iv = (await liveInvoices(d.shipment.id)).length; const left = ['IN_TRANSIT', 'DELIVERED'].includes(s.status); if (left !== (mv === 1) || iv > 1 || (!left && iv > 0)) half += 1; } return half; };
  const once = async (docks) => { let bad = 0; for (const d of docks) { const s = await prisma.shipment.findUnique({ where: { id: d.shipment.id } }); if (!['IN_TRANSIT', 'DELIVERED'].includes(s.status) || (await liveInvoices(d.shipment.id)).length !== 1 || (await prisma.materialMovement.count({ where: { shipmentId: d.shipment.id, movementType: 'SHIP' } })) !== 1) bad += 1; } return bad; };
  const docksAt = async (b, k, lb = 100) => { const out = []; for (let i = 0; i < k; i++) out.push({ ...(await onDock(b, lb + i, { lotLb: 1300 })), b }); return out; };
  const rec = 'the copy is started again; a client that sends again gets one result; nothing needs repair by hand';

  if (total < 2) {
    await S(G, 'Failure injection needs the multi-copy front door', { expect: 'qa/tools/qa-cluster.mjs running with two or more copies' }, async (ok) => { ok('the front door is running with several copies', false, 'start it with qa/tools/qa-cluster.mjs --workers 3'); });
    return;
  }
  const bL = await branch('LARGE', 6); const bM = await branch('MEDIUM', 17); const bS = await branch('SMALL', 22); const bW = await branch('WAREHOUSE', 3);

  // ── a copy is killed ───────────────────────────────────────────────────────────────────────
  await S(G, 'A server copy is killed in the middle of twenty dispatches', { init: 'Twenty shipments wait on the dock; kill -9 of copy 1 once the first has been saved', expect: 'every shipment either left whole or did not leave; after the copy is back and the dock sends again, each has left once with one invoice; the books agree', db: 'no half-saved dispatch', fin: 'each sale billed once', rec }, async (ok) => {
    const docks = await docksAt(bL, 20);
    const sends = docks.map(dispatch);
    await whenSaved(() => prisma.materialMovement.count({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) }, movementType: 'SHIP' } }));
    await down(1); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('nothing is half-saved', (await whole(docks)) === 0);
    ok('the copy came back', await up(1));
    const f = await finish(docks);
    ok('each shipment left once with one invoice', (await once(docks)) === 0, `${outcome(rs)}; sent again ${f.resent}, billed afterwards ${f.billed}`);
    await agrees(ok, 'afterwards');
  });

  await S(G, 'People keep reading while a server copy is killed', { init: 'Ninety reads in three waves; copy 2 is killed during the second', expect: 'every read is answered: the front door hands a read to another copy', rec: 'reads are not lost with a copy' }, async (ok) => {
    const who = P.manager(bL); const rs = [];
    rs.push(...await all(30, () => send(who, 'GET', '/api/orders?limit=5')));
    const wave = all(30, () => send(who, 'GET', '/api/orders?limit=5')); await down(2); rs.push(...await wave);
    rs.push(...await all(30, () => send(who, 'GET', '/api/orders?limit=5')));
    ok('all ninety answered 200', rs.every((r) => r.status === 200), `${statuses(rs).slice(0, 60)} ${outcome(rs)}`);
    ok('the copy came back', await up(2));
  });

  await S(G, 'The front door takes a dead copy out and puts it back when it answers again', { expect: 'no request goes to the dead copy; after the restart it serves again, and a sign-in made before the crash still works on it', rec: 'sign-ins are not kept in a copy\'s memory, so nobody is signed out by a restart' }, async (ok) => {
    const who = P.manager(bM);
    await down(3); await sleep(300);
    const during = await all(30, () => send(who, 'GET', '/api/orders?limit=1'));
    ok('everything is answered by the other copies', during.every((r) => r.status === 200 && r.headers.get('x-qa-instance') !== '3'), `${statuses(during).slice(0, 40)} by ${[...new Set(during.map((r) => r.headers.get('x-qa-instance')))]}`);
    ok('the copy came back', await up(3));
    const after = await all(30, () => send(who, 'GET', '/api/orders?limit=1'));
    ok('it serves again', after.every((r) => r.status === 200) && after.some((r) => r.headers.get('x-qa-instance') === '3'), [...new Set(after.map((r) => r.headers.get('x-qa-instance')))].join(','));
    const direct = await safe(http1('GET', 'http://127.0.0.1:3113/api/orders?limit=1', { token: who.token }));
    ok('the old sign-in works on the restarted copy itself', direct.status === 200, direct.status);
  });

  await S(G, 'A server copy is killed while twelve payments carrying request keys are being taken', { init: 'Each payment carries its own request key; copy 1 is killed as they arrive', expect: 'a payment whose copy died is not taken twice: sending it again with the same key is held while the first attempt could still be alive, then taken once', fin: 'each invoice is paid once', rec: 'a claim left by a dead copy is taken over after one minute (requestKeys STALE_MS)' }, async (ok) => {
    const sales = []; for (let i = 0; i < 12; i++) sales.push({ ...(await sold(bS, 100 + i)), key: tag('P11FK'), ref: tag('P11FR') });
    const pay = (s) => send(P.csr(bS), 'POST', `/api/invoices/${s.invoice.id}/payments`, { amount: 10, paymentMethod: 'CHECK', referenceNumber: s.ref }, { 'Idempotency-Key': s.key });
    const sends = sales.map(pay); await sleep(8); await down(1); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(1));
    const t0 = Date.now(); let waited = 0;
    for (const [i, s] of sales.entries()) { if (rs[i].status === 201) continue; const r = await again(() => pay(s), { tries: 16, wait: 5000 }); waited += 1; if (r.status !== 201) ok(`payment ${i} was taken on a repeat`, false, `${r.status} ${err(r)}`); }
    const counts = await Promise.all(sales.map((s) => prisma.payment.count({ where: { invoiceId: s.invoice.id } })));
    ok('each invoice has exactly one payment', counts.every((x) => x === 1), `${counts.join('')}; ${outcome(rs)}; ${waited} sent again, settled in ${Math.round((Date.now() - t0) / 1000)} s`);
  });

  await S(G, 'A server copy is killed while thirty journal entries are being posted', { expect: 'every entry is a draft or posted whole; after sending again each is posted once with its own number', fin: 'no unbalanced or half-posted entry', rec }, async (ok) => {
    const ds = await all(30, (i) => cfo.post('/api/ledger/entries', { entryDate: today(), memo: `P11 failure: post during a crash ${i}`, lines: [D('5200', 7 + i), C('2200', 7 + i)] }));
    const ids = ds.map((d) => d.body.id);
    const sends = ids.map((id) => send(cfo2, 'POST', `/api/ledger/entries/${id}/post`));
    await whenSaved(() => prisma.journalEntry.count({ where: { id: { in: ids }, status: 'POSTED' } }));
    await down(2); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('no posted entry is out of balance', (await unbalancedPosted()) === 0);
    ok('the copy came back', await up(2));
    for (const e of await prisma.journalEntry.findMany({ where: { id: { in: ids }, status: 'DRAFT' } })) await again(() => send(cfo2, 'POST', `/api/ledger/entries/${e.id}/post`));
    const es = await prisma.journalEntry.findMany({ where: { id: { in: ids } } });
    ok('all thirty are posted, each with its own number', es.every((e) => e.status === 'POSTED') && new Set(es.map((e) => e.entryNumber)).size === 30, `${es.filter((e) => e.status === 'POSTED').length} posted; ${outcome(rs)}`);
  });

  await S(G, 'A server copy is killed while six coil work orders are being completed', { expect: 'each work order is completed once; its pieces are made once and the weight adds up', db: 'two output items per work order; 1485 + 1485 + 30 scrap = 3000', fin: 'work in progress is cleared once', rec }, async (ok) => {
    const wos = [];
    for (let i = 0; i < 6; i++) { const l = await lot(bM, 3000); l.gone = true; l.free = 0; const wo = await P.scheduler(bM).post('/api/work-orders', { woType: 'SLIT', sourceCoilId: l.coilId, priority: 3, notes: 'P11 failure slit' }); await P.scheduler(bM).put(`/api/work-orders/${wo.body.id}/release`, {}); await P.operator(bM).put(`/api/work-orders/${wo.body.id}/start`, {}); wos.push({ id: wo.body.id, lot: l }); }
    const done = (w) => send(P.operator(bM), 'PUT', `/api/work-orders/${w.id}/complete`, { scrapWeightLb: 30, outputs: [{ weightLb: 1485, widthIn: 24 }, { weightLb: 1485, widthIn: 24 }] });
    const sends = wos.map(done); await sleep(25); await down(3); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(3));
    for (const w of wos) if (!/COMPLETE/.test((await prisma.workOrder.findUnique({ where: { id: w.id } })).status)) await again(() => done(w));
    let bad = 0; for (const w of wos) { const outs = await prisma.workOrderOutput.count({ where: { workOrderId: w.id } }); const kids = await prisma.coil.findMany({ where: { parentCoilId: w.lot.coilId }, include: { inventory: true } }); if (outs !== 2 || n(kids.reduce((s, k) => s + n(k.inventory?.qtyOnHand), 0)) !== 2970 || n((await inv(w.lot.coilId)).qtyOnHand) !== 0) bad += 1; }
    ok('each made two pieces of 1,485 lb, once', bad === 0, `${bad} wrong; ${outcome(rs)}`);
  });

  await S(G, 'A server copy is killed while eight transfers are being received', { expect: 'each transfer is received once; nothing is left on the road in the books or in the records', fin: 'in transit agrees', rec }, async (ok) => {
    const ts = [];
    for (let i = 0; i < 8; i++) { const l = await lot(bW, 1500); l.gone = true; l.free = 0; const t = await P.stock(bW).post('/api/inventory/transfers', { toLocationId: bM.id, coilIds: [l.coilId], carrier: 'Own truck' }); ts.push({ id: t.body.id || t.body.transfer?.id, lot: l }); }
    const recv = (t) => send(P.receiver(bM) || P.stock(bM), 'POST', `/api/inventory/transfers/${t.id}/receive`, {});
    const sends = ts.map(recv); await sleep(20); await down(1); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(1));
    for (const t of ts) if ((await prisma.stockTransfer.findUnique({ where: { id: t.id } })).status === 'SHIPPED') await again(() => recv(t));
    const rows = await prisma.stockTransfer.findMany({ where: { id: { in: ts.map((t) => t.id) } } });
    ok('all eight are received', rows.every((r) => !['SHIPPED', 'DRAFT'].includes(r.status)), `${rows.map((r) => r.status).join(',')}; ${outcome(rs)}`);
    const at = await prisma.coil.count({ where: { id: { in: ts.map((t) => t.lot.coilId) }, locationId: bM.id } });
    ok('all eight items are at the receiving branch', at === 8, at);
    await agrees(ok, 'afterwards');
  });

  // ── a copy is restarted, all copies restart ────────────────────────────────────────────────
  await S(G, 'A server copy is stopped politely (SIGTERM) while thirty payments arrive', { expect: 'no payment is taken twice; every payment the client was told about is saved; the rest are taken when sent again', fin: 'each invoice has one payment of 10.00', rec }, async (ok) => {
    const sales = []; for (let i = 0; i < 30; i++) sales.push(await sold(bS, 100 + i));
    const pay = (s) => send(P.csr(bS), 'POST', `/api/invoices/${s.invoice.id}/payments`, { amount: 10, paymentMethod: 'CHECK', referenceNumber: tag('P11T') });
    const sends = sales.map(pay); await sleep(15); const t0 = Date.now(); await down(2, 'term');
    const gone = await until(async () => !(await cluster.state()).workers.find((w) => w.n === 2).pid, { ms: 12000, every: 50 }); const exitMs = Date.now() - t0;
    const rs = await Promise.all(sends);
    ok('the stopped copy finished its requests and left within three seconds (Z-008)', Boolean(gone) && exitMs < 3000, `${exitMs} ms`);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    let untold = 0;
    for (const [i, s] of sales.entries()) { const k = await prisma.payment.count({ where: { invoiceId: s.invoice.id } }); if (rs[i].status === 201 && k !== 1) ok(`payment ${i} the client was told about is saved once`, false, k); if (rs[i].status !== 201 && k === 1) untold += 1; }
    ok('the copy came back', await up(2));
    for (const s of sales) if (!(await prisma.payment.count({ where: { invoiceId: s.invoice.id } }))) await again(() => pay(s));
    const counts = await Promise.all(sales.map((s) => prisma.payment.count({ where: { invoiceId: s.invoice.id } })));
    ok('each invoice has exactly one payment', counts.every((x) => x === 1), `${outcome(rs)}; ${untold} saved although the answer was lost (the office checks before sending again)`);
  });

  await S(G, 'Every server copy is restarted in turn while forty-five sales go out', { init: 'A rolling restart, as a deployment does: copy 1, then 2, then 3, each after the one before is back', expect: 'every sale goes out once with one invoice; no answer is a 500', rec: 'a deployment does not need the business to stop', fin: 'forty-five invoices, one each' }, async (ok) => {
    const docks = await docksAt(bL, 45); const rs = [];
    const stream = (async () => { for (const d of docks) { rs.push(await again(() => dispatch(d), { tries: 12, wait: 400 })); await sleep(60); } })();
    const ups = [];
    for (let i = 1; i <= total; i++) { await sleep(500); await down(i, 'term'); await sleep(300); ups.push(await up(i)); }
    await stream;
    ok('every copy came back', ups.every(Boolean));
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    const f = await finish(docks);
    ok('each of the forty-five left once with one invoice', (await once(docks)) === 0, `sent again ${f.resent}, billed afterwards ${f.billed}`);
  });

  await S(G, 'Every server copy is down at once, then all are started', { expect: 'the front door says plainly that nothing is running (503); after the start people sign in, a sale goes through and the books agree', rec: 'recovery after a full restart needs no repair', sec: 'the refusal carries no internals' }, async (ok) => {
    for (let i = 1; i <= total; i++) await down(i);
    await sleep(400);
    const r = await safe(http1('GET', '/api/orders?limit=1', { token: P.manager(bL).token }));
    ok('503 with a plain sentence', r.status === 503 && r.body?.code === 'NO_INSTANCE' && !/stack|ECONN|node_modules/.test(r.raw), `${r.status} ${r.raw.slice(0, 120)}`);
    const t0 = Date.now();
    ok('all copies came back', await up(...Array.from({ length: total }, (_, i) => i + 1)));
    const back = Date.now() - t0;
    ok('a person signs in', (await signIn(P.manager(bL).user.email, QA_PASSWORD)).status === 200);
    const s = await sold(bL, 150);
    ok('a sale goes through', !!s.invoice.id, `copies answering again ${back} ms after the start was asked`);
    await agrees(ok, 'after the restart');
  });

  // ── deployment ─────────────────────────────────────────────────────────────────────────────
  await S(G, 'The code is running before database update 18 is applied', { init: 'The RateWindow table is taken away from the QA database for a moment, as on a host where the new code is deployed first', expect: 'sign-in and the partner API keep working; the limits are counted per copy as before; no request fails because of the limiter', rec: 'applying update 18 switches to the shared count with no restart', db: 'the table is put back unchanged' }, async (ok) => {
    const Pp = await partnerOf(bS.customers[0], 'CUSTOMER', ['orders:read']);
    await prisma.$executeRawUnsafe('ALTER TABLE "RateWindow" RENAME TO "RateWindow_away"');
    try {
      const ins = await all(9, () => signIn(P.csr(bS).user.email, QA_PASSWORD));
      ok('sign-in works on every copy', ins.every((r) => r.status === 200), statuses(ins));
      const calls = await all(9, () => Pp.call('GET', '/customer/orders'));
      ok('the partner API works on every copy', calls.every((r) => r.status === 200), statuses(calls));
    } finally { await prisma.$executeRawUnsafe('ALTER TABLE "RateWindow_away" RENAME TO "RateWindow"'); }
    const before = Number((await prisma.$queryRawUnsafe('SELECT coalesce(sum("count"), 0)::int AS n FROM "RateWindow" WHERE "key" LIKE $1', `partner:${Pp.id}:minute`))[0].n);
    await all(6, () => Pp.call('GET', '/customer/orders'));
    const after = Number((await prisma.$queryRawUnsafe('SELECT coalesce(sum("count"), 0)::int AS n FROM "RateWindow" WHERE "key" LIKE $1', `partner:${Pp.id}:minute`))[0].n);
    ok('with the table back the shared count is used again at once', after - before === 6, `${before} -> ${after}`);
  });

  await S(G, 'A deployment given a wrong database address reports that it is not ready', { init: 'A separate copy on port 3140 pointed at a database that does not answer', expect: 'ready 503 and health 503, live 200; sign-in fails without internals; the running copies are not affected', rec: 'a host that checks readiness never sends it traffic; the previous deployment keeps serving', sec: 'no connection string or stack in the answer' }, async (ok) => {
    const child = spawn('bash', [path.join(root, 'qa/tools/start-qa-server.sh')], { detached: true, stdio: 'ignore', env: { ...process.env, PORT: '3140', QA_INSTANCE: 'bad', SERVER_DATABASE_URL: 'postgresql://steelwise_runtime:x@127.0.0.1:5999/steelwise_qa_down', QA_DATABASE_URL: '', DATABASE_URL: 'postgresql://steelwise_runtime:x@127.0.0.1:5999/steelwise_qa_down' } });
    child.unref();
    try {
      const at = (u, o) => safe(http1(o?.m || 'GET', `http://127.0.0.1:3140${u}`, o));
      ok('it started', Boolean(await until(async () => (await at('/api/health/live')).status === 200, { ms: 30000, every: 400 })));
      ok('ready 503', (await at('/api/health/ready')).status === 503);
      ok('health 503', (await at('/api/health')).status === 503);
      const l = await at('/api/auth/login', { m: 'POST', body: { email: P.csr(bS).user.email, password: QA_PASSWORD } });
      ok('sign-in fails cleanly', l.status >= 500 && !/prisma|5999|ECONNREFUSED|stack|steelwise_runtime/i.test(l.raw), `${l.status} ${l.raw.slice(0, 120)}`);
      ok('the running copies still answer', (await all(6, () => send(P.manager(bS), 'GET', '/api/orders?limit=1'))).every((r) => r.status === 200));
    } finally { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ } }
  });

  // ── the database blocks, drops connections, runs out of them ───────────────────────────────
  const owner = async () => { const cl = new pg.Client({ connectionString: OWNER_URL }); await cl.connect(); return cl; };

  await S(G, 'Three requests pay one invoice in full while another session holds its row for two seconds', { expect: 'they wait; one is taken when the row is free; the others are refused', fin: 'paid once', rec: 'a slow database makes people wait, it does not corrupt' }, async (ok) => {
    const s = await sold(bS, 180); const cl = await owner();
    await cl.query('BEGIN'); await cl.query('SELECT id FROM "Invoice" WHERE id = $1 FOR UPDATE', [s.invoice.id]);
    const t0 = Date.now();
    const sends = all(3, () => send(P.csr(bS), 'POST', `/api/invoices/${s.invoice.id}/payments`, { amount: s.total, paymentMethod: 'CHECK', referenceNumber: tag('P11L') }));
    await sleep(2000); await cl.query('COMMIT'); await cl.end();
    const rs = await sends;
    ok('one taken, none a server error', count(rs, 201) === 1 && rs.every((r) => r.status > 0 && r.status < 500), `${statuses(rs)} after ${Date.now() - t0} ms`);
    ok('paid once', (await prisma.payment.count({ where: { invoiceId: s.invoice.id } })) === 1 && n((await prisma.invoice.findUnique({ where: { id: s.invoice.id } })).paidAmount) === s.total);
  });

  await S(G, 'Eight shipments are dispatched while the invoice numbers are held for three seconds', { init: 'Another session holds the document counter, as a long-running statement would', expect: 'the eight wait, then all leave, with eight numbers in a row', fin: 'eight invoices', rec: 'waiting, not failing' }, async (ok) => {
    const docks = await docksAt(bL, 8); const cl = await owner();
    await cl.query('BEGIN'); await cl.query('LOCK TABLE "DocumentCounter" IN SHARE UPDATE EXCLUSIVE MODE');
    const t0 = Date.now(); const sends = docks.map(dispatch);
    await sleep(3000); await cl.query('COMMIT'); await cl.end();
    const rs = await Promise.all(sends);
    ok('all eight left', rs.every((r) => r.status === 200 && r.body?.invoice?.id), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})} in ${Date.now() - t0} ms`);
    const nums = (await prisma.invoice.findMany({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) } } })).map((i) => Number(i.invoiceNumber.replace(/\D/g, ''))).sort((a, b) => a - b);
    ok('eight numbers in a row', nums.length === 8 && nums[7] - nums[0] === 7, nums.join(','));
  });

  await S(G, 'The invoice numbers stay held for longer than a request may wait', { init: 'The document counter is held for 23 seconds; a request gives up after 20', expect: 'the dock is told to try again (not a 500); the goods that left are listed as waiting for their invoice; when the hold ends they are billed once', fin: 'no sale is billed twice and none is lost', rec: 'the unbilled shipment is closed by billing it; the system check lists it meanwhile' }, async (ok) => {
    const docks = await docksAt(bM, 3); const cl = await owner();
    await cl.query('BEGIN'); await cl.query('LOCK TABLE "DocumentCounter" IN SHARE UPDATE EXCLUSIVE MODE');
    const t0 = Date.now(); const sends = docks.map((d) => send(d.shipper, 'PUT', `/api/shipments/${d.shipment.id}/dispatch`, {}, undefined, 40000));
    await sleep(23000); await cl.query('COMMIT'); await cl.end();
    const rs = await Promise.all(sends);
    ok('no answer is a 500', rs.every((r) => r.status > 0 && r.status !== 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 400) || {})} after ${Date.now() - t0} ms`);
    ok('nothing is half-saved', (await whole(docks)) === 0);
    const f = await finish(docks);
    ok('each left once with one invoice in the end', (await once(docks)) === 0, `sent again ${f.resent}, billed afterwards ${f.billed}`);
  });

  await S(G, 'Almost every database connection is taken by something else', { init: 'Idle sessions are opened until only a few connections are left for the application', expect: 'forty requests are answered with what is left: slower, not broken', rec: 'requests queue for a connection; when the sessions go away the speed returns', db: 'no half-saved change' }, async (ok) => {
    const used = Number((await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM pg_stat_activity'))[0].n);
    const max = Number((await prisma.$queryRawUnsafe('SHOW max_connections'))[0].max_connections);
    const hogs = [];
    try {
      for (let i = 0; i < Math.max(0, max - used - 6); i++) { const cl = new pg.Client({ connectionString: OWNER_URL }); try { await cl.connect(); hogs.push(cl); } catch { break; } }
      const docks = await docksAt(bS, 6);
      const t0 = Date.now();
      const [reads, writes] = await Promise.all([all(34, () => send(P.manager(bS), 'GET', '/api/orders?limit=5', undefined, undefined, 60000)), Promise.all(docks.map((d) => send(d.shipper, 'PUT', `/api/shipments/${d.shipment.id}/dispatch`, {}, undefined, 60000)))]);
      const ms = Date.now() - t0;
      ok('reads were answered, or told to try again', reads.every((r) => r.status === 200 || (r.status === 503 && r.body?.code === 'DATABASE_BUSY')) && count(reads, 200) >= 1, `${statuses(reads).slice(0, 60)} with ${hogs.length} connections taken, in ${ms} ms`);
      ok('a change that found no connection is told to try again (503), never a 500', writes.every((r) => r.status === 200 || (r.status === 503 && r.body?.code === 'DATABASE_BUSY' && Number(r.headers.get('retry-after')) >= 1)), `${statuses(writes)} ${err(writes.find((r) => r.status >= 500) || {})}`);
      ok('nothing is half-saved', (await whole(docks)) === 0);
      seen.exhausted = { taken: hogs.length, ms };
      await Promise.all(hogs.splice(0).map((h) => h.end().catch(() => {})));
      await finish(docks);
      ok('every shipment left once with one invoice', (await once(docks)) === 0);
    } finally { await Promise.all(hogs.map((h) => h.end().catch(() => {}))); }
  });

  await S(G, 'Every database connection of the servers is cut while thirty requests are in flight', { init: 'pg_terminate_backend on the application\'s sessions', expect: 'the servers reconnect by themselves within seconds; nothing is half-saved; a failed request succeeds when sent again', rec: 'automatic reconnect; no restart' }, async (ok) => {
    const docks = await docksAt(bS, 10);
    const sends = [...docks.map(dispatch), ...Array.from({ length: 20 }, () => send(P.manager(bS), 'GET', '/api/orders?limit=5'))];
    await sleep(30);
    await prisma.$executeRawUnsafe('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND usename = \'steelwise_runtime\'').catch(() => {});
    const rs = await Promise.all(sends);
    ok('no answer leaked internals', !rs.some((r) => /prisma|terminating connection|stack|node_modules/i.test(r.raw || '')), rs.find((r) => /prisma|terminating/i.test(r.raw || ''))?.raw.slice(0, 160));
    const good = await until(async () => (await safe(http1('GET', '/api/health'))).status === 200, { ms: 10000, every: 300 });
    ok('the servers answer again by themselves', Boolean(good), outcome(rs));
    ok('nothing is half-saved', (await whole(docks)) === 0);
    const f = await finish(docks);
    ok('every shipment left once with one invoice after sending again', (await once(docks)) === 0, `sent again ${f.resent}, billed afterwards ${f.billed}; ${outcome(rs)}`);
    await agrees(ok, 'afterwards');
  });

  // ── the network between the person and the server ──────────────────────────────────────────
  await S(G, 'The network drops after eight payments were sent, and the same payments are sent again', { init: 'The connection is cut 5 ms after each request leaves; each carries a request key', expect: 'no answer reaches the client; the repeat with the same key gets the first answer; one payment each', fin: 'paid once', rec: 'request keys make a blind retry safe' }, async (ok) => {
    const sales = []; for (let i = 0; i < 8; i++) sales.push({ ...(await sold(bS, 100 + i)), key: tag('P11NK'), ref: tag('P11NR') });
    const pay = (s) => send(P.csr(bS), 'POST', `/api/invoices/${s.invoice.id}/payments`, { amount: 12, paymentMethod: 'CHECK', referenceNumber: s.ref }, { 'Idempotency-Key': s.key });
    await cluster.post('mode', { cutAfterSend: 5, only: '/payments' });
    let first; try { first = await Promise.all(sales.map(pay)); } finally { await cluster.post('mode', {}); }
    ok('the client got no answer', first.every((r) => r.status === 0), statuses(first));
    await sleep(800);
    const second = await Promise.all(sales.map((s) => again(() => pay(s), { tries: 14, wait: 5000 })));
    ok('each repeat is answered as taken', second.every((r) => r.status === 201), `${statuses(second)} ${err(second.find((r) => r.status !== 201) || {})}`);
    ok('most repeats were answered from the first attempt', second.filter((r) => r.headers.get('idempotency-replayed') === 'true').length >= 1, second.filter((r) => r.headers.get('idempotency-replayed') === 'true').length);
    const counts = await Promise.all(sales.map((s) => prisma.payment.count({ where: { invoiceId: s.invoice.id } })));
    ok('one payment each', counts.every((x) => x === 1), counts.join(''));
  });

  await S(G, 'The network drops after six dispatches were sent, and the dock sends them again', { expect: 'each shipment leaves once with one invoice, however many times it was sent', fin: 'six invoices', rec: 'dispatch can be sent again safely' }, async (ok) => {
    const docks = await docksAt(bM, 6);
    await cluster.post('mode', { cutAfterSend: 5, only: '/dispatch' });
    let first; try { first = await Promise.all(docks.map(dispatch)); } finally { await cluster.post('mode', {}); }
    ok('the dock got no answer', first.every((r) => r.status === 0), statuses(first));
    await sleep(1500);
    const second = await Promise.all(docks.map((d) => again(() => dispatch(d))));
    ok('no repeat is a server error', second.every((r) => r.status > 0 && r.status < 500), statuses(second));
    await finish(docks);
    ok('each left once with one invoice', (await once(docks)) === 0);
  });

  await S(G, 'The network drops after six orders were sent with request keys, and they are sent again', { expect: 'six orders, not twelve', db: 'one Order per purchase order reference', rec: 'request keys make a blind retry safe' }, async (ok) => {
    const heat = E.heats[bS.grades[0]]; const who = P.seller(bS);
    const make = (i) => { const line = { gradeId: heat.gradeId, description: 'P11 failure: order', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 100, unit: 'LB', unitPrice: 0.62, priceUnit: 'LB', extendedPrice: 62 }; return { key: tag('P11OK'), body: { orderType: 'SO', buyerId: bS.customers[i % bS.customers.length].id, status: 'DRAFT', subtotal: 62, taxAmount: 0, freightAmount: 0, totalAmount: 62, poReference: tag('P11FPO'), locationId: bS.id, lines: [line] } }; };
    const wants = Array.from({ length: 6 }, (_, i) => make(i));
    const place = (w) => send(who, 'POST', '/api/orders', w.body, { 'Idempotency-Key': w.key });
    await cluster.post('mode', { cutAfterSend: 5, only: '/api/orders' });
    let first; try { first = await Promise.all(wants.map(place)); } finally { await cluster.post('mode', {}); }
    ok('the seller got no answer', first.every((r) => r.status === 0), statuses(first));
    await sleep(800);
    const second = await Promise.all(wants.map((w) => again(() => place(w), { tries: 14, wait: 5000 })));
    ok('each repeat is answered with the order', second.every((r) => r.status === 201 && r.body?.id), statuses(second));
    const counts = await Promise.all(wants.map((w) => prisma.order.count({ where: { poReference: w.body.poReference } })));
    ok('one order each', counts.every((x) => x === 1), counts.join(''));
  });

  await S(G, 'Answers to dispatch arrive 2.5 seconds late; the dock gives up after one second and sends again', { init: 'The front door holds every dispatch answer for 2.5 seconds', expect: 'the work was done the first time; the repeat is told so; one invoice each', fin: 'five invoices', rec: 'an impatient repeat does not ship or bill twice' }, async (ok) => {
    const docks = await docksAt(bM, 5);
    await cluster.post('mode', { delayMs: 2500, only: '/dispatch' });
    let first; let second;
    try {
      first = await Promise.all(docks.map((d) => send(d.shipper, 'PUT', `/api/shipments/${d.shipment.id}/dispatch`, {}, undefined, 1000)));
      second = await Promise.all(docks.map((d) => send(d.shipper, 'PUT', `/api/shipments/${d.shipment.id}/dispatch`, {}, undefined, 8000)));
    } finally { await cluster.post('mode', {}); }
    ok('the first attempts timed out at the client', first.every((r) => r.status === 0), statuses(first));
    ok('the repeats were answered without a server error', second.every((r) => r.status > 0 && r.status < 500), statuses(second));
    await finish(docks);
    ok('each left once with one invoice', (await once(docks)) === 0);
  });

  await S(G, 'Answers to posting arrive late and an impatient accountant clicks Post twice', { init: 'The front door holds every posting answer for 1.5 seconds; the second click follows 200 ms after the first', expect: 'each entry is posted once', fin: 'five entries, five numbers' }, async (ok) => {
    const ds = await all(5, (i) => cfo.post('/api/ledger/entries', { entryDate: today(), memo: `P11 failure: double click ${i}`, lines: [D('5200', 9 + i), C('2200', 9 + i)] }));
    await cluster.post('mode', { delayMs: 1500, only: '/post' });
    let rs; try { rs = await Promise.all(ds.flatMap((d) => [send(cfo2, 'POST', `/api/ledger/entries/${d.body.id}/post`), sleep(200).then(() => send(cfo2, 'POST', `/api/ledger/entries/${d.body.id}/post`))])); } finally { await cluster.post('mode', {}); }
    ok('five posts went through and five were refused', count(rs, 200) === 5 && count(rs, 409) === 5, statuses(rs));
    const es = await prisma.journalEntry.findMany({ where: { id: { in: ds.map((d) => d.body.id) } } });
    ok('each is posted once with its own number', es.every((e) => e.status === 'POSTED') && new Set(es.map((e) => e.entryNumber)).size === 5);
  });

  // ── sessions ───────────────────────────────────────────────────────────────────────────────
  await S(G, 'A sign-in that has run out is refused by every copy and changes nothing', { expect: '401 for twelve reads and six writes; nothing saved; after signing in again the same write goes through', sec: 'an expired session cannot act', rec: 'the person signs in again and carries on' }, async (ok) => {
    const who = P.seller(bS); const old = as(forge({ userId: who.user.id, role: who.user.role }, { expiresIn: -30 }));
    const before = await prisma.order.count();
    const reads = await all(12, () => old.get('/api/orders?limit=1'));
    const body = { orderType: 'SO', buyerId: bS.customers[0].id, status: 'DRAFT', subtotal: 0, taxAmount: 0, freightAmount: 0, totalAmount: 0, poReference: tag('P11EXP'), locationId: bS.id, lines: [] };
    const writes = await all(6, () => old.post('/api/orders', body));
    ok('every read is refused', reads.every((r) => r.status === 401), statuses(reads));
    ok('every write is refused', writes.every((r) => r.status === 401), statuses(writes));
    ok('nothing was saved', (await prisma.order.count()) === before);
    const fresh = await signIn(who.user.email, QA_PASSWORD);
    ok('signing in again works', fresh.status === 200 && !!fresh.body.token, fresh.status);
    ok('and the new sign-in reads', (await as(fresh.body.token).get('/api/orders?limit=1')).status === 200);
  });

  await S(G, 'A sign-in runs out in the middle of a job and the job is finished after signing in again', { expect: 'the step sent with the expired sign-in is refused and reserves nothing; after a new sign-in the same step succeeds and the sale completes', db: 'no reservation from the refused step', fin: 'one invoice', rec: 'the job carries on from the step that was refused' }, async (ok) => {
    const l = await lot(bS, 1200); const o = await order(bS, l, 400);
    const st = P.stock(bS); const old = as(forge({ userId: st.user.id, role: st.user.role }, { expiresIn: -5 }));
    const r = await old.post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 400 });
    ok('refused with 401', r.status === 401, r.status);
    ok('nothing was reserved', n((await inv(l.coilId)).qtyAllocated) === 0);
    const fresh = as((await signIn(st.user.email, QA_PASSWORD)).body.token);
    ok('after signing in again the step succeeds', (await fresh.post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 400 })).status === 201);
    const who = P.shipper(bS) || st;
    const s = await who.post('/api/shipments', { orderId: o.id, fromLocationId: bS.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: 400, weightLb: 400 }] });
    const d = await who.put(`/api/shipments/${s.body.id}/dispatch`, {});
    ok('the sale completes with one invoice', d.status === 200 && (await liveInvoices(s.body.id)).length === 1, `${d.status} ${err(d)}`);
  });

  // ── outside services ───────────────────────────────────────────────────────────────────────
  await S(G, 'The partner address, the AI service and the alert channel are all down while twelve sales go out', { expect: 'all twelve sales go out and are billed; the events wait; when the addresses return each event is delivered once', rec: 'the business does not depend on any outside service answering', fin: 'twelve invoices' }, async (ok) => {
    const cust = bM.customers[0]; const PB = await partnerOf(cust, 'CUSTOMER'); const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 503 }); setMode('ai', { status: 503 }); setMode('alerts', { status: 503 });
    let docks;
    try {
      docks = []; for (let i = 0; i < 12; i++) docks.push({ ...(await onDock(bM, 100 + i, { customer: cust, lotLb: 1300 })), b: bM });
      const rs = await Promise.all(docks.map(dispatch));
      ok('all twelve left and were billed', rs.every((r) => r.status === 200 && r.body?.invoice?.id), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
      await until(async () => (await deliveriesOf(hook.id)).length === 12, { ms: 10000 });
      ok('twelve events wait', (await deliveriesOf(hook.id)).filter((r) => r.status !== 'DELIVERED').length === 12);
    } finally { clearHits(hook.name); setMode(hook.name, { status: 200 }); setMode('ai', { status: 200 }); setMode('alerts', { status: 200 }); }
    await sleep(REST);
    for (let i = 0; i < 6 && !(await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED'); i++) { await makeDue(hook.id); await runTasks(); }
    const hits = hitsOf(hook.name);
    ok('each event was delivered once after the address came back', (await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED') && hits.length === 12 && new Set(hits.map((h) => h.body)).size === 12, `${hits.length} calls`);
  });

  // ── races with a copy dying ────────────────────────────────────────────────────────────────
  await S(G, 'Six orders reserve the same 1,000 lb at the same moment while a server copy is killed', { init: 'Six orders of 300 lb each against one item of 1,000 lb', expect: 'at most three are reserved; the item\'s reserved pounds equal the reservations that exist', db: 'Inventory.qtyAllocated = sum of OrderLineAllocation', rec }, async (ok) => {
    const l = await lot(bL, 1000); const orders = []; for (let i = 0; i < 6; i++) orders.push(await order(bL, l, 300));
    const sends = orders.map((o) => send(P.stock(bL), 'POST', `/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 300 }));
    await sleep(10); await down(2); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    const rows = await prisma.orderLineAllocation.aggregate({ where: { coilId: l.coilId }, _sum: { qtyAllocated: true }, _count: true });
    ok('no more than 900 lb is reserved', n(rows._sum.qtyAllocated) <= 900, `${rows._sum.qtyAllocated} in ${rows._count} reservations; ${outcome(rs)}`);
    ok('the item agrees with its reservations', n((await inv(l.coilId)).qtyAllocated) === n(rows._sum.qtyAllocated), `${(await inv(l.coilId)).qtyAllocated}`);
    ok('every reservation the client was told about exists', count(rs, 201) <= rows._count);
    ok('the copy came back', await up(2));
  });

  await S(G, 'Six deliveries are each confirmed three times at the same moment while a server copy is killed', { expect: 'each is delivered once in the end; still one invoice each', db: 'Shipment DELIVERED', rec }, async (ok) => {
    const sales = []; for (let i = 0; i < 6; i++) sales.push(await sold(bM, 100 + i));
    const conf = (s) => send(s.shipper, 'PUT', `/api/shipments/${s.shipment.id}/deliver`, { podSignature: 'P11 Receiver' });
    const sends = sales.flatMap((s) => [conf(s), conf(s), conf(s)]); await sleep(10); await down(3); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(3));
    for (const s of sales) if ((await prisma.shipment.findUnique({ where: { id: s.shipment.id } })).status !== 'DELIVERED') await again(() => conf(s));
    const rows = await prisma.shipment.findMany({ where: { id: { in: sales.map((s) => s.shipment.id) } } });
    ok('all six are delivered', rows.every((r) => r.status === 'DELIVERED'), rows.map((r) => r.status).join(','));
    ok('one invoice each', (await Promise.all(sales.map((s) => liveInvoices(s.shipment.id)))).every((x) => x.length === 1));
  });

  await S(G, 'Twelve invoices are being numbered when a server copy is killed', { expect: 'no invoice number is used twice and none is skipped, across the whole company, although some saves were lost with the copy', fin: 'the invoice series stays gapless', rec: 'a lost save gives its number back, because the number and the invoice are one save' }, async (ok) => {
    const docks = await docksAt(bL, 12);
    const sends = docks.map(dispatch);
    await whenSaved(() => prisma.invoice.count({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) } } }));
    await down(1); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(1));
    await finish(docks);
    ok('each left once with one invoice', (await once(docks)) === 0);
    const mine = (await prisma.invoice.findMany({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) } } })).map((i) => i.invoiceNumber);
    const prefix = mine[0].replace(/[0-9]+$/, ''); const nums = mine.map((x) => Number(x.slice(prefix.length))).sort((a, b) => a - b);
    const lo = nums[0]; const hi = nums[nums.length - 1]; const width = mine[0].length - prefix.length;
    const between = await prisma.invoice.findMany({ where: { invoiceNumber: { gte: `${prefix}${String(lo).padStart(width, '0')}`, lte: `${prefix}${String(hi).padStart(width, '0')}` } }, select: { invoiceNumber: true } });
    ok('no number twice', new Set(between.map((x) => x.invoiceNumber)).size === between.length, between.length);
    ok('no number skipped between the first and the last of these invoices', between.length === hi - lo + 1, `${between.length} invoices for numbers ${lo} to ${hi}`);
  });

  await S(G, 'Thirty entries are being posted by two people when a server copy is restarted', { expect: 'each entry is posted once; entry numbers are not repeated', fin: 'no double posting', rec }, async (ok) => {
    const ds = await all(30, (i) => (i % 2 ? cfo : cfo2).post('/api/ledger/entries', { entryDate: today(), memo: `P11 failure: post during a restart ${i}`, lines: [D('5200', 3 + i), C('2200', 3 + i)] }));
    const post = (d, i) => send(i % 2 ? cfo2 : cfo, 'POST', `/api/ledger/entries/${d.body.id}/post`);
    const sends = ds.flatMap((d, i) => [post(d, i), post(d, i)]); await sleep(20); await down(1, 'term'); const rs = await Promise.all(sends);
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(1));
    for (const [i, d] of ds.entries()) if ((await prisma.journalEntry.findUnique({ where: { id: d.body.id } })).status === 'DRAFT') await again(() => post(d, i));
    const es = await prisma.journalEntry.findMany({ where: { id: { in: ds.map((d) => d.body.id) } } });
    ok('all thirty posted, thirty numbers', es.every((e) => e.status === 'POSTED') && new Set(es.map((e) => e.entryNumber)).size === 30);
    ok('no entry number is used twice in the journal', (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM (SELECT "entryNumber" FROM "JournalEntry" GROUP BY "entryNumber" HAVING count(*) > 1) x'))[0].n === 0);
  });

  await S(G, 'An accounting export is being made when a server copy is killed', { expect: 'the batch is whole or absent: its count equals its items, and no entry is in two batches; the next export carries what is left', fin: 'no entry exported twice or dropped', rec: 'the export is made again; nothing was sent anywhere' }, async (ok) => {
    // The export needs every account mapped (the ledger group does this when it runs first).
    for (const a of ((await cfo.get('/api/ledger/external-accounts/GENERIC')).body.accounts || []).filter((x) => !x.externalAccount)) await cfo.put(`/api/ledger/external-accounts/GENERIC/${a.code}`, { externalAccount: `EXT-${a.code}` });
    const d = await cfo.post('/api/ledger/entries', { entryDate: today(), memo: 'P11 failure: export during a crash', lines: [D('5200', 6), C('2200', 6)] }); await cfo2.post(`/api/ledger/entries/${d.body.id}/post`);
    const sends = all(3, () => send(cfo, 'POST', '/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() }));
    await sleep(15); await down(2); const rs = await sends;
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(2));
    const bad = (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "LedgerExportBatch" b WHERE b.status::text <> \'VOID\' AND b."entryCount" <> (SELECT count(*) FROM "LedgerExportItem" i WHERE i."batchId" = b.id)'))[0].n;
    ok('every batch holds exactly the entries it counts', bad === 0, bad);
    ok('no entry is in two batches', (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM (SELECT "entryId" FROM "LedgerExportItem" WHERE provider = \'GENERIC\' GROUP BY "entryId" HAVING count(*) > 1) x'))[0].n === 0);
    const item = await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "LedgerExportItem" WHERE "entryId" = $1', d.body.id);
    if (!item[0].n) { const r = await again(() => send(cfo, 'POST', '/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() })); ok('made again, it carries the entry', r.status === 201, `${r.status} ${err(r)}`); }
    ok('the entry is in exactly one batch', (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "LedgerExportItem" WHERE "entryId" = $1', d.body.id))[0].n === 1);
  });

  await S(G, 'The books are being reconciled when a server copy is killed', { expect: 'every run that was stored is complete; a run sent again agrees', fin: 'no entry is made by a reconciliation, finished or not', rec }, async (ok) => {
    const since = new Date(); const entries = await prisma.journalEntry.count();
    const sends = all(6, () => send(cfo, 'POST', '/api/ledger/reconciliations')); await sleep(10); await down(1); const rs = await sends;
    ok('no answer was a 500', !rs.some((r) => r.status === 500), outcome(rs));
    ok('the copy came back', await up(1));
    const runs = await prisma.ledgerReconciliation.findMany({ where: { ranAt: { gte: since } } });
    ok('every stored run has all its checks', runs.every((r) => Array.isArray(r.checks) && r.checks.length >= 5 && typeof r.passed === 'boolean'), `${runs.length} runs stored; ${outcome(rs)}`);
    ok('no entry was made', (await prisma.journalEntry.count()) === entries);
    await agrees(ok, 'sent again');
  });

  await S(G, 'Every server copy is killed while the scheduled run is sending partner events', { init: 'Three events wait; the partner answers slowly so the run is in flight when the copies die', expect: 'no event is lost: after the restart a run delivers each one; a copy the partner may already have received carries the same id', rec: 'the next scheduled run picks up what the dead run left', db: 'three deliveries DELIVERED' }, async (ok) => {
    const cust = bM.customers[1] || bM.customers[0]; const PB = await partnerOf(cust, 'CUSTOMER'); const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 503 });
    for (let i = 0; i < 3; i++) await sold(bM, 120 + i, { customer: cust });
    await until(async () => (await deliveriesOf(hook.id)).filter((r) => r.attempts >= 1).length === 3, { ms: 10000 });
    await sleep(REST); clearHits(hook.name); setMode(hook.name, { delayMs: 1200 }); await makeDue(hook.id);
    const running = safe(runTasks()); await sleep(500);
    for (let i = 1; i <= total; i++) await down(i);
    await running; setMode(hook.name, { status: 200 });
    ok('all copies came back', await up(...Array.from({ length: total }, (_, i) => i + 1)));
    await sleep(REST);
    for (let i = 0; i < 8 && !(await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED'); i++) { await prisma.webhookDelivery.updateMany({ where: { webhookId: hook.id, status: { not: 'DELIVERED' } }, data: { nextRetryAt: new Date(Date.now() - 1000) } }); await runTasks(); await sleep(400); }
    const rows = await deliveriesOf(hook.id); const hits = hitsOf(hook.name);
    ok('all three were delivered', rows.every((r) => r.status === 'DELIVERED'), rows.map((r) => `${r.status}/${r.attempts}`).join(','));
    const ids = hits.map((h) => { try { return JSON.parse(h.body).id; } catch { return ''; } });
    ok('the partner saw three different events, and any repeat carries a known id', new Set(ids).size === 3, `${hits.length} calls, ${new Set(ids).size} ids`);
  });

  // ── after all of it ────────────────────────────────────────────────────────────────────────
  await S(G, 'After every failure, no business record was saved without its posting', { expect: 'the search for unposted records finds nothing; no event is failed, pending or held; no shipment that left is unbilled', fin: 'business records and the books were saved together or not at all', audit: 'LedgerEvent for every business event' }, async (ok) => {
    const r = await cfo.post('/api/ledger/events/record-missing', {});
    ok('nothing is missing from the books', r.status === 200 && Number(r.body.found) === 0, `${r.status} found ${r.body?.found}`);
    ok('no event is failed, pending or held', (await c.openEvents()) === 0, await c.openEvents());
    const unbilled = (await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Shipment" s JOIN "Order" o ON o.id = s."orderId" WHERE s.status::text IN ('IN_TRANSIT','DELIVERED') AND o."orderType" = 'SO' AND o."poReference" LIKE 'P11%' AND NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i."shipmentId" = s.id AND i.status::text <> 'CANCELLED')`))[0].n;
    ok('no shipment that left is unbilled', unbilled === 0, unbilled);
  });

  await S(G, 'After every failure, the enterprise\'s records still hold their rules', { expect: 'no negative stock, no stock reserved beyond what is on hand, no repeated document number, every posted entry balanced, and the books agree with the records', db: 'counts of zero', fin: 'reconciliation agrees on every figure' }, async (ok) => {
    const q = async (sql) => (await prisma.$queryRawUnsafe(sql))[0].n;
    ok('no negative stock', (await q('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyOnHand" < 0 OR "qtyAllocated" < 0 OR "qtyAvailable" < 0')) === 0);
    ok('nothing reserved beyond what is on hand', (await q('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyAllocated" > "qtyOnHand"')) === 0);
    ok('reserved pounds equal the reservations', (await q('SELECT count(*)::int AS n FROM "Inventory" i WHERE i."qtyAllocated" <> coalesce((SELECT sum(a."qtyAllocated") FROM "OrderLineAllocation" a WHERE a."coilId" = i."coilId"), 0)')) === 0, await q('SELECT count(*)::int AS n FROM "Inventory" i WHERE i."qtyAllocated" <> coalesce((SELECT sum(a."qtyAllocated") FROM "OrderLineAllocation" a WHERE a."coilId" = i."coilId"), 0)'));
    for (const [what, table, col] of [['invoice', 'Invoice', 'invoiceNumber'], ['order', 'Order', 'orderNumber'], ['shipment', 'Shipment', 'shipmentNumber'], ['journal entry', 'JournalEntry', 'entryNumber']]) ok(`no ${what} number is used twice`, (await q(`SELECT count(*)::int AS n FROM (SELECT "${col}" FROM "${table}" WHERE "${col}" IS NOT NULL GROUP BY "${col}" HAVING count(*) > 1) x`)) === 0);
    ok('every posted entry balances', (await unbalancedPosted()) === 0);
    const r = await agrees(ok, 'the whole enterprise');
    ok('the reconciliation passed as a whole', r.passed === true, JSON.stringify(r.failing));
  });

  await S(G, 'After every failure, every server copy is up, ready and serving', { expect: 'the front door lists every copy as up; each answers its own readiness check; each has served requests since it last started', rec: 'the cluster is back to full strength without a hand on it' }, async (ok) => {
    const st = await cluster.state();
    ok('every copy is up', st.workers.every((w) => w.up && w.pid), st.workers.map((w) => `${w.n}:${w.up}`).join(' '));
    const ready = await Promise.all(st.workers.map((w) => safe(http1('GET', `http://127.0.0.1:${w.port}/api/health/ready`))));
    ok('each answers ready', ready.every((r) => r.status === 200), statuses(ready));
    const rs = await all(30, () => send(P.manager(bL), 'GET', '/api/orders?limit=1'));
    ok('each serves', new Set(rs.map((r) => r.headers.get('x-qa-instance'))).size === st.workers.length && rs.every((r) => r.status === 200), [...new Set(rs.map((r) => r.headers.get('x-qa-instance')))].join(','));
    seen.crashes = st.workers.reduce((a, w) => a + w.exits, 0);
    ok('the copies were stopped many times during this group and are whole', seen.crashes >= 10, `${seen.crashes} stops in all`);
  });

  await S(G, 'Sixty people sign in at once right after every copy has restarted', { init: 'All copies restarted a moment ago: nothing is warm', expect: 'all sixty are signed in; the slowest within the proposed limit of 2.5 seconds', rec: 'a restart at the start of a shift does not lock people out' }, async (ok) => {
    for (let i = 1; i <= total; i++) await down(i, 'term');
    await sleep(300);
    ok('all copies came back', await up(...Array.from({ length: total }, (_, i) => i + 1)));
    const people = E.everyone.slice(0, 60); const took = [];
    const rs = await Promise.all(people.map(async (p) => { const t = Date.now(); const r = await safe(signIn(p.email, QA_PASSWORD)); took.push(Date.now() - t); return r; }));
    took.sort((a, b) => a - b);
    ok('all sixty signed in', rs.every((r) => r.status === 200), statuses(rs).slice(0, 80));
    ok('the slowest within 2.5 seconds', took[took.length - 1] < 2500, `median ${took[30]} ms, slowest ${took[took.length - 1]} ms`);
  });
}
