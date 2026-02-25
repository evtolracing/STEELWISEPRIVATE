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
import { Router } from 'express';
import prisma from '../lib/db.js';

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
function packNotes(userNotes, meta) {
  const blob = { __intakeMeta__: meta, userNotes: userNotes || '' };
  return JSON.stringify(blob);
}

/** Unpack notes string → { userNotes, meta } */
function unpackNotes(raw) {
  if (!raw) return { userNotes: '', meta: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__intakeMeta__) {
      return { userNotes: parsed.userNotes || '', meta: parsed.__intakeMeta__ };
    }
  } catch { /* not JSON, treat as plain text */ }
  return { userNotes: raw, meta: {} };
}

/** Get the default system / CSR user id so we can satisfy the required createdById */
async function getSystemUserId() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ role: 'CSR' }, { role: 'SUPER_ADMIN' }] },
    orderBy: { role: 'asc' },
  });
  return user?.id || null;
}

/** Generate the next order number */
async function nextOrderNumber() {
  const count = await prisma.order.count();
  return `SO-${String(count + 1).padStart(5, '0')}`;
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

// ─── POST / — create ────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const {
      source, division, location, priority, ownership,
      poNumber, notes, requestedDate,
      customerId, customerName,
      lines = [],
      status,
    } = req.body;

    const createdById = await getSystemUserId();
    if (!createdById) {
      return res.status(500).json({ error: 'No system user found — run database seed first' });
    }

    // Look up seller (Alro Steel)
    const seller = await prisma.organization.findFirst({ where: { code: 'ALRO' } });

    const meta = { source, division, location, priority, ownership, customerName };
    const orderNumber = await nextOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: 'SO',
        status: status === 'SUBMITTED' ? 'PENDING' : 'DRAFT',
        buyerId: customerId || null,
        sellerId: seller?.id || null,
        poReference: poNumber || null,
        requiredDate: requestedDate ? new Date(requestedDate) : null,
        notes: packNotes(notes, meta),
        createdById,
        lines: {
          create: await Promise.all(lines.map(async (line, idx) => {
            // Only store productId / gradeId if they reference real DB records
            const validProductId = await resolveProductId(line.productId);
            const validGradeId = await resolveGradeId(line.gradeId);
            return {
              lineNumber: idx + 1,
              description: line.description || line.productId || 'Material',
              productId: validProductId,
              gradeId: validGradeId,
              qtyOrdered: line.qty || line.qtyOrdered || 1,
              unit: line.uom || line.unit || 'LB',
              unitPrice: line.unitPrice || null,
              extendedPrice: line.extPrice || line.extendedPrice || null,
              thicknessIn: line.thicknessIn || null,
              widthIn: line.widthIn || null,
              lengthIn: line.lengthIn || null,
              // Store processes array in line notes as JSON
              notes: line.processes ? JSON.stringify(line.processes) : null,
            };
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    res.status(201).json({ data: mapOrderForIntake(order) });
  } catch (error) {
    console.error('Error creating intake order:', error);
    res.status(500).json({ error: 'Failed to create order: ' + error.message });
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
        take: parseInt(limit),
        skip: parseInt(offset),
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

// ─── GET /:id — single order ────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ data: mapOrderForIntake(order) });
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
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const {
      source, division, location, priority, ownership,
      poNumber, notes, requestedDate,
      customerId, customerName,
      lines,
      status,
    } = req.body;

    // Merge metadata
    const { meta: existingMeta } = unpackNotes(existing.notes);
    const newMeta = {
      ...existingMeta,
      ...(source !== undefined && { source }),
      ...(division !== undefined && { division }),
      ...(location !== undefined && { location }),
      ...(priority !== undefined && { priority }),
      ...(ownership !== undefined && { ownership }),
      ...(customerName !== undefined && { customerName }),
    };

    const updateData = {};
    if (notes !== undefined) updateData.notes = packNotes(notes, newMeta);
    else updateData.notes = packNotes(existingMeta.userNotes || '', newMeta);
    if (poNumber !== undefined) updateData.poReference = poNumber;
    if (requestedDate !== undefined) updateData.requiredDate = new Date(requestedDate);
    if (customerId !== undefined) updateData.buyerId = customerId;
    if (status !== undefined) {
      updateData.status = status === 'SUBMITTED' ? 'PENDING' : status;
    }

    // Update lines if provided: delete old + create new
    if (lines && Array.isArray(lines)) {
      await prisma.orderLine.deleteMany({ where: { orderId: req.params.id } });
      const lineData = await Promise.all(lines.map(async (line, idx) => {
        const validProductId = await resolveProductId(line.productId);
        const validGradeId = await resolveGradeId(line.gradeId);
        return {
          orderId: req.params.id,
          lineNumber: idx + 1,
          description: line.description || line.productId || 'Material',
          productId: validProductId,
          gradeId: validGradeId,
          qtyOrdered: line.qty || line.qtyOrdered || 1,
          unit: line.uom || line.unit || 'LB',
          unitPrice: line.unitPrice || null,
          extendedPrice: line.extPrice || line.extendedPrice || null,
          thicknessIn: line.thicknessIn || null,
          widthIn: line.widthIn || null,
          lengthIn: line.lengthIn || null,
          notes: line.processes ? JSON.stringify(line.processes) : null,
        };
      }));
      await prisma.orderLine.createMany({ data: lineData });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: ORDER_INCLUDE,
    });

    res.json({ data: mapOrderForIntake(order) });
  } catch (error) {
    console.error('Error updating intake order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── POST /:id/submit — submit order ────────────────────────────────

router.post('/:id/submit', async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    // Update metadata with submittedAt
    const { userNotes, meta } = unpackNotes(existing.notes);
    meta.submittedAt = new Date().toISOString();

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'PENDING',
        notes: packNotes(userNotes, meta),
      },
      include: ORDER_INCLUDE,
    });

    res.json({ data: mapOrderForIntake(order) });
  } catch (error) {
    console.error('Error submitting intake order:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// ─── POST /:id/create-work-orders — generate Jobs from order lines ──

async function nextJobNumber() {
  const count = await prisma.job.count();
  return `JOB-${String(count + 1).padStart(5, '0')}`;
}

router.post('/:id/create-work-orders', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lines: { orderBy: { lineNumber: 'asc' } }, buyer: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const createdById = await getSystemUserId();
    const { meta } = unpackNotes(order.notes);

    // Map priority label → int (DB stores int 1-5)
    const priorityMap = { EMERGENCY: 5, HOT: 5, RUSH: 4, STANDARD: 3, LOW: 2 };
    const priorityInt = priorityMap[meta.priority] || 3;

    const jobs = [];
    for (const line of order.lines) {
      // Parse processes from line notes
      let processes = [];
      try { processes = JSON.parse(line.notes || '[]'); } catch { processes = []; }

      // Determine operation type from processes or description
      const opType = (processes.length > 0)
        ? processes.map(p => p.name || p.type || p).join(' + ')
        : 'PROCESSING';

      const jobNumber = await nextJobNumber();
      const job = await prisma.job.create({
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
          instructions: line.description || null,
          notes: JSON.stringify({
            customerName: order.buyer?.name || meta.customerName || '',
            orderNumber: order.orderNumber,
            lineNumber: line.lineNumber,
            processes,
          }),
          createdById,
        },
      });
      jobs.push({
        id: job.id,
        jobNumber: job.jobNumber,
        orderId: job.orderId,
        orderLineId: job.orderLineId,
        status: job.status,
        operationType: job.operationType,
        processes,
        createdAt: job.createdAt?.toISOString(),
      });
    }

    // Update order status to CONFIRMED
    await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });

    res.json({ data: { workOrders: jobs, count: jobs.length } });
  } catch (error) {
    console.error('Error creating work orders:', error);
    res.status(500).json({ error: 'Failed to create work orders: ' + error.message });
  }
});

export default router;
