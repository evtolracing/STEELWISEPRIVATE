/**
 * Print Queue Routes
 * REST API for the automated print queue
 * GET  /api/print-queue          — list pending print jobs
 * GET  /api/print-queue/history  — last 50 queue events
 * GET  /api/print-queue/:id/render — HTML rendition of a tag for browser printing
 * POST /api/print-queue/:id/printed — mark as printed
 * POST /api/print-queue/:id/skip    — skip (won't be requeued)
 * POST /api/print-queue/trigger  — manually trigger a print job by jobId/status
 */

import { Router } from 'express';
import prisma from '../lib/db.js';
import printAutomation, {
  markPrinted,
  markSkipped,
  getPendingQueue,
  getQueueHistory,
  onJobStatusChange,
  onShipmentCreated,
  manualEnqueue,
  reprintById,
} from '../services/printAutomationService.js';
import { renderTagHTML } from '../services/tagRenderer.js';

const router = Router();

// ── GET /api/print-queue ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const pending = getPendingQueue();
  res.json({
    pendingCount: pending.length,
    queue: pending,
  });
});

// ── GET /api/print-queue/history ─────────────────────────────────────────────
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ history: getQueueHistory(limit) });
});

// ── GET /api/print-queue/:id/render ──────────────────────────────────────────
// Returns complete, print-ready HTML for a given queue entry
router.get('/:id/render', (req, res) => {
  const { id } = req.params;
  const allJobs = getQueueHistory(500);
  const job = allJobs.find((j) => j.id === id);

  if (!job) {
    return res.status(404).json({ error: 'Print job not found' });
  }

  try {
    const html = renderTagHTML(job.type, job.payload);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: 'Render failed', details: err.message });
  }
});

// ── POST /api/print-queue/:id/printed ────────────────────────────────────────
router.post('/:id/printed', async (req, res) => {
  try {
    const job = await markPrinted(req.params.id);
    res.json({ success: true, job });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ── POST /api/print-queue/:id/skip ───────────────────────────────────────────
router.post('/:id/skip', async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await markSkipped(req.params.id, reason);
    res.json({ success: true, job });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ── POST /api/print-queue/trigger ────────────────────────────────────────────
// Manual trigger: queue a print job for any job by ID or number
// Send { force: true } to bypass dedup (reprint scenarios)
router.post('/trigger', async (req, res) => {
  try {
    const { jobId, jobNumber, type, force } = req.body;

    let job;
    if (jobId) {
      job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          order: { include: { buyer: true } },
          workCenter: true,
        },
      });
    } else if (jobNumber) {
      job = await prisma.job.findFirst({
        where: { jobNumber },
        include: {
          order: { include: { buyer: true } },
          workCenter: true,
        },
      });
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // If force is set, use manualEnqueue which always queues
    if (force && type) {
      const printJob = await manualEnqueue(type, job);
      return res.json({
        success: true,
        message: `Print job queued for ${job.jobNumber} (${type})`,
        printJobId: printJob.id,
      });
    }

    // Default to READY_TO_SHIP to trigger shipping label, or use provided type
    const triggerStatus = type === 'DTL_TAG' ? 'SCHEDULED'
      : type === 'BUNDLE_TAG' ? 'PACKAGING'
      : type === 'SHIPPING_LABEL' ? 'READY_TO_SHIP'
      : job.status;

    await onJobStatusChange(job, triggerStatus, job.status);

    res.json({
      success: true,
      message: `Print job triggered for ${job.jobNumber} (${triggerStatus})`,
    });
  } catch (err) {
    console.error('Trigger error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/print-queue/:id/reprint ─────────────────────────────────────────
// Re-queue a previously printed or skipped job (creates a new pending entry)
router.post('/:id/reprint', async (req, res) => {
  try {
    const newJob = await reprintById(req.params.id);
    res.json({ success: true, message: `Reprinted: ${newJob.label}`, printJob: newJob });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ── POST /api/print-queue/trigger-shipment ────────────────────────────────────
router.post('/trigger-shipment', async (req, res) => {
  try {
    const { shipmentId } = req.body;
    if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        jobs: { include: { order: true } },
      },
    });

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    await onShipmentCreated(shipment);
    res.json({ success: true, message: `BOL + Packing List queued for shipment ${shipmentId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
