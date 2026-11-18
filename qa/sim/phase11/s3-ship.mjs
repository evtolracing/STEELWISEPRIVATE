// Group 3: shipping, logistics and invoicing with people acting at the same moment, at every kind of selling branch.
export default async function run(c) {
  const { S, G11, SELLING, branch, P, onDock, sold, all, statuses, count, inv, n, prisma, ok2, err, TIERS, lot, order } = c;
  const G = G11.ship;
  let k = 5;
  for (const tier of SELLING) {
    const b = await branch(tier, k++); const at = `${TIERS[tier].label} ${b.code}`;
    const liveInvoices = (shipmentId) => prisma.invoice.findMany({ where: { shipmentId, kind: 'INVOICE', status: { not: 'CANCELLED' } } });

    await S(G, `${at}: one shipment is dispatched four times at the same moment`, { expect: 'it leaves once: one stock movement, one invoice, one cost-of-sale entry', db: 'one SHIP movement; one live invoice for the shipment', fin: 'receivables and revenue rise once; inventory falls once' }, async (ok) => {
      const d = await onDock(b, 500);
      const rs = await all(4, () => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {}));
      ok('no server error', !rs.some((r) => r.status >= 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 500) || {})}`);
      ok('it was dispatched', count(rs, 200) >= 1 && (await prisma.shipment.findUnique({ where: { id: d.shipment.id } })).status === 'IN_TRANSIT');
      ok('one SHIP movement', (await prisma.materialMovement.count({ where: { shipmentId: d.shipment.id, movementType: 'SHIP' } })) === 1);
      const invs = await liveInvoices(d.shipment.id);
      ok('one invoice', invs.length === 1, invs.length);
      ok('the stock fell once', n((await inv(d.lot.coilId)).qtyOnHand) === 1000, (await inv(d.lot.coilId)).qtyOnHand);
      ok('one invoice posting and one cost-of-sale posting', (await prisma.ledgerEvent.count({ where: { eventKind: 'INVOICE_ISSUED', sourceId: invs[0]?.id, status: 'POSTED' } })) === 1 && (await prisma.ledgerEvent.count({ where: { eventKind: 'STOCK_SHIPPED', status: 'POSTED', sourceId: (await prisma.materialMovement.findFirst({ where: { shipmentId: d.shipment.id } })).id } })) === 1);
    });

    await S(G, `${at}: a delivery is confirmed four times at the same moment`, { expect: 'delivered once', db: 'Shipment DELIVERED with one proof of delivery' }, async (ok) => {
      const s = await sold(b, 300);
      const rs = await all(4, () => s.shipper.put(`/api/shipments/${s.shipment.id}/deliver`, { podSignature: 'P11 Receiver' }));
      ok('no server error', !rs.some((r) => r.status >= 500), statuses(rs));
      ok('delivered', (await prisma.shipment.findUnique({ where: { id: s.shipment.id } })).status === 'DELIVERED' && count(rs, 200) >= 1);
      ok('still one invoice', (await liveInvoices(s.shipment.id)).length === 1);
    });

    await S(G, `${at}: two shipments are made for the same pounds at the same moment`, { expect: 'one shipment is made; the line cannot be put on two trucks', db: 'open shipments carry no more than the line ordered' }, async (ok) => {
      const l = await lot(b, 1500); const o = await order(b, l, 800);
      await P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty: 800 });
      const who = P.shipper(b) || P.stock(b);
      const rs = await all(2, () => who.post('/api/shipments', { orderId: o.id, fromLocationId: b.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: 800, weightLb: 800 }] }));
      ok('one was made and the other refused', count(rs, 201) === 1 && count(rs, 409) === 1, `${statuses(rs)} ${err(rs.find((r) => r.status >= 400) || {})}`);
      const on = await prisma.shipmentItem.aggregate({ where: { orderLineId: o.lines[0].id, shipment: { status: { notIn: ['CANCELLED'] } } }, _sum: { qtyShipped: true } });
      ok('800 lb on shipments, not 1,600', n(on._sum.qtyShipped) === 800, on._sum.qtyShipped);
    });

    await S(G, `${at}: a shipment is billed five times at the same moment`, { expect: 'the same one invoice is answered every time', db: 'one live invoice for the shipment', fin: 'receivables are not doubled' }, async (ok) => {
      const s = await sold(b, 400);
      const rs = await all(5, () => (P.csr(b) || P.manager(b)).post('/api/invoices', { shipmentId: s.shipment.id }));
      ok('every answer is the existing invoice', rs.every((r) => r.status === 201 && r.body.id === s.invoice.id), `${statuses(rs)} ${[...new Set(rs.map((r) => r.body?.id))].length} ids`);
      ok('one live invoice', (await liveInvoices(s.shipment.id)).length === 1);
      ok('posted once', (await prisma.ledgerEvent.count({ where: { eventKind: 'INVOICE_ISSUED', sourceId: s.invoice.id } })) === 1);
    });

    await S(G, `${at}: an order is cancelled at the moment its shipment is dispatched`, { expect: 'either it shipped and the order lives, or it was cancelled and nothing left; never both', db: 'a cancelled order has no shipment in transit' }, async (ok) => {
      const d = await onDock(b, 350);
      const [dx, cx] = await Promise.all([d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {}), P.seller(b).put(`/api/orders/${d.order.id}`, { status: 'CANCELLED', cancelReason: 'P11 race' })]);
      const o = await prisma.order.findUnique({ where: { id: d.order.id } }); const s = await prisma.shipment.findUnique({ where: { id: d.shipment.id } });
      ok('neither answer is a server error', dx.status < 500 && cx.status < 500, `${dx.status} ${cx.status} ${err(dx)} | ${err(cx)}`);
      ok('not both cancelled and shipped', !(o.status === 'CANCELLED' && ['IN_TRANSIT', 'DELIVERED'].includes(s.status)), `${o.status} / ${s.status}`);
      const shippedOut = n((await inv(d.lot.coilId)).qtyOnHand) === 1000;
      ok('the stock agrees with the shipment', shippedOut === ['IN_TRANSIT', 'DELIVERED'].includes(s.status), `${(await inv(d.lot.coilId)).qtyOnHand} / ${s.status}`);
      ok('a shipment that left has its invoice', !['IN_TRANSIT', 'DELIVERED'].includes(s.status) || (await liveInvoices(s.id)).length === 1);
    });

    await S(G, `${at}: twelve shipments are dispatched at the same moment`, { expect: 'twelve invoices with twelve numbers in a row: none skipped, none repeated, on every server copy', db: 'Invoice numbers consecutive', fin: 'twelve invoice entries' }, async (ok) => {
      const docks = []; for (let i = 0; i < 12; i++) docks.push(await onDock(b, 100 + i, { lotLb: 1200 }));
      const rs = await Promise.all(docks.map((d) => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {})));
      ok('all twelve left, each with an invoice', rs.every((r) => r.status === 200 && r.body.invoice?.id), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
      const nums = (await prisma.invoice.findMany({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) } }, select: { invoiceNumber: true } })).map((i) => Number(i.invoiceNumber.replace(/\D/g, ''))).sort((x, y) => x - y);
      ok('twelve different numbers', new Set(nums).size === 12, nums.join(','));
      ok('in a row, with none skipped', nums.length === 12 && nums[11] - nums[0] === 11, nums.join(','));
      ok('answered by more than one server copy when several run', c.copies < 2 || new Set(rs.map((r) => r.headers?.get('x-qa-instance'))).size > 1);
    });

    await S(G, `${at}: a delivery is confirmed for a shipment that has not left`, { expect: 'refused; the shipment stays on the dock', db: 'Shipment unchanged; no invoice' }, async (ok) => {
      const d = await onDock(b, 200);
      const r = await d.shipper.put(`/api/shipments/${d.shipment.id}/deliver`, { podSignature: 'P11 Receiver' });
      ok('refused with 409', r.status === 409, `${r.status} ${err(r)}`);
      ok('still on the dock, not billed', (await prisma.shipment.findUnique({ where: { id: d.shipment.id } })).status === 'PENDING' && (await liveInvoices(d.shipment.id)).length === 0);
    });
  }
}
