/**
 * Drop Tag Service
 * Core business logic for generating, printing, and managing drop tags
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ID Generation
function generateDropTagId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `DT-${year}-${random}`;
}

function generatePackageId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `PKG-${year}-${random}`;
}

function generateListingId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `DTL-${year}-${random}`;
}

// Validation Rules
async function validatePackageForTagging(packageId) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      packageItems: true,
      order: true,
      orderLine: true,
    },
  });

  if (!pkg) {
    return { valid: false, errors: ['Package not found'] };
  }

  const errors = [];
  const warnings = [];

  // Check package status
  const validStatuses = ['PACKING', 'READY_FOR_QC', 'QC_RELEASED'];
  if (!validStatuses.includes(pkg.status)) {
    errors.push(`Package status ${pkg.status} is not valid for tagging. Must be in: ${validStatuses.join(', ')}`);
  }

  // Check QC status
  if (pkg.qcStatus === 'HOLD') {
    errors.push('Package is on QC hold. Cannot generate tags until released.');
  }
  if (pkg.qcStatus === 'REJECTED') {
    errors.push('Package has been rejected by QC. Cannot generate tags.');
  }

  // Check for items
  if (!pkg.packageItems || pkg.packageItems.length === 0) {
    errors.push('Package has no items. Add items before generating tags.');
  }

  // Check for mixed materials
  if (pkg.packageItems && pkg.packageItems.length > 0) {
    const grades = [...new Set(pkg.packageItems.map(i => i.grade))];
    const forms = [...new Set(pkg.packageItems.map(i => i.form))];
    const heats = [...new Set(pkg.packageItems.map(i => i.heatNumber).filter(Boolean))];

    if (grades.length > 1) {
      errors.push(`Mixed grades detected: ${grades.join(', ')}. Split package or get override.`);
    }
    if (forms.length > 1) {
      errors.push(`Mixed forms detected: ${forms.join(', ')}. Split package or get override.`);
    }
    if (heats.length > 1) {
      warnings.push(`Multiple heats detected: ${heats.join(', ')}. This may require customer approval.`);
    }
  }

  // Get material summary
  const materialSummary = {
    grade: pkg.packageItems?.[0]?.grade || 'Unknown',
    form: pkg.packageItems?.[0]?.form || 'Unknown',
    heatNumbers: [...new Set(pkg.packageItems?.map(i => i.heatNumber).filter(Boolean) || [])],
    qcStatus: pkg.qcStatus,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    materialSummary,
    package: pkg,
  };
}

// Drop Tag CRUD Operations
export async function generateDropTag({ packageId, userId, templateCode }) {
  // Validate package
  const validation = await validatePackageForTagging(packageId);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
  }

  const pkg = validation.package;
  const firstItem = pkg.packageItems[0];

  // Calculate totals
  const totalPieces = pkg.packageItems.reduce((sum, item) => sum + item.pieces, 0);
  const totalWeight = pkg.packageItems.reduce((sum, item) => sum + Number(item.weightLbs), 0);
  const heats = [...new Set(pkg.packageItems.map(i => i.heatNumber).filter(Boolean))];

  // Get order info
  const order = pkg.order;
  const orderLine = pkg.orderLine;

  // Create drop tag
  const dropTag = await prisma.dropTag.create({
    data: {
      dropTagId: generateDropTagId(),
      packageId: packageId,
      orderId: pkg.orderId,
      orderLineId: pkg.orderLineId,
      jobId: pkg.jobId,
      customerId: order?.buyerId || 'unknown',
      customerPO: order?.poReference,
      division: 'STEEL', // Default, should come from product
      form: firstItem.form,
      grade: firstItem.grade,
      specification: firstItem.specification,
      condition: firstItem.condition,
      dimensions: firstItem.dimensions,
      lengthFeet: firstItem.lengthFeet,
      heatNumber: heats.length === 1 ? heats[0] : null,
      pieces: totalPieces,
      weightLbs: totalWeight,
      workCenters: [],
      operatorIds: [],
      status: 'DRAFT',
      createdBy: userId,
    },
    include: {
      package: true,
      order: true,
      orderLine: true,
    },
  });

  // Create trace event
  await createTraceEvent({
    eventType: 'DROP_TAG_GENERATED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'DropTag',
    resourceId: dropTag.id,
    newState: 'DRAFT',
    dropTagId: dropTag.id,
    orderId: pkg.orderId,
    metadata: {
      packageId,
      templateCode,
      warnings: validation.warnings,
    },
  });

  return {
    dropTag,
    warnings: validation.warnings,
  };
}

export async function validateAndReadyToPrint(dropTagId, userId) {
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
    include: { package: true },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  if (dropTag.status !== 'DRAFT') {
    throw new Error(`Cannot validate tag in ${dropTag.status} status`);
  }

  // Check package QC status
  if (dropTag.package.qcStatus !== 'RELEASED' && dropTag.package.qcStatus !== 'CONDITIONAL') {
    throw new Error('Package must be QC released before printing tags');
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTagId },
    data: {
      status: 'READY_TO_PRINT',
    },
  });

  await createTraceEvent({
    eventType: 'DROP_TAG_VALIDATED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'DropTag',
    resourceId: dropTagId,
    previousState: 'DRAFT',
    newState: 'READY_TO_PRINT',
    dropTagId: dropTagId,
  });

  return updated;
}

export async function printDropTag(dropTagId, { stationId, userId, templateCode, copies = 1 }) {
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  if (dropTag.status !== 'READY_TO_PRINT') {
    throw new Error(`Cannot print tag in ${dropTag.status} status`);
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTagId },
    data: {
      status: 'PRINTED',
      printedBy: userId,
      printedAt: new Date(),
    },
  });

  await createTraceEvent({
    eventType: 'DROP_TAG_PRINTED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'DropTag',
    resourceId: dropTagId,
    previousState: 'READY_TO_PRINT',
    newState: 'PRINTED',
    stationId,
    dropTagId: dropTagId,
    metadata: { templateCode, copies },
  });

  return {
    success: true,
    printJobId: crypto.randomUUID(),
    status: 'PRINTED',
    dropTag: updated,
  };
}

export async function reprintDropTag(dropTagId, { reason, stationId, userId, copies = 1 }) {
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  const allowedReasons = ['DAMAGED_TAG', 'ILLEGIBLE_PRINT', 'TAG_FELL_OFF', 'CUSTOMER_REQUEST', 'ADDITIONAL_COPY'];
  if (!allowedReasons.includes(reason)) {
    throw new Error(`Invalid reprint reason. Must be one of: ${allowedReasons.join(', ')}`);
  }

  // Check if escalation needed (after 3 reprints)
  if (dropTag.reprintCount >= 3) {
    throw new Error('Maximum reprints reached. Supervisor approval required.');
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTagId },
    data: {
      reprintCount: dropTag.reprintCount + 1,
      lastReprintReason: reason,
      printedBy: userId,
      printedAt: new Date(),
    },
  });

  await createTraceEvent({
    eventType: 'DROP_TAG_REPRINTED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'DropTag',
    resourceId: dropTagId,
    dropTagId: dropTagId,
    stationId,
    metadata: {
      reason,
      reprintCount: updated.reprintCount,
      copies,
    },
  });

  return {
    success: true,
    reprintCount: updated.reprintCount,
    dropTag: updated,
  };
}

export async function applyDropTag(dropTagId, { packageScanValue, userId }) {
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
    include: { package: true },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  if (dropTag.status !== 'PRINTED') {
    throw new Error(`Cannot apply tag in ${dropTag.status} status`);
  }

  // Validate package scan if provided
  if (packageScanValue && packageScanValue !== dropTag.package.packageId) {
    throw new Error('PACKAGE_MISMATCH: Scanned package does not match drop tag package');
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTagId },
    data: {
      status: 'APPLIED',
      appliedBy: userId,
      appliedAt: new Date(),
    },
    include: { package: true },
  });

  await createTraceEvent({
    eventType: 'DROP_TAG_APPLIED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'DropTag',
    resourceId: dropTagId,
    previousState: 'PRINTED',
    newState: 'APPLIED',
    dropTagId: dropTagId,
    metadata: {
      packageId: dropTag.packageId,
      scanConfirmation: !!packageScanValue,
    },
  });

  return {
    success: true,
    status: 'APPLIED',
    package: {
      id: updated.package.id,
      status: updated.package.status,
    },
    dropTag: updated,
  };
}

export async function sealPackage(packageId, { sealId, userId }) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      dropTags: true,
    },
  });

  if (!pkg) {
    throw new Error('Package not found');
  }

  if (pkg.qcStatus !== 'RELEASED' && pkg.qcStatus !== 'CONDITIONAL') {
    throw new Error('Package must be QC released before sealing');
  }

  // Check all tags are applied
  const unappliedTags = pkg.dropTags.filter(t => t.status !== 'APPLIED');
  if (unappliedTags.length > 0) {
    throw new Error(`${unappliedTags.length} tag(s) not yet applied. Apply all tags before sealing.`);
  }

  // Update package
  const updatedPackage = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: 'SEALED',
      sealId,
      sealAppliedBy: userId,
      sealAppliedAt: new Date(),
    },
  });

  // Update all drop tags to SEALED
  await prisma.dropTag.updateMany({
    where: { packageId },
    data: {
      status: 'SEALED',
      sealedAt: new Date(),
    },
  });

  await createTraceEvent({
    eventType: 'PACKAGE_SEALED',
    eventCategory: 'PACKAGE',
    actorUserId: userId,
    actorRole: 'PACKAGING_OPERATOR',
    resourceType: 'Package',
    resourceId: packageId,
    newState: 'SEALED',
    metadata: {
      sealId,
      dropTagIds: pkg.dropTags.map(t => t.dropTagId),
      identity: 'IMMUTABLE',
    },
  });

  return {
    success: true,
    package: updatedPackage,
    sealedTags: pkg.dropTags.length,
  };
}

export async function voidDropTag(dropTagId, { reason, claimId, userId }) {
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  if (dropTag.status === 'DELIVERED') {
    throw new Error('Cannot void delivered tags. Create a credit memo instead.');
  }

  // Post-ship void requires claim and escalation
  const postShipStatuses = ['SHIPPED', 'LOADED'];
  if (postShipStatuses.includes(dropTag.status)) {
    if (!claimId) {
      throw new Error('VOID_REQUIRES_CLAIM: Post-shipment void requires a claim ID');
    }
    // In real implementation, would check for executive approval here
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTagId },
    data: {
      status: 'VOID',
      voidedBy: userId,
      voidedAt: new Date(),
      voidReason: reason,
    },
  });

  await createTraceEvent({
    eventType: 'DROP_TAG_VOIDED',
    eventCategory: 'DROP_TAG',
    actorUserId: userId,
    actorRole: postShipStatuses.includes(dropTag.status) ? 'OPS_MANAGER' : 'SUPERVISOR',
    resourceType: 'DropTag',
    resourceId: dropTagId,
    previousState: dropTag.status,
    newState: 'VOID',
    dropTagId: dropTagId,
    metadata: {
      reason,
      claimId,
    },
  });

  return {
    success: true,
    status: 'VOID',
    dropTag: updated,
  };
}

// Query Operations
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
export async function createPackage({ packageType, orderId, orderLineId, jobId, userId }) {
  const pkg = await prisma.package.create({
    data: {
      packageId: generatePackageId(),
      packageType,
      orderId,
      orderLineId,
      jobId,
      status: 'OPEN',
      qcStatus: 'PENDING',
      createdBy: userId,
    },
  });

  return pkg;
}

export async function addPackageItem(packageId, itemData, userId) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new Error('Package not found');
  }

  if (!['OPEN', 'PACKING'].includes(pkg.status)) {
    throw new Error('Can only add items to OPEN or PACKING packages');
  }

  // Update package to PACKING if OPEN
  if (pkg.status === 'OPEN') {
    await prisma.package.update({
      where: { id: packageId },
      data: { status: 'PACKING' },
    });
  }

  const item = await prisma.packageItem.create({
    data: {
      packageId,
      inventoryLotId: itemData.inventoryLotId,
      coilId: itemData.coilId,
      heatNumber: itemData.heatNumber,
      grade: itemData.grade,
      form: itemData.form,
      dimensions: itemData.dimensions || {},
      specification: itemData.specification,
      condition: itemData.condition,
      pieces: itemData.pieces,
      weightLbs: itemData.weightLbs,
      lengthFeet: itemData.lengthFeet,
      pieceMarks: itemData.pieceMarks || [],
    },
  });

  // Update package totals
  await updatePackageTotals(packageId);

  return item;
}

async function updatePackageTotals(packageId) {
  const items = await prisma.packageItem.findMany({
    where: { packageId },
  });

  const netWeight = items.reduce((sum, item) => sum + Number(item.weightLbs), 0);

  await prisma.package.update({
    where: { id: packageId },
    data: {
      netWeightLbs: netWeight,
    },
  });
}

export async function getPackagesReadyForTagging() {
  return prisma.package.findMany({
    where: {
      status: { in: ['PACKING', 'READY_FOR_QC', 'QC_RELEASED'] },
    },
    include: {
      packageItems: true,
      order: true,
      orderLine: true,
      dropTags: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function releasePackageQC(packageId, { notes, userId }) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new Error('Package not found');
  }

  if (pkg.status !== 'READY_FOR_QC') {
    throw new Error('Package must be in READY_FOR_QC status');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: 'QC_RELEASED',
      qcStatus: 'RELEASED',
      qcReleasedBy: userId,
      qcReleasedAt: new Date(),
      qcNotes: notes,
    },
  });

  return updated;
}

// Trace Event Helper
async function createTraceEvent(data) {
  const event = await prisma.traceEvent.create({
    data: {
      eventType: data.eventType,
      eventCategory: data.eventCategory,
      actorUserId: data.actorUserId,
      actorRole: data.actorRole,
      actorName: data.actorName,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      previousState: data.previousState,
      newState: data.newState,
      locationId: data.locationId,
      stationId: data.stationId,
      beforeSnapshot: data.beforeSnapshot,
      afterSnapshot: data.afterSnapshot,
      metadata: data.metadata,
      correlationId: data.correlationId,
      orderId: data.orderId,
      shipmentId: data.shipmentId,
      dropTagId: data.dropTagId,
      occurredAt: new Date(),
    },
  });

  // Generate event hash for immutability
  const eventHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      resourceId: event.resourceId,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
    }))
    .digest('hex');

  await prisma.traceEvent.update({
    where: { id: event.id },
    data: { eventHash },
  });

  return event;
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
  getPackagesReadyForTagging,
  releasePackageQC,
  validatePackageForTagging,
};
