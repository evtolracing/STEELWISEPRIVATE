/**
 * Sales tax for an order typed in by staff (order entry screen, Retail POS).
 *
 * Rule 27 in qa/defect-register.md, decided by the owner on 2026-11-13:
 *   - A tax-exempt customer pays no tax.
 *   - Every other order is taxed at the selling branch's state rate, wherever it ships.
 *   - Only when the selling branch is not known: the ship-to state, then the customer's state.
 *   - A state with no rate on file charges no tax and says so (Admin > Sales Tax Rates).
 */
import prisma from './db.js';
import { ci } from './dbText.js';
import { money } from './billingRules.js';
import { taxStateFor } from './priceRules.js';

export { taxStateFor };

/**
 * The branch an order is sold from: a location named by id, code or city, else the user's home
 * branch. { id, code, state, ownerId } or null. The order, its tax and its seller all follow this
 * one branch (S-008, C-012), so a sale can no longer be taxed for one branch and filed under another.
 */
export async function sellingBranch(user, location) {
  const select = { id: true, code: true, state: true, ownerId: true };
  const key = location ? String(location).trim() : '';
  if (key) {
    const city = key.replace(/_/g, ' ');
    const found = await prisma.location.findFirst({
      where: { isActive: true, OR: [{ id: key }, { code: { equals: key, ...ci } }, { city: { equals: city, ...ci } }, { name: { startsWith: city, ...ci } }] },
      select,
    }).catch(() => null);
    if (found) return found;
  }
  if (!user?.id) return null;
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { homeLocation: { select } } }).catch(() => null);
  return me?.homeLocation || null;
}

/** The state of the branch an order is sold from: a location id, code or city, else the user's home branch. */
export async function branchStateFor(user, location) {
  return (await sellingBranch(user, location))?.state || null;
}

/** { taxRate, taxAmount, taxState, exempt, rateFound } for a subtotal. */
export async function orderTax({ subtotal, customerId, shipToState, branchState }) {
  const amount = Number(subtotal) || 0;
  const customer = customerId
    ? await prisma.organization.findUnique({ where: { id: String(customerId) }, select: { taxExempt: true, state: true } }).catch(() => null)
    : null;
  if (customer?.taxExempt) return { taxRate: 0, taxAmount: 0, taxState: null, exempt: true, rateFound: true };
  const taxState = taxStateFor({ shipToState, customerState: customer?.state, branchState });
  const row = taxState ? await prisma.salesTaxRate.findUnique({ where: { state: taxState } }) : null;
  const taxRate = row ? Number(row.rate) : 0;
  return { taxRate, taxAmount: money(amount * taxRate), taxState, exempt: false, rateFound: Boolean(row) };
}
