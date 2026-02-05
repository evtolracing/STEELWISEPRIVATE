/**
 * Scan Service
 * Universal scan processing for all drop tag workflow stations
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Process a scan at any workflow station
 * @param {Object} payload Scan payload
 * @returns {Object} Scan result
 */
export async function processScan({
  identifierType,
  identifierValue,
  stationType,
  stationId,
  locationId,
  context = {},
  actorUserId,
}) {
  // Resolve identifier to drop tag
  const resolution = await resolveIdentifier(identifierType, identifierValue);
  
  if (!resolution.success) {
    return {
      success: false,
      errors: [resolution.error],
    };
  }

  const { dropTag, package: pkg } = resolution;

  // Process based on station type
  switch (stationType) {
    case 'PRINT':
      return await handlePrintScan(dropTag, { stationId, actorUserId });
    
    case 'APPLY':
      return await handleApplyScan(dropTag, { 
        packageScan: context.packageScan, 
        stationId, 
        actorUserId 
      });
    
    case 'SEAL':
      return await handleSealScan(dropTag, { 
        sealId: context.sealId, 
        stationId, 
        actorUserId 
      });
    
    case 'STAGE':
      return await handleStageScan(dropTag, { 
        binId: context.binId, 
        locationId, 
        stationId, 
        actorUserId 
      });
    
    case 'LOAD':
      return await handleLoadScan(dropTag, { 
        shipmentId: context.shipmentId, 
        stopNumber: context.stopNumber, 
        stationId, 
        actorUserId 
      });
    
    case 'DELIVER':
      return await handleDeliverScan(dropTag, { 
        podSignature: context.podSignature,
        stopNumber: context.stopNumber,
        stationId, 
        actorUserId 
      });
    
    default:
      return {
        success: false,
        errors: [`Unknown station type: ${stationType}`],
      };
  }
}

/**
 * Resolve an identifier (barcode, QR, RFID, etc.) to a drop tag
 */
async function resolveIdentifier(identifierType, identifierValue) {
  // First check if it's a direct drop tag ID
  let dropTag = await prisma.dropTag.findFirst({
    where: {
      OR: [
        { dropTagId: identifierValue },
        { id: identifierValue },
      ],
    },
    include: {
      package: true,
      order: true,
      listing: true,
    },
  });

  if (dropTag) {
    return {
      success: true,
      dropTag,
      package: dropTag.package,
      confidence: 1.0,
    };
  }

  // Check tag identifiers table (for RFID, etc.)
  const tagIdentifier = await prisma.tagIdentifier.findFirst({
    where: {
      identifierType,
      identifierValue,
    },
    include: {
      dropTag: {
        include: {
          package: true,
          order: true,
          listing: true,
        },
      },
    },
  });

  if (tagIdentifier) {
    return {
      success: true,
      dropTag: tagIdentifier.dropTag,
      package: tagIdentifier.dropTag.package,
      confidence: 1.0,
    };
  }

  // Check if it's a package ID
  const pkg = await prisma.package.findFirst({
    where: {
      OR: [
        { packageId: identifierValue },
        { id: identifierValue },
      ],
    },
    include: {
      dropTags: {
        include: {
          order: true,
          listing: true,
        },
      },
    },
  });

  if (pkg && pkg.dropTags.length > 0) {
    return {
      success: true,
      dropTag: pkg.dropTags[0], // Return first tag
      package: pkg,
      confidence: 0.9,
    };
  }

  return {
    success: false,
    error: 'INVALID_IDENTIFIER: Cannot resolve identifier to a drop tag',
  };
}

/**
 * Handle scan at print station (confirm print)
 */
