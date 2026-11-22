/**
 * Locations: the branches and the storage areas inside them (owner's request, 2026-11-22).
 *
 *   GET    /api/admin/locations                 every location with what is attached to it
 *   GET    /api/admin/locations/:id             one, with its open work and whether it was ever used
 *   GET    /api/admin/locations/:id/history     what was done to it, and by whom
 *   POST   /api/admin/locations                 add one                       locations:add
 *   PUT    /api/admin/locations/:id             change its details            locations:edit
 *   POST   /api/admin/locations/:id/deactivate  switch it off                 locations:remove
 *   POST   /api/admin/locations/:id/reactivate  switch it back on             locations:remove
 *   DELETE /api/admin/locations/:id             delete one that was never used locations:remove
 *
 * The access gate decides who may send each (lib/permissionCatalog.js); the rules for what a location
 * may hold and when it may go are in lib/locationRules.js. Every change is written to the audit log.
 * The system administrators see every branch, so these reads are not narrowed by the top bar's branch.
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { acrossBranches } from '../lib/branchScope.js';
import { changedFields, deactivationBlocks, everUsed, locationInput } from '../lib/locationRules.js';

const router = Router();
const OPEN_ORDERS = ['DRAFT', 'PENDING', 'CONFIRMED', 'PARTIAL', 'HOLD'];
const CLOSED_JOBS = ['SHIPPED', 'COMPLETED', 'CANCELLED'];
const OPEN_SHIPMENTS = ['PENDING', 'LOADING', 'IN_TRANSIT', 'EXCEPTION'];

const WITH = { manager: { select: { id: true, firstName: true, lastName: true, email: true } }, parent: { select: { id: true, code: true, name: true } } };
const num = (v) => (v === null || v === undefined ? null : Number(v));
const row = (l, counts = {}) => ({
  id: l.id, code: l.code, name: l.name, type: l.type, isBranch: l.isBranch, isActive: l.isActive, deactivatedAt: l.deactivatedAt,
  parentId: l.parentId, parentName: l.parent ? l.parent.name : null,
  addressLine1: l.addressLine1, addressLine2: l.addressLine2, city: l.city, state: l.state, postalCode: l.postalCode, country: l.country,
  lat: num(l.lat), lng: num(l.lng), phone: l.phone, fax: l.fax, email: l.email, timezone: l.timezone, hours: l.hours,
  managerId: l.managerId, managerName: l.manager ? [l.manager.firstName, l.manager.lastName].filter(Boolean).join(' ') || l.manager.email : null,
  divisions: l.divisions || [], processes: l.processes || [], squareFeet: l.squareFeet, maxWeightLb: num(l.maxWeightLb),
  isOutdoor: l.isOutdoor, hasCrane: l.hasCrane, sellsFrom: l.sellsFrom, shipsFrom: l.shipsFrom, notes: l.notes,
  createdAt: l.createdAt, updatedAt: l.updatedAt, ...counts,
});

/** What is still open at a location (keeps it from being switched off). */
async function openAt(db, id) {
  const [openOrders, openJobs, stock, openShipments, openTransfers, activeMachines, activeUsers, activeChildren] = await Promise.all([
    db.order.count({ where: { locationId: id, status: { in: OPEN_ORDERS } } }),
    db.dispatchJob.count({ where: { locationId: id, job: { status: { notIn: CLOSED_JOBS } } } }),
    db.inventory.count({ where: { locationId: id, OR: [{ qtyOnHand: { gt: 0 } }, { qtyInTransit: { gt: 0 } }] } }),
    db.shipment.count({ where: { fromLocationId: id, status: { in: OPEN_SHIPMENTS } } }),
    db.stockTransfer.count({ where: { status: 'SHIPPED', OR: [{ fromLocationId: id }, { toLocationId: id }] } }),
    db.workCenter.count({ where: { locationId: id, isActive: true } }),
    db.user.count({ where: { homeLocationId: id, isActive: true } }),
    db.location.count({ where: { parentId: id, isActive: true } }),
  ]);
  return { openOrders, openJobs, stock, openShipments, openTransfers, activeMachines, activeUsers, activeChildren };
}

