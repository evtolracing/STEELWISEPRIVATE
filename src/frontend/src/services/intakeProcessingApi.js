/**
 * Processing API — Order Intake Module
 * Processing operations and routing templates by division. Backed by
 * /api/processing.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function listProcesses({ division, type } = {}) {
  const params = new URLSearchParams()
  if (division) params.set('division', division)
  if (type) params.set('type', type)
  const res = await fetch(`${API_BASE}/processing/operations?${params}`)
  if (!res.ok) throw new Error('Failed to list processes')
  return res.json()
}

export async function listTemplates({ division } = {}) {
  const res = await fetch(`${API_BASE}/processing/templates${division ? `?division=${encodeURIComponent(division)}` : ''}`)
  if (!res.ok) throw new Error('Failed to list templates')
  return res.json()
}

export async function getProcessById(id) {
  const res = await fetch(`${API_BASE}/processing/operations/${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch process')
  return res.json()
}
