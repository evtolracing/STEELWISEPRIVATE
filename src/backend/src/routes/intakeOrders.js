/**
 * Intake Orders API — CSR order-entry backed by Prisma Order model.
 *
 * Stores intake-specific metadata (source, division, location, priority,
 * ownership, customerName) as a JSON blob in the order.notes field with
 * a `__intakeMeta__` key, so the raw notes text is preserved alongside.
 *
 * Routes:
 *   POST   /              → create a new intake order
 *   GET    /              → list intake orders
 *   GET    /:id           → get single intake order
 *   PATCH  /:id           → update an intake order
 *   POST   /:id/submit    → submit (DRAFT → PENDING)
 *   POST   /:id/create-work-orders → generate Jobs from order lines
 */
import { statusAfterCreditCheck, recordCreditHold, openCreditHold, creditHoldMessage } from '../lib/creditControl.js';
import { can } from '../lib/roleStore.js';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { money } from '../lib/billingRules.js';
import { orderMoveError, positiveQty } from '../lib/workflowRules.js';
import { releaseAllocations } from './orders.js';
import { walkInAccount } from './quickSale.js';
import { orderTax, branchStateFor, sellingBranch } from '../lib/orderTax.js';
import { branchesOf } from '../lib/branchScope.js';
import { readSpecs, specColumns, specsOfLine } from '../lib/lineSpecs.js';

const router = Router();

// ─── helpers ──────────────────────────────────────────────────────────

/** Validate that a value looks like a UUID and actually exists in the given table */
async function resolveProductId(val) {
  if (!val) return null;
  try {
    const found = await prisma.product.findUnique({ where: { id: val }, select: { id: true } });
    return found ? found.id : null;
  } catch { return null; }
}

async function resolveGradeId(val) {
  if (!val) return null;
  try {
    const found = await prisma.grade.findUnique({ where: { id: val }, select: { id: true } });
    return found ? found.id : null;
  } catch { return null; }
}

/** Pack user-visible notes + intake metadata into a single notes string */
export function packNotes(userNotes, meta) {
  const blob = { __intakeMeta__: meta, userNotes: userNotes || '' };
  return JSON.stringify(blob);
}

/** Unpack notes string → { userNotes, meta } */
export function unpackNotes(raw) {
  if (!raw) return { userNotes: '', meta: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__intakeMeta__) {
      return { userNotes: parsed.userNotes || '', meta: parsed.__intakeMeta__ };
    }
  } catch { /* not JSON, treat as plain text */ }
  return { userNotes: raw, meta: {} };
}

/** Generate the next order number */
export async function nextOrderNumber() {
  const count = await prisma.order.count();
  return `SO-${String(count + 1).padStart(5, '0')}`;
}

/** Creates a sales order with the next free SO number; `create(orderNumber)` does the insert. */
export function createSalesOrder(create) {
  return createNumbered({ count: () => prisma.order.count(), format: padded('SO'), create });
}

/** Map a DB Order row → the shape the intake frontend expects */
function mapOrderForIntake(order) {
  const { userNotes, meta } = unpackNotes(order.notes);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status === 'PENDING' ? 'SUBMITTED' : order.status,
    source: meta.source || 'PHONE',
    division: meta.division || 'METALS',
    location: meta.location || 'JACKSON',
    priority: meta.priority || 'STANDARD',
    ownership: meta.ownership || 'HOUSE',
    poNumber: order.poReference || '',
    notes: userNotes,
    requestedDate: order.requiredDate ? order.requiredDate.toISOString().split('T')[0] : null,
    customerId: order.buyerId,
    customerName: order.buyer?.name || meta.customerName || '',
    lines: (order.lines || []).map(mapLineForIntake),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString(),
    submittedAt: meta.submittedAt || null,
    subtotal: order.subtotal == null ? null : Number(order.subtotal),
    taxAmount: order.taxAmount == null ? null : Number(order.taxAmount),
    freightAmount: order.freightAmount == null ? null : Number(order.freightAmount),
    totalAmount: order.totalAmount == null ? null : Number(order.totalAmount),
    tax: meta.tax || null,
    // pass through for order board / detail
    orderType: order.orderType,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
  };
}

