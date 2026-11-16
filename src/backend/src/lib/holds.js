/**
 * Putting a stock item on hold and releasing it, inside the caller's transaction.
 *
 * A hold takes what is available out of sale: the available quantity becomes "on hold".
 * Quantity already reserved for an order stays reserved, but cannot ship while the hold stands.
 * The stock items screen (routes/coils.js) and the steps that hold material on arrival
 * (a transfer received short or damaged, a receipt that does not match its purchase order line,
 * a customer return waiting for inspection) all use these, so a hold always means the same thing.
 */
export const HOLD_TYPES = ['QUALITY', 'CUSTOMER', 'PENDING_TEST', 'DAMAGE', 'DISPUTE', 'OTHER'];

const refuse = (status, message) => { throw Object.assign(new Error(message), { refuse: true, status }); };
const num = (v) => (v == null ? 0 : Number(v));

// Every stock change takes the item's balance row first and the item itself second
// (lib/stockChanges.js, lib/transfers.js). A hold used to take them the other way round, so a hold
// racing a correction, a transfer or a cut on the same item could deadlock and answer 500 (K-015).
const lockBalance = (tx, coilId) => tx.$queryRaw`SELECT id FROM "Inventory" WHERE "coilId" = ${coilId} FOR UPDATE`;

/** Places a hold. Returns the QCHold row. */
export async function placeHold(tx, { coilId, holdType, reason, userId }) {
  if (!HOLD_TYPES.includes(holdType)) refuse(400, 'Choose a hold type');
  await lockBalance(tx, coilId);
  const coil = await tx.coil.findUnique({ where: { id: coilId }, select: { id: true, status: true, inventory: { select: { qtyAvailable: true, status: true } } } });
  if (!coil) refuse(404, 'Stock item not found');
  if (['SHIPPED', 'CONSUMED'].includes(coil.status)) refuse(409, `This item is ${coil.status.toLowerCase()} and cannot be put on hold`);
  if (coil.inventory?.status === 'IN_TRANSIT') refuse(409, 'This item is on its way to another branch. The receiving branch can hold it when it arrives.');
  const claimed = await tx.coil.updateMany({ where: { id: coil.id, status: { notIn: ['HOLD', 'SHIPPED', 'CONSUMED'] } }, data: { status: 'HOLD', qcStatus: 'HOLD', holdCode: holdType } });
  if (!claimed.count) refuse(409, 'This item is already on hold');
  const available = num(coil.inventory?.qtyAvailable);
  if (available > 0) {
    const moved = await tx.inventory.updateMany({ where: { coilId: coil.id, qtyAvailable: { gte: available } }, data: { qtyAvailable: { decrement: available }, qtyOnHold: { increment: available } } });
    if (!moved.count) refuse(409, 'The stock changed while the hold was being placed. Reload and try again.');
  }
  return tx.qCHold.create({ data: { coilId: coil.id, holdType, holdReason: String(reason).slice(0, 1000), holdById: userId } });
}

/** Releases every active hold on the item. */
export async function releaseHold(tx, { coilId, notes, userId }) {
  await lockBalance(tx, coilId);
  const coil = await tx.coil.findUnique({ where: { id: coilId }, select: { id: true, status: true, inventory: { select: { qtyOnHold: true, status: true } } } });
  if (!coil) refuse(404, 'Stock item not found');
  if (coil.inventory?.status === 'IN_TRANSIT') refuse(409, 'This item is on its way to another branch. Release it after it is received.');
  const reserved = await tx.orderLineAllocation.count({ where: { coilId: coil.id } });
  const claimed = await tx.coil.updateMany({ where: { id: coil.id, status: 'HOLD' }, data: { status: reserved ? 'ALLOCATED' : 'AVAILABLE', qcStatus: 'PASSED', holdCode: null } });
  if (!claimed.count) refuse(409, 'This item is not on hold');
  const held = num(coil.inventory?.qtyOnHold);
  if (held > 0) {
    const moved = await tx.inventory.updateMany({ where: { coilId: coil.id, qtyOnHold: { gte: held } }, data: { qtyOnHold: { decrement: held }, qtyAvailable: { increment: held } } });
    if (!moved.count) refuse(409, 'The stock changed while the hold was being released. Reload and try again.');
  }
  await tx.qCHold.updateMany({ where: { coilId: coil.id, status: 'ACTIVE' }, data: { status: 'RELEASED', disposition: 'USE_AS_IS', resolvedDate: new Date(), resolvedById: userId, resolutionNotes: notes || null } });
}
