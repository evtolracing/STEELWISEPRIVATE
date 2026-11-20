/**
 * Packages and drop tags.
 *
 * A package is opened for an order line, filled, sent to quality, released, tagged, and sealed:
 *
 *   package  OPEN -> PACKING (first item) -> READY_FOR_QC (packer says it is full)
 *            -> QC_RELEASED (quality)  or  QC_HOLD (quality, with a reason; released from there)
 *            -> SEALED (every live tag applied)
 *   tag      DRAFT -> READY_TO_PRINT (package released) -> PRINTED -> APPLIED -> SEALED (with the package)
 *            any state before delivery -> VOID (with a reason; after it has left, a manager and a claim number)
 *
 * Rules kept here (Phase 8, findings N-008 to N-013):
 *  - Every step is one save: the status, who did it and the custody record are written together,
 *    and a step is refused when someone else has already taken it.
 *  - The custody record carries the role the person really has, never a fixed one.
 *  - Numbers come from a counter, one after another, never from chance.
 *  - A package names a real order line; an item names a real stock item (its heat and grade are
 *    read from the item, not typed) or a heat that is on file. Pieces and weight are more than zero.
 *  - One live tag per package. A package is sealed only with a live tag, all applied.
 */
import crypto from 'crypto';
import prisma from '../lib/db.js';
import { currentScope } from '../lib/branchScope.js';
import { STAFF_GROUPS } from '../lib/roleAccess.js';

export class TagRefusal extends Error {
  constructor(status, message) { super(message); this.status = status; this.refused = true; }
}
const refuse = (status, message) => { throw new TagRefusal(status, message); };
const num = (v) => Number(v || 0);

export const PACKAGE_TYPES = ['BUNDLE', 'SKID', 'BOX', 'CRATE', 'DRUM'];
export const REPRINT_REASONS = ['DAMAGED_TAG', 'ILLEGIBLE_PRINT', 'TAG_FELL_OFF', 'CUSTOMER_REQUEST', 'ADDITIONAL_COPY'];
export const REPRINTS_WITHOUT_MANAGER = 3;
const MANAGERS = new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'QC_MANAGER']);
const isManager = (role) => MANAGERS.has(role);
const PRINTED_STATES = ['PRINTED', 'APPLIED', 'SEALED', 'STAGED', 'LOADED', 'SHIPPED'];
const LEFT_THE_DOCK = ['LOADED', 'SHIPPED'];

/** The next number of a series, taken inside the save that uses it: no gaps from a refused save, no repeats. */
export async function nextNumber(tx, series, prefix, width = 7) {
  const rows = await tx.$queryRaw`
    INSERT INTO "DocumentCounter" ("series", "lastNumber", "updatedAt") VALUES (${series}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("series") DO UPDATE SET "lastNumber" = "DocumentCounter"."lastNumber" + 1, "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastNumber"`;
  return `${prefix}-${String(rows[0].lastNumber).padStart(width, '0')}`;
}

/** The custody record of one step, written in the same save as the step. */
export async function createTraceEvent(db, data) {
  const occurredAt = new Date();
  const eventId = crypto.randomUUID();
  const eventHash = crypto.createHash('sha256')
    .update(JSON.stringify({ eventId, eventType: data.eventType, resourceId: data.resourceId, occurredAt, metadata: data.metadata ?? null }))
    .digest('hex');
  return db.traceEvent.create({
    data: {
      eventId, eventHash, occurredAt,
      eventType: data.eventType, eventCategory: data.eventCategory,
      actorUserId: data.actorUserId, actorRole: data.actorRole || 'UNKNOWN', actorName: data.actorName,
      resourceType: data.resourceType, resourceId: data.resourceId,
      previousState: data.previousState, newState: data.newState,
      locationId: data.locationId, stationId: data.stationId,
      beforeSnapshot: data.beforeSnapshot, afterSnapshot: data.afterSnapshot, metadata: data.metadata,
      correlationId: data.correlationId, orderId: data.orderId, shipmentId: data.shipmentId, dropTagId: data.dropTagId,
    },
  });
}

