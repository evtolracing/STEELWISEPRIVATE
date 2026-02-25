/**
 * Drop Tag Listing Service
 * Business logic for managing shipment manifests (Drop Tag Listings)
 */

import prisma from '../lib/db.js';
import crypto from 'crypto';

// ID Generation
function generateListingId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `DTL-${year}-${random}`;
}

// Create a new listing
export async function createListing({ shipmentId, originLocationId, dropTagIds = [], userId }) {
  // Validate shipment exists
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Validate origin location
  const location = await prisma.location.findUnique({
    where: { id: originLocationId },
  });

  if (!location) {
    throw new Error('Origin location not found');
  }

  // Create listing
  const listing = await prisma.dropTagListing.create({
    data: {
      listingId: generateListingId(),
      shipmentId,
      originLocationId,
      stopSequence: [],
      status: 'DRAFT',
      createdBy: userId,
    },
    include: {
      shipment: true,
      originLocation: true,
    },
  });

  // Add initial drop tags if provided
  if (dropTagIds.length > 0) {
    await addTagsToListing(listing.id, { dropTagIds, userId });
  }

  // Create trace event
  await createTraceEvent({
    eventType: 'LISTING_CREATED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listing.id,
    newState: 'DRAFT',
    shipmentId,
    metadata: {
      listingId: listing.listingId,
      initialTagCount: dropTagIds.length,
    },
  });

  return listing;
}

