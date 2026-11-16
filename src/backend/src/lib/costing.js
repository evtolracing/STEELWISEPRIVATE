/**
 * Costing (owner's decision of 2026-11-15; findings K-007 and L-026).
 *
 * Method: actual cost per item. An item's unit cost is what the purchase order line said it cost,
 * taken at receipt and expressed per unit the item is stocked in. A piece cut from an item carries
 * the same unit cost (cost follows weight). A job's cost is the material its coil work orders used,
 * at that unit cost, plus the time clocked on its steps at the rate on file for each kind of work center.
 *
 * Nothing is assumed. Where a price cannot be turned into a unit cost, or no rate is on file, the
 * figure is left empty and the answer says what is missing. There is no overhead: none is on file.
 * The first functions are pure; jobCost reads the database.
 */
const num = (v) => (v == null || v === '' ? null : Number(v));
const round = (v, places) => { const f = 10 ** places; return Math.round((v + Number.EPSILON) * f) / f; };
const WEIGHT_UNITS = ['LB', 'LBS'];
const PIECE_UNITS = ['EA', 'EACH', 'PC', 'PCS', 'PIECE', 'PIECES'];

/**
 * The cost of one stocked unit from a purchase price.
 * priceUnit: CWT (per hundred pounds), LB, TON (2,000 lb), EACH, LF. stockUnit: the unit the item is counted in.
 * null when the price is empty or the two units cannot be related without a figure that is not on file.
 */
export function unitCostFromPrice({ unitPrice, priceUnit, stockUnit }) {
  const price = num(unitPrice);
  if (price == null || !Number.isFinite(price) || price < 0) return null;
  const pu = String(priceUnit || '').toUpperCase(); const su = String(stockUnit || '').toUpperCase();
  if (WEIGHT_UNITS.includes(su)) {
    if (pu === 'CWT') return round(price / 100, 6);
    if (pu === 'LB') return round(price, 6);
    if (pu === 'TON') return round(price / 2000, 6);
    return null; // a price per piece or per foot says nothing about a pound
  }
  if (PIECE_UNITS.includes(su)) return ['EACH', 'EA'].includes(pu) ? round(price, 6) : null;
  return null;
}

/** Hours between two times; an entry still running counts to `now`. */
export function hoursOf(entry, now = new Date()) {
  const start = entry?.startAt ? new Date(entry.startAt).getTime() : null;
  if (start == null) return 0;
  const end = entry.endAt ? new Date(entry.endAt).getTime() : new Date(now).getTime();
  return end > start ? (end - start) / 3600000 : 0;
}

/**
 * Adds up a job's cost from facts already read.
 * workOrders: [{ woNumber, status, usedLb, unitCost }] (usedLb: output plus scrap of a completed work order).
 * labor: [{ kind, hours, rate }] one row per kind of work center.
 * Returns amounts (2 places), and `missing`: what stops the total from being complete.
 */
export function addUpJobCost({ workOrders = [], labor = [] }) {
  const missing = [];
  let material = 0; let materialKnown = true;
  for (const w of workOrders) {
    if (w.status !== 'COMPLETE') continue;
    if (w.unitCost == null) { materialKnown = false; missing.push(`No cost is on file for the material used on ${w.woNumber}`); continue; }
    material += (Number(w.usedLb) || 0) * Number(w.unitCost);
  }
  let labour = 0; let laborKnown = true;
  for (const l of labor) {
    if (!(l.hours > 0)) continue;
    if (l.rate == null) { laborKnown = false; missing.push(`No labor rate is on file for ${l.kind}`); continue; }
    labour += l.hours * Number(l.rate);
  }
  const anything = workOrders.some((w) => w.status === 'COMPLETE') || labor.some((l) => l.hours > 0);
  return {
    materialCost: round(material, 2), materialComplete: materialKnown,
    laborCost: round(labour, 2), laborComplete: laborKnown,
    totalCost: round(material + labour, 2), complete: materialKnown && laborKnown && anything,
    missing, basis: 'Actual cost per item from the purchase order at receipt; labor at the rate on file for each kind of work center. No overhead is included.',
  };
}

