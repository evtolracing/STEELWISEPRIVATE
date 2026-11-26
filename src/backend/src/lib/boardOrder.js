/**
 * The order of the cards in a column of the Production Workflow board (owner, 2026-11-25: cards can be dragged
 * and arranged). Pure, so it is checked without a database (test/boardOrder.test.js).
 *
 * A job's place counts only while it is still in the stage it was arranged in: a job that moves on arrives in its
 * new column unarranged. Arranged cards come first, in their order; the rest follow as the server sorted them
 * (priority, then due date), so a new job is never hidden above work already put in order.
 */
export const BOARD_ORDER_MAX = 500;
const GAP = 1000;

/** rows: [{ id, stage }] in the server's order. places: [{ jobId, stage, position }]. Returns the rows, each with boardPosition (number or null), sorted for the board. */
export function arrangeRows(rows = [], places = []) {
  const at = new Map(places.map((p) => [p.jobId, p]));
  const withPlace = rows.map((r, i) => {
    const p = at.get(r.id);
    return { row: { ...r, boardPosition: p && p.stage === r.stage ? p.position : null }, i };
  });
  withPlace.sort((a, b) => {
    const x = a.row.boardPosition; const y = b.row.boardPosition;
    if (x !== null && y !== null) return x - y || a.i - b.i;
    if (x !== null) return -1;
    if (y !== null) return 1;
    return a.i - b.i;
  });
  return withPlace.map((w) => w.row);
}

/** What was sent as a column's order: null when it is usable, otherwise why not. */
export function boardOrderError(stage, jobIds, stages = []) {
  if (!stages.includes(stage)) return 'Pick the column the jobs are in';
  if (!Array.isArray(jobIds) || jobIds.length === 0) return 'Send the jobs of the column in their new order';
  if (jobIds.length > BOARD_ORDER_MAX) return `A column of more than ${BOARD_ORDER_MAX} jobs cannot be arranged at once. Pick a branch or a division first.`;
  if (jobIds.some((id) => typeof id !== 'string' || !id)) return 'Each job is named by its id';
  if (new Set(jobIds).size !== jobIds.length) return 'A job is in the list twice';
  return null;
}

/**
 * The positions to save for a column put in a new order. When every job already has its own place in this stage,
 * the same places are handed out again in the new order, so jobs of the column that the person was not shown
 * (another division, say) keep their place among them. Otherwise the list is numbered afresh.
 * existing: [{ jobId, stage, position }].
 */
export function positionsFor(stage, jobIds, existing = []) {
  const mine = new Map(existing.filter((p) => p.stage === stage).map((p) => [p.jobId, p.position]));
  const had = jobIds.map((id) => mine.get(id));
  const reuse = had.every((p) => typeof p === 'number') && new Set(had).size === had.length;
  const slots = reuse ? [...had].sort((a, b) => a - b) : jobIds.map((_, i) => (i + 1) * GAP);
  return jobIds.map((jobId, i) => ({ jobId, stage, position: slots[i] }));
}
