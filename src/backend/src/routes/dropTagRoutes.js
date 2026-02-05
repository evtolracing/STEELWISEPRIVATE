/**
 * Drop Tag Routes
 * API endpoints for Drop Tag Engine
 */

import express from 'express';
import dropTagService from '../services/dropTagService.js';
import dropTagListingService from '../services/dropTagListingService.js';
import scanService from '../services/scanService.js';
import templateService from '../services/templateService.js';

const router = express.Router();

// Helper to get user ID from request (simplified for now)
const getUserId = (req) => req.user?.id || req.headers['x-user-id'] || 'system';

// ============================================================================
// DROP TAG ENDPOINTS
// ============================================================================

/**
 * POST /api/drop-tags
 * Generate a new drop tag for a package
 */
router.post('/', async (req, res) => {
  try {
    const { packageId, templateCode, generateForEachPiece } = req.body;
    const userId = getUserId(req);

    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const result = await dropTagService.generateDropTag({
      packageId,
      templateCode,
      userId,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error generating drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

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
router.get('/:id', async (req, res) => {
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

/**
 * POST /api/drop-tags/:id/validate
 * Validate and mark tag ready to print
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const tag = await dropTagService.validateAndReadyToPrint(id, userId);
    res.json(tag);
  } catch (error) {
    console.error('Error validating drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/:id/print
 * Print a drop tag
 */
router.post('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;
    const { stationId, templateCode, copies = 1 } = req.body;
    const userId = getUserId(req);

    const result = await dropTagService.printDropTag(id, {
      stationId,
      templateCode,
      copies,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error printing drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/:id/reprint
 * Reprint a drop tag (requires reason)
 */
router.post('/:id/reprint', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, stationId, copies = 1 } = req.body;
    const userId = getUserId(req);

    if (!reason) {
      return res.status(400).json({ error: 'reason is required for reprint' });
    }

    const result = await dropTagService.reprintDropTag(id, {
      reason,
      stationId,
      copies,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error reprinting drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/:id/apply
 * Apply a drop tag to package (scan confirmation)
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { packageScanValue } = req.body;
    const userId = getUserId(req);

    const result = await dropTagService.applyDropTag(id, {
      packageScanValue,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error applying drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/:id/void
 * Void a drop tag
 */
router.post('/:id/void', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, claimId } = req.body;
    const userId = getUserId(req);

    if (!reason) {
      return res.status(400).json({ error: 'reason is required for void' });
    }

    const result = await dropTagService.voidDropTag(id, {
      reason,
      claimId,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error voiding drop tag:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// PACKAGE ENDPOINTS
// ============================================================================

/**
 * POST /api/drop-tags/packages
 * Create a new package
 */
router.post('/packages', async (req, res) => {
  try {
    const { packageType, orderId, orderLineId, jobId } = req.body;
    const userId = getUserId(req);

    if (!packageType) {
      return res.status(400).json({ error: 'packageType is required' });
    }

    const pkg = await dropTagService.createPackage({
      packageType,
      orderId,
      orderLineId,
      jobId,
      userId,
    });

    res.status(201).json(pkg);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(400).json({ error: error.message });
  }
});

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

/**
 * POST /api/drop-tags/packages/:id/items
 * Add item to package
 */
router.post('/packages/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const item = await dropTagService.addPackageItem(id, req.body, userId);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding package item:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/packages/:id/seal
 * Seal a package
 */
router.post('/packages/:id/seal', async (req, res) => {
  try {
    const { id } = req.params;
    const { sealId } = req.body;
    const userId = getUserId(req);

    if (!sealId) {
      return res.status(400).json({ error: 'sealId is required' });
    }

    const result = await dropTagService.sealPackage(id, { sealId, userId });
    res.json(result);
  } catch (error) {
    console.error('Error sealing package:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/drop-tags/packages/:id/qc-release
 * QC release a package
 */
router.post('/packages/:id/qc-release', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = getUserId(req);

    const pkg = await dropTagService.releasePackageQC(id, { notes, userId });
    res.json(pkg);
  } catch (error) {
    console.error('Error releasing package QC:', error);
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

export default router;
