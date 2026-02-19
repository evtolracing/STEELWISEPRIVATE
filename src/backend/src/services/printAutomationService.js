/**
 * Print Automation Service
 * Automatically queues tags and documents for printing based on job/shipment status changes.
 *
 * Tags generated per trigger:
 *  - Job → SCHEDULED     → DTL (Detail/Work Order) tag
 *  - Job → IN_PROCESS    → DTL tag (if not already generated)
 *  - Job → PACKAGING     → Bundle/Drop Tag (auto-generates DropTag record)
 *  - Job → READY_TO_SHIP → Shipping Label
 *  - Job → SHIPPED       → nothing (already done)
 *  - Shipment created    → BOL + Packing List queued
 */

import prisma from '../lib/db.js';
import crypto from 'crypto';

// ── In-memory queue (augmented by AuditLog persistence) ──────────────────────
const printQueue = new Map(); // key: printJobId, value: PrintJob

function generatePrintJobId() {
  return `PJ-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Add a print job to the queue and persist to AuditLog
 */
async function enqueue(type, label, payload, priority = 'NORMAL') {
  const id = generatePrintJobId();
  const job = {
    id,
    type,            // DTL_TAG | BUNDLE_TAG | SHIPPING_LABEL | BOL | PACKING_LIST
    label,           // Human-readable description e.g. "DTL Tag – JOB-00003"
    priority,        // HIGH | NORMAL
    status: 'PENDING',
    payload,         // All data needed to render the tag/doc
    createdAt: new Date().toISOString(),
    printedAt: null,
    skippedAt: null,
  };

  printQueue.set(id, job);

  // Persist to AuditLog so queue survives across nav
  try {
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'PRINT_JOB_QUEUED',
        severity: priority === 'HIGH' ? 'WARNING' : 'INFO',
        resourceType: type,
        resourceId: payload.jobNumber || payload.shipmentId || id,
        action: 'ENQUEUE',
        details: { printJobId: id, type, label, priority, payload },
      },
    });
  } catch (_) { /* non-blocking */ }

  console.log(`[PrintAutomation] Queued ${type}: ${label}`);
  return job;
}

/**
 * Mark a print job as printed (removes from active queue)
 */
export async function markPrinted(printJobId) {
  const job = printQueue.get(printJobId);
  if (!job) throw new Error(`Print job ${printJobId} not found`);

  job.status = 'PRINTED';
  job.printedAt = new Date().toISOString();
  // Keep in map for history but consider it done

  try {
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'PRINT_JOB_PRINTED',
        severity: 'INFO',
        resourceType: job.type,
        resourceId: job.payload.jobNumber || job.payload.shipmentId || printJobId,
        action: 'PRINTED',
        details: { printJobId, type: job.type, label: job.label },
      },
    });
  } catch (_) { /* non-blocking */ }

  return job;
}

/**
 * Mark a print job as skipped
 */
export async function markSkipped(printJobId, reason = '') {
  const job = printQueue.get(printJobId);
  if (!job) throw new Error(`Print job ${printJobId} not found`);

  job.status = 'SKIPPED';
  job.skippedAt = new Date().toISOString();
  job.skipReason = reason;

  try {
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW',
        eventType: 'PRINT_JOB_SKIPPED',
        severity: 'INFO',
        resourceType: job.type,
        resourceId: job.payload.jobNumber || job.payload.shipmentId || printJobId,
        action: 'SKIPPED',
        details: { printJobId, reason },
      },
    });
  } catch (_) { /* non-blocking */ }

  return job;
}

/**
 * Get all PENDING print jobs (for frontend display)
 */
export function getPendingQueue() {
  return Array.from(printQueue.values())
    .filter((j) => j.status === 'PENDING')
    .sort((a, b) => {
      const priorityOrder = { HIGH: 0, NORMAL: 1 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });
}

/**
 * Get recent queue history (last 50, all statuses)
 */
export function getQueueHistory(limit = 50) {
  return Array.from(printQueue.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRIGGER HANDLERS — called by jobs.js on status change
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Called when a job status changes. Determines what to auto-queue.
 * @param {object} job - Full Prisma job object with relations
 * @param {string} newStatus
 * @param {string} oldStatus
 */
export async function onJobStatusChange(job, newStatus, oldStatus) {
  try {
    switch (newStatus) {

      // ── DTL Tag: queue when job enters production ──────────────────
      case 'SCHEDULED':
      case 'IN_PROCESS': {
        // Avoid duplicate: skip if we already queued a DTL for this job
        const alreadyQueued = Array.from(printQueue.values()).some(
          (p) => p.status === 'PENDING' && p.type === 'DTL_TAG' && p.payload.jobId === job.id
        );
        if (alreadyQueued) break;

        await enqueue(
          'DTL_TAG',
          `DTL Tag – ${job.jobNumber}`,
          buildDTLPayload(job),
          newStatus === 'IN_PROCESS' ? 'HIGH' : 'NORMAL'
        );
        break;
      }

      // ── Bundle Tag: queue when job enters packaging ─────────────────
      case 'PACKAGING': {
        await enqueue(
          'BUNDLE_TAG',
          `Bundle Tag – ${job.jobNumber}`,
          buildBundlePayload(job),
          'NORMAL'
        );
        break;
      }

      // ── Shipping Label: queue when job is complete/ready-to-ship ───
      case 'READY_TO_SHIP': {
        await enqueue(
          'SHIPPING_LABEL',
          `Shipping Label – ${job.jobNumber}`,
          buildShippingLabelPayload(job),
          'HIGH'
        );
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[PrintAutomation] onJobStatusChange error:', err.message);
  }
}

/**
 * Called when a shipment record is created or confirmed.
 * @param {object} shipment - Prisma shipment object with relations
 */
export async function onShipmentCreated(shipment) {
  try {
    await Promise.all([
      enqueue(
        'BOL',
        `Bill of Lading – ${shipment.shipmentNumber || shipment.id}`,
        buildBOLPayload(shipment),
        'HIGH'
      ),
      enqueue(
        'PACKING_LIST',
        `Packing List – ${shipment.shipmentNumber || shipment.id}`,
        buildPackingListPayload(shipment),
        'NORMAL'
      ),
    ]);
  } catch (err) {
    console.error('[PrintAutomation] onShipmentCreated error:', err.message);
  }
}

/**
 * Manual enqueue — always queues regardless of dedup.
 * Used for operator-initiated reprints.
 */
export async function manualEnqueue(type, job) {
  const builders = {
    DTL_TAG:        () => buildDTLPayload(job),
    BUNDLE_TAG:     () => buildBundlePayload(job),
    SHIPPING_LABEL: () => buildShippingLabelPayload(job),
  };
  const builder = builders[type];
  if (!builder) throw new Error(`Unknown tag type: ${type}`);

  return enqueue(
    type,
    `${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} – ${job.jobNumber} (Manual)`,
    builder(),
    'HIGH'
  );
}

/**
 * Reprint from an existing history item — re-enqueues the same payload.
 */
export async function reprintById(printJobId) {
  const original = Array.from(printQueue.values()).find((j) => j.id === printJobId);
  if (!original) throw new Error(`Print job ${printJobId} not found in history`);

  return enqueue(
    original.type,
    original.label.replace(/ \(Manual\)| \(Reprint\)/g, '') + ' (Reprint)',
    { ...original.payload, printedAt: new Date().toISOString() },
    'HIGH'
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYLOAD BUILDERS — assemble all data for each tag type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildDTLPayload(job) {
  return {
    tagType: 'DTL_TAG',
    jobId: job.id,
    jobNumber: job.jobNumber,
    customerName: job.order?.buyer?.name || job.order?.buyerName || 'N/A',
    orderNumber: job.order?.orderNumber || 'N/A',
    operationType: job.operationType || 'PROCESSING',
    workCenter: job.workCenter?.name || job.workCenter?.code || 'N/A',
    scheduledStart: job.scheduledStart ? new Date(job.scheduledStart).toLocaleDateString() : 'N/A',
    scheduledEnd: job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleDateString() : 'N/A',
    priority: job.priority,
    instructions: job.instructions || '',
    coilNumber: job.coilId || 'N/A',
    partNumber: job.partNumber || 'N/A',
    quantity: job.quantity || 1,
    unit: job.unit || 'EA',
    thickness: job.thickness || null,
    width: job.width || null,
    length: job.length || null,
    weight: job.weight || null,
    grade: job.gradeOverride || 'N/A',
    printedAt: new Date().toISOString(),
    barcodeValue: `JOB:${job.jobNumber}|OP:${job.operationType || 'PROC'}|DUE:${job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleDateString() : 'N/A'}`,
  };
}

function buildBundlePayload(job) {
  return {
    tagType: 'BUNDLE_TAG',
    jobId: job.id,
    jobNumber: job.jobNumber,
    customerName: job.order?.buyer?.name || 'N/A',
    orderNumber: job.order?.orderNumber || 'N/A',
    shipToName: job.order?.shipToName || job.order?.buyer?.name || 'N/A',
    shipToCity: job.order?.shipToCity || 'N/A',
    shipToAddress: job.order?.shipToAddress || '',
    heatNumber: job.heatNumber || 'N/A',
    coilNumber: job.coilId || 'N/A',
    grade: job.gradeOverride || 'N/A',
    thickness: job.thickness || null,
    width: job.width || null,
    length: job.length || null,
    weight: job.weight || null,
    pieces: job.quantity || 1,
    unit: job.unit || 'EA',
    requiredDate: job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleDateString() : 'N/A',
    instructions: job.instructions || '',
    printedAt: new Date().toISOString(),
    barcodeValue: `PKG:${job.jobNumber}|HEAT:${job.heatNumber || 'NA'}|CUST:${(job.order?.buyer?.name || 'NA').replace(/[^A-Z0-9]/gi, '')}`,
  };
}

function buildShippingLabelPayload(job) {
  return {
    tagType: 'SHIPPING_LABEL',
    jobId: job.id,
    jobNumber: job.jobNumber,
    orderNumber: job.order?.orderNumber || 'N/A',
    shipFromName: 'SteelWise Service Center',
    shipFromAddress: '1234 Industrial Pkwy, Chicago, IL 60601',
    shipToName: job.order?.shipToName || job.order?.buyer?.name || 'N/A',
    shipToAddress: job.order?.shipToAddress || 'N/A',
    shipToCity: job.order?.shipToCity || 'N/A',
    customerPO: job.order?.customerPO || 'N/A',
    weight: job.weight || null,
    pieces: job.quantity || 1,
    unit: job.unit || 'EA',
    grade: job.gradeOverride || 'N/A',
    heatNumber: job.heatNumber || 'N/A',
    carrier: '',         // Filled in when carrier is assigned
    serviceLevel: '',
    requiredDate: job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleDateString() : 'N/A',
    printedAt: new Date().toISOString(),
    barcodeValue: `SHIP:${job.jobNumber}|ORD:${job.order?.orderNumber || 'NA'}|DUE:${job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleDateString() : 'NA'}`,
  };
}

function buildBOLPayload(shipment) {
  return {
    tagType: 'BOL',
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber || shipment.id,
    bolNumber: shipment.bolNumber || `BOL-${Date.now()}`,
    carrier: shipment.carrier || 'TBD',
    trackingNumber: shipment.trackingNumber || 'TBD',
    shipFromName: 'SteelWise Service Center',
    shipFromAddress: '1234 Industrial Pkwy, Chicago, IL 60601',
    shipToName: shipment.shipToName || 'N/A',
    shipToAddress: shipment.shipToAddress || 'N/A',
    shipDate: shipment.scheduledDate ? new Date(shipment.scheduledDate).toLocaleDateString() : new Date().toLocaleDateString(),
    totalWeight: shipment.totalWeight || null,
    totalPieces: shipment.totalPieces || null,
    specialInstructions: shipment.specialInstructions || '',
    printedAt: new Date().toISOString(),
  };
}

function buildPackingListPayload(shipment) {
  return {
    tagType: 'PACKING_LIST',
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber || shipment.id,
    shipToName: shipment.shipToName || 'N/A',
    items: (shipment.jobs || []).map((j) => ({
      jobNumber: j.jobNumber,
      orderNumber: j.order?.orderNumber || 'N/A',
      description: j.operationType || 'Processing',
      grade: j.grade?.code || j.gradeId || 'N/A',
      weight: j.weight || null,
      pieces: j.quantity || 1,
      unit: j.unit || 'EA',
    })),
    totalWeight: shipment.totalWeight || null,
    totalPieces: shipment.totalPieces || null,
    printedAt: new Date().toISOString(),
  };
}

export default {
  onJobStatusChange,
  onShipmentCreated,
  markPrinted,
  markSkipped,
  getPendingQueue,
  getQueueHistory,
  enqueue,
  manualEnqueue,
  reprintById,
};
