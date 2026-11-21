/**
 * Time entries: the clock records behind the Time Tracking screen and the running clock on the
 * shop floor. Pure functions, so the figures can be checked without a database.
 */

const STATUSES = ['RUNNING', 'PAUSED', 'COMPLETE']
export const TIME_ENTRY_DEFAULT = 1000
export const TIME_ENTRY_MAX = 5000

const seconds = (from, to) => Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000))

/** An entry is still running when it has no end. Its time so far is counted up to `now`. */
export function entrySeconds(log, now = new Date()) {
  if (!log?.startAt) return 0
  return seconds(log.startAt, log.endAt || now)
}

/**
 * The clock of one step from its entries: the time already closed, and when the open entry started.
 * The screen shows closedSeconds plus the time since runningSince.
 */
export function clockOf(logs = [], now = new Date()) {
  let closedSeconds = 0
  let runningSince = null
  for (const log of logs) {
    if (log.endAt) closedSeconds += entrySeconds(log, now)
    else if (!runningSince || new Date(log.startAt) < new Date(runningSince)) runningSince = log.startAt
  }
  return { closedSeconds, runningSince, totalSeconds: closedSeconds + (runningSince ? seconds(runningSince, now) : 0) }
}

const instant = (value) => {
  if (value === undefined || value === null || value === '') return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * The filter asked for in the address, as a database filter. Returns { error } for a bad value.
 * from and to are instants: the screen sends the start and end of the day in its own time zone.
 */
export function timeEntryQuery(query = {}) {
  const from = instant(query.from)
  const to = instant(query.to)
  if (from === undefined || to === undefined) return { error: 'from and to must be dates' }
  if (from && to && from > to) return { error: 'from must not be after to' }
  if (query.status && !STATUSES.includes(String(query.status))) return { error: `status must be one of ${STATUSES.join(', ')}` }
  const where = {}
  if (from || to) where.startAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
  if (query.status) where.status = String(query.status)
  if (query.operatorId) where.operatorId = String(query.operatorId)
  if (query.workCenterId) where.workCenterId = String(query.workCenterId)
  if (query.locationId) where.dispatchOperation = { dispatchJob: { locationId: String(query.locationId) } }
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || TIME_ENTRY_DEFAULT, 1), TIME_ENTRY_MAX)
  return { where, limit }
}

/** One row for the screen: the entry with the names a person reads, never bare ids. */
export function timeEntryRow(log, { operators = [], workCenters = [] } = {}, now = new Date()) {
  const step = log.dispatchOperation || null
  const plan = step?.dispatchJob || null
  const who = operators.find((p) => p.id === log.operatorId)
  const where = workCenters.find((w) => w.id === log.workCenterId)
  return {
    id: log.id,
    status: log.status,
    running: !log.endAt,
    startAt: log.startAt,
    endAt: log.endAt || null,
    durationSeconds: entrySeconds(log, now),
    stopReason: log.downtimeReason || null,
    operatorId: log.operatorId || null,
    operatorName: who ? [who.firstName, who.lastName].filter(Boolean).join(' ') : null,
    workCenterId: log.workCenterId || null,
    workCenterName: where?.name || null,
    locationId: plan?.locationId || null,
    locationName: plan?.location?.name || null,
    operationId: step?.id || log.dispatchOperationId,
    operationName: step?.name || null,
    operationStatus: step?.status || null,
    sequence: step?.sequence ?? null,
    jobId: plan?.jobId || null,
    jobNumber: plan?.jobNumber || null,
    orderNumber: plan?.order?.orderNumber || null,
    customerName: plan?.customerName || null,
    materialCode: step?.materialCode || plan?.materialCode || null,
  }
}
