/**
 * What dragging a card on the Production Workflow board does (owner, 2026-11-25: the cards can be dragged, arranged
 * and opened). Pure: checked in src/backend/test/boardMoves.test.js. The server still decides every move; this says
 * which question to ask it, and refuses in words the moves that are not made on a board.
 *
 * A column is where a job is. Five of them come from the job's plan and its steps (not planned, waiting for a
 * machine, queued, running, steps done); four are the job's own status (waiting QC, packaging, ready to ship, on hold).
 */
export const FLOOR_STAGES = ['NOT_PLANNED', 'NO_MACHINE', 'QUEUED', 'RUNNING', 'STEPS_DONE']
export const STATUS_STAGES = ['WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD']
const WORKED = ['COMPLETE', 'IN_PROCESS', 'PAUSED']

/** The status a job goes back to when it is put back into production: by its plan and the work already done on it. */
export function backInProduction(job) {
  if (!job?.stepCount) return 'ORDERED'
  return (job.planSteps || []).some((s) => WORKED.includes(s.status)) ? 'IN_PROCESS' : 'SCHEDULED'
}

/**
 * kind: 'arrange' (same column), 'plan' (open Plan Job), 'machine' (pick a machine for its next step),
 * 'unmachine' (take its next step off its machine), 'status' (ask the server to move the job to `status`),
 * 'refuse' (with `why`).
 */
export function boardMove(job, toStage) {
  const from = job?.stage
  if (!from || !toStage) return { kind: 'refuse', why: 'That is not a column a job can be moved to.' }
  if (from === toStage) return { kind: 'arrange' }
  if (STATUS_STAGES.includes(toStage)) return { kind: 'status', status: toStage }
  if (!FLOOR_STAGES.includes(toStage)) return { kind: 'refuse', why: 'That is not a column a job can be moved to.' }
  if (STATUS_STAGES.includes(from)) return { kind: 'status', status: backInProduction(job), back: true }
  if (from === 'NOT_PLANNED') return { kind: 'plan' }
  if (toStage === 'NOT_PLANNED') return { kind: 'refuse', why: 'A planned job does not go back to Not planned. Use Change plan to change its steps.' }
  if (from === 'STEPS_DONE') return { kind: 'refuse', why: 'Every step of this job is finished. Move it on to QC, packaging or shipping.' }
  if (toStage === 'RUNNING') return { kind: 'refuse', why: 'A step is started at its machine on the Shop Floor, where the operator and the time are recorded.' }
  if (toStage === 'STEPS_DONE') return { kind: 'refuse', why: 'Steps are finished at their machines on the Shop Floor, where the pieces and the time are recorded.' }
  if (from === 'RUNNING') return { kind: 'refuse', why: 'This job is being worked now. Pause or finish the step at its machine, or use Change plan to move it to another machine.' }
  if (from === 'NO_MACHINE' && toStage === 'QUEUED') return { kind: 'machine' }
  if (from === 'QUEUED' && toStage === 'NO_MACHINE') return { kind: 'unmachine' }
  return { kind: 'refuse', why: 'That move is not made on this board.' }
}

/** The columns a job can be moved to, for the "Move to" buttons: every column a drag would not refuse. */
export function moveChoices(job, stages = []) {
  return stages.filter((s) => s.key !== job?.stage && boardMove(job, s.key).kind !== 'refuse')
}

/** `ids` with `movedId` taken out and put back before `beforeId` (at the end when beforeId is null or not there). */
export function reorder(ids = [], movedId, beforeId = null) {
  const rest = ids.filter((id) => id !== movedId)
  if (!ids.includes(movedId)) return ids
  const at = beforeId && beforeId !== movedId ? rest.indexOf(beforeId) : -1
  if (at === -1) return [...rest, movedId]
  return [...rest.slice(0, at), movedId, ...rest.slice(at)]
}

/** `ids` with `movedId` moved 'top', 'up', 'down' or 'bottom'. The same list when it cannot move that way. */
export function nudge(ids = [], movedId, where) {
  const i = ids.indexOf(movedId)
  if (i === -1) return ids
  const to = where === 'top' ? 0 : where === 'bottom' ? ids.length - 1 : where === 'up' ? i - 1 : where === 'down' ? i + 1 : i
  if (to < 0 || to >= ids.length || to === i) return ids
  const rest = ids.filter((id) => id !== movedId)
  return [...rest.slice(0, to), movedId, ...rest.slice(to)]
}

/** Does this job match what was typed in the board's search box? Job, order, work order, stock item, customer, step and machine are searched. */
export function matchesSearch(job, text) {
  const q = String(text || '').trim().toLowerCase()
  if (!q) return true
  const workOrders = (job.workOrders || []).flatMap((w) => [w.woNumber, w.stockNumber])
  return [job.jobNumber, job.orderNumber, job.customerName, job.stepName, job.workCenterName, job.locationName, job.division, ...workOrders]
    .some((v) => String(v || '').toLowerCase().includes(q))
}

/** The step a job is on: the running one, else the first not finished. The same rule as the server's. */
export function currentPlanStep(job) {
  const open = (job?.planSteps || []).filter((s) => s.status !== 'COMPLETE')
  return open.find((s) => s.status === 'IN_PROCESS') || open[0] || null
}
