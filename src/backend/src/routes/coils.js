/**
 * Stock items ("units": coils, sheets, plates, bars).
 *
 *   GET  /api/coils                 list, filtered and capped (X-Total-Count has the full count)
 *   GET  /api/coils/:id             one item with its heat, stock record, holds and movements
 *   GET  /api/coils/number/:number  the same, by its number
 *   GET  /api/coils/:id/history     everything that happened to the item, newest first
 *   POST /api/coils                 add an item (descriptive fields only; stock arrives by receiving)
 *   PUT  /api/coils/:id             change descriptive fields
 *   POST /api/coils/:id/hold        put the item on hold: what is available becomes "on hold"
 *   POST /api/coils/:id/release     release the hold: the held quantity is available again
 *
 * Cost is sent only to the roles that manage it (COST_VIEWERS). Everyone else
 * gets the list price of the item's product, never what was paid for it.
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';
import { unitPrice } from '../services/intakeCatalogService.js';

const router = Router();

const FORMS = ['COIL', 'SHEET', 'PLATE', 'BAR', 'TUBE', 'BEAM', 'REBAR', 'WIRE', 'ROD', 'SUPPLY'];
const STATUSES = ['AVAILABLE', 'ALLOCATED', 'IN_PROCESS', 'HOLD', 'SHIPPED', 'CONSUMED'];
const QC_STATUSES = ['PENDING', 'PASSED', 'FAILED', 'HOLD'];
const HOLD_TYPES = ['QUALITY', 'CUSTOMER', 'PENDING_TEST', 'DAMAGE', 'DISPUTE', 'OTHER'];
const EDGES = ['MILL', 'SLIT', 'TRIMMED'];
const LIST_DEFAULT = 100;
const LIST_MAX = 500;

class Refuse extends Error { constructor(status, message) { super(message); this.status = status; } }
const refuse = (status, message) => { throw new Refuse(status, message); };
const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof Refuse) return res.status(error.status).json({ error: error.message });
    console.error(`Stock items: ${label} failed:`, error);
    res.status(500).json({ error: `Could not ${label}` });
  }
};

const canSeeCost = (req) => COST_VIEWERS.has(req.user?.role);

/** What a screen may see of an item: list price always, cost only for the roles that manage it. */
function present(coil, req) {
  if (!coil) return coil;
  const out = { ...coil };
  const price = coil.product ? unitPrice(coil.product) : { basePrice: null, priceUnit: 'LB' };
  out.listPrice = price.basePrice;
  out.listPriceUnit = price.priceUnit;
  if (!canSeeCost(req)) {
    delete out.unitCost;
    delete out.landedCost;
    if (out.inventory) { const { unitCost, landedCost, avgCost, ...stock } = out.inventory; out.inventory = stock; }
    for (const key of ['parentCoil', 'childCoils']) {
      if (Array.isArray(out[key])) out[key] = out[key].map(({ unitCost, landedCost, ...rest }) => rest);
      else if (out[key]) { const { unitCost, landedCost, ...rest } = out[key]; out[key] = rest; }
    }
  }
  return out;
}

const DETAIL = {
  heat: { include: { mill: { select: { id: true, code: true, name: true } } } },
  grade: true,
  location: true,
  product: true,
  parentCoil: true,
  childCoils: true,
  inventory: true,
  testResults: true,
  qcHolds: { orderBy: { holdDate: 'desc' } },
  movements: { orderBy: { createdAt: 'desc' }, take: 200 },
};