/** Everything that ever pointed at a location (a location with any of it is never deleted). */
async function usedBy(db, id) {
  const at = { locationId: id };
  const [orders, inventory, coils, shipments, workCenters, users, assigned, operators, assets, packages, plans, rfqs, quotes, transfers, movements, listings, children] = await Promise.all([
    db.order.count({ where: at }), db.inventory.count({ where: at }), db.coil.count({ where: at }),
    db.shipment.count({ where: { fromLocationId: id } }), db.workCenter.count({ where: at }),
    db.user.count({ where: { homeLocationId: id } }), db.userLocation.count({ where: at }), db.operator.count({ where: { homeLocationId: id } }),
    db.asset.count({ where: { siteId: id } }), db.package.count({ where: { currentLocationId: id } }),
    db.dispatchJob.count({ where: at }), db.rFQ.count({ where: at }), db.quote.count({ where: at }),
    db.stockTransfer.count({ where: { OR: [{ fromLocationId: id }, { toLocationId: id }] } }),
    db.materialMovement.count({ where: { OR: [{ fromLocationId: id }, { toLocationId: id }] } }),
    db.dropTagListing.count({ where: { originLocationId: id } }),
    db.location.count({ where: { parentId: id } }),
  ]);
  return { orders, inventory, coils, shipments, workCenters, users, assigned, operators, assets, packages, plans, rfqs, quotes, transfers, movements, listings, children };
}

const audit = (db, req, eventType, action, location, details = {}, fieldChanges = null) => db.auditLog.create({
  data: {
    category: 'DATA', eventType, severity: action === 'DELETE' ? 'WARNING' : 'INFO', action, userId: req.user?.id || null,
    resourceType: 'Location', resourceId: location.id, requestPath: req.originalUrl?.split('?')[0], requestMethod: req.method,
    details: { code: location.code, name: location.name, by: req.user?.email || null, ...details }, ...(fieldChanges && { fieldChanges }),
  },
});

const refuse = (status, message, more = {}) => Object.assign(new Error(message), { status, refuse: true, more });
const answer = (res, error, what) => {
  if (error?.refuse) return res.status(error.status).json({ error: error.message, ...error.more });
  if (error?.code === 'P2002') return res.status(409).json({ error: 'Another location already has that code' });
  console.error(`Locations: ${what} failed:`, error);
  return res.status(500).json({ error: `The location could not be ${what}` });
};

/** A manager and a parent that exist; a parent that is not the location itself or inside it. */
async function checkLinks(db, data, selfId = null) {
  if (data.managerId) {
    const manager = await db.user.findUnique({ where: { id: data.managerId }, select: { id: true, isActive: true } });
    if (!manager || !manager.isActive) throw refuse(400, 'The manager picked is not an active user');
  }
  if (data.parentId) {
    if (data.parentId === selfId) throw refuse(400, 'A location cannot be inside itself');
    let parent = await db.location.findUnique({ where: { id: data.parentId }, select: { id: true, parentId: true } });
    if (!parent) throw refuse(400, 'The location it is inside of was not found');
    for (let i = 0; i < 10 && parent?.parentId; i += 1) {
      if (parent.parentId === selfId) throw refuse(400, 'A location cannot be inside one of its own storage areas');
      parent = await db.location.findUnique({ where: { id: parent.parentId }, select: { id: true, parentId: true } });
    }
  }
}

