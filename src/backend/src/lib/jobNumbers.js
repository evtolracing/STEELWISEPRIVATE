/**
 * Job numbers follow the order they are made for, so a traveler or a tag leads straight to the order
 * (owner's decision, 2026-11-21):
 *
 *   order SO-00078, line 1          -> JOB-00078-1
 *   order SO-00078, line 2          -> JOB-00078-2
 *   a second job for the same line  -> JOB-00078-1B, then 1C ... (a redo after a cancellation, a split)
 *   a job for the order but no line -> the next number after the order's lines and jobs, JOB-00078-3
 *   an order that is not SO-        -> its whole number is kept, JOB-TO-00012-1, so two series never meet
 *   a job with no order             -> its own series, JS-00012
 *
 * Jobs numbered before this keep their numbers (JOB-00075): renumbering would break what was already
 * printed, labelled and invoiced. The old numbers never end in "-<line>", so the two cannot collide.
 */
import { createNumbered, padded } from './numbering.js';

export const STOCK_JOB_PREFIX = 'JS';
/** Any job number, old or new, as it appears in text: JOB-00075, JOB-00078-1, JOB-00078-1B, JOB-TO-00012-2, JS-00012. */
export const JOB_NUMBER_PATTERN = /\b(?:JOB-(?:[A-Z]{1,4}-)?\d{3,}(?:-\d+[A-Z]?)?|JS-\d{3,})\b/;

/** The part of the order number a job number carries: the digits of a sales order, the whole of any other. */
export function orderPart(orderNumber) {
  const text = String(orderNumber || '').trim().toUpperCase();
  if (!text) return null;
  const so = /^SO-(\d+)$/.exec(text);
  if (so) return so[1];
  // Only letters, digits and dashes go into a job number.
  return text.replace(/[^A-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || null;
}

/** JOB-00078-1, then JOB-00078-1B ... JOB-00078-1Z if the plain number is already taken. */
export function jobNumberCandidates(orderNumber, slot) {
  const part = orderPart(orderNumber);
  const n = Number(slot);
  if (!part || !Number.isInteger(n) || n < 1) return [];
  const base = `JOB-${part}-${n}`;
  const letters = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return [base, ...letters.map((l) => `${base}${l}`)];
}

/**
 * The number for a job of the order with no line of its own: one past the highest line on the order and
 * the highest number already used by the order's jobs, so it never takes a line's number.
 */
export function nextFreeSlot(orderNumber, { lineNumbers = [], jobNumbers = [] } = {}) {
  const part = orderPart(orderNumber);
  const prefix = `JOB-${part}-`;
  let top = 0;
  for (const n of lineNumbers) if (Number.isInteger(Number(n))) top = Math.max(top, Number(n));
  for (const j of jobNumbers) {
    if (!String(j || '').startsWith(prefix)) continue;
    const m = /^(\d+)[A-Z]?$/.exec(String(j).slice(prefix.length));
    if (m) top = Math.max(top, Number(m[1]));
  }
  return top + 1;
}

const taken = (error) => error?.code === 'P2002' && (!error?.meta?.target || /jobNumber|job_number/i.test(String(error.meta.target)));

/**
 * Creates a job with its number. `create(jobNumber)` saves it; `order` is { id, orderNumber } or null;
 * `lineNumber` is the order line's number, or null for a job of the order with no line.
 */
export async function createJobNumbered({ client, order, lineNumber = null, create }) {
  if (!order?.orderNumber) {
    return createNumbered({
      count: () => client.job.count({ where: { jobNumber: { startsWith: `${STOCK_JOB_PREFIX}-` } } }),
      format: padded(STOCK_JOB_PREFIX),
      create,
    });
  }
  let slot = Number(lineNumber);
  if (!Number.isInteger(slot) || slot < 1) {
    const [lines, jobs] = await Promise.all([
      order.id ? client.orderLine.findMany({ where: { orderId: order.id }, select: { lineNumber: true } }) : [],
      order.id ? client.job.findMany({ where: { orderId: order.id }, select: { jobNumber: true } }) : [],
    ]);
    slot = nextFreeSlot(order.orderNumber, { lineNumbers: lines.map((l) => l.lineNumber), jobNumbers: jobs.map((j) => j.jobNumber) });
  }
  for (const jobNumber of jobNumberCandidates(order.orderNumber, slot)) {
    try {
      return await create(jobNumber);
    } catch (error) {
      if (!taken(error)) throw error;
    }
  }
  throw new Error(`Every job number for line ${slot} of ${order.orderNumber} is taken`);
}
