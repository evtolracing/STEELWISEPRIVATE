/**
 * The sums behind the Time Tracking screen and the running clock on the shop floor.
 * Pure functions: checked in src/backend/test/timeTracking.test.js.
 */

const ms = (value) => new Date(value).getTime()

/** 3725 -> "1h 2m 5s". Nothing recorded reads "0s", never a dash that could pass for missing data. */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** The seconds on a step's clock: the time already closed plus the time since the open entry started. */
export function clockSeconds(clock, now = Date.now()) {
  const closed = Number(clock?.closedSeconds) || 0
  const since = clock?.runningSince ? ms(clock.runningSince) : NaN
  return closed + (Number.isFinite(since) ? Math.max(0, Math.floor((now - since) / 1000)) : 0)
}

/** The seconds on one entry. A running entry counts up to now; a closed one is what the server said. */
export function entrySeconds(entry, now = Date.now()) {
  if (!entry) return 0
  if (entry.running || !entry.endAt) {
    const start = ms(entry.startAt)
    return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : 0
  }
  return Number(entry.durationSeconds) || 0
}

/**
 * "2026-11-14" and "2026-11-21" as the first and last instant of those days in the viewer's own
 * time zone. (new Date('2026-11-14') is midnight in London, which is the day before in Detroit.)
 */
export function dayRange(dateFrom, dateTo) {
  const at = (day, end) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ''))
    if (!m) return null
    const d = end ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999) : new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return { from: at(dateFrom, false), to: at(dateTo, true) }
}

/** Today (or a number of days back) as YYYY-MM-DD in the viewer's own time zone. */
export function localDay(daysBack = 0, today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack)
  const two = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`
}

export function filterEntries(entries = [], { locationId, workCenterId, operatorId, status } = {}) {
  return entries.filter((e) => (!locationId || e.locationId === locationId)
    && (!workCenterId || e.workCenterId === workCenterId)
    && (!operatorId || e.operatorId === operatorId)
    && (!status || e.status === status))
}

const NO_OPERATOR = 'No operator recorded'
const NO_WORK_CENTER = 'No work center recorded'

function grouped(entries, idOf, nameOf, now) {
  const groups = new Map()
  for (const e of entries) {
    const key = idOf(e) || ''
    if (!groups.has(key)) groups.set(key, { id: key, name: nameOf(e), seconds: 0, entries: 0, steps: new Set() })
    const g = groups.get(key)
    g.seconds += entrySeconds(e, now)
    g.entries += 1
    if (e.operationId) g.steps.add(e.operationId)
  }
  const total = [...groups.values()].reduce((sum, g) => sum + g.seconds, 0)
  return [...groups.values()]
    .map((g) => ({ id: g.id, name: g.name, seconds: g.seconds, entries: g.entries, steps: g.steps.size, share: total > 0 ? Math.round((g.seconds / total) * 100) : 0 }))
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name))
}

/** The figures on the cards and the two summary tabs, from the entries on screen. */
export function summarize(entries = [], now = Date.now()) {
  const totalSeconds = entries.reduce((sum, e) => sum + entrySeconds(e, now), 0)
  const running = entries.filter((e) => e.running || !e.endAt)
  const steps = new Set(entries.map((e) => e.operationId).filter(Boolean))
  const finished = new Set(entries.filter((e) => e.status === 'COMPLETE').map((e) => e.operationId || e.id))
  const stops = entries.filter((e) => e.stopReason)
  // A step is on hold when its newest entry here is a pause and the step is not finished.
  const newest = new Map()
  for (const e of entries) {
    const seen = newest.get(e.operationId)
    if (!seen || ms(e.startAt) > ms(seen.startAt)) newest.set(e.operationId, e)
  }
  const onHold = [...newest.values()].filter((e) => e.status === 'PAUSED' && e.operationStatus !== 'COMPLETE').length
  return {
    totalSeconds,
    entryCount: entries.length,
    stepCount: steps.size,
    finishedSteps: finished.size,
    averageFinishedSeconds: finished.size > 0
      ? Math.round(entries.filter((e) => finished.has(e.operationId || e.id)).reduce((sum, e) => sum + entrySeconds(e, now), 0) / finished.size)
      : 0,
    runningCount: running.length,
    onHoldCount: onHold,
    stopCount: stops.length,
    operatorCount: new Set(entries.map((e) => e.operatorId).filter(Boolean)).size,
    byOperator: grouped(entries, (e) => e.operatorId, (e) => e.operatorName || NO_OPERATOR, now),
    byWorkCenter: grouped(entries, (e) => e.workCenterId, (e) => e.workCenterName || NO_WORK_CENTER, now),
  }
}

/** The names for the filter lists, from the entries themselves, so a person who has left still appears. */
export function choices(entries = [], idKey, nameKey) {
  const seen = new Map()
  for (const e of entries) if (e[idKey] && !seen.has(e[idKey])) seen.set(e[idKey], e[nameKey] || e[idKey])
  return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

const cell = (value) => {
  let text = value === null || value === undefined ? '' : String(value)
  // A cell that starts like a formula is read as text by a spreadsheet, not run.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

/** The entries as a CSV file. Hours are a plain number so a spreadsheet can add them up. */
export function csvText(entries = [], now = Date.now(), stamp = (iso) => (iso ? new Date(iso).toLocaleString() : '')) {
  const head = ['Job', 'Order', 'Customer', 'Step', 'Work center', 'Branch', 'Operator', 'Status', 'Started', 'Ended', 'Hours', 'Time', 'Stop reason']
  const rows = entries.map((e) => {
    const secs = entrySeconds(e, now)
    return [e.jobNumber, e.orderNumber, e.customerName, e.operationName, e.workCenterName, e.locationName, e.operatorName, e.running ? 'RUNNING' : e.status,
      stamp(e.startAt), stamp(e.endAt), (secs / 3600).toFixed(2), formatDuration(secs), e.stopReason]
  })
  return [head, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}
