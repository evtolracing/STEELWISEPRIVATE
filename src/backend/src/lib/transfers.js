/**
 * Moving stock from one branch to another (Phase 6, finding G-007).
 *
 * A transfer has three states:
 *   SHIPPED    the material is on the road. It is off the sender's shelf: its free quantity moves to
 *              "in transit", so nothing can sell, reserve, cut, hold or correct it. A reservation for an
 *              order travels with it, but cannot ship while it travels. The item stays on the sender's
 *              books until the receiver says it arrived.
 *   RECEIVED   the receiving branch counted what arrived. The item is now at the receiving branch.
 *              What was short, missing or damaged is held (DISPUTE or DAMAGE) with the reason, so it
 *              cannot be sold until a manager or the inventory manager confirms the count (the documented
 *              rule for correcting a balance, lib/stockChanges.js) and releases it.
 *   CANCELLED  the sender called it back before it was received: the item is free again where it was.
 *
 * A tracked item (coil, plate, bundle) travels whole. Splitting it is a cutting job, not a transfer.
 * The parts with no database access are exported for unit tests.
 */
import { acrossBranches, currentScope } from './branchScope.js';
import { placeHold, releaseHold } from './holds.js';
import { recordMovement, record as recordLedger, reverseEvent as reverseLedger } from '../services/ledger.js';

export const RECEIPT_CONDITIONS = ['GOOD', 'SHORT', 'DAMAGED', 'NOT_RECEIVED'];
export const MAX_TRANSFER_ITEMS = 100;

const refuse = (status, message, code) => { throw Object.assign(new Error(message), { refuse: true, status, ...(code && { code }) }); };
const num = (v) => (v == null ? 0 : Number(v));
const EPS = 1e-6;
const text = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const r4 = (v) => Math.round(v * 10000) / 10000;

/** Reads a request to ship. { toLocationId, coilIds, carrier, reference, notes } or throws a refusal. */
export function readShipment(body) {
  const b = body && typeof body === 'object' ? body : {};
  const toLocationId = typeof b.toLocationId === 'string' ? b.toLocationId : '';
  if (!toLocationId) refuse(400, 'Choose the branch the material is going to (toLocationId)');
  const ids = Array.isArray(b.coilIds) ? b.coilIds : b.coilId ? [b.coilId] : [];
  if (!ids.length) refuse(400, 'List the stock items being sent (coilIds)');
  if (ids.length > MAX_TRANSFER_ITEMS) refuse(400, `A transfer can carry ${MAX_TRANSFER_ITEMS} items at most`);
  if (ids.some((id) => typeof id !== 'string' || !id)) refuse(400, 'Each stock item must be given by its id');
  if (new Set(ids).size !== ids.length) refuse(400, 'The same stock item is listed twice');
  return { toLocationId, coilIds: ids, carrier: text(b.carrier, 120) || null, reference: text(b.reference, 120) || null, notes: text(b.notes, 1000) || null };
}

/**
 * Reads what the receiving branch counted, against the lines shipped. A line not mentioned arrived whole
 * and in good order. Returns [{ lineId, coilId, qtyShipped, qtyReceived, condition, notes }].
 */
