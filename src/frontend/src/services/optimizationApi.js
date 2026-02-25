/**
 * Work Order Optimization AI API Client
 */

const API_BASE = '/api/v1/ai/work-order-optimize';

export async function getOptimizationPreview(params = {}) {
  const response = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Failed to get optimization preview');
  return response.json();
}

export async function applyOptimization(optimizedJobs) {
  const response = await fetch(`${API_BASE}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optimizedJobs }),
  });
  if (!response.ok) throw new Error('Failed to apply optimization');
  return response.json();
}

export async function getOptimizationAnalysis(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/analysis?${queryParams}`);
  if (!response.ok) throw new Error('Failed to get optimization analysis');
  return response.json();
}

export async function simulateScenario(scenario, modifications) {
  const response = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, modifications }),
  });
  if (!response.ok) throw new Error('Failed to simulate scenario');
  return response.json();
}
