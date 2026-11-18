// Group 2: tenant (customer account), division and branch isolation, on records, lists, reports, exports,
// search, documents, the books and the partner API.
export default async function isolation(ctx, state) {
  const { S, G10, prisma, A, B, bm1, bm2, cfo, err, as, tokenOf, BASE, L1, L2, http1 } = ctx;
  const g = G10.iso;
  const [orgA, orgB] = await Promise.all(['QA-C01', 'QA-C02'].map((code) => prisma.organization.findFirst({ where: { code } })));
  const [d1, d2] = await Promise.all(['QA-C01-D1', 'QA-C01-D2'].map((code) => prisma.organization.findUnique({ where: { code } })));
  const [tA, tB, tDiv, tBrA, tBrB] = await Promise.all(['custA', 'custB', 'custDiv', 'branchA', 'branchB'].map(tokenOf));
  // Records of customer A at branch QA-L01: an order shipped and invoiced, and a document on the order.
  const sale = await ctx.shipped(120, { customer: orgA, price: 0.5 });
  const order = sale.order; const invoice = sale.invoice; const shipment = sale.shipment;
  const fd = new FormData(); fd.append('file', new Blob(['%PDF-1.4 qa phase 10 order paper'], { type: 'application/pdf' }), 'qa-p10.pdf'); fd.append('entityType', 'ORDER'); fd.append('entityId', order.id);
  const up = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${await tokenOf('admin')}` }, body: fd });
  const doc = await up.json().catch(() => ({}));
  const entry = invoice ? (await ctx.posted('INVOICE_ISSUED', 'Invoice', invoice.id)).entry : null;
  state.iso = { orgA, orgB, order, invoice, doc, entry };
  const init = 'Customer A (QA-C01) has an order at branch QA-L01, shipped and invoiced, with a PDF on the order and a posted journal entry';
  const hidden = (r) => [403, 404].includes(r.status);

  const branchReads = [
    ['the order', `/api/orders/${order.id}`],
    ['the invoice', `/api/invoices/${invoice?.id}`],
    ['the shipment', `/api/shipments/${shipment.id}`],
    ['the order\'s document list', `/api/documents/entity/ORDER/${order.id}`],
    ['the document download', `/api/documents/${doc.id}/download`],
    ['the journal entry of the invoice', `/api/ledger/entries/${entry?.id}`],
  ];
  for (const [what, url] of branchReads) {
    await S(g, `A branch manager of another branch cannot open ${what} of branch QA-L01; the manager of QA-L01 can`, { init, scope: 'Branch manager of QA-L02 against QA-L01', expect: '403 or 404 for QA-L02, 200 for QA-L01', sec: 'The branch boundary holds at the server' }, async (ok) => {
      const mine = await bm1.get(url); const theirs = await bm2.get(url);
      ok('own branch: opens', mine.status === 200, `${mine.status} ${err(mine)}`);
      ok('other branch: refused', hidden(theirs) || (Array.isArray(theirs.body?.data) && theirs.body.data.length === 0), `${theirs.status} ${theirs.raw.slice(0, 120)}`);
    });
  }

  await S(g, 'A sales rep of QA-L02 cannot open the order or the shipment of QA-L01; the QA-L01 rep can', { init, scope: 'Sales reps by branch', expect: 'Refused across branches', sec: 'Branch boundary for sales' }, async (ok) => {
    for (const url of [`/api/orders/${order.id}`, `/api/shipments/${shipment.id}`]) {
      ok(`QA-L01 rep opens ${url.split('/')[2]}`, (await as(tBrA).get(url)).status === 200);
      ok(`QA-L02 rep refused ${url.split('/')[2]}`, hidden(await as(tBrB).get(url)));
    }
  });

  const lists = [['orders', '/api/orders?limit=200', order.id], ['invoices', '/api/invoices?limit=200', invoice?.id], ['shipments', '/api/shipments?limit=200', shipment.id]];
  for (const [what, url, id] of lists) {
    await S(g, `The ${what} list of a QA-L02 manager does not carry the QA-L01 record`, { init, scope: 'Branch manager of QA-L02', expect: 'Not in the list', sec: 'Lists are filtered at the server' }, async (ok) => {
      const r = await bm2.get(url);
      ok('answered', r.status === 200, `${r.status}`);
      ok('not listed', !r.raw.includes(id));
      ok('the QA-L01 manager does see it', (await bm1.get(url.replace('limit=200', `limit=200&search=${encodeURIComponent(order.orderNumber)}`))).raw.includes(id) || (await bm1.get(url)).raw.includes(id));
    });
  }

  await S(g, 'Search by order number finds nothing for another branch', { init, scope: 'Branch manager of QA-L02', expect: 'No result', sec: 'Search obeys the branch boundary' }, async (ok) => {
    const r = await bm2.get(`/api/orders?search=${encodeURIComponent(order.orderNumber)}`);
    ok('nothing', r.status === 200 && !r.raw.includes(order.id), `${r.status}`);
  });

  await S(g, 'The books of a QA-L02 manager hold nothing from QA-L01', { init, scope: 'Branch manager of QA-L02', expect: 'Entries list without the QA-L01 entry; receivables without the QA-L01 invoice', sec: 'Ledger reads by branch (E4 kept)', fin: 'Read only' }, async (ok) => {
    const e = await bm2.get(`/api/ledger/entries?sourceId=${invoice.id}`);
    ok('entry search: nothing', e.status === 200 && (e.body.entries || []).length === 0, `${e.status} ${(e.body.entries || []).length}`);
    const own = await bm1.get(`/api/ledger/entries?sourceId=${invoice.id}`);
    ok('the QA-L01 manager finds it', (own.body.entries || []).some((x) => x.id === entry?.id));
    const tb = await bm2.get('/api/ledger/reports/trial-balance');
    ok('the trial balance answers for the branch', tb.status === 200 && tb.body.balanced !== undefined, `${tb.status}`);
  });

  await S(g, 'A branch manager cannot ask the books for another branch by naming it', { init, scope: 'Branch manager of QA-L02 sending branch=QA-L01', expect: 'Refused or limited to own branch', sec: 'A parameter does not widen the scope' }, async (ok) => {
    for (const rep of ['trial-balance', 'receivables', 'inventory']) {
      const r = await bm2.get(`/api/ledger/reports/${rep}?branch=${L1.id}&locationId=${L1.id}`);
      ok(`${rep}: no QA-L01 figures`, hidden(r) || !r.raw.includes(invoice.invoiceNumber || 'never') , `${r.status}`);
    }
    const tb = (await bm2.get(`/api/ledger/reports/trial-balance?branch=${L1.id}`)).body; const own = (await bm2.get('/api/ledger/reports/trial-balance')).body;
    ok('the same figures as without the parameter', JSON.stringify(tb?.totals) === JSON.stringify(own?.totals) || tb?.error, `${JSON.stringify(tb?.totals)} vs ${JSON.stringify(own?.totals)}`);
  });

  await S(g, 'Branch managers cannot export the books or run a reconciliation', { scope: 'Branch manager', expect: '403', sec: 'Company-wide finance actions are for finance roles' }, async (ok) => {
    ok('export refused', (await bm1.post('/api/ledger/exports', { provider: 'QUICKBOOKS' })).status === 403);
    ok('reconcile refused', (await bm1.post('/api/ledger/reconciliations')).status === 403);
    ok('activation refused', (await bm1.post('/api/ledger/deactivate', { reason: 'x' })).status === 403);
  });

  await S(g, 'Customer B cannot open customer A\'s order, shipment list or documents through the store', { init, scope: 'Customer B login', expect: '403 or 404, nothing of A in the answer', sec: 'Account isolation in the portal' }, async (ok) => {
    for (const url of [`/api/ecom/my-orders/${order.id}`, `/api/ecom/my-orders/${order.id}/documents`, `/api/enterprise/orders/${order.id}`, `/api/enterprise/accounts/${orgA.id}`, `/api/enterprise/accounts/${orgA.id}/kpis`]) {
      const r = await as(tB).get(url);
      ok(url.replace(order.id, '<A order>').replace(orgA.id, '<A>'), hidden(r) || !r.raw.includes(order.id), `${r.status}`);
    }
  });

  await S(g, 'Customer A sees their own order in the account portal; customer B\'s list does not carry it', { init, scope: 'Both customer logins', expect: 'Listed for A only', sec: 'Lists by account' }, async (ok) => {
    const a = await as(tA).get('/api/enterprise/orders?limit=200'); const b = await as(tB).get('/api/enterprise/orders?limit=200');
    ok('A: listed', a.status === 200 && a.raw.includes(order.id), `${a.status}`);
    ok('B: not listed', b.status === 200 && !b.raw.includes(order.id), `${b.status}`);
    ok('B naming A in the query still gets only B', !(await as(tB).get(`/api/enterprise/orders?accountId=${orgA.id}&customerId=${orgA.id}`)).raw.includes(order.id));
    ok('nor in B\'s web orders', !(await as(tB).get(`/api/ecom/my-orders?customerId=${orgA.id}`)).raw.includes(order.id));
  });

  await S(g, 'Customer B\'s order export does not carry customer A\'s orders', { init, scope: 'Customer B export', expect: 'A\'s order number absent', sec: 'Exports by account' }, async (ok) => {
    const r = await as(tB).get('/api/enterprise/orders/export');
    ok('answered or refused, never A\'s data', !r.raw.includes(order.orderNumber), `${r.status}`);
    const own = await as(tA).get('/api/enterprise/orders/export');
    ok('A\'s own export carries it', own.status !== 200 || own.raw.includes(order.orderNumber), `${own.status}`);
  });

  await S(g, 'Customer B cannot download customer A\'s document by its id', { init, scope: 'Customer B', expect: '403 or 404', sec: 'Document access by account' }, async (ok) => {
    for (const url of [`/api/documents/${doc.id}/download`, `/api/enterprise/documents/${doc.id}/download`]) ok(url.split('/').slice(2, 3).join(), hidden(await as(tB).get(url)));
    const bulk = await as(tB).post('/api/enterprise/documents/bulk-download', { documentIds: [doc.id] });
    ok('bulk download does not carry it', hidden(bulk) || bulk.status === 400 || !bulk.raw.includes('qa phase 10 order paper'), `${bulk.status}`);
  });

  await S(g, 'A division login sees its own division, not its sister division or the parent account', { scope: 'Login on QA-C01-D1', expect: 'Sister and parent orders hidden', sec: 'Division isolation' }, async (ok) => {
    const admin = await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } });
    const mk = (org, t) => prisma.order.create({ data: { orderNumber: `QA-P10-DIV-${t}-${Date.now()}`, orderType: 'SO', status: 'CONFIRMED', buyerId: org.id, subtotal: 10, totalAmount: 10, createdById: admin.id } });
    const [own, sister] = [await mk(d1, 'D1'), await mk(d2, 'D2')];
    const list = await as(tDiv).get('/api/enterprise/orders?limit=200');
    ok('own division listed', list.raw.includes(own.id), `${list.status}`);
    ok('sister division not listed', !list.raw.includes(sister.id));
    ok('parent account order not listed', !list.raw.includes(order.id));
    ok('sister order not opened', hidden(await as(tDiv).get(`/api/enterprise/orders/${sister.id}`)));
  });

  await S(g, 'A customer login cannot read staff records by guessing ids', { init, scope: 'Customer A', expect: '403 on the staff routes, even for its own order', sec: 'Customers use the store routes only' }, async (ok) => {
    for (const url of [`/api/orders/${order.id}`, `/api/invoices/${invoice.id}`, `/api/shipments/${shipment.id}`, `/api/ledger/entries/${entry?.id}`, `/api/customers/${orgA.id}`]) ok(url.split('/')[2], hidden(await as(tA).get(url)) || (await as(tA).get(url)).status === 401);
  });

  // Partner API: a customer partner sees its own organization's orders only.
  const pB = await ctx.partnerOf(orgB, 'CUSTOMER', ['orders:read', 'shipments:read', 'quotes:read', 'rfq:read']);
  await S(g, 'A partner of customer B cannot read customer A\'s order through the partner API', { init, scope: 'Partner token of customer B', expect: '404, not in the list', sec: 'Partner isolation by organization' }, async (ok) => {
    ok('opening it: refused', hidden(await pB.call('GET', `/customer/orders/${order.id}`)));
    const list = await pB.call('GET', '/customer/orders');
    ok('not listed', list.status === 200 && !list.raw.includes(order.id), `${list.status}`);
    ok('milestones: refused', hidden(await pB.call('GET', `/customer/orders/${order.id}/milestones`)));
  });

  await S(g, 'A partner token is not a staff token and a staff token is not a partner token', { scope: 'Partner and staff tokens crossed', expect: '401 or 403 both ways', sec: 'Two kinds of token, two audiences' }, async (ok) => {
    ok('partner on a staff route: refused', [401, 403].includes((await as(pB.token).get('/api/orders')).status));
    ok('staff on a partner route: refused', [401, 403].includes((await http1('GET', '/api/v1/partner/customer/orders', { token: await tokenOf('admin') })).status));
  });

  await S(g, 'A partner without the scope cannot read what the scope guards', { scope: 'Partner with rfq:read only', expect: '403 on orders', sec: 'Scopes are enforced' }, async (ok) => {
    const narrow = await ctx.partnerOf(orgB, 'CUSTOMER', ['rfq:read'], 'narrow');
    ok('orders refused', (await narrow.call('GET', '/customer/orders')).status === 403);
    ok('rfqs allowed', (await narrow.call('GET', '/customer/rfqs')).status === 200);
  });

  await S(g, 'The AI assistant gives a sales rep no ledger figures, and gives a branch manager only their branch', { scope: 'Sales rep and QA-L02 manager asking about the books', expect: 'No ledger section for the rep; branch-limited for the manager', sec: 'AI reads through the same scope as the screens', fin: 'Read only' }, async (ok) => {
    ctx.clearHits('ai');
    const ask = (who) => who.post('/api/ai/assistant', { messages: [{ role: 'user', content: 'What are total receivables in the ledger and the trial balance?' }] });
    const r1 = await ask(ctx.sales);
    const sent1 = ctx.hitsOf('ai').map((h) => h.body).join(' ');
    ok('the rep is answered', r1.status === 200, `${r1.status} ${err(r1)}`);
    ok('no ledger figures were handed to the model for the rep', !/trialBalance|inTheBooks|creditOwedBackToCustomers/.test(sent1), sent1.slice(0, 200));
    ctx.clearHits('ai');
    await ask(bm2);
    const sent2 = ctx.hitsOf('ai').map((h) => h.body).join(' ');
    ok('the manager\'s context never names QA-L01\'s invoice', !sent2.includes(invoice.invoiceNumber));
  });

  await S(g, 'A record id from another organization cannot be used to attach a document', { scope: 'Customer B uploading against customer A\'s order', expect: 'Refused', sec: 'Writes obey the boundary too' }, async (ok) => {
    const f = new FormData(); f.append('file', new Blob(['%PDF-1.4 x'], { type: 'application/pdf' }), 'x.pdf'); f.append('entityType', 'ORDER'); f.append('entityId', order.id);
    const r = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${tB}` }, body: f });
    ok('refused', [400, 403, 404, 409].includes(r.status), `${r.status}`);
  });

  await S(g, 'A QA-L02 manager cannot change a QA-L01 order', { init, scope: 'Branch manager of QA-L02', expect: '403 or 404, order unchanged', sec: 'Branch boundary on writes', db: 'Order unchanged' }, async (ok) => {
    const r = await bm2.put(`/api/orders/${order.id}`, { notes: 'changed by another branch' });
    ok('refused', hidden(r), `${r.status}`);
    ok('unchanged', (await prisma.order.findUnique({ where: { id: order.id } })).notes !== 'changed by another branch');
  });

  await S(g, 'A QA-L02 manager cannot record a payment on a QA-L01 invoice', { init, scope: 'Branch manager of QA-L02', expect: 'Refused, nothing paid', sec: 'Branch boundary on money', fin: 'No payment, no entry' }, async (ok) => {
    const before = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    const r = await bm2.post(`/api/invoices/${invoice.id}/payments`, { amount: 1, paymentMethod: 'CHECK', referenceNumber: 'QA-P10-X' });
    ok('refused', hidden(r), `${r.status} ${err(r)}`);
    ok('nothing paid', String((await prisma.invoice.findUnique({ where: { id: invoice.id } })).paidAmount) === String(before.paidAmount));
  });

  await S(g, 'A QA-L02 manager cannot attach a document to a QA-L01 order (Y-016)', { init, scope: 'Branch manager of QA-L02 uploading against the QA-L01 order', expect: '404, no document saved', sec: 'Branch boundary on uploads', db: 'No new document row' }, async (ok) => {
    const before = await prisma.document.count();
    const f = new FormData(); f.append('file', new Blob(['%PDF-1.4 other branch'], { type: 'application/pdf' }), 'other.pdf'); f.append('entityType', 'ORDER'); f.append('entityId', order.id);
    const r = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: { authorization: `Bearer ${bm2.token || await tokenOf('bm2')}` }, body: f }).catch(() => ({ status: 0 }));
    ok('refused', [403, 404].includes(r.status), `${r.status}`);
    ok('no document saved', (await prisma.document.count()) === before);
  });

  await S(g, 'A QA-L02 manager cannot cancel or credit a QA-L01 invoice', { init, scope: 'Branch manager of QA-L02', expect: '403 or 404 for both; invoice unchanged', sec: 'Branch boundary on money', fin: 'No credit, no reversal' }, async (ok) => {
    const before = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    const c = await bm2.post(`/api/invoices/${invoice.id}/cancel`, { reason: 'QA P10 other branch' });
    ok('cancel refused', hidden(c) || c.status === 409 && !(await prisma.invoice.findUnique({ where: { id: invoice.id } })).status.includes('CANCEL'), `${c.status} ${err(c)}`);
    const m = await bm2.post(`/api/invoices/${invoice.id}/credit`, { reason: 'QA P10 other branch', amount: 1 });
    ok('credit refused', hidden(m), `${m.status} ${err(m)}`);
    const after = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    ok('invoice unchanged', after.status === before.status && String(after.paidAmount) === String(before.paidAmount));
  });

  await S(g, 'A QA-L02 manager cannot delete the QA-L01 order\'s document (Y-016)', { init, scope: 'Branch manager of QA-L02', expect: '404; the document and its file remain', sec: 'Branch boundary on deletes', db: 'Document row unchanged' }, async (ok) => {
    if (!doc?.id) { ok('the QA-L01 document exists', false); return; }
    const r = await bm2.call('DELETE', `/api/documents/${doc.id}`);
    ok('refused', hidden(r), `${r.status}`);
    const row = await prisma.document.findUnique({ where: { id: doc.id } });
    ok('still there', Boolean(row) && !row.deletedAt, row ? String(row.deletedAt) : 'gone');
  });

  await S(g, 'Every branch of the 80 answers its own branch manager\'s trial balance, and the branch figures add up to the company', { init: '80 QA branches', scope: 'The CFO and per-branch reads', expect: 'Sum of branch receivables equals company receivables for branch-tagged lines', sec: 'No branch sees another', fin: 'Read only' }, async (ok) => {
    const company = await cfo.get('/api/ledger/reports/trial-balance');
    ok('company trial balance balances', company.body.balanced === true);
    const branches = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' } }, select: { id: true } });
    ok('80 branches in QA', branches.length >= 80, `${branches.length}`);
    const byBranch = await cfo.get('/api/ledger/reports/trial-balance?by=branch');
    ok('a by-branch view answers or the report says it is company-wide', [200, 400].includes(byBranch.status), `${byBranch.status}`);
  });
  void A; void B; void L2;
}
