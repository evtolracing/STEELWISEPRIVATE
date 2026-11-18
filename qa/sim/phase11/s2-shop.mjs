// Group 2: manufacturing, scheduling and quality at the processing branches, with people acting at the same moment.
export default async function run(c) {
  const { S, G11, branch, P, lot, order, all, statuses, count, inv, n, prisma, ok2, err, E, TIERS } = c;
  const G = G11.shop;
  /** An order with reserved stock and a job routed in two steps. */
  async function shopJob(b, qty = 600) {
    const l = await lot(b, qty + 400); const o = await order(b, l, qty);
    await P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty });
    const sch = P.scheduler(b);
    const j = await sch.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, operationType: E.WC_TYPE, instructions: 'P11 scenario', status: 'ORDERED' });
    if (j.status !== 201) throw new Error(`job ${j.status} ${err(j)}`);
    const plan = await sch.post(`/api/jobs/${j.body.id}/plan`, { operations: [{ workCenterType: E.WC_TYPE, name: 'Saw' }, { workCenterType: E.WC_TYPE, name: 'Deburr' }] });
    if (plan.status !== 200) throw new Error(`plan ${plan.status} ${err(plan)}`);
    return { lot: l, order: o, id: j.body.id, number: j.body.jobNumber, ops: plan.body.operations, qty };
  }
  const start = (b, op, i = 0) => P.operator(b).post(`/api/v1/operations/${op.id}/start`, { operatorId: b.operators[i % b.operators.length].id, workCenterId: b.machines[i % b.machines.length].id });
  const done = (b, op) => P.operator(b).post(`/api/v1/operations/${op.id}/complete`, {});
  async function runOps(b, j) { for (const op of j.ops) { const a = await start(b, op); const d = await done(b, op); if (a.status !== 200 || d.status !== 200) throw new Error(`step ${a.status} ${err(a)} / ${d.status} ${err(d)}`); } }
  const jobRow = (id) => prisma.job.findUnique({ where: { id } });
  const opRow = (id) => prisma.dispatchOperation.findUnique({ where: { id } });
  const logs = (id) => prisma.dispatchTimeLog.findMany({ where: { dispatchOperationId: id } });
  async function coilWo(b) {
    const l = await lot(b, 3000); l.gone = true; l.free = 0;
    const wo = await P.scheduler(b).post('/api/work-orders', { woType: 'SLIT', sourceCoilId: l.coilId, priority: 3, notes: 'P11 scenario slit' });
    if (wo.status !== 201) throw new Error(`work order ${wo.status} ${err(wo)}`);
    const rel = await P.scheduler(b).put(`/api/work-orders/${wo.body.id}/release`, {});
    if (!ok2(rel)) throw new Error(`release ${rel.status} ${err(rel)}`);
    return { lot: l, id: wo.body.id };
  }

  const where = [['LARGE', 0], ['LARGE', 3], ['MEDIUM', 0], ['MEDIUM', 7]];
  for (const [tier, i] of where) {
    const b = await branch(tier, i); const at = `${TIERS[tier].label} ${b.code}`;

    await S(G, `${at}: two operators start the same step at the same moment`, { expect: 'the step is started once', db: 'one open clock on the step' }, async (ok) => {
      const j = await shopJob(b);
      const rs = await all(2, (x) => start(b, j.ops[0], x));
      ok('one start went through', count(rs, 200) >= 1 && !rs.some((r) => r.status >= 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 400) || {})}`);
      const open = (await logs(j.ops[0].id)).filter((t) => !t.endAt);
      ok('one clock is running on the step, not two', open.length === 1, open.length);
      await done(b, j.ops[0]);
    });

    await S(G, `${at}: a step is finished four times at the same moment`, { expect: 'finished once; the clock is closed once', db: 'DispatchOperation complete, no open clock' }, async (ok) => {
      const j = await shopJob(b); await start(b, j.ops[0]);
      const rs = await all(4, () => done(b, j.ops[0]));
      ok('no server error', !rs.some((r) => r.status >= 500), statuses(rs));
      ok('one finish went through', count(rs, 200) >= 1, statuses(rs));
      const op = await opRow(j.ops[0].id); const t = await logs(j.ops[0].id);
      ok('the step is finished', /COMPLETE|DONE/.test(String(op.status)), op.status);
      ok('one clock, closed', t.length === 1 && t[0].endAt, JSON.stringify(t.map((x) => [x.startAt, x.endAt])));
    });

    await S(G, `${at}: a step that was never started is marked finished`, { expect: 'refused; the step stays as it was', db: 'DispatchOperation unchanged' }, async (ok) => {
      const j = await shopJob(b); const before = (await opRow(j.ops[1].id)).status;
      const r = await done(b, j.ops[1]);
      ok('refused, not a server error', r.status >= 400 && r.status < 500, `${r.status} ${err(r)}`);
      ok('the step did not move', (await opRow(j.ops[1].id)).status === before);
    });

    await S(G, `${at}: two inspectors open the inspection of one job at the same moment`, { expect: 'one open inspection', db: 'one JobInspection in progress for the job' }, async (ok) => {
      const j = await shopJob(b); await runOps(b, j);
      const rs = await all(2, () => P.qc(b).post('/api/qc/inspections', { jobId: j.id }));
      ok('no server error', !rs.some((r) => r.status >= 500), statuses(rs));
      const open = await prisma.jobInspection.findMany({ where: { jobId: j.id, status: { notIn: ['PASSED', 'FAILED', 'CANCELLED'] } } });
      ok('one inspection is open, not two', open.length === 1, `${open.length}; answers ${statuses(rs)}`);
    });

    await S(G, `${at}: an inspection is passed three times at the same moment`, { expect: 'passed once; the job moves to packaging once', db: 'JobInspection PASSED; one move of the job to PACKAGING', audit: 'one JOB_STATUS_CHANGED to PACKAGING' }, async (ok) => {
      const j = await shopJob(b); await runOps(b, j);
      const made = await P.qc(b).post('/api/qc/inspections', { jobId: j.id }); const sheet = made.body.data;
      const rs = await all(3, () => P.qc(b).post(`/api/qc/inspections/${sheet.id}/pass`, { checklist: (sheet.checklist || []).map((x) => ({ ...x, result: 'PASS' })) }));
      ok('one pass went through and none is a server error', count(rs, 200) >= 1 && !rs.some((r) => r.status >= 500), statuses(rs));
      ok('the inspection is passed', (await prisma.jobInspection.findUnique({ where: { id: sheet.id } })).status === 'PASSED');
      const moves = (await prisma.auditLog.findMany({ where: { resourceType: 'Job', resourceId: j.id, eventType: 'JOB_STATUS_CHANGED' } })).filter((a) => a.details?.to === 'PACKAGING');
      ok('the job went to packaging once', (await jobRow(j.id)).status === 'PACKAGING' && moves.length === 1, `${(await jobRow(j.id)).status}, ${moves.length} moves`);
    });

    await S(G, `${at}: the dock tries to ship a job that has not been inspected`, { expect: 'the shipment is refused and names the job', biz: 'nothing leaves before quality has passed it', db: 'Shipment still on the dock, stock still on hand' }, async (ok) => {
      const j = await shopJob(b); await runOps(b, j);
      const who = P.shipper(b);
      const s = await who.post('/api/shipments', { orderId: j.order.id, fromLocationId: b.id, carrierName: 'Own Truck', items: [{ orderLineId: j.order.lines[0].id, qtyShipped: j.qty, weightLb: j.qty }] });
      const d = s.status === 201 ? await who.put(`/api/shipments/${s.body.id}/dispatch`, {}) : s;
      ok('refused with 409', d.status === 409, `${s.status} ${d.status} ${err(d)}`);
      ok('the answer names the job', new RegExp(j.number).test(err(d)), err(d));
      ok('the stock has not left', n((await inv(j.lot.coilId)).qtyOnHand) === j.qty + 400);
    });

    await S(G, `${at}: the schedule is run three times at the same moment`, { expect: 'the runs take turns; the plan is one plan', db: 'each waiting step is placed once' }, async (ok) => {
      await shopJob(b); await shopJob(b);
      const rs = await all(3, () => P.scheduler(b).post('/api/v1/dispatch/run', { locationId: b.id }));
      ok('every run answered and none is a server error', rs.every((r) => r.status < 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 500) || {})}`);
      ok('at least one run completed', rs.some((r) => ok2(r)), statuses(rs));
      const dup = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM (SELECT o."dispatchJobId" FROM "DispatchOperation" o JOIN "DispatchJob" j ON j.id = o."dispatchJobId" JOIN "Job" jb ON jb.id = j."jobId" JOIN "Order" ord ON ord.id = jb."orderId" WHERE ord."locationId" = '${b.id}' GROUP BY o."dispatchJobId", o.sequence HAVING count(*) > 1) x`);
      ok('no step of any job at the branch exists twice', dup[0].n === 0, dup[0].n);
    });

    await S(G, `${at}: a coil work order is started three times at the same moment`, { expect: 'started once; the material is issued once', db: 'WorkOrder IN_PROGRESS; one issue of the source item', fin: 'the material moves to work in progress once' }, async (ok) => {
      const w = await coilWo(b);
      const rs = await all(3, () => P.operator(b).put(`/api/work-orders/${w.id}/start`, {}));
      ok('one start, no server error', count(rs, 200) === 1 && !rs.some((r) => r.status >= 500), statuses(rs));
      ok('the work order is in progress', (await prisma.workOrder.findUnique({ where: { id: w.id } })).status === 'IN_PROGRESS');
      const ev = await prisma.ledgerEvent.findMany({ where: { sourceType: 'WorkOrder', sourceId: w.id } });
      ok('nothing about it is posted twice', new Set(ev.map((e) => e.eventKind)).size === ev.length, ev.map((e) => e.eventKind).join(','));
    });

    await S(G, `${at}: a coil work order is completed three times at the same moment`, { expect: 'completed once; the pieces are made once and the weight adds up', db: 'two output items, source used up; 1485 + 1485 + 30 scrap = 3000', fin: 'work in progress is cleared once' }, async (ok) => {
      const w = await coilWo(b); await P.operator(b).put(`/api/work-orders/${w.id}/start`, {});
      const rs = await all(3, () => P.operator(b).put(`/api/work-orders/${w.id}/complete`, { scrapWeightLb: 30, outputs: [{ weightLb: 1485, widthIn: 24 }, { weightLb: 1485, widthIn: 24 }] }));
      ok('one completion, no server error', count(rs, 200) === 1 && !rs.some((r) => r.status >= 500), statuses(rs));
      const outs = await prisma.workOrderOutput.findMany({ where: { workOrderId: w.id } });
      ok('two pieces were made, not six', outs.length === 2, outs.length);
      const kids = await prisma.coil.findMany({ where: { parentCoilId: w.lot.coilId }, include: { inventory: true } });
      ok('the pieces weigh 2,970 lb together', n(kids.reduce((s, k) => s + n(k.inventory?.qtyOnHand), 0)) === 2970, kids.map((k) => k.inventory?.qtyOnHand).join('+'));
      ok('nothing is left on the source item', n((await inv(w.lot.coilId)).qtyOnHand) === 0, (await inv(w.lot.coilId)).qtyOnHand);
    });

    await S(G, `${at}: a finished job is traced from the customer's invoice back to the heat`, { expect: 'invoice, shipment, job, inspection, stock item, heat and purchase order all link up', audit: 'the inspection, the movements and the status history of the job' }, async (ok) => {
      const j = await shopJob(b); await runOps(b, j);
      const made = await P.qc(b).post('/api/qc/inspections', { jobId: j.id }); const sheet = made.body.data;
      await P.qc(b).post(`/api/qc/inspections/${sheet.id}/pass`, { checklist: (sheet.checklist || []).map((x) => ({ ...x, result: 'PASS' })) });
      await P.shipper(b).post(`/api/jobs/${j.id}/status`, { status: 'READY_TO_SHIP' });
      const s = await P.shipper(b).post('/api/shipments', { orderId: j.order.id, fromLocationId: b.id, carrierName: 'Own Truck', items: [{ orderLineId: j.order.lines[0].id, qtyShipped: j.qty, weightLb: j.qty }] });
      const d = await P.shipper(b).put(`/api/shipments/${s.body.id}/dispatch`, {});
      ok('shipped and billed', d.status === 200 && d.body.invoice?.id, `${d.status} ${err(d)}`);
      const move = await prisma.materialMovement.findFirst({ where: { shipmentId: s.body.id, movementType: 'SHIP' } });
      const coil = move ? await prisma.coil.findUnique({ where: { id: move.coilId }, include: { heat: { include: { grade: true } } } }) : null;
      ok('the shipment took the job\'s own stock item', move?.coilId === j.lot.coilId);
      ok('the stock item carries its heat and grade', coil?.heat?.heatNumber === E.heats[j.lot.grade].heatNumber && coil.heat.grade.code === j.lot.grade, coil?.heat?.heatNumber);
      ok('the stock item came in on a purchase order from a named supplier', !!(await prisma.order.findUnique({ where: { id: j.lot.poId } }))?.sellerId);
      ok('the job has a passed inspection', (await prisma.jobInspection.count({ where: { jobId: j.id, status: 'PASSED' } })) === 1);
      const inv1 = await prisma.invoice.findUnique({ where: { id: d.body.invoice.id }, include: { lines: true } });
      ok('the invoice bills the job\'s order line', inv1.orderId === j.order.id && inv1.lines[0].orderLineId === j.order.lines[0].id && n(inv1.lines[0].quantity) === j.qty);
    });
  }
}