/**
 * What a job used and made: its coil work orders with weights and yield (finding L-024).
 * Includes the one work order a job may name itself (the older link) and every work order that names the job.
 */
export async function jobMaterial(db, job) {
  const rows = await db.workOrder.findMany({
    where: { OR: [{ jobId: job.id }, ...(job.workOrderId ? [{ id: job.workOrderId }] : [])] },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, woNumber: true, woType: true, status: true, inputWeightLb: true, outputWeightLb: true, scrapWeightLb: true, yieldPct: true, completedAt: true,
      sourceCoil: { select: { id: true, coilNumber: true, unitCost: true, heat: { select: { heatNumber: true } }, grade: { select: { code: true } } } },
      outputs: { select: { outputCoil: { select: { id: true, coilNumber: true, netWeightLb: true } } } },
    },
  });
  const done = rows.filter((w) => w.status === 'COMPLETE');
  const sum = (f) => round(done.reduce((a, w) => a + (num(w[f]) || 0), 0), 4);
  const outputLb = sum('outputWeightLb'); const scrapLb = sum('scrapWeightLb'); const usedLb = round(outputLb + scrapLb, 4);
  return {
    workOrders: rows.map((w) => ({
      id: w.id, woNumber: w.woNumber, woType: w.woType, status: w.status, completedAt: w.completedAt,
      source: { id: w.sourceCoil?.id, coilNumber: w.sourceCoil?.coilNumber, heatNumber: w.sourceCoil?.heat?.heatNumber || null, grade: w.sourceCoil?.grade?.code || null },
      outputLb: num(w.outputWeightLb), scrapLb: num(w.scrapWeightLb), yieldPct: num(w.yieldPct),
      pieces: w.outputs.map((o) => ({ id: o.outputCoil?.id, coilNumber: o.outputCoil?.coilNumber, weightLb: num(o.outputCoil?.netWeightLb) })),
      _unitCost: num(w.sourceCoil?.unitCost), _usedLb: round((num(w.outputWeightLb) || 0) + (num(w.scrapWeightLb) || 0), 4),
    })),
    totals: { workOrders: rows.length, completed: done.length, usedLb, outputLb, scrapLb, yieldPct: usedLb > 0 ? round((outputLb / usedLb) * 100, 2) : null },
  };
}

/** A job's cost, read from its coil work orders and its time entries. */
export async function jobCost(db, job, material = null, now = new Date()) {
  const mat = material || await jobMaterial(db, job);
  const logs = await db.dispatchTimeLog.findMany({
    where: { dispatchOperation: { dispatchJob: { jobId: job.id } } },
    select: { startAt: true, endAt: true, dispatchOperation: { select: { requiredWorkCenterType: true } } },
  });
  const byKind = new Map();
  for (const l of logs) { const k = l.dispatchOperation?.requiredWorkCenterType || 'UNKNOWN'; byKind.set(k, (byKind.get(k) || 0) + hoursOf(l, now)); }
  const kinds = byKind.size ? await db.workCenterType.findMany({ where: { id: { in: [...byKind.keys()] } }, select: { id: true, label: true, hourlyRate: true } }) : [];
  const labor = [...byKind.entries()].map(([kind, hours]) => { const t = kinds.find((x) => x.id === kind); return { kind: t?.label || kind, hours: round(hours, 4), rate: num(t?.hourlyRate) }; });
  const cost = addUpJobCost({ workOrders: mat.workOrders.map((w) => ({ woNumber: w.woNumber, status: w.status, usedLb: w._usedLb, unitCost: w._unitCost })), labor });
  return { ...cost, labor: labor.map((l) => ({ ...l, cost: l.rate == null ? null : round(l.hours * l.rate, 2) })) };
}

/** Strips the internal cost fields from a material summary before it is sent. */
export function publicMaterial(material) {
  return { ...material, workOrders: material.workOrders.map(({ _unitCost, _usedLb, ...w }) => w) };
}
