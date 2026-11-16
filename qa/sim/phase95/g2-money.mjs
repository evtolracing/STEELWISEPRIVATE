// Group 2: payments, credits and refunds.
export default async function money(ctx, state) {
  const { scenario, G, prisma, A, cfo, w, L1, near, err, tag, num, posted, expectEntry, eventOf, entriesOf, movement, pay, creditMemo, refund, lastPayment } = ctx;
  const S = (name, fn) => scenario(G.money, name, fn);
  const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

  await S('A payment in full debits the clearing account and credits receivables for the customer', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.65 });
    const p = await pay(r.invoice.id, 650);
    ok('recorded', p.status === 201, `${p.status} ${err(p)}`);
    const row = await lastPayment(r.invoice.id);
    const { event, entry } = await posted('PAYMENT_RECORDED', 'Payment', row.id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'payment', entry, { 1000: 650, 1100: -650 });
    ok('the receivable line names the customer and the branch', entry.lines.some((l) => l.account.code === '1100' && l.customerId === r.order.buyerId && l.locationId === L1.id));
    ok('the entry says how it was paid', /CHECK/i.test(entry.memo), entry.memo);
  });

  await S('Two partial payments each post their own entry and together clear the invoice in the books', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.5 });
    const m = await movement(async () => { await pay(r.invoice.id, 123.45); await pay(r.invoice.id, 376.55); });
    const rows = await prisma.payment.findMany({ where: { invoiceId: r.invoice.id } });
    ok('two payments, two posted events', rows.length === 2 && (await prisma.ledgerEvent.count({ where: { sourceId: { in: rows.map((x) => x.id) }, status: 'POSTED' } })) === 2);
    ok('receivables fell by 500.00 and clearing rose by 500.00', near(m.delta['1100'], -500) && near(m.delta['1000'], 500), JSON.stringify(m.delta));
    ok('the invoice is paid', (await ctx.invOf(r.invoice.id)).status === 'PAID');
  });

  await S('A payment for more than is owed is refused and nothing is posted', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    const m = await movement(() => pay(r.invoice.id, 100.01));
    ok('refused', m.out.status === 409, `${m.out.status} ${err(m.out)}`);
    ok('no account moved', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    ok('no payment event exists for the invoice', (await prisma.payment.count({ where: { invoiceId: r.invoice.id } })) === 0);
  });

  await S('A payment dated earlier in an open period is posted on the day it was received, not the day it was typed', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    // The invoice above is dated today; the payment date only needs to be in an open period after the books began.
    const when = daysAgo(3);
    const p = await pay(r.invoice.id, 40, { paymentDate: when.toISOString() });
    ok('recorded', p.status === 201, `${p.status} ${err(p)}`);
    const { entry, event } = await posted('PAYMENT_RECORDED', 'Payment', (await lastPayment(r.invoice.id)).id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    const want = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit' }).format(when);
    ok('the entry is dated the payment day in the books\' time zone', entry.entryDate.toISOString().slice(0, 10) === want, `${entry.entryDate.toISOString().slice(0, 10)} vs ${want}`);
  });

  await S('A payment dated before the books began is posted on the day it is recorded, and the entry says so', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    const p = await pay(r.invoice.id, 25, { paymentDate: daysAgo(200).toISOString() });
    ok('recorded', p.status === 201, `${p.status} ${err(p)}`);
    const { entry, event } = await posted('PAYMENT_RECORDED', 'Payment', (await lastPayment(r.invoice.id)).id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    ok('dated today, not 200 days ago', Date.now() - entry.entryDate.getTime() < 2 * 86_400_000);
    ok('the memo names the payment\'s own date', /before the books began/.test(entry.memo), entry.memo);
  });

  await S('A payment on an invoice from before the books began clears the opening receivable', async (ok) => {
    const inv = state.pre.open.invoice;
    const m = await movement(() => pay(inv.id, 636));
    ok('recorded', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('clearing up 636.00, receivables down 636.00', near(m.delta['1000'], 636) && near(m.delta['1100'], -636), JSON.stringify(m.delta));
    ok('no revenue or tax is posted again for the old invoice', !m.delta['4000'] && !m.delta['2100']);
    ok('the old invoice itself has no ledger event', (await eventOf('INVOICE_ISSUED', 'Invoice', inv.id)) === null);
  });

  await S('A recorded payment sits in a clearing account; nothing in the books claims it reached the bank', async (ok) => {
    const r = await ctx.shipped(100, { price: 1 });
    await pay(r.invoice.id, 100, { paymentMethod: 'CARD', referenceNumber: 'APPROVAL-123' });
    const chart = (await cfo.get('/api/ledger/chart')).body;
    const acct = chart.accounts.find((a) => a.code === '1000');
    ok('the account is named a clearing account', /Clearing/i.test(acct.name), acct.name);
    ok('there is no bank account in the proposed chart', !chart.accounts.some((a) => /\bbank\b/i.test(a.name)));
    const { entry } = await posted('PAYMENT_RECORDED', 'Payment', (await lastPayment(r.invoice.id)).id);
    ok('the card payment went to the clearing account', near(ctx.nets(entry)['1000'], 100) && /CARD/.test(entry.memo));
    const rec = (await cfo.post('/api/ledger/reconciliations')).body.checks.find((c) => c.key === 'PAYMENTS');
    ok('the reconciliation says the bank is not known here', /Whether the money reached the bank is not known/.test(rec.note), rec.note);
  });

  await S('A money credit on an unpaid invoice posts sales returns against receivables; applying it moves no cash', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.5 });
    const m = await movement(() => creditMemo(r.invoice.id, { reason: 'Surface scratches accepted at a discount', amount: 80 }));
    ok('credited', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const { entry, event } = await posted('CREDIT_ISSUED', 'Invoice', m.out.body.id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'credit memo', entry, { 4300: 80, 1100: -80 });
    ok('the clearing account did not move', !m.delta['1000'], JSON.stringify(m.delta));
    const applied = await prisma.payment.findMany({ where: { paymentMethod: 'CREDIT', OR: [{ invoiceId: r.invoice.id }, { invoiceId: m.out.body.id }] } });
    ok('the credit was applied on both documents', applied.length === 2);
    ok('the applications have no ledger events of their own', (await prisma.ledgerEvent.count({ where: { sourceId: { in: applied.map((p) => p.id) } } })) === 0);
  });

  await S('A credit on an invoice already paid leaves a credit balance for the customer, shown apart, with no cash moved', async (ok) => {
    const cust = w.custB;
    const r = await ctx.shipped(400, { price: 0.5, customer: cust });
    await pay(r.invoice.id, 200);
    const before = (await cfo.get('/api/ledger/reports/receivables')).body.customers.find((c) => c.customerId === cust.id);
    const m = await movement(() => creditMemo(r.invoice.id, { reason: 'Rebate agreed', amount: 60 }));
    const after = (await cfo.get('/api/ledger/reports/receivables')).body.customers.find((c) => c.customerId === cust.id);
    ok('credited', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('receivables fell by 60.00 and cash did not move', near(m.delta['1100'], -60) && !m.delta['1000'], JSON.stringify(m.delta));
    ok('the report shows 60.00 more owed back to the customer', near(Number(after.creditOwedBack) - Number(before?.creditOwedBack || 0), 60), `${before?.creditOwedBack} -> ${after.creditOwedBack}`);
    ok('books and invoices still agree for the customer', after.difference === '0.00', after.difference);
    state.owedBack = { creditId: m.out.body.id, customer: cust };
  });

  await S('A refund of credit owed back debits receivables and credits the clearing account', async (ok) => {
    const m = await movement(() => refund(state.owedBack.creditId, 60));
    ok('refunded', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const row = await lastPayment(state.owedBack.creditId, { paymentMethod: { not: 'CREDIT' } });
    const { entry, event } = await posted('REFUND_RECORDED', 'Payment', row.id);
    ok('posted as a refund', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'refund', entry, { 1100: 60, 1000: -60 });
    ok('accounts moved by exactly that', near(m.delta['1100'], 60) && near(m.delta['1000'], -60), JSON.stringify(m.delta));
  });

  await S('A refund for more than is owed back is refused and posts nothing', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    await pay(r.invoice.id, 100);
    const cm = await creditMemo(r.invoice.id, { reason: 'Goodwill', amount: 30 });
    const m = await movement(() => refund(cm.body.id, 30.01));
    ok('refused', m.out.status === 409, `${m.out.status} ${err(m.out)}`);
    ok('nothing moved', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
  });

  await S('Two partial refunds of one credit memo post two entries that add up', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    await pay(r.invoice.id, 100);
    const cm = await creditMemo(r.invoice.id, { reason: 'Goodwill', amount: 50 });
    const m = await movement(async () => { await refund(cm.body.id, 20); await refund(cm.body.id, 30); });
    ok('receivables up 50.00, clearing down 50.00', near(m.delta['1100'], 50) && near(m.delta['1000'], -50), JSON.stringify(m.delta));
    ok('two refund events', (await prisma.ledgerEvent.count({ where: { eventKind: 'REFUND_RECORDED', status: 'POSTED', sourceId: { in: (await prisma.payment.findMany({ where: { invoiceId: cm.body.id }, select: { id: true } })).map((p) => p.id) } } })) === 2);
    ok('a third refund is refused', (await refund(cm.body.id, 0.01)).status === 409);
  });

  await S('The refund of a credit that was owed back before the books began clears the opening credit balance', async (ok) => {
    const m = await movement(() => refund(state.pre.credit.body.id, 120));
    ok('refunded', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('receivables up 120.00, clearing down 120.00', near(m.delta['1100'], 120) && near(m.delta['1000'], -120), JSON.stringify(m.delta));
  });

  await S('The same payment request sent three times with one request key is one payment and one entry', async (ok) => {
    const r = await ctx.shipped(300, { price: 0.5 });
    const key = ctx.crypto.randomUUID();
    const token = await (await import('../phase4-lib.mjs')).tokenOf('csr');
    const send = () => ctx.http1('POST', `/api/invoices/${r.invoice.id}/payments`, { token, headers: { 'Idempotency-Key': key }, body: { amount: 150, paymentMethod: 'CHECK', referenceNumber: 'CHK-ONCE' } });
    const m = await movement(async () => { const a = await send(); const b = await send(); const c = await send(); return [a, b, c]; });
    ok('all three answered as created', m.out.every((x) => x.status === 201), m.out.map((x) => x.status).join(','));
    ok('one payment row', (await prisma.payment.count({ where: { invoiceId: r.invoice.id } })) === 1);
    ok('the books moved once', near(m.delta['1000'], 150) && near(m.delta['1100'], -150), JSON.stringify(m.delta));
  });

  await S('Two payments at once that together exceed the invoice: one is refused, one is posted', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    const m = await movement(() => ctx.all(2, () => pay(r.invoice.id, 70)));
    const okd = m.out.filter((x) => x.status === 201).length;
    ok('exactly one was accepted', okd === 1, m.out.map((x) => x.status).join(','));
    ok('the books moved by one payment', near(m.delta['1000'], 70) && near(m.delta['1100'], -70), JSON.stringify(m.delta));
  });

  await S('A credit for more than the invoice billed is refused and posts nothing', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    const m = await movement(() => creditMemo(r.invoice.id, { reason: 'Too much', amount: 100.01 }));
    ok('refused', m.out.status === 409, `${m.out.status} ${err(m.out)}`);
    ok('nothing moved', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
  });

  await S('A return put back in stock and credited: stock and cost of goods reverse at cost, receivables fall through sales returns', async (ok) => {
    const r = await ctx.shipped(500, { cost: 0.4, price: 0.8 });
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Wrong width', lines: [{ orderLineId: r.order.lines[0].id, quantity: 200, disposition: 'RESTOCK' }] }, 'csr');
    ok('return opened', ret.status === 201, `${ret.status} ${err(ret)}`);
    const m = await movement(async () => { const rc = await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping'); const cr = await A.post(`/api/returns/${ret.body.id}/credit`, {}, 'admin'); return { rc, cr }; });
    ok('received', ctx.ok2(m.out.rc), `${m.out.rc.status} ${err(m.out.rc)}`);
    ok('200 lb at 0.40 came back: stock up 80.00, cost of goods down 80.00', near(m.delta['1200'], 80) && near(m.delta['5000'], -80), JSON.stringify(m.delta));
    // The return may be credited when it is received or by the separate step, depending on the order; either way one credit is in the books.
    ok('receivables fell by 160.00 through sales returns', near(m.delta['1100'], -160) && near(m.delta['4300'], 160), `${JSON.stringify(m.delta)} credit step ${m.out.cr.status}`);
  });

  await S('A return that is scrapped: it comes back at cost and is written off at once; stock ends where it was', async (ok) => {
    const r = await ctx.shipped(500, { cost: 0.4, price: 0.8 });
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Bent in transit', lines: [{ orderLineId: r.order.lines[0].id, quantity: 100, disposition: 'SCRAP' }] }, 'csr');
    const m = await movement(() => A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping'));
    ok('received', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('cost of goods down 40.00 and scrap up 40.00', near(m.delta['5000'], -40) && near(m.delta['5300'], 40), JSON.stringify(m.delta));
    ok('stock value did not change', !m.delta['1200'], JSON.stringify(m.delta));
    const moves = await prisma.materialMovement.findMany({ where: { orderId: ret.body.id } });
    ok('both stock movements are posted', moves.length === 2 && (await prisma.ledgerEvent.count({ where: { sourceId: { in: moves.map((x) => x.id) }, status: 'POSTED' } })) === 2, `${moves.length}`);
  });

  await S('A shop operator cannot record a payment, and nothing is posted', async (ok) => {
    const r = await ctx.shipped(100, { price: 1 });
    const m = await movement(() => ctx.operator.post(`/api/invoices/${r.invoice.id}/payments`, { amount: 100, paymentMethod: 'CASH' }));
    ok('refused', m.out.status === 403, `${m.out.status}`);
    ok('nothing moved', Object.keys(m.delta).length === 0);
  });

  await S('An invoice with a payment cannot be cancelled, and its entries stay as they are', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    await pay(r.invoice.id, 10);
    const m = await movement(() => A.post(`/api/invoices/${r.invoice.id}/cancel`, { reason: 'Try' }, 'admin'));
    ok('refused', m.out.status === 409, `${m.out.status} ${err(m.out)}`);
    ok('nothing moved', Object.keys(m.delta).length === 0);
    ok('no reversal exists', (await entriesOf('Invoice', r.invoice.id)).every((e) => e.kind === 'SYSTEM'));
  });

  await S('After payments, credits and refunds the receivables check finds no customer out of step', async (ok) => {
    const rep = (await cfo.get('/api/ledger/reports/receivables')).body;
    // The one invoice from before the books began that scenario group 6 cancels is not cancelled yet here.
    ok('no customer differs', rep.differences === 0, JSON.stringify(rep.customers.filter((c) => c.difference !== '0.00').slice(0, 5)));
    ok('the totals agree', rep.totals.difference === '0.00', `${rep.totals.ledger} vs ${rep.totals.records}`);
    ok('credit owed back is its own column', 'creditOwedBack' in rep.totals && /never netted/.test(rep.note));
  });
}