// Add tags to listing
export async function addTagsToListing(listingId, { dropTagIds, userId }) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'DRAFT' && listing.status !== 'READY') {
    throw new Error('LISTING_LOCKED: Cannot modify listing in ' + listing.status + ' status');
  }

  // Validate all tags
  const tags = await prisma.dropTag.findMany({
    where: { id: { in: dropTagIds } },
    include: { package: true },
  });

  const errors = [];
  for (const tag of tags) {
    // Check if already assigned to another listing
    if (tag.listingId && tag.listingId !== listingId) {
      errors.push(`Tag ${tag.dropTagId} is already assigned to another listing`);
    }
    // Check if sealed
    if (!['SEALED', 'STAGED'].includes(tag.status)) {
      errors.push(`Tag ${tag.dropTagId} is not sealed. Status: ${tag.status}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  // Update tags with listing reference
  await prisma.dropTag.updateMany({
    where: { id: { in: dropTagIds } },
    data: { listingId, shipmentId: listing.shipmentId },
  });

  // Recalculate totals
  await updateListingTotals(listingId);

  const updated = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: {
      dropTags: true,
      shipment: true,
    },
  });

  return {
    listing: updated,
    added: dropTagIds.length,
  };
}

// Remove tags from listing
export async function removeTagsFromListing(listingId, { dropTagIds, userId }) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'DRAFT' && listing.status !== 'READY') {
    throw new Error('LISTING_LOCKED: Cannot modify listing in ' + listing.status + ' status');
  }

  // Remove listing reference from tags
  await prisma.dropTag.updateMany({
    where: { id: { in: dropTagIds }, listingId },
    data: { listingId: null },
  });

  // Recalculate totals
  await updateListingTotals(listingId);

  const updated = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  return {
    listing: updated,
    removed: dropTagIds.length,
  };
}

// Update stop sequence
export async function updateStopSequence(listingId, { stopSequence, userId }) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'DRAFT' && listing.status !== 'READY') {
    throw new Error('LISTING_LOCKED: Cannot modify stops in ' + listing.status + ' status');
  }

  // Validate stop sequence
  const allTagIds = stopSequence.flatMap(stop => stop.dropTagIds || []);
  const listingTagIds = listing.dropTags.map(t => t.id);
  
  // Ensure all tags are accounted for
  const missingTags = listingTagIds.filter(id => !allTagIds.includes(id));
  if (missingTags.length > 0) {
    throw new Error(`${missingTags.length} tags not assigned to any stop`);
  }

  // Update drop tags with route stop
  for (const stop of stopSequence) {
    if (stop.dropTagIds && stop.dropTagIds.length > 0) {
      await prisma.dropTag.updateMany({
        where: { id: { in: stop.dropTagIds } },
        data: { routeStop: stop.stopNumber },
      });
    }
  }

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: { stopSequence },
    include: { dropTags: true },
  });

  return updated;
}

// Finalize listing (ready for print)
export async function finalizeListing(listingId, userId) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.dropTags.length === 0) {
    throw new Error('Cannot finalize empty listing');
  }

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: { status: 'READY' },
  });

  await createTraceEvent({
    eventType: 'LISTING_FINALIZED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listingId,
    previousState: 'DRAFT',
    newState: 'READY',
    shipmentId: listing.shipmentId,
  });

  return updated;
}

// Print listing manifest
export async function printListing(listingId, { stationId, userId, includePackingList = true, includeDocBundle = true }) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: {
      dropTags: {
        include: { customer: true },
      },
      shipment: true,
      originLocation: true,
    },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  // Generate packing list document ID (in real implementation, would create PDF)
  const packingListDocId = `PKL-${Date.now()}`;
  const cocBundleId = includeDocBundle ? `COC-BUNDLE-${Date.now()}` : null;
  const mtrBundleId = includeDocBundle ? `MTR-BUNDLE-${Date.now()}` : null;

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: {
      status: 'PRINTED',
      packingListDocId,
      cocBundleId,
      mtrBundleId,
    },
  });

  await createTraceEvent({
    eventType: 'LISTING_PRINTED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listingId,
    previousState: listing.status,
    newState: 'PRINTED',
    stationId,
    shipmentId: listing.shipmentId,
    metadata: {
      packingListDocId,
      cocBundleId,
      mtrBundleId,
    },
  });

  return {
    success: true,
    listing: updated,
    documents: {
      packingListUrl: `/documents/${packingListDocId}`,
      cocBundleUrl: cocBundleId ? `/documents/${cocBundleId}` : null,
      mtrBundleUrl: mtrBundleId ? `/documents/${mtrBundleId}` : null,
    },
  };
}

// Confirm all packages loaded
export async function confirmAllLoaded(listingId, userId) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  // Check all tags are in LOADED status
  const unloadedTags = listing.dropTags.filter(t => t.status !== 'LOADED');
  if (unloadedTags.length > 0) {
    throw new Error(`${unloadedTags.length} packages not yet loaded`);
  }

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: { status: 'LOADED' },
  });

  return updated;
}

// Lock listing and depart
export async function lockAndDepart(listingId, userId) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  // Validate all tags loaded
  const unloadedTags = listing.dropTags.filter(t => t.status !== 'LOADED');
  if (unloadedTags.length > 0) {
    throw new Error(`Cannot depart: ${unloadedTags.length} packages not loaded`);
  }

  // Validate totals match
  const actualPieces = listing.dropTags.reduce((sum, t) => sum + t.pieces, 0);
  if (actualPieces !== listing.totalPieces) {
    throw new Error(`TOTALS_MISMATCH: Expected ${listing.totalPieces} pieces, found ${actualPieces}`);
  }

  // Lock and update status
  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: {
      status: 'DEPARTED',
      lockedAt: new Date(),
      lockedBy: userId,
      departedAt: new Date(),
    },
  });

  // Update all tags to SHIPPED
  await prisma.dropTag.updateMany({
    where: { listingId },
    data: { status: 'SHIPPED' },
  });

  await createTraceEvent({
    eventType: 'LISTING_LOCKED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listingId,
    previousState: 'LOADED',
    newState: 'DEPARTED',
    shipmentId: listing.shipmentId,
    metadata: {
      totalPackages: listing.totalPackages,
      totalWeight: listing.totalWeightLbs,
      lockedBy: userId,
    },
  });

  return updated;
}

// Confirm delivery (all stops)
export async function confirmAllDelivered(listingId, { podDocId, podSignature, podSignedBy, userId }) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
    include: { dropTags: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'DEPARTED') {
    throw new Error('Listing must be in DEPARTED status');
  }

  // Update all tags to DELIVERED
  await prisma.dropTag.updateMany({
    where: { listingId },
    data: { status: 'DELIVERED' },
  });

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      podDocId,
      podSignature,
      podSignedBy,
      podSignedAt: new Date(),
    },
  });

  await createTraceEvent({
    eventType: 'LISTING_DELIVERED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listingId,
    previousState: 'DEPARTED',
    newState: 'DELIVERED',
    shipmentId: listing.shipmentId,
    metadata: {
      podDocId,
      podSignedBy,
      deliveredTags: listing.dropTags.length,
    },
  });

  return updated;
}

// Close listing (custody chain complete)
export async function closeListing(listingId, userId) {
  const listing = await prisma.dropTagListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'DELIVERED') {
    throw new Error('Listing must be in DELIVERED status to close');
  }

  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  await createTraceEvent({
    eventType: 'LISTING_CLOSED',
    eventCategory: 'LISTING',
    actorUserId: userId,
    actorRole: 'LOGISTICS_COORDINATOR',
    resourceType: 'DropTagListing',
    resourceId: listingId,
    previousState: 'DELIVERED',
    newState: 'CLOSED',
    shipmentId: listing.shipmentId,
  });

  return updated;
}

// Query operations
export async function getListingById(id) {
  return prisma.dropTagListing.findUnique({
    where: { id },
    include: {
      dropTags: {
        include: {
          package: true,
          customer: true,
        },
      },
      shipment: {
        include: {
          order: true,
          stops: true,
        },
      },
      originLocation: true,
    },
  });
}

export async function searchListings({ shipmentId, status, fromDate, toDate, page = 1, limit = 20 }) {
  const where = {};

  if (shipmentId) where.shipmentId = shipmentId;
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const [listings, total] = await Promise.all([
    prisma.dropTagListing.findMany({
      where,
      include: {
        shipment: true,
        originLocation: true,
        dropTags: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dropTagListing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Helper functions
async function updateListingTotals(listingId) {
  const tags = await prisma.dropTag.findMany({
    where: { listingId },
  });

  const totals = {
    totalPackages: tags.length,
    totalPieces: tags.reduce((sum, t) => sum + t.pieces, 0),
    totalWeightLbs: tags.reduce((sum, t) => sum + Number(t.weightLbs), 0),
  };

  await prisma.dropTagListing.update({
    where: { id: listingId },
    data: totals,
  });

  return totals;
}

async function createTraceEvent(data) {
  return prisma.traceEvent.create({
    data: {
      eventType: data.eventType,
      eventCategory: data.eventCategory,
      actorUserId: data.actorUserId,
      actorRole: data.actorRole,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      previousState: data.previousState,
      newState: data.newState,
      stationId: data.stationId,
      metadata: data.metadata,
      shipmentId: data.shipmentId,
      occurredAt: new Date(),
      eventHash: crypto.randomUUID(),
    },
  });
}

export default {
  createListing,
  addTagsToListing,
  removeTagsFromListing,
  updateStopSequence,
  finalizeListing,
  printListing,
  confirmAllLoaded,
  lockAndDepart,
  confirmAllDelivered,
  closeListing,
  getListingById,
  searchListings,
};
