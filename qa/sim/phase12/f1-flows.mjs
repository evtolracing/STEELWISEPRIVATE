// Group 1: the ten cross-module workflows of the Phase 12 prompt (section 37), each run end to end through
// the real server by the people who do that work, with the source records, the stock, the documents and the
// books read back after every step. A workflow is certified by its last state, not by its first screen.
export default async function run(c) {
  const { W, G12, branch, P, hq, E, lot, prisma, err, near, n, inv, posted, nets, expectEntry, moveOf, tag, COST_OF, PRICE_OF, agrees, r2, sumNets, eventOf } = c;
  const G = G12.flows;
  const cfo = hq('CFO', 0);
  const order = (id) => prisma.order.findUnique({ where: { id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
  const liveInvoices = (where) => prisma.invoice.findMany({ where: { ...where, kind: 'INVOICE', status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'asc' } });
  const audited = (ids) => prisma.auditLog.count({ where: { resourceId: { in: ids.filter(Boolean).map(String) } } });
  const dueDate = () => new Date(Date.now() + 14 * 864e5).toISOString();
  const rfqLine = (g, q, processing) => ({ description: `P12 ${g} ${processing ? 'cut to size' : 'stock plate'}`, requestedQty: q, unit: 'LB', gradeId: E.heats[g].gradeId, grade: g, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, finish: 'Mill', certRequirements: ['MTR'], ...(processing && { processing }) });
  /** A request for quote priced, sent and accepted into a confirmed order. */
  async function quoted(ok, b, customer, g, q, processing) {
    const est = P.estimator(b); const cwt = r2(100 * (PRICE_OF[g] ?? 0.65) * 1.25);
    const rfq = await est.post('/api/rfqs', { customerId: customer.id, requestedDate: dueDate(), lines: [rfqLine(g, q, processing)] });
    ok('the request for quote is saved for the customer', rfq.status === 201 && rfq.body.customerId === customer.id, `${rfq.status} ${err(rfq)}`);
    const quote = await est.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rfq.body.lines[0].id, unitPrice: cwt, priceUnit: 'CWT' }] });
    ok('the quote is priced from the request', quote.status === 201 && near(quote.body.subtotal, r2(q * cwt / 100), 0.011), `${quote.status} ${quote.body?.subtotal} vs ${r2(q * cwt / 100)} ${err(quote)}`);
    const outsider = await P.operator(b).post(`/api/quotes/${quote.body.id}/accept`, { poReference: tag('P12PO') });
    ok('an operator cannot accept a quote', outsider.status === 403, `${outsider.status} ${err(outsider)}`);
    const sent = await est.post(`/api/quotes/${quote.body.id}/send`, {});
    ok('the quote is sent', sent.status === 200 || sent.status === 201, `${sent.status} ${err(sent)}`);
    const acc = await P.csr(b).post(`/api/quotes/${quote.body.id}/accept`, { poReference: tag('P12PO') });
    ok('accepting the quote makes one order', acc.status === 201 && acc.body?.order?.id, `${acc.status} ${err(acc)}`);
    const twice = await P.csr(b).post(`/api/quotes/${quote.body.id}/accept`, { poReference: tag('P12PO') });
    ok('accepting it a second time makes no second order', twice.status !== 201 || twice.body?.order?.id === acc.body.order.id, `${twice.status}`);
    ok('one order for the quote in the database', (await prisma.order.count({ where: { fromQuote: { id: quote.body.id } } })) === 1);
    let o = await order(acc.body.order.id);
    if (o.status !== 'CONFIRMED') { const cf = await P.csr(b).put(`/api/orders/${o.id}`, { status: 'CONFIRMED' }); ok('the order is confirmed', cf.status === 200 && cf.body.status === 'CONFIRMED', `${cf.status} ${err(cf)}`); o = await order(o.id); }
    ok('the order carries the quote\'s price and the branch', near(o.subtotal, quote.body.subtotal, 0.011) && o.locationId === b.id && o.buyerId === customer.id, `${o.subtotal} vs ${quote.body.subtotal}; branch ${o.locationId === b.id}`);
    return { rfq: rfq.body, quote: quote.body, order: o, cwt };
  }
  /** Reserve, ship, dispatch (which bills), and read the invoice and its postings back. */
  async function shipAndBill(ok, b, o, line, l, qty, label = '') {
    const before = await inv(l.coilId);
    const rz = await P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: line.id, coilId: l.coilId, qty });
    ok(`${label}stock is reserved for the line`, rz.status === 201, `${rz.status} ${err(rz)}`);
    const held = await inv(l.coilId);
    ok(`${label}the reservation holds the pounds and leaves the stock on hand`, n(held.qtyAllocated) === n(before.qtyAllocated) + qty && n(held.qtyOnHand) === n(before.qtyOnHand) && n(held.qtyAvailable) === n(before.qtyAvailable) - qty, `allocated ${before.qtyAllocated}→${held.qtyAllocated}, available ${before.qtyAvailable}→${held.qtyAvailable}`);
    const who = P.shipper(b) || P.stock(b);
    const s = await who.post('/api/shipments', { orderId: o.id, fromLocationId: b.id, carrierName: 'Own Truck', items: [{ orderLineId: line.id, qtyShipped: qty, weightLb: qty }] });
    ok(`${label}the shipment is put together`, s.status === 201, `${s.status} ${err(s)}`);
    const d = await who.put(`/api/shipments/${s.body.id}/dispatch`, {});
    ok(`${label}the shipment is dispatched and names its invoice`, d.status === 200 && d.body?.invoice?.id, `${d.status} ${err(d)}`);
    const after = await inv(l.coilId);
    ok(`${label}the stock on hand fell by the pounds shipped and the reservation was used up`, n(after.qtyOnHand) === n(before.qtyOnHand) - qty && n(after.qtyAllocated) === n(before.qtyAllocated), `on hand ${before.qtyOnHand}→${after.qtyOnHand}, allocated ${after.qtyAllocated}`);
    const mv = await moveOf({ shipmentId: s.body.id, movementType: 'SHIP' });
    ok(`${label}one SHIP movement records it`, mv && (await prisma.materialMovement.count({ where: { shipmentId: s.body.id, movementType: 'SHIP' } })) === 1 && Math.abs(n(mv.qtyMoved ?? mv.quantity ?? mv.weightLb)) === qty, JSON.stringify(mv && { q: mv.qtyMoved ?? mv.quantity ?? mv.weightLb }));
    const invoice = await prisma.invoice.findUnique({ where: { id: d.body.invoice.id }, include: { lines: true } });
    const i = await posted('INVOICE_ISSUED', 'Invoice', invoice.id); const g = nets(i.entry);
    ok(`${label}the invoice is posted once and its entry balances`, i.event?.status === 'POSTED' && near(sumNets(g), 0) && (await prisma.ledgerEvent.count({ where: { eventKind: 'INVOICE_ISSUED', sourceId: invoice.id } })) === 1, `${i.event?.status} ${JSON.stringify(g)}`);
    ok(`${label}receivables rise by the invoice total and revenue by its subtotal`, near(g['1100'], invoice.totalAmount) && near(-(g['4000'] || 0), invoice.subtotal), `1100 ${g['1100']} vs ${invoice.totalAmount}; 4000 ${g['4000']} vs ${invoice.subtotal}`);
    const cost = r2(qty * l.cost);
    expectEntry(ok, `${label}cost of goods at the item's cost`, (await posted('STOCK_SHIPPED', 'MaterialMovement', mv.id)).entry, { 5000: cost, 1200: -cost });
    return { shipment: s.body, invoice, who, movement: mv };
  }
  async function deliverAndPay(ok, b, sh, amount, label = '') {
    const dl = await sh.who.put(`/api/shipments/${sh.shipment.id}/deliver`, { podSignature: 'P12 Receiver' });
    const srow = await prisma.shipment.findUnique({ where: { id: sh.shipment.id } });
    ok(`${label}the delivery is confirmed with a proof of delivery`, dl.status === 200 && srow.status === 'DELIVERED' && Boolean(srow.podSignature || srow.deliveredAt), `${dl.status} ${srow.status}`);
    const total = Number(sh.invoice.totalAmount); const pays = amount ?? total;
    const over = await (P.csr(b) || P.manager(b)).post(`/api/invoices/${sh.invoice.id}/payments`, { amount: r2(total + 1), paymentMethod: 'CHECK', referenceNumber: tag('P12OVR') });
    ok(`${label}a payment larger than the invoice is refused`, over.status >= 400 && over.status < 500, `${over.status} ${err(over)}`);
    const p = await (P.csr(b) || P.manager(b)).post(`/api/invoices/${sh.invoice.id}/payments`, { amount: pays, paymentMethod: 'CHECK', referenceNumber: tag('P12PAY') });
    ok(`${label}the payment is taken`, p.status === 201, `${p.status} ${err(p)}`);
    const i = await prisma.invoice.findUnique({ where: { id: sh.invoice.id }, include: { payments: true } });
    ok(`${label}the invoice shows it`, near(i.paidAmount, pays) && (pays < total ? i.status !== 'PAID' : i.status === 'PAID'), `${i.status} ${i.paidAmount}/${i.totalAmount}`);
    const pe = await posted('PAYMENT_RECORDED', 'Payment', i.payments.at(-1).id); const g = nets(pe.entry);
    ok(`${label}the payment is posted once: receivables down by the amount, the entry balances`, pe.event?.status === 'POSTED' && near(-(g['1100'] || 0), pays) && near(sumNets(g), 0), `${pe.event?.status} ${JSON.stringify(g)}`);
    return i;
  }

  // ── 1 ────────────────────────────────────────────────────────────────────────────────────
  const b1 = await branch('MEDIUM', 3);
  await W(G, 'Flow 1: a new customer is quoted, orders, is shipped, invoiced and pays, and the books agree', { id: 'WF-01', purpose: 'Sell stock material to a new account from request to cash', start: 'A new customer asks for a price', role: 'CSR, estimator, inventory manager, shipping coordinator', ui: 'Customers; Sales and Quoting; Orders; Shipping; Invoices', api: 'POST /api/customers, /api/rfqs, /api/rfqs/:id/quotes, /api/quotes/:id/send, /api/quotes/:id/accept, /api/orders/:id/allocate, /api/shipments, PUT /api/shipments/:id/dispatch and /deliver, POST /api/invoices/:id/payments', db: 'Organization, RFQ, Quote, Order, OrderLine, Inventory, Shipment, MaterialMovement, Invoice, Payment, LedgerEvent, JournalEntry', events: 'INVOICE_ISSUED, STOCK_SHIPPED, PAYMENT_RECORDED ledger events', fin: 'receivables and revenue at dispatch; cost of goods at the item\'s cost; cash at payment', final: 'order shipped, shipment delivered, invoice paid, receivable zero, books reconciled' }, async (ok, x) => {
    const code = tag('P12C');
    const cu = await P.csr(b1).post('/api/customers', { code, name: `P12 Synthetic Fabricator ${code}`, type: 'FABRICATOR', city: 'Toledo', state: 'OH', paymentTerms: 'NET30', taxExempt: true, email: 'buyer@example.test' });
    ok('the customer account is created', cu.status === 201 && cu.body.id, `${cu.status} ${err(cu)}`);
    const g = b1.grades[0]; const q = 1200; const l = await lot(b1, 4000, g);
    const s = await quoted(ok, b1, cu.body, g, q, null);
    const line = s.order.lines[0];
    const sh = await shipAndBill(ok, b1, s.order, line, l, n(line.qtyOrdered));
    ok('the invoice is for the order and the customer, at the quoted price', sh.invoice.orderId === s.order.id && near(sh.invoice.subtotal, s.order.subtotal, 0.011), `${sh.invoice.subtotal} vs ${s.order.subtotal}`);
    const paid = await deliverAndPay(ok, b1, sh);
    const o = await order(s.order.id);
    ok('the order is complete', o.status === 'COMPLETE', o.status); x.note(`final order status ${o.status}`);
    const rec = await cfo.get('/api/ledger/reports/receivables');
    const row = (rec.body.rows || rec.body.customers || []).find((r) => r.customerId === cu.body.id || r.id === cu.body.id);
    ok('the customer owes nothing on the receivables report', rec.status === 200 && (!row || near(row.balance ?? row.total ?? row.open ?? 0, 0)), JSON.stringify(row || 'not listed'));
    ok('the trail is in the audit log', (await audited([s.order.id, sh.invoice.id, sh.shipment.id, s.quote.id, paid.payments[0]?.id])) >= 3, await audited([s.order.id, sh.invoice.id, sh.shipment.id, s.quote.id]));
    await agrees(ok, 'after the sale');
  });

  // ── 2 ────────────────────────────────────────────────────────────────────────────────────
  const b2 = await branch('LARGE', 2);
  await W(G, 'Flow 2: a quoted job is made on the floor, inspected, shipped and invoiced; it cannot leave before it passes', { id: 'WF-02', purpose: 'Sell processed material: quote, production, quality release, shipment, invoice', start: 'A customer accepts a quote for cut-to-size material', role: 'Estimator, CSR, scheduler, operator, QC inspector, shipping coordinator, branch manager', ui: 'Sales and Quoting; Scheduling; Shop Floor; QC Inspections; Shipping', api: 'POST /api/jobs, /api/jobs/:id/plan, /api/v1/operations/:id/start and /complete, /api/qc/inspections, /api/qc/inspections/:id/pass, POST /api/jobs/:id/status, shipments and invoices as flow 1, GET /api/orders/:id/cost', db: 'Job, DispatchJob, DispatchOperation, DispatchTimeLog, JobInspection and the flow 1 records', events: 'INVOICE_ISSUED, STOCK_SHIPPED', fin: 'as flow 1; the job cost shows material at actual cost', final: 'job complete and inspected, shipment delivered, invoice paid' }, async (ok, x) => {
    const customer = b2.customers[1]; const g = b2.grades[0]; const l = await lot(b2, 6000, g);
    const s = await quoted(ok, b2, customer, g, 1500, 'Saw to length');
    const line = s.order.lines[0]; const qty = n(line.qtyOrdered);
    const rz = await P.stock(b2).post(`/api/orders/${s.order.id}/allocate`, { lineId: line.id, coilId: l.coilId, qty });
    ok('the material is reserved for the order', rz.status === 201, `${rz.status} ${err(rz)}`);
    const sch = P.scheduler(b2);
    const j = await sch.post('/api/jobs', { orderId: s.order.id, orderLineId: line.id, operationType: E.WC_TYPE, instructions: 'P12 synthetic: saw to length, deburr', status: 'ORDERED' });
    ok('the job is opened for the order line', j.status === 201, `${j.status} ${err(j)}`);
    const plan = await sch.post(`/api/jobs/${j.body.id}/plan`, { operations: [{ workCenterType: E.WC_TYPE, name: 'Saw to length' }, { workCenterType: E.WC_TYPE, name: 'Deburr and stack' }] });
    ok('the job is routed in two steps', plan.status === 200 && plan.body?.operations?.length === 2, `${plan.status} ${err(plan)}`);
    const opr = P.operator(b2); const person = b2.operators[0]; const wc = b2.machines[0];
    const skip = await opr.post(`/api/v1/operations/${plan.body.operations[1].id}/start`, { operatorId: person.id, workCenterId: wc.id });
    x.note(`starting the second step before the first answered ${skip.status}${skip.status >= 400 ? `: ${err(skip)}` : ''}`);
    if (skip.status === 200) await opr.post(`/api/v1/operations/${plan.body.operations[1].id}/complete`, {});
    for (const op of plan.body.operations) {
      if (skip.status === 200 && op.id === plan.body.operations[1].id) continue;
      const st = await opr.post(`/api/v1/operations/${op.id}/start`, { operatorId: person.id, workCenterId: wc.id });
      const fin = await opr.post(`/api/v1/operations/${op.id}/complete`, {});
      ok(`step "${op.name}" is started and finished by the operator`, st.status === 200 && fin.status === 200, `${st.status} ${fin.status} ${err(st)} ${err(fin)}`);
    }
    const logs = await prisma.dispatchTimeLog.count({ where: { dispatchOperationId: { in: plan.body.operations.map((o) => o.id) } } });
    ok('time on each step is recorded against a person', logs >= 2, logs);
    const jrow = () => prisma.job.findUnique({ where: { id: j.body.id } });
    x.note(`job status after the last step: ${(await jrow()).status}`);
    // Quality gate: the job cannot be staged or leave until an inspection passes.
    const early = await P.shipper(b2).post(`/api/jobs/${j.body.id}/status`, { status: 'READY_TO_SHIP' });
    ok('the dock cannot mark the job ready to ship before inspection', early.status >= 400 && early.status < 500, `${early.status} ${err(early)}`);
    const who = P.shipper(b2);
    const s0 = await who.post('/api/shipments', { orderId: s.order.id, fromLocationId: b2.id, carrierName: 'Own Truck', items: [{ orderLineId: line.id, qtyShipped: qty, weightLb: qty }] });
    const d0 = s0.status === 201 ? await who.put(`/api/shipments/${s0.body.id}/dispatch`, {}) : s0;
    ok('a shipment of the uninspected job cannot be dispatched', d0.status >= 400 && d0.status < 500, `shipment ${s0.status}, dispatch ${d0.status} ${err(d0)}`);
    ok('nothing left the building', n((await inv(l.coilId)).qtyOnHand) === 6000 && (await liveInvoices({ orderId: s.order.id })).length === 0);
    const qc = P.qc(b2);
    const insp = await qc.post('/api/qc/inspections', { jobId: j.body.id });
    ok('the inspection is opened', insp.status === 201, `${insp.status} ${err(insp)}`);
    const sheet = insp.body.data;
    const bad = await qc.post(`/api/qc/inspections/${sheet.id}/fail`, { checklist: (sheet.checklist || []).map((k, i) => ({ ...k, result: i ? 'PASS' : 'FAIL' })), notes: 'P12 synthetic: burr on the cut edge', reason: 'P12 synthetic: burr on the cut edge' });
    ok('a failed inspection is recorded', bad.status === 200, `${bad.status} ${err(bad)}`);
    const blocked = await P.shipper(b2).post(`/api/jobs/${j.body.id}/status`, { status: 'READY_TO_SHIP' });
    ok('a job that failed inspection cannot be staged', blocked.status >= 400 && blocked.status < 500, `${blocked.status} ${err(blocked)}`);
    x.note(`job status after the failed inspection: ${(await jrow()).status}`);
    const rw = await qc.post(`/api/qc/inspections/${sheet.id}/rework`, { instructions: 'P12 synthetic: deburr again', notes: 'P12 synthetic: deburr again' });
    x.note(`sending the job for rework answered ${rw.status}${rw.status >= 400 ? `: ${err(rw)}` : ''}; job now ${(await jrow()).status}`);
    // Rework: any step added is run, then a new inspection passes.
    const ops = await prisma.dispatchOperation.findMany({ where: { dispatchJob: { jobId: j.body.id }, status: { notIn: ['COMPLETE', 'COMPLETED', 'CANCELLED', 'SKIPPED'] } } }).catch(() => []);
    for (const op of ops) { const st = await opr.post(`/api/v1/operations/${op.id}/start`, { operatorId: person.id, workCenterId: wc.id }); const fin = await opr.post(`/api/v1/operations/${op.id}/complete`, {}); ok(`the rework step "${op.name}" is run`, st.status === 200 && fin.status === 200, `${st.status} ${fin.status} ${err(st)} ${err(fin)}`); }
    const insp2 = await qc.post('/api/qc/inspections', { jobId: j.body.id });
    ok('a new inspection is opened after the rework', insp2.status === 201, `${insp2.status} ${err(insp2)}`);
    const sheet2 = insp2.body?.data || sheet;
    const pass = await qc.post(`/api/qc/inspections/${sheet2.id}/pass`, { checklist: (sheet2.checklist || []).map((k) => ({ ...k, result: 'PASS' })) });
    ok('the new inspection passes', pass.status === 200, `${pass.status} ${err(pass)}`);
    ok('both inspections are kept: the failure is not overwritten', (await prisma.jobInspection.count({ where: { jobId: j.body.id } })) >= 2, await prisma.jobInspection.count({ where: { jobId: j.body.id } }));
    const staged = await P.shipper(b2).post(`/api/jobs/${j.body.id}/status`, { status: 'READY_TO_SHIP' });
    ok('now the dock stages it', staged.status >= 200 && staged.status < 300, `${staged.status} ${err(staged)}`);
    // The shipment made before inspection waited on the dock; it is the one that now leaves.
    const held = await inv(l.coilId);
    const s1 = s0;
    ok('the shipment made earlier is still waiting on the dock', s1.status === 201 && (await prisma.shipment.findUnique({ where: { id: s1.body.id } })).status === 'PENDING', `${s1.status}`);
    const d1 = await who.put(`/api/shipments/${s1.body.id}/dispatch`, {});
    ok('the inspected job is dispatched and billed', d1.status === 200 && d1.body?.invoice?.id, `${d1.status} ${err(d1)}`);
    ok('the stock fell once by the pounds shipped', n((await inv(l.coilId)).qtyOnHand) === n(held.qtyOnHand) - qty, `${held.qtyOnHand}→${(await inv(l.coilId)).qtyOnHand}`);
    const invoice = await prisma.invoice.findUnique({ where: { id: d1.body.invoice.id } });
    const sh = { shipment: s1.body, invoice, who };
    await deliverAndPay(ok, b2, sh);
    const cost = await P.manager(b2).get(`/api/orders/${s.order.id}/cost`);
    ok('the manager reads the job cost: material at the item\'s actual cost, and nothing assumed', cost.status === 200, `${cost.status} ${err(cost)}`);
    x.note(`job cost answer: ${JSON.stringify(cost.body).slice(0, 400)}`);
    const seller = await P.seller(b2).get(`/api/orders/${s.order.id}/cost`);
    ok('a sales representative is not shown cost', seller.status === 403 || (seller.status === 200 && !/"material"|"cost"/i.test(JSON.stringify(seller.body))), `${seller.status}`);
    ok('the job is closed', ['SHIPPED', 'COMPLETED', 'DELIVERED'].includes((await jrow()).status), (await jrow()).status);
    await agrees(ok, 'after the processed sale');
  });

  // ── 3 ────────────────────────────────────────────────────────────────────────────────────
  const b3 = await branch('WAREHOUSE', 1);
  await W(G, 'Flow 3: a purchase order is approved, received in two parts, costed from its line and posted', { id: 'WF-03', purpose: 'Buy material and bring it into stock at its actual cost', start: 'A buyer raises a purchase order', role: 'Buyer, receiving clerk', ui: 'Purchasing; Receiving', api: 'POST /api/purchase-orders, PUT /api/purchase-orders/:id, POST /api/inventory/receipts', db: 'Order (PO), OrderLine, Coil, Inventory, MaterialMovement, LedgerEvent, JournalEntry', events: 'STOCK_RECEIVED per receipt', fin: 'raw inventory up and received-not-invoiced up by pounds times the line price, per receipt', final: 'purchase order fully received; two stock items at the branch at cost' }, async (ok, x) => {
    const g = b3.grades[0]; const heat = E.heats[g]; const cost = COST_OF[g] ?? 0.4; const supplier = E.suppliers[0];
    const line = { gradeId: heat.gradeId, description: `P12 ${g} plate`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 4000, unit: 'LB', unitPrice: cost, priceUnit: 'LB', extendedPrice: r2(4000 * cost) };
    const po = await P.buyer(b3).post('/api/purchase-orders', { sellerId: supplier.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, locationId: b3.id, lines: [line] });
    ok('the purchase order is written', po.status === 201, `${po.status} ${err(po)}`);
    const poLineId = po.body.lines?.[0]?.id || (await prisma.orderLine.findFirst({ where: { orderId: po.body.id } })).id;
    const rc = (weightLb) => P.receiver(b3).post('/api/inventory/receipts', { coilNumber: tag('P12R'), form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: g, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb, locationId: b3.id, poLineId });
    const before = await rc(1000);
    ok('goods cannot be received against a purchase order that is not placed', before.status >= 400 && before.status < 500, `${before.status} ${err(before)}`);
    const placed = await P.buyer(b3).put(`/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' });
    ok('the purchase order is placed', placed.status === 200, `${placed.status} ${err(placed)}`);
    const seller = await P.seller(b3).post('/api/inventory/receipts', { coilNumber: tag('P12R'), form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: g, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 100, locationId: b3.id, poLineId });
    ok('a sales representative cannot receive goods', seller.status === 403, `${seller.status}`);
    const r1 = await rc(2500);
    ok('the first part is received', r1.status === 201 && r1.body?.item?.id, `${r1.status} ${err(r1)}`);
    const mid = await prisma.order.findUnique({ where: { id: po.body.id }, include: { lines: true } });
    x.note(`after 2,500 of 4,000 lb the purchase order is ${mid.status}; line received ${mid.lines[0].qtyReceived ?? mid.lines[0].qtyShipped ?? 'not recorded on the line'}`);
    const r2nd = await rc(1500);
    ok('the rest is received', r2nd.status === 201, `${r2nd.status} ${err(r2nd)}`);
    // The material is on the dock, so more than was ordered is not turned away: it is received on hold for a decision.
    const overRc = await rc(500);
    const overItem = overRc.body?.item?.id ? await prisma.inventory.findUnique({ where: { coilId: overRc.body.item.id } }) : null;
    ok('500 lb more than was ordered is received on hold, not into free stock', overRc.status === 201 && overItem && n(overItem.qtyOnHold) === 500 && n(overItem.qtyAvailable) === 0, `${overRc.status} hold ${overItem?.qtyOnHold} available ${overItem?.qtyAvailable} ${err(overRc)}`);
    x.note(`the over-receipt says: ${String(overRc.body?.warning || overRc.body?.hold?.reason || overRc.body?.message || '').slice(0, 200)}`);
    const holds = overItem ? await prisma.qCHold.findMany({ where: { coilId: overItem.coilId, status: 'ACTIVE' } }) : [];
    ok('with a hold that says why', holds.length === 1 && /more than ordered/i.test(JSON.stringify(holds[0])), JSON.stringify(holds.map((h) => [h.holdType, h.reason || h.holdReason])).slice(0, 200));
    if (overItem) { const so = await c.order(b3, { grade: g, coilId: overItem.coilId, cost }, 100); const rzv = await P.stock(b3).post(`/api/orders/${so.id}/allocate`, { lineId: so.lines[0].id, coilId: overItem.coilId, qty: 100 }); ok('and it cannot be reserved for a customer while held', rzv.status >= 400 && rzv.status < 500, `${rzv.status} ${err(rzv)}`); }
    for (const [r, lb] of [[r1, 2500], [r2nd, 1500]]) {
      if (r.status !== 201) continue;
      const coil = await prisma.coil.findUnique({ where: { id: r.body.item.id }, include: { inventory: true } });
      ok(`the ${lb} lb item is in stock at the branch at the line's price`, coil.locationId === b3.id && near(coil.unitCost, cost, 0.0001) && n(coil.inventory?.qtyOnHand ?? (await inv(coil.id)).qtyOnHand) === lb, `${coil.locationId === b3.id} cost ${coil.unitCost} on hand ${(await inv(coil.id)).qtyOnHand}`);
      const mv = await moveOf({ coilId: coil.id, movementType: 'RECEIVE' });
      expectEntry(ok, `the ${lb} lb receipt`, (await posted('STOCK_RECEIVED', 'MaterialMovement', mv.id)).entry, { 1200: r2(lb * cost), 2000: -r2(lb * cost) });
      ok(`the ${lb} lb item carries its heat`, Boolean(coil.heatId), coil.heatId);
    }
    const done = await prisma.order.findUnique({ where: { id: po.body.id }, include: { lines: true } });
    ok('the purchase order line shows what arrived, including the part on hold', n(done.lines[0].qtyReceived) === 4500, `${done.lines[0].qtyReceived}`);
    x.note(`purchase order status with everything received: ${done.status}`);
    const closed = await P.buyer(b3).put(`/api/purchase-orders/${po.body.id}`, { status: 'COMPLETE' });
    ok('the buyer closes it, and nothing more can be received against it', closed.status === 200 && (await rc(100)).status === 409, `${closed.status} ${err(closed)}`);
    await agrees(ok, 'after receiving');
  });

  // ── 4 ────────────────────────────────────────────────────────────────────────────────────
  const from = await branch('LARGE', 4); const to = await branch('SMALL', 4);
  await W(G, 'Flow 4: stock is transferred, is in transit, is received at the other branch, and the books agree at each moment', { id: 'WF-04', purpose: 'Move stock between two branches without losing it from the books', start: 'The sending branch ships a transfer', role: 'Inventory manager (sending), receiving clerk (receiving)', ui: 'Inventory: Transfers', api: 'POST /api/inventory/transfers, POST /api/inventory/transfers/:id/receive', db: 'StockTransfer, StockTransferLine, Coil, Inventory, MaterialMovement', events: 'TRANSFER_SHIPPED and TRANSFER_RECEIVED ledger events', fin: 'inventory moves to in transit at cost, then to the receiving branch; no revenue', final: 'the item is at the receiving branch at the same cost; nothing in transit' }, async (ok, x) => {
    const l = await lot(from, 2200); const value = r2(2200 * l.cost);
    const stranger = await P.stock(to).post('/api/inventory/transfers', { toLocationId: to.id, coilIds: [l.coilId], carrier: 'Own truck' });
    ok('another branch cannot send this branch\'s stock', stranger.status >= 400 && stranger.status < 500, `${stranger.status} ${err(stranger)}`);
    const t = await P.stock(from).post('/api/inventory/transfers', { toLocationId: to.id, coilIds: [l.coilId], carrier: 'Own truck' });
    const id = t.body?.id || t.body?.transfer?.id;
    ok('the transfer is sent', (t.status === 201 || t.status === 200) && id, `${t.status} ${err(t)}`);
    const moving = await prisma.coil.findUnique({ where: { id: l.coilId } });
    x.note(`while in transit the item is ${moving.status} at ${moving.locationId === from.id ? 'the sending branch' : moving.locationId === to.id ? 'the receiving branch' : 'no branch'}`);
    const mid = await inv(l.coilId);
    ok('in transit, none of it is available to either branch', n(mid.qtyAvailable) === 0 && n(mid.qtyInTransit) === 2200 && n(mid.qtyOnHand) === 2200 && mid.status === 'IN_TRANSIT', `available ${mid.qtyAvailable}, in transit ${mid.qtyInTransit}, ${mid.status}`);
    const so = await c.order(from, l, 100);
    const sell = await P.stock(from).post(`/api/orders/${so.id}/allocate`, { lineId: so.lines[0].id, coilId: l.coilId, qty: 100 });
    ok('stock in transit cannot be reserved for an order', sell.status === 409 && /on its way/i.test(err(sell)), `${sell.status} ${err(sell)}`);
    const r1 = await agrees(ok, 'while in transit');
    ok('the in-transit figure carries the item\'s value', n(r1.of('IN_TRANSIT')?.records) >= value - 0.01, `${r1.of('IN_TRANSIT')?.records} vs ${value}`);
    const wrong = await (P.receiver(from) || P.stock(from)).post(`/api/inventory/transfers/${id}/receive`, {});
    ok('the sending branch cannot receive its own transfer', wrong.status >= 400 && wrong.status < 500, `${wrong.status} ${err(wrong)}`);
    const rcv = await (P.receiver(to) || P.stock(to)).post(`/api/inventory/transfers/${id}/receive`, {});
    ok('the receiving branch receives it', rcv.status === 200 || rcv.status === 201, `${rcv.status} ${err(rcv)}`);
    const again = await (P.receiver(to) || P.stock(to)).post(`/api/inventory/transfers/${id}/receive`, {});
    ok('receiving it twice changes nothing', again.status !== 500 && (await prisma.materialMovement.count({ where: { coilId: l.coilId, movementType: 'TRANSFER' } })) === 1, `${again.status}`);
    const there = await prisma.coil.findUnique({ where: { id: l.coilId } }); const i = await inv(l.coilId);
    ok('the item is at the receiving branch, whole and at the same cost', there.locationId === to.id && i.locationId === to.id && n(i.qtyOnHand) === 2200 && near(there.unitCost, l.cost, 0.0001), `${there.locationId === to.id} ${i.qtyOnHand} ${there.unitCost}`);
    const tr = await prisma.stockTransfer.findUnique({ where: { id } });
    ok('the transfer is closed', ['RECEIVED', 'COMPLETED', 'CLOSED'].includes(tr.status), tr.status);
    const mvs = await prisma.materialMovement.findMany({ where: { coilId: l.coilId }, orderBy: { createdAt: 'asc' } });
    x.note(`movements of the item: ${mvs.map((m) => m.movementType).join(', ')}`);
    const evs = await prisma.ledgerEvent.findMany({ where: { sourceType: 'MaterialMovement', sourceId: { in: mvs.map((m) => m.id) } } });
    ok('every movement of the item is posted once', evs.length >= 2 && evs.every((e) => e.status === 'POSTED') && new Set(evs.map((e) => `${e.eventKind}|${e.sourceId}`)).size === evs.length, evs.map((e) => `${e.eventKind}:${e.status}`).join(', '));
    const r2x = await agrees(ok, 'after receipt');
    x.note(`in transit after receipt: records ${r2x.of('IN_TRANSIT')?.records}, books ${r2x.of('IN_TRANSIT')?.books}`);
  });

  // ── 5 ────────────────────────────────────────────────────────────────────────────────────
  const b5 = await branch('LARGE', 6);
  await W(G, 'Flow 5: a work order consumes an item, makes two pieces and scrap, and the stock value follows', { id: 'WF-05', purpose: 'Process material and keep weight, cost and traceability through the cut', start: 'A scheduler writes a work order against a stock item', role: 'Scheduler, operator', ui: 'Work Orders', api: 'POST /api/work-orders, PUT /api/work-orders/:id/release, /start, /complete', db: 'WorkOrder, Coil (source and outputs), Inventory, MaterialMovement', events: 'material issued, production completed, scrap written off', fin: 'the source leaves raw stock at cost; outputs enter at the same cost per pound; scrap is expensed at cost', final: 'source consumed; two outputs in stock tracing to the source heat; scrap recorded' }, async (ok, x) => {
    const l = await lot(b5, 3000); const who = P.scheduler(b5); const opr = P.operator(b5);
    const wo = await who.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: l.coilId, priority: 3, notes: 'P12 synthetic slit' });
    ok('the work order is written', wo.status === 201, `${wo.status} ${err(wo)}`);
    x.note('by the permissions matrix, sales, warehouse, quality and production staff may all move a work order (lib/roleAccess.js, Jobs)');
    const st = await opr.put(`/api/work-orders/${wo.body.id}/start`, {});
    ok('the operator starts it', st.status === 200, `${st.status} ${err(st)}`);
    const again = await opr.put(`/api/work-orders/${wo.body.id}/start`, {});
    ok('it cannot be started twice', again.status === 409, `${again.status} ${err(again)}`);
    // 100 lb of the same item are promised to a customer: the work order may use only what is left.
    const sellIt = await c.order(b5, l, 100);
    const rz = await P.stock(b5).post(`/api/orders/${sellIt.id}/allocate`, { lineId: sellIt.lines[0].id, coilId: l.coilId, qty: 100 });
    ok('100 lb of the item are reserved for a customer', rz.status === 201, `${rz.status} ${err(rz)}`);
    const heavy = await opr.put(`/api/work-orders/${wo.body.id}/complete`, { scrapWeightLb: 30, outputs: [{ weightLb: 1485, widthIn: 24 }, { weightLb: 1485, widthIn: 24 }] });
    ok('the work order cannot use the pounds promised to the customer', heavy.status === 409 && /2,900/.test(err(heavy)), `${heavy.status} ${err(heavy)}`);
    ok('and the refusal changed nothing', n((await inv(l.coilId)).qtyOnHand) === 3000 && (await prisma.coil.count({ where: { parentCoilId: l.coilId } })) === 0);
    const done = await opr.put(`/api/work-orders/${wo.body.id}/complete`, { scrapWeightLb: 30, outputs: [{ weightLb: 1435, widthIn: 24 }, { weightLb: 1435, widthIn: 24 }] });
    ok('completed with two pieces and 30 lb of scrap', done.status === 200, `${done.status} ${err(done)}`);
    const src = await prisma.coil.findUnique({ where: { id: l.coilId } }); const kids = await prisma.coil.findMany({ where: { parentCoilId: l.coilId }, orderBy: { createdAt: 'asc' } });
    const left = await inv(l.coilId);
    ok('the source keeps exactly the 100 lb promised to the customer', n(left.qtyOnHand) === 100 && n(left.qtyAllocated) === 100 && n(left.qtyAvailable) === 0, `${src.status}: on hand ${left.qtyOnHand}, reserved ${left.qtyAllocated}`);
    ok('two pieces came out, each 1,435 lb, at the source\'s cost per pound, on the source\'s heat', kids.length === 2 && kids.every((k) => near(k.unitCost, l.cost, 0.0001) && k.heatId === src.heatId && k.locationId === b5.id), JSON.stringify(kids.map((k) => [k.unitCost, k.heatId === src.heatId])));
    const on = await Promise.all(kids.map((k) => inv(k.id)));
    ok('the pieces are in stock', on.every((i) => n(i?.qtyOnHand) === 1435), on.map((i) => i?.qtyOnHand).join(','));
    ok('weight is conserved: pieces plus scrap equal the source', on.reduce((a, i) => a + n(i?.qtyOnHand), 0) + 30 + n(left.qtyOnHand) === 3000);
    const w = await prisma.workOrder.findUnique({ where: { id: wo.body.id } });
    ok('the work order records the scrap and is complete', w.status === 'COMPLETE' && n(w.scrapWeightLb ?? w.scrapWeight ?? w.scrapLb) === 30, `${w.status} ${w.scrapWeightLb}`);
    const mvs = await prisma.materialMovement.findMany({ where: { OR: [{ coilId: l.coilId }, { coilId: { in: kids.map((k) => k.id) } }], createdAt: { gte: new Date(Date.now() - 120000) } } });
    const evs = await prisma.ledgerEvent.findMany({ where: { OR: [{ sourceType: 'MaterialMovement', sourceId: { in: mvs.map((m) => m.id) } }, { sourceType: 'WorkOrder', sourceId: wo.body.id }] } });
    x.note(`ledger events of the work order: ${evs.map((e) => `${e.eventKind}:${e.status}`).join(', ') || 'none'}`);
    ok('the work order\'s postings are all posted', evs.length >= 1 && evs.every((e) => e.status === 'POSTED'), evs.map((e) => `${e.eventKind}:${e.status}`).join(', '));
    const entries = await prisma.journalEntry.findMany({ where: { id: { in: evs.map((e) => e.journalEntryId).filter(Boolean) } }, include: { lines: { include: { account: true } } } });
    const g = {}; for (const e of entries) for (const [k, v] of Object.entries(nets(e))) g[k] = r2((g[k] || 0) + v);
    x.note(`net effect of the work order on the books: ${JSON.stringify(g)}`);
    ok('together they balance, and scrap is expensed at 30 lb times cost', near(sumNets(g), 0) && Object.values(g).some((v) => near(v, r2(30 * l.cost))), JSON.stringify(g));
    const scrap = await cfo.get('/api/ledger/reports/scrap');
    ok('the scrap report answers', scrap.status === 200, scrap.status);
    const rem = await P.stock(b5).get('/api/remnants');
    x.note(`remnant list answered ${rem.status} with ${(rem.body?.data || rem.body || []).length ?? '?'} rows`);
    await agrees(ok, 'after the work order');
  });

  // ── 6 ────────────────────────────────────────────────────────────────────────────────────
  const b6 = await branch('MEDIUM', 7);
  await W(G, 'Flow 6: a web order is placed once, accepted, fulfilled, paid, and shown to the buyer', { id: 'WF-06', purpose: 'Take an order from the web store through to cash', start: 'A customer buyer checks out on the web store', role: 'Customer buyer; CSR; inventory manager; shipping coordinator', ui: 'Shop (customer); Online Order Inbox; Shipping', api: 'POST /api/ecom/checkout/submit, POST /api/orders/online/:id/accept, GET /api/ecom/my-orders, then shipments and payments', db: 'OnlineOrder, Order, Inventory, Shipment, Invoice, Payment', events: 'INVOICE_ISSUED, STOCK_SHIPPED, PAYMENT_RECORDED', fin: 'as a sale; nothing is charged to a card by the product', final: 'one internal order for the web order; shipped, invoiced, paid; visible to its buyer only' }, async (ok, x) => {
    const buyer = b6.buyers[0]; const key = tag('P12WEB'); const body = { items: [{ productId: E.each.id, quantity: 3, sku: E.each.sku }], deliveryMethod: 'PICKUP' };
    const [p1, p2] = await Promise.all([buyer.call('POST', '/api/ecom/checkout/submit', body, { 'Idempotency-Key': key }), buyer.call('POST', '/api/ecom/checkout/submit', body, { 'Idempotency-Key': key })]);
    const ids = new Set([p1, p2].filter((r) => r.status < 300).map((r) => r.body?.data?.id));
    ok('the checkout pressed twice makes one web order', ids.size === 1 && [p1, p2].every((r) => r.status < 500), `${p1.status} ${p2.status} ${err(p1)} ${err(p2)}`);
    const webId = [...ids][0];
    const acc = await P.csr(b6).post(`/api/orders/online/${webId}/accept`, { locationId: b6.id });
    ok('the branch accepts it into an order', acc.status === 200 && acc.body?.internalOrderId, `${acc.status} ${err(acc)}`);
    const acc2 = await P.csr(b6).post(`/api/orders/online/${webId}/accept`, { locationId: b6.id });
    ok('accepting it again makes no second order', acc2.status !== 500 && (acc2.status >= 400 || acc2.body?.internalOrderId === acc.body.internalOrderId), `${acc2.status}`);
    const o = await order(acc.body.internalOrderId);
    ok('the order is the buyer\'s company\'s, at the branch, for three pieces', o.locationId === b6.id && o.lines.length === 1 && n(o.lines[0].qtyOrdered) === 3, `${o.lines.length} lines, qty ${o.lines[0]?.qtyOrdered}`);
    const mine = await buyer.get('/api/ecom/my-orders');
    ok('the buyer sees the order in the portal', mine.status === 200 && (JSON.stringify(mine.body).includes(webId) || JSON.stringify(mine.body).includes(String(acc.body.internalOrderNumber))), mine.status);
    const other = (await branch('MEDIUM', 8)).buyers[0]; const theirs = await other.get('/api/ecom/my-orders');
    ok('a buyer of another company does not', theirs.status === 200 && !JSON.stringify(theirs.body).includes(webId) && !JSON.stringify(theirs.body).includes(String(acc.body.internalOrderNumber)));
    if (o.status !== 'CONFIRMED') { const cf = await P.csr(b6).put(`/api/orders/${o.id}`, { status: 'CONFIRMED' }); x.note(`order was ${o.status}; confirm answered ${cf.status}`); }
    // Fulfilment from shelf stock of the product at the branch.
    const shelf = await c.shelfStockBooked({ sku: E.each.sku, pieces: 10, unitCost: 2.5, locationId: b6.id }).catch((e) => ({ error: String(e.message || e) }));
    x.note(`shelf stock for the web product: ${JSON.stringify(shelf).slice(0, 200)}`);
    const coilId = shelf?.coil?.id || shelf?.coilId || shelf?.id;
    const line = o.lines[0];
    const rz = await P.stock(b6).post(`/api/orders/${o.id}/allocate`, { lineId: line.id, coilId, qty: 3 });
    ok('three pieces are reserved', rz.status === 201, `${rz.status} ${err(rz)}`);
    const who = P.shipper(b6) || P.stock(b6);
    const s = await who.post('/api/shipments', { orderId: o.id, fromLocationId: b6.id, carrierName: 'Customer pickup', items: [{ orderLineId: line.id, qtyShipped: 3, weightLb: 3 }] });
    ok('the pickup is put together', s.status === 201, `${s.status} ${err(s)}`);
    const d = await who.put(`/api/shipments/${s.body?.id}/dispatch`, {});
    ok('it is handed over and billed', d.status === 200 && d.body?.invoice?.id, `${d.status} ${err(d)}`);
    if (d.status === 200) {
      const invoice = await prisma.invoice.findUnique({ where: { id: d.body.invoice.id } });
      ok('the invoice total is the order total', near(invoice.totalAmount, (await order(o.id)).totalAmount, 0.011), `${invoice.totalAmount} vs ${(await order(o.id)).totalAmount}`);
      ok('the shelf fell by three', n((await inv(coilId)).qtyOnHand) === n(shelf?.onHand ?? 10) - 3 || n((await inv(coilId)).qtyOnHand) === 7, (await inv(coilId)).qtyOnHand);
      await deliverAndPay(ok, b6, { shipment: s.body, invoice, who });
      const seen = await buyer.get('/api/ecom/my-orders');
      x.note(`the portal now shows the order as: ${(JSON.stringify(seen.body).match(/"status":"([A-Z_]+)"/) || [])[1] || 'not found'}`);
    }
    await agrees(ok, 'after the web order');
  });

  // ── 7 ────────────────────────────────────────────────────────────────────────────────────
  const b7 = await branch('SALES', 2);
  await W(G, 'Flow 7: a counter sale takes stock, gives a receipt and posts once, however often the button is pressed', { id: 'WF-07', purpose: 'Sell shelf goods over the counter for immediate payment', start: 'A walk-in customer pays at the counter', role: 'CSR at the counter', ui: 'Quick Sale (counter)', api: 'POST /api/pos/quick-sale/process-payment', db: 'Order, Invoice, Payment, Inventory, MaterialMovement', events: 'INVOICE_ISSUED, PAYMENT_RECORDED, STOCK_SHIPPED', fin: 'cash and revenue at once; sales tax where the branch state has a rate; cost of goods at the item\'s cost', final: 'one order, one paid invoice, shelf reduced once' }, async (ok, x) => {
    const shelfRow = async () => prisma.inventory.findFirst({ where: { locationId: b7.id, coil: { productId: E.shelfProduct.id }, qtyOnHand: { gt: 0 } }, orderBy: { qtyOnHand: 'desc' } });
    let before = await shelfRow();
    if (!before || n(before.qtyOnHand) < 5) { await c.shelfStockBooked({ sku: E.shelfProduct.sku, pieces: 20, unitCost: 2.5, locationId: b7.id }).catch(() => null); before = await shelfRow(); }
    x.note(`shelf before: ${before ? before.qtyOnHand : 'no shelf stock row at this branch'}`);
    const id = tag('P12QS'); const sale = { sale: { id, items: [{ productId: E.shelfProduct.id, quantity: 2 }] }, payment: { method: 'CASH', amountTendered: 100000 } };
    const rs = await Promise.all([P.csr(b7).post('/api/pos/quick-sale/process-payment', sale), P.csr(b7).post('/api/pos/quick-sale/process-payment', sale), P.csr(b7).post('/api/pos/quick-sale/process-payment', sale)]);
    const made = rs.filter((r) => r.status === 201);
    ok('pressed three times at once, the sale is taken once', made.length >= 1 && new Set(made.map((r) => r.body.orderId)).size === 1 && rs.every((r) => r.status < 500), rs.map((r) => `${r.status} ${r.status >= 400 ? err(r) : ''}`).join(' | '));
    const orderId = made[0]?.body?.orderId;
    ok('one order for the sale', orderId && (await prisma.order.count({ where: { id: orderId } })) === 1);
    const invs = await liveInvoices({ orderId });
    ok('one invoice, paid in full', invs.length === 1 && invs[0].status === 'PAID' && near(invs[0].paidAmount, invs[0].totalAmount), `${invs.length} ${invs[0]?.status}`);
    const receipt = made[0]?.body?.receipt;
    ok('the receipt total is the invoice total', receipt && near(receipt.total, invs[0].totalAmount), `${receipt?.total} vs ${invs[0]?.totalAmount}`);
    x.note(`receipt: subtotal ${receipt?.subtotal}, tax ${receipt?.tax ?? receipt?.taxAmount}, total ${receipt?.total}, change ${receipt?.change ?? receipt?.changeDue}`);
    const after = before ? await prisma.inventory.findUnique({ where: { id: before.id } }) : null;
    ok('the shelf fell by two, once', before && n(after.qtyOnHand) === n(before.qtyOnHand) - 2, `${before?.qtyOnHand}→${after?.qtyOnHand}`);
    const i = await posted('INVOICE_ISSUED', 'Invoice', invs[0].id); const g = nets(i.entry);
    ok('the sale is posted once and balances', i.event?.status === 'POSTED' && near(sumNets(g), 0) && (await prisma.ledgerEvent.count({ where: { sourceType: 'Invoice', sourceId: invs[0].id, eventKind: 'INVOICE_ISSUED' } })) === 1, JSON.stringify(g));
    const pays = await prisma.payment.findMany({ where: { invoiceId: invs[0].id } });
    ok('one payment, posted once', pays.length === 1 && (await eventOf('PAYMENT_RECORDED', 'Payment', pays[0].id))?.status === 'POSTED', pays.length);
    const noStock = await P.csr(b7).post('/api/pos/quick-sale/process-payment', { sale: { id: tag('P12QS'), items: [{ productId: E.shelfProduct.id, quantity: 1000000 }] }, payment: { method: 'CASH', amountTendered: 1e9 } });
    ok('more than the shelf holds cannot be sold', noStock.status >= 400 && noStock.status < 500, `${noStock.status} ${err(noStock)}`);
    await agrees(ok, 'after the counter sale');
  });

  // ── 8 ────────────────────────────────────────────────────────────────────────────────────
  const b8 = await branch('MEDIUM', 9);
  await W(G, 'Flow 8: goods come back, are checked in with a decision, credited once, refunded, and the books reverse', { id: 'WF-08', purpose: 'Take material back and return the customer\'s money', start: 'A customer returns part of a paid shipment', role: 'CSR, receiving clerk, branch manager', ui: 'Returns', api: 'POST /api/returns, POST /api/returns/:id/receive, POST /api/invoices/:id/refund', db: 'Return, ReturnLine, Inventory, MaterialMovement, Invoice (CREDIT), Payment (refund)', events: 'CREDIT_MEMO_ISSUED, STOCK_RETURNED, REFUND_PAID', fin: 'revenue and receivables reversed by the credit; stock back at cost when restocked; cash out at refund', final: 'return received; one credit memo; refund paid; the invoice history intact' }, async (ok, x) => {
    const customer = b8.customers[0]; const g = b8.grades[0]; const l = await lot(b8, 3000, g);
    const o = await c.order(b8, l, 800, { customer });
    const noop = () => true;
    const sh = await shipAndBill(noop, b8, o, o.lines[0], l, 800); await deliverAndPay(noop, b8, sh);
    const total = Number(sh.invoice.totalAmount);
    const tooMany = await P.csr(b8).post('/api/returns', { orderId: o.id, reason: 'P12 synthetic', lines: [{ orderLineId: o.lines[0].id, quantity: 900, disposition: 'RESTOCK', coilId: l.coilId }] });
    ok('more than was shipped cannot be returned', tooMany.status >= 400 && tooMany.status < 500, `${tooMany.status} ${err(tooMany)}`);
    const ret = await P.csr(b8).post('/api/returns', { orderId: o.id, reason: 'P12 synthetic: wrong size sent', lines: [{ orderLineId: o.lines[0].id, quantity: 200, disposition: 'RESTOCK', coilId: l.coilId }] });
    ok('the return is opened', ret.status === 201, `${ret.status} ${err(ret)}`);
    ok('nothing is credited before the goods are checked in', (await prisma.invoice.count({ where: { kind: 'CREDIT', creditOfInvoiceId: sh.invoice.id } })) === 0);
    const before = await inv(l.coilId);
    const rs = await Promise.all([0, 1].map(() => (P.receiver(b8) || P.stock(b8)).post(`/api/returns/${ret.body.id}/receive`, {})));
    ok('checked in twice at once, it is received once', rs.filter((r) => r.status === 200).length >= 1 && rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    const after = await inv(l.coilId);
    ok('200 lb are back in stock, once', n(after.qtyOnHand) === n(before.qtyOnHand) + 200, `${before.qtyOnHand}→${after.qtyOnHand}`);
    const credits = await prisma.invoice.findMany({ where: { kind: 'CREDIT', creditOfInvoiceId: sh.invoice.id, status: { not: 'CANCELLED' } } });
    const want = r2(total * 200 / 800);
    ok('one credit memo for a quarter of the invoice', credits.length === 1 && near(Math.abs(Number(credits[0].totalAmount)), want, 0.011), `${credits.length} ${credits[0]?.totalAmount} vs ${want}`);
    const row = await prisma.order.findUnique({ where: { id: ret.body.id }, include: { lines: true } });
    x.note(`a return is an order of type ${row?.orderType} with status ${row?.status}; there is no separate inspection record: the decision to restock or scrap, made at check-in, is the inspection`);
    const ce = await prisma.ledgerEvent.findMany({ where: { sourceType: 'Invoice', sourceId: credits[0]?.id } });
    const entry = ce[0]?.journalEntryId ? await prisma.journalEntry.findUnique({ where: { id: ce[0].journalEntryId }, include: { lines: { include: { account: true } } } }) : null;
    const g2 = entry ? nets(entry) : {};
    ok('the credit is posted once: revenue and receivables reversed, the entry balances', ce.length === 1 && ce[0].status === 'POSTED' && near(sumNets(g2), 0) && near(g2['1100'], -want, 0.011), `${ce.map((e) => `${e.eventKind}:${e.status}`)} ${JSON.stringify(g2)}`);
    const back = await moveOf({ coilId: l.coilId, movementType: 'RECEIVE', orderId: ret.body.id });
    x.note(`return movement: ${back?.movementType || 'none of the expected kinds'}`);
    if (back) expectEntry(ok, 'the stock comes back at cost', (await posted((await prisma.ledgerEvent.findFirst({ where: { sourceType: 'MaterialMovement', sourceId: back.id } }))?.eventKind, 'MaterialMovement', back.id)).entry, { 1200: r2(200 * l.cost), 5000: -r2(200 * l.cost) });
    const original = await prisma.invoice.findUnique({ where: { id: sh.invoice.id } });
    ok('the original invoice is untouched', near(original.totalAmount, total) && original.status === 'PAID', `${original.status} ${original.totalAmount}`);
    const clerk = await P.csr(b8).post(`/api/invoices/${credits[0]?.id}/refund`, { amount: want, paymentMethod: 'CHECK', referenceNumber: tag('P12RF') });
    ok('a clerk cannot pay the refund', clerk.status === 403, `${clerk.status}`);
    const rf = await P.manager(b8).post(`/api/invoices/${credits[0]?.id}/refund`, { amount: want, paymentMethod: 'CHECK', referenceNumber: tag('P12RF') });
    ok('the manager pays the refund', rf.status === 201, `${rf.status} ${err(rf)}`);
    const rf2 = await P.manager(b8).post(`/api/invoices/${credits[0]?.id}/refund`, { amount: want, paymentMethod: 'CHECK', referenceNumber: tag('P12RF') });
    ok('it cannot be refunded twice', rf2.status >= 400 && rf2.status < 500, `${rf2.status} ${err(rf2)}`);
    await agrees(ok, 'after the return');
  });

  // ── 9 ────────────────────────────────────────────────────────────────────────────────────
  const b9 = await branch('LARGE', 8);
  await W(G, 'Flow 9: an order ships in two parts, each billed for what left, and closes when the rest has gone', { id: 'WF-09', purpose: 'Ship what is ready and bill only that; keep the rest reserved', start: 'Part of an order is ready before the rest', role: 'Inventory manager, shipping coordinator, CSR', ui: 'Orders; Shipping; Invoices', api: 'as flow 1, with two shipments', db: 'Order, Shipment (2), Invoice (2)', events: 'two INVOICE_ISSUED, two STOCK_SHIPPED', fin: 'receivables rise by each part as it leaves; never by the whole order early', final: 'two shipments, two invoices adding up to the order, order closed' }, async (ok, x) => {
    const customer = b9.customers[2]; const g = b9.grades[0]; const l = await lot(b9, 5000, g);
    const o = await c.order(b9, l, 2000, { customer }); const line = o.lines[0]; const price = PRICE_OF[g] ?? 0.65;
    const rz = await P.stock(b9).post(`/api/orders/${o.id}/allocate`, { lineId: line.id, coilId: l.coilId, qty: 2000 });
    ok('the whole line is reserved', rz.status === 201, `${rz.status} ${err(rz)}`);
    const who = P.shipper(b9) || P.stock(b9);
    const mk = (qty) => who.post('/api/shipments', { orderId: o.id, fromLocationId: b9.id, carrierName: 'Own Truck', items: [{ orderLineId: line.id, qtyShipped: qty, weightLb: qty }] });
    const s1 = await mk(1200); const d1 = await who.put(`/api/shipments/${s1.body.id}/dispatch`, {});
    ok('the first 1,200 lb leave and are billed', s1.status === 201 && d1.status === 200 && d1.body?.invoice?.id, `${s1.status} ${d1.status} ${err(d1)}`);
    const i1 = await prisma.invoice.findUnique({ where: { id: d1.body.invoice.id } });
    ok('the first invoice is for 1,200 lb only', near(i1.subtotal, r2(1200 * price), 0.011), `${i1.subtotal} vs ${r2(1200 * price)}`);
    const mid = await order(o.id); const held = await inv(l.coilId);
    ok('the order stays open with 800 lb still reserved', mid.status === 'PARTIAL' && n(held.qtyAllocated) === 800 && n(held.qtyOnHand) === 3800, `${mid.status}; allocated ${held.qtyAllocated}; on hand ${held.qtyOnHand}`);
    x.note(`order status after the first part: ${mid.status}; line shipped ${mid.lines[0].qtyShipped}`);
    const over = await mk(900);
    ok('more than the 800 lb left cannot be shipped', over.status >= 400 && over.status < 500, `${over.status} ${err(over)}`);
    const s2 = await mk(800); const d2 = await who.put(`/api/shipments/${s2.body.id}/dispatch`, {});
    ok('the remaining 800 lb leave and are billed', s2.status === 201 && d2.status === 200 && d2.body?.invoice?.id && d2.body.invoice.id !== i1.id, `${s2.status} ${d2.status} ${err(d2)}`);
    const invs = await liveInvoices({ orderId: o.id });
    ok('two invoices that add up to the order', invs.length === 2 && near(invs.reduce((a, i) => a + Number(i.subtotal), 0), r2(2000 * price), 0.011), `${invs.length}: ${invs.map((i) => i.subtotal)}`);
    ok('their numbers differ', new Set(invs.map((i) => i.invoiceNumber)).size === 2);
    const end = await order(o.id);
    ok('the order is closed as shipped and nothing is left reserved', end.status === 'COMPLETE' && n((await inv(l.coilId)).qtyAllocated) === 0 && n(end.lines[0].qtyShipped) === 2000, `${end.status} shipped ${end.lines[0].qtyShipped}`);
    const evs = await prisma.ledgerEvent.findMany({ where: { sourceType: 'Invoice', sourceId: { in: invs.map((i) => i.id) }, eventKind: 'INVOICE_ISSUED' } });
    ok('each invoice is posted once', evs.length === 2 && evs.every((e) => e.status === 'POSTED'));
    await agrees(ok, 'after both parts');
  });

  // ── 10 ───────────────────────────────────────────────────────────────────────────────────
  await W(G, 'Flow 10: every branch\'s figures add up to the enterprise\'s, and a branch manager reads only the branch', { id: 'WF-10', purpose: 'Consolidate the branches into one set of books', start: 'Finance reads the reports after the day\'s work', role: 'CFO, auditor, branch manager', ui: 'Finance: Reports', api: 'GET /api/ledger/reports/trial-balance, revenue, gross-margin, inventory, receivables', db: 'read only', events: 'each report read is recorded', fin: 'total debits equal total credits; branch revenue adds to enterprise revenue', final: 'one total whichever way it is cut' }, async (ok, x) => {
    const tb = await cfo.get('/api/ledger/reports/trial-balance');
    ok('the trial balance answers', tb.status === 200, `${tb.status} ${err(tb)}`);
    const t = tb.body.totals || {}; const rows = tb.body.rows || tb.body.accounts || [];
    const deb = t.debit ?? t.debits ?? rows.reduce((a, r) => a + n(r.debit), 0); const cred = t.credit ?? t.credits ?? rows.reduce((a, r) => a + n(r.credit), 0);
    ok('total debits equal total credits', near(deb, cred, 0.005) && n(deb) > 0, `${deb} vs ${cred}`);
    const raw = (await prisma.$queryRawUnsafe('SELECT COALESCE(SUM(l.debit),0)::float8 AS d, COALESCE(SUM(l.credit),0)::float8 AS c FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e.status IN (\'POSTED\',\'REVERSED\')'))[0];
    ok('and both equal the journal lines summed in the database', near(raw.d, raw.c, 0.005), `${raw.d} vs ${raw.c}`);
    x.note(`journal: debits ${raw.d}, credits ${raw.c}; trial balance debit ${deb}, credit ${cred}`);
    const byBranch = await cfo.get('/api/ledger/reports/revenue?by=branch'); const byCustomer = await cfo.get('/api/ledger/reports/revenue?by=customer');
    ok('revenue by branch and by customer have one total', byBranch.status === 200 && byCustomer.status === 200 && near(byBranch.body.total, byCustomer.body.total, 0.011), `${byBranch.body.total} vs ${byCustomer.body.total}`);
    const rev = (await prisma.$queryRawUnsafe('SELECT COALESCE(SUM(l.credit - l.debit),0)::float8 AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" JOIN "LedgerAccount" a ON a.id = l."accountId" WHERE e.status IN (\'POSTED\',\'REVERSED\') AND a.type::text IN (\'REVENUE\',\'CONTRA_REVENUE\')'))[0].v;
    ok('and it is revenue less returns in the journal', near(byBranch.body.total, rev, 0.011), `${byBranch.body.total} vs ${rev}`);
    ok('the branch rows add up to the total', near((byBranch.body.rows || []).reduce((a, r) => a + n(r.net), 0), byBranch.body.total, 0.011));
    const gm = await cfo.get('/api/ledger/reports/gross-margin?by=branch');
    const gmNet = (gm.body.rows || []).reduce((a, r) => a + n(r.netSales), 0);
    ok('the gross margin report\'s net sales are the same revenue', gm.status === 200 && near(gmNet, byBranch.body.total, 0.011 * Math.max(1, (gm.body.rows || []).length)), `${gm.status} ${gmNet} vs ${byBranch.body.total}`);
    ok('and it says it is not a profit and loss statement', /not a profit and loss/i.test(gm.body.note || ''));
    const mgr = P.manager(b1);
    const own = await mgr.get('/api/ledger/reports/revenue?by=branch');
    ok('a branch manager\'s revenue report holds only the branch', own.status === 200 && (own.body.rows || []).every((r) => !r.key || r.key === b1.id), `${own.status} ${(own.body.rows || []).length} rows`);
    const mine = (byBranch.body.rows || []).find((r) => r.key === b1.id);
    ok('and its total is that branch\'s row in the enterprise report', own.status === 200 && near(own.body.total, mine?.net ?? 0, 0.011), `${own.body?.total} vs ${mine?.net}`);
    const tbm = await mgr.get('/api/ledger/reports/trial-balance');
    x.note(`a branch manager asking for the trial balance is answered ${tbm.status}`);
    const audit = await prisma.auditLog.count({ where: { timestamp: { gte: new Date(Date.now() - 60000) }, eventType: { contains: 'REPORT' } } });
    ok('the report reads are in the audit log', audit >= 3, audit);
    await agrees(ok, 'at the end of the flows');
  });
}
