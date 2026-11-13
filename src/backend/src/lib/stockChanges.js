/**
 * Every change to a stock quantity that is not a receipt, a reservation, a transfer or a shipment.
 *
 * Owner decisions of 2026-11-13: everything is always tracked. So
 *   - cutting a piece takes its weight, and the scrap, off the item it was cut from, and puts the
 *     pieces on the books as new items with the same heat, grade and owner (completeWorkOrder);
 *   - recording a remnant takes its weight off its parent (takeFromParent);
 *   - a count or a correction changes the balance only through a movement that says who, why and
 *     how much (adjustStock).
 *
 * Each function runs inside the caller's transaction and locks the balance row first, so two
 * changes to one item at the same moment happen one after the other. One item may feed several
 * work orders: each takes only what is free at the moment it completes.
 */
import { STAFF_GROUPS } from './roleAccess.js';

export const ADJUST_REASONS = ['COUNT', 'DAMAGE', 'SCRAP', 'FOUND', 'CORRECTION'];
/** Who may correct a stock balance: branch and company managers, and the inventory manager. */
export const STOCK_ADJUSTERS = new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'INVENTORY_MANAGER']);

const refuse = (status, message) => { throw Object.assign(new Error(message), { refuse: true, status }); };
const num = (v) => (v == null ? 0 : Number(v));
const round4 = (v) => Math.round(v * 10000) / 10000;
const EPS = 1e-6;
const lb = (v) => `${round4(v).toLocaleString()} lb`;

/** Locks the balance row of one stock item and returns it as numbers. */
async function lockBalance(tx, coilId) {
  const rows = await tx.$queryRaw`SELECT "id", "locationId", "unit", "qtyOnHand"::float8 AS "onHand", "qtyAvailable"::float8 AS "available",
    "qtyAllocated"::float8 AS "reserved", "qtyOnHold"::float8 AS "onHold" FROM "Inventory" WHERE "coilId" = ${coilId} FOR UPDATE`;
  return rows[0] || null;
}

async function setStatusAfter(tx, coilId, onHandAfter) {
  if (onHandAfter <= EPS) {
    await tx.coil.updateMany({ where: { id: coilId, status: { in: ['AVAILABLE', 'ALLOCATED', 'IN_PROCESS'] } }, data: { status: 'CONSUMED' } });
  } else {
    const reservedLeft = await tx.orderLineAllocation.count({ where: { coilId } });
    await tx.coil.updateMany({ where: { id: coilId, status: { in: ['CONSUMED', ...(reservedLeft ? [] : ['ALLOCATED'])] } }, data: { status: 'AVAILABLE' } });
  }
}

/**
 * Takes `weight` off the free quantity of a parent item because a piece was cut from it.
 * Used when a remnant is recorded against its parent.
 */
export async function takeFromParent(tx, { parentId, parentNumber, weight, childNumber, userId }) {
  const bal = await lockBalance(tx, parentId);
  if (!bal) refuse(409, `Parent item ${parentNumber} has no stock balance, so a piece cannot be taken from it`);
  if (weight > bal.available + EPS) {
    refuse(409, `Parent item ${parentNumber} has ${lb(bal.available)} free, which is less than the ${lb(weight)} of this piece. Correct the parent's balance, or release what is reserved or on hold, first.`);
  }
  await tx.inventory.update({ where: { coilId: parentId }, data: { qtyOnHand: { decrement: weight }, qtyAvailable: { decrement: weight }, lastMovement: new Date() } });
  await tx.materialMovement.create({
    data: { coilId: parentId, movementType: 'CONSUME', fromLocationId: bal.locationId, qtyMoved: weight, unit: bal.unit, reasonCode: 'CUT_PIECE', notes: `Piece ${childNumber} cut from this item`, createdById: userId },
  });
  await setStatusAfter(tx, parentId, bal.onHand - weight);
}

/** Reads the pieces a completed work order reports. Returns { pieces, out } or throws a refusal. */
export function readPieces(body, FORMS) {
  const raw = body?.outputs;
  const outGiven = body?.outputWeightLb;
  if (raw == null || (Array.isArray(raw) && !raw.length)) {
    const out = Number(outGiven);
    return { out, pieces: out > 0 ? [{ weightLb: out }] : [] };
  }
  if (!Array.isArray(raw) || raw.length > 200) refuse(400, 'outputs must be a list of at most 200 pieces');
  const pieces = raw.map((p, i) => {
    const weightLb = Number(p?.weightLb);
    if (!Number.isFinite(weightLb) || weightLb <= 0 || weightLb > 10000000) refuse(400, `Piece ${i + 1}: weightLb must be more than zero`);
    const size = (name) => {
      if (p[name] == null || p[name] === '') return undefined;
      const v = Number(p[name]);
      if (!Number.isFinite(v) || v <= 0 || v > 100000) refuse(400, `Piece ${i + 1}: ${name} must be more than zero`);
      return v;
    };
    if (p.form != null && !FORMS.includes(p.form)) refuse(400, `Piece ${i + 1}: form must be one of: ${FORMS.join(', ')}`);
    const coilNumber = p.coilNumber == null ? undefined : String(p.coilNumber).trim().slice(0, 60) || undefined;
    return { weightLb, widthIn: size('widthIn'), lengthIn: size('lengthIn'), thicknessIn: size('thicknessIn'), form: p.form || undefined, coilNumber };
  });
  const out = round4(pieces.reduce((s, p) => s + p.weightLb, 0));
  if (outGiven != null && Math.abs(Number(outGiven) - out) > 0.01) refuse(400, `The pieces weigh ${lb(out)} together, which is not the output weight given (${lb(Number(outGiven))})`);
  return { out, pieces };
}

