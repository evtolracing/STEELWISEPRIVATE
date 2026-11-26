/**
 * Small helpers for the production screens. Pure: checked in src/backend/test/productionView.test.js.
 * The rules for where a job is and its stage live on the server (src/backend/src/lib/productionView.js).
 */

/** The first instant of today in the viewer's own time zone, as ISO. "Done today" counts from here. */
export function startOfLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

/** The jobs of each stage, every stage present, in the order the server gave the stages. */
export function byStage(rows = [], stages = []) {
  const out = Object.fromEntries(stages.map((s) => [s.key, []]))
  for (const r of rows) if (out[r.stage]) out[r.stage].push(r)
  return out
}

/**
 * The branch a production screen starts at: the one picked in the top bar, then the person's own,
 * then the first on the list. Only a branch that is on the list is used.
 */
export function startingBranch(locations = [], { topBarBranchId, homeLocationId } = {}) {
  const on = (id) => id && locations.some((l) => l.id === id)
  if (on(topBarBranchId)) return topBarBranchId
  if (on(homeLocationId)) return homeLocationId
  return locations[0]?.id || ''
}

/**
 * The work orders cutting for a job, in a line for its card: "WO-00179 · Slit C-00012", and "+1 more" after the
 * first. Empty when the job has none. `job.workOrders` are { woNumber, work, stockNumber } from the server.
 */
export function workOrderText(job) {
  const list = Array.isArray(job?.workOrders) ? job.workOrders : []
  if (!list.length) return ''
  const w = list[0]
  const what = [w.work, w.stockNumber].filter(Boolean).join(' ')
  return `${[w.woNumber, what].filter(Boolean).join(' · ')}${list.length > 1 ? ` · +${list.length - 1} more` : ''}`
}
/** Who a job is for, in a few words: its order, else "Stock work" when a work order cuts for it, else "No order". */
export function jobForText(job) {
  if (job?.orderNumber) return job.orderNumber
  return Array.isArray(job?.workOrders) && job.workOrders.length ? 'Stock work' : 'No order'
}

/** "Saw step 2 of 3" or "No route yet". */
export function stepText(row) {
  if (!row?.stepCount) return 'No route yet'
  if (!row.stepName) return `All ${row.stepCount} steps done`
  return `${row.stepName}, step ${row.stepSequence ?? ''} of ${row.stepCount}`.replace(' step  of', ' step of')
}

/** The machine a job is on for the Schedule: the server's booking (its current step's machine), else the old field. */
export function scheduleMachineId(job) {
  return job && Object.prototype.hasOwnProperty.call(job, 'bookedWorkCenterId') ? job.bookedWorkCenterId : job?.workCenterId || null
}

export const SCHEDULE_DAY_START_HOUR = 6
export const SCHEDULE_DAY_HOURS = 10 // the grid shows 6 AM to 4 PM

/**
 * The share of the shown day's grid (6 AM to 4 PM) a machine is booked for, in percent. Only the part of each job
 * inside the grid counts, so a job running over several days does not fill every day it touches. A job with a
 * start and no end counts two hours.
 */
export function bookedShare(jobs = [], day = new Date()) {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), SCHEDULE_DAY_START_HOUR).getTime()
  const to = from + SCHEDULE_DAY_HOURS * 3600000
  const minutes = jobs.reduce((sum, j) => {
    if (!j.scheduledStart) return sum
    const start = new Date(j.scheduledStart).getTime()
    const end = j.scheduledEnd ? new Date(j.scheduledEnd).getTime() : start + 2 * 3600000
    return sum + Math.max(0, (Math.min(end, to) - Math.max(start, from)) / 60000)
  }, 0)
  return Math.min(100, Math.round((minutes / (SCHEDULE_DAY_HOURS * 60)) * 100))
}

const FINISHED = ['SHIPPED', 'COMPLETED', 'CANCELLED']
const isOpen = (j) => !FINISHED.includes(j?.status)

/** Late: still open and past its due date. A shipped job is never late, whatever its due date was. */
export function isOverdue(job, now = new Date()) {
  return isOpen(job) && Boolean(job.dueDate) && new Date(job.dueDate) < now
}

/**
 * The Order Board's figures. The board also shows the most recently finished jobs (its Completed column), which are
 * not work to do, so they are counted apart and left out of hot, overdue and in progress.
 */
export function boardCounts(jobs = [], now = new Date()) {
  const open = jobs.filter(isOpen)
  return {
    open: open.length,
    finished: jobs.length - open.length,
    hot: open.filter((j) => j.priority === 'HOT').length,
    overdue: open.filter((j) => isOverdue(j, now)).length,
    inProgress: open.filter((j) => j.status === 'IN_PROCESS').length,
  }
}

/** How a plan step's light is lit: its words and its tone. Finished is solid, running glows, queued at a machine is outlined, waiting is dim. */
const LIGHTS = {
  COMPLETE: { words: 'Finished', tone: 'done' },
  IN_PROCESS: { words: 'Running', tone: 'running' },
  PAUSED: { words: 'Paused', tone: 'paused' },
  SCHEDULED: { words: 'Queued at its machine', tone: 'queued' },
  PENDING: { words: 'Not started', tone: 'waiting' },
}
export function stepLight(step) {
  return LIGHTS[step?.status] || { words: String(step?.status || 'Not started').replace(/_/g, ' ').toLowerCase(), tone: 'waiting' }
}
/** What the row of lights says, in words, for a screen reader and the tooltip: "Step 2 of 3 running: Second cut". */
export function lightsSummary(steps = []) {
  if (!steps.length) return 'No plan yet'
  const done = steps.filter((s) => s.status === 'COMPLETE').length
  if (done === steps.length) return `All ${steps.length} ${steps.length === 1 ? 'step' : 'steps'} finished`
  const i = steps.findIndex((s) => s.status === 'IN_PROCESS')
  const at = i > -1 ? i : steps.findIndex((s) => s.status !== 'COMPLETE')
  const step = steps[at]
  return `Step ${at + 1} of ${steps.length} ${stepLight(step).words.toLowerCase()}${step.name ? `: ${step.name}` : ''}`
}

/** The steps that say what to do, numbered as the lights are. 'current' keeps only the first step not yet finished. */
export function detailRows(steps, which = 'all') {
  const list = Array.isArray(steps) ? steps : []
  const nowIndex = list.findIndex((s) => s.status !== 'COMPLETE')
  return list
    .map((s, i) => ({ n: i + 1, name: s.name || `Step ${i + 1}`, detail: s.detail || '', now: s.here || (!list.some((x) => x.here) && i === nowIndex) }))
    .filter((r) => r.detail && (which !== 'current' || r.now))
}
