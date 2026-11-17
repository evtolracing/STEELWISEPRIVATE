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
import { takeFromParent } from './stockChanges.js';
import { placeHold } from './holds.js';
import { unitCostFromPrice } from './costing.js';
import { recordMovement } from '../services/ledger.js';

const refuse = (message, status = 400) => Object.assign(new Error(message), { refuse: true, status });

/** Looks up everything a receipt names. Throws a refusal with the reason when something is not on file. */
async function resolve(db, receipt, user) {
  if (await db.coil.findUnique({ where: { coilNumber: receipt.coilNumber }, select: { id: true } })) throw refuse(`Item number ${receipt.coilNumber} is already in use`, 409);

  const parent = receipt.parentTag
    ? await db.coil.findUnique({ where: { coilNumber: receipt.parentTag }, select: { id: true, heatId: true, gradeId: true, ownerId: true, form: true, productId: true, unitCost: true, landedCost: true } })
    : null;
  if (receipt.parentTag && !parent) throw refuse(`Parent item ${receipt.parentTag} is not on file`);

  let heatId = parent?.heatId || null;
  let gradeId = parent?.gradeId || null;
  const byPiece = receipt.unit === 'EA';
  let lotNote = null;
  let heatHasMtr = false;
  if (receipt.gradeCode) {
    const grade = await db.grade.findFirst({ where: { code: { equals: receipt.gradeCode, ...ci } }, select: { id: true, code: true } });
    if (!grade) throw refuse(`Grade ${receipt.gradeCode} is not on file. Add it first, or check the spelling.`);
    if (parent && grade.id !== parent.gradeId) throw refuse(`Parent item ${receipt.parentTag} is a different grade`);
    gradeId = grade.id;
  }
  if (receipt.heatNumber) {
    const heat = await db.heat.findFirst({ where: { heatNumber: { equals: receipt.heatNumber, ...ci } }, select: { id: true, gradeId: true, mtrDocumentId: true, grade: { select: { code: true } } } });
    // A supplier lot on shelf goods is kept with the item; it does not have to be a heat on file.
    if (!heat && byPiece) lotNote = `Lot ${receipt.heatNumber}`;
    else if (!heat) throw refuse(`Heat ${receipt.heatNumber} is not on file. Add it under Heats first, so the item can be traced to its mill certificate.`);
    if (heat && parent && heat.id !== parent.heatId) throw refuse(`Parent item ${receipt.parentTag} is from a different heat`);
    if (heat && gradeId && heat.gradeId !== gradeId) throw refuse(`Heat ${receipt.heatNumber} is grade ${heat.grade.code} on file, not ${receipt.gradeCode}`);
    if (heat) {
      heatId = heat.id;
      gradeId = gradeId || heat.gradeId;
      heatHasMtr = Boolean(heat.mtrDocumentId);
    }
  }

  if (heatId && !receipt.heatNumber) heatHasMtr = Boolean((await db.heat.findUnique({ where: { id: heatId }, select: { mtrDocumentId: true } }))?.mtrDocumentId);

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
    else if (byPiece) throw refuse(`Product ${receipt.productSku} is not in the catalog. Shelf goods are sold by product, so add it to the catalog first.`);
    else warning = `Product ${receipt.productSku} is not in the catalog, so the item was received without a product. It has no list price until one is set.`;
  }
  const form = receipt.form || parent.form;
  const po = receipt.poLineId ? await matchPurchaseLine(db, receipt, { gradeId, productId, locationId: location.id, heatHasMtr, heatId, form }) : null;
  return { heatId, gradeId, locationId: location.id, ownerId, productId, parentCoilId: parent?.id || null, form, warning, lotNote, po,
    // Actual cost per item (K-007): a piece carries its parent's unit cost; a receipt against a purchase order line takes the line's price.
    parentCost: parent ? { unitCost: parent.unitCost ?? null, landedCost: parent.landedCost ?? null } : null };
}

// Converts a receipt to the purchase order line's unit.
const PO_UNITS = { LB: (r) => r.weightLb, LBS: (r) => r.weightLb, CWT: (r) => r.weightLb / 100, TON: (r) => r.weightLb / 2000, EA: (r) => r.pieces, EACH: (r) => r.pieces, PC: (r) => r.pieces, PCS: (r) => r.pieces };
const round4 = (v) => Math.round(v * 10000) / 10000;
const num = (v) => (v == null ? null : Number(v));

