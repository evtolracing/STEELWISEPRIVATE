/**
 * Operations API Service
 * Handles start, pause, complete actions for job operations
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Get all operations with optional filters
 */
export async function getOperations(filters = {}) {
  const params = new URLSearchParams()
  if (filters.jobId) params.append('jobId', filters.jobId)
  if (filters.status) params.append('status', filters.status)
  if (filters.workCenterId) params.append('workCenterId', filters.workCenterId)
  
  const response = await fetch(`${API_BASE}/v1/operations?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch operations: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get single operation with full details
 */
export async function getOperation(operationId) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch operation: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Start working on an operation
 */
export async function startOperation(operationId, { operatorId, workCenterId }) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, workCenterId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to start operation: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Pause work on an operation
 */
export async function pauseOperation(operationId, { operatorId, workCenterId, downtimeReason }) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, workCenterId, downtimeReason }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to pause operation: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Complete an operation
 */
export async function completeOperation(operationId, { operatorId, workCenterId }) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId, workCenterId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to complete operation: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Get time logs for an operation
 */
export async function getOperationTimeLogs(operationId) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}/time-logs`)
  if (!response.ok) {
    throw new Error(`Failed to fetch time logs: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Reassign an operation to a different work center or operator
 */
export async function reassignOperation(operationId, { workCenterId, operatorId }) {
  const response = await fetch(`${API_BASE}/v1/operations/${operationId}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workCenterId, operatorId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to reassign operation: ${response.statusText}`)
  }
  const result = await response.json()
  return result.data
}

export default {
  getOperations,
  getOperation,
  startOperation,
  pauseOperation,
  completeOperation,
  getOperationTimeLogs,
  reassignOperation,
}
