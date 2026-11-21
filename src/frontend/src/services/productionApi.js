/**
 * The production overview: every open job with its branch, division, machine and stage, the counts by
 * stage and, per machine, steps queued, running and finished today. One source for the shop floor,
 * planning page and workflow board, so they count the same way.
 */
import { startOfLocalDay } from '../components/production/productionView'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function getProductionOverview({ locationId, division, workCenterId } = {}) {
  const params = new URLSearchParams()
  if (locationId) params.append('locationId', locationId)
  if (division) params.append('division', division)
  if (workCenterId) params.append('workCenterId', workCenterId)
  params.append('since', startOfLocalDay())
  const response = await fetch(`${API_BASE}/jobs/overview?${params}`)
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new Error(problem.error || 'The production overview could not be loaded')
  }
  return response.json()
}