function mapLineForIntake(line) {
  let processes = [];
  try { processes = JSON.parse(line.notes || '[]'); } catch { processes = []; }
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    description: line.description || '',
    productId: line.productId,
    gradeId: line.gradeId,
    qty: Number(line.qtyOrdered || 0),
    uom: line.unit || 'LB',
    unitPrice: Number(line.unitPrice || 0),
    extPrice: Number(line.extendedPrice || 0),
    processes,
    thicknessIn: line.thicknessIn ? Number(line.thicknessIn) : null,
    widthIn: line.widthIn ? Number(line.widthIn) : null,
    lengthIn: line.lengthIn ? Number(line.lengthIn) : null,
  };
}

const ORDER_INCLUDE = {
  buyer: { select: { id: true, name: true, code: true, phone: true, email: true } },
  seller: { select: { id: true, name: true } },
  lines: { orderBy: { lineNumber: 'asc' } },
};

// The entry screen prices a line per pound, per piece or per foot.
const UOM_PRICE_UNIT = { LB: 'LB', LBS: 'LB', EA: 'EACH', EACH: 'EACH', PC: 'EACH', PCS: 'EACH', FT: 'LF', LF: 'LF', CWT: 'CWT', TON: 'TON' };
const EDITABLE = ['DRAFT', 'PENDING'];
const refuse = (status, error) => ({ status, error });

/** Checks the lines the screen sent and turns them into order lines. { error } or { lines, totals }. */
/** The requirements on an order line in words, for a work order: size, grade, finish, tolerances, certificates, notes. */
function requirementText(line) {
  const r = specsOfLine(line);
  const size = ['thicknessIn', 'widthIn', 'lengthIn'].map((k) => r[k]).filter((v) => v != null).join(' x ');
  const tol = [['thk', 'thickness'], ['wid', 'width'], ['len', 'length']].map(([k, w]) => (r[`${k}TolerancePlus`] != null || r[`${k}ToleranceMinus`] != null ? `${w} +${r[`${k}TolerancePlus`] ?? 0}/-${r[`${k}ToleranceMinus`] ?? 0}` : null)).filter(Boolean);
  return [
    size && `Size ${size} in`, r.gradeOverride && `Grade ${r.gradeOverride}`, r.surfaceFinish && `Finish ${r.surfaceFinish}`,
    r.tolerancePreset && `Tolerance ${r.tolerancePreset}`, tol.length ? `Tolerances ${tol.join(', ')}` : null,
    Array.isArray(r.certRequirements) && r.certRequirements.length ? `Certificates ${r.certRequirements.join(', ')}` : null, r.specNotes,
  ].filter(Boolean).join(' · ');
}

async function buildIntakeLines(lines) {
  if (!Array.isArray(lines)) return refuse(400, 'lines must be a list');
  if (lines.length > 500) return refuse(400, 'An order can have at most 500 lines');
  const out = [];
  for (const [idx, raw] of lines.entries()) {
    const line = raw || {};
    const n = idx + 1;
    const qty = positiveQty(line.qty ?? line.qtyOrdered);
    if (qty === null) return refuse(400, `Line ${n}: quantity must be more than zero`);
    const amount = (v, label) => {
      if (v === undefined || v === null || v === '') return null;
      const num = Number(v);
      return Number.isFinite(num) && num >= 0 ? num : refuse(400, `Line ${n}: ${label} must be zero or more`);
    };
    const unitPrice = amount(line.unitPrice, 'price');
    if (unitPrice?.error) return unitPrice;
    const given = amount(line.extPrice ?? line.extendedPrice, 'line total');
    if (given?.error) return given;
    const uom = String(line.uom || line.unit || 'LB').toUpperCase().slice(0, 10);
    // Tolerances, certificates, finish and other requirements, when the screen sends them (J-001).
    const asked = readSpecs({ ...line, thicknessIn: undefined, widthIn: undefined, lengthIn: undefined });
    if (asked.error) return refuse(400, `Line ${n}: ${asked.error}`);
    out.push({
      ...specColumns(asked.specs),
      lineNumber: n,
      description: String(line.description || 'Material').slice(0, 500),
      // Only store productId / gradeId if they reference real DB records
      productId: await resolveProductId(line.productId),
      gradeId: await resolveGradeId(line.gradeId),
      qtyOrdered: qty,
      unit: uom,
      unitPrice,
      priceUnit: UOM_PRICE_UNIT[uom] || 'LB',
      // The line total the screen worked out (a remnant is priced on its weight); otherwise quantity × price.
      extendedPrice: given !== null ? money(given) : unitPrice !== null ? money(qty * unitPrice) : null,
      thicknessIn: line.thicknessIn || null,
      widthIn: line.widthIn || null,
      lengthIn: line.lengthIn || null,
      // Store processes array in line notes as JSON
      notes: line.processes ? JSON.stringify(line.processes) : null,
    });
  }
  const priced = out.length > 0 && out.every((l) => l.extendedPrice !== null);
  const subtotal = priced ? money(out.reduce((sum, l) => sum + l.extendedPrice, 0)) : null;
  return { lines: out, subtotal };
}

