// A date with no time of day (a due date, a requested date) is stored as midnight UTC. Shown in the
// reader's own time zone it lands on the evening before, so the day reads one early west of Greenwich.
// calendarDate shows such a value as the day it names; anything with a real time is shown locally.
const MIDNIGHT_UTC = /T00:00:00(\.0+)?Z$/

export function calendarDate(value, empty = '—') {
  if (!value) return empty
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return empty
  const dateOnly = MIDNIGHT_UTC.test(date.toISOString())
  return date.toLocaleDateString('en-US', dateOnly ? { timeZone: 'UTC' } : undefined)
}
