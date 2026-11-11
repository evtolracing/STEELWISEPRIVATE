/**
 * Online Events / Settings API — checkout rules, cutoff times, allowed processes.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function getCheckoutRules() {
  const res = await fetch(`${API_BASE}/admin/online-settings/rules`)
  if (!res.ok) throw new Error('Failed to fetch rules')
  return res.json()
}

export async function getCutoffTimes() {
  const res = await fetch(`${API_BASE}/admin/online-settings/cutoffs`)
  if (!res.ok) throw new Error('Failed to fetch cutoffs')
  return res.json()
}

export async function getAllowedProcesses(division) {
  const res = await fetch(`${API_BASE}/admin/online-settings/processes?division=${encodeURIComponent(division)}`)
  if (!res.ok) throw new Error('Failed to fetch allowed processes')
  return res.json()
}

export async function updateCheckoutRules(rules) {
  const res = await fetch(`${API_BASE}/admin/online-settings/rules`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update rules')
  return res.json()
}

export async function updateCutoffTimes(cutoffs) {
  const res = await fetch(`${API_BASE}/admin/online-settings/cutoffs`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cutoffs),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update cutoffs')
  return res.json()
}