/** Pure: what stops a package being tagged. `pkg` carries packageItems. */
export function taggingProblems(pkg) {
  const errors = []; const warnings = [];
  const validStatuses = ['PACKING', 'READY_FOR_QC', 'QC_RELEASED'];
  if (!validStatuses.includes(pkg.status)) errors.push(`Package status ${pkg.status} is not valid for tagging. Must be in: ${validStatuses.join(', ')}`);
  if (pkg.qcStatus === 'HOLD') errors.push('Package is on QC hold. Cannot generate tags until released.');
  if (pkg.qcStatus === 'REJECTED') errors.push('Package has been rejected by QC. Cannot generate tags.');
  if (!pkg.orderId || !pkg.orderLineId) errors.push('The package is not on an order line. A drop tag names the customer and the line.');
  const items = pkg.packageItems || [];
  if (!items.length) errors.push('Package has no items. Add items before generating tags.');
  const grades = [...new Set(items.map((i) => i.grade))]; const forms = [...new Set(items.map((i) => i.form))];
  const heats = [...new Set(items.map((i) => i.heatNumber).filter(Boolean))];
  if (grades.length > 1) errors.push(`Mixed grades detected: ${grades.join(', ')}. Split package or get override.`);
  if (forms.length > 1) errors.push(`Mixed forms detected: ${forms.join(', ')}. Split package or get override.`);
  if (heats.length > 1) warnings.push(`Multiple heats detected: ${heats.join(', ')}. This may require customer approval.`);
  return { errors, warnings, heats };
}

async function validatePackageForTagging(packageId, db = prisma) {
  const pkg = await db.package.findUnique({ where: { id: packageId }, include: { packageItems: true, order: true, orderLine: true } });
  if (!pkg) return { valid: false, errors: ['Package not found'] };
  const { errors, warnings, heats } = taggingProblems(pkg);
  return {
    valid: errors.length === 0, errors, warnings,
    materialSummary: { grade: pkg.packageItems?.[0]?.grade || 'Unknown', form: pkg.packageItems?.[0]?.form || 'Unknown', heatNumbers: heats, qcStatus: pkg.qcStatus },
    package: pkg,
  };
}

/** Locks one package row for the rest of the save, so two people cannot take the same step. */
async function lockPackage(tx, id) {
  await tx.$queryRaw`SELECT 1 FROM "Package" WHERE "id" = ${id} FOR UPDATE`;
  const pkg = await tx.package.findUnique({ where: { id }, include: { packageItems: true, dropTags: true } });
  if (!pkg) refuse(404, 'Package not found');
  return pkg;
}
/** Moves a tag only if it is still in the state this person saw. */
async function moveTag(tx, tag, from, data) {
  const moved = await tx.dropTag.updateMany({ where: { id: tag.id, status: { in: [].concat(from) } }, data });
  if (!moved.count) refuse(409, 'This tag was just changed by someone else. Reload and try again.');
}

