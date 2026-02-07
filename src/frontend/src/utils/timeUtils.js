/**
 * timeUtils.js — Timezone-aware time helpers using only Intl.DateTimeFormat.
 * No external libs.
 */

/**
 * Get "now" as broken-out parts in a given IANA timezone.
 * Returns { year, month, day, hour, minute, second, dateStr, timeStr, dayOfWeek }
 *   dateStr = "YYYY-MM-DD", timeStr = "HH:MM:SS", dayOfWeek = 0-6 (Sun-Sat)
 */
export function getNowInTz(tz, nowOverride) {
  const base = nowOverride ? new Date(nowOverride) : new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, weekday: 'short',
  })
  const parts = {}
  for (const { type, value } of fmt.formatToParts(base)) {
    parts[type] = value
  }
  const year = parseInt(parts.year)
  const month = parseInt(parts.month)
  const day = parseInt(parts.day)
  const hour = parseInt(parts.hour === '24' ? '0' : parts.hour)
  const minute = parseInt(parts.minute)
  const second = parseInt(parts.second)

  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dayOfWeek = weekdayMap[parts.weekday] ?? new Date(year, month - 1, day).getDay()

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`

  return { year, month, day, hour, minute, second, dateStr, timeStr, dayOfWeek }
}

/**
 * Format a time string (HH:MM) into 12-hour format: "3:30 PM".
 */
export function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * Format an ISO or Date for display in a specific timezone: "3:30 PM"
 */
export function formatLocalTimeForTz(isoOrNow, tz) {
  const d = isoOrNow ? new Date(isoOrNow) : new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  return fmt.format(d)
}

/**
 * Compute minutes remaining until a cutoff time (HH:MM) in a branch timezone.
 * Returns integer — negative if cutoff has passed.
 */
export function minutesUntilCutoff({ tz, cutoffLocalHHMM }) {
  if (!tz || !cutoffLocalHHMM) return null
  const now = getNowInTz(tz)
  const [ch, cm] = cutoffLocalHHMM.split(':').map(Number)
  const nowMinutes = now.hour * 60 + now.minute
  const cutoffMinutes = ch * 60 + cm
  return cutoffMinutes - nowMinutes
}

/**
 * Format minutes remaining as a human-readable countdown string.
 * e.g. 132 -> "2h 12m", 45 -> "45m", -30 -> "passed 30m ago"
 */
export function formatCountdown(minutesLeft) {
  if (minutesLeft == null) return ''
  if (minutesLeft <= 0) {
    const abs = Math.abs(minutesLeft)
    if (abs < 60) return `passed ${abs}m ago`
    return `passed ${Math.floor(abs / 60)}h ${abs % 60}m ago`
  }
  if (minutesLeft < 60) return `${minutesLeft}m left`
  const h = Math.floor(minutesLeft / 60)
  const m = minutesLeft % 60
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`
}

/**
 * Format ship days array [1,2,3,4,5] as "Mon–Fri" etc.
 */
export function formatShipDays(shipDays) {
  if (!shipDays || shipDays.length === 0) return 'None'
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const sorted = [...shipDays].sort((a, b) => a - b)
  // Check if consecutive
  const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (isConsecutive && sorted.length >= 2) {
    return `${labels[sorted[0]]}–${labels[sorted[sorted.length - 1]]}`
  }
  return sorted.map(d => labels[d]).join(', ')
}
