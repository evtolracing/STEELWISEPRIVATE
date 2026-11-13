/**
 * Receiving stock into the building.
 *
 * One receipt makes one stock item: the item record, its stock balance and a
 * RECEIVE movement, all in one transaction, so stock never exists without the
 * record of how it arrived. The Receive form and the upload file both come
 * through receiveStock(), so they follow one rule (receivingRules.js).
 */
import prisma from './db.js';
import { ci } from './dbText.js';
import { readReceipt } from './receivingRules.js';

const refuse = (message, status = 400) => Object.assign(new Error(message), { refuse: true, status });

/** Looks up everything a receipt names. Throws a refusal with the reason when something is not on file. */
async function resolve(db, receipt, user) {
  if (await db.coil.findUnique({ where: { coilNumber: receipt.coilNumber }, select: { id: true } })) throw refuse(`Item number ${receipt.coilNumber} is already in use`, 409);

  const parent = receipt.parentTag
    ? await db.coil.findUnique({ where: { coilNumber: receipt.parentTag }, select: { id: true, heatId: true, gradeId: true, ownerId: true, form: true, productId: true } })
    : null;
  if (receipt.parentTag && !parent) throw refuse(`Parent item ${receipt.parentTag} is not on file`);

  let heatId = parent?.heatId || null;
  let gradeId = parent?.gradeId || null;
  if (receipt.gradeCode) {
    const grade = await db.grade.findFirst({ where: { code: { equals: receipt.gradeCode, ...ci } }, select: { id: true, code: true } });
    if (!grade) throw refuse(`Grade ${receipt.gradeCode} is not on file. Add it first, or check the spelling.`);
    if (parent && grade.id !== parent.gradeId) throw refuse(`Parent item ${receipt.parentTag} is a different grade`);
    gradeId = grade.id;
  }
  if (receipt.heatNumber) {
    const heat = await db.heat.findFirst({ where: { heatNumber: { equals: receipt.heatNumber, ...ci } }, select: { id: true, gradeId: true, grade: { select: { code: true } } } });
    if (!heat) throw refuse(`Heat ${receipt.heatNumber} is not on file. Add it under Heats first, so the item can be traced to its mill certificate.`);
    if (parent && heat.id !== parent.heatId) throw refuse(`Parent item ${receipt.parentTag} is from a different heat`);
    if (gradeId && heat.gradeId !== gradeId) throw refuse(`Heat ${receipt.heatNumber} is grade ${heat.grade.code} on file, not ${receipt.gradeCode}`);
    heatId = heat.id;
    gradeId = gradeId || heat.gradeId;
  }

  const location = receipt.locationId
    ? await db.location.findUnique({ where: { id: receipt.locationId }, select: { id: true, isActive: true } })
    : await db.location.findFirst({ where: { code: { equals: receipt.locationCode, ...ci } }, select: { id: true, isActive: true } });
  if (!location) throw refuse(`Location ${receipt.locationCode || ''} is not on file`.replace('  ', ' '));
  if (!location.isActive) throw refuse('That location is not in use');

  let ownerId = parent?.ownerId || null;
  if (receipt.ownership === 'CUSTOMER_OWNED') {
    if (receipt.ownerId) {
      const owner = await db.organization.findUnique({ where: { id: receipt.ownerId }, select: { id: true } });
      if (!owner) throw refuse('That customer is not on file');
      ownerId = owner.id;
    } else {
      const matches = await db.organization.findMany({ where: { OR: [{ name: { equals: receipt.customerName, ...ci } }, { code: { equals: receipt.customerName, ...ci } }] }, select: { id: true }, take: 2 });
      if (!matches.length) throw refuse(`Customer "${receipt.customerName}" is not on file`);
      if (matches.length > 1) throw refuse(`More than one customer is called "${receipt.customerName}". Use the customer code.`);
      ownerId = matches[0].id;
    }
  } else if (!parent) {
    ownerId = (await db.user.findUnique({ where: { id: user.id }, select: { organizationId: true } }))?.organizationId || null;
  }
  if (!ownerId) throw refuse('Your sign-in is not linked to a company, so house stock cannot be received. Ask an administrator.');

  let productId = parent?.productId || null;
  let warning = null;
  if (receipt.productSku) {
    const product = await db.product.findFirst({ where: { sku: { equals: receipt.productSku, ...ci } }, select: { id: true } });
    if (product) productId = product.id;
    else warning = `Product ${receipt.productSku} is not in the catalog, so the item was received without a product. It has no list price until one is set.`;
  }
  return { heatId, gradeId, locationId: location.id, ownerId, productId, parentCoilId: parent?.id || null, form: receipt.form || parent.form, warning };
}