export async function generateDropTag({ packageId, userId, role, templateCode }) {
  return prisma.$transaction(async (tx) => {
    const locked = await lockPackage(tx, packageId);
    const validation = await validatePackageForTagging(packageId, tx);
    if (!validation.valid) refuse(409, `Validation failed: ${validation.errors.join('; ')}`);
    if (locked.dropTags.some((t) => t.status !== 'VOID')) refuse(409, 'This package already has a tag. Void it before making another.');
    const pkg = validation.package;
    const firstItem = pkg.packageItems[0];
    const heats = validation.materialSummary.heatNumbers;
    // What kind of material it is comes from the order line's product, else its grade. It is not assumed to be steel.
    const of = await tx.orderLine.findUnique({ where: { id: pkg.orderLineId }, select: { product: { select: { division: true } }, grade: { select: { family: true } } } });
    const division = of?.product?.division || of?.grade?.family || 'NOT RECORDED';
    const dropTag = await tx.dropTag.create({
      data: {
        dropTagId: await nextNumber(tx, 'DT', 'DT'),
        packageId, orderId: pkg.orderId, orderLineId: pkg.orderLineId, jobId: pkg.jobId,
        customerId: pkg.order.buyerId, customerPO: pkg.order.poReference,
        division: String(division),
        form: firstItem.form, grade: firstItem.grade, specification: firstItem.specification, condition: firstItem.condition,
        dimensions: firstItem.dimensions, lengthFeet: firstItem.lengthFeet,
        heatNumber: heats.length === 1 ? heats[0] : null,
        pieces: pkg.packageItems.reduce((sum, item) => sum + item.pieces, 0),
        weightLbs: pkg.packageItems.reduce((sum, item) => sum + num(item.weightLbs), 0),
        workCenters: [], operatorIds: [], status: 'DRAFT', createdBy: userId,
      },
      include: { package: true, order: true, orderLine: true },
    });
    await createTraceEvent(tx, {
      eventType: 'DROP_TAG_GENERATED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role,
      resourceType: 'DropTag', resourceId: dropTag.id, newState: 'DRAFT', dropTagId: dropTag.id, orderId: pkg.orderId,
      metadata: { packageId, templateCode, warnings: validation.warnings },
    });
    return { dropTag, warnings: validation.warnings };
  });
}