router.get('/', async (req, res) => {
  try {
    const data = await acrossBranches(async () => {
      const [locations, users, machines, orders] = await Promise.all([
        prisma.location.findMany({ include: WITH, orderBy: [{ isActive: 'desc' }, { isBranch: 'desc' }, { code: 'asc' }], take: 2000 }),
        prisma.user.groupBy({ by: ['homeLocationId'], where: { isActive: true, homeLocationId: { not: null } }, _count: { _all: true } }),
        prisma.workCenter.groupBy({ by: ['locationId'], where: { isActive: true }, _count: { _all: true } }),
        prisma.order.groupBy({ by: ['locationId'], where: { status: { in: OPEN_ORDERS }, locationId: { not: null } }, _count: { _all: true } }),
      ]);
      const by = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r._count._all]));
      const u = by(users, 'homeLocationId'); const m = by(machines, 'locationId'); const o = by(orders, 'locationId');
      return locations.map((l) => row(l, { users: u[l.id] || 0, workCenters: m[l.id] || 0, openOrders: o[l.id] || 0 }));
    });
    res.json({ data });
  } catch (error) { answer(res, error, 'listed'); }
});

router.get('/:id', async (req, res) => {
  try {
    const out = await acrossBranches(async () => {
      const location = await prisma.location.findUnique({ where: { id: req.params.id }, include: WITH });
      if (!location) throw refuse(404, 'Location not found');
      const [open, used] = await Promise.all([openAt(prisma, location.id), usedBy(prisma, location.id)]);
      return { data: row(location), open, blocks: deactivationBlocks(open), used, everUsed: everUsed(used) };
    });
    res.json(out);
  } catch (error) { answer(res, error, 'read'); }
});

// What was done to a location and by whom, newest first (a deleted one keeps its history under its id).
router.get('/:id/history', async (req, res) => {
  try {
    const rows = await prisma.auditLog.findMany({
      where: { resourceType: 'Location', resourceId: req.params.id }, orderBy: { timestamp: 'desc' }, take: 200,
      select: { id: true, timestamp: true, eventType: true, details: true, fieldChanges: true, user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json({ data: rows.map((r) => ({ id: r.id, at: r.timestamp, eventType: r.eventType, by: r.user ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email : r.details?.by || null, details: r.details, changes: r.fieldChanges })) });
  } catch (error) { answer(res, error, 'read'); }
});

router.post('/', async (req, res) => {
  try {
    const { data, error } = locationInput(req.body, { creating: true });
    if (error) return res.status(400).json({ error });
    const created = await prisma.$transaction(async (tx) => {
      await checkLinks(tx, data);
      if (await tx.location.findUnique({ where: { code: data.code }, select: { id: true } })) throw refuse(409, `Another location already has the code ${data.code}`);
      const ownerId = req.user?.organizationId || (await tx.organization.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } }))?.id;
      if (!ownerId) throw refuse(409, 'No organization is on file to own the location');
      const location = await tx.location.create({ data: { ...data, ownerId, isActive: true }, include: WITH });
      await audit(tx, req, 'LOCATION_ADDED', 'CREATE', location, { isBranch: location.isBranch });
      return location;
    });
    res.status(201).json({ data: row(created) });
  } catch (error) { answer(res, error, 'added'); }
});

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = locationInput(req.body);
    if (error) return res.status(400).json({ error });
    const saved = await acrossBranches(() => prisma.$transaction(async (tx) => {
      const before = await tx.location.findUnique({ where: { id: req.params.id } });
      if (!before) throw refuse(404, 'Location not found');
      await checkLinks(tx, data, before.id);
      const isBranch = data.isBranch ?? before.isBranch;
      const parentId = data.parentId !== undefined ? data.parentId : before.parentId;
      if (isBranch && parentId) throw refuse(400, 'A branch cannot sit inside another location. Clear "inside of" or mark it a storage area.');
      if (before.isBranch && data.isBranch === false) {
        const open = await openAt(tx, before.id);
        const blocks = deactivationBlocks({ ...open, activeChildren: 0 });
        if (blocks.length) throw refuse(409, 'This location is in use as a branch, so it cannot become a storage area.', { blocks });
      }
      const changes = changedFields(before, data);
      if (!Object.keys(changes).length) return tx.location.findUnique({ where: { id: before.id }, include: WITH });
      const location = await tx.location.update({ where: { id: before.id }, data, include: WITH });
      await audit(tx, req, 'LOCATION_CHANGED', 'UPDATE', location, {}, JSON.parse(JSON.stringify(changes)));
      return location;
    }));
    res.json({ data: row(saved) });
  } catch (error) { answer(res, error, 'saved'); }
});