/**
 * Receives one stock item. `input` is a form body or an upload row.
 * Returns { coil, inventory, movement, warning }. Throws { refuse, status, message } with the reason when it cannot.
 */
export async function receiveStock({ input, templateType = null, user, source = 'FORM' }) {
  const { receipt, error } = readReceipt(input, templateType);
  if (error) throw refuse(error);
  try {
    return await prisma.$transaction(async (tx) => {
      const found = await resolve(tx, receipt, user);
      const coil = await tx.coil.create({
        data: {
          coilNumber: receipt.coilNumber, form: found.form, heatId: found.heatId, gradeId: found.gradeId, ownerId: found.ownerId,
          productId: found.productId, parentCoilId: found.parentCoilId, locationId: found.locationId, binLocation: receipt.binLocation,
          thicknessIn: receipt.thicknessIn, widthIn: receipt.widthIn, lengthIn: receipt.lengthIn, odIn: receipt.odIn, idIn: receipt.idIn,
          netWeightLb: receipt.weightLb, grossWeightLb: receipt.weightLb, createdById: user.id,
        },
        include: { heat: { select: { id: true, heatNumber: true } }, grade: { select: { id: true, code: true } }, location: { select: { id: true, code: true, name: true } } },
      });
      const inventory = await tx.inventory.create({ data: { coilId: coil.id, locationId: found.locationId, qtyOnHand: receipt.weightLb, qtyAvailable: receipt.weightLb, unit: 'LB', lastMovement: new Date() } });
      const movement = await tx.materialMovement.create({
        data: {
          coilId: coil.id, toLocationId: found.locationId, movementType: 'RECEIVE', qtyMoved: receipt.weightLb, unit: 'LB', createdById: user.id,
          reasonCode: source === 'UPLOAD' ? 'UPLOAD' : 'RECEIPT',
          notes: [receipt.poReference && `PO ${receipt.poReference}`, receipt.notes].filter(Boolean).join('. ') || null,
        },
      });
      return { coil, inventory, movement, warning: found.warning };
    });
  } catch (e) {
    if (e?.code === 'P2002') throw refuse(`Item number ${receipt.coilNumber} is already in use`, 409);
    throw e;
  }
}

/** Recent receipts, newest first. */
export async function recentReceipts({ limit = 50, days = 30 } = {}) {
  const since = new Date(Date.now() - Math.min(Math.max(Number(days) || 30, 1), 366) * 86400000);
  const rows = await prisma.materialMovement.findMany({
    where: { movementType: 'RECEIVE', createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(Number(limit) || 50, 1), 200),
    select: {
      id: true, createdAt: true, qtyMoved: true, unit: true, notes: true, reasonCode: true,
      toLocation: { select: { id: true, code: true, name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      coil: { select: { id: true, coilNumber: true, form: true, status: true, qcStatus: true, thicknessIn: true, widthIn: true, lengthIn: true, heat: { select: { heatNumber: true } }, grade: { select: { code: true } }, owner: { select: { name: true } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id, receivedAt: r.createdAt, qty: Number(r.qtyMoved), unit: r.unit, notes: r.notes, byUpload: r.reasonCode === 'UPLOAD',
    location: r.toLocation, receivedBy: r.createdBy ? `${r.createdBy.firstName || ''} ${r.createdBy.lastName || ''}`.trim() : null,
    item: r.coil ? { id: r.coil.id, coilNumber: r.coil.coilNumber, form: r.coil.form, status: r.coil.status, qcStatus: r.coil.qcStatus, thicknessIn: r.coil.thicknessIn, widthIn: r.coil.widthIn, lengthIn: r.coil.lengthIn, heatNumber: r.coil.heat?.heatNumber, grade: r.coil.grade?.code, owner: r.coil.owner?.name } : null,
  }));
}
