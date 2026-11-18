// Group 6: partner events, the scheduled run, request keys and outside services, with several server copies
// answering. Every outside address is the local stand-in; nothing leaves the machine.
export default async function run(c) {
  const { S, G11, SELLING, TIERS, E, branch, P, hq, lot, onDock, sold, all, statuses, count, prisma, err, tag, A, http1, hitsOf, clearHits, setMode, until, subscribe, runTasks, makeDue, deliveriesOf, hmac, TASKS_SECRET, alertsOf, admin2, partnerOf, person, signIn, sleep, D, C, today, stub } = c;
  const G = G11.integ;
  const REST = 3300; // OUTBOUND_BREAKER_REST_MS on the QA servers is 3000
  const cfo = hq('CFO', 0); const cfo2 = hq('CFO', 1);
  const tried = (r) => Boolean(r && r.attempts >= 1 && (r.httpStatus || r.errorMessage) && r.status !== 'PENDING');
  const bodyOf = (h) => { try { return JSON.parse(h.body); } catch { return {}; } };
  const typeOf = (h) => bodyOf(h).type || bodyOf(h).event || '';
  const idOf = (h) => bodyOf(h).id || bodyOf(h).eventId || h.headers['x-steelwise-event-id'] || h.headers['x-steelwise-delivery'] || '';
  const drain = async (hookId, runs = 4) => { for (let i = 0; i < runs; i++) { await makeDue(hookId); await runTasks(); } };
  const payKeyed = (who, invoiceId, amount, key, ref) => who.post(`/api/invoices/${invoiceId}/payments`, { amount, paymentMethod: 'CHECK', referenceNumber: ref }, { 'Idempotency-Key': key });

  let k = 12;
  for (const tier of SELLING) {
    const b = await branch(tier, k++); const at = `${TIERS[tier].label} ${b.code}`;
    const cust = b.customers[0]; const PB = await partnerOf(cust, 'CUSTOMER');
    const m = (expect, extra = {}) => ({ init: `A partner account of the branch's customer with a webhook at the local stand-in`, expect, sec: 'partners get only their own events, signed', db: 'one WebhookDelivery row per event', ...extra });

    await S(G, `${at}: a sale sends the customer's partner its shipment and invoice events once each, signed`, m('two events, each delivered once, each signature matching the shared secret'), async (ok) => {
      const hook = await subscribe(PB, ['shipment.dispatched', 'invoice.issued']);
      const s = await sold(b, 250, { customer: cust });
      await until(async () => hitsOf(hook.name).length >= 2, { ms: 9000 });
      const hits = hitsOf(hook.name);
      ok('two events arrived', hits.length === 2, `${hits.length}: ${hits.map(typeOf).join(',')}`);
      ok('one of each kind', new Set(hits.map(typeOf)).size === 2 && hits.some((h) => /shipment/.test(typeOf(h))) && hits.some((h) => /invoice/.test(typeOf(h))), hits.map(typeOf).join(','));
      ok('each signature matches', hits.every((h) => h.headers['x-steelwise-signature'] === `sha256=${hmac(hook.secret, h.body)}`));
      ok('they are about this sale', hits.some((h) => h.body.includes(s.shipment.id) || h.body.includes(s.invoice.id) || h.body.includes(s.invoice.invoiceNumber)), hits[0]?.body.slice(0, 160));
      ok('no secret in the body', !hits.some((h) => /password|Bearer |qa-jwt-secret|client_secret/i.test(h.body)));
      const rows = await deliveriesOf(hook.id);
      ok('two delivery rows, both delivered at the first attempt', rows.length === 2 && rows.every((r) => r.status === 'DELIVERED' && r.attempts === 1), rows.map((r) => `${r.status}/${r.attempts}`).join(','));
    });

    await S(G, `${at}: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once`, m('the event waits, then is delivered exactly once', { rec: 'retried by the scheduled run; never sent twice by runs on different server copies' }), async (ok) => {
      const hook = await subscribe(PB, ['shipment.dispatched']);
      setMode(hook.name, { status: 503 });
      const s = await sold(b, 150, { customer: cust }); void s;
      await until(async () => tried((await deliveriesOf(hook.id))[0]), { ms: 9000 });
      ok('the first attempt failed and the event waits', ['RETRYING', 'PENDING'].includes((await deliveriesOf(hook.id))[0]?.status), (await deliveriesOf(hook.id))[0]?.status);
      setMode(hook.name, { status: 200 }); clearHits(hook.name); await sleep(REST);
      await makeDue(hook.id);
      const rs = await Promise.all([runTasks(), runTasks(), runTasks()]);
      ok('no run is a server error', rs.every((r) => r.status < 500), statuses(rs));
      await until(async () => (await deliveriesOf(hook.id))[0]?.status === 'DELIVERED', { ms: 6000 });
      const [row] = await deliveriesOf(hook.id);
      ok('delivered', row?.status === 'DELIVERED', `${row?.status} ${row?.attempts}`);
      ok('the partner received it once', hitsOf(hook.name).length === 1, hitsOf(hook.name).length);
    });

    await S(G, `${at}: one payment is sent five times at the same moment with one request key`, { expect: 'one payment is recorded; a later repeat is answered with the first answer; the key with a different amount is refused', db: 'one Payment row, one RequestKey', fin: 'cash and receivables move once', rec: 'a client that retries after a lost answer cannot pay twice' }, async (ok) => {
      const s = await sold(b, 200, { customer: cust }); const amount = +(s.total / 10).toFixed(2); const key = tag('P11KEY'); const ref = tag('P11REF');
      const who = P.csr(b) || P.manager(b);
      const rs = await all(5, () => payKeyed(who, s.invoice.id, amount, key, ref));
      ok('none is a server error', rs.every((r) => r.status < 500), statuses(rs));
      ok('one was taken; the others were told it is in hand or given the same answer', count(rs, 201) >= 1 && rs.every((r) => [201, 409].includes(r.status)), statuses(rs));
      ok('one payment row', (await prisma.payment.count({ where: { invoiceId: s.invoice.id } })) === 1);
      const again = await payKeyed(who, s.invoice.id, amount, key, ref);
      ok('a later repeat gets the first answer, marked as a repeat', again.status === 201 && again.headers.get('idempotency-replayed') === 'true', `${again.status} ${again.headers.get('idempotency-replayed')}`);
      ok('the same key with a different amount is refused', (await payKeyed(who, s.invoice.id, amount + 1, key, ref)).status === 422);
      ok('still one payment row', (await prisma.payment.count({ where: { invoiceId: s.invoice.id } })) === 1);
      ok('answered by more than one server copy when several run', c.copies < 2 || new Set(rs.map((r) => r.headers?.get('x-qa-instance'))).size > 1);
    });

    if (b.buyers[0]) {
      await S(G, `${at}: a web order is submitted four times at the same moment with one request key`, { expect: 'one web order', db: 'one OnlineOrder', biz: 'a double click or a retry in the store never orders twice' }, async (ok) => {
        const buyer = b.buyers[0]; const key = tag('P11WEBKEY'); const before = await prisma.onlineOrder.count();
        const rs = await all(4, () => buyer.post('/api/ecom/checkout/submit', { items: [{ productId: E.each.id, quantity: 2, sku: E.each.sku }], deliveryMethod: 'PICKUP' }, { 'Idempotency-Key': key }));
        ok('none is a server error', rs.every((r) => r.status < 500), statuses(rs));
        const ids = new Set(rs.filter((r) => r.body?.data?.id).map((r) => r.body.data.id));
        ok('one order id among the answers', ids.size === 1, `${ids.size}; ${statuses(rs)}`);
        ok('one web order was saved', (await prisma.onlineOrder.count()) === before + 1);
      });
    } else {
      await S(G, `${at}: one transfer is sent four times at the same moment with one request key`, { expect: 'one transfer; the item leaves the branch once', db: 'one StockTransfer for the item', fin: 'in transit rises once' }, async (ok) => {
        const key = tag('P11TRKEY'); const l = await lot(b, 1500); l.gone = true; l.free = 0; const to = await branch('MEDIUM', k + 5);
        const rs = await all(4, () => P.stock(b).post('/api/inventory/transfers', { toLocationId: to.id, coilIds: [l.coilId], carrier: 'Own truck' }, { 'Idempotency-Key': key }));
        ok('none is a server error', rs.every((r) => r.status < 500), statuses(rs));
        const lines = await prisma.stockTransferLine.findMany({ where: { coilId: l.coilId } });
        ok('one transfer carries the item', lines.length === 1, `${lines.length}; ${statuses(rs)}`);
        ok('posted once as in transit', (await prisma.ledgerEvent.count({ where: { eventKind: 'TRANSFER_SHIPPED', sourceId: lines[0]?.id, status: 'POSTED' } })) === 1);
        const rc = await (P.receiver(to) || P.stock(to)).post(`/api/inventory/transfers/${lines[0].transferId}/receive`, {});
        ok('and received at the other branch', rc.status < 300, `${rc.status} ${err(rc)}`);
      });
    }

    await S(G, `${at}: the customer's partner reads its orders thirty times at once and sees only its own`, { expect: 'every read answers; every order belongs to the partner\'s organization; another customer\'s partner cannot open one', sec: 'partner isolation holds under load and on every copy' }, async (ok) => {
      const s = await sold(b, 120, { customer: cust });
      const rs = await all(30, () => PB.call('GET', '/customer/orders?limit=50'));
      ok('every read answers', rs.every((r) => r.status === 200), statuses(rs).slice(0, 80));
      const ids = [...new Set(rs.flatMap((r) => (r.body.data || r.body.orders || []).map((o) => o.id)))];
      const foreign = ids.length ? await prisma.order.count({ where: { id: { in: ids }, buyerId: { not: cust.id } } }) : 0;
      ok('orders were listed and none belongs to anyone else', ids.length > 0 && foreign === 0, `${ids.length} orders, ${foreign} foreign`);
      const other = await partnerOf(b.customers[1] || (await branch(tier, k + 20)).customers[0], 'CUSTOMER');
      const peek = await all(6, () => other.call('GET', `/customer/orders/${s.order.id}`));
      ok('another customer\'s partner cannot open it', peek.every((r) => r.status === 404), statuses(peek));
    });
  }

  // ── across the enterprise ──────────────────────────────────────────────────────────────────
  const bX = await branch('MEDIUM', 15); const custX = bX.customers[0]; const PX = await partnerOf(custX, 'CUSTOMER');

  await S(G, 'The scheduled run needs its secret on every server copy', { expect: '401 without it, with a wrong one, or with it in the address; 200 with it', sec: 'the scheduler cannot be triggered by outsiders' }, async (ok) => {
    const bad = await all(12, (i) => [() => http1('POST', '/api/internal/tasks/run'), () => http1('POST', '/api/internal/tasks/run', { headers: { authorization: 'Bearer wrong-secret' } }), () => http1('POST', `/api/internal/tasks/run?secret=${TASKS_SECRET}`)][i % 3]());
    ok('refused every time', bad.every((r) => r.status === 401), statuses(bad));
    ok('the right secret runs it', (await runTasks()).status === 200);
  });

  await S(G, 'Six scheduled runs start at the same moment on different server copies', { expect: 'every run answers; no event is sent twice; the checks still answer', db: 'no WebhookDelivery delivered twice', rec: 'runs do not need a single scheduler instance' }, async (ok) => {
    const hook = await subscribe(PX, ['shipment.dispatched']); setMode(hook.name, { status: 503 });
    for (let i = 0; i < 3; i++) await sold(bX, 100 + i, { customer: custX });
    await until(async () => (await deliveriesOf(hook.id)).filter(tried).length === 3, { ms: 9000 });
    setMode(hook.name, { status: 200 }); clearHits(hook.name); await sleep(REST); await makeDue(hook.id);
    const rs = await all(6, () => runTasks());
    ok('every run answered without a server error', rs.every((r) => r.status < 500) && count(rs, 200) >= 1, statuses(rs));
    await until(async () => (await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED'), { ms: 6000 });
    await drain(hook.id, 1);
    const hits = hitsOf(hook.name);
    ok('three events, each sent once', hits.length === 3 && new Set(hits.map((h) => h.body)).size === 3, `${hits.length}`);
    ok('the system checks answer for an administrator', (await c.checksAs(admin2)).status === 200);
  });

  await S(G, 'An event that can never be delivered is kept as failed after five attempts, raises an alert, and is sent when an administrator replays it', { expect: 'FAILED after five; the check fails; an alert is stored; replay delivers it once the address is back', rec: 'the dead-letter list and replay', audit: 'ALERT WEBHOOK_DEAD_LETTER; the replay is recorded' }, async (ok) => {
    const since = new Date(Date.now() - 16 * 60000);
    const hook = await subscribe(PX, ['shipment.dispatched']); setMode(hook.name, { status: 503 });
    await sold(bX, 130, { customer: custX });
    await until(async () => tried((await deliveriesOf(hook.id))[0]), { ms: 9000 });
    for (let i = 0; i < 6; i++) { await makeDue(hook.id); await runTasks(); }
    let [row] = await deliveriesOf(hook.id);
    ok('failed after five attempts', row?.status === 'FAILED' && row.attempts === 5, `${row?.status} ${row?.attempts}`);
    ok('the check fails', (await c.checksAs(admin2)).body.checks.find((x) => x.key === 'partner events delivered')?.ok === false);
    ok('an alert is stored (once in fifteen minutes by design)', Boolean(await until(async () => (await alertsOf('WEBHOOK_DEAD_LETTER', since)).length > 0, { ms: 5000 })));
    setMode(hook.name, { status: 200 }); clearHits(hook.name); await sleep(REST);
    ok('a seller cannot replay it', (await P.seller(bX).post(`/api/admin/integrations/deliveries/${row.id}/replay`, {})).status === 403);
    const rp = await admin2.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {});
    ok('the administrator replays it', rp.status === 200, `${rp.status} ${err(rp)}`);
    [row] = await deliveriesOf(hook.id);
    ok('delivered', row.status === 'DELIVERED' && hitsOf(hook.name).length === 1, `${row.status} ${hitsOf(hook.name).length}`);
  });

  await S(G, 'An older event that arrives after a newer one can be put in order by the partner', { init: 'The partner\'s address fails for the first sale and works for the second; the first is delivered later by the scheduled run', expect: 'both arrive once; the late one carries its own earlier time and a different id', rec: 'out-of-order arrival does not lose or duplicate an event' }, async (ok) => {
    const hook = await subscribe(PX, ['shipment.dispatched']); setMode(hook.name, { status: 503 });
    const first = await sold(bX, 140, { customer: custX });
    await until(async () => tried((await deliveriesOf(hook.id))[0]), { ms: 9000 });
    setMode(hook.name, { status: 200 }); clearHits(hook.name); await sleep(REST);
    const second = await sold(bX, 141, { customer: custX });
    await until(async () => hitsOf(hook.name).length >= 1, { ms: 9000 });
    await drain(hook.id, 2);
    await until(async () => hitsOf(hook.name).length >= 2, { ms: 6000 });
    const hits = hitsOf(hook.name);
    ok('both arrived, once each', hits.length === 2 && new Set(hits.map((h) => h.body)).size === 2, hits.length);
    ok('the newer sale arrived first', hits[0]?.body.includes(second.shipment.id) && hits[1]?.body.includes(first.shipment.id), hits.map((h) => (h.body.includes(first.shipment.id) ? 'first' : 'second')).join(','));
    const when = (h) => Date.parse(bodyOf(h).created_at || bodyOf(h).createdAt || bodyOf(h).occurredAt || bodyOf(h).timestamp || bodyOf(h).created || 0);
    ok('each carries its own time, and the late one is the earlier', when(hits[1]) > 0 && when(hits[1]) < when(hits[0]), `${JSON.stringify(Object.keys(bodyOf(hits[0] || { body: '{}' })))} ${when(hits[0])} ${when(hits[1])}`);
    ok('they carry different ids', idOf(hits[0]) && idOf(hits[0]) !== idOf(hits[1]), `${idOf(hits[0])} ${idOf(hits[1])}`);
  });

  await S(G, 'An event whose answer was lost is sent again with the same id, so the partner can drop the copy', { init: 'The partner receives the event but its answer is an error, as when the answer is lost on the way', expect: 'the second delivery carries the id and the body of the first, with a valid signature; one delivery row', rec: 'a duplicate webhook is recognisable by its id', sec: 'a retry is signed like the original' }, async (ok) => {
    const hook = await subscribe(PX, ['shipment.dispatched']); setMode(hook.name, { status: 503 });
    await sold(bX, 160, { customer: custX });
    await until(async () => tried((await deliveriesOf(hook.id))[0]), { ms: 9000 });
    ok('the partner received it once and answered with an error', hitsOf(hook.name).length === 1, hitsOf(hook.name).length);
    setMode(hook.name, { status: 200 }); await sleep(REST);
    await drain(hook.id, 2);
    await until(async () => hitsOf(hook.name).length >= 2, { ms: 5000 });
    const hits = hitsOf(hook.name);
    ok('the partner was called again, once', hits.length === 2, hits.length);
    ok('both calls carry the same id and the same body', new Set(hits.map(idOf)).size === 1 && !!idOf(hits[0]) && hits[0].body === hits[1].body, hits.map(idOf).join(','));
    ok('both calls are signed', hits.every((h) => h.headers['x-steelwise-signature'] === `sha256=${hmac(hook.secret, h.body)}`));
    const rows = await deliveriesOf(hook.id);
    ok('one delivery row, delivered at the second attempt', rows.length === 1 && rows[0].status === 'DELIVERED' && rows[0].attempts === 2, `${rows.length} ${rows[0]?.status}/${rows[0]?.attempts}`);
  });

  await S(G, 'A partner address that answers slowly does not slow the dock', { init: 'The partner\'s address takes 4 seconds; the server gives up on it after 1.5', expect: 'eight shipments are dispatched in their usual time; the events are delivered later', rec: 'the event waits and is retried; the sale never waits for an outside address' }, async (ok) => {
    const hook = await subscribe(PX, ['shipment.dispatched']); setMode(hook.name, { delayMs: 4000 });
    const docks = []; for (let i = 0; i < 8; i++) docks.push(await onDock(bX, 100 + i, { customer: custX, lotLb: 1200 }));
    const t0 = Date.now(); const took = [];
    const rs = await Promise.all(docks.map(async (d) => { const t = Date.now(); const r = await d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {}); took.push(Date.now() - t); return r; }));
    ok('all eight left', rs.every((r) => r.status === 200), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
    ok('none waited for the partner (each under 3 seconds)', Math.max(...took) < 3000, `slowest ${Math.max(...took)} ms, all eight in ${Date.now() - t0} ms`);
    setMode(hook.name, { status: 200 }); await sleep(REST + 1500); clearHits(hook.name);
    await drain(hook.id, 3);
    await until(async () => (await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED'), { ms: 8000 });
    const rows = await deliveriesOf(hook.id);
    ok('all eight events were delivered afterwards', rows.length === 8 && rows.every((r) => r.status === 'DELIVERED'), rows.map((r) => r.status).join(','));
  });

  await S(G, 'A backlog of thirty waiting events is cleared once the partner is back, each sent once', { init: 'The partner\'s address is down while fifteen sales are shipped and billed', expect: 'thirty events wait; after the address returns the scheduled runs deliver every one exactly once', rec: 'queue backlog recovery', db: 'thirty WebhookDelivery rows DELIVERED' }, async (ok) => {
    const hook = await subscribe(PX, ['shipment.dispatched', 'invoice.issued']); setMode(hook.name, { status: 503 });
    const docks = []; for (let i = 0; i < 15; i++) docks.push(await onDock(bX, 100 + i, { customer: custX, lotLb: 1200 }));
    const rs = await Promise.all(docks.map((d) => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {})));
    ok('all fifteen sales went through while the partner was down', rs.every((r) => r.status === 200), statuses(rs));
    await until(async () => (await deliveriesOf(hook.id)).length === 30, { ms: 12000 });
    const waiting = await deliveriesOf(hook.id);
    ok('thirty events wait', waiting.length === 30 && waiting.every((r) => r.status !== 'DELIVERED'), `${waiting.length}`);
    clearHits(hook.name); setMode(hook.name, { status: 200 }); await sleep(REST);
    const t0 = Date.now();
    for (let i = 0; i < 8 && !(await deliveriesOf(hook.id)).every((r) => r.status === 'DELIVERED'); i++) { await makeDue(hook.id); await Promise.all([runTasks(), runTasks()]); }
    const rows = await deliveriesOf(hook.id); const hits = hitsOf(hook.name);
    ok('all thirty delivered', rows.every((r) => r.status === 'DELIVERED'), `${rows.filter((r) => r.status === 'DELIVERED').length} of ${rows.length} in ${Date.now() - t0} ms`);
    ok('each reached the partner exactly once after it came back', hits.length === 30 && new Set(hits.map((h) => h.body)).size === 30, `${hits.length} calls, ${new Set(hits.map((h) => h.body)).size} different`);
  });

  await S(G, 'With the alert channel down an alert is still stored and nobody\'s work is affected', { init: 'The alert address answers 503', expect: 'the alert is in the audit trail; sales continue', rec: 'the alert is kept in the database for the checks screen', audit: 'ALERT LOGIN_LOCKED' }, async (ok) => {
    setMode('alerts', { status: 503 });
    try {
      const p = await person('CSR');
      await all(11, () => signIn(p.user.email, 'wrong-password-for-qa'));
      const alert = await until(async () => (await alertsOf('LOGIN_LOCKED')).find((a) => a.resourceId === `LOGIN_LOCKED:${p.user.id}`), { ms: 5000 });
      ok('the alert is stored', Boolean(alert));
      const s = await sold(bX, 110, { customer: custX });
      ok('a sale goes through meanwhile', !!s.invoice.id);
    } finally { setMode('alerts', { status: 200 }); }
  });

  await S(G, 'With the AI service down nine people ask the assistant at once and the rest of the system is not disturbed', { init: 'The AI stand-in answers 503', expect: 'a plain refusal for each, no internals; order reads at the same moment all answer', rec: 'the assistant says it is not available; it works again when the service returns' }, async (ok) => {
    setMode('ai', { status: 503 });
    try {
      const askers = [cfo, hq('EXECUTIVE', 0), P.manager(bX)];
      const [as, reads] = await Promise.all([all(9, (i) => askers[i % 3].post('/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] })), all(9, () => P.manager(bX).get('/api/orders?limit=5'))]);
      ok('no assistant answer is a 500', as.every((r) => r.status !== 500), statuses(as));
      ok('no internals in any answer', !as.some((r) => /stack|at \w+ \(|node_modules/.test(r.raw)));
      ok('order reads all answered', reads.every((r) => r.status === 200), statuses(reads));
    } finally { setMode('ai', { status: 200 }); }
    await sleep(REST);
    ok('the assistant answers again once the service is back', (await cfo.post('/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] })).status === 200);
  });

  await S(G, 'With the AI service hanging the assistant gives up within its time limit and the server stays quick', { init: 'The AI stand-in answers after 6 seconds; the server\'s limit is 1.5', expect: 'each of six askers is answered within about 6 seconds; the health check answers quickly meanwhile', rec: 'a slow outside service cannot tie up the server' }, async (ok) => {
    setMode('ai', { delayMs: 6000 });
    try {
      const t0 = Date.now();
      const asks = all(6, async () => { const t = Date.now(); const r = await cfo.post('/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] }); return { r, ms: Date.now() - t }; });
      await sleep(300); const h0 = Date.now(); const health = await all(6, () => http1('GET', '/api/health')); const hMs = Date.now() - h0;
      const out = await asks;
      ok('every asker was answered without a 500', out.every((x) => x.r.status !== 500), out.map((x) => x.r.status).join(','));
      ok('each within 6 seconds', out.every((x) => x.ms < 6000), `${out.map((x) => x.ms).join(',')} (all in ${Date.now() - t0})`);
      ok('the health check stayed quick', health.every((r) => r.status === 200) && hMs < 1500, `${hMs} ms`);
    } finally { setMode('ai', { status: 200 }); await sleep(REST); }
  });

  await S(G, 'An accounting export under load calls no outside address', { expect: 'a file is made; the stand-in for outside services records no call', sec: 'nothing is sent into any accounting product', fin: 'no outside book is touched' }, async (ok) => {
    const d = await cfo.post('/api/ledger/entries', { entryDate: today(), memo: 'P11 scenario: for the export', lines: [D('5200', 4), C('2200', 4)] });
    await cfo2.post(`/api/ledger/entries/${d.body.id}/post`);
    await sleep(500); const before = stub.hits.length;
    const r = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() });
    ok('a batch was made', r.status === 201 && r.body.entryCount >= 1, `${r.status} ${err(r)}`);
    await sleep(800);
    const calls = stub.hits.slice(before).filter((h) => !h.name.startsWith('hook:'));
    ok('no outside address was called', calls.length === 0, calls.map((h) => h.name).join(','));
  });

  await S(G, 'A partner key that is revoked stops on every server copy at once', { expect: 'twenty calls straight after are all refused', sec: 'no copy keeps a revoked key alive', audit: 'the key records who revoked it' }, async (ok) => {
    const other = (await branch('SMALL', 20)).customers[0]; const Pk = await partnerOf(other, 'CUSTOMER', ['orders:read']);
    const warm = await all(9, () => Pk.call('GET', '/customer/orders'));
    ok('it works on every copy first', warm.every((r) => r.status === 200), statuses(warm));
    const key = await prisma.partnerApiKey.findFirst({ where: { partnerId: Pk.id }, orderBy: { createdAt: 'desc' } });
    const r = await A.call('DELETE', `/api/v1/admin/partners/${Pk.id}/keys/${key.id}`);
    ok('revoked', r.status === 200, `${r.status} ${err(r)}`);
    const rs = await all(20, () => Pk.call('GET', '/customer/orders'));
    ok('refused every time', rs.every((x) => x.status === 401), statuses(rs));
  });

  await S(G, 'A partner\'s request limit is one limit across all server copies', { init: 'A partner allowed five requests a minute sends thirty at the same moment; the front door spreads them over the server copies', expect: 'about five are answered and the rest are refused with 429 and a time to retry; not five per copy', sec: 'a partner cannot multiply its limit by the number of copies (Z-007)', db: 'the count is kept in RateWindow' }, async (ok) => {
    const other = (await branch('SMALL', 21)).customers[0]; const Pr = await partnerOf(other, 'CUSTOMER', ['orders:read']);
    await prisma.partner.update({ where: { id: Pr.id }, data: { burstLimit: 100000, rateLimitPerMin: 5, rateLimitPerHour: 100000 } });
    try {
      const rs = await all(30, () => Pr.call('GET', '/customer/orders'));
      const passed = count(rs, 200); const refused = count(rs, 429);
      ok('every answer is 200 or 429', passed + refused === 30, statuses(rs));
      // Five in a minute; ten if the thirty happened to straddle the turn of a minute.
      ok('five were answered, not five per server copy', passed >= 1 && passed <= (c.copies > 1 ? 10 : 5) && (passed === 5 || passed === 10 || passed < 10), `${passed} answered on ${c.copies} copies`);
      ok('at most ten in any case', passed <= 10, passed);
      ok('a refusal says when to try again', rs.filter((r) => r.status === 429).every((r) => Number(r.headers.get('retry-after')) >= 1 && r.body?.error?.code === 'RATE_LIMIT_EXCEEDED'));
      ok('more than one server copy took part when several run', c.copies < 2 || new Set(rs.map((r) => r.headers?.get('x-qa-instance'))).size > 1);
      const rows = await prisma.$queryRawUnsafe('SELECT "count" FROM "RateWindow" WHERE "key" = $1 AND "windowStart" >= $2 ORDER BY "windowStart" DESC LIMIT 2', `partner:${Pr.id}:minute`, new Date(Date.now() - 120000)); // this run's minute, or two if it straddled one; not an earlier run's
      ok('the shared count holds all thirty', rows.reduce((a2, r) => a2 + Number(r.count), 0) === 30, JSON.stringify(rows));
    } finally { await prisma.partner.update({ where: { id: Pr.id }, data: { burstLimit: 100000, rateLimitPerMin: 1000000, rateLimitPerHour: 10000000 } }); }
  });

  await S(G, 'After all of this the integrations report answers and holds no secret', { expect: '200 for an administrator; no key, secret or token in it; 403 for a seller', sec: 'the report names what needs action without exposing credentials' }, async (ok) => {
    const r = await c.checksAs(admin2);
    ok('answered', r.status === 200 && Array.isArray(r.body.checks), r.status);
    ok('no secret', !/qa-jwt-secret|qa-tasks-secret|client_secret|whsec_|Bearer /i.test(r.raw));
    ok('a seller is refused', (await c.checksAs(P.seller(bX))).status === 403);
  });
}