/**
 * Order totals: line subtotal, sales tax worked out here (lib/orderTax.js), and
 * any freight already on the order. Returns { data, tax }.
 */
async function totalsFor(req, { subtotal, customerId, meta = {}, freightAmount = 0 }) {
  if (subtotal === null || subtotal === undefined) return { data: { subtotal: null, taxAmount: null, totalAmount: null }, tax: null };
  const tax = await orderTax({
    subtotal,
    customerId,
    shipToState: meta.shipToState,
    branchState: await branchStateFor(req.user, meta.location),
  });
  return {
    data: { subtotal, taxAmount: tax.taxAmount, totalAmount: money(subtotal + tax.taxAmount + (Number(freightAmount) || 0)) },
    tax: { state: tax.taxState, rate: tax.taxRate, exempt: tax.exempt, rateFound: tax.rateFound },
  };
}

async function customerError(customerId) {
  if (!customerId) return null;
  const found = await prisma.organization.findUnique({ where: { id: String(customerId) }, select: { id: true, isActive: true } }).catch(() => null);
  if (!found) return 'Customer not found';
  return found.isActive === false ? 'That customer account is not active' : null;
}

const validDate = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };

// ─── POST / — create ────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const {
      source, division, location, priority, ownership,
      poNumber, notes, requestedDate,
      customerId, customerName,
      lines = [],
      status,
    } = req.body || {};

    if (status !== undefined && !['DRAFT', 'SUBMITTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'A new order is saved as a draft or submitted' });
    }
    const badCustomer = await customerError(customerId);
    if (badCustomer) return res.status(400).json({ error: badCustomer });
    const built = await buildIntakeLines(lines);
    if (built.error) return res.status(built.status).json({ error: built.error });
    // Even a draft has to hold something (B-008).
    if (!customerId && !customerName && !built.lines.length) return res.status(400).json({ error: 'A draft needs a customer or at least one line' });
    const submitted = status === 'SUBMITTED' || status === 'PENDING';
    // A Retail POS sale with no account is sold to the walk-in account.
    const buyerId = customerId || (source === 'RETAIL' ? (await walkInAccount()).id : null);
    if (submitted && (!buyerId || !built.lines.length)) {
      return res.status(400).json({ error: 'An order needs a customer and at least one line before it is submitted' });
    }
    const required = requestedDate ? validDate(requestedDate) : null;
    if (requestedDate && !required) return res.status(400).json({ error: 'The requested date is not a valid date' });

    // The branch the order is sold from: the one the screen named, else the person's home branch.
    // The order belongs to it, is taxed for it, and the company that owns it is the seller
    // (S-008, C-012). Only with no branch at all is the old company lookup used.
    const branch = await sellingBranch(req.user, location);
    const seller = branch?.ownerId ? { id: branch.ownerId } : await prisma.organization.findFirst({ where: { code: 'ALRO' } });

    const shipToState = req.body?.shipToState ? String(req.body.shipToState).trim().toUpperCase().slice(0, 2) : undefined;
    const meta = { source, division, location, priority, ownership, customerName, ...(shipToState && { shipToState }) };
    const totals = await totalsFor(req, { subtotal: built.subtotal, customerId: buyerId, meta });
    if (totals.tax) meta.tax = totals.tax;

    // Rule 32: an order that would put the account over its credit limit is saved on hold.
    const gate = submitted
      ? await statusAfterCreditCheck(prisma, { customerId: buyerId, orderTotal: totals.data.totalAmount, wanted: 'PENDING' })
      : { status: 'DRAFT', creditHold: null };

    const order = await createSalesOrder((orderNumber) => prisma.order.create({
      data: {
        orderNumber,
        orderType: 'SO',
        status: gate.status,
        buyerId,
        sellerId: seller?.id || null,
        ...(branch && { locationId: branch.id }),
        poReference: poNumber || null,
        requiredDate: required,
        notes: packNotes(notes, meta),
        ...totals.data,
        // The person signed in is the person who entered the order.
        createdById: req.user.id,
        lines: { create: built.lines },
      },
      include: ORDER_INCLUDE,
    }));
    if (gate.creditHold) await recordCreditHold(prisma, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user: req.user });

    res.status(201).json({ data: mapOrderForIntake(order), ...(gate.creditHold && { creditHold: gate.creditHold, warning: gate.creditHold.message }) });
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'The order has a field that is not valid' });
    }
    console.error('Error creating intake order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── GET / — list ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { status, source, division, limit = '50', offset = '0' } = req.query;

    const where = { orderType: 'SO' };
    if (status) {
      // Map frontend statuses to DB
      if (status === 'SUBMITTED') where.status = 'PENDING';
      else if (status === 'DRAFT') where.status = 'DRAFT';
      else where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200),
        skip: Math.max(parseInt(offset, 10) || 0, 0),
      }),
      prisma.order.count({ where }),
    ]);

    let mapped = orders.map(mapOrderForIntake);

    // Post-filter by intake metadata fields (source, division)
    if (source) mapped = mapped.filter(o => o.source === source);
    if (division) mapped = mapped.filter(o => o.division === division);

    res.json({ data: mapped, meta: { total } });
  } catch (error) {
    console.error('Error listing intake orders:', error);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

// ─── GET /summary — the signed-in person's own sales figures ────────

// GET /api/orders/intake/branches: the branches this person may sell from, and their home branch.
// The entry screens list these instead of a fixed list in the browser (S-008, U-011).
router.get('/branches', async (req, res) => {
  try {
    const allowed = branchesOf(req.user);
    const rows = await prisma.location.findMany({
      where: { isActive: true, ...(allowed && { id: { in: allowed } }) },
      select: { id: true, code: true, name: true, city: true, state: true }, orderBy: { code: 'asc' }, take: 500,
    });
    const home = req.user?.homeLocationId && rows.some((r) => r.id === req.user.homeLocationId) ? req.user.homeLocationId : rows[0]?.id || null;
    res.json({ data: rows, homeLocationId: home, allBranches: allowed === null });
  } catch (error) {
    console.error('Intake branches failed:', error);
    res.status(500).json({ error: 'The branches could not be loaded' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const mine = { orderType: 'SO', createdById: req.user.id };
    const live = { ...mine, status: { notIn: ['CANCELLED', 'DRAFT'] } };
    const [ordersToday, drafts, monthAgg, openQuotes] = await Promise.all([
      prisma.order.count({ where: { ...live, createdAt: { gte: today } } }),
      prisma.order.count({ where: { ...mine, status: 'DRAFT' } }),
      prisma.order.aggregate({ where: { ...live, createdAt: { gte: month } }, _sum: { subtotal: true }, _count: { _all: true } }),
      prisma.quote.count({ where: { status: { in: ['DRAFT', 'SENT'] } } }).catch(() => null),
    ]);
    const revenueMTD = Number(monthAgg._sum.subtotal || 0);
    const ordersMTD = monthAgg._count._all;
    res.json({ data: {
      ordersToday, drafts, ordersMTD,
      revenueMTD: Math.round(revenueMTD * 100) / 100,
      avgOrderValue: ordersMTD ? Math.round((revenueMTD / ordersMTD) * 100) / 100 : 0,
      quotesOpen: openQuotes,
    } });
  } catch (error) {
    console.error('Error loading intake summary:', error);
    res.status(500).json({ error: 'Failed to load sales figures' });
  }
});

// ─── GET /:id — single order ────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const hold = order.status === 'HOLD' ? await openCreditHold(prisma, order.id) : null;
    res.json({ data: { ...mapOrderForIntake(order), ...(hold && { creditHold: { ...hold.details, placedAt: hold.timestamp, message: creditHoldMessage(hold.details), canRelease: can(req, 'orders:releaseCreditHold') } }) } });
  } catch (error) {
    console.error('Error fetching intake order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ─── PATCH /:id — update ────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    });
    if (!existing || existing.orderType !== 'SO') return res.status(404).json({ error: 'Order not found' });

    const {
      source, division, location, priority, ownership,
      poNumber, notes, requestedDate,
      customerId, customerName,
      lines,
      status,
    } = req.body || {};

    // The entry screen edits an order until it is confirmed. After that the
    // order has work orders, reservations and shipments that depend on its lines.
    if (!EDITABLE.includes(existing.status)) {
      return res.status(409).json({ error: `A ${existing.status.toLowerCase()} order cannot be edited on the entry screen` });
    }
    let nextStatus;
    if (status !== undefined) {
      nextStatus = status === 'SUBMITTED' ? 'PENDING' : status;
      if (!EDITABLE.includes(nextStatus)) return res.status(409).json({ error: 'The entry screen can only save a draft or submit it' });
      const why = orderMoveError(existing.status, nextStatus);
      if (why) return res.status(409).json({ error: why });
    }
    if (customerId !== undefined) {
      const badCustomer = await customerError(customerId);
      if (badCustomer) return res.status(400).json({ error: badCustomer });
    }
    let built = null;
    if (lines !== undefined) {
      built = await buildIntakeLines(lines);
      if (built.error) return res.status(built.status).json({ error: built.error });
    }
    let required;
    if (requestedDate !== undefined) {
      required = requestedDate ? validDate(requestedDate) : null;
      if (requestedDate && !required) return res.status(400).json({ error: 'The requested date is not a valid date' });
    }

    // Merge metadata
    const { userNotes: existingNotes, meta: existingMeta } = unpackNotes(existing.notes);
    const newMeta = {
      ...existingMeta,
      ...(source !== undefined && { source }),
      ...(division !== undefined && { division }),
      ...(location !== undefined && { location }),
      ...(priority !== undefined && { priority }),
      ...(ownership !== undefined && { ownership }),
      ...(customerName !== undefined && { customerName }),
    };

    if (req.body?.shipToState !== undefined) newMeta.shipToState = req.body.shipToState ? String(req.body.shipToState).trim().toUpperCase().slice(0, 2) : undefined;
    const updateData = {};
    if (poNumber !== undefined) updateData.poReference = poNumber || null;
    if (required !== undefined) updateData.requiredDate = required;
    if (customerId !== undefined) updateData.buyerId = customerId || (newMeta.source === 'RETAIL' ? (await walkInAccount()).id : null);
    if (nextStatus !== undefined) updateData.status = nextStatus;
    if (location !== undefined) {
      const branch = await sellingBranch(req.user, location);
      if (branch) { updateData.locationId = branch.id; if (branch.ownerId) updateData.sellerId = branch.ownerId; }
    }
    // Lines, customer, branch or ship-to changed: work the totals and tax out again.
    const totals = await totalsFor(req, {
      subtotal: built ? built.subtotal : (existing.subtotal === null ? null : Number(existing.subtotal)),
      customerId: updateData.buyerId !== undefined ? updateData.buyerId : existing.buyerId,
      meta: newMeta,
      freightAmount: existing.freightAmount,
    });
    Object.assign(updateData, totals.data);
    if (totals.tax) newMeta.tax = totals.tax; else delete newMeta.tax;
    updateData.notes = packNotes(notes !== undefined ? notes : existingNotes, newMeta);

    // Rule 32: a submitted order is checked against the credit limit with its new total.
    const endsAs = updateData.status !== undefined ? updateData.status : existing.status;
    const gate = await statusAfterCreditCheck(prisma, {
      customerId: updateData.buyerId !== undefined ? updateData.buyerId : existing.buyerId,
      orderId: existing.id,
      orderTotal: updateData.totalAmount !== undefined ? updateData.totalAmount : existing.totalAmount,
      wanted: endsAs,
    });
    if (gate.creditHold) updateData.status = 'HOLD';

    const order = await prisma.$transaction(async (tx) => {
      // Guard against the order being confirmed or cancelled by someone else meanwhile.
      const held = await tx.order.updateMany({ where: { id: existing.id, status: existing.status }, data: { updatedAt: new Date() } });
      if (!held.count) return null;
      if (built) {
        if (await tx.job.count({ where: { orderId: existing.id } })) return { blocked: 'This order already has work orders, so its lines cannot be replaced' };
        // Replacing the lines: reserved stock goes back on the shelf first.
        await releaseAllocations(tx, existing.id);
        await tx.orderLine.deleteMany({ where: { orderId: existing.id } });
        await tx.orderLine.createMany({ data: built.lines.map((l) => ({ ...l, orderId: existing.id })) });
      }
      const saved = await tx.order.update({ where: { id: existing.id }, data: updateData, include: ORDER_INCLUDE });
      if (gate.creditHold) await recordCreditHold(tx, { orderId: saved.id, orderNumber: saved.orderNumber, creditHold: gate.creditHold, user: req.user });
      return saved;
    });
    if (!order) return res.status(409).json({ error: 'This order was just changed by someone else. Reload and try again.' });
    if (order.blocked) return res.status(409).json({ error: order.blocked });

    res.json({ data: mapOrderForIntake(order), ...(gate.creditHold && { creditHold: gate.creditHold, warning: gate.creditHold.message }) });
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'The order has a field that is not valid' });
    }
    console.error('Error updating intake order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── POST /:id/submit — submit order ────────────────────────────────

router.post('/:id/submit', async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { lines: true } } },
    });
    if (!existing || existing.orderType !== 'SO') return res.status(404).json({ error: 'Order not found' });
    if (!EDITABLE.includes(existing.status)) {
      return res.status(409).json({ error: `A ${existing.status.toLowerCase()} order cannot be submitted again` });
    }
    if (!existing.buyerId) return res.status(400).json({ error: 'Pick a customer before submitting the order' });
    if (!existing._count.lines) return res.status(400).json({ error: 'Add at least one line before submitting the order' });

    // Update metadata with submittedAt
    const { userNotes, meta } = unpackNotes(existing.notes);
    if (!meta.submittedAt) meta.submittedAt = new Date().toISOString();

    const gate = await statusAfterCreditCheck(prisma, { customerId: existing.buyerId, orderId: existing.id, orderTotal: existing.totalAmount, wanted: 'PENDING' });
    const moved = await prisma.order.updateMany({
      where: { id: existing.id, status: existing.status },
      data: { status: gate.status, notes: packNotes(userNotes, meta) },
    });
    if (!moved.count) return res.status(409).json({ error: 'This order was just changed by someone else. Reload and try again.' });
    const order = await prisma.order.findUnique({ where: { id: existing.id }, include: ORDER_INCLUDE });
    if (gate.creditHold) await recordCreditHold(prisma, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user: req.user });

    // The order desk asks for the work orders in the same step, so the order is on the Order Board
    // (New Orders) as soon as it is submitted. An order on credit hold waits for a manager first.
    let made = null;
    if (req.body?.createWorkOrders === true && !gate.creditHold) {
      try { made = await workOrdersFor(order.id, req.user); } catch (error) {
        console.error('Error creating work orders after submit:', error);
        made = { status: 500, body: { error: 'The work orders could not be created' } };
      }
    }
    const after = made?.jobs ? await prisma.order.findUnique({ where: { id: existing.id }, include: ORDER_INCLUDE }) : order;
    res.json({
      data: mapOrderForIntake(after),
      ...(gate.creditHold && { creditHold: gate.creditHold, warning: gate.creditHold.message }),
      ...(made?.jobs && { workOrders: made.jobs }),
      // Submitted, but the work orders were not made: the screen says so and the order page still offers the button.
      ...(made && !made.jobs && { workOrdersError: made.body?.error || 'The work orders could not be created', ...(made.body?.creditHold && { creditHold: made.body.creditHold, warning: made.body.error }) }),
    });
  } catch (error) {
    console.error('Error submitting intake order:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// ─── POST /:id/create-work-orders — generate Jobs from order lines ──

/**
 * Makes the work orders of a sales order: confirms the order, then one job per line that has none.
 * Returns { status, body } for a refusal, or { jobs }. Used by the Create Work Orders button and by
 * a submit that asks for them in the same step.
 */
async function workOrdersFor(orderId, user) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: { orderBy: { lineNumber: 'asc' } }, buyer: true },
    });
    if (!order || order.orderType !== 'SO') return { status: 404, body: { error: 'Order not found' } };
    if (order.status === 'HOLD' && (await openCreditHold(prisma, order.id))) {
      return { status: 409, body: { error: 'This order is on credit hold. A manager releases it before work orders can be created.' } };
    }
    if (!['DRAFT', 'PENDING', 'CONFIRMED'].includes(order.status)) {
      return { status: 409, body: { error: `Work orders cannot be created for a ${order.status.toLowerCase()} order` } };
    }
    if (!order.lines.length) return { status: 400, body: { error: 'The order has no lines to make work orders for' } };

    const { meta } = unpackNotes(order.notes);

    // Map priority label → int (DB stores int 1-5)
    const priorityMap = { EMERGENCY: 5, HOT: 5, RUSH: 4, STANDARD: 3, LOW: 2 };
    const priorityInt = priorityMap[meta.priority] || 3;

    // Confirm the order first. Only one request can make this move, so pressing
    // the button twice cannot start two sets of work orders.
    if (order.status !== 'CONFIRMED') {
      const gate = await statusAfterCreditCheck(prisma, { customerId: order.buyerId, orderId: order.id, orderTotal: order.totalAmount, wanted: 'CONFIRMED' });
      const moved = await prisma.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: gate.status } });
      if (!moved.count) return { status: 409, body: { error: 'This order was just changed by someone else. Reload and try again.' } };
      if (gate.creditHold) {
        await recordCreditHold(prisma, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user });
        return { status: 409, body: { error: gate.creditHold.message, creditHold: gate.creditHold } };
      }
    }

    const jobs = [];
    for (const line of order.lines) {
      // A line that already has a work order keeps it.
      const already = await prisma.job.findFirst({ where: { orderLineId: line.id, status: { not: 'CANCELLED' } } });
      // Parse processes from line notes
      let processes = [];
      try { processes = JSON.parse(line.notes || '[]'); } catch { processes = []; }
      if (!Array.isArray(processes)) processes = [];

      // Determine operation type from processes or description
      const opType = (processes.length > 0)
        ? processes.map(p => p.name || p.type || p).join(' + ')
        : 'PROCESSING';

      const job = already || await createNumbered({ count: () => prisma.job.count(), format: padded('JOB'), create: (jobNumber) => prisma.job.create({
        data: {
          jobNumber,
          orderId: order.id,
          orderLineId: line.id,
          status: 'ORDERED',
          operationType: opType,
          priority: priorityInt,
          scheduledStart: order.requiredDate || null,
          scheduledEnd: order.requiredDate || null,
          inputWeightLb: line.qtyOrdered || null,
          // The shop floor gets what the customer asked for, not only the line's description (J-009).
          instructions: [line.description, requirementText(line)].filter(Boolean).join(' · ').slice(0, 2000) || null,
          notes: JSON.stringify({
            customerName: order.buyer?.name || meta.customerName || '',
            orderNumber: order.orderNumber,
            lineNumber: line.lineNumber,
            processes,
            requirements: specsOfLine(line),
          }),
          createdById: user.id,
        },
      }) });
      jobs.push({
        id: job.id,
        jobNumber: job.jobNumber,
        orderId: job.orderId,
        orderLineId: job.orderLineId,
        status: job.status,
        operationType: job.operationType,
        processes,
        existing: Boolean(already),
        createdAt: job.createdAt?.toISOString(),
      });
    }

    return { jobs };
}

router.post('/:id/create-work-orders', async (req, res) => {
  try {
    const made = await workOrdersFor(req.params.id, req.user);
    if (!made.jobs) return res.status(made.status).json(made.body);
    res.json({ data: { workOrders: made.jobs, count: made.jobs.length } });
  } catch (error) {
    console.error('Error creating work orders:', error);
    res.status(500).json({ error: 'Failed to create work orders' });
  }
});

export default router;
