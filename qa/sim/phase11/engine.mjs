// Phase 11: the workload engine. It plays the people of the synthetic enterprise through the real server:
// every step is a request made by a signed-in person of the role that does that work at that branch, timed
// by a clock, and counted. A "transaction" is one business operation that changes records (an order placed,
// a receipt, a reservation, a dispatch, a payment). A request that failed is counted as failed and never as
// completed; a read is never counted as a transaction. At the end each completed transaction is looked up in
// the database (and in the books where it posts) and only then counted as reconciled.
import * as ctx from '../phase10/ctx.mjs';
import { TIERS, COST_OF, PRICE_OF, signIn } from './model.mjs';

const { prisma, ok2, err, tag, sleep } = ctx;

export const CATEGORIES = {
  sales: 'Sales, quotes and orders',
  purchasing: 'Purchasing and receiving',
  inventory: 'Inventory reservations and movements',
  shop: 'Manufacturing and processing',
  shipping: 'Shipping and logistics',
  money: 'Invoicing, payments and credits',
  ledger: 'Ledger postings and reconciliation operations',
  moves: 'Transfers, returns and adjustments',
  channels: 'Ecommerce, POS and customer portal',
};
export const MINIMUMS = { sales: 300, purchasing: 250, inventory: 300, shop: 300, shipping: 250, money: 200, ledger: 200, moves: 150, channels: 50 };
export const JOB_TYPES = { A: 'Stock sale', B: 'Processed-material sale', C: 'Ecommerce order', D: 'Counter (POS) sale', E: 'Partial shipment', F: 'Return and credit' };

export class StepFailed extends Error {
  constructor(kind, r) { super(`${kind}: ${r.status} ${err(r).slice(0, 200)}`); this.kind = kind; this.status = r.status; }
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)].toFixed(1) : null; };
export const summary = (a) => ({ requests: a.length, p50: pct(a, 50), p95: pct(a, 95), p99: pct(a, 99), max: a.length ? +Math.max(...a).toFixed(1) : null, mean: a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null });
export async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); }

