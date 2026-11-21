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

/** "Saw step 2 of 3" or "No route yet". */
export function stepText(row) {
  if (!row?.stepCount) return 'No route yet'
  if (!row.stepName) return `All ${row.stepCount} steps done`
  return `${row.stepName}, step ${row.stepSequence ?? ''} of ${row.stepCount}`.replace(' step  of', ' step of')
}