export async function validateAndReadyToPrint(dropTagId, userId, role) {
  return prisma.$transaction(async (tx) => {
    const dropTag = await tx.dropTag.findUnique({ where: { id: dropTagId }, include: { package: true } });
    if (!dropTag) refuse(404, 'Drop tag not found');
    if (dropTag.status !== 'DRAFT') refuse(409, `Cannot validate tag in ${dropTag.status} status`);
    if (dropTag.package.qcStatus !== 'RELEASED' && dropTag.package.qcStatus !== 'CONDITIONAL') refuse(409, 'Package must be QC released before printing tags');
    await moveTag(tx, dropTag, 'DRAFT', { status: 'READY_TO_PRINT' });
    await createTraceEvent(tx, { eventType: 'DROP_TAG_VALIDATED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role, resourceType: 'DropTag', resourceId: dropTagId, previousState: 'DRAFT', newState: 'READY_TO_PRINT', dropTagId });
    return tx.dropTag.findUnique({ where: { id: dropTagId } });
  });
}

export async function printDropTag(dropTagId, { stationId, userId, role, templateCode, copies = 1 }) {
  return prisma.$transaction(async (tx) => {
    const dropTag = await tx.dropTag.findUnique({ where: { id: dropTagId } });
    if (!dropTag) refuse(404, 'Drop tag not found');
    if (dropTag.status !== 'READY_TO_PRINT') refuse(409, `Cannot print tag in ${dropTag.status} status`);
    await moveTag(tx, dropTag, 'READY_TO_PRINT', { status: 'PRINTED', printedBy: userId, printedAt: new Date() });
    const event = await createTraceEvent(tx, { eventType: 'DROP_TAG_PRINTED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role, resourceType: 'DropTag', resourceId: dropTagId, previousState: 'READY_TO_PRINT', newState: 'PRINTED', stationId, dropTagId, metadata: { templateCode, copies } });
    return { success: true, printJobId: event.eventId, status: 'PRINTED', dropTag: await tx.dropTag.findUnique({ where: { id: dropTagId } }) };
  });
}

export async function reprintDropTag(dropTagId, { reason, stationId, userId, role, copies = 1, mayOverride = isManager(role) }) {
  if (!REPRINT_REASONS.includes(reason)) refuse(400, `Invalid reprint reason. Must be one of: ${REPRINT_REASONS.join(', ')}`);
  return prisma.$transaction(async (tx) => {
    const dropTag = await tx.dropTag.findUnique({ where: { id: dropTagId } });
    if (!dropTag) refuse(404, 'Drop tag not found');
    if (!PRINTED_STATES.includes(dropTag.status)) refuse(409, `A tag that is ${dropTag.status} has not been printed, so there is nothing to print again.`);
    if (dropTag.reprintCount >= REPRINTS_WITHOUT_MANAGER && !mayOverride) refuse(403, `This tag has been printed again ${dropTag.reprintCount} times. A further copy needs a manager.`);
    const moved = await tx.dropTag.updateMany({ where: { id: dropTagId, reprintCount: dropTag.reprintCount, status: dropTag.status }, data: { reprintCount: { increment: 1 }, lastReprintReason: reason, printedBy: userId, printedAt: new Date() } });
    if (!moved.count) refuse(409, 'This tag was just changed by someone else. Reload and try again.');
    const updated = await tx.dropTag.findUnique({ where: { id: dropTagId } });
    await createTraceEvent(tx, { eventType: 'DROP_TAG_REPRINTED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role, resourceType: 'DropTag', resourceId: dropTagId, dropTagId, stationId, metadata: { reason, reprintCount: updated.reprintCount, copies } });
    return { success: true, reprintCount: updated.reprintCount, dropTag: updated };
  });
}

export async function applyDropTag(dropTagId, { packageScanValue, userId, role }) {
  return prisma.$transaction(async (tx) => {
    const dropTag = await tx.dropTag.findUnique({ where: { id: dropTagId }, include: { package: true } });
    if (!dropTag) refuse(404, 'Drop tag not found');
    if (dropTag.status !== 'PRINTED') refuse(409, `Cannot apply tag in ${dropTag.status} status`);
    if (packageScanValue && packageScanValue !== dropTag.package.packageId) refuse(409, 'PACKAGE_MISMATCH: Scanned package does not match drop tag package');
    await moveTag(tx, dropTag, 'PRINTED', { status: 'APPLIED', appliedBy: userId, appliedAt: new Date() });
    await createTraceEvent(tx, { eventType: 'DROP_TAG_APPLIED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role, resourceType: 'DropTag', resourceId: dropTagId, previousState: 'PRINTED', newState: 'APPLIED', dropTagId, metadata: { packageId: dropTag.packageId, scanConfirmation: !!packageScanValue } });
    const updated = await tx.dropTag.findUnique({ where: { id: dropTagId }, include: { package: true } });
    return { success: true, status: 'APPLIED', package: { id: updated.package.id, status: updated.package.status }, dropTag: updated };
  });
}

export async function sealPackage(packageId, { sealId, userId, role }) {
  const seal = String(sealId || '').trim();
  if (!seal) refuse(400, 'sealId is required');
  return prisma.$transaction(async (tx) => {
    const pkg = await lockPackage(tx, packageId);
    if (pkg.status === 'SEALED') refuse(409, 'This package is already sealed.');
    if (pkg.status !== 'QC_RELEASED') refuse(409, `A package is sealed after quality has released it. This one is ${pkg.status}.`);
    if (pkg.qcStatus !== 'RELEASED' && pkg.qcStatus !== 'CONDITIONAL') refuse(409, 'Package must be QC released before sealing');
    const live = pkg.dropTags.filter((t) => t.status !== 'VOID');
    if (!live.length) refuse(409, 'This package has no tag. Make, print and apply its tag before sealing.');
    const unapplied = live.filter((t) => t.status !== 'APPLIED');
    if (unapplied.length) refuse(409, `${unapplied.length} tag(s) not yet applied. Apply all tags before sealing.`);
    const now = new Date();
    const updatedPackage = await tx.package.update({ where: { id: packageId }, data: { status: 'SEALED', sealId: seal, sealAppliedBy: userId, sealAppliedAt: now } });
    // Only the tags that are on the package. A voided tag stays voided.
    await tx.dropTag.updateMany({ where: { packageId, status: 'APPLIED' }, data: { status: 'SEALED', sealedAt: now } });
    await createTraceEvent(tx, { eventType: 'PACKAGE_SEALED', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: packageId, previousState: 'QC_RELEASED', newState: 'SEALED', orderId: pkg.orderId, metadata: { sealId: seal, dropTagIds: live.map((t) => t.dropTagId), identity: 'IMMUTABLE' } });
    return { success: true, package: updatedPackage, sealedTags: live.length };
  });
}

export async function voidDropTag(dropTagId, { reason, claimId, userId, role, mayOverride = isManager(role) }) {
  const why = String(reason || '').trim();
  if (!why) refuse(400, 'reason is required for void');
  return prisma.$transaction(async (tx) => {
    const dropTag = await tx.dropTag.findUnique({ where: { id: dropTagId } });
    if (!dropTag) refuse(404, 'Drop tag not found');
    if (dropTag.status === 'VOID') refuse(409, 'This tag is already void.');
    if (dropTag.status === 'DELIVERED') refuse(409, 'Cannot void delivered tags. Create a credit memo instead.');
    const left = LEFT_THE_DOCK.includes(dropTag.status);
    if (left) {
      if (!String(claimId || '').trim()) refuse(400, 'VOID_REQUIRES_CLAIM: Post-shipment void requires a claim ID');
      if (!mayOverride) refuse(403, 'This material has left the dock. Voiding its tag needs a manager.');
    }
    await moveTag(tx, dropTag, dropTag.status, { status: 'VOID', voidedBy: userId, voidedAt: new Date(), voidReason: why });
    await createTraceEvent(tx, { eventType: 'DROP_TAG_VOIDED', eventCategory: 'DROP_TAG', actorUserId: userId, actorRole: role, resourceType: 'DropTag', resourceId: dropTagId, previousState: dropTag.status, newState: 'VOID', dropTagId, metadata: { reason: why, claimId: claimId || null } });
    return { success: true, status: 'VOID', dropTag: await tx.dropTag.findUnique({ where: { id: dropTagId } }) };
  });
}

export async function getDropTagById(id) {
  return prisma.dropTag.findUnique({
    where: { id },
    include: {
      package: {
        include: {
          packageItems: true,
        },
      },
      order: true,
      orderLine: true,
      customer: true,
      traceEvents: {
        orderBy: { occurredAt: 'desc' },
      },
    },
  });
}

export async function getDropTagByTagId(dropTagId) {
  return prisma.dropTag.findUnique({
    where: { dropTagId },
    include: {
      package: {
        include: {
          packageItems: true,
        },
      },
      order: true,
      orderLine: true,
      customer: true,
      traceEvents: {
        orderBy: { occurredAt: 'desc' },
      },
    },
  });
}

export async function searchDropTags({
  shipmentId,
  orderId,
  customerId,
  heatNumber,
  status,
  fromDate,
  toDate,
  page = 1,
  limit = 20,
}) {
  const where = {};

  if (shipmentId) where.shipmentId = shipmentId;
  if (orderId) where.orderId = orderId;
  if (customerId) where.customerId = customerId;
  if (heatNumber) where.heatNumber = heatNumber;
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const [dropTags, total] = await Promise.all([
    prisma.dropTag.findMany({
      where,
      include: {
        package: true,
        order: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dropTag.count({ where }),
  ]);

  return {
    dropTags,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDropTagsReadyToPrint(locationId) {
  return prisma.dropTag.findMany({
    where: {
      status: 'READY_TO_PRINT',
    },
    include: {
      package: true,
      order: true,
      customer: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

// Package Operations
export async function createPackage({ packageType, orderId, orderLineId, jobId, userId, role }) {
  const type = String(packageType || '').toUpperCase();
  if (!PACKAGE_TYPES.includes(type)) refuse(400, `packageType must be one of: ${PACKAGE_TYPES.join(', ')}`);
  let order = null; let line = null; let job = null;
  if (jobId) {
    job = await prisma.job.findUnique({ where: { id: String(jobId) }, select: { id: true, orderId: true, orderLineId: true, workCenter: { select: { locationId: true } } } });
    if (!job) refuse(404, 'Job not found');
  }
  const wantedOrder = orderId ? String(orderId) : job?.orderId || null;
  const wantedLine = orderLineId ? String(orderLineId) : job?.orderLineId || null;
  if (wantedOrder) {
    order = await prisma.order.findUnique({ where: { id: wantedOrder }, select: { id: true, status: true, orderNumber: true, orderType: true } });
    if (!order) refuse(404, 'Order not found');
    if (order.orderType !== 'SO') refuse(409, 'A package is for a sales order.');
    if (['CANCELLED', 'COMPLETE'].includes(order.status)) refuse(409, `Order ${order.orderNumber} is ${order.status}, so nothing more is packed for it.`);
  }
  if (job && wantedOrder && job.orderId && job.orderId !== wantedOrder) refuse(409, 'That job is for a different order.');
  if (wantedLine) {
    if (!order) refuse(400, 'Name the order the line is on.');
    line = await prisma.orderLine.findUnique({ where: { id: wantedLine }, select: { id: true, orderId: true, lineStatus: true, lineNumber: true } });
    if (!line || line.orderId !== order.id) refuse(409, 'That line is not on that order.');
    if (line.lineStatus === 'CANCELLED') refuse(409, `Line ${line.lineNumber} is cancelled.`);
  }
  // It stands where it is packed: the job's work center, else the packer's own branch.
  const currentLocationId = job?.workCenter?.locationId || currentScope()?.home || null;
  return prisma.$transaction(async (tx) => {
    const pkg = await tx.package.create({
      data: { packageId: await nextNumber(tx, 'PKG', 'PKG'), packageType: type, orderId: order?.id || null, orderLineId: line?.id || null, jobId: job?.id || null, currentLocationId, status: 'OPEN', qcStatus: 'PENDING', createdBy: userId },
    });
    await createTraceEvent(tx, { eventType: 'PACKAGE_OPENED', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: pkg.id, newState: 'OPEN', orderId: pkg.orderId, locationId: currentLocationId, metadata: { packageId: pkg.packageId, packageType: type } });
    return pkg;
  });
}

export async function addPackageItem(packageId, itemData = {}, userId, role) {
  const pieces = Number(itemData.pieces);
  if (!Number.isInteger(pieces) || pieces < 1) refuse(400, 'pieces must be a whole number, one or more');
  const weightLbs = Number(itemData.weightLbs);
  if (!Number.isFinite(weightLbs) || weightLbs <= 0) refuse(400, 'weightLbs must be more than zero');
  let lengthFeet;
  if (itemData.lengthFeet != null && itemData.lengthFeet !== '') {
    lengthFeet = Number(itemData.lengthFeet);
    if (!Number.isFinite(lengthFeet) || lengthFeet <= 0) refuse(400, 'lengthFeet must be more than zero');
  }
  let heatNumber = itemData.heatNumber ? String(itemData.heatNumber).trim() : null;
  let grade = itemData.grade ? String(itemData.grade).trim() : null;
  let form = itemData.form ? String(itemData.form).trim() : null;
  let coil = null;
  if (itemData.coilId) {
    // The stock item says what the material is. What was typed cannot disagree with it.
    coil = await prisma.coil.findUnique({ where: { id: String(itemData.coilId) }, select: { id: true, coilNumber: true, form: true, netWeightLb: true, status: true, qcStatus: true, heat: { select: { heatNumber: true } }, grade: { select: { code: true } }, inventory: { select: { unit: true, qtyOnHand: true } } } });
    if (!coil) refuse(404, 'Stock item not found');
    if (coil.status === 'HOLD' || ['FAILED', 'HOLD'].includes(coil.qcStatus)) refuse(409, `Stock item ${coil.coilNumber} is on hold and cannot be packed.`);
    if (heatNumber && coil.heat?.heatNumber && heatNumber !== coil.heat.heatNumber) refuse(409, `Stock item ${coil.coilNumber} is heat ${coil.heat.heatNumber}, not ${heatNumber}.`);
    if (grade && coil.grade?.code && grade !== coil.grade.code) refuse(409, `Stock item ${coil.coilNumber} is grade ${coil.grade.code}, not ${grade}.`);
    heatNumber = coil.heat?.heatNumber || heatNumber; grade = coil.grade?.code || grade; form = coil.form || form;
    if (/^LBS?$/i.test(coil.inventory?.unit || '') && weightLbs > num(coil.netWeightLb) + 0.5) refuse(409, `Stock item ${coil.coilNumber} weighs ${num(coil.netWeightLb).toLocaleString()} lb. ${weightLbs.toLocaleString()} lb cannot be packed from it.`);
  } else if (heatNumber && !(await prisma.heat.findFirst({ where: { heatNumber }, select: { id: true } }))) {
    refuse(409, `Heat ${heatNumber} is not on file.`);
  }
  if (!grade || !form) refuse(400, 'grade and form are required (they are read from the stock item when one is named)');
  return prisma.$transaction(async (tx) => {
    const pkg = await lockPackage(tx, packageId);
    if (!['OPEN', 'PACKING'].includes(pkg.status)) refuse(409, 'Can only add items to OPEN or PACKING packages');
    if (coil) {
      const packed = await tx.packageItem.aggregate({ _sum: { weightLbs: true }, where: { coilId: coil.id, package: { status: { notIn: ['SHIPPED', 'DELIVERED'] } } } });
      if (/^LBS?$/i.test(coil.inventory?.unit || '') && num(packed._sum.weightLbs) + weightLbs > num(coil.netWeightLb) + 0.5) {
        refuse(409, `Stock item ${coil.coilNumber} weighs ${num(coil.netWeightLb).toLocaleString()} lb and ${num(packed._sum.weightLbs).toLocaleString()} lb of it is already in packages.`);
      }
    }
    const item = await tx.packageItem.create({
      data: {
        packageId, inventoryLotId: itemData.inventoryLotId || null, coilId: coil?.id || null, heatNumber, grade, form,
        dimensions: itemData.dimensions && typeof itemData.dimensions === 'object' ? itemData.dimensions : {},
        specification: itemData.specification ? String(itemData.specification) : null, condition: itemData.condition ? String(itemData.condition) : null,
        pieces, weightLbs, lengthFeet, pieceMarks: Array.isArray(itemData.pieceMarks) ? itemData.pieceMarks : [],
      },
    });
    const net = pkg.packageItems.reduce((sum, i) => sum + num(i.weightLbs), 0) + weightLbs;
    await tx.package.update({ where: { id: packageId }, data: { netWeightLbs: net, ...(pkg.status === 'OPEN' && { status: 'PACKING' }) } });
    await createTraceEvent(tx, { eventType: 'PACKAGE_ITEM_ADDED', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: packageId, previousState: pkg.status, newState: 'PACKING', orderId: pkg.orderId, metadata: { stockItem: coil?.coilNumber || null, heatNumber, pieces, weightLbs } });
    return item;
  });
}

/** The packer says the package is full: it goes to quality (N-008). Before Phase 8 no step did this. */
export async function markPackageReady(packageId, { grossWeightLbs, userId, role } = {}) {
  let gross;
  if (grossWeightLbs != null && grossWeightLbs !== '') {
    gross = Number(grossWeightLbs);
    if (!Number.isFinite(gross) || gross <= 0) refuse(400, 'grossWeightLbs must be more than zero');
  }
  return prisma.$transaction(async (tx) => {
    const pkg = await lockPackage(tx, packageId);
    if (pkg.status !== 'PACKING') refuse(409, pkg.status === 'OPEN' ? 'Put at least one item in the package first.' : `This package is ${pkg.status}. Only a package being packed is sent to quality.`);
    if (!pkg.packageItems.length) refuse(409, 'Put at least one item in the package first.');
    if (gross !== undefined && gross + 0.5 < num(pkg.netWeightLbs)) refuse(409, `The gross weight (${gross}) is less than what is in the package (${num(pkg.netWeightLbs)}).`);
    const updated = await tx.package.update({ where: { id: packageId }, data: { status: 'READY_FOR_QC', packedAt: new Date(), ...(gross !== undefined && { grossWeightLbs: gross, tareWeightLbs: Math.max(0, gross - num(pkg.netWeightLbs)) }) } });
    await createTraceEvent(tx, { eventType: 'PACKAGE_READY_FOR_QC', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: packageId, previousState: 'PACKING', newState: 'READY_FOR_QC', orderId: pkg.orderId, metadata: { netWeightLbs: num(pkg.netWeightLbs), grossWeightLbs: gross ?? null } });
    return updated;
  });
}

export async function getPackagesReadyForTagging() {
  return prisma.package.findMany({
    where: { status: { in: ['OPEN', 'PACKING', 'READY_FOR_QC', 'QC_RELEASED', 'QC_HOLD'] } },
    include: { packageItems: true, order: true, orderLine: true, dropTags: true },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
}

export async function releasePackageQC(packageId, { notes, userId, role }) {
  return prisma.$transaction(async (tx) => {
    const pkg = await lockPackage(tx, packageId);
    if (!['READY_FOR_QC', 'QC_HOLD'].includes(pkg.status)) refuse(409, 'Package must be in READY_FOR_QC status');
    const updated = await tx.package.update({ where: { id: packageId }, data: { status: 'QC_RELEASED', qcStatus: 'RELEASED', qcReleasedBy: userId, qcReleasedAt: new Date(), qcNotes: notes ? String(notes).slice(0, 1000) : null } });
    await createTraceEvent(tx, { eventType: 'PACKAGE_QC_RELEASED', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: packageId, previousState: pkg.status, newState: 'QC_RELEASED', orderId: pkg.orderId, metadata: { notes: notes || null } });
    return updated;
  });
}

/** Quality stops a package, with the reason. It is released from the hold by quality. */
export async function holdPackageQC(packageId, { reason, userId, role }) {
  const why = String(reason || '').trim();
  if (why.length < 3) refuse(400, 'Say why the package is held.');
  return prisma.$transaction(async (tx) => {
    const pkg = await lockPackage(tx, packageId);
    if (!['READY_FOR_QC', 'QC_RELEASED'].includes(pkg.status)) refuse(409, `A package that is ${pkg.status} cannot be put on a quality hold.`);
    const updated = await tx.package.update({ where: { id: packageId }, data: { status: 'QC_HOLD', qcStatus: 'HOLD', qcNotes: why.slice(0, 1000) } });
    await createTraceEvent(tx, { eventType: 'PACKAGE_QC_HOLD', eventCategory: 'PACKAGE', actorUserId: userId, actorRole: role, resourceType: 'Package', resourceId: packageId, previousState: pkg.status, newState: 'QC_HOLD', orderId: pkg.orderId, metadata: { reason: why } });
    return updated;
  });
}

export default {
  generateDropTag,
  validateAndReadyToPrint,
  printDropTag,
  reprintDropTag,
  applyDropTag,
  sealPackage,
  voidDropTag,
  getDropTagById,
  getDropTagByTagId,
  searchDropTags,
  getDropTagsReadyToPrint,
  createPackage,
  addPackageItem,
  markPackageReady,
  getPackagesReadyForTagging,
  releasePackageQC,
  holdPackageQC,
  validatePackageForTagging,
};