export function makeEngine(E, { probe = false, rnd } = {}) {
  const lat = {}; const reads = {}; const latByLevel = {};
  const tx = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, { attempted: 0, completed: 0, failed: 0, retried: 0, recovered: 0, reconciled: 0, kinds: {} }]));
  const log = [];           // completed transactions: { cat, kind, ref, job }
  const failures = [];      // { kind, status, error, job, branch }
  const statuses = {};      // http status -> count
  const instances = {};     // server copy -> requests answered
  const gauge = { inflight: 0, peak: 0, requests: 0, level: 0, byLevel: {} };

  async function send(who, method, url, body, headers) {
    gauge.inflight += 1; gauge.peak = Math.max(gauge.peak, gauge.inflight); gauge.requests += 1;
    const L = (gauge.byLevel[gauge.level] ||= { requests: 0, peakInFlight: 0, ms: [] });
    L.requests += 1; L.peakInFlight = Math.max(L.peakInFlight, gauge.inflight);
    const t = performance.now();
    let r;
    try { r = await who.call(method, url, body, headers); } catch (e) { r = { status: 0, body: { error: `no answer: ${String(e?.cause?.code || e?.name || e?.message).slice(0, 80)}` }, headers: null }; }
    const ms = performance.now() - t;
    L.ms.push(ms);
    gauge.inflight -= 1;
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    const inst = r.headers?.get?.('x-qa-instance'); if (inst) instances[inst] = (instances[inst] || 0) + 1;
    return { r, ms, inst };
  }
  const BUSY = /try again|busy|serializ|deadlock|another request|shortly|just changed|stopped before it answered/i;

  /**
   * One step of a job. `cat` makes it a counted transaction. A "busy, try again" answer is sent again up to
   * four times, as the screens do, and each resend is counted. Throws StepFailed when the answer is not `expect`.
   */
  async function act(job, { cat, kind, who, m = 'POST', url, body, headers, expect = ok2, ref, soft = false }) {
    if (!who?.call) throw new Error(`${kind}: nobody of that role is signed in at ${job.branch}`);
    let retries = 0; let out;
    for (;;) {
      out = await send(who, m, url, body, headers);
      const busy = [409, 503, 500, 502, 0].includes(out.r.status) && BUSY.test(err(out.r)) && !expect(out.r);
      if (busy && retries < 4) { retries += 1; await sleep(40 * retries + Math.random() * 60); continue; }
      break;
    }
    const { r, ms, inst } = out;
    const good = !!expect(r);
    (lat[kind] ||= []).push(ms); ((latByLevel[gauge.level] ||= {})[kind] ||= []).push(ms);
    job.steps.push({ step: kind, role: who.role, status: r.status, ms: +ms.toFixed(1), ...(retries && { retries }), ...(inst && { copy: Number(inst) }), ...(!good && { error: err(r).slice(0, 160) }) });
    if (probe) console.log(`   ${good ? '·' : '✗'} ${job.type} ${kind} [${who.role}] ${r.status} ${good ? JSON.stringify(r.body).slice(0, 150) : err(r).slice(0, 200)}`);
    if (cat) {
      const T = tx[cat]; const K = (T.kinds[kind] ||= { attempted: 0, completed: 0, failed: 0 });
      T.attempted += 1; K.attempted += 1; T.retried += retries;
      if (good) { T.completed += 1; K.completed += 1; if (retries) T.recovered += 1; const entry = { cat, kind, job: job.id, ref: ref ? ref(r) : null }; log.push(entry); r.entry = entry; } else { T.failed += 1; K.failed += 1; }
    }
    if (!good) { failures.push({ kind, status: r.status, error: err(r).slice(0, 200), job: job.id, branch: job.branch, role: who.role }); if (!soft) throw new StepFailed(kind, r); }
    return r;
  }
  /** A timed read by a person (a screen being opened). Never a transaction. */
  async function read(name, who, url) {
    const { r, ms } = await send(who, 'GET', url);
    (reads[name] ||= []).push(ms);
    if (!ok2(r)) failures.push({ kind: `read: ${name}`, status: r.status, error: err(r).slice(0, 200), role: who.role });
    return r;
  }

  // ── who does what at a branch ──────────────────────────────────────────────────────────────
  let rr = 0;
  const of = (b, ...roles) => { for (const role of roles) { const list = (b.staff[role] || []).filter((p) => p.call); if (list.length) return list[(rr++) % list.length]; } return null; };
  const P = {
    seller: (b) => of(b, 'SALES_REP', 'CSR'), csr: (b) => of(b, 'CSR', 'SALES_REP'), estimator: (b) => of(b, 'ESTIMATOR', 'SALES_REP'),
    buyer: (b) => of(b, 'BUYER', 'INVENTORY_MANAGER'), receiver: (b) => of(b, 'RECEIVING_CLERK', 'INVENTORY_MANAGER'), stock: (b) => of(b, 'INVENTORY_MANAGER', 'RECEIVING_CLERK'),
    scheduler: (b) => of(b, 'SCHEDULER'), operator: (b) => of(b, 'OPERATOR_SAW'), qc: (b) => of(b, 'QC_INSPECTOR'),
    shipper: (b) => of(b, 'SHIPPING_COORDINATOR'), manager: (b) => of(b, 'BRANCH_MANAGER'),
    cfo: (i = 0) => E.hq.CFO[i % E.hq.CFO.length], exec: (i = 0) => E.hq.EXECUTIVE[i % E.hq.EXECUTIVE.length],
  };

  // ── stock ──────────────────────────────────────────────────────────────────────────────────
  const dims = (grade, i) => ({ thicknessIn: [0.25, 0.375, 0.5, 0.75, 1][i % 5], widthIn: [48, 60, 72][i % 3], lengthIn: [96, 120, 144][i % 3] });
  /** A purchase order placed by the branch's buyer and received by its receiving clerk: two transactions. */
  async function receiveLot(job, b, grade, weightLb) {
    const supplier = E.suppliers[(b.n + b.lots.length) % E.suppliers.length];
    const heat = E.heats[grade]; const cost = COST_OF[grade] ?? 0.4; const d = dims(grade, b.lots.length);
    const line = { gradeId: heat.gradeId, description: `P11 ${grade} ${E.FORM_OF[grade] || 'PLATE'}`, ...d, qtyOrdered: weightLb, unit: 'LB', unitPrice: cost, priceUnit: 'LB', extendedPrice: +(weightLb * cost).toFixed(2) };
    const po = await act(job, { kind: 'purchase order written', who: P.buyer(b), url: '/api/purchase-orders', body: { sellerId: supplier.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, locationId: b.id, lines: [line] }, expect: (r) => r.status === 201 });
    await act(job, { cat: 'purchasing', kind: 'purchase order placed', who: P.buyer(b), m: 'PUT', url: `/api/purchase-orders/${po.body.id}`, body: { status: 'CONFIRMED' }, ref: () => po.body.id });
    const poLineId = po.body.lines?.[0]?.id || (await prisma.orderLine.findFirst({ where: { orderId: po.body.id } })).id;
    const rc = await act(job, { cat: 'purchasing', kind: 'goods received', who: P.receiver(b), url: '/api/inventory/receipts', body: { coilNumber: tag('P11'), form: E.FORM_OF[grade] === 'SHEET' ? 'SHEET' : 'PLATE', heatNumber: heat.heatNumber, gradeCode: grade, ...d, weightLb, locationId: b.id, poLineId }, expect: (r) => r.status === 201 && r.body?.item?.id, ref: (r) => r.body.item.id });
    const lot = { coilId: rc.body.item.id, grade, free: weightLb, cost, branch: b.code, poId: po.body.id, supplier: supplier.code };
    b.lots.push(lot);
    job.ids.purchaseOrders = [...(job.ids.purchaseOrders || []), po.body.id]; job.ids.lots = [...(job.ids.lots || []), lot.coilId];
    return lot;
  }
  /** A lot at the branch with `qty` free, set aside for this job in the engine's own book so two jobs never plan on the same pounds. Buys more when the branch is short. */
  async function lotFor(job, b, qty, grade) {
    const g = grade || b.grades[rnd.int(0, b.grades.length - 1)];
    let lot = b.lots.find((l) => l.grade === g && l.free >= qty && !l.gone);
    if (!lot) lot = await receiveLot(job, b, g, Math.max(TIERS[b.tier].lotLb || 15000, qty * 4));
    lot.free -= qty;
    return lot;
  }

  // ── the steps the six kinds of job share ───────────────────────────────────────────────────
  const orderLines = async (who, orderId, given) => given?.lines?.length ? given.lines : (await prisma.orderLine.findMany({ where: { orderId }, orderBy: { lineNumber: 'asc' } }));
  async function placeOrder(job, b, customer, grade, qty, price) {
    const heat = E.heats[grade];
    const line = { gradeId: heat.gradeId, description: `P11 ${grade} cut stock`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: +(qty * price).toFixed(2) };
    const who = P.seller(b);
    const o = await act(job, { kind: 'order written', who, url: '/api/orders', body: { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, poReference: tag('P11PO'), locationId: b.id, lines: [line] }, expect: (r) => r.status === 201 });
    await act(job, { cat: 'sales', kind: 'order confirmed', who, m: 'PUT', url: `/api/orders/${o.body.id}`, body: { status: 'CONFIRMED' }, expect: (r) => ok2(r) && r.body?.status === 'CONFIRMED', ref: () => o.body.id });
    job.ids.order = o.body.id; job.ids.orderNumber = o.body.orderNumber;
    return { id: o.body.id, lines: await orderLines(who, o.body.id, o.body) };
  }
  const reserve = (job, b, order, line, lot, qty) => act(job, { cat: 'inventory', kind: 'stock reserved', who: P.stock(b), url: `/api/orders/${order.id}/allocate`, body: { lineId: line.id, coilId: lot.coilId, qty }, ref: () => `${line.id}|${lot.coilId}` });
  /** A shipment made, dispatched (which bills it) and delivered. Returns the invoice the dispatch raised. */
  async function ship(job, b, order, line, qty, { deliver = true } = {}) {
    const who = P.shipper(b) || P.stock(b);
    const s = await act(job, { kind: 'shipment put together', who, url: '/api/shipments', body: { orderId: order.id, fromLocationId: b.id, carrierName: ['Own Truck', 'P11 Synthetic Freight', 'Customer pickup'][job.n % 3], items: [{ orderLineId: line.id, qtyShipped: qty, weightLb: qty }] }, expect: (r) => r.status === 201 });
    // Only this job dispatches this shipment. When the answer to the dispatch was lost (the server copy died
    // after saving it) the dock sends it again and is told "already IN_TRANSIT": the truck did leave, once.
    // The database check of every counted transaction still reads the shipment back, and the missing
    // invoice is raised below by the product's own recovery and counted as one.
    const dispatched = (r) => r.status === 200 || (r.status === 409 && /already IN_TRANSIT/.test(err(r)));
    const d = await act(job, { cat: 'shipping', kind: 'shipment dispatched', who, m: 'PUT', url: `/api/shipments/${s.body.id}/dispatch`, body: {}, expect: dispatched, ref: () => s.body.id });
    (job.ids.shipments ||= []).push(s.body.id);
    let invoice = d.body?.invoice || null;
    // The dispatch answer names the invoice; the amounts are read the way the invoice screen reads them.
    if (invoice && invoice.totalAmount == null) invoice = (await act(job, { kind: 'invoice opened', who: P.csr(b) || P.manager(b), m: 'GET', url: `/api/invoices/${invoice.id}`, expect: (r) => r.status === 200 && r.body?.totalAmount != null })).body;
    if (!invoice) {
      // Dispatch and billing are two saves (H-006). When the second did not happen, billing the shipment
      // again is the product's own recovery; it is counted as a recovery, not hidden.
      const again = await act(job, { kind: 'invoice raised after dispatch', who: P.csr(b) || P.manager(b), url: '/api/invoices', body: { shipmentId: s.body.id }, expect: (r) => r.status === 201 && r.body?.id });
      invoice = again.body; job.recovered = (job.recovered || 0) + 1;
    }
    tx.money.attempted += 1; tx.money.completed += 1; ((tx.money.kinds['invoice raised'] ||= { attempted: 0, completed: 0, failed: 0 })).attempted += 1; tx.money.kinds['invoice raised'].completed += 1;
    log.push({ cat: 'money', kind: 'invoice raised', job: job.id, ref: invoice.id });
    (job.ids.invoices ||= []).push(invoice.id); (job.invoices ||= []).push({ id: invoice.id, number: invoice.invoiceNumber, total: Number(invoice.totalAmount) });
    if (deliver) await act(job, { cat: 'shipping', kind: 'shipment delivered', who, m: 'PUT', url: `/api/shipments/${s.body.id}/deliver`, body: { podSignature: 'P11 Synthetic Receiver' }, expect: (r) => r.status === 200, ref: () => s.body.id });
    return invoice;
  }
  async function takePayment(job, b, invoice, amount, method = 'CHECK') {
    const r = await act(job, { cat: 'money', kind: 'payment taken', who: P.csr(b) || P.manager(b), url: `/api/invoices/${invoice.id}/payments`, body: { amount, paymentMethod: method, referenceNumber: tag('P11PAY') }, expect: (x) => x.status === 201, ref: () => invoice.id });
    (job.payments ||= []).push({ invoice: invoice.id, amount });
    return r;
  }
  /** Pays the invoice the way the job's number says: most in full, some in two parts, some left owing. */
  async function settle(job, b, invoice) {
    const total = Number(invoice.totalAmount); const k = job.n % 10;
    if (k === 9) { job.leftOwing = +(job.leftOwing || 0) + total; return; }
    if (k === 8) { const half = +(total / 2).toFixed(2); await takePayment(job, b, invoice, half, 'ACH'); await takePayment(job, b, invoice, +(total - half).toFixed(2), 'ACH'); return; }
    await takePayment(job, b, invoice, total, k % 2 ? 'CHECK' : 'ACH');
  }

  // ── A: stock sale ──────────────────────────────────────────────────────────────────────────
  async function stockSale(job, b, { qty, grade, customer, pay = true } = {}) {
    const g = grade || b.grades[rnd.int(0, b.grades.length - 1)]; const q = qty || rnd.int(4, 30) * 100;
    const lot = await lotFor(job, b, q, g);
    const order = await placeOrder(job, b, customer, g, q, PRICE_OF[g] ?? 0.65);
    await reserve(job, b, order, order.lines[0], lot, q);
    const invoice = await ship(job, b, order, order.lines[0], q);
    if (pay) await settle(job, b, invoice);
    return { order, lot, invoice, qty: q };
  }

  // ── B: processed-material sale ─────────────────────────────────────────────────────────────
  async function processedSale(job, b, { customer }) {
    const g = b.grades[rnd.int(0, b.grades.length - 1)]; const q = rnd.int(5, 25) * 100; const heat = E.heats[g];
    const est = P.estimator(b);
    const rfq = await act(job, { cat: 'sales', kind: 'request for quote entered', who: est, url: '/api/rfqs', body: { customerId: customer.id, requestedDate: new Date(Date.now() + 14 * 864e5).toISOString(), lines: [{ description: `P11 ${g} cut to size`, requestedQty: q, unit: 'LB', gradeId: heat.gradeId, grade: g, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, finish: 'Mill', certRequirements: ['MTR'], processing: 'Saw to length', specNotes: 'P11 synthetic' }] }, expect: (r) => r.status === 201, ref: (r) => r.body.id });
    const quote = await act(job, { cat: 'sales', kind: 'quote priced', who: est, url: `/api/rfqs/${rfq.body.id}/quotes`, body: { lines: [{ rfqLineId: rfq.body.lines[0].id, unitPrice: +(100 * (PRICE_OF[g] ?? 0.65) * 1.25).toFixed(2), priceUnit: 'CWT' }] }, expect: (r) => r.status === 201, ref: (r) => r.body.id });
    await act(job, { kind: 'quote sent', who: est, url: `/api/quotes/${quote.body.id}/send`, body: {} });
    const acc = await act(job, { cat: 'sales', kind: 'quote accepted into an order', who: P.csr(b), url: `/api/quotes/${quote.body.id}/accept`, body: { poReference: tag('P11PO') }, expect: (r) => r.status === 201 && r.body?.order?.id, ref: (r) => r.body.order.id });
    const order = { id: acc.body.order.id }; job.ids.order = order.id; job.ids.rfq = rfq.body.id; job.ids.quote = quote.body.id; job.ids.orderNumber = acc.body.order.orderNumber;
    let row = await prisma.order.findUnique({ where: { id: order.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    if (row.status !== 'CONFIRMED') await act(job, { kind: 'order confirmed', who: P.csr(b), m: 'PUT', url: `/api/orders/${order.id}`, body: { status: 'CONFIRMED' }, expect: (r) => ok2(r) && r.body?.status === 'CONFIRMED' });
    order.lines = row.lines; const line = row.lines[0]; const lineQty = Number(line.qtyOrdered);
    const lot = await lotFor(job, b, lineQty, g);
    await reserve(job, b, order, line, lot, lineQty);
    const sch = P.scheduler(b);
    const j = await act(job, { kind: 'job opened', who: sch, url: '/api/jobs', body: { orderId: order.id, orderLineId: line.id, operationType: E.WC_TYPE, instructions: 'P11 synthetic: saw to length, deburr', status: 'ORDERED' }, expect: (r) => r.status === 201 });
    job.ids.job = j.body.id;
    const plan = await act(job, { cat: 'shop', kind: 'job routed and scheduled', who: sch, url: `/api/jobs/${j.body.id}/plan`, body: { operations: [{ workCenterType: E.WC_TYPE, name: 'Saw to length' }, { workCenterType: E.WC_TYPE, name: 'Deburr and stack' }] }, expect: (r) => r.status === 200 && r.body?.operations?.length === 2, ref: () => j.body.id });
    const opr = P.operator(b); const person = b.operators[job.n % b.operators.length]; const wc = b.machines[job.n % b.machines.length];
    for (const op of plan.body.operations) {
      await act(job, { kind: 'step started', who: opr, url: `/api/v1/operations/${op.id}/start`, body: { operatorId: person.id, workCenterId: wc.id }, expect: (r) => r.status === 200 });
      await act(job, { cat: 'shop', kind: 'step finished', who: opr, url: `/api/v1/operations/${op.id}/complete`, body: {}, expect: (r) => r.status === 200, ref: () => op.id });
    }
    const qc = P.qc(b);
    const insp = await act(job, { kind: 'inspection opened', who: qc, url: '/api/qc/inspections', body: { jobId: j.body.id }, expect: (r) => r.status === 201 });
    const sheet = insp.body.data;
    await act(job, { cat: 'shop', kind: 'inspection passed', who: qc, url: `/api/qc/inspections/${sheet.id}/pass`, body: { checklist: (sheet.checklist || []).map((c) => ({ ...c, result: 'PASS' })) }, expect: (r) => r.status === 200, ref: () => sheet.id });
    job.ids.inspection = sheet.id;
    // A passed inspection puts the job in packaging; the dock marks it ready before the shipment can leave.
    await act(job, { cat: 'shop', kind: 'job packed and staged for shipping', who: P.shipper(b), url: `/api/jobs/${j.body.id}/status`, body: { status: 'READY_TO_SHIP' }, expect: (r) => ok2(r), ref: () => j.body.id });
    const invoice = await ship(job, b, order, line, lineQty);
    await settle(job, b, invoice);
    const cost = await act(job, { kind: 'job cost read', who: P.manager(b), m: 'GET', url: `/api/orders/${order.id}/cost`, expect: (r) => r.status === 200 });
    job.cost = { material: cost.body?.material ?? cost.body?.totals?.material ?? null, total: cost.body?.totalCost ?? cost.body?.totals?.cost ?? null, margin: cost.body?.margin ?? cost.body?.totals?.margin ?? null, keys: Object.keys(cost.body || {}).slice(0, 12) };
    return { order, lot, invoice };
  }

  // ── C: ecommerce order ─────────────────────────────────────────────────────────────────────
  async function webOrder(job, b) {
    const buyer = b.buyers[0]; const qty = 1 + (job.n % 4);
    const placed = await act(job, { cat: 'channels', kind: 'web order placed', who: buyer, url: '/api/ecom/checkout/submit', body: { items: [{ productId: E.each.id, quantity: qty, sku: E.each.sku }], deliveryMethod: 'PICKUP' }, headers: { 'Idempotency-Key': tag('P11WEB') }, expect: (r) => ok2(r) && r.body?.data?.id, ref: (r) => r.body.data.id });
    job.ids.onlineOrder = placed.body.data.id;
    const acc = await act(job, { cat: 'channels', kind: 'web order accepted into an order', who: P.csr(b), url: `/api/orders/online/${placed.body.data.id}/accept`, body: { locationId: b.id }, expect: (r) => r.status === 200 && r.body?.internalOrderId, ref: (r) => r.body.internalOrderId });
    job.ids.order = acc.body.internalOrderId; job.ids.orderNumber = acc.body.internalOrderNumber;
    const mine = await act(job, { kind: 'buyer sees the order in the portal', who: buyer, m: 'GET', url: '/api/ecom/my-orders', expect: (r) => r.status === 200 });
    job.portalShowsIt = JSON.stringify(mine.body).includes(placed.body.data.id) || JSON.stringify(mine.body).includes(String(acc.body.internalOrderNumber));
    return { order: { id: acc.body.internalOrderId } };
  }

  // ── D: counter sale ────────────────────────────────────────────────────────────────────────
  async function counterSale(job, b) {
    const qty = 1 + (job.n % 3); const id = tag('P11QS');
    const r = await act(job, { cat: 'channels', kind: 'counter sale paid', who: P.csr(b), url: '/api/pos/quick-sale/process-payment', body: { sale: { id, items: [{ productId: E.shelfProduct.id, quantity: qty }] }, payment: job.n % 2 ? { method: 'CASH', amountTendered: 100000 } : { method: 'CARD', reference: tag('P11APPR') } }, expect: (x) => x.status === 201 && x.body?.orderId, ref: (x) => x.body.orderId });
    job.ids.order = r.body.orderId; job.ids.orderNumber = r.body.orderNumber; job.ids.sale = id; job.receiptTotal = r.body.receipt?.total ?? null;
    return { order: { id: r.body.orderId } };
  }

  // ── E: partial shipment ────────────────────────────────────────────────────────────────────
  async function partialShipment(job, b, { customer }) {
    const g = b.grades[rnd.int(0, b.grades.length - 1)]; const q = rnd.int(10, 30) * 100; const first = Math.round(q * 0.6 / 100) * 100;
    const lot = await lotFor(job, b, q, g);
    const order = await placeOrder(job, b, customer, g, q, PRICE_OF[g] ?? 0.65);
    await reserve(job, b, order, order.lines[0], lot, q);
    const inv1 = await ship(job, b, order, order.lines[0], first);
    job.backorder = { shippedFirst: first, left: q - first };
    const inv2 = await ship(job, b, order, order.lines[0], q - first);
    await settle(job, b, inv1); await settle(job, b, inv2);
    return { order, lot };
  }

  // ── F: return and credit ───────────────────────────────────────────────────────────────────
  async function returnAndCredit(job, b, { customer }) {
    const sale = await stockSale(job, b, { customer, pay: false });
    await takePayment(job, b, sale.invoice, Number(sale.invoice.totalAmount));
    const back = Math.max(100, Math.round(sale.qty * 0.25 / 100) * 100);
    const ret = await act(job, { kind: 'return opened', who: P.csr(b), url: '/api/returns', body: { orderId: sale.order.id, reason: 'P11 synthetic: wrong size sent', lines: [{ orderLineId: sale.order.lines[0].id, quantity: back, disposition: job.n % 3 === 0 ? 'SCRAP' : 'RESTOCK', coilId: sale.lot.coilId }] }, expect: (r) => r.status === 201 });
    job.ids.return = ret.body.id;
    const got = await act(job, { cat: 'moves', kind: 'return received and credited', who: P.receiver(b) || P.stock(b), url: `/api/returns/${ret.body.id}/receive`, body: {}, expect: (r) => r.status === 200, ref: () => ret.body.id });
    if (job.n % 3 !== 0) sale.lot.free += back;
    const credit = await prisma.invoice.findFirst({ where: { kind: 'CREDIT', creditOfInvoiceId: sale.invoice.id, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' } });
    job.credit = credit ? { id: credit.id, number: credit.invoiceNumber, total: Number(credit.totalAmount) } : { missing: true, answer: JSON.stringify(got.body).slice(0, 160) };
    if (credit) {
      tx.money.attempted += 1; tx.money.completed += 1; ((tx.money.kinds['credit memo issued'] ||= { attempted: 0, completed: 0, failed: 0 })).attempted += 1; tx.money.kinds['credit memo issued'].completed += 1;
      log.push({ cat: 'money', kind: 'credit memo issued', job: job.id, ref: credit.id });
      job.ids.credit = credit.id;
      // The invoice was paid in full, so the credit is money owed back: the manager refunds it.
      const owed = +Math.abs(Number(credit.totalAmount) - Number(credit.paidAmount)).toFixed(2);
      if (owed > 0) await act(job, { cat: 'money', kind: 'refund paid', who: P.manager(b), url: `/api/invoices/${credit.id}/refund`, body: { amount: owed, paymentMethod: 'CHECK', referenceNumber: tag('P11RF') }, expect: (r) => r.status === 201, ref: () => credit.id });
    }
    return sale;
  }

  // ── work that is not a customer job ────────────────────────────────────────────────────────
  async function transferBetween(job, from, to) {
    const g = from.grades[0];
    const lot = await receiveLot(job, from, g, 2000 + 100 * (job.n % 10)); lot.gone = true; lot.free = 0;
    const t = await act(job, { cat: 'moves', kind: 'transfer sent', who: P.stock(from), url: '/api/inventory/transfers', body: { toLocationId: to.id, coilIds: [lot.coilId], carrier: 'Own truck' }, ref: (r) => r.body.id || r.body.transfer?.id });
    const id = t.body.id || t.body.transfer?.id; job.ids.transfer = id;
    await act(job, { cat: 'moves', kind: 'transfer received', who: P.receiver(to) || P.stock(to), url: `/api/inventory/transfers/${id}/receive`, body: {}, ref: () => id });
    to.lots.push({ coilId: lot.coilId, grade: g, free: to.grades.includes(g) ? (2000 + 100 * (job.n % 10)) : 0, cost: lot.cost, branch: to.code, cameFrom: from.code });
  }
  async function countAdjustment(job, b) {
    const lot = b.lots.find((l) => l.free >= 200 && !l.gone) || await receiveLot(job, b, b.grades[0], 5000);
    const change = -(10 + (job.n % 4) * 5); lot.free += change;
    await act(job, { cat: 'moves', kind: 'stock count adjusted', who: P.manager(b) || P.stock(b), url: '/api/inventory/adjust', body: { coilId: lot.coilId, notes: 'P11 synthetic cycle count', reason: 'DAMAGE', change }, ref: () => lot.coilId });
    job.ids.lots = [...(job.ids.lots || []), lot.coilId];
  }
  async function coilWorkOrder(job, b) {
    const lot = await receiveLot(job, b, b.grades[0], 3000); lot.gone = true; lot.free = 0;
    const who = P.scheduler(b);
    const wo = await act(job, { kind: 'work order written', who, url: '/api/work-orders', body: { woType: 'SLIT', sourceCoilId: lot.coilId, priority: 3, notes: 'P11 synthetic slit' }, expect: (r) => r.status === 201 });
    job.ids.workOrder = wo.body.id;
    await act(job, { kind: 'work order released', who, m: 'PUT', url: `/api/work-orders/${wo.body.id}/release`, body: {} });
    await act(job, { cat: 'inventory', kind: 'material issued to a work order', who: P.operator(b), m: 'PUT', url: `/api/work-orders/${wo.body.id}/start`, body: {}, ref: () => wo.body.id });
    await act(job, { cat: 'shop', kind: 'work order completed', who: P.operator(b), m: 'PUT', url: `/api/work-orders/${wo.body.id}/complete`, body: { scrapWeightLb: 30, outputs: [{ weightLb: 1485, widthIn: 24 }, { weightLb: 1485, widthIn: 24 }] }, ref: () => wo.body.id });
  }
  async function manualEntry(job, i) {
    const amount = +(25 + (i % 400) + (i % 9) / 100).toFixed(2); const loc = E.branches[i % E.branches.length];
    const d = await act(job, { kind: 'journal entry written', who: P.cfo(0), url: '/api/ledger/entries', body: { entryDate: ctx.today(), memo: `P11 synthetic accrual ${i}`, lines: [{ accountCode: '5200', debit: amount, locationId: loc.id }, { accountCode: '2200', credit: amount, locationId: loc.id }] }, expect: (r) => r.status === 201 });
    await act(job, { cat: 'ledger', kind: 'journal entry posted by a second person', who: P.cfo(1), url: `/api/ledger/entries/${d.body.id}/post`, body: {}, ref: () => d.body.id });
    job.ids.entry = d.body.id;
    return d.body.id;
  }
  async function reconciliationRun(job) {
    const r = await act(job, { cat: 'ledger', kind: 'reconciliation run', who: P.cfo(0), url: '/api/ledger/reconciliations', body: {}, expect: (x) => ok2(x) && Array.isArray(x.body?.checks), ref: (x) => x.body.id || null });
    job.reconciliation = { differences: (r.body.checks || []).filter((c) => c.ok === false || Number(c.difference || 0) !== 0).map((c) => ({ key: c.key, difference: c.difference })), checks: (r.body.checks || []).length };
    return r.body;
  }

  // ── reconciling what was counted ───────────────────────────────────────────────────────────
  const idsIn = async (sql, ids) => (ids.length ? new Set((await prisma.$queryRawUnsafe(sql, ids)).map((r) => r.id)) : new Set());
  const postedFor = (kind, type) => `EXISTS (SELECT 1 FROM "LedgerEvent" e WHERE e."eventKind" = '${kind}' AND e."sourceType" = '${type}' AND e."sourceId" = x.id::text AND e.status = 'POSTED')`;
  const VERIFY = {
    'order confirmed': (ids) => idsIn(`SELECT id FROM "Order" WHERE id = ANY($1) AND "orderType" = 'SO' AND status::text NOT IN ('DRAFT')`, ids),
    'request for quote entered': (ids) => idsIn('SELECT id FROM "RFQ" WHERE id = ANY($1)', ids),
    'quote priced': (ids) => idsIn('SELECT id FROM "Quote" WHERE id = ANY($1)', ids),
    'quote accepted into an order': (ids) => idsIn('SELECT o.id FROM "Order" o JOIN "Quote" q ON q."convertedOrderId" = o.id WHERE o.id = ANY($1)', ids),
    'purchase order placed': (ids) => idsIn(`SELECT id FROM "Order" WHERE id = ANY($1) AND "orderType" = 'PO' AND status::text <> 'DRAFT'`, ids),
    'goods received': (ids) => idsIn(`SELECT c.id FROM "Coil" c WHERE c.id = ANY($1) AND EXISTS (SELECT 1 FROM "MaterialMovement" x WHERE x."coilId" = c.id AND x."movementType" = 'RECEIVE' AND ${postedFor('STOCK_RECEIVED', 'MaterialMovement')})`, ids),
    'shipment dispatched': (ids) => idsIn(`SELECT s.id FROM "Shipment" s WHERE s.id = ANY($1) AND s.status::text IN ('IN_TRANSIT','DELIVERED') AND EXISTS (SELECT 1 FROM "MaterialMovement" x WHERE x."shipmentId" = s.id AND x."movementType" = 'SHIP' AND ${postedFor('STOCK_SHIPPED', 'MaterialMovement')})`, ids),
    'shipment delivered': (ids) => idsIn(`SELECT id FROM "Shipment" WHERE id = ANY($1) AND status::text = 'DELIVERED'`, ids),
    'invoice raised': (ids) => idsIn(`SELECT x.id FROM "Invoice" x WHERE x.id = ANY($1) AND x.kind::text = 'INVOICE' AND ${postedFor('INVOICE_ISSUED', 'Invoice')}`, ids),
    'payment taken': (ids) => idsIn(`SELECT i.id FROM "Invoice" i WHERE i.id = ANY($1) AND EXISTS (SELECT 1 FROM "Payment" x WHERE x."invoiceId" = i.id AND x.amount > 0 AND ${postedFor('PAYMENT_RECORDED', 'Payment')})`, ids),
    'credit memo issued': (ids) => idsIn(`SELECT x.id FROM "Invoice" x WHERE x.id = ANY($1) AND x.kind::text = 'CREDIT' AND EXISTS (SELECT 1 FROM "LedgerEvent" e WHERE e."sourceType" = 'Invoice' AND e."sourceId" = x.id::text AND e.status = 'POSTED')`, ids),
    'refund paid': (ids) => idsIn(`SELECT i.id FROM "Invoice" i WHERE i.id = ANY($1) AND EXISTS (SELECT 1 FROM "Payment" x WHERE x."invoiceId" = i.id AND EXISTS (SELECT 1 FROM "LedgerEvent" e WHERE e."sourceType" = 'Payment' AND e."sourceId" = x.id::text AND e.status = 'POSTED'))`, ids),
    'job routed and scheduled': (ids) => idsIn('SELECT "jobId" AS id FROM "DispatchJob" WHERE "jobId" = ANY($1)', ids),
    'step finished': (ids) => idsIn(`SELECT id FROM "DispatchOperation" WHERE id = ANY($1) AND status::text IN ('COMPLETE','COMPLETED','DONE')`, ids),
    'inspection passed': (ids) => idsIn(`SELECT id FROM "JobInspection" WHERE id = ANY($1) AND status::text = 'PASSED'`, ids),
    'material issued to a work order': (ids) => idsIn(`SELECT id FROM "WorkOrder" WHERE id = ANY($1) AND status::text IN ('IN_PROGRESS','COMPLETE','COMPLETED')`, ids),
    'job packed and staged for shipping': (ids) => idsIn(`SELECT id FROM "Job" WHERE id = ANY($1) AND status::text IN ('READY_TO_SHIP','SHIPPED','COMPLETED')`, ids),
    'work order completed': (ids) => idsIn(`SELECT id FROM "WorkOrder" WHERE id = ANY($1) AND status::text IN ('COMPLETE','COMPLETED')`, ids),
    'transfer sent': (ids) => idsIn(`SELECT t.id FROM "StockTransfer" t WHERE t.id = ANY($1) AND EXISTS (SELECT 1 FROM "StockTransferLine" x WHERE x."transferId" = t.id AND ${postedFor('TRANSFER_SHIPPED', 'StockTransferLine')})`, ids),
    'transfer received': (ids) => idsIn(`SELECT id FROM "StockTransfer" WHERE id = ANY($1) AND status::text IN ('RECEIVED','COMPLETE','COMPLETED','CLOSED')`, ids),
    'return received and credited': (ids) => idsIn(`SELECT id FROM "Order" WHERE id = ANY($1) AND "orderType" = 'RETURN' AND status::text = 'COMPLETE'`, ids),
    'stock count adjusted': (ids) => idsIn(`SELECT c.id FROM "Coil" c WHERE c.id = ANY($1) AND EXISTS (SELECT 1 FROM "MaterialMovement" x WHERE x."coilId" = c.id AND x."movementType" = 'ADJUST' AND ${postedFor('STOCK_ADJUSTED', 'MaterialMovement')})`, ids),
    'web order placed': (ids) => idsIn('SELECT id FROM "OnlineOrder" WHERE id = ANY($1)', ids),
    'web order accepted into an order': (ids) => idsIn(`SELECT o.id FROM "Order" o JOIN "OnlineOrder" w ON w."internalOrderId" = o.id WHERE o.id = ANY($1) AND w.status::text = 'ACCEPTED'`, ids),
    'counter sale paid': (ids) => idsIn(`SELECT o.id FROM "Order" o WHERE o.id = ANY($1) AND EXISTS (SELECT 1 FROM "Invoice" i WHERE i."orderId" = o.id)`, ids),
    'journal entry posted by a second person': (ids) => idsIn(`SELECT id FROM "JournalEntry" WHERE id = ANY($1) AND status::text = 'POSTED'`, ids),
    'reconciliation run': (ids) => idsIn('SELECT id FROM "LedgerReconciliation" WHERE id = ANY($1)', ids),
  };
  /** Looks every completed transaction up in the database. Returns what could not be found, by kind. */
  async function reconcileLog() {
    const byKind = {}; for (const e of log) (byKind[e.kind] ||= []).push(e);
    const missing = {}; const notChecked = {};
    for (const [kind, entries] of Object.entries(byKind)) {
      if (kind === 'stock reserved') {
        // A reservation is kept as a quantity on the order line and on the stock item. It is reconciled as "the line it was made for went on to ship, or still holds it".
        const lineIds = entries.map((e) => String(e.ref).split('|')[0]);
        const good = await idsIn('SELECT id FROM "OrderLine" WHERE id = ANY($1)', lineIds);
        for (const e of entries) { if (good.has(String(e.ref).split('|')[0])) tx[e.cat].reconciled += 1; else (missing[kind] ||= []).push(e.ref); }
        continue;
      }
      const check = VERIFY[kind];
      if (!check) { notChecked[kind] = entries.length; continue; }
      const refs = entries.map((e) => e.ref).filter(Boolean);
      let good; try { good = await check([...new Set(refs)]); } catch (e) { notChecked[kind] = `${entries.length} (the check itself failed: ${String(e.message).slice(0, 140)})`; continue; }
      for (const e of entries) { if (e.ref && good.has(e.ref)) tx[e.cat].reconciled += 1; else (missing[kind] ||= []).push(e.ref); }
    }
    return { missing, notChecked };
  }

  return { act, read, send, P, lat, latByLevel, reads, tx, log, failures, statuses, instances, gauge, receiveLot, lotFor, placeOrder, reserve, ship, takePayment, settle, stockSale, processedSale, webOrder, counterSale, partialShipment, returnAndCredit, transferBetween, countAdjustment, coilWorkOrder, manualEntry, reconciliationRun, reconcileLog, signIn };
}
