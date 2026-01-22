/**
 * Dispatch API Service
 * Handles communication with dispatch engine endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Get available locations
 */
export async function getLocations() {
  const response = await fetch(`${API_BASE}/v1/dispatch/locations`)
  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get work centers, optionally filtered by location
 */
export async function getWorkCenters(locationId) {
  const params = new URLSearchParams()
  if (locationId) params.append('locationId', locationId)
  
  const response = await fetch(`${API_BASE}/v1/dispatch/work-centers?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch work centers: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get operators, optionally filtered by work center
 */
export async function getOperators(workCenterId) {
  const params = new URLSearchParams()
  if (workCenterId) params.append('workCenterId', workCenterId)
  
  const response = await fetch(`${API_BASE}/v1/dispatch/operators?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch operators: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Run the dispatch engine to assign pending operations
 */
export async function runDispatch(locationId) {
  const response = await fetch(`${API_BASE}/v1/dispatch/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to run dispatch: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get work center queue (operations assigned to a work center)
 */
export async function getQueue(locationId, workCenterId) {
  const params = new URLSearchParams()
  if (locationId) params.append('locationId', locationId)
  params.append('workCenterId', workCenterId)
  
  const response = await fetch(`${API_BASE}/v1/dispatch/queue?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch queue: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get dispatch statistics
 */
export async function getDispatchStats(locationId) {
  const params = new URLSearchParams()
  if (locationId) params.append('locationId', locationId)
  
  const response = await fetch(`${API_BASE}/v1/dispatch/stats?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

export default {
  getLocations,
  getWorkCenters,
  getOperators,
  runDispatch,
  getQueue,
  getDispatchStats,
}