router.post('/:id/deactivate', async (req, res) => {
  try {
    const moveUsersTo = String(req.body?.moveUsersTo || '').trim() || null;
    const saved = await acrossBranches(() => prisma.$transaction(async (tx) => {
      const before = await tx.location.findUnique({ where: { id: req.params.id } });
      if (!before) throw refuse(404, 'Location not found');
      if (!before.isActive) throw refuse(409, 'That location is already switched off');
      let moved = 0;
      if (moveUsersTo) {
        const to = await tx.location.findUnique({ where: { id: moveUsersTo }, select: { id: true, isActive: true, isBranch: true, name: true } });
        if (!to || !to.isActive || !to.isBranch || to.id === before.id) throw refuse(400, 'People can only be moved to another active branch');
        moved = (await tx.user.updateMany({ where: { homeLocationId: before.id }, data: { homeLocationId: to.id } })).count;
        await tx.operator.updateMany({ where: { homeLocationId: before.id }, data: { homeLocationId: to.id } });
      }
      const open = await openAt(tx, before.id);
      const blocks = deactivationBlocks(open);
      if (blocks.length) throw refuse(409, `${before.name} still has work or people attached, so it was not switched off.`, { blocks, open });
      // Nobody is left assigned to a branch that is off.
      await tx.userLocation.deleteMany({ where: { locationId: before.id } });
      const location = await tx.location.update({ where: { id: before.id }, data: { isActive: false, deactivatedAt: new Date() }, include: WITH });
      await audit(tx, req, 'LOCATION_DEACTIVATED', 'UPDATE', location, { reason: String(req.body?.reason || '').slice(0, 500) || null, peopleMoved: moved, movedTo: moveUsersTo });
      return location;
    }));
    res.json({ data: row(saved), message: `${saved.name} is switched off. It is out of every branch list and its history is kept.` });
  } catch (error) { answer(res, error, 'switched off'); }
});

router.post('/:id/reactivate', async (req, res) => {
  try {
    const saved = await acrossBranches(() => prisma.$transaction(async (tx) => {
      const before = await tx.location.findUnique({ where: { id: req.params.id } });
      if (!before) throw refuse(404, 'Location not found');
      if (before.isActive) throw refuse(409, 'That location is already active');
      if (before.parentId) {
        const parent = await tx.location.findUnique({ where: { id: before.parentId }, select: { isActive: true, name: true } });
        if (parent && !parent.isActive) throw refuse(409, `${parent.name}, which it is inside of, is switched off. Switch that on first.`);
      }
      const location = await tx.location.update({ where: { id: before.id }, data: { isActive: true, deactivatedAt: null }, include: WITH });
      await audit(tx, req, 'LOCATION_REACTIVATED', 'UPDATE', location);
      return location;
    }));
    res.json({ data: row(saved), message: `${saved.name} is active again.` });
  } catch (error) { answer(res, error, 'switched on'); }
});

router.delete('/:id', async (req, res) => {
  try {
    const gone = await acrossBranches(() => prisma.$transaction(async (tx) => {
      const before = await tx.location.findUnique({ where: { id: req.params.id } });
      if (!before) throw refuse(404, 'Location not found');
      const used = await usedBy(tx, before.id);
      if (everUsed(used)) {
        const what = Object.entries(used).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(', ');
        throw refuse(409, `${before.name} has records attached (${what}), so it cannot be deleted. Switch it off instead: that removes it from every list and keeps its history.`, { used });
      }
      await tx.location.delete({ where: { id: before.id } });
      await audit(tx, req, 'LOCATION_DELETED', 'DELETE', before, { type: before.type, isBranch: before.isBranch, city: before.city, state: before.state });
      return before;
    }));
    res.json({ message: `${gone.name} was deleted. It had never been used.` });
  } catch (error) {
    if (error?.code === 'P2003') return res.status(409).json({ error: 'Records are attached to that location, so it cannot be deleted. Switch it off instead.' });
    answer(res, error, 'deleted');
  }
});

export default router;
