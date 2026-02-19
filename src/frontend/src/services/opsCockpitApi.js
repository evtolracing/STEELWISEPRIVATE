/**
 * Ops Cockpit API Service
 * Fetches real-time production data from Supabase for the Ops Cockpit dashboard
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getOpsCockpitData() {
  const response = await fetch(`${API_BASE}/ops-cockpit`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ops cockpit data: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Accept a recommendation and execute its suggested action
 */
export async function acceptRecommendation(recommendation, modifications = null) {
  const response = await fetch(`${API_BASE}/ops-cockpit/recommendations/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation, modifications }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to accept recommendation');
  }
  return response.json();
}

/**
 * Dismiss a recommendation so it no longer appears
 */
export async function dismissRecommendation(recommendation, reason = '') {
  const response = await fetch(`${API_BASE}/ops-cockpit/recommendations/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation, reason }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to dismiss recommendation');
  }
  return response.json();
}

/**
 * Get a deeper AI-generated explanation of a recommendation
 */
export async function explainRecommendation(recommendation) {
  const response = await fetch(`${API_BASE}/ops-cockpit/recommendations/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get explanation');
  }
  return response.json();
}

/**
 * Fetch recommendation action history
 */
export async function getRecommendationHistory() {
  const response = await fetch(`${API_BASE}/ops-cockpit/recommendations/history`);
  if (!response.ok) {
    throw new Error('Failed to fetch recommendation history');
  }
  return response.json();
}

export default {
  getOpsCockpitData,
  acceptRecommendation,
  dismissRecommendation,
  explainRecommendation,
  getRecommendationHistory,
};