router.get('/', handle('list stock items', async (req, res) => {
  const { gradeId, grade, status, qcStatus, locationId, form, heatId } = req.query;
  if (status && !STATUSES.includes(status)) refuse(400, 'Unknown status');
  if (qcStatus && !QC_STATUSES.includes(qcStatus)) refuse(400, 'Unknown quality status');
  if (form && !FORMS.includes(form)) refuse(400, 'Unknown form');
  const search = String(req.query.search || '').trim().slice(0, 80);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || LIST_DEFAULT, 1), LIST_MAX);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const where = {
    ...(gradeId && { gradeId: String(gradeId) }),
    ...(grade && { grade: { code: String(grade) } }),
    ...(status && { status }),
    ...(qcStatus && { qcStatus }),
    ...(locationId && { locationId: String(locationId) }),
    ...(heatId && { heatId: String(heatId) }),
    ...(form && { form }),
    ...(search && { OR: [
      { coilNumber: { contains: search, ...ci } },
      { heat: { heatNumber: { contains: search, ...ci } } },
      { grade: { code: { contains: search, ...ci } } },
    ] }),
  };
  const [coils, total] = await Promise.all([
    prisma.coil.findMany({
      where,
      include: { heat: true, grade: true, location: true, product: true, inventory: { select: { qtyOnHand: true, qtyAvailable: true, qtyAllocated: true, qtyOnHold: true, unit: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.coil.count({ where }),
  ]);
  res.setHeader('X-Total-Count', String(total));
  if (coils.length < total) res.setHeader('X-Result-Limited', 'true');
  res.json(coils.map((c) => present(c, req)));
}));

router.get('/number/:coilNumber', handle('load the stock item', async (req, res) => {
  const coil = await prisma.coil.findUnique({ where: { coilNumber: req.params.coilNumber }, include: DETAIL });
  if (!coil) refuse(404, 'Stock item not found');
  res.json(present(coil, req));
}));

router.get('/:id', handle('load the stock item', async (req, res) => {
  const coil = await prisma.coil.findUnique({ where: { id: req.params.id }, include: DETAIL });
  if (!coil) refuse(404, 'Stock item not found');
  res.json(present(coil, req));
}));

// Everything recorded against the item, newest first: movements, holds and releases, reservations.
router.get('/:id/history', handle('load the item history', async (req, res) => {
  const coil = await prisma.coil.findUnique({ where: { id: req.params.id }, select: { id: true, coilNumber: true, createdAt: true, createdBy: { select: { firstName: true, lastName: true } } } });
  if (!coil) refuse(404, 'Stock item not found');
  const who = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : null);
  const [movements, holds, allocations] = await Promise.all([
    prisma.materialMovement.findMany({
      where: { coilId: coil.id }, orderBy: { createdAt: 'desc' }, take: 300,
      include: { fromLocation: { select: { code: true, name: true } }, toLocation: { select: { code: true, name: true } }, order: { select: { orderNumber: true } }, shipment: { select: { shipmentNumber: true } }, createdBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.qCHold.findMany({ where: { coilId: coil.id }, include: { holdBy: { select: { firstName: true, lastName: true } }, resolvedBy: { select: { firstName: true, lastName: true } } } }),
    prisma.orderLineAllocation.findMany({ where: { coilId: coil.id }, include: { orderLine: { select: { lineNumber: true, order: { select: { orderNumber: true } } } } } }),
  ]);
  const events = [
    { at: coil.createdAt, type: 'CREATED', title: 'Item added', detail: coil.coilNumber, by: who(coil.createdBy) },
    ...movements.map((m) => ({
      at: m.createdAt, type: m.movementType, title: m.movementType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      detail: [`${Number(m.qtyMoved)} ${m.unit}`, m.fromLocation && `from ${m.fromLocation.name || m.fromLocation.code}`, m.toLocation && `to ${m.toLocation.name || m.toLocation.code}`, m.order && `order ${m.order.orderNumber}`, m.shipment && `shipment ${m.shipment.shipmentNumber}`, m.notes].filter(Boolean).join(', '),
      by: who(m.createdBy),
    })),
    ...holds.flatMap((h) => [
      { at: h.holdDate, type: 'HOLD', title: 'Put on hold', detail: `${h.holdType.replace(/_/g, ' ').toLowerCase()}: ${h.holdReason}`, by: who(h.holdBy) },
      ...(h.resolvedDate ? [{ at: h.resolvedDate, type: 'RELEASE', title: 'Hold released', detail: h.resolutionNotes || '', by: who(h.resolvedBy) }] : []),
    ]),
    ...allocations.map((a) => ({ at: a.allocatedAt, type: 'RESERVED', title: 'Reserved for an order', detail: `${Number(a.qtyAllocated)} for order ${a.orderLine?.order?.orderNumber || ''} line ${a.orderLine?.lineNumber ?? ''}`.trim(), by: null })),
  ].sort((x, y) => new Date(y.at) - new Date(x.at));
  res.json({ coilNumber: coil.coilNumber, events });
}));

const dec = (name, value, { min = 0, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) refuse(400, `${name} is required`);
    return value === undefined ? undefined : null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || (required && n <= 0)) refuse(400, `${name} must be ${required ? 'more than zero' : 'zero or more'}`);
  return n;
};
const text = (value) => (value === undefined ? undefined : value === null || String(value).trim() === '' ? null : String(value).trim().slice(0, 200));

/** The descriptive fields a screen may set. Status, quantities and location change only through their own actions. */
function editable(body, req) {
  const data = {
    thicknessIn: dec('Thickness', body.thicknessIn),
    widthIn: dec('Width', body.widthIn),
    lengthIn: dec('Length', body.lengthIn),
    odIn: dec('Outside diameter', body.odIn),
    idIn: dec('Inside diameter', body.idIn),
    temper: text(body.temper),
    finish: text(body.finish),
    coating: text(body.coating),
    coatingWeight: text(body.coatingWeight),
    binLocation: text(body.binLocation),
  };
  if (body.gauge !== undefined) data.gauge = body.gauge === null || body.gauge === '' ? null : Math.round(dec('Gauge', body.gauge));
  if (body.edgeCondition !== undefined) {
    if (body.edgeCondition && !EDGES.includes(body.edgeCondition)) refuse(400, 'Unknown edge condition');
    data.edgeCondition = body.edgeCondition || null;
  }
  if (body.unitCost !== undefined || body.landedCost !== undefined) {
    if (!canSeeCost(req)) refuse(403, 'Changing cost needs a manager, the inventory manager or a buyer.');
    data.unitCost = dec('Unit cost', body.unitCost);
    data.landedCost = dec('Landed cost', body.landedCost);
  }
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

router.post('/', handle('add the stock item', async (req, res) => {
  const body = req.body || {};
  const coilNumber = text(body.coilNumber);
  if (!coilNumber) refuse(400, 'An item number is required');
  if (!body.heatId || !body.gradeId) refuse(400, 'Heat and grade are required');
  if (!FORMS.includes(body.form)) refuse(400, 'Unknown form');
  const [heat, grade, owner, location, product, taken] = await Promise.all([
    prisma.heat.findUnique({ where: { id: String(body.heatId) }, select: { id: true } }),
    prisma.grade.findUnique({ where: { id: String(body.gradeId) }, select: { id: true } }),
    body.ownerId ? prisma.organization.findUnique({ where: { id: String(body.ownerId) }, select: { id: true } }) : null,
    body.locationId ? prisma.location.findUnique({ where: { id: String(body.locationId) }, select: { id: true } }) : null,
    body.productId ? prisma.product.findUnique({ where: { id: String(body.productId) }, select: { id: true } }) : null,
    prisma.coil.findUnique({ where: { coilNumber }, select: { id: true } }),
  ]);
  if (taken) refuse(409, `Item number ${coilNumber} is already in use`);
  if (!heat) refuse(400, 'Heat not found');
  if (!grade) refuse(400, 'Grade not found');
  if (body.ownerId && !owner) refuse(400, 'Owner not found');
  if (body.locationId && !location) refuse(400, 'Location not found');
  if (body.productId && !product) refuse(400, 'Product not found');
  const ownerId = owner?.id || (await prisma.user.findUnique({ where: { id: req.user.id }, select: { organizationId: true } }))?.organizationId;
  if (!ownerId) refuse(400, 'An owner is required');
  const netWeightLb = dec('Net weight', body.netWeightLb, { required: true });
  const grossWeightLb = dec('Gross weight', body.grossWeightLb ?? body.netWeightLb, { required: true });
  if (grossWeightLb + 1e-9 < netWeightLb) refuse(400, 'Gross weight cannot be less than net weight');
  const coil = await prisma.coil.create({
    data: {
      ...editable(body, req), coilNumber, form: body.form, heatId: heat.id, gradeId: grade.id, ownerId,
      locationId: location?.id || null, productId: product?.id || null, netWeightLb, grossWeightLb, createdById: req.user.id,
    },
    include: { heat: true, grade: true, location: true, product: true },
  });
  res.status(201).json(present(coil, req));
}));

router.put('/:id', handle('save the stock item', async (req, res) => {
  const before = await prisma.coil.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!before) refuse(404, 'Stock item not found');
  const data = editable(req.body || {}, req);
  if (!Object.keys(data).length) refuse(400, 'Nothing to change. Status, quantity and location change through hold, receiving and transfer.');
  const coil = await prisma.coil.update({ where: { id: before.id }, data, include: { heat: true, grade: true, location: true, product: true } });
  res.json(present(coil, req));
}));

// A hold takes what is available out of sale. Quantity already reserved for an
// order stays reserved, but cannot be shipped while the hold stands.
router.post('/:id/hold', handle('place the hold', async (req, res) => {
  const { holdType, holdReason } = req.body || {};
  if (!HOLD_TYPES.includes(holdType)) refuse(400, 'Choose a hold type');
  const reason = text(holdReason);
  if (!reason) refuse(400, 'A reason is required');
  const result = await prisma.$transaction(async (tx) => {
    const coil = await tx.coil.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, inventory: { select: { qtyAvailable: true } } } });
    if (!coil) refuse(404, 'Stock item not found');
    if (['SHIPPED', 'CONSUMED'].includes(coil.status)) refuse(409, `This item is ${coil.status.toLowerCase()} and cannot be put on hold`);
    const claimed = await tx.coil.updateMany({ where: { id: coil.id, status: { notIn: ['HOLD', 'SHIPPED', 'CONSUMED'] } }, data: { status: 'HOLD', qcStatus: 'HOLD', holdCode: holdType } });
    if (!claimed.count) refuse(409, 'This item is already on hold');
    const available = Number(coil.inventory?.qtyAvailable || 0);
    if (available > 0) {
      const moved = await tx.inventory.updateMany({ where: { coilId: coil.id, qtyAvailable: { gte: available } }, data: { qtyAvailable: { decrement: available }, qtyOnHold: { increment: available } } });
      if (!moved.count) refuse(409, 'The stock changed while the hold was being placed. Reload and try again.');
    }
    const hold = await tx.qCHold.create({ data: { coilId: coil.id, holdType, holdReason: reason, holdById: req.user.id } });
    return { hold, coil: await tx.coil.findUnique({ where: { id: coil.id }, include: { inventory: true } }) };
  });
  res.status(201).json({ hold: result.hold, coil: present(result.coil, req) });
}));

router.post('/:id/release', handle('release the hold', async (req, res) => {
  const notes = text(req.body?.notes);
  const result = await prisma.$transaction(async (tx) => {
    const coil = await tx.coil.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, inventory: { select: { qtyOnHold: true } } } });
    if (!coil) refuse(404, 'Stock item not found');
    const reserved = await tx.orderLineAllocation.count({ where: { coilId: coil.id } });
    const claimed = await tx.coil.updateMany({ where: { id: coil.id, status: 'HOLD' }, data: { status: reserved ? 'ALLOCATED' : 'AVAILABLE', qcStatus: 'PASSED', holdCode: null } });
    if (!claimed.count) refuse(409, 'This item is not on hold');
    const held = Number(coil.inventory?.qtyOnHold || 0);
    if (held > 0) {
      const moved = await tx.inventory.updateMany({ where: { coilId: coil.id, qtyOnHold: { gte: held } }, data: { qtyOnHold: { decrement: held }, qtyAvailable: { increment: held } } });
      if (!moved.count) refuse(409, 'The stock changed while the hold was being released. Reload and try again.');
    }
    await tx.qCHold.updateMany({ where: { coilId: coil.id, status: 'ACTIVE' }, data: { status: 'RELEASED', disposition: 'USE_AS_IS', resolvedDate: new Date(), resolvedById: req.user.id, resolutionNotes: notes } });
    return tx.coil.findUnique({ where: { id: coil.id }, include: { inventory: true, qcHolds: { orderBy: { holdDate: 'desc' } } } });
  });
  res.json({ coil: present(result, req) });
}));

export default router;
