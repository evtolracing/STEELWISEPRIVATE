/**
 * Credit holds on sales orders (rule 32, see creditRules.js).
 *
 * The limit is the one on the customer's top-level account (set under
 * Customers > Preferences). Divisions and branches of a customer share it.
 * Holds and releases are written to the audit log; an order that a manager
 * has released is not held again.
 */
import prisma from './db.js';
import { accountTier } from './customerPricing.js';
import { balanceOf } from './billingRules.js';
import { COMMITTED_STATUSES, OPEN_EXPOSURE_STATUSES, creditPosition, uninvoiced, creditHoldMessage } from './creditRules.js';

export { COMMITTED_STATUSES, creditHoldMessage };
export const HOLD_PLACED = 'CREDIT_HOLD_PLACED';
export const HOLD_RELEASED = 'CREDIT_HOLD_RELEASED';

/** The top-level account and every division or branch under it. */
async function accountFamily(db, topId) {
  const ids = [topId];
  let level = [topId];
  for (let depth = 0; depth < 5 && level.length; depth++) {
    const children = await db.organization.findMany({ where: { parentId: { in: level } }, select: { id: true } });
    level = children.map((c) => c.id).filter((id) => !ids.includes(id));
    ids.push(...level);
  }
  return ids;
}

/** Where the account stands if this order is committed. null when the customer has no credit limit. */
export async function creditCheck(db, { customerId, orderId = null, orderTotal = 0 }) {
  if (!customerId) return null;
  const tier = await accountTier(customerId);
  if (!tier || tier.creditLimit === null || tier.creditLimit === undefined) return null;
  const buyers = await accountFamily(db, tier.customerId);
  const [invoices, orders] = await Promise.all([
    db.invoice.findMany({ where: { status: { not: 'CANCELLED' }, order: { buyerId: { in: buyers } } }, select: { totalAmount: true, paidAmount: true } }),
    db.order.findMany({
      where: { orderType: 'SO', buyerId: { in: buyers }, status: { in: OPEN_EXPOSURE_STATUSES }, ...(orderId && { id: { not: orderId } }) },
      select: { totalAmount: true, invoices: { where: { status: { not: 'CANCELLED' }, kind: 'INVOICE' }, select: { totalAmount: true } } },
    }),
  ]);
  const owed = invoices.reduce((sum, i) => sum + balanceOf(i), 0);
  const openOrders = orders.reduce((sum, o) => sum + uninvoiced(o.totalAmount, o.invoices.reduce((n, i) => n + Number(i.totalAmount), 0)), 0);
  return { accountId: tier.customerId, ...creditPosition({ limit: Number(tier.creditLimit), owed, openOrders, thisOrder: Number(orderTotal) || 0 }) };
}

const lastEvent = (db, orderId, eventType) => db.auditLog.findFirst({ where: { eventType, resourceType: 'Order', resourceId: orderId }, orderBy: { timestamp: 'desc' } });

/** The open credit hold on an order (placed and not yet released), or null. */
export async function openCreditHold(db, orderId) {
  const placed = await lastEvent(db, orderId, HOLD_PLACED);
  if (!placed) return null;
  const released = await lastEvent(db, orderId, HOLD_RELEASED);
  return released && released.timestamp >= placed.timestamp ? null : placed;
}

/**
 * Decides the status an order is saved with when someone moves it to `wanted`.
 * Returns { status, creditHold } where creditHold is null unless the order was put on hold.
 * Call inside the transaction that saves the order, then recordCreditHold() once it has an id.
 */
export async function statusAfterCreditCheck(db, { customerId, orderId, orderTotal, wanted }) {
  if (!COMMITTED_STATUSES.includes(wanted)) return { status: wanted, creditHold: null };
  if (orderId && (await lastEvent(db, orderId, HOLD_RELEASED))) return { status: wanted, creditHold: null };
  const position = await creditCheck(db, { customerId, orderId, orderTotal });
  if (!position || !position.over) return { status: wanted, creditHold: null };
  return { status: 'HOLD', creditHold: { ...position, wantedStatus: wanted, message: creditHoldMessage(position) } };
}

export function recordCreditHold(db, { orderId, orderNumber, creditHold, user }) {
  return db.auditLog.create({
    data: {
      category: 'FINANCIAL', eventType: HOLD_PLACED, severity: 'WARNING', action: 'UPDATE', userId: user?.id || null,
      resourceType: 'Order', resourceId: orderId,
      details: { orderNumber, wantedStatus: creditHold.wantedStatus, accountId: creditHold.accountId, limit: creditHold.limit, owed: creditHold.owed, openOrders: creditHold.openOrders, thisOrder: creditHold.thisOrder, exposure: creditHold.exposure, overBy: creditHold.overBy, by: user?.email || null },
    },
  });
}

/** A manager lets a held order go ahead. Returns the order, or throws { status, message }. */
export async function releaseCreditHold({ orderId, user, note }) {
  const fail = (status, message) => Object.assign(new Error(message), { status, refuse: true });
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true, status: true, buyerId: true, totalAmount: true } });
    if (!order) throw fail(404, 'Order not found');
    const hold = await openCreditHold(tx, order.id);
    if (!hold || order.status !== 'HOLD') throw fail(409, 'This order is not on credit hold');
    const wanted = COMMITTED_STATUSES.includes(hold.details?.wantedStatus) ? hold.details.wantedStatus : 'CONFIRMED';
    const moved = await tx.order.updateMany({ where: { id: order.id, status: 'HOLD' }, data: { status: wanted } });
    if (!moved.count) throw fail(409, 'This order was just changed by someone else. Reload and try again.');
    const now = await creditCheck(tx, { customerId: order.buyerId, orderId: order.id, orderTotal: order.totalAmount });
    await tx.auditLog.create({
      data: {
        category: 'FINANCIAL', eventType: HOLD_RELEASED, severity: 'WARNING', action: 'APPROVE', userId: user.id,
        resourceType: 'Order', resourceId: order.id,
        details: { orderNumber: order.orderNumber, releasedTo: wanted, note: note || null, limit: now?.limit ?? null, exposure: now?.exposure ?? null, overBy: now?.overBy ?? null, by: user.email },
      },
    });
    return tx.order.findUnique({ where: { id: order.id }, include: { lines: true, buyer: true } });
  });
}
