/**
 * Material Tracking Routes
 * Unified API for packaging, tags, staging, and custody/traceability
 * Combines Packaging Queue + Drop Tag Engine + Chain of Custody
 */

import express from 'express';
import prisma from '../lib/db.js';

const router = express.Router();

const getUserId = (req) => req.user?.id || req.headers['x-user-id'] || 'system';

// ============================================================================
// DASHBOARD / STATS
// ============================================================================

/**
 * GET /api/material-tracking/stats
 * Aggregate stats across all material tracking stages
 */
router.get('/stats', async (req, res) => {
  try {
    // Job counts by status
    const jobCounts = await prisma.job.groupBy({
      by: ['status'],
      where: {
        status: {
          in: ['WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'],
        },
      },
      _count: { id: true },
    });

    // Package counts by status
    const packageCounts = await prisma.package.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Drop tag counts by status
    const tagCounts = await prisma.dropTag.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Recent trace events count (last 24h)
    const recentEventsCount = await prisma.traceEvent.count({
      where: {
        occurredAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Format into a clean response
    const jobs = {};
    jobCounts.forEach((r) => { jobs[r.status] = r._count.id; });

    const packages = {};
    packageCounts.forEach((r) => { packages[r.status] = r._count.id; });

    const tags = {};
    tagCounts.forEach((r) => { tags[r.status] = r._count.id; });

    res.json({
      jobs,
      packages,
      tags,
      recentEventsCount,
      totals: {
        activeJobs: Object.values(jobs).reduce((a, b) => a + b, 0),
        activePackages: Object.values(packages).reduce((a, b) => a + b, 0),
        activeTags: Object.values(tags).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    console.error('Error getting material tracking stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CUSTODY / TRACEABILITY LOG
// ============================================================================

/**
 * GET /api/material-tracking/custody-log
 * Get trace events with filtering
 */
router.get('/custody-log', async (req, res) => {
  try {
    const {
      jobId,
      orderId,
      dropTagId,
      resourceType,
      eventType,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (jobId) {
      // Find trace events related to this job via drop tags
      const jobDropTags = await prisma.dropTag.findMany({
        where: { jobId },
        select: { id: true },
      });
      where.dropTagId = { in: jobDropTags.map((t) => t.id) };
    }
    if (orderId) where.orderId = orderId;
    if (dropTagId) where.dropTagId = dropTagId;
    if (resourceType) where.resourceType = resourceType;
    if (eventType) where.eventType = eventType;
    if (fromDate || toDate) {
      where.occurredAt = {};
      if (fromDate) where.occurredAt.gte = new Date(fromDate);
      if (toDate) where.occurredAt.lte = new Date(toDate);
    }

    const [events, total] = await Promise.all([
      prisma.traceEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          dropTag: {
            select: { dropTagId: true, grade: true, heatNumber: true, status: true },
          },
        },
      }),
      prisma.traceEvent.count({ where }),
    ]);

    res.json({
      events,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting custody log:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/material-tracking/custody-log
 * Create a manual custody log entry (e.g., location transfer, note)
 */
router.post('/custody-log', async (req, res) => {
  try {
    const {
      eventType,
      resourceType,
      resourceId,
      previousState,
      newState,
      metadata,
      dropTagId,
      orderId,
    } = req.body;

    const userId = getUserId(req);

    if (!eventType || !resourceType || !resourceId) {
      return res.status(400).json({
        error: 'eventType, resourceType, and resourceId are required',
      });
    }

    const event = await prisma.traceEvent.create({
      data: {
        eventType,
        eventCategory: resourceType,
        actorUserId: userId,
        actorRole: 'operator',
        resourceType,
        resourceId,
        previousState,
        newState,
        metadata: metadata || undefined,
        dropTagId: dropTagId || undefined,
        orderId: orderId || undefined,
        occurredAt: new Date(),
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating custody log entry:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// TAGS FOR A JOB
// ============================================================================

/**
 * GET /api/material-tracking/jobs/:jobId/tags
 * Get all drop tags associated with a job
 */
router.get('/jobs/:jobId/tags', async (req, res) => {
  try {
    const { jobId } = req.params;

    const tags = await prisma.dropTag.findMany({
      where: { jobId },
      include: {
        package: {
          select: { packageId: true, packageType: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tags);
  } catch (error) {
    console.error('Error getting tags for job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/material-tracking/jobs/:jobId/packages
 * Get all packages associated with a job
 */
router.get('/jobs/:jobId/packages', async (req, res) => {
  try {
    const { jobId } = req.params;

    const packages = await prisma.package.findMany({
      where: { jobId },
      include: {
        packageItems: true,
        dropTags: {
          select: { id: true, dropTagId: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(packages);
  } catch (error) {
    console.error('Error getting packages for job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/material-tracking/jobs/:jobId/timeline
 * Combined timeline of all events for a job (status changes, tags, packages, custody)
 */
router.get('/jobs/:jobId/timeline', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        order: { select: { orderNumber: true, buyer: { select: { name: true } } } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all trace events for tags associated with this job
    const jobTags = await prisma.dropTag.findMany({
      where: { jobId },
      select: { id: true },
    });
    const tagIds = jobTags.map((t) => t.id);

    const traceEvents = tagIds.length > 0
      ? await prisma.traceEvent.findMany({
          where: { dropTagId: { in: tagIds } },
          orderBy: { occurredAt: 'desc' },
          take: 100,
        })
      : [];

    // Get QC inspections
    const inspections = await prisma.jobInspection.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        inspector: { select: { firstName: true, lastName: true } },
      },
    });

    // Build unified timeline
    const timeline = [];

    // Job creation
    timeline.push({
      type: 'job',
      event: 'JOB_CREATED',
      timestamp: job.createdAt,
      description: `Job ${job.jobNumber} created`,
      status: 'SCHEDULED',
    });

    // QC inspections
    inspections.forEach((insp) => {
      timeline.push({
        type: 'qc',
        event: `QC_${insp.result || 'INSPECTION'}`,
        timestamp: insp.createdAt,
        description: `QC inspection: ${insp.result || 'pending'} by ${insp.inspector?.firstName || 'Unknown'} ${insp.inspector?.lastName || ''}`,
        status: insp.result,
        details: insp.notes,
      });
    });

    // Trace events
    traceEvents.forEach((evt) => {
      timeline.push({
        type: 'trace',
        event: evt.eventType,
        timestamp: evt.occurredAt,
        description: `${evt.eventType.replace(/_/g, ' ')}`,
        previousState: evt.previousState,
        newState: evt.newState,
        actor: evt.actorName || evt.actorUserId,
      });
    });

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
        orderNumber: job.order?.orderNumber,
        customerName: job.order?.buyer?.name,
      },
      timeline,
    });
  } catch (error) {
    console.error('Error getting job timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STAGING / LOADING
// ============================================================================

/**
 * GET /api/material-tracking/staging
 * Get jobs/packages in staging area (READY_TO_SHIP status)
 */
router.get('/staging', async (req, res) => {
  try {
    // Get jobs that are ready to ship or being staged
    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ['READY_TO_SHIP', 'SHIPPED'] },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
            shipToAddress: true,
            shipToCity: true,
            shipToState: true,
            requiredDate: true,
          },
        },
        packages: {
          select: {
            id: true,
            packageId: true,
            packageType: true,
            status: true,
            grossWeightLbs: true,
            netWeightLbs: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Map to frontend format
    const staged = jobs.map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      customerName: job.order?.buyer?.name || 'Unknown',
      orderNumber: job.order?.orderNumber,
      shipTo: [job.order?.shipToCity, job.order?.shipToState].filter(Boolean).join(', '),
      dueDate: job.order?.requiredDate,
      shippingCarrier: job.shippingCarrier,
      trackingNumber: job.trackingNumber,
      shippedAt: job.shippedAt,
      packages: job.packages,
      packageCount: job.packages.length,
      priority: job.priority <= 1 ? 'Critical' : job.priority === 2 ? 'High' : job.priority === 3 ? 'Medium' : 'Low',
    }));

    res.json(staged);
  } catch (error) {
    console.error('Error getting staging data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/material-tracking/staging/:jobId/ship
 * Mark a staged job as shipped with carrier/tracking info
 */
router.patch('/staging/:jobId/ship', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { carrier, trackingNumber } = req.body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SHIPPED',
        shippingCarrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        shippedAt: new Date(),
      },
    });

    // Auto-log custody event
    await prisma.traceEvent.create({
      data: {
        eventType: 'JOB_SHIPPED',
        eventCategory: 'JOB',
        actorUserId: getUserId(req),
        actorRole: 'operator',
        resourceType: 'Job',
        resourceId: jobId,
        previousState: 'READY_TO_SHIP',
        newState: 'SHIPPED',
        metadata: { carrier, trackingNumber },
        occurredAt: new Date(),
      },
    });

    res.json(job);
  } catch (error) {
    console.error('Error shipping job:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// AUTO-LOG: Job status change hook
// ============================================================================

/**
 * POST /api/material-tracking/log-status-change
 * Called internally when a job status changes to auto-create custody entries
 */
router.post('/log-status-change', async (req, res) => {
  try {
    const { jobId, previousStatus, newStatus, actor } = req.body;

    const event = await prisma.traceEvent.create({
      data: {
        eventType: `JOB_STATUS_${newStatus}`,
        eventCategory: 'JOB',
        actorUserId: actor || 'system',
        actorRole: 'system',
        resourceType: 'Job',
        resourceId: jobId,
        previousState: previousStatus,
        newState: newStatus,
        occurredAt: new Date(),
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error logging status change:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