export function readArrival(body, lines) {
  const given = Array.isArray(body?.lines) ? body.lines : [];
  const byCoil = new Map();
  for (const g of given) {
    const key = g?.coilId || g?.lineId;
    if (!key || !lines.some((l) => l.coilId === key || l.id === key)) refuse(400, 'A received line names an item that is not on this transfer');
    const line = lines.find((l) => l.coilId === key || l.id === key);
    if (byCoil.has(line.coilId)) refuse(400, 'The same item is counted twice');
    byCoil.set(line.coilId, g);
  }
  return lines.map((line) => {
    const shipped = num(line.qtyShipped);
    const g = byCoil.get(line.coilId) || {};
    let condition = g.condition ? String(g.condition).toUpperCase() : null;
    if (condition && !RECEIPT_CONDITIONS.includes(condition)) refuse(400, `Condition must be one of: ${RECEIPT_CONDITIONS.join(', ')}`);
    let qty = shipped;
    if (g.qtyReceived !== undefined && g.qtyReceived !== null && g.qtyReceived !== '') {
      qty = Number(g.qtyReceived);
      if (!Number.isFinite(qty) || qty < 0) refuse(400, 'The quantity received must be zero or more');
      if (r4(qty) !== qty) refuse(400, 'Quantities are kept to four decimal places');
    }
    if (condition === 'NOT_RECEIVED' && (g.qtyReceived === undefined || g.qtyReceived === null || g.qtyReceived === '')) qty = 0;
    if (qty > shipped + EPS) refuse(409, `More arrived than was sent (${r4(qty)} against ${r4(shipped)} ${line.unit}). Receive what was sent and correct the count afterwards.`);
    const derived = qty <= EPS ? 'NOT_RECEIVED' : qty < shipped - EPS ? 'SHORT' : 'GOOD';
    if (!condition) condition = derived;
    else if (condition !== 'DAMAGED' && condition !== derived) refuse(400, `The condition ${condition} does not match the quantity received (${r4(qty)} of ${r4(shipped)} ${line.unit})`);
    const notes = text(g.notes, 1000);
    if (condition !== 'GOOD' && notes.length < 5) refuse(400, `Say what was found for each item that was short, missing or damaged (a note of at least 5 characters)`);
    return { lineId: line.id, coilId: line.coilId, qtyShipped: shipped, qtyReceived: qty, condition, notes: notes || null };
  });
}

async function lockBalance(tx, coilId) {
  const rows = await tx.$queryRaw`SELECT "id", "locationId", "unit", "status", "qtyOnHand"::float8 AS "onHand", "qtyAvailable"::float8 AS "available",
    "qtyAllocated"::float8 AS "reserved", "qtyOnHold"::float8 AS "onHold", "qtyInTransit"::float8 AS "inTransit" FROM "Inventory" WHERE "coilId" = ${coilId} FOR UPDATE`;
  return rows[0] || null;
}

/** May this login act for the branch? (All-branch roles may act for any.) */
export function actsFor(branchId) {
  const scope = currentScope();
  if (!scope || scope.branches === null) return true;
  return scope.branches.includes(branchId);
}

/**
 * Ships the items as one transfer. Runs inside the caller's transaction. The caller checks the
 * destination exists and numbers the transfer.
 */
export async function shipTransfer(tx, { transferNumber, shipment, userId }) {
  const coils = await tx.coil.findMany({ where: { id: { in: shipment.coilIds } }, select: { id: true, coilNumber: true, status: true, locationId: true } });
  if (coils.length !== shipment.coilIds.length) refuse(404, 'Stock item not found');
  const from = coils[0].locationId;
  if (coils.some((c) => c.locationId !== from)) refuse(409, 'All items on one transfer must leave from the same branch');
  if (from === shipment.toLocationId) refuse(400, 'The items are already at that branch');
  if (!actsFor(from)) refuse(403, 'That stock belongs to another branch.');
  const lines = [];
  for (const id of shipment.coilIds) {
    const coil = coils.find((c) => c.id === id);
    const bal = await lockBalance(tx, id);
    if (!bal) refuse(404, `Stock item ${coil.coilNumber} has no stock record`);
    if (bal.locationId !== from) refuse(409, `Stock item ${coil.coilNumber} was just moved by someone else. Reload and try again.`);
    if (bal.status === 'IN_TRANSIT' || bal.inTransit > EPS) refuse(409, `Stock item ${coil.coilNumber} is already on its way to another branch`);
    if (['SHIPPED', 'CONSUMED'].includes(coil.status) || bal.onHand <= EPS) refuse(409, `There is nothing on hand to transfer for ${coil.coilNumber}`);
    await tx.inventory.update({ where: { coilId: id }, data: { qtyAvailable: 0, qtyInTransit: bal.available, status: 'IN_TRANSIT', lastMovement: new Date() } });
    lines.push({ coilId: id, qtyShipped: bal.onHand, unit: bal.unit || 'LB' });
  }
  const now = new Date();
  const transfer = await tx.stockTransfer.create({
    data: {
      transferNumber, fromLocationId: from, toLocationId: shipment.toLocationId, status: 'SHIPPED', carrier: shipment.carrier,
      reference: shipment.reference, notes: shipment.notes, createdById: userId, shippedAt: now, shippedById: userId,
      lines: { create: lines },
    },
    include: TRANSFER_INCLUDE,
  });
  await tx.auditLog.create({ data: {
    category: 'WORKFLOW', eventType: 'STOCK_TRANSFER_SHIPPED', action: 'CREATE', userId, resourceType: 'StockTransfer', resourceId: transfer.id,
    details: { transferNumber, from, to: shipment.toLocationId, items: lines.map((l) => ({ coilId: l.coilId, qty: l.qtyShipped, unit: l.unit })) },
  } });
  for (const line of transfer.lines) await recordLedger(tx, 'TRANSFER_SHIPPED', 'StockTransferLine', line.id, { userId });
  return transfer;
}