async function handlePrintScan(dropTag, { stationId, actorUserId }) {
  if (dropTag.status !== 'READY_TO_PRINT') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for print. Current status: ${dropTag.status}`],
    };
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: {
      status: 'PRINTED',
      printedBy: actorUserId,
      printedAt: new Date(),
    },
  });

  await createScanEvent('DROP_TAG_PRINTED', dropTag, {
    stationId,
    actorUserId,
    previousState: 'READY_TO_PRINT',
    newState: 'PRINTED',
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: 'READY_TO_PRINT',
    newStatus: 'PRINTED',
    nextAction: 'Apply tag to package',
  };
}

/**
 * Handle scan at apply station (tag to package)
 */
async function handleApplyScan(dropTag, { packageScan, stationId, actorUserId }) {
  if (dropTag.status !== 'PRINTED') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for apply. Current status: ${dropTag.status}`],
    };
  }

  // If package scan provided, validate match
  if (packageScan && packageScan !== dropTag.package.packageId && packageScan !== dropTag.packageId) {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: ['PACKAGE_MISMATCH: Scanned package does not match drop tag package'],
      mismatchType: 'WRONG_PACKAGE',
    };
  }

  const updated = await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: {
      status: 'APPLIED',
      appliedBy: actorUserId,
      appliedAt: new Date(),
    },
  });

  await createScanEvent('DROP_TAG_APPLIED', dropTag, {
    stationId,
    actorUserId,
    previousState: 'PRINTED',
    newState: 'APPLIED',
    metadata: { packageScan, packageId: dropTag.packageId },
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: 'PRINTED',
    newStatus: 'APPLIED',
    nextAction: 'Seal package when all tags applied',
  };
}

/**
 * Handle scan at seal station
 */
async function handleSealScan(dropTag, { sealId, stationId, actorUserId }) {
  if (dropTag.status !== 'APPLIED') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for seal. Current status: ${dropTag.status}`],
    };
  }

  if (!sealId) {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: ['Seal ID is required'],
    };
  }

  // Check package QC status
  if (dropTag.package.qcStatus !== 'RELEASED' && dropTag.package.qcStatus !== 'CONDITIONAL') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: ['QC_NOT_RELEASED: Package must be QC released before sealing'],
    };
  }

  // Update tag
  const updatedTag = await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: {
      status: 'SEALED',
      sealedAt: new Date(),
    },
  });

  // Check if all package tags are sealed, then seal package
  const packageTags = await prisma.dropTag.findMany({
    where: { packageId: dropTag.packageId },
  });

  const allSealed = packageTags.every(t => t.id === dropTag.id || t.status === 'SEALED');
  
  if (allSealed) {
    await prisma.package.update({
      where: { id: dropTag.packageId },
      data: {
        status: 'SEALED',
        sealId,
        sealAppliedBy: actorUserId,
        sealAppliedAt: new Date(),
      },
    });
  }

  await createScanEvent('PACKAGE_SEALED', dropTag, {
    stationId,
    actorUserId,
    previousState: 'APPLIED',
    newState: 'SEALED',
    metadata: { sealId, packageSealed: allSealed },
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: 'APPLIED',
    newStatus: 'SEALED',
    packageSealed: allSealed,
    nextAction: allSealed ? 'Move to staging area' : `${packageTags.filter(t => t.status !== 'SEALED').length} more tags to seal`,
  };
}

/**
 * Handle scan at staging station
 */
async function handleStageScan(dropTag, { binId, locationId, stationId, actorUserId }) {
  if (dropTag.status !== 'SEALED') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for staging. Current status: ${dropTag.status}`],
    };
  }

  // Update tag and package
  await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: { status: 'STAGED' },
  });

  await prisma.package.update({
    where: { id: dropTag.packageId },
    data: {
      status: 'STAGED',
      currentLocationId: locationId,
      currentBinId: binId,
      stagedAt: new Date(),
    },
  });

  await createScanEvent('PACKAGE_STAGED', dropTag, {
    stationId,
    actorUserId,
    previousState: 'SEALED',
    newState: 'STAGED',
    locationId,
    metadata: { binId },
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: 'SEALED',
    newStatus: 'STAGED',
    nextAction: 'Ready for loading',
  };
}

/**
 * Handle scan at load station (onto truck)
 */
