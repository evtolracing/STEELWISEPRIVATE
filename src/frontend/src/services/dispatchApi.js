/**
 * Dispatch API Service
 * Handles communication with dispatch engine endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTER TYPES (Dynamic Registry)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get all work center types
 */
export async function getWorkCenterTypes(activeOnly = true) {
  const params = new URLSearchParams()
  if (activeOnly) params.append('activeOnly', 'true')
  const response = await fetch(`${API_BASE}/v1/dispatch/work-center-types?${params}`)
  if (!response.ok) throw new Error(`Failed to fetch work center types: ${response.statusText}`)
  const result = await response.json()
  return result.data
}

/**
 * Create a new work center type
 */
export async function createWorkCenterType(data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-center-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to create work center type: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Update an existing work center type
 */
export async function updateWorkCenterType(id, data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-center-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to update work center type: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Delete (deactivate) a work center type
 */
export async function deleteWorkCenterType(id) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-center-types/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to delete work center type: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

// ──────────────────────────────────────────────────────────────────────────────
// DIVISIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get all divisions
 */
export async function getDivisions() {
  const response = await fetch(`${API_BASE}/v1/dispatch/divisions`)
  if (!response.ok) throw new Error(`Failed to fetch divisions: ${response.statusText}`)
  const result = await response.json()
  return result.data
}

/**
 * Create a new division
 */
export async function createDivision(data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/divisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to create division: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

// ──────────────────────────────────────────────────────────────────────────────
// LOCATIONS
// ──────────────────────────────────────────────────────────────────────────────

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
 * Create a new location
 */
export async function createLocation(data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to create location: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTERS
// ──────────────────────────────────────────────────────────────────────────────

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
 * Create a new work center
 */
export async function createWorkCenter(data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-centers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to create work center: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Update a work center
 */
export async function updateWorkCenter(id, data) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-centers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to update work center: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Delete (take offline) a work center
 */
export async function deleteWorkCenter(id) {
  const response = await fetch(`${API_BASE}/v1/dispatch/work-centers/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || `Failed to delete work center: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

// ──────────────────────────────────────────────────────────────────────────────
// OPERATORS
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// DISPATCH ENGINE
// ──────────────────────────────────────────────────────────────────────────────

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
  getWorkCenterTypes,
  createWorkCenterType,
  updateWorkCenterType,
  deleteWorkCenterType,
  getDivisions,
  createDivision,
  getLocations,
  createLocation,
  getWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getOperators,
  runDispatch,
  getQueue,
  getDispatchStats,
}