export const TRANSFER_INCLUDE = {
  fromLocation: { select: { id: true, code: true, name: true } },
  toLocation: { select: { id: true, code: true, name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  lines: { orderBy: { createdAt: 'asc' }, include: { coil: { select: { id: true, coilNumber: true, form: true, thicknessIn: true, widthIn: true, lengthIn: true, heat: { select: { heatNumber: true } }, grade: { select: { code: true } } } } } },
};

/**
 * Receives a shipped transfer at its destination. The receiver must work at the destination branch.
 * Everything happens in the caller's transaction; only one receipt can win.
 */
export async function receiveTransfer(tx, { transferId, body, userId }) {
  const transfer = await tx.stockTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
  if (!transfer) refuse(404, 'Transfer not found');
  if (transfer.status !== 'SHIPPED') refuse(409, `This transfer is ${transfer.status.toLowerCase()} and cannot be received again`, 'ALREADY_FINAL');
  if (!actsFor(transfer.toLocationId)) refuse(403, 'Only the branch the material was sent to can receive it.');
  const arrival = readArrival(body, transfer.lines);
  const claimed = await tx.stockTransfer.updateMany({ where: { id: transfer.id, status: 'SHIPPED' }, data: { status: 'RECEIVED', receivedAt: new Date(), receivedById: userId } });
  if (!claimed.count) refuse(409, 'This transfer was just received or cancelled by someone else. Reload to see it.', 'ALREADY_FINAL');
  // The items are still on the sender's books until this moment, so the receiver changes them across the branch line.
  await acrossBranches(async () => {
    for (const a of arrival) {
      const bal = await lockBalance(tx, a.coilId);
      if (!bal || bal.status !== 'IN_TRANSIT') refuse(409, 'An item on this transfer is no longer in transit. Reload and try again.');
      await tx.inventory.update({ where: { coilId: a.coilId }, data: { locationId: transfer.toLocationId, qtyAvailable: { increment: bal.inTransit }, qtyInTransit: 0, status: 'ACTIVE', lastMovement: new Date() } });
      await tx.coil.update({ where: { id: a.coilId }, data: { locationId: transfer.toLocationId } });
      const arrived = await tx.materialMovement.create({ data: {
        coilId: a.coilId, movementType: 'TRANSFER', fromLocationId: transfer.fromLocationId, toLocationId: transfer.toLocationId,
        qtyMoved: a.qtyShipped, unit: bal.unit || 'LB', reasonCode: 'TRANSFER_RECEIVED', notes: `Transfer ${transfer.transferNumber}`, createdById: userId,
      } });
      await recordMovement(tx, arrived, { userId });
      if (a.condition !== 'GOOD') {
        const coil = await tx.coil.findUnique({ where: { id: a.coilId }, select: { status: true } });
        const missing = r4(a.qtyShipped - a.qtyReceived);
        const reason = a.condition === 'DAMAGED'
          ? `Damaged on transfer ${transfer.transferNumber}: ${a.notes}`
          : `Transfer ${transfer.transferNumber}: sent ${r4(a.qtyShipped)} ${bal.unit}, ${a.qtyReceived > EPS ? `received ${r4(a.qtyReceived)}` : 'nothing received'} (${missing} missing). ${a.notes}. A manager or the inventory manager confirms the count before this item is used.`;
        if (coil.status !== 'HOLD') await placeHold(tx, { coilId: a.coilId, holdType: a.condition === 'DAMAGED' ? 'DAMAGE' : 'DISPUTE', reason, userId });
        else await tx.qCHold.create({ data: { coilId: a.coilId, holdType: a.condition === 'DAMAGED' ? 'DAMAGE' : 'DISPUTE', holdReason: reason, holdById: userId } });
      }
      await tx.stockTransferLine.update({ where: { id: a.lineId }, data: { qtyReceived: a.qtyReceived, condition: a.condition, notes: a.notes } });
    }
  });
  const discrepancies = arrival.filter((a) => a.condition !== 'GOOD');
  await tx.auditLog.create({ data: {
    category: 'WORKFLOW', eventType: 'STOCK_TRANSFER_RECEIVED', action: 'UPDATE', userId, resourceType: 'StockTransfer', resourceId: transfer.id,
    details: { transferNumber: transfer.transferNumber, to: transfer.toLocationId, lines: arrival.map(({ coilId, qtyShipped, qtyReceived, condition }) => ({ coilId, qtyShipped, qtyReceived, condition })) },
  } });
  return { discrepancies: discrepancies.length };
}

/** Calls a shipped transfer back. The sender's branch (or an all-branch role) does this, with a reason. */
export async function cancelTransfer(tx, { transferId, reason, userId }) {
  const why = text(reason, 500);
  if (why.length < 5) refuse(400, 'Say why the transfer is cancelled (at least 5 characters)');
  const transfer = await tx.stockTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
  if (!transfer) refuse(404, 'Transfer not found');
  if (transfer.status !== 'SHIPPED') refuse(409, `This transfer is ${transfer.status.toLowerCase()} and cannot be cancelled`, 'ALREADY_FINAL');
  if (!actsFor(transfer.fromLocationId)) refuse(403, 'Only the branch that sent the material can call it back.');
  const claimed = await tx.stockTransfer.updateMany({ where: { id: transfer.id, status: 'SHIPPED' }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById: userId, cancelReason: why } });
  if (!claimed.count) refuse(409, 'This transfer was just received or cancelled by someone else. Reload to see it.', 'ALREADY_FINAL');
  for (const line of transfer.lines) {
    const bal = await lockBalance(tx, line.coilId);
    if (!bal || bal.status !== 'IN_TRANSIT') refuse(409, 'An item on this transfer is no longer in transit. Reload and try again.');
    await tx.inventory.update({ where: { coilId: line.coilId }, data: { qtyAvailable: { increment: bal.inTransit }, qtyInTransit: 0, status: 'ACTIVE', lastMovement: new Date() } });
    await reverseLedger(tx, 'TRANSFER_SHIPPED', 'StockTransferLine', line.id, { reason: `Transfer ${transfer.transferNumber} cancelled: ${why}`, userId });
  }
  await tx.auditLog.create({ data: {
    category: 'WORKFLOW', eventType: 'STOCK_TRANSFER_CANCELLED', action: 'UPDATE', userId, resourceType: 'StockTransfer', resourceId: transfer.id,
    details: { transferNumber: transfer.transferNumber, reason: why },
  } });
}

/**
 * Settles an item that arrived short or not at all, after the transfer was received. For a manager or
 * the inventory manager (the documented rule for correcting a balance, STOCK_ADJUSTERS):
 *   CONFIRM_SHORT  the missing quantity is written off the item as a correction with the note, and the hold is released
 *                  on what did arrive (an item that arrived with nothing is closed as used up).
 *   FOUND          the missing material turned up: the hold is released and the item keeps its full quantity.
 */
export async function settleShortage(tx, { transferId, coilId, decision, notes, userId }) {
  const note = text(notes, 1000);
  if (note.length < 5) refuse(400, 'A note saying what was found is required (at least 5 characters)');
  if (!['CONFIRM_SHORT', 'FOUND'].includes(decision)) refuse(400, 'decision must be CONFIRM_SHORT or FOUND');
  const line = await tx.stockTransferLine.findFirst({ where: { transferId, coilId }, include: { transfer: { select: { transferNumber: true, status: true, toLocationId: true } } } });
  if (!line) refuse(404, 'That item is not on this transfer');
  if (line.transfer.status !== 'RECEIVED') refuse(409, 'The transfer has not been received yet');
  if (!actsFor(line.transfer.toLocationId)) refuse(403, 'Only the branch the material was sent to can settle what arrived.');
  if (String(line.condition || '').startsWith('SETTLED')) refuse(409, 'This shortage has already been settled', 'ALREADY_FINAL');
  if (!['SHORT', 'NOT_RECEIVED'].includes(line.condition)) refuse(409, 'This item arrived whole; there is nothing to settle');
  const missing = r4(num(line.qtyShipped) - num(line.qtyReceived));
  // Only one settlement can win.
  const claimed = await tx.stockTransferLine.updateMany({ where: { id: line.id, condition: { in: ['SHORT', 'NOT_RECEIVED'] } }, data: { condition: decision === 'FOUND' ? 'SETTLED_FOUND' : 'SETTLED_SHORT' } });
  if (!claimed.count) refuse(409, 'This shortage has already been settled', 'ALREADY_FINAL');
  const bal = await lockBalance(tx, coilId);
  if (!bal) refuse(404, 'Stock item not found');
  if (decision === 'CONFIRM_SHORT') {
    if (missing > bal.onHold + EPS) refuse(409, `Only ${r4(bal.onHold)} ${bal.unit} of this item is on hold; ${r4(bal.reserved)} is reserved for an order. Release the reservation first, then confirm the shortage.`);
    await tx.inventory.update({ where: { coilId }, data: { qtyOnHand: { decrement: missing }, qtyOnHold: { decrement: missing }, lastMovement: new Date() } });
    const short = await tx.materialMovement.create({ data: {
      coilId, movementType: 'ADJUST', fromLocationId: bal.locationId, qtyMoved: missing, unit: bal.unit, reasonCode: 'TRANSFER_SHORT_DOWN',
      notes: `Transfer ${line.transfer.transferNumber}: ${missing} ${bal.unit} did not arrive. ${note}`, createdById: userId,
    } });
    await recordMovement(tx, short, { userId });
  }
  const after = await tx.inventory.findUnique({ where: { coilId }, select: { qtyOnHand: true } });
  if (num(after.qtyOnHand) <= EPS) {
    await tx.coil.update({ where: { id: coilId }, data: { status: 'CONSUMED', qcStatus: 'PASSED', holdCode: null } });
    await tx.qCHold.updateMany({ where: { coilId, status: 'ACTIVE' }, data: { status: 'RELEASED', disposition: 'SCRAP', resolvedDate: new Date(), resolvedById: userId, resolutionNotes: note } });
  } else {
    await releaseHold(tx, { coilId, notes: note, userId });
  }
  await tx.stockTransferLine.update({ where: { id: line.id }, data: { notes: `${line.notes || ''} Settled: ${decision === 'FOUND' ? 'found' : `${missing} ${bal.unit} written off`}. ${note}`.trim().slice(0, 2000) } });
  await tx.auditLog.create({ data: {
    category: 'WORKFLOW', eventType: 'STOCK_TRANSFER_SHORTAGE_SETTLED', action: 'UPDATE', userId, resourceType: 'StockTransfer', resourceId: transferId,
    details: { transferNumber: line.transfer.transferNumber, coilId, decision, missing, note },
  } });
  return { decision, missing: decision === 'FOUND' ? 0 : missing, onHandAfter: num(after.qtyOnHand) };
}
