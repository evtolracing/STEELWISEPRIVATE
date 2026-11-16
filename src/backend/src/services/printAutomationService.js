/**
 * Print queue: the tags and papers waiting for a printer.
 *
 * A print job belongs to the branch whose printer it is for (Phase 8, N-015). What it prints is
 * built from the records at the moment it is queued, and only from what is on file: a fact that is
 * not recorded prints as a blank to be written in by hand, never as "1 piece", a made-up number
 * or an address that is not this branch's (N-014).
 */
import prisma from '../lib/db.js';
import crypto from 'crypto';
import { acrossBranches } from '../lib/branchScope.js';

const iso = (d) => (d ? d.toISOString() : null);
function toJob(row) {
  if (!row) return null;
  const job = {
    id: row.id, type: row.type, label: row.label, priority: row.priority, status: row.status, payload: row.payload, locationId: row.locationId || null,
    createdAt: iso(row.createdAt), printedAt: iso(row.printedAt), skippedAt: iso(row.skippedAt),
  };
  if (row.skipReason != null) job.skipReason = row.skipReason;
  return job;
}
async function findJob(printJobId) {
  return toJob(await prisma.printQueueJob.findUnique({ where: { id: printJobId } }));
}
function generatePrintJobId() {
  return `PJ-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

/** Refusal with a status, for the route to pass on. */
export class PrintRefusal extends Error {
  constructor(status, message) { super(message); this.status = status; this.refused = true; }
}

async function enqueue(type, label, payload, priority = 'NORMAL', locationId = null) {
  const id = generatePrintJobId();
  // Queued for the branch the work is at, whoever's action caused it (a sales order entered at one
  // branch can put a tag on another branch's printer).
  const row = await acrossBranches(() => prisma.printQueueJob.create({
    data: { id, type, label, priority, status: 'PENDING', jobId: payload.jobId || null, locationId: locationId || payload.locationId || null, payload },
  }));
  try {
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW', eventType: 'PRINT_JOB_QUEUED', severity: priority === 'HIGH' ? 'WARNING' : 'INFO',
        resourceType: type, resourceId: payload.jobNumber || payload.shipmentId || id, action: 'ENQUEUE',
        details: { printJobId: id, type, label, priority },
      },
    });
  } catch (_) { /* non-blocking */ }
  return toJob(row);
}

/**
 * Settles a waiting print job once: printed, or skipped with a reason. A job that is already
 * settled is refused, so a second press cannot turn "printed" into "skipped". Who did it is recorded.
 */
async function settle(printJobId, to, userId, reason) {
  const before = await findJob(printJobId);
  if (!before) throw new PrintRefusal(404, `Print job ${printJobId} not found`);
  const done = await prisma.printQueueJob.updateMany({
    where: { id: printJobId, status: 'PENDING' },
    data: to === 'PRINTED' ? { status: 'PRINTED', printedAt: new Date() } : { status: 'SKIPPED', skippedAt: new Date(), skipReason: reason },
  });
  if (!done.count) throw new PrintRefusal(409, `This print job is already ${String(before.status).toLowerCase()}. Use Reprint for another copy.`);
  const job = await findJob(printJobId);
  try {
    await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW', eventType: to === 'PRINTED' ? 'PRINT_JOB_PRINTED' : 'PRINT_JOB_SKIPPED', severity: 'INFO', userId: userId || null,
        resourceType: job.type, resourceId: job.payload?.jobNumber || job.payload?.shipmentId || printJobId, action: to,
        details: { printJobId, type: job.type, label: job.label, ...(reason && { reason }) },
      },
    });
  } catch (_) { /* non-blocking */ }
  return job;
}
export const markPrinted = (printJobId, userId = null) => settle(printJobId, 'PRINTED', userId);
export function markSkipped(printJobId, reason = '', userId = null) {
  const why = String(reason || '').trim();
  if (why.length < 3) throw new PrintRefusal(400, 'Say why this print job is skipped.');
  return settle(printJobId, 'SKIPPED', userId, why.slice(0, 300));
}

export const QUEUE_MAX = 500;
/** Waiting jobs for the reader's branch, urgent first then oldest first, with the full count. */
export async function getPendingQueue() {
  const where = { status: 'PENDING' };
  const [rows, total] = await Promise.all([
    prisma.printQueueJob.findMany({ where, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }], take: QUEUE_MAX }),
    prisma.printQueueJob.count({ where }),
  ]);
  const queue = rows.map(toJob);
  queue.total = total;
  return queue;
}

export async function getQueueHistory(limit = 50) {
  const rows = await prisma.printQueueJob.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 500) });
  return rows.map(toJob);
}

export async function getPrintJob(printJobId) {
  return findJob(printJobId);
}

/** The job as the tags need it: its order, customer, line, grade, branch and the heats of its material. */
async function jobForPrint(job) {
  const full = await prisma.job.findUnique({
    where: { id: job.id },
    include: { order: { include: { buyer: { select: { name: true } } } }, workCenter: { select: { name: true, code: true, locationId: true } }, orderLine: { include: { grade: { select: { code: true } } } } },
  });
  if (!full) return null;
  const locationId = full.workCenter?.locationId || full.order?.locationId || null;
  const [branch, workOrders] = await Promise.all([
    locationId ? prisma.location.findUnique({ where: { id: locationId }, select: { id: true, name: true, code: true, addressLine1: true, city: true, state: true, postalCode: true } }) : null,
    prisma.workOrder.findMany({ where: { OR: [{ jobId: full.id }, ...(full.workOrderId ? [{ id: full.workOrderId }] : [])] }, select: { sourceCoil: { select: { coilNumber: true, heat: { select: { heatNumber: true } } } } } }),
  ]);
  const heats = [...new Set(workOrders.map((w) => w.sourceCoil?.heat?.heatNumber).filter(Boolean))];
  const tags = [...new Set(workOrders.map((w) => w.sourceCoil?.coilNumber).filter(Boolean))];
  return { ...full, branch, heats, sourceTags: tags };
}

const KIND_FOR_STATUS = { SCHEDULED: 'DTL_TAG', IN_PROCESS: 'DTL_TAG', PACKAGING: 'BUNDLE_TAG', READY_TO_SHIP: 'SHIPPING_LABEL' };
const KIND_LABEL = { DTL_TAG: 'DTL Tag', BUNDLE_TAG: 'Bundle Tag', SHIPPING_LABEL: 'Shipping Label' };

/** Called when a job changes status: queues the tag that status needs, once. */
export async function onJobStatusChange(job, newStatus) {
  try {
    const kind = KIND_FOR_STATUS[newStatus];
    if (!kind) return null;
    // One waiting tag of each kind per job: a second move into the same status does not queue a second.
    if (await prisma.printQueueJob.count({ where: { status: 'PENDING', type: kind, jobId: job.id } })) return null;
    const full = await jobForPrint(job);
    if (!full) return null;
    return await enqueue(kind, `${KIND_LABEL[kind]} – ${full.jobNumber}`, BUILDERS[kind](full), newStatus === 'IN_PROCESS' || kind === 'SHIPPING_LABEL' ? 'HIGH' : 'NORMAL', full.branch?.id || null);
  } catch (err) {
    console.error('[PrintAutomation] onJobStatusChange error:', err.message);
    return null;
  }
}

/**
 * Queues the bill of lading and the packing list of a shipment, built from the shipment itself
 * (lib/shippingDocuments.js). One waiting copy of each per shipment. Returns the two print jobs.
 */
export async function queueShipmentPapers(shipmentId) {
  const { shipmentDocuments } = await import('../lib/shippingDocuments.js');
  const docs = await shipmentDocuments(shipmentId);
  if (!docs) throw new PrintRefusal(404, 'Shipment not found');
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { fromLocationId: true } });
  const out = [];
  for (const [type, name, priority] of [['BOL', 'Bill of Lading', 'HIGH'], ['PACKING_LIST', 'Packing List', 'NORMAL']]) {
    const payload = { tagType: type, shipmentId, ...docs, printedAt: new Date().toISOString() };
    const waiting = await prisma.printQueueJob.findFirst({ where: { status: 'PENDING', type, payload: { path: ['shipmentId'], equals: shipmentId } } });
    // A paper still waiting is brought up to date, so it never prints what the shipment said earlier
    // (a carrier typed since, or "not yet dispatched" on a shipment that has left).
    out.push(waiting
      ? toJob(await prisma.printQueueJob.update({ where: { id: waiting.id }, data: { payload: JSON.parse(JSON.stringify(payload)) } }))
      : await enqueue(type, `${name} – ${docs.shipment.shipmentNumber}`, payload, priority, shipment?.fromLocationId || null));
  }
  return out;
}

/** Queues a tag for a job by hand, whatever its status. */
export async function manualEnqueue(type, job) {
  const builder = BUILDERS[type];
  if (!builder) throw new PrintRefusal(400, `Unknown tag type: ${type}`);
  const full = await jobForPrint(job);
  if (!full) throw new PrintRefusal(404, 'Job not found');
  return enqueue(type, `${KIND_LABEL[type]} – ${full.jobNumber} (Manual)`, builder(full), 'HIGH', full.branch?.id || null);
}

/** Another copy of something already queued or printed: the same content, marked as a reprint. */
export async function reprintById(printJobId) {
  const original = await findJob(printJobId);
  if (!original) throw new PrintRefusal(404, `Print job ${printJobId} not found in history`);
  return enqueue(original.type, original.label.replace(/ \(Manual\)| \(Reprint\)/g, '') + ' (Reprint)', { ...original.payload, printedAt: new Date().toISOString(), reprint: true }, 'HIGH', original.locationId);
}

// What the tags print: only what is on file.
const day = (d) => (d ? new Date(d).toLocaleDateString() : '');
const n = (v) => (v == null ? null : Number(v));
const addressOf = (b) => [b?.addressLine1, [b?.city, b?.state].filter(Boolean).join(', '), b?.postalCode].filter(Boolean).join(' · ');
function common(job) {
  return {
    jobId: job.id, jobNumber: job.jobNumber, locationId: job.branch?.id || null,
    branchName: job.branch?.name || '', branchCode: job.branch?.code || '',
    customerName: job.order?.buyer?.name || '', orderNumber: job.order?.orderNumber || '', customerPO: job.order?.poReference || '',
    heatNumber: job.heats.join(', '), coilNumber: job.sourceTags.join(', '),
    grade: job.gradeOverride || job.orderLine?.grade?.code || '',
    thickness: n(job.thicknessIn ?? job.orderLine?.thicknessIn), width: n(job.widthIn ?? job.orderLine?.widthIn), length: n(job.lengthIn ?? job.orderLine?.lengthIn),
    weight: n(job.outputWeightLb),
    quantity: n(job.orderLine?.qtyOrdered), unit: job.orderLine?.unit || '', pieces: null,
    instructions: job.instructions || '', printedAt: new Date().toISOString(),
  };
}
function buildDTLPayload(job) {
  return {
    tagType: 'DTL_TAG', ...common(job),
    operationType: job.operationType || '', workCenter: job.workCenter?.name || job.workCenter?.code || '',
    scheduledStart: day(job.scheduledStart), scheduledEnd: day(job.scheduledEnd), priority: job.priority,
    partNumber: job.orderLine?.description || '',
    barcodeValue: `JOB:${job.jobNumber}`,
  };
}
function buildBundlePayload(job) {
  return {
    tagType: 'BUNDLE_TAG', ...common(job),
    shipToName: job.order?.buyer?.name || '', shipToCity: [job.order?.shipToCity, job.order?.shipToState].filter(Boolean).join(', '), shipToAddress: job.order?.shipToAddress || '',
    requiredDate: day(job.order?.requiredDate),
    barcodeValue: `PKG:${job.jobNumber}`,
  };
}
function buildShippingLabelPayload(job) {
  return {
    tagType: 'SHIPPING_LABEL', ...common(job),
    shipFromName: job.branch?.name || '', shipFromAddress: addressOf(job.branch),
    shipToName: job.order?.buyer?.name || '', shipToAddress: job.order?.shipToAddress || '',
    shipToCity: [job.order?.shipToCity, job.order?.shipToState, job.order?.shipToZip].filter(Boolean).join(', '),
    carrier: job.shippingCarrier || '', serviceLevel: '',
    requiredDate: day(job.order?.requiredDate),
    barcodeValue: `SHIP:${job.jobNumber}|ORD:${job.order?.orderNumber || ''}`,
  };
}
const BUILDERS = { DTL_TAG: buildDTLPayload, BUNDLE_TAG: buildBundlePayload, SHIPPING_LABEL: buildShippingLabelPayload };

export default {
  onJobStatusChange,
  queueShipmentPapers,
  markPrinted,
  markSkipped,
  getPendingQueue,
  getQueueHistory,
  getPrintJob,
  enqueue,
  manualEnqueue,
  reprintById,
};