async function handleLoadScan(dropTag, { shipmentId, stopNumber, stationId, actorUserId }) {
  if (dropTag.status !== 'STAGED' && dropTag.status !== 'SEALED') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for loading. Current status: ${dropTag.status}`],
    };
  }

  // Validate shipment match if tag has a listing
  if (dropTag.listing) {
    if (dropTag.listing.shipmentId !== shipmentId) {
      return {
        success: false,
        dropTagId: dropTag.dropTagId,
        errors: ['SHIPMENT_MISMATCH: Tag is assigned to a different shipment'],
        mismatchType: 'WRONG_SHIPMENT',
      };
    }
  }

  // Validate stop sequence (should load last stops first - LIFO)
  if (dropTag.routeStop && stopNumber && dropTag.routeStop !== stopNumber) {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      warnings: [`STOP_SEQUENCE_VIOLATION: Expected stop ${dropTag.routeStop}, scanning for stop ${stopNumber}`],
    };
  }

  // Update tag and package
  await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: { 
      status: 'LOADED',
      shipmentId: shipmentId || dropTag.shipmentId,
    },
  });

  await prisma.package.update({
    where: { id: dropTag.packageId },
    data: {
      status: 'LOADED',
      loadedAt: new Date(),
    },
  });

  await createScanEvent('PACKAGE_LOADED', dropTag, {
    stationId,
    actorUserId,
    previousState: dropTag.status,
    newState: 'LOADED',
    shipmentId,
    metadata: { stopNumber },
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: dropTag.status,
    newStatus: 'LOADED',
    stopNumber: dropTag.routeStop,
    nextAction: 'Continue loading',
  };
}

/**
 * Handle scan at delivery (confirmation)
 */
async function handleDeliverScan(dropTag, { podSignature, stopNumber, stationId, actorUserId }) {
  if (dropTag.status !== 'LOADED' && dropTag.status !== 'SHIPPED') {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Tag not ready for delivery. Current status: ${dropTag.status}`],
    };
  }

  // Validate stop match
  if (dropTag.routeStop && stopNumber && dropTag.routeStop !== stopNumber) {
    return {
      success: false,
      dropTagId: dropTag.dropTagId,
      errors: [`Wrong stop: This package is for stop ${dropTag.routeStop}`],
    };
  }

  // Update tag and package
  await prisma.dropTag.update({
    where: { id: dropTag.id },
    data: { status: 'DELIVERED' },
  });

  await prisma.package.update({
    where: { id: dropTag.packageId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  await createScanEvent('DELIVERY_CONFIRMED', dropTag, {
    stationId,
    actorUserId,
    previousState: dropTag.status,
    newState: 'DELIVERED',
    shipmentId: dropTag.shipmentId,
    metadata: { 
      podSignature: podSignature ? 'captured' : null,
      stopNumber,
    },
  });

  return {
    success: true,
    dropTagId: dropTag.dropTagId,
    previousStatus: dropTag.status,
    newStatus: 'DELIVERED',
    nextAction: 'Delivery confirmed',
  };
}

/**
 * Create scan trace event
 */
async function createScanEvent(eventType, dropTag, { stationId, actorUserId, previousState, newState, locationId, shipmentId, metadata }) {
  return prisma.traceEvent.create({
    data: {
      eventType,
      eventCategory: 'DROP_TAG',
      actorUserId,
      actorRole: 'OPERATOR',
      resourceType: 'DropTag',
      resourceId: dropTag.id,
      previousState,
      newState,
      stationId,
      locationId,
      shipmentId: shipmentId || dropTag.shipmentId,
      dropTagId: dropTag.id,
      metadata,
      occurredAt: new Date(),
      eventHash: crypto.randomUUID(),
    },
  });
}

/**
 * Register a new identifier for a drop tag (for RFID, etch, etc.)
 */
export async function registerIdentifier(dropTagId, { identifierType, identifierValue, isPrimary = false }) {
  // Validate drop tag exists
  const dropTag = await prisma.dropTag.findUnique({
    where: { id: dropTagId },
  });

  if (!dropTag) {
    throw new Error('Drop tag not found');
  }

  // Create identifier
  const identifier = await prisma.tagIdentifier.create({
    data: {
      dropTagId,
      identifierType,
      identifierValue,
      isPrimary,
    },
  });

  return identifier;
}

/**
 * Get all identifiers for a drop tag
 */
export async function getTagIdentifiers(dropTagId) {
  return prisma.tagIdentifier.findMany({
    where: { dropTagId },
  });
}

export default {
  processScan,
  resolveIdentifier,
  registerIdentifier,
  getTagIdentifiers,
};