/**
 * Books a completed work order: takes output and scrap off the source item, and puts each piece
 * on the books as a new item. Stock that was reserved on the source for the work order's own
 * order line goes into the pieces still reserved for that line, so it can ship.
 * The caller has already claimed the work order (status moved to COMPLETE in this transaction).
 */
export async function completeWorkOrder(tx, wo, { out, scrap, pieces }, userId) {
  const source = await tx.coil.findUnique({
    where: { id: wo.sourceCoilId },
    select: { id: true, coilNumber: true, status: true, qcStatus: true, heatId: true, gradeId: true, ownerId: true, productId: true, form: true, thicknessIn: true, widthIn: true, lengthIn: true, locationId: true, temper: true, finish: true, coating: true },
  });
  if (!source) refuse(409, 'The source stock item is no longer on file');
  if (source.status === 'HOLD' || ['FAILED', 'HOLD'].includes(source.qcStatus)) refuse(409, `Stock item ${source.coilNumber} is on hold. Release the hold before completing work on it.`);
  const bal = await lockBalance(tx, source.id);
  if (!bal) refuse(409, `Stock item ${source.coilNumber} has no stock balance`);

  const used = round4(out + scrap);
  // What is reserved on the source for this work order's own line can be used by it.
  const own = wo.lineId ? await tx.orderLineAllocation.findMany({ where: { orderLineId: wo.lineId, coilId: source.id }, orderBy: { allocatedAt: 'asc' } }) : [];
  const ownReserved = own.reduce((s, a) => s + num(a.qtyAllocated), 0);
  const fromReserved = Math.min(used, ownReserved);
  const fromFree = round4(used - fromReserved);
  if (fromFree > bal.available + EPS) {
    refuse(409, `Stock item ${source.coilNumber} has ${lb(bal.available + ownReserved)} this work order can use, which is less than the ${lb(used)} of output and scrap reported. The rest is reserved for other orders, on hold, or already used. Correct the weights or the item's balance.`);
  }

  await tx.inventory.update({
    where: { coilId: source.id },
    data: { qtyOnHand: { decrement: used }, qtyAvailable: { decrement: fromFree }, qtyAllocated: { decrement: fromReserved }, lastMovement: new Date() },
  });
  let release = fromReserved;
  for (const a of own) {
    if (release <= EPS) break;
    const take = Math.min(release, num(a.qtyAllocated));
    if (take + EPS >= num(a.qtyAllocated)) await tx.orderLineAllocation.delete({ where: { id: a.id } });
    else await tx.orderLineAllocation.update({ where: { id: a.id }, data: { qtyAllocated: { decrement: take } } });
    release -= take;
  }
  const move = (data) => tx.materialMovement.create({ data: { unit: bal.unit, workOrderId: wo.id, orderId: wo.salesOrderId || null, createdById: userId, ...data } });
  if (out > EPS) await move({ coilId: source.id, movementType: 'CONSUME', fromLocationId: bal.locationId, qtyMoved: out, reasonCode: 'WORK_ORDER', notes: `Made into pieces on ${wo.woNumber}` });
  if (scrap > EPS) await move({ coilId: source.id, movementType: 'SCRAP', fromLocationId: bal.locationId, qtyMoved: scrap, reasonCode: 'WORK_ORDER', notes: `Scrap on ${wo.woNumber}` });

  // Reserved stock that became pieces stays reserved for the same line. Reserved stock that became scrap is gone.
  let carry = Math.min(fromReserved, out);
  const made = [];
  for (const [i, p] of pieces.entries()) {
    const coilNumber = p.coilNumber || `${wo.woNumber}-${String(i + 1).padStart(2, '0')}`;
    if (await tx.coil.findUnique({ where: { coilNumber }, select: { id: true } })) refuse(409, `Item number ${coilNumber} is already in use`);
    const reserved = round4(Math.min(carry, p.weightLb));
    carry = round4(carry - reserved);
    const piece = await tx.coil.create({
      data: {
        coilNumber, form: p.form || source.form, heatId: source.heatId, gradeId: source.gradeId, ownerId: source.ownerId, productId: source.productId,
        parentCoilId: source.id, locationId: bal.locationId, thicknessIn: p.thicknessIn ?? source.thicknessIn, widthIn: p.widthIn ?? source.widthIn,
        lengthIn: p.lengthIn ?? source.lengthIn, temper: source.temper, finish: source.finish, coating: source.coating,
        netWeightLb: p.weightLb, grossWeightLb: p.weightLb, qcStatus: source.qcStatus, status: reserved > EPS ? 'ALLOCATED' : 'AVAILABLE',
        originOrderId: wo.salesOrderId || null, createdById: userId,
      },
      select: { id: true, coilNumber: true },
    });
    await tx.inventory.create({ data: { coilId: piece.id, locationId: bal.locationId, qtyOnHand: p.weightLb, qtyAvailable: round4(p.weightLb - reserved), qtyAllocated: reserved, unit: bal.unit, lastMovement: new Date() } });
    if (reserved > EPS) await tx.orderLineAllocation.create({ data: { orderLineId: wo.lineId, coilId: piece.id, qtyAllocated: reserved } });
    await move({ coilId: piece.id, movementType: 'PROCESS', toLocationId: bal.locationId, qtyMoved: p.weightLb, reasonCode: 'WORK_ORDER', notes: `Cut from ${source.coilNumber} on ${wo.woNumber}` });
    await tx.workOrderOutput.create({ data: { workOrderId: wo.id, outputCoilId: piece.id, sequence: i + 1, targetWidth: p.widthIn ?? null, actualWidth: p.widthIn ?? null, actualWeight: p.weightLb } });
    made.push({ id: piece.id, coilNumber: piece.coilNumber, weightLb: p.weightLb, reservedLb: reserved });
  }
  await setStatusAfter(tx, source.id, bal.onHand - used);
  return { source: { id: source.id, coilNumber: source.coilNumber, onHandBefore: bal.onHand, onHandAfter: round4(bal.onHand - used) }, pieces: made, usedLb: used };
}

