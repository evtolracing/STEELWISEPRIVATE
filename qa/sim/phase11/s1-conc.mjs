// Group 1: sales, inventory and purchasing under people working at the same moment, at every kind of branch.
export default async function run(c) {
  const { S, G11, SELLING, branch, P, lot, order, all, statuses, count, inv, n, prisma, ok2, err, tag, job, X, E } = c;
  const G = G11.conc;
  let k = 0;
  for (const tier of SELLING) {
    const b = await branch(tier, k++); const at = `${TIERSAY(c, tier)} ${b.code}`;

    await S(G, `${at}: six orders reach for the last 1,000 lb of a lot at the same moment`, { expect: 'two reservations of 400 lb succeed, four are refused, the lot is never reserved beyond what is on hand', biz: 'two orders hold stock, four do not', db: 'Inventory: on hand 1000, reserved 800, available 200' }, async (ok) => {
      const l = await lot(b, 1000); const orders = []; for (let i = 0; i < 6; i++) orders.push(await order(b, l, 400, { customer: b.customers[i % b.customers.length] }));
      const rs = await Promise.all(orders.map((o) => P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 400 })));
      const i = await inv(l.coilId);
      ok('exactly two were reserved', count(rs, 201) === 2, statuses(rs));
      ok('the other four were refused as a conflict, not a server error', count(rs, 409) === 4 && !rs.some((r) => r.status >= 500), statuses(rs));
      ok('reserved 800 of 1000, 200 still free, nothing negative', n(i.qtyOnHand) === 1000 && n(i.qtyAllocated) === 800 && n(i.qtyAvailable) === 200, JSON.stringify(i));
      ok('the reservations on record add up to what the stock item says', n((await prisma.orderLineAllocation.aggregate({ where: { coilId: l.coilId }, _sum: { qtyAllocated: true } }))._sum.qtyAllocated) === 800);
      l.free = 200;
    });

    await S(G, `${at}: one order is confirmed by four people at the same moment`, { expect: 'the order is confirmed once; nobody is shown a server error', db: 'Order.status CONFIRMED' }, async (ok) => {
      const who = P.seller(b); const l = { grade: b.grades[0] };
      const o = await who.post('/api/orders', { orderType: 'SO', buyerId: b.customers[0].id, status: 'DRAFT', subtotal: 65, taxAmount: 0, freightAmount: 0, totalAmount: 65, poReference: tag('P11'), locationId: b.id, lines: [{ gradeId: E.heats[l.grade].gradeId, description: 'P11 race', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 100, unit: 'LB', unitPrice: 0.65, priceUnit: 'LB', extendedPrice: 65 }] });
      const rs = await all(4, () => who.put(`/api/orders/${o.body.id}`, { status: 'CONFIRMED' }));
      ok('every answer is a success or a clean refusal', rs.every((r) => ok2(r) || [400, 409].includes(r.status)), statuses(rs));
      ok('at least one confirmed it', rs.some((r) => ok2(r)));
      ok('the order is confirmed', (await prisma.order.findUnique({ where: { id: o.body.id } })).status === 'CONFIRMED');
    });

    await S(G, `${at}: the same receipt is keyed four times at the same moment`, { expect: 'one stock item, one receipt movement, one posting; the other three are refused', db: 'one Coil with that number', fin: 'inventory rises once by weight times cost' }, async (ok) => {
      const j = job('PO', b); const grade = b.grades[0]; const heat = E.heats[grade]; const number = tag('P11DUP');
      const line = { gradeId: heat.gradeId, description: 'P11 duplicate receipt', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 2000, unit: 'LB', unitPrice: 0.4, priceUnit: 'LB', extendedPrice: 800 };
      const po = await P.buyer(b).post('/api/purchase-orders', { sellerId: E.suppliers[0].id, status: 'DRAFT', subtotal: 800, taxAmount: 0, freightAmount: 0, totalAmount: 800, locationId: b.id, lines: [line] });
      await P.buyer(b).put(`/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' });
      const poLineId = (await prisma.orderLine.findFirst({ where: { orderId: po.body.id } })).id;
      const rs = await all(4, () => P.receiver(b).post('/api/inventory/receipts', { coilNumber: number, form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: grade, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 2000, locationId: b.id, poLineId }));
      const coils = await prisma.coil.findMany({ where: { coilNumber: number } });
      ok('one receipt was saved', count(rs, 201) === 1, statuses(rs));
      ok('the others were refused, none with a server error', rs.filter((r) => r.status !== 201).every((r) => [400, 409].includes(r.status)), `${statuses(rs)} ${err(rs.find((r) => r.status >= 500) || {})}`);
      ok('one stock item carries the number', coils.length === 1);
      ok('one receipt movement, posted once', (await prisma.materialMovement.count({ where: { coilId: coils[0]?.id, movementType: 'RECEIVE' } })) === 1 && (await prisma.ledgerEvent.count({ where: { eventKind: 'STOCK_RECEIVED', status: 'POSTED', sourceId: (await prisma.materialMovement.findFirst({ where: { coilId: coils[0]?.id } }))?.id } })) === 1);
      void j;
    });

    await S(G, `${at}: twelve orders are entered at the same moment by the branch's sellers`, { expect: 'twelve orders, twelve different numbers, no save refused', db: '12 Order rows of this branch' }, async (ok) => {
      const l = { grade: b.grades[0] };
      const rs = await all(12, (i) => order(b, l, 100 + i, { customer: b.customers[i % b.customers.length] }).then((o) => ({ status: 201, id: o.id }), (e) => ({ status: 500, error: e.message })));
      const rows = await prisma.order.findMany({ where: { id: { in: rs.map((r) => r.id).filter(Boolean) } }, select: { orderNumber: true, locationId: true, status: true } });
      ok('all twelve were saved and confirmed', rows.length === 12 && rows.every((r) => r.status === 'CONFIRMED'), `${rows.length} ${rs.find((r) => r.error)?.error || ''}`);
      ok('twelve different numbers', new Set(rows.map((r) => r.orderNumber)).size === 12);
      ok('all belong to this branch', rows.every((r) => r.locationId === b.id));
    });

    await S(G, `${at}: an order is cancelled at the moment its stock is being reserved`, { expect: 'either the order is cancelled and holds no stock, or it is live and holds its stock; never a cancelled order holding stock', db: 'Inventory reserved quantity equals the reservations of live orders' }, async (ok) => {
      const l = await lot(b, 1500); const o = await order(b, l, 600);
      const [rz, cx] = await Promise.all([P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 600 }), P.seller(b).put(`/api/orders/${o.id}`, { status: 'CANCELLED', cancelReason: 'P11 race' })]);
      const row = await prisma.order.findUnique({ where: { id: o.id } }); const i = await inv(l.coilId);
      const held = n((await prisma.orderLineAllocation.aggregate({ where: { coilId: l.coilId }, _sum: { qtyAllocated: true } }))._sum.qtyAllocated);
      ok('neither answer is a server error', rz.status < 500 && cx.status < 500, `${rz.status} ${cx.status} ${err(rz)} ${err(cx)}`);
      ok('the stock item agrees with the reservations on record', n(i.qtyAllocated) === held && n(i.qtyOnHand) === 1500 && n(i.qtyAvailable) === 1500 - held, JSON.stringify({ i, held }));
      ok('a cancelled order holds nothing', row.status !== 'CANCELLED' || held === 0, `${row.status} holds ${held}`);
      l.free = 1500 - held;
    });

    await S(G, `${at}: more is reserved than the lot has`, { expect: 'refused with a plain answer; nothing is reserved', db: 'Inventory unchanged' }, async (ok) => {
      const l = await lot(b, 800); const o = await order(b, l, 900);
      const r = await P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 900 });
      const i = await inv(l.coilId);
      ok('refused with 409', r.status === 409, `${r.status} ${err(r)}`);
      ok('the answer says how much is there', /800|available|enough|only/i.test(err(r)), err(r));
      ok('nothing was reserved', n(i.qtyAllocated) === 0 && n(i.qtyAvailable) === 800);
    });

    await S(G, `${at}: another branch tries to reserve this branch's stock while both are selling`, { expect: 'each branch sells its own stock; the other branch cannot take it', sec: 'a branch cannot reserve or see another branch\'s stock item', db: 'this branch\'s lot is reserved only for this branch\'s order' }, async (ok) => {
      const other = await branch(tier, k + 3); const mine = await lot(b, 1200); const theirs = await lot(other, 1200);
      const oMine = await order(b, mine, 300); const oTheirs = await order(other, theirs, 300);
      const [a, x, steal] = await Promise.all([
        P.stock(b).post(`/api/orders/${oMine.id}/allocate`, { lineId: oMine.lines[0].id, coilId: mine.coilId, qty: 300 }),
        P.stock(other).post(`/api/orders/${oTheirs.id}/allocate`, { lineId: oTheirs.lines[0].id, coilId: theirs.coilId, qty: 300 }),
        P.stock(other).post(`/api/orders/${oTheirs.id}/allocate`, { lineId: oTheirs.lines[0].id, coilId: mine.coilId, qty: 300 }),
      ]);
      ok('each branch reserved its own', a.status === 201 && x.status === 201, `${a.status} ${x.status}`);
      ok('the other branch could not take this branch\'s lot', [403, 404, 409].includes(steal.status), `${steal.status} ${err(steal)}`);
      ok('this branch\'s lot holds only its own 300', n((await inv(mine.coilId)).qtyAllocated) === 300);
      mine.free -= 300; theirs.free -= 300;
    });

    await S(G, `${at}: a purchase order is placed by four people at the same moment`, { expect: 'placed once; no server error', db: 'the purchase order is CONFIRMED' }, async (ok) => {
      const heat = E.heats[b.grades[0]];
      const line = { gradeId: heat.gradeId, description: 'P11 PO race', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 1000, unit: 'LB', unitPrice: 0.4, priceUnit: 'LB', extendedPrice: 400 };
      const po = await P.buyer(b).post('/api/purchase-orders', { sellerId: E.suppliers[1].id, status: 'DRAFT', subtotal: 400, taxAmount: 0, freightAmount: 0, totalAmount: 400, locationId: b.id, lines: [line] });
      const rs = await all(4, () => P.buyer(b).put(`/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' }));
      ok('no server error', !rs.some((r) => r.status >= 500), statuses(rs));
      ok('placed', (await prisma.order.findUnique({ where: { id: po.body.id } })).status === 'CONFIRMED' && rs.some((r) => ok2(r)));
    });

    await S(G, `${at}: the same reservation is sent five times at the same moment`, { expect: 'the line is reserved for what it ordered and no more', db: 'reservations for the line total the ordered quantity' }, async (ok) => {
      const l = await lot(b, 5000); const o = await order(b, l, 700);
      const rs = await all(5, () => P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 700 }));
      const held = n((await prisma.orderLineAllocation.aggregate({ where: { orderLineId: o.lines[0].id }, _sum: { qtyAllocated: true } }))._sum.qtyAllocated);
      ok('one went through', count(rs, 201) === 1, statuses(rs));
      ok('the line holds 700, not more', held === 700, held);
      ok('the lot shows 700 reserved', n((await inv(l.coilId)).qtyAllocated) === 700);
      ok('no server error', !rs.some((r) => r.status >= 500), statuses(rs));
      l.free = 4300;
    });
  }

  for (const tier of ['LARGE', 'MEDIUM', 'SALES']) {
    const b = await branch(tier, 2);
    await S(G, `${TIERSAY(c, tier)} ${b.code}: a quote is accepted by three people at the same moment`, { expect: 'one order is made from the quote', db: 'Quote.convertedOrderId set once; one order with that quote\'s reference' }, async (ok) => {
      const est = P.estimator(b); const heat = E.heats[b.grades[0]];
      const rfq = await est.post('/api/rfqs', { customerId: b.customers[0].id, requestedDate: new Date(Date.now() + 864e6).toISOString(), lines: [{ description: 'P11 quote race', requestedQty: 500, unit: 'LB', gradeId: heat.gradeId, grade: b.grades[0], thicknessIn: 0.5, widthIn: 48, lengthIn: 96 }] });
      const q = await est.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rfq.body.lines[0].id, unitPrice: 80, priceUnit: 'CWT' }] });
      await est.post(`/api/quotes/${q.body.id}/send`, {});
      const rs = await all(3, () => P.csr(b).post(`/api/quotes/${q.body.id}/accept`, {}));
      const made = rs.filter((r) => r.status === 201);
      ok('one acceptance made the order', made.length === 1, statuses(rs));
      ok('the others were told it is already accepted', rs.filter((r) => r.status !== 201).every((r) => r.status === 409), statuses(rs));
      ok('the quote points at that one order', (await prisma.quote.findUnique({ where: { id: q.body.id } })).convertedOrderId === made[0]?.body?.order?.id);
    });
  }
}
const TIERSAY = (c, tier) => c.TIERS[tier].label;
