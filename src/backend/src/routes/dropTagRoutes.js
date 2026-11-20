/**
 * Drop Tag Routes
 * API endpoints for Drop Tag Engine
 */

import express from 'express';
import { can } from '../lib/roleStore.js';
import dropTagService, { TagRefusal } from '../services/dropTagService.js';
import dropTagListingService from '../services/dropTagListingService.js';
import scanService from '../services/scanService.js';
import templateService from '../services/templateService.js';

const router = express.Router();

// Helper to get user ID from request (simplified for now)
// The person is the one signed in. A header naming someone else is never taken as who did it.
const getUserId = (req) => req.user.id;

// ============================================================================
// DROP TAG ENDPOINTS
// ============================================================================


/**
 * GET /api/drop-tags
 * Search drop tags with filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      shipmentId,
      orderId,
      customerId,
      heatNumber,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const result = await dropTagService.searchDropTags({
      shipmentId,
      orderId,
      customerId,
      heatNumber,
      status,
      fromDate,
      toDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching drop tags:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/drop-tags/ready-to-print
 * Get all tags ready to print
 */
router.get('/ready-to-print', async (req, res) => {
  try {
    const { locationId } = req.query;
    const tags = await dropTagService.getDropTagsReadyToPrint(locationId);
    res.json(tags);
  } catch (error) {
    console.error('Error getting ready-to-print tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TEMPLATE ENDPOINTS (must come before /:id routes)
// ============================================================================

/**
 * GET /api/drop-tags/templates
 * Get all templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { templateType, customerId, active } = req.query;

    const templates = await templateService.getTemplates({
      templateType,
      customerId,
      active: active !== 'false',
    });

    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/drop-tags/templates/:id
 * Get template by ID
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/templates
 * Create a new template
 */
router.post('/templates', async (req, res) => {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/drop-tags/templates/:id
 * Update a template
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.updateTemplate(id, req.body);
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/templates/:id/preview
 * Generate template preview
 */
router.post('/templates/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { sampleData } = req.body;

    const result = await templateService.generatePreview(id, sampleData);
    res.json(result);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/templates/seed
 * Seed default templates
 */
router.post('/templates/seed', async (req, res) => {
  try {
    await templateService.seedDefaultTemplates();
    res.json({ success: true, message: 'Default templates seeded' });
  } catch (error) {
    console.error('Error seeding templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/drop-tags/:id
 * Get a drop tag by ID
 */
router.get('/:id', async (req, res, next) => {
  // "listings" is the list of listings further down, not a tag (Phase 8: this route used to answer for it).
  if (req.params.id === 'listings') return next();
  try {
    const { id } = req.params;
    
    // Check if it's a dropTagId (DT-...) or UUID
    const tag = id.startsWith('DT-')
      ? await dropTagService.getDropTagByTagId(id)
      : await dropTagService.getDropTagById(id);

    if (!tag) {
      return res.status(404).json({ error: 'Drop tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error getting drop tag:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/validate
 * Validate a package for tagging (pre-check)
 */
router.post('/validate', async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const result = await dropTagService.validatePackageForTagging(packageId);
    res.json(result);
  } catch (error) {
    console.error('Error validating package:', error);
    res.status(500).json({ error: error.message });
  }
});






// ============================================================================
// PACKAGE ENDPOINTS
// ============================================================================


// ============================================================================
// PACKAGES AND TAGS: every step that changes one (Phase 8, N-008 to N-013)
// ============================================================================
// The person is the one signed in, and the custody record carries the role they really have.
// mayOverride: the person may print a tag again past the limit and void a tag that left the dock.
const who = (req) => ({ userId: req.user.id, role: req.user.role, mayOverride: can(req, 'dropTags:override') });
const step = (label, fn) => async (req, res) => {
  try {
    const out = await fn(req);
    res.status(out?.created ? 201 : 200).json(out?.created ? out.body : out);
  } catch (error) {
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    if (error?.status === 403 && error?.name === 'OutsideBranch') return res.status(403).json({ error: error.message });
    if (error?.code === 'P2003' || error?.code === 'P2025' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The request has a field that is not valid' });
    console.error(`Drop tags: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

router.post('/', step('make the tag', async (req) => {
  const { packageId, templateCode } = req.body || {};
  if (!packageId) throw new TagRefusal(400, 'packageId is required');
  return { created: true, body: await dropTagService.generateDropTag({ packageId: String(packageId), templateCode, ...who(req) }) };
}));
router.post('/:id/validate', step('validate the tag', (req) => dropTagService.validateAndReadyToPrint(req.params.id, req.user.id, req.user.role)));
router.post('/:id/print', step('print the tag', (req) => {
  const { stationId, templateCode, copies = 1 } = req.body || {};
  return dropTagService.printDropTag(req.params.id, { stationId, templateCode, copies, ...who(req) });
}));
router.post('/:id/reprint', step('print the tag again', (req) => {
  const { reason, stationId, copies = 1 } = req.body || {};
  if (!reason) throw new TagRefusal(400, 'reason is required for reprint');
  return dropTagService.reprintDropTag(req.params.id, { reason, stationId, copies, ...who(req) });
}));
router.post('/:id/apply', step('apply the tag', (req) => dropTagService.applyDropTag(req.params.id, { packageScanValue: req.body?.packageScanValue, ...who(req) })));
router.post('/:id/void', step('void the tag', (req) => dropTagService.voidDropTag(req.params.id, { reason: req.body?.reason, claimId: req.body?.claimId, ...who(req) })));

router.post('/packages', step('open the package', async (req) => {
  const { packageType, orderId, orderLineId, jobId } = req.body || {};
  if (!packageType) throw new TagRefusal(400, 'packageType is required');
  return { created: true, body: await dropTagService.createPackage({ packageType, orderId, orderLineId, jobId, ...who(req) }) };
}));
router.post('/packages/:id/items', step('add to the package', async (req) => ({ created: true, body: await dropTagService.addPackageItem(req.params.id, req.body || {}, req.user.id, req.user.role) })));
router.post('/packages/:id/ready', step('send the package to quality', (req) => dropTagService.markPackageReady(req.params.id, { grossWeightLbs: req.body?.grossWeightLbs, ...who(req) })));
router.post('/packages/:id/seal', step('seal the package', (req) => dropTagService.sealPackage(req.params.id, { sealId: req.body?.sealId, ...who(req) })));
router.post('/packages/:id/qc-release', step('release the package', (req) => dropTagService.releasePackageQC(req.params.id, { notes: req.body?.notes, ...who(req) })));
router.post('/packages/:id/qc-hold', step('hold the package', (req) => dropTagService.holdPackageQC(req.params.id, { reason: req.body?.reason, ...who(req) })));

/**
 * GET /api/drop-tags/packages/ready
 * Get packages ready for tagging
 */
router.get('/packages/ready', async (req, res) => {
  try {
    const packages = await dropTagService.getPackagesReadyForTagging();
    res.json(packages);
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(500).json({ error: error.message });
  }
});




// ============================================================================
// DROP TAG LISTING ENDPOINTS
// ============================================================================

/**
 * POST /api/drop-tags/listings
 * Create a new listing (shipment manifest)
 */
router.post('/listings', async (req, res) => {
  try {
    const { shipmentId, originLocationId, dropTagIds } = req.body;
    const userId = getUserId(req);

    if (!shipmentId || !originLocationId) {
      return res.status(400).json({ error: 'shipmentId and originLocationId are required' });
    }

    const listing = await dropTagListingService.createListing({
      shipmentId,
      originLocationId,
      dropTagIds,
      userId,
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/drop-tags/listings
 * Search listings
 */
router.get('/listings', async (req, res) => {
  try {
    const { shipmentId, status, fromDate, toDate, page = 1, limit = 20 } = req.query;

    const result = await dropTagListingService.searchListings({
      shipmentId,
      status,
      fromDate,
      toDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/drop-tags/listings/:id
 * Get listing by ID
 */
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await dropTagListingService.getListingById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Error getting listing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/listings/:id/tags
 * Add tags to listing
 */
router.post('/listings/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { dropTagIds } = req.body;
    const userId = getUserId(req);

    if (!dropTagIds || !Array.isArray(dropTagIds)) {
      return res.status(400).json({ error: 'dropTagIds array is required' });
    }

    const result = await dropTagListingService.addTagsToListing(id, {
      dropTagIds,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error adding tags to listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/drop-tags/listings/:id/tags
 * Remove tags from listing
 */
router.delete('/listings/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { dropTagIds } = req.body;
    const userId = getUserId(req);

    const result = await dropTagListingService.removeTagsFromListing(id, {
      dropTagIds,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error removing tags from listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/listings/:id/print
 * Print listing manifest
 */
router.post('/listings/:id/print', async (req, res) => {
  try {
    const { id } = req.params;
    const { stationId, includePackingList, includeDocBundle } = req.body;
    const userId = getUserId(req);

    const result = await dropTagListingService.printListing(id, {
      stationId,
      includePackingList,
      includeDocBundle,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error printing listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/listings/:id/lock
 * Lock listing and depart
 */
router.post('/listings/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const listing = await dropTagListingService.lockAndDepart(id, userId);
    res.json(listing);
  } catch (error) {
    console.error('Error locking listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/listings/:id/deliver
 * Confirm all delivered
 */
router.post('/listings/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    const { podDocId, podSignature, podSignedBy } = req.body;
    const userId = getUserId(req);

    const listing = await dropTagListingService.confirmAllDelivered(id, {
      podDocId,
      podSignature,
      podSignedBy,
      userId,
    });

    res.json(listing);
  } catch (error) {
    console.error('Error confirming delivery:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/listings/:id/close
 * Close listing
 */
router.post('/listings/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const listing = await dropTagListingService.closeListing(id, userId);
    res.json(listing);
  } catch (error) {
    console.error('Error closing listing:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SCAN ENDPOINTS
// ============================================================================

/**
 * POST /api/drop-tags/scans
 * Universal scan endpoint
 */
router.post('/scans', async (req, res) => {
  try {
    const {
      identifierType,
      identifierValue,
      stationType,
      stationId,
      locationId,
      context,
    } = req.body;
    const userId = getUserId(req);

    if (!identifierValue || !stationType) {
      return res.status(400).json({ error: 'identifierValue and stationType are required' });
    }

    const result = await scanService.processScan({
      identifierType: identifierType || 'BARCODE',
      identifierValue,
      stationType,
      stationId,
      locationId,
      context,
      actorUserId: userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error processing scan:', error);
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    res.status(400).json({ error: error.message });
  }
});

export default router;
