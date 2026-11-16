/**
 * Print queue API. Mount: /api/print-queue
 *
 *   GET  /                    waiting jobs for the reader's branch (urgent first), with the full count
 *   GET  /history             the most recent jobs, any status
 *   GET  /:id/render          the printable page of one job
 *   POST /:id/printed         mark a waiting job printed (once)
 *   POST /:id/skip            { reason } mark a waiting job skipped (once)
 *   POST /:id/reprint         queue another copy
 *   POST /trigger             { jobId | jobNumber, type?, force? } queue a tag for a job
 *   POST /trigger-shipment    { shipmentId } queue the bill of lading and packing list of a shipment
 *
 * A print job belongs to one branch (Phase 8, N-015): the lists and every step are held to the
 * reader's branches by the database layer (lib/branchScope.js).
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import {
  markPrinted, markSkipped, getPendingQueue, getQueueHistory, getPrintJob, onJobStatusChange, queueShipmentPapers, manualEnqueue, reprintById,
} from '../services/printAutomationService.js';
import { renderTagHTML } from '../services/tagRenderer.js';

const router = Router();

const step = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error?.refused) return res.status(error.status).json({ error: error.message });
    if (error?.name === 'OutsideBranch') return res.status(403).json({ error: error.message });
    console.error(`Print queue: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

router.get('/', step('load the print queue', async (req, res) => {
  const pending = await getPendingQueue();
  res.json({ pendingCount: pending.total, shown: pending.length, queue: pending });
}));

router.get('/history', step('load the print history', async (req, res) => {
  res.json({ history: await getQueueHistory(parseInt(req.query.limit, 10) || 50) });
}));

router.get('/:id/render', step('draw the print job', async (req, res) => {
  const job = await getPrintJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Print job not found' });
  res.setHeader('Content-Type', 'text/html');
  res.send(renderTagHTML(job.type, job.payload));
}));

router.post('/:id/printed', step('mark the job printed', async (req, res) => {
  res.json({ success: true, job: await markPrinted(req.params.id, req.user?.id) });
}));

router.post('/:id/skip', step('skip the job', async (req, res) => {
  res.json({ success: true, job: await markSkipped(req.params.id, req.body?.reason, req.user?.id) });
}));

const TAG_FOR_STATUS = { DTL_TAG: 'SCHEDULED', BUNDLE_TAG: 'PACKAGING', SHIPPING_LABEL: 'READY_TO_SHIP' };
router.post('/trigger', step('queue the tag', async (req, res) => {
  const { jobId, jobNumber, type, force } = req.body || {};
  if (!jobId && !jobNumber) return res.status(400).json({ error: 'jobId or jobNumber is required' });
  if (type !== undefined && !(type in TAG_FOR_STATUS)) return res.status(400).json({ error: `type must be one of: ${Object.keys(TAG_FOR_STATUS).join(', ')}` });
  // Found under the reader's branch rule: a job of another branch is not found.
  const job = await prisma.job.findFirst({ where: jobId ? { id: String(jobId) } : { jobNumber: String(jobNumber) }, select: { id: true, jobNumber: true, status: true } });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (force && type) {
    const printJob = await manualEnqueue(type, job);
    return res.json({ success: true, message: `Print job queued for ${job.jobNumber} (${type})`, printJobId: printJob.id });
  }
  const status = type ? TAG_FOR_STATUS[type] : job.status;
  const printJob = await onJobStatusChange(job, status);
  res.json({ success: true, queued: Boolean(printJob), printJobId: printJob?.id || null, message: printJob ? `Print job queued for ${job.jobNumber}` : `Nothing new was queued for ${job.jobNumber}: its tag is already waiting, or its status needs none.` });
}));

router.post('/:id/reprint', step('queue another copy', async (req, res) => {
  const newJob = await reprintById(req.params.id);
  res.json({ success: true, message: `Reprinted: ${newJob.label}`, printJob: newJob });
}));

router.post('/trigger-shipment', step('queue the shipping papers', async (req, res) => {
  const { shipmentId } = req.body || {};
  if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });
  const jobs = await queueShipmentPapers(String(shipmentId));
  res.json({ success: true, message: 'The bill of lading and the packing list are in the print queue.', printJobIds: jobs.map((j) => j.id), papers: jobs.map((j) => ({ id: j.id, type: j.type })) });
}));

export default router;
