/**
 * Drop Tag Listing Service
 * Business logic for managing shipment manifests (Drop Tag Listings)
 */

import prisma from '../lib/db.js';
import { nextNumber, createTraceEvent as recordTrace, TagRefusal } from './dropTagService.js';
import crypto from 'crypto';

// ID Generation

// Create a new listing
export async function createListing({ shipmentId, originLocationId, dropTagIds = [], userId }) {
  // Validate shipment exists
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });

  if (!shipment) {
    throw new TagRefusal(404, 'Shipment not found');
  }
  // A listing is the load plan of a shipment that is still on the dock (Phase 8).
  if (!['PENDING', 'LOADING'].includes(shipment.status)) {
    throw new TagRefusal(409, `Shipment ${shipment.shipmentNumber} is ${shipment.status}. A listing is made while the shipment is on the dock.`);
  }
  if (originLocationId !== shipment.fromLocationId) {
    throw new TagRefusal(409, 'The listing starts where its shipment leaves from.');
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
      // From the counter, one after another (Phase 8, N-012).
      listingId: await prisma.$transaction((tx) => nextNumber(tx, 'DTL', 'DTL')),
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
  const shipment = await prisma.shipment.findUnique({ where: { id: listing.shipmentId }, select: { orderId: true, shipmentNumber: true } });
  if (tags.length !== new Set(dropTagIds).size) errors.push('One or more of those tags is not on file');
  for (const tag of tags) {
    // What goes on a truck's listing is material of the order that truck carries (Phase 8).
    if (shipment && tag.orderId !== shipment.orderId) {
      errors.push(`Tag ${tag.dropTagId} is for a different order than shipment ${shipment.shipmentNumber}`);
    }
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

  // No document numbers are made up (Phase 8, N-014). The packing list and the bill of lading are
  // drawn from the shipment itself: GET /api/shipments/:id/documents, or the print queue.
  const packingListDocId = null; const cocBundleId = null; const mtrBundleId = null;
  const updated = await prisma.dropTagListing.update({
    where: { id: listingId },
    data: { status: 'PRINTED' },
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
    documents: { shipmentPapers: `/api/shipments/${listing.shipmentId}/documents`, note: 'The packing list and bill of lading are drawn from the shipment. Certificates are the mill certificates on file for each heat.' },
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
  // The truck has left when its shipment has been dispatched: that is what takes the stock and
  // raises the invoice. A listing cannot say "departed" on its own (Phase 8).
  const truck = await prisma.shipment.findUnique({ where: { id: listing.shipmentId }, select: { status: true, shipmentNumber: true } });
  if (!truck || !['IN_TRANSIT', 'EXCEPTION', 'DELIVERED'].includes(truck.status)) {
    throw new TagRefusal(409, `Dispatch shipment ${truck?.shipmentNumber || ''} first. The listing departs with it.`.replace('  ', ' '));
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
  // Delivered is said once, on the shipment, with who received it (Phase 8).
  const delivered = await prisma.shipment.findUnique({ where: { id: listing.shipmentId }, select: { status: true, shipmentNumber: true } });
  if (!delivered || delivered.status !== 'DELIVERED') {
    throw new TagRefusal(409, `Record the delivery on shipment ${delivered?.shipmentNumber || ''} first. The listing follows it.`.replace('  ', ' '));
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

/** The custody record of a listing step: the role is the one the person really has, and the hash is a hash (Phase 8, N-011). */
async function createTraceEvent(data) {
  const actor = data.actorUserId ? await prisma.user.findUnique({ where: { id: data.actorUserId }, select: { role: true } }) : null;
  return recordTrace(prisma, { ...data, actorRole: actor?.role || 'UNKNOWN' });
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