/**
 * A receipt against a purchase order line (Phase 6, I-007). The line must be on an open purchase order
 * for the branch receiving it. What does not match the line (grade, product, size outside the line's
 * own tolerance, more than ordered, a certificate the line requires and the heat does not have) is not
 * refused, because the material is on the dock: it is received ON HOLD with the reasons, so it cannot be
 * sold, reserved or cut until a person who has checked it releases the hold.
 */
async function matchPurchaseLine(db, receipt, found) {
  const rows = await db.$queryRaw`SELECT l.id FROM "OrderLine" l WHERE l.id = ${receipt.poLineId} FOR UPDATE`;
  const line = rows.length ? await db.orderLine.findUnique({
    where: { id: receipt.poLineId },
    include: { grade: { select: { code: true } }, product: { select: { sku: true } }, order: { select: { id: true, orderNumber: true, orderType: true, status: true, locationId: true, location: { select: { code: true, name: true } } } } },
  }) : null;
  if (!line || line.order.orderType !== 'PO') throw refuse('That purchase order line is not on file');
  const po = line.order;
  if (po.status === 'DRAFT') throw refuse(`Purchase order ${po.orderNumber} is still a draft: it has not been placed with the supplier`, 409);
  if (['CANCELLED', 'COMPLETE'].includes(po.status)) throw refuse(`Purchase order ${po.orderNumber} is ${po.status.toLowerCase()}. Receive the material without the purchase order, or ask the buyer.`, 409);
  if (line.lineStatus === 'CANCELLED') throw refuse(`Line ${line.lineNumber} of purchase order ${po.orderNumber} is cancelled`, 409);
  if (po.locationId && po.locationId !== found.locationId) {
    throw refuse(`Purchase order ${po.orderNumber} is for ${po.location?.name || po.location?.code || 'another branch'}. Receive it there, or receive it here without the purchase order and transfer it.`, 409);
  }
  const unit = String(line.unit || 'LB').toUpperCase();
  const toLineUnit = PO_UNITS[unit];
  if (!toLineUnit) throw refuse(`Line ${line.lineNumber} of purchase order ${po.orderNumber} is counted in ${line.unit}, which receiving cannot convert to`, 409);
  const qty = toLineUnit(receipt);
  if (qty == null || !(qty > 0)) throw refuse(`Line ${line.lineNumber} is counted in ${line.unit}: give the number of pieces received`);
  const qtyInLineUnit = round4(qty);
  const reasons = [];
  if (line.gradeId && found.gradeId && line.gradeId !== found.gradeId) reasons.push(`grade received is not the grade ordered (${line.grade?.code})`);
  if (line.productId && found.productId && line.productId !== found.productId) reasons.push(`product received is not the product ordered (${line.product?.sku})`);
  for (const [field, label, plusF, minusF] of [['thicknessIn', 'thickness', 'thkTolerancePlus', 'thkToleranceMinus'], ['widthIn', 'width', 'widTolerancePlus', 'widToleranceMinus'], ['lengthIn', 'length', 'lenTolerancePlus', 'lenToleranceMinus']]) {
    const want = num(line[field]); const got = receipt[field];
    if (want == null || got == null) continue;
    const plus = num(line[plusF]) ?? 0; const minus = num(line[minusF]) ?? 0;
    if (got > want + plus + 1e-6 || got < want - minus - 1e-6) reasons.push(`${label} ${got}" is outside the ${want}" ordered${plus || minus ? ` (+${plus}/-${minus})` : ''}`);
  }
  const already = num(line.qtyReceived) || 0;
  const ordered = num(line.qtyOrdered) || 0;
  if (already + qtyInLineUnit > ordered + 1e-6) reasons.push(`more than ordered: ${round4(already + qtyInLineUnit)} ${line.unit} received against ${ordered} ordered`);
  const certs = Array.isArray(line.certRequirements) ? line.certRequirements.map((c) => String(c).toUpperCase()) : [];
  const needsMtr = certs.includes('MTR');
  if (needsMtr && !found.heatHasMtr) reasons.push(found.heatId ? 'the line requires a mill certificate and none is on file for this heat' : 'the line requires a mill certificate and the item has no heat');
  return {
    line, po, qtyInLineUnit, reasons,
    holdType: reasons.length && reasons.every((r) => r.includes('mill certificate')) ? 'PENDING_TEST' : 'DISPUTE',
    receivedAfter: round4(already + qtyInLineUnit), ordered,
  };
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
      const cost = found.parentCost
        ? found.parentCost
        : found.po ? { unitCost: unitCostFromPrice({ unitPrice: found.po.line.unitPrice, priceUnit: found.po.line.priceUnit, stockUnit: receipt.unit }), landedCost: null } : { unitCost: null, landedCost: null };
      const coil = await tx.coil.create({
        data: {
          unitCost: cost.unitCost, landedCost: cost.landedCost,
          coilNumber: receipt.coilNumber, form: found.form, heatId: found.heatId, gradeId: found.gradeId, ownerId: found.ownerId,
          productId: found.productId, parentCoilId: found.parentCoilId, locationId: found.locationId, binLocation: receipt.binLocation,
          thicknessIn: receipt.thicknessIn, widthIn: receipt.widthIn, lengthIn: receipt.lengthIn, odIn: receipt.odIn, idIn: receipt.idIn,
          netWeightLb: receipt.weightLb, grossWeightLb: receipt.weightLb, createdById: user.id,
        },
        include: { heat: { select: { id: true, heatNumber: true } }, grade: { select: { id: true, code: true } }, location: { select: { id: true, code: true, name: true } } },
      });
      // A piece cut from an item on file comes off that item, so the weight is never counted twice.
      if (found.parentCoilId) await takeFromParent(tx, { parentId: found.parentCoilId, parentNumber: receipt.parentTag, weight: Number(receipt.weightLb), childNumber: receipt.coilNumber, userId: user.id });
      let inventory = await tx.inventory.create({ data: { coilId: coil.id, locationId: found.locationId, qtyOnHand: receipt.quantity, qtyAvailable: receipt.quantity, unit: receipt.unit, unitCost: cost.unitCost, landedCost: cost.landedCost, lastMovement: new Date() } });
      const po = found.po;
      const movement = await tx.materialMovement.create({
        data: {
          coilId: coil.id, toLocationId: found.locationId, movementType: 'RECEIVE', qtyMoved: receipt.quantity, unit: receipt.unit, createdById: user.id,
          reasonCode: found.parentCoilId ? 'CUT_PIECE' : source === 'UPLOAD' ? 'UPLOAD' : 'RECEIPT',
          ...(po && { orderId: po.po.id, orderLineId: po.line.id }),
          notes: [po && `PO ${po.po.orderNumber} line ${po.line.lineNumber}: ${po.qtyInLineUnit} ${po.line.unit}`, !po && receipt.poReference && `PO ${receipt.poReference}`, found.lotNote, receipt.notes].filter(Boolean).join('. ') || null,
        },
      });
      await recordMovement(tx, movement, { userId: user.id });
      let hold = null;
      if (po) {
        await tx.orderLine.update({ where: { id: po.line.id }, data: { qtyReceived: po.receivedAfter, lineStatus: po.receivedAfter + 1e-6 >= po.ordered ? 'COMPLETE' : 'PARTIAL' } });
        if (po.reasons.length) {
          hold = await placeHold(tx, { coilId: coil.id, holdType: po.holdType, reason: `Received against PO ${po.po.orderNumber} line ${po.line.lineNumber}, and ${po.reasons.join('; ')}. Check it before it is used.`, userId: user.id });
          inventory = await tx.inventory.findUnique({ where: { coilId: coil.id } });
        }
      }
      return {
        coil, inventory, movement, warning: found.warning, hold,
        ...(po && { purchaseOrder: { id: po.po.id, orderNumber: po.po.orderNumber, lineNumber: po.line.lineNumber, unit: po.line.unit, received: po.receivedAfter, ordered: po.ordered, discrepancies: po.reasons } }),
      };
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
