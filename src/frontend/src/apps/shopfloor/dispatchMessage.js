/**
 * What Run Dispatch did, in words for the planner. Pure.
 * result: { assignedCount, unassignedCount, unassigned: [{ reason }], notChecked: [], notPlannedCount }
 * Returns { message, severity }.
 */
export function dispatchMessage(result = {}) {
  const placed = Number(result.assignedCount) || 0
  const left = Number(result.unassignedCount) || 0
  const notPlanned = Number(result.notPlannedCount) || 0
  const parts = []
  if (placed === 0 && left === 0) {
    parts.push('Nothing was waiting to be placed at this branch.')
  } else {
    parts.push(`Assigned ${placed} step${placed === 1 ? '' : 's'}.`)
    if (left) parts.push(`${left} could not be placed: ${result.unassigned?.[0]?.reason || 'no reason given'}${left > 1 ? ' (and others)' : ''}.`)
  }
  // A job reaches dispatch only once it has a route. Say how many are still waiting for one.
  if (notPlanned) parts.push(`${notPlanned} new job${notPlanned === 1 ? ' has' : 's have'} no route yet: open the Order Board, click the job under New Orders and choose Plan Job.`)
  if (result.notChecked?.length) parts.push(`Note: ${result.notChecked[0]}.`)
  return { message: parts.join(' '), severity: left ? 'warning' : placed ? 'success' : 'info' }
}
