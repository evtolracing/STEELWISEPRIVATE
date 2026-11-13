/**
 * The branch boundary (owner's decision 2 of 2026-11-13, finding B-003).
 *
 *   Staff see and change only the records of their own branches.
 *   Super admin and high-level management see every branch.
 *
 * A user's branches are the home branch plus any branches assigned in UserLocation
 * (that is how a regional manager gets a group of branches). The roles in
 * ALL_BRANCH_ROLES are not limited. Customer and partner logins are held to their
 * own account by lib/customerScope.js and are not limited by branch.
 *
 * The rule is enforced in one place, underneath every route: the database client
 * (lib/db.js) adds the branch to each read of a branch-owned record and refuses a
 * change to one outside the user's branches. A route does not have to remember it.
 *
 * Branch-owned records and where their branch comes from:
 *   Order            its selling branch (Order.locationId, filled from the user's home branch)
 *   OrderLine        its order
 *   Invoice, InvoiceLine, Payment   the order invoiced
 *   Inventory, Coil  the branch the stock is at
 *   Shipment, ShipmentItem          the branch it ships from
 *   Job              the branch of its order, or of the work center it runs on
 *   WorkCenter, DispatchJob, DispatchOperation   the branch of the work center
 *   WorkOrder        the branch its source stock item is at
 *   MaterialMovement the branch it left or the branch it arrived at
 * Shared across branches: customers, products, grades, heats, prices, tax rates, users.
 */
import { requestContext } from './requestContext.js';
import { EXTERNAL_ROLES } from './roleAccess.js';

export const ALL_BRANCH_ROLES = new Set([
  'SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN',
  'EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'OPS_MANAGER', 'SALES_DIRECTOR', 'CREDIT_MANAGER',
  'DATA_ANALYST', 'AUDITOR', 'INTEGRATION_ADMIN',
]);

/** null = every branch. Otherwise the list of branch ids this user is held to (possibly empty). */
export function branchesOf(user) {
  if (!user || EXTERNAL_ROLES.has(user.role) || ALL_BRANCH_ROLES.has(user.role)) return null;
  const ids = new Set((user.userLocations || []).map((l) => l.locationId));
  if (user.homeLocationId) ids.add(user.homeLocationId);
  return [...ids];
}

const direct = (field, moves = false) => ({ field, moves, where: (ids) => ({ [field]: { in: ids } }) });
const through = (where) => ({ where });
const orderIn = (ids) => ({ locationId: { in: ids } });

export const BRANCH_OWNED = {
  Order: direct('locationId'),
  OrderLine: through((ids) => ({ order: orderIn(ids) })),
  Invoice: through((ids) => ({ order: orderIn(ids) })),
  InvoiceLine: through((ids) => ({ invoice: { order: orderIn(ids) } })),
  Payment: through((ids) => ({ invoice: { order: orderIn(ids) } })),
  // Stock moves to another branch by transfer, so a change of branch is not refused here.
  Inventory: direct('locationId', true),
  Coil: direct('locationId', true),
  Shipment: direct('fromLocationId'),
  ShipmentItem: through((ids) => ({ shipment: { fromLocationId: { in: ids } } })),
  Job: through((ids) => ({ OR: [
    { order: orderIn(ids) },
    { workCenter: { locationId: { in: ids } } },
    { orderId: null, workCenterId: null, createdBy: { homeLocationId: { in: ids } } },
  ] })),
  WorkOrder: through((ids) => ({ sourceCoil: { locationId: { in: ids } } })),
  WorkCenter: direct('locationId'),
  DispatchJob: direct('locationId'),
  DispatchOperation: through((ids) => ({ dispatchJob: { locationId: { in: ids } } })),
  MaterialMovement: through((ids) => ({ OR: [{ fromLocationId: { in: ids } }, { toLocationId: { in: ids } }] })),
};

const FILTERED = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

export class OutsideBranch extends Error {
  constructor(message) { super(message); this.name = 'OutsideBranch'; this.status = 403; }
}

/**
 * Returns the arguments to run the query with. Pure: the same inputs give the same output.
 *   scope: { branches: string[] | null, home: string | null, bypass: number } or undefined (no request).
 */
export function scopedArgs(model, operation, args, scope) {
  const rule = BRANCH_OWNED[model];
  if (!rule || !scope) return args;
  // A new order belongs to the branch of the person entering it unless the route named one.
  if (model === 'Order' && operation === 'create' && scope.home && args?.data && args.data.locationId === undefined && args.data.location === undefined) {
    args = { ...args, data: { ...args.data, locationId: scope.home } };
  }
  if (scope.branches === null || scope.bypass > 0) return args;
  const ids = scope.branches;
  if (operation === 'create' || operation === 'createMany' || operation === 'upsert') {
    if (rule.field) {
      const rows = operation === 'upsert' ? [args.create] : [].concat(args?.data || []);
      for (const row of rows) {
        const to = row?.[rule.field];
        if (to !== undefined && to !== null && !ids.includes(to)) throw new OutsideBranch('That record belongs to another branch.');
      }
    }
    if (operation !== 'upsert') return args;
  }
  // An order or shipment cannot be handed to a branch the user is not in.
  if ((operation === 'update' || operation === 'updateMany') && rule.field && !rule.moves) {
    const to = args?.data?.[rule.field];
    const value = to && typeof to === 'object' ? to.set : to;
    if (value !== undefined && value !== null && !ids.includes(value)) throw new OutsideBranch('That record belongs to another branch.');
  }
  if (!FILTERED.has(operation)) return args;
  return { ...args, where: { ...(args?.where || {}), AND: [].concat(args?.where?.AND || [], rule.where(ids)) } };
}

export const currentScope = () => requestContext.getStore()?.branchScope;

/** Called once per request, after sign-in. */
export function setBranchScope(user) {
  const store = requestContext.getStore();
  if (store) store.branchScope = { branches: branchesOf(user), home: user?.homeLocationId || null, bypass: 0 };
}

/**
 * Runs one deliberate step across branches: the receiving side of a transfer, where the
 * sender has already been checked against their own branch. Use it for that and nothing else.
 */
export async function acrossBranches(work) {
  const scope = currentScope();
  if (!scope) return work();
  scope.bypass += 1;
  try { return await work(); } finally { scope.bypass -= 1; }
}