/**
 * Corrects the balance of one stock item. Give either `countedQty` (what is actually there) or
 * `change` (a signed difference). Only free stock can be taken away: what is reserved or on hold
 * has to be released first, so an order never loses its stock silently.
 */
export async function adjustStock(tx, { coilId, countedQty, change, reason, notes, userId }) {
  const coil = await tx.coil.findUnique({ where: { id: coilId }, select: { id: true, coilNumber: true } });
  if (!coil) refuse(404, 'Stock item not found');
  const bal = await lockBalance(tx, coilId);
  if (!bal) refuse(409, `Stock item ${coil.coilNumber} has no stock balance`);
  const delta = round4(countedQty != null ? countedQty - bal.onHand : change);
  const after = round4(bal.onHand + delta);
  if (after < -EPS) refuse(409, `Stock item ${coil.coilNumber} has ${lb(bal.onHand)} on hand, so ${lb(-delta)} cannot be taken off`);
  if (delta < 0 && -delta > bal.available + EPS) {
    refuse(409, `Stock item ${coil.coilNumber} has ${lb(bal.available)} free. ${lb(bal.reserved)} is reserved and ${lb(bal.onHold)} is on hold, and that has to be released before the balance can go down to ${lb(after)}.`);
  }
  const details = { coilNumber: coil.coilNumber, reason, from: bal.onHand, to: after, change: delta, note: notes };
  if (Math.abs(delta) <= EPS) {
    await tx.auditLog.create({ data: { category: 'WORKFLOW', eventType: 'STOCK_COUNT_CONFIRMED', action: 'UPDATE', userId, resourceType: 'Coil', resourceId: coilId, details } });
    return { coilNumber: coil.coilNumber, onHandBefore: bal.onHand, onHandAfter: bal.onHand, change: 0, movement: null };
  }
  await tx.inventory.update({ where: { coilId }, data: { qtyOnHand: { increment: delta }, qtyAvailable: { increment: delta }, lastMovement: new Date() } });
  const up = delta > 0;
  const movement = await tx.materialMovement.create({
    data: {
      coilId, movementType: reason === 'COUNT' ? 'COUNT' : reason === 'SCRAP' && !up ? 'SCRAP' : 'ADJUST',
      ...(up ? { toLocationId: bal.locationId } : { fromLocationId: bal.locationId }),
      qtyMoved: Math.abs(delta), unit: bal.unit, reasonCode: `${reason}_${up ? 'UP' : 'DOWN'}`, notes, createdById: userId,
    },
  });
  await tx.auditLog.create({ data: { category: 'WORKFLOW', eventType: 'STOCK_ADJUSTED', action: 'UPDATE', userId, resourceType: 'Coil', resourceId: coilId, details } });
  await setStatusAfter(tx, coilId, after);
  return { coilNumber: coil.coilNumber, onHandBefore: bal.onHand, onHandAfter: after, change: delta, movement };
}
